// @ts-check
import * as esbuild from 'esbuild';
import { randomBytes, randomInt } from 'node:crypto';
import { once } from 'node:events';
import { createReadStream } from 'node:fs';
import * as http from 'node:http';
import { Readable, Transform } from 'node:stream';
import { fileURLToPath } from 'node:url';

const html = String.raw;

const BOUNDARY_MARKER = randomBytes(10).toString('hex');

const build = await esbuild.build({
  bundle: true,
  entryPoints: ['./source/events/events.ts'],
  write: false,
  sourcemap: false,
  target: 'chrome100',
  platform: 'browser',
  legalComments: 'none',
  format: 'iife',
});
// Extract the code from the IIFE build output
const code = build.outputFiles[0].text
  .trim()
  .split('\n')
  .slice(2, -1)
  .join('\n');

const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  switch (req.url) {
    case '/':
      res.setHeader('content-type', 'text/html');
      res.end(html`
        <!doctype html>
        <html>
          <head>
            <script>
              ${code};
            </script>
          </head>
          <body>
            <h1>Hello!</h1>
          </body>
        </html>
      `);
      break;

    case '/multipart-toa':
      res.setHeader(
        'content-type',
        `multipart/text; boundary=${BOUNDARY_MARKER}`,
      );
      Readable.from(['Brand', '❤️', 'World'])
        .pipe(
          new Transform({
            transform(chunk, _encoding, cb) {
              this.push('\r\n');
              this.push(`--${BOUNDARY_MARKER}`);
              this.push('\r\n');
              this.push(chunk);
              setTimeout(cb, randomInt(0, 500));
            },
            final(cb) {
              this.push('\r\n');
              this.push(`--${BOUNDARY_MARKER}--`);
              this.push('\r\n');
              setTimeout(cb, randomInt(0, 500));
            },
          }),
        )
        .pipe(res);
      break;

    case '/multipart-related':
      res.setHeader(
        'content-type',
        `multipart/related; boundary=865f3b787e6623728e6aa49fec037303`,
      );
      const relatedFixture = fileURLToPath(
        import.meta.resolve('multipart-related/test/fixtures/doc.multipart'),
      );
      createReadStream(relatedFixture).pipe(res);
      break;

    case '/multipart-mixed':
      res.setHeader(
        'content-type',
        `multipart/mixed; boundary="simple boundary"`,
      );
      // from https://www.w3.org/Protocols/rfc1341/7_2_Multipart.html
      const mixedFixture = [
        'This is the preamble.  It is to be ignored, though it',
        'is a handy place for mail composers to include an',
        'explanatory note to non-MIME compliant readers.',
        '--simple boundary',
        '',
        'This is implicitly typed plain ASCII text.',
        'It does NOT end with a linebreak.',
        '--simple boundary',
        'Content-type: text/plain; charset=us-ascii',
        '',
        'This is explicitly typed plain ASCII text.',
        'It DOES end with a linebreak.',
        '',
        '--simple boundary--',
        'This is the epilogue.  It is also to be ignored.',
      ].join('\r\n');
      res.end(mixedFixture);
      break;

    default:
      res.statusCode = 404;
      res.statusMessage = 'Not found';
      res.end();
  }
});

httpServer.listen(8080, '127.0.0.1');
await once(httpServer, 'listening');
console.info('Server is listening...');
