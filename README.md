# ndjson2ts
A small Javascript utility to determine a Typescript type from an ndjson stream

### Usage
```bash
$ echo '{"a":2022,"b":"hello","c":{"d":null}}' | ndjson2ts

type T = {
  a: number
  b: string
  c: {
    d: null
  }
}
```

```bash
$ ndjson2ts <<NDJSON
{"a":2022,"b":"hello","c":{"d":null}}
{"a":2023,"b":"world"}
{"a":2024}
NDJSON

type T = {
  a: number
  b?: string
  c?: {
    d: null
  }
}
```

# LICENSE [MIT](LICENSE)
