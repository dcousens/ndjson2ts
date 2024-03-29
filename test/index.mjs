import {
  gettype,
  sum,
  print
} from '../lib.mjs'

import fixtures from './fixtures.json' assert { type: "json" }

function trim (s) {
  return s.replace(/\n/g, ' ').replace(/\s+/g, ' ')
}

function eq (a, e) {
  a = trim(a)
  if (a !== e) throw new Error(`Expected ${e}, got ${a}`)
}

for (const f of fixtures) {
  console.error(JSON.stringify(f.actual), `equals '${f.expected}'`)

  let t = undefined
  for (const ft of f.actual) {
    t = sum(t, gettype(ft))
  }
  eq(print(t), f.expected)

  // switched
  t = undefined
  for (const ft of f.actual) {
    t = sum(gettype(ft), t)
  }
  eq(print(t), f.expected)
}
