# Chunked encoding generator

## TL;DR

```typescript
import { chunks } from 'chungen'

const response = await fetch('https://example.com/chunked/')

for await (const chunk of chunks(response))
  console.log(chunk)
```
