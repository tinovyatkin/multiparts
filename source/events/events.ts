import { parse as parseContentType } from 'content-type';
import firstBoundaryPosition from 'multipart-related/src/first-boundary-position.js';
import firstHeaderSeparatorPosition from 'multipart-related/src/first-header-separator-position.js';
import startsWithBoundaryEnd from 'multipart-related/src/starts-with-boundary-end.js';
import {
  EmptyResponseError,
  HttpStatusError,
  InvalidContentTypeError,
} from './errors';
import './readablestream-polyfill';

import type { MultipartFetchEventMap, Part } from './types';

export class MultipartFetch extends EventTarget {
  readonly #encoder = new TextEncoder();
  readonly #decoder = new TextDecoder();

  readonly signal: AbortSignal;

  #id: string = '';
  readonly #boundaries: { id: string; boundary: Uint8Array }[] = [];
  #data = new Uint8Array(0);
  #partsType?: string;

  constructor(...args: Parameters<typeof fetch>) {
    super();
    this.signal = args[1]?.signal ?? new AbortController().signal;
    void this.#startFetching(args[0], { ...args[1], signal: this.signal });
  }

  get partsType() {
    if (typeof this.#partsType !== 'string') {
      throw new ReferenceError('Response is not yet started');
    }
    return this.#partsType;
  }

  async #startFetching(...args: Parameters<typeof fetch>) {
    try {
      const response = await fetch(...args);
      if (!response.ok) throw new HttpStatusError(args[0], response);

      this.dispatchEvent(new CustomEvent('response', { detail: response }));

      if (!response.body) throw new EmptyResponseError(args[0]);

      const contentType = response.headers.get('content-type') ?? '';
      const boundary = this.#parseContentType(contentType);
      if (!boundary) throw new InvalidContentTypeError(contentType);

      this.#id = boundary.id;
      this.#boundaries.push(boundary);
      this.#partsType = boundary.partsType;

      for await (const chunk of response.body) {
        if (this.signal.aborted) break;

        // add current chunk to data
        const newData = new Uint8Array(this.#data.length + chunk.length);
        newData.set(this.#data, 0);
        newData.set(chunk, this.#data.length);
        this.#data = newData;

        // parse buffer
        do {
          const result = this.#tryParsePart(this.#data);
          if (!result) break;
          const { leftover, ...part } = result;
          this.#data = leftover;

          this.dispatchEvent(
            new MessageEvent('part', { data: part satisfies Part }),
          );
        } while (this.#data.length > boundary.boundary.length);

        if (!this.#boundaries.length) break;
      }

      this.dispatchEvent(new Event('end'));
    } catch (error) {
      this.signal.abort?.(error);
      this.dispatchEvent(new ErrorEvent('error', { error }));
    }
  }

  public close() {
    this.signal.abort();
  }

  #parseContentType(contentType: string) {
    const { type, parameters } = parseContentType(contentType);
    if (!type.startsWith('multipart/')) return;

    if (!parameters.boundary)
      throw new SyntaxError(
        'Missing boundary parameter in Content-Type header',
      );

    const boundary = this.#encoder.encode(parameters.boundary);

    return {
      id: parameters.boundary,
      boundary,
      partsType: type.slice(10), // remove "multipart/"
    };
  }

  #tryParsePart(
    data: Uint8Array,
  ): (Part & { leftover: Uint8Array }) | undefined {
    if (this.#boundaries.length === 0) return;

    const { id, boundary } = this.#boundaries.at(-1)!;

    // each part starts with the boundary marker
    const startPosition = firstBoundaryPosition(data, boundary);
    if (startPosition === -1) return;

    let contentPosition = startPosition + boundary.length;

    // parse part headers for multipart/related and multipart/mixed
    const headers = new Headers();
    if (['related', 'mixed', 'alternative'].includes(this.partsType)) {
      // find the end of the header, which is the start of the content
      contentPosition = firstHeaderSeparatorPosition(data, startPosition);
      if (contentPosition === -1) return;

      const headerData = data.slice(boundary.length + 4, contentPosition);
      const header = this.#decoder.decode(headerData);
      for (const line of header.split('\r\n')) {
        const [name, value] = line.split(/:\s*/, 2);
        if (!name || !value) break;
        headers.append(name, value);
      }
    }

    // check for content length, otherwise search for next boundary
    const contentEndPosition = headers.has('content-length')
      ? firstBoundaryPosition(
          data,
          boundary,
          Number.parseInt(headers.get('content-length')!) + contentPosition + 6,
        )
      : firstBoundaryPosition(data, boundary, contentPosition + 4);
    if (contentEndPosition === -1) return;

    // part not completely present yet
    if (data.length < contentEndPosition) return;

    // check whether this starts a related part
    if (headers.has('content-type')) {
      const childBoundary = this.#parseContentType(
        headers.get('content-type')!,
      );
      if (childBoundary) {
        this.#boundaries.push(childBoundary);
        return this.#tryParsePart(this.#data.slice(contentPosition + 4));
      }
    }

    // check for boundary end marker
    const isBoundaryEnd = startsWithBoundaryEnd(
      data,
      boundary,
      contentEndPosition,
    );
    const endPosition = isBoundaryEnd
      ? contentEndPosition + boundary.length + 6
      : contentEndPosition;

    if (isBoundaryEnd) this.#boundaries.pop();

    // extract the part data
    const partData = this.#decoder.decode(
      data.slice(contentPosition + 4, contentEndPosition - 2),
    );
    const leftover = data.slice(endPosition);

    return {
      boundary: this.#id === id ? undefined : id,
      headers,
      data: partData,
      leftover,
    };
  }

  override addEventListener<K extends keyof MultipartFetchEventMap>(
    type: K,
    listener: (this: MultipartFetch, ev: MultipartFetchEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener, options);
  }
  override removeEventListener<K extends keyof MultipartFetchEventMap>(
    type: K,
    listener: (this: MultipartFetch, ev: MultipartFetchEventMap[K]) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(type, listener, options);
  }
}
