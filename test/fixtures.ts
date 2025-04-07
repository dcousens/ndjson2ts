export default [
  {
    "actual": [
      true
    ],
    "expected": "boolean"
  },
  {
    "actual": [
      []
    ],
    "expected": "unknown[]"
  },
  {
    "actual": [
      [true]
    ],
    "expected": "boolean[]"
  },
  {
    "actual": [
      [[true]]
    ],
    "expected": "boolean[][]"
  },
  {
    "actual": [
      true,
      1
    ],
    "expected": "boolean | number"
  },
  {
    "actual": [
      [true],
      [1]
    ],
    "expected": "(boolean | number)[]"
  },
  {
    "actual": [
      [true],
      [1],
      [2]
    ],
    "expected": "(boolean | number)[]"
  },
  {
    "actual": [
      { "a": true },
      { "b": 1 }
    ],
    "expected": "{ a?: boolean b?: number }"
  },
  {
    "actual": [
      { "a": { "b": true } },
      []
    ],
    "expected": "unknown[] | { a: { b: boolean } }"
  },
  {
    "actual": [
      { "a": { "b": true } },
      { "c": 1 }
    ],
    "expected": "{ a?: { b: boolean } c?: number }"
  },
  {
    "actual": [
      { "a": { "b": true }, "c": [1] },
      "d"
    ],
    "expected": "string | { a: { b: boolean } c: number[] }"
  },
  {
    "actual": [
      { "a": { "b": true }, "c": [1], "d": [] },
      { "e": "f" }
    ],
    "expected": "{ a?: { b: boolean } c?: number[] d?: unknown[] e?: string }"
  },
  {
    "actual": [
      { "a": { "b": true } },
      { "a": { "b": true } },
      "string"
    ],
    "expected": "string | { a: { b: boolean } }"
  },
  {
    "actual": [
      { "a": { "b": true } },
      "string",
      { "a": { "b": true } }
    ],
    "expected": "string | { a: { b: boolean } }"
  },
  {
    "actual": [
      "string",
      { "a": { "b": true } },
      { "a": { "b": true } }
    ],
    "expected": "string | { a: { b: boolean } }"
  },
]
