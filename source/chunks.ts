import { parse } from 'content-type'
import * as assert from 'assert'

export async function * chunks (response: Response): AsyncGenerator<string> {
  const header = response.headers.get('content-type')

  assert.ok(header !== null, 'Content-Type header is missing')

  const { type, parameters } = parse(header)
  const boundary = parameters.boundary
  const marker = `\r\n--${boundary}`
  const cut = `${marker}\r\n`
  const end = `${marker}--\r\n`

  assert.ok(type.startsWith('multipart/'), 'Content-Type is not multipart')
  assert.ok(boundary !== undefined, 'Boundary parameter is missing')

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done)
      break

    buffer += decoder.decode(value, { stream: true })

    if (!buffer.includes(marker))
      continue

    const parts = buffer.split(cut)

    for (let i = 0; i < parts.length - 1; i++)
      yield parts[i]

    buffer = parts[parts.length - 1]

    if (buffer.endsWith(end))
      yield buffer.slice(0, -end.length)
  }
}
