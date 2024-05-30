/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Part {
  boundary?: string;
  headers: Headers;
  data: string;
}

export interface MultipartFetchEventMap {
  response: CustomEvent<Response>;
  part: MessageEvent<Part>;
  error: ErrorEvent;
  end: Event;
}

/**
 * Fixing missing Typescript types for `ReadableStream` and `AbortSignal`
 */
declare global {
  interface ReadableStream<R = any> {
    /**
     * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream#async_iteration)
     * @see {@link https://github.com/microsoft/TypeScript/issues/29867}
     */
    [Symbol.asyncIterator](): AsyncIterableIterator<R>;
  }
  interface AbortSignal extends EventTarget {
    /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/abort_static) */
    abort(reason?: any): this;
  }
}
