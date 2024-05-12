# Chunked encoding generator

## TL;DR

```typescript
import { chungen } from 'chungen'

const response = await fetch('https://example.com/chunked/')

for await (const chunk of chungen(response))
  console.log(chunk)
```
