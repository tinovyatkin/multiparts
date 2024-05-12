export function * chunks (response: Response) {
  const te = response.headers.get('transfer-encoding')

  if (te === null || te !== 'chunked')
    throw new Error('Response is not chunked')

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
}
