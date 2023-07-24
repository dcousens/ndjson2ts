const NULL = { __null: true }

function maybe (type) {
  if (type.__maybe) return type
  return { __maybe: true, type }
}

export function sum (a, b) {
  if (a === b) return a // shortcut
  if (a === undefined) return b
  if (b === undefined) return a
  if (a.__sum && b.__sum) return [...a.types, ...b.types].reduce((ac, x) => sum(ac, x))
  if (a.__sum) return [...a.types, b].reduce((ac, x) => sum(ac, x))
  if (b.__sum) return [a, ...b.types].reduce((ac, x) => sum(ac, x))
  if (a.__object && b.__object) {
    const type = { __object: true }
    for (const key in a) {
      if (key in b) {
        type[key] = sum(a[key], b[key])
      } else {
        type[key] = maybe(a[key])
      }
    }
    for (const key in b) {
      if (key in a) continue
      type[key] = maybe(b[key])
    }
    return type
  }

  if (a.__array && b.__array) {
    return {
      __array: true,
      type: sum(a.type, b.type)
    }
  }

  if (a.__maybe && b.__maybe) return maybe(sum(a.type, b.type))
  if (a.__maybe) return maybe(sum(a.type, b))
  if (b.__maybe) return maybe(sum(a, b.type))

  return {
    __sum: true,
    types: [a, b]
  }
}

export function gettype (json) {
  if (typeof json === 'object') {
    if (json === null) return NULL
    if (Array.isArray(json)) {
      const type = json.map(x => gettype(x)).reduce((ac, x) => sum(ac, x))
      return { __array: true, type }
    }

    const type = { __object: true }
    for (const key in json) {
      type[key] = gettype(json[key])
    }

    return type
  }

  return typeof json
}

export function print (type, indent = '') {
  if (typeof type !== 'object') return type
  if (type.__null) return 'null'
  if (type.__array) return `${print(type.type, indent)}[]`
  if (type.__sum) return type.types.map(x => print(x, indent)).join(' | ')
  if (type.__object) {
    let output = `{`
    for (const key in type) {
      if (key === '__object') continue

      const fkey = /[^A-Za-z0-9_]/.test(key) ? `"${key}"` : key
      const ftype = type[key]

      if (ftype.__maybe) {
        output += `\n${indent + '  '}${fkey}?: ${print(ftype.type, indent + '  ')}`
      } else {
        output += `\n${indent + '  '}${fkey}: ${print(ftype, indent + '  ')}`
      }
    }

    return output + `\n${indent}}`
  }

  throw new TypeError(`Unexpected type ${type}`)
}
