export type Type = {
  sum?: Type[]
  object?: Record<string, Type>
  maybe?: Record<string, true>
  never?: true
  array?: Type
  record?: {
    key: Type
    value: Type
  }
  scalar?: string
  literal?: { value: unknown }
  discriminant?: Type['literal']
  count: number
}

function foldleft (a, b) {
  if (!a.sum) throw new TypeError(`Unexpected lvalue type ${JSON.stringify({ a, b })}`)
  if (b.sum) return b.sum.reduce((xa, xb) => foldleft(xa, xb), a)
  for (const x of a.sum) {
    const xb = fold(x, b)
    if (xb.sum) continue // not compatible
    return { sum: [...a.sum.filter(y => y !== x), xb], count: 1 }
  }
  return { sum: [...a.sum, b], count: 1 }
}

export function fold (a: Type, b: Type): Type {
  if (a.never) return b
  if (b.never) return a
  if (a.scalar === 'unknown') return { ...b, count: a.count + b.count }
  if (b.scalar === 'unknown') return { ...a, count: a.count + b.count }
  if (a.scalar && b.scalar && a.scalar === b.scalar) {
    return {
      scalar: a.scalar,
      count: a.count + b.count
    }
  }

  if (a.sum) return foldleft(a, b)
  if (a.record && b.record) {
    return {
      record: {
        key: fold(a.record.key, b.record.key),
        value: fold(a.record.value, b.record.value),
      },
      count: a.count + b.count
    }
  }

  if (a.object && b.object) {
    if (a.discriminant?.value === b.discriminant?.value) {
      const type = {
        object: {} as Record<string, Type>,
        maybe: { ...a.maybe, ...b.maybe } as Record<string, true>,
        discriminant: a.discriminant,
        count: a.count + b.count
      } satisfies Type

      for (const key in a.object) {
        if (key in b.object) {
          type.object[key] = fold(a.object[key], b.object[key])
        } else {
          type.object[key] = a.object[key]
          type.maybe[key] = true
        }
      }
      for (const key in b.object) {
        if (key in a.object) {
          // do nothing
        } else {
          type.object[key] = b.object[key]
          type.maybe[key] = true
        }
      }
      return type
    }
  }

  if (a.array && b.array) {
    return {
      array: fold(a.array, b.array),
      count: a.count + b.count
    }
  }

  if (a.literal && b.literal && a.literal.value === b.literal.value) {
    return {
      ...a,
      count: a.count + b.count
    }
  }

  return {
    sum: [a, b],
    count: 1
  }
}

const UNKNOWN = { scalar: 'unknown', count: 1 }

export function gettype (
  json: unknown,
  path = '',
  literalPaths: string[] = [],
  discriminantPaths: string[] = [],
  recordPaths: string[] = []
): Type {
  if (typeof json === 'object') {
    if (json === null) return { literal: { value: null }, count: 1 }
    if (Array.isArray(json)) {
      if (json.length === 0) return { array: { ...UNKNOWN }, count: 1 }
      const type = json.map(x => gettype(x, `${path}.[]`, literalPaths, discriminantPaths, recordPaths)).reduce((ac, x) => fold(ac, x))
      return { array: type, count: 1 }
    }

    if (recordPaths.includes(path)) {
      let keyType = { ...UNKNOWN } satisfies Type
      let valueType = { ...UNKNOWN } satisfies Type
      for (const key in json) {
        keyType = fold(keyType, gettype(key, `${path}.[key]`, literalPaths, discriminantPaths, recordPaths))
        valueType = fold(valueType, gettype(json[key], `${path}[]`, literalPaths, discriminantPaths, recordPaths))
      }
      return {
        record: {
          key: keyType,
          value: valueType,
        },
        count: 1
      }
    }

    const object = {} as Record<string, Type>
    let discriminant
    for (const key in json) {
      const ft = gettype(json[key], `${path}.${key}`, literalPaths, discriminantPaths, recordPaths)

      object[key] = ft
      if (ft.literal && discriminantPaths.includes(`${path}.${key}`)) {
        discriminant = ft.literal
      }
    }
    return {
      object,
      maybe: {},
      ...(discriminant ? { discriminant } : {}),
      count: 1
    }
  }

  if (literalPaths.includes(path)) return { literal: { value: json }, count: 1 }
  return { scalar: typeof json, count: 1 } satisfies Type
}

function comment (type: Type) {
  return `/* used ${type.count} times */`
}

export function print (type: Type, indent = ''): string {
  if (type.literal) return `${JSON.stringify(type.literal.value)} ${comment(type)}`
  if (type.scalar) return `${type.scalar} ${comment(type)}`
  if (type.array) {
    if (type.array.sum) return `(${print(type.array, indent)})[]`
    return `${print(type.array, indent)}[]`
  }

  if (type.sum) {
    return type.sum
      .map(x => print(x, indent))
      .sort()
      .join(' | ')
  }

  if (type.record) {
    let output = `{`
    output += `\n${indent + '  '}[key: ${print(type.record.key)}]: ${print(type.record.value, indent + '  ')}`
    return output + `\n${indent}}`
  }

  if (type.object) {
    let output = `{`
    for (const key of Object.keys(type.object).sort()) {
      const fkey = (/[^A-Za-z0-9_]/.test(key) || (/^[0-9]/.test(key) && /[A-Za-z_]/.test(key)) || key === "") ? `"${key}"` : key
      const ftype = type.object[key]
      output += `\n${indent + '  '}${fkey}${(key in (type.maybe ?? {})) ? '?' : ''}: ${print(ftype, indent + '  ')}`
    }
    return output + `\n${indent}}`
  }

  throw new TypeError(`Unexpected type ${JSON.stringify(type)}`)
}
