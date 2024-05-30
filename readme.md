# Multipart response text chunks

## As a Generator

```typescript
import { chunks } from 'http-multiparts'

const response = await fetch('https://example.com/multipart/')

for await (const chunk of chunks(response))
  console.log(chunk)
```
