import { isObject, isArray, isIntegerKey, hasOwn, hasChanged } from "@vue/shared"
import { reactive, readonly } from "./reactivety"
import { TrackOpTypes, TriggerOpTypes } from './operations'
import { Track, trigger } from './effect'
/**
 * 
 * @param isReadonly 是否只读
 * @param shallow  是否是浅代理
 * @returns  get函数 有三个参数分别是target：目标对象，key：目标对象的属性 receiver：目标对象的实例
 */
function createGetter(isReadonly = false, shallow = false) {
    return function get(target: object, key: string | symbol, receiver: object) {
        const res = Reflect.get(target, key, receiver) // target[k]
        if (!isReadonly) {
            // 收集依赖
            Track(target, TrackOpTypes.GET, key)
        }
        if (shallow) {
            return res
        }
        if (isObject(res)) { // key是一个对象的时候
            return isReadonly ? readonly(res) : reactive(res) // 递归
        }
        return res
    }
}
const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true, false)
const shallowReadonlyGet = createGetter(true, true)

function createSetter(shallow = false) {
    return function (target: any, key: string | symbol, value: unknown, receiver: object) {
        const oldvalue = target[key]
        const result = Reflect.set(target, key, value, receiver)
        let haskey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key)
        if (!haskey) { // 数组新增
            trigger(target, TriggerOpTypes.ADD, key, value)
        } else if (hasChanged(value, oldvalue)) { // 数组修改,当新值与原来的值一样的时候
            trigger(target, TriggerOpTypes.SET, key, value, oldvalue)
        }
        return result
    }
}
const set = createSetter()
const shallowSet = createSetter(true)
export const reactiveHandlers = {
    get,
    set
}

export const readonlyHandlers = {
    get: readonlyGet,
    set: () => {
        console.log('只读！！！无法修改值');
    }
}

export const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet
}

export const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set: () => {
        console.log('只读！！！无法修改值改值');
    }
}