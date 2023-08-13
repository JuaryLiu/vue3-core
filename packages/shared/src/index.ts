export const extend = Object.assign

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
    val: object,
    key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key)

export const isArray = Array.isArray

export const isFunction = (val: unknown): val is Function =>
    typeof val === 'function'

export const isString = (val: unknown): val is string => typeof val === 'string'
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object'

// 判断数组的key 是不是一个整数
export const isIntegerKey = (key:any) => parseInt(key) +'' === key


//判断两个值是否相等
export const hasChanged  = (value:any,oldval:any):boolean => value !==oldval
export * from './shapeFlag'