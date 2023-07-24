import {
  gettype,
  sum,
  print
} from '../lib.mjs'

function eq (a, e, m = '') {
  a = JSON.stringify(a)
  e = JSON.stringify(e)
  if (a !== e) throw new Error(`Expected ${e}, got ${a}`)
}

const fixtures = [
  {
    actual: {
      a: 2022,
      b: 'hello',
      c: {
        d: null
      }
    },
    expected: {
      __object: true,
      a: 'number',
      b: 'string',
      c: {
        __object: true,
        d: null
      }
    }
  },
]

for (const f of fixtures) {
  eq(gettype(f.actual), f.expected)
}
