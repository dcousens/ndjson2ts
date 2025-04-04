function maybe (type) {
  if (type.__maybe) return type
  return { __maybe: true, type }
}

function foldl (a, b) {
  if (!a.__sum) throw new TypeError(`Unexpected lvalue type ${JSON.stringify({ a, b })}`)
  if (b.__sum) return b.types.reduce((xa, xb) => foldl(xa, xb), a)
  for (const x of a.types) {
    const xb = sum(x, b)
    if (xb.__sum) continue // not compatible
    return { __sum: true, types: [...a.types.filter(y => y !== x), xb] }
  }
  return { __sum: true, types: [...a.types, b] }
}

export function sum (a, b) {
  if (a.__scalar && b.__scalar) {
    if (a === 'unknown') return { ...b, count: (a?.count ?? 1) + (b?.count ?? 1) }
    if (b === 'unknown') return { ...a, count: (a?.count ?? 1) + (b?.count ?? 1) }
    if (a.type === b.type) {
      return {
        __scalar: true,
        type: a.type,
        count: a.count + b.count
      }
    }
  }

  if (a.type === 'unknown') return b
  if (b.type === 'unknown') return a
  if (a.__sum) return foldl(a, b)
  if (a.__record && b.__record) {
    return {
      __record: true,
      types: {
        key: sum(a.types.key, b.types.key),
        value: sum(a.types.value, b.types.value),
      }
    }
  }

  if (a.__object && b.__object) {
    if (a.discriminant === b.discriminant) {
      const type = { ...a, types: {} }
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
  if (a.__literal && b.__literal) {
    if (a.type === b.type) {
      return {
        ...a,
        count: (a?.count ?? 1) + (b?.count ?? 1)
      }
    }
  }

  return {
    __sum: true,
    types: [a, b]
  }
}

const UNKNOWN = { __scalar: true, type: 'unknown', count: 1 }

export function gettype (json, path = '', literalPaths = [], discriminantPaths = [], recordPaths = []) {
  if (typeof json === 'object') {
    if (json === null) return { __scalar: true, type: null, count: 1 }
    if (Array.isArray(json)) {
      if (json.length === 0) return { __array: true, type: UNKNOWN }
      const type = json.map(x => gettype(x, `${path}.[]`, literalPaths, discriminantPaths, recordPaths)).reduce((ac, x) => sum(ac, x))
      return { __array: true, type }
    }

    if (recordPaths.includes(path)) {
      let keyType = { __scalar: true, type: UNKNOWN }
      let valueType = { __scalar: true, type: UNKNOWN }
      for (const key in json) {
        keyType = gettype(key, `${path}.[key]`, literalPaths, discriminantPaths, recordPaths)
        valueType = gettype(json[key], `${path}[]`, literalPaths, discriminantPaths, recordPaths)
      }
      return {
        __record: true,
        types: {
          key: keyType,
          value: valueType,
        }
      }
    }

    const type = {
      __object: true,
      discriminant: undefined,
      types: {}
    }
    for (const key in json) {
      const ft = gettype(json[key], `${path}.${key}`, literalPaths, discriminantPaths, recordPaths)
      type.types[key] = ft
      if (ft.__literal && discriminantPaths.includes(`${path}.${key}`)) {
        type.discriminant = ft.type
      }
    }
    return type
  }

  if (literalPaths.includes(path)) return { __literal: true, type: json, count: 1 }
  return { __scalar: true, type: typeof json, count: 1 }
}

function comment (type) {
  return `/* used ${type.count} times */`
}

export function print (type, indent = '') {
  if (type.__literal) return `${JSON.stringify(type.type)} ${comment(type)}`
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

  if (type.__record) {
    let output = `{`
    output += `\n${indent + '  '}[key: ${print(type.types.key)}]: ${print(type.types.value, indent + '  ')}`
    return output + `\n${indent}}`
  }

  if (type.__object) {
    let output = `{`
    for (const key in type.types) {
      const fkey = (/[^A-Za-z0-9_]/.test(key) || (/^[0-9]/.test(key) && /[A-Za-z_]/.test(key)) || key === "") ? `"${key}"` : key
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
