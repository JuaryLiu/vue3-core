import { isArray, isObject } from "@vue/shared"
import { createVnode, isVnode } from "./vnode"

// 把节点变成vnode
export function h(type:any,propsOrchildren:any,children:any=null) {
    const len = arguments.length
    if(len === 2) { //就是有两个参数
        // 元素+ 属性   元素 + children
        if(isObject(propsOrchildren) && !isArray(propsOrchildren)) {
             if(isVnode(propsOrchildren)) {
                return createVnode(type,null,[propsOrchildren])
             }
             return createVnode(type,propsOrchildren)
        } else {
            return createVnode(type,null,propsOrchildren)
        }
    } else{
        if(len>3) {
            children = Array.prototype.slice.call(arguments,2)
        } else if( len ===3 && isVnode(children)) {
            children = [children]
        }
        return createVnode(type,propsOrchildren,children)
    }
}