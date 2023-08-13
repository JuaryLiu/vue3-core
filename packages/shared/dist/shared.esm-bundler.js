const extend = Object.assign;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
const isArray = Array.isArray;
const isFunction = (val) => typeof val === 'function';
const isString = (val) => typeof val === 'string';
const isSymbol = (val) => typeof val === 'symbol';
const isObject = (val) => val !== null && typeof val === 'object';
// 判断数组的key 是不是一个整数
const isIntegerKey = (key) => parseInt(key) + '' === key;
//判断两个值是否相等
const hasChanged = (value, oldval) => value !== oldval;

export { extend, hasChanged, hasOwn, isArray, isFunction, isIntegerKey, isObject, isString, isSymbol };
//# sourceMappingURL=shared.esm-bundler.js.map
