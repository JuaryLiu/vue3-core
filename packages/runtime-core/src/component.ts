import { ShapeFlags, isFunction, isObject } from "@vue/shared"
import { componentPubilcInstance } from "./componentPubilcInstance"

export const getCurrentInstance = () => {
    return  currentInstance
}

export const setCurrentInstance = (target:any) => {
    currentInstance = target
}
// 创建一个组件实例
export const crteatComponentInstance = (InitialVnode:any) => {
    const instance = {
        InitialVnode,
        type:InitialVnode.type,
        props:{}, //组件的属性
        attrs:{}, // attrs 可以拿到所有属性，处理class和style
        setupState:{},
        ctx:{}, // 处理代理
        proxy:{},
        render:false,
        isMounted:false,  // 是否挂载 
    }
    instance.ctx = {_:instance}
    
    return instance
}

// 解析数据到组件实例
export const setupComponent = (instance:any) => {

   const {props,children} = instance.InitialVnode
   instance.props = props
   instance.children = children // slots 插槽
    // 判断这个组件有没有setup
   let shapeFlag = instance.InitialVnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
   if(shapeFlag) { // 有状态的组件
        setupStateComponent(instance)
   }
    
}

// 处理 setup
export let currentInstance:any
function setupStateComponent(instance:any) {
    instance.proxy = new Proxy(instance.ctx,componentPubilcInstance as any) // 方便取值
    
    // setup 的返回值 是render函数的参数
    let Component = instance.type
    let {setup} = Component
    if(setup) { // 判断setup是否存在
        let setupContext = createContext(instance)
        // 在 setup之前创建全局的实例
        currentInstance =instance
       let setupResult = setup(instance.props,setupContext)
       currentInstance = null
        handlerSetupResult(instance,setupResult) // 判断返回值是对象还是函数，对象就把结果放到instance.setupState上，如果是 函数，那么就是render函数
    } else {
        // 调用render
        finishComponentSetup(instance)
    }
   
    // Component.render(instance.proxy)
}

// 处理setup 的返回结果
function handlerSetupResult(instance:any,setupResult:unknown) {
    if(isObject(setupResult)) {
        instance.setupState = setupResult
    }
    if(isFunction(setupResult)) {
        instance.render = setupResult
    }

    // 执行render方法
    finishComponentSetup(instance)
}

// 处理render
function finishComponentSetup(instance:any) {
    let Component = instance.type
    console.log(Component,instance);
    
    if(!instance.render) { 
        if(!Component.render&&Component.template) { // 将template编译成render函数
            
        }
        instance.render = Component.render
        
    }
    instance.render(instance.proxy)
}

function createContext(instance:any) {
    return {
        attrs:instance.attrs,
        slots:instance.children,
        emit:()=> {},
        expose:()=>{}
    }
}

