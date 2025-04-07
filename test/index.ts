import {
  gettype,
  fold,
  print
} from '../lib.ts'

import fixtures from './fixtures.ts'

function trim (s: string) {
  return s.replace(/\n/g, ' ').replace(/\s+/g, ' ')
}

function eq (a: string, e: string) {
  console.error({ a, e })
  a = trim(a)
  if (a !== e) throw new Error(`Expected ${e}, got ${a}`)
}

for (const f of fixtures) {
  console.error(JSON.stringify(f.actual), `equals '${f.expected}'`)

  let t = { never: true }
  for (const ft of f.actual) {
    t = fold(t, gettype(ft))
  }
  eq(print(t), f.expected)

  // switched
  t = { never: true }
  for (const ft of f.actual) {
    t = fold(gettype(ft), t)
  }
  eq(print(t), f.expected)
}
