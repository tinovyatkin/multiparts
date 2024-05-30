# Multipart responses handling library

## TL;DR

```typescript
import { MultipartFetch } from 'http-multiparts';

const source = new MultipartFetch('/multipart-toa');
source.addEventListener('part', (part) => {
  // part.data is Part type - see source/event/types.ts
  console.log(part.date.headers.get('Content-Type'));
  console.log(part.data.data);
});
source.addEventListener(
  'end',
  () => {
    /* done */
  },
  { once: true },
);
source.addEventListener(
  'error',
  (ev) => {
    document.getElementById('error').textContent = ev.message;
  },
  { once: true },
);
```
