//四个方法的注重点 ： 1.是不是可读 2.是不是深代理
// 核心proxy 源码中采用高阶函数的柯里化
import { isObject } from "@vue/shared" 
import {
    reactiveHandlers,
    readonlyHandlers,
    shallowReactiveHandlers,
    shallowReadonlyHandlers
  } from './baseHandlers'
export function reactive(target:Object) {
   return createReactObj(target,false,reactiveHandlers)
}

export function shallowReactive(target:Object) {
    return createReactObj(target,false,shallowReactiveHandlers)
}

export function readonly(target:Object) {
    return createReactObj(target,true,readonlyHandlers)
}

export function shallowReadonly(target:Object) {
    return createReactObj(target,true,shallowReadonlyHandlers)
}

//核心代理的实现
//数据结构，用来收集被代理的数据，避免重复代理
const reactiveMap = new WeakMap() // 类似于map，但是这个key必须是对象，并且会自动的垃圾回收
const readonlyMap = new WeakMap()
function createReactObj(target:any,isReadonly:boolean,baseHandlers:object) {
    if(!isObject(target)) {
        return target
    }
const proxymap = isReadonly?readonlyMap:reactiveMap
const proxyEs = proxymap.get(target) //proxymap中是否存在被代理的target
if(proxyEs) {
    return proxyEs
}

const proxy = new Proxy(target,baseHandlers)
proxymap.set(target,proxy)
  return proxy
}