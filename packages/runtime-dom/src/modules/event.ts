// 处理事件
export const pathEvent = (el:any,key:any,value:any) => {
    // 1. 对函数进行缓存
    const invokers = el._vei || (el._vet ={})
    const exists = invokers[key]
    if(exists&&value) { // 缓存的函数表中有
        exists.value =value
    } else {
        const eventName = key.slice(2).toLowerCase()
        if(value) {
            let invoker = invokers[eventName] = createInvoker(value)
            el.addEventListener(eventName,invoker)
        } else { // 没有 ，删除之前的
            el.removeEventListener(eventName,exists)
            invokers[eventName] = undefined
        }
    }
}
function createInvoker(value:any) {
    const invoker = (e:Event) => {
        invoker.value(e)
    }
    invoker.value = value
    return invoker
}