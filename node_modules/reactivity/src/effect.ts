// effect 收集依赖

import { isArray, isIntegerKey } from "@vue/shared"
import { TriggerOpTypes } from "./operations"

export function effect(fn: Function, options: any = {}) {
    const effect = createReactEffect(fn, options)
    if (!options.lazy) {
        effect()
    }

    return effect
}
let uid = 0
let activeEffect: any  //保存当前的effect

const effectStack: any = []  //定义一个栈结构 来解决effect的树结构
function createReactEffect(fn: Function, options: any) {
    const effect = function reactiveEffect() {
        // 防止多个effect嵌套
        if (!effectStack.includes(effect)) { // 确保effect 没有入栈
            try {
                // 入栈
                effectStack.push(effect)
                activeEffect = effect
                 return fn()
            } finally {
                // 出栈
                effectStack.pop()
                activeEffect = effectStack[effectStack.length - 1]
            }
        }

    }
    effect.id = uid++  // 区别effect作用者
    effect._isEffect = true // 区分effect 是不是响应式的
    effect.raw = fn  //保存用户的方法
    effect.options = options  //保存用户的配置项
    return effect
}

// 收集effect 触发get的时候 收集effect
let targetMap = new WeakMap() // 创建结构表
export function Track(target: object, type: any, key: string | symbol) {
    // 对应的key 
    // key 和 effect 一一对应  map => key =>target对象 value => [effect] set
    if(activeEffect === undefined) { //没有effect中使用
        return
    }
     // 获取effect
     let depMap = targetMap.get(target)
    if(!depMap) {
        targetMap.set(target,(depMap = new Map))
    }
    let dep = depMap.get(key)
    if(!dep) { //没有属性
        depMap.set(key,(dep = new Set))
    }
    if(!dep.has(activeEffect)) {
        dep.add(activeEffect)
    }
    // console.log(targetMap);
}

export function trigger(target:object,type:any,key?:any,newValue?:any,oldValue?:any) {
    // console.log(target,key,type,newValue,oldValue);
    const depsMap = targetMap.get(target) //Map
    // 收集依赖结构表中没有这个对象
    if(!depsMap) return
    //有
    let effectSet = new Set() // 避免重复，减少执行次数
    const add = (effectAdd:any) => {
        if(effectAdd) {
            effectAdd.forEach((effect:any)=> effectSet.add(effect))
        }
    }

    // 处理数组 当key为lenght的时候   就是修改数组的length
    if(key === 'length' && isArray(target)) {
        depsMap.forEach((dep:any,key:any) => {
            if(key === 'length' || key >= (newValue as number)) {
                add(dep)
            }
        })
    } else {
        // 可能是对象
        if(key != undefined) {
            add(depsMap.get(key))
        }
        // 数组 通过索引来修改
        switch(type) {
            case TriggerOpTypes.ADD:
                if(isArray(target)&&isIntegerKey(key)) {
                    add(depsMap.get('length'))
                }
        }
    }
    effectSet.forEach((effect:any) => {
        if(effect.options.sch) {
            effect.options.sch() // 此时_dirty = true
        } else {
            effect()
        }
    } )
    
}