import readline from 'node:readline/promises'
import { stdin } from 'node:process'
import {
  gettype,
  sum,
  print
} from './lib.mjs'

async function main () {
  const rl = readline.createInterface({ input: stdin })
  let ltype = { __never: true }

  for await (const line of rl) {
    if (!line) continue // ignore empty lines
    const json = JSON.parse(line)
    const rtype = gettype(json)

    if (ltype.__never) {
      ltype = rtype
    } else {
      ltype = sum(ltype, rtype)
    }
  }

  if (ltype.__never) return process.exit(1)
  console.log(print(ltype))
}

main()
