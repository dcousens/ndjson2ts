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
    "expected": "never[]"
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
    "expected": "never[] | { a: { b: boolean } }"
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
    "expected": "{ a?: { b: boolean } c?: number[] d?: never[] e?: string }"
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
  {
    "actual": [
      { "a": { "b": true } },
      { "a": { "b": 0 } },
      { "a": { "b": { "c": true } } },
      { "a": { "b": { "c": 0 } } },
      { "a": true },
      { "a": 0 },
    ],
    "expected": "{ a: boolean | number | { b: boolean | number | { c: boolean | number } } }"
  },
]
