import { hasChanged, isArray } from "@vue/shared"
import { Track, trigger } from "./effect"
import { TrackOpTypes, TriggerOpTypes } from "./operations"

export function ref(rawValue:any) {
    return createRef(rawValue)
}

export function shallowRef(rawValue:any) {
    return createRef(rawValue,true)
}

// 创建RefImpl类
class RefImpl{
    // 属性
    public _v_isRef = true
    public _value:any
    constructor(public rawValue:any,public shallow:boolean) {
      this._value = rawValue
    }
    // 类的属性访问器
    get value() {
        Track(this,TrackOpTypes.GET,'value')
        return this._value
    }
    set value(newValue) {
        if(hasChanged(newValue,this._value)) {
            this._value =newValue
            this.rawValue = newValue
            trigger(this,TriggerOpTypes.SET,'value',newValue)
        }
        
    }
}

function createRef(rawValue:any,shallow=false) {
    return new RefImpl(rawValue,shallow)
}


// toRef 将我们的目标对象的某个属性变成 ref，如果这个属性目标对象不是响应式，那么toRef也不具备响应式
export function toRef(target:any,key:any) {
    return new ObjectRefImpl(target,key)
}

class ObjectRefImpl {
    public _v_isRef = true
    public _object:any
    constructor(public target:any, public key:any) {
        this._object = target[key]
    }
    get value() {
        return this._object
    }
    set value(newValue) {
        this._object = newValue
        this.target[this.key] = newValue
    }
}


// toRefs 将将我们的目标对象的所有属性变成 ref
export function toRefs(target:any) {
    let res:any = isArray(target)?new Array(target.length):{}
    for(let key in target) {
        res[key] = toRef(target,key)
    }
    return res
}