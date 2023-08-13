// 创建vnode
// createVnode = h函数
import { ShapeFlags, isArray, isObject, isString } from "@vue/shared"
export const createVnode = (type:any,props:any,children:any =null) => {
    // 区分 是组件还是元素
    let shapeFlag = isString(type)?ShapeFlags.ELEMENT:isObject(type)?ShapeFlags.STATEFUL_COMPONENT:0
    const vnode = {
        _v_isVnode:true, // 是一个虚拟节点
        type,
        props,
        children,
        key:props && props.key, // diff算法会使用到
        el:null, // 和真实的元素和vnode对应
        component:{},
        shapeFlag
    }
    //children 标识
    normalizeChildren(vnode,children)
    return vnode
}

function normalizeChildren(vnode:any,children:unknown) {
    let type = 0
    if(children == null) {
        children = null
    }else if(isArray(children)) { // 数组
        type = ShapeFlags.ARRAY_CHILDREN
    } else { // 文本
        type =ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag = vnode.shapeFlag | type // 合并标识
}


export function isVnode(vnode:any) {
    return vnode._v_isVnode
}

export const TEXT = Symbol('test')

export function CVnode(child:any) {
    if(isObject(child)) return child
    return createVnode(TEXT,null,String(child))
}