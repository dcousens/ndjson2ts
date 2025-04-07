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

  const discriminantPaths = []
  const literalPaths = []
  const recordPaths = []

  const args = process.argv.slice(2)
  while (args.length) {
    const a = args.shift()
    if (a === '--discriminant') discriminantPaths.push(args.shift() ?? '')
    if (a === '--literal') literalPaths.push(args.shift() ?? '')
    if (a === '--record') recordPaths.push(args.shift() ?? '')
  }

  // any discriminants are literals too
  literalPaths.push(...discriminantPaths)

  for await (const line of rl) {
    if (!line) continue // ignore empty lines
    const json = JSON.parse(line)
    const rtype = gettype(json, '', literalPaths, discriminantPaths, recordPaths)

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
