import * as http from 'node:http'
import type { AddressInfo } from 'node:net'
import { Readable } from 'node:stream'
import { setTimeout } from 'node:timers/promises'
import { chunks } from './chunks'

let httpServer: http.Server
let response: Response

beforeAll(async () => {
  httpServer = http.createServer((req, res) => {
    const stream = Readable.from(gen())

    res.setHeader('content-type', 'multipart/mixed; boundary=boundary')

    stream.pipe(res)
  })

  httpServer.listen(0)

  const port = (httpServer.address() as AddressInfo).port

  response = await fetch('http://localhost:' + port)
})

afterAll(() => {
  httpServer.close()
})

it('should be ok', async () => {
  expect(response.status).toBe(200)
})

it('should return multipart content-type', () => {
  const type = response.headers.get('content-type')

  expect(type?.startsWith('multipart/mixed')).toBe(true)
})

it('should return generator', async () => {
  const words = []

  for await (const chunk of chunks(response))
    words.push(chunk)

  expect(words).toEqual(['Hello', 'world', '!'])
})

async function* gen (){
  yield boundary
  yield 'Hello' + boundary
  yield 'world' + boundary

  await setTimeout(100)

  yield '!' + `\r\n--boundary--\r\n`
}

const boundary = '\r\n--boundary\r\n'
