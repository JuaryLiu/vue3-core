import { hasOwn } from "@vue/shared"

export const componentPubilcInstance = {
    get({_:instance}:any,key:any) {
        const {props,setupState} = instance
        
        if(key[0] === '$') { // 属性$开头的不能获取
            return 
        }
        if(hasOwn(props,key)) {
            return props[key]
        } else if(hasOwn(setupState,key)) {
            return setupState[key]
        }
    },
    set({_:instance}:any,key:any,value:any) {
        const {props,setupState} = instance
        if(hasOwn(props,key)) {
            props[key] = value
        } else if(hasOwn(setupState,key)) {
             setupState[key] = value
        }
    }
}