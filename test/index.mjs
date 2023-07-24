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
  console.error(f)
  if ('left' in f) {
    eq(print(sum(gettype(f.left), gettype(f.right))), f.expected)
  }

  if ('actual' in f) {
    eq(print(gettype(f.actual)), f.expected)
  }
}
