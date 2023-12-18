function maybe (type) {
  if (type.__maybe) return type
  return { __maybe: true, type }
}

function flatten (types, x) {
  return {
    __sum: true,
    types: types.map((t) => {
      const tx = sum(t, x)
      return tx.__sum ? t : tx
    })
  }
}

export function sum (a, b) {
  if (a.__scalar && b.__scalar) {
    if (a.type === b.type) {
      return {
        __scalar: true,
        type: a.type,
        count: a.count + b.count
      }
    }

    if (a.type === 'unknown') return { ...b, count: a.count + b.count }
    if (b.type === 'unknown') return { ...a, count: a.count + b.count }
  }

  if (a.__sum) return flatten(a.types, b)
  if (b.__sum) return flatten(b.types, a)
  if (a.__object && b.__object) {
    const type = { __object: true, types: {} }
    const keys = [...Object.keys(a.types), ...Object.keys(b.types)].sort()
    for (const key of keys) {
      if (key in a.types) {
        if (key in b.types) {
          type.types[key] = sum(a.types[key], b.types[key])
        } else {
          type.types[key] = maybe(a.types[key])
        }
      } else {
        type.types[key] = maybe(b.types[key])
      }
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

const UNKNOWN = { __scalar: true, type: 'unknown', count: 1 }

export function gettype (json) {
  if (typeof json === 'object') {
    if (json === null) return { __scalar: true, type: null, count: 1 }
    if (Array.isArray(json)) {
      if (json.length === 0) return { __array: true, type: UNKNOWN }
      const type = json.map(x => gettype(x)).reduce((ac, x) => sum(ac, x))
      return { __array: true, type }
    }

    const type = { __object: true, types: {} }
    for (const key in json) {
      type.types[key] = gettype(json[key])
    }
    return type
  }

  return { __scalar: true, type: typeof json, count: 1 }
}

function comment (type) {
  return `/* used ${type.count} times */`
}

export function print (type, indent = '') {
  if (type.__scalar) return `${type.type} ${comment(type)}`
  if (type.__array) {
    if (type.empty) return `unknown[]`
    if (type.type.__sum) return `(${print(type.type, indent)})[]`
    return `${print(type.type, indent)}[]`
  }

  if (type.__sum) {
    return type.types
      .map(x => print(x, indent))
      .sort()
      .join(' | ')
  }

  if (type.__object) {
    let output = `{`
    for (const key in type.types) {
      const fkey = /[^A-Za-z0-9_]/.test(key) ? `"${key}"` : key
      const ftype = type.types[key]

      if (ftype?.__maybe) {
        output += `\n${indent + '  '}${fkey}?: ${print(ftype.type, indent + '  ')}`
      } else {
        output += `\n${indent + '  '}${fkey}: ${print(ftype, indent + '  ')}`
      }
    }
    return output + `\n${indent}}`
  }

  throw new TypeError(`Unexpected type ${JSON.stringify(type)}`)
}
