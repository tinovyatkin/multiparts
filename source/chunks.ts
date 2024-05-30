import { parse } from 'content-type'
import * as assert from 'assert'

export async function * chunks (response: Response): AsyncGenerator<string> {
  const header = response.headers.get('content-type')

  assert.ok(header !== null, 'Content-Type header is missing')

  const { type, parameters } = parse(header)

  assert.ok(type.startsWith('multipart/'), 'Content-Type is not multipart')
  assert.ok(parameters.boundary !== undefined, 'Boundary parameter is missing')

  const marker = `\r\n--${parameters.boundary}`
  const cut = `${marker}\r\n`
  const end = `${marker}--\r\n`

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  let started = false
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
      if (started) yield parts[i] // stream starts with boundary
      else started = true

    buffer = parts[parts.length - 1]

    if (buffer.endsWith(end))
      yield buffer.slice(0, -end.length)
  }
}
