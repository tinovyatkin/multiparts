export class HttpStatusError extends Error {
  override readonly name = 'HttpStatusError';

  constructor(
    public readonly input: RequestInfo | URL,
    public response: Response,
  ) {
    super(
      `An HTTP error occurred while fetching. Status code ${response.status}: ${response.statusText}`,
    );
  }
}

export class EmptyResponseError extends Error {
  override readonly name = 'EmptyResponseError';

  constructor(public readonly input: RequestInfo | URL) {
    super('The response body is empty');
  }
}

export class InvalidContentTypeError extends Error {
  override readonly name = 'InvalidContentTypeError';

  constructor(public readonly contentType: string) {
    super(`Invalid content type: ${contentType}`);
  }
}
