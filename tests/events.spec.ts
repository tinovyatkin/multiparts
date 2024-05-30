import { expect, test } from '@playwright/test';

import { MultipartFetch } from '../source/events/events';

test.describe('MultipartFetch', () => {
  test('should parse toa-specific multipart/text format without headers in parts', async ({
    page,
  }) => {
    await page.goto('/', {
      waitUntil: 'domcontentloaded',
    });

    expect(
      await page.evaluate(() => {
        return new Promise((resolve, reject) => {
          const source = new MultipartFetch('/multipart-toa');
          let result = '';
          source.addEventListener('end', () => resolve(result));
          source.addEventListener('error', (event) => reject(event.error));
          source.addEventListener('part', (part) => {
            result += part.data.data + '#';
          });
        });
      }),
    ).toBe('Brand#❤️#World#');
  });

  test('should parse multipart/related', async ({ page }) => {
    await page.goto('/', {
      waitUntil: 'domcontentloaded',
    });

    expect(
      await page.evaluate(() => {
        return new Promise((resolve, reject) => {
          const source = new MultipartFetch('/multipart-related');
          let result = '';
          source.addEventListener('end', () => resolve(result));
          source.addEventListener('error', (event) => reject(event.error));
          source.addEventListener('part', (part) => {
            result += part.data.headers.get('Content-Type') + '|';
          });
        });
      }),
    ).toBe('application/json|text/plain|text/plain|text/plain|');
  });

  test('should parse multipart/mixed', async ({ page }) => {
    await page.goto('/', {
      waitUntil: 'domcontentloaded',
    });

    expect(
      await page.evaluate(() => {
        return new Promise((resolve, reject) => {
          const source = new MultipartFetch('/multipart-mixed');
          let result = '';
          source.addEventListener('end', () => resolve(result));
          source.addEventListener('error', (event) => reject(event.error));
          source.addEventListener('part', (part) => {
            result += part.data.data + '|';
          });
        });
      }),
    ).toBe(
      [
        'This is implicitly typed plain ASCII text.',
        'It does NOT end with a linebreak.|This is explicitly typed plain ASCII text.',
        'It DOES end with a linebreak.',
        '|',
      ].join('\r\n'),
    );
  });
});
