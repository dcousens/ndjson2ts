import readline from 'node:readline/promises'
import { stdin } from 'node:process'
import {
  gettype,
  sum,
  print
} from './lib.mjs'

async function main () {
  const rl = readline.createInterface({ input: stdin })
  let ltype = undefined

  for await (const line of rl) {
    const json = JSON.parse(line)
    const rtype = gettype(json)

    ltype = sum(ltype, rtype)
  }

  console.log(`type T = ${print(ltype)}`)
}

main()
