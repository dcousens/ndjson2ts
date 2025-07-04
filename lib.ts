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

function foldleft (xs: Type[]) {
  do {
    if (xs.length === 1) return xs[0]
    let loop = false

    for (const a of xs) {
      for (const b of xs) {
        if (a === b) continue
        const ab = fold(a, b)
        if (ab.sum) continue // couldnt fold
        xs = [ab, ...xs.filter(x => x !== a && x !== b)]
        loop = true
        break
      }
      if (loop) break
    }

    if (loop) continue
    break
  } while (true) // irrelevant

  return {
    sum: xs,
    count: 1
  }
}

function foldobject (
  a: Exclude<Type["object"], undefined>,
  b: Exclude<Type["object"], undefined>,
  maybe: Record<string, true>,
) {
  const object = {}

  for (const key in a) {
    if (key in b) {
      object[key] = fold(a[key], b[key])
    } else {
      object[key] = a[key]
      maybe[key] = true
    }
  }

  for (const key in b) {
    if (key in a) {
      // do nothing
    } else {
      object[key] = b[key]
      maybe[key] = true
    }
  }

  return { object, maybe }
}

export function fold (a: Type, b: Type): Type {
  if (a.never) return { ...b, count: a.count + b.count }
  if (b.never) return { ...a, count: a.count + b.count }
  if (a.scalar && b.scalar && a.scalar === b.scalar) {
    return {
      scalar: a.scalar,
      count: a.count + b.count
    }
  }

  if (a.sum && b.sum) return foldleft([...a.sum, ...b.sum])
  if (a.sum) return foldleft([b, ...a.sum])
  if (b.sum) return foldleft([a, ...b.sum])
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
    if (a.discriminant && b.discriminant && a.discriminant.value === b.discriminant.value) {
      return {
        ...foldobject(a.object, b.object, { ...a.maybe, ...b.maybe }),
        discriminant: a.discriminant,
        count: a.count + b.count
      }
    }

    if (!a.discriminant && !b.discriminant) {
      return {
        ...foldobject(a.object, b.object, { ...a.maybe, ...b.maybe }),
        discriminant: undefined,
        count: a.count + b.count
      }
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

const NEVER = { never: true, count: 1 } as const

export function gettype (
  json: unknown,
  path = '',
  literalPaths: string[] = [],
  discriminantPaths: string[] = [],
  recordPaths: string[] = [],
  omitPaths: string[] = [],
) {
  if (typeof json === 'object') {
    if (json === null) return { literal: { value: null }, count: 1 }
    if (Array.isArray(json)) {
      if (json.length === 0) return { array: { ...NEVER }, count: 1 }
      return {
        array: foldleft(
          json.map(x => gettype(x, `${path}[]`, literalPaths, discriminantPaths, recordPaths, omitPaths))
        ),
        count: 1
      }
    }

    if (recordPaths.includes(path)) {
      let keyType: Type = { ...NEVER }
      let valueType: Type = { ...NEVER }
      for (const key in json) {
        const innerPath = `${path}.${key}`
        if (omitPaths.includes(innerPath)) continue

        keyType = fold(keyType, gettype(key, `${path}|keys`, literalPaths, discriminantPaths, recordPaths, omitPaths))
        valueType = fold(valueType, gettype(json[key], `${path}[]`, literalPaths, discriminantPaths, recordPaths, omitPaths))
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
    let discriminant: Type['literal'] | undefined
    for (const key in json) {
      const innerPath = `${path}.${key}`
      if (omitPaths.includes(innerPath)) continue

      const ft = gettype(json[key], innerPath, literalPaths, discriminantPaths, recordPaths, omitPaths)
      if (ft.literal && discriminantPaths.includes(innerPath)) {
        discriminant = ft.literal
      }

      object[key] = ft
    }

    return {
      object,
      maybe: {},
      discriminant,
      count: 1
    }
  }

  if (literalPaths.includes(path)) return { literal: { value: json }, count: 1 }
  return { scalar: typeof json, count: 1 }
}

function comment (type: Type, count = false) {
  if (count) return ` /* used ${type.count} times */`
  return ``
}

export function print (type: Type, indent = '', count = false): string {
  if (type.never) return `never${comment(type, count)}`
  if (type.literal) return `${JSON.stringify(type.literal.value)}${comment(type, count)}`
  if (type.scalar) return `${type.scalar}${comment(type, count)}`
  if (type.array) {
    if (type.array.never) return `[]${comment(type, count)}`
    if (type.array.sum) return `(${print(type.array, indent, count)})[]`
    return `${print(type.array, indent, count)}[]`
  }

  if (type.sum) {
    return type.sum
      .map(x => print(x, indent, count))
      .sort()
      .join(' | ')
  }

  if (type.record) {
    let output = `{`
    output += `\n${indent + '  '}[key: ${print(type.record.key, '', count)}]: ${print(type.record.value, indent + '  ', count)}`
    return output + `\n${indent}}`
  }

  if (type.object) {
    let output = `{`
    for (const key of Object.keys(type.object).sort()) {
      const fkey = (/[^A-Za-z0-9_]/.test(key) || (/^[0-9]/.test(key) && /[A-Za-z_]/.test(key)) || key === "") ? `"${key}"` : key
      const ftype = type.object[key]
      output += `\n${indent + '  '}${fkey}${(key in (type.maybe ?? {})) ? '?' : ''}: ${print(ftype, indent + '  ', count)}`
    }
    return output + `\n${indent}}`
  }

  throw new TypeError(`Unexpected type ${JSON.stringify(type)}`)
}
