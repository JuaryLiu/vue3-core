import { isFunction } from "@vue/shared";
import { effect } from "./effect";

// computed计算属性有两个参数，一个是
export function computed(getterOrOptions:any) {
    let getter;
    let setter;
    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions
        setter = () => {
            console.warn('computed value must be readonly')
        }
    } else {
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }
    return new ComputedRefImpl(getter,setter)
}

class ComputedRefImpl {
    public _v_isReadonly = true
    public _v_isRef = true
    public _dirty = true
    public _value: any
    public effect:any
    constructor(getter:Function,public setter:Function) {
        this.effect = effect(getter,{
            lazy:true,
            sch: () => {
                if(!this._dirty) {
                    this._dirty = true
                }
            }
        })
        
    }
    get value() {
        // 获取执行
        if(this._dirty) {
          this._value = this.effect()
          this._dirty = false
        }
        return this._value
    }
    set value(newValue) {
        this.setter(newValue)
    }
}