import readline from 'node:readline/promises'
import { stdin } from 'node:process'
import {
  type Type,
  gettype,
  fold,
  print
} from './lib.ts'

async function main () {
  const rl = readline.createInterface({ input: stdin })

  const discriminantPaths: string[] = []
  const literalPaths: string[] = []
  const recordPaths: string[] = []
  const omitPaths: string[] = []
  let count = false

  const args = process.argv.slice(2)
  while (args.length) {
    const a = args.shift()
    if (a === '--discriminant') discriminantPaths.push(args.shift() ?? '')
    if (a === '--literal') literalPaths.push(args.shift() ?? '')
    if (a === '--omit') omitPaths.push(args.shift() ?? '')
    if (a === '--record') recordPaths.push(args.shift() ?? '')
    if (a === '--count') count = true
  }

  // any discriminants are literals too
  literalPaths.push(...discriminantPaths)

  let ltype: Type = { never: true, count: 1 }
  for await (const line of rl) {
    if (!line) continue // ignore empty lines
    const json = JSON.parse(line)
    const rtype = gettype(json, '', literalPaths, discriminantPaths, recordPaths, omitPaths)
    ltype = fold(ltype, rtype)
  }

  if (ltype.never) return process.exit(1)
  console.log(print(ltype, '', count))
}

main()
