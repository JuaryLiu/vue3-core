import { currentInstance, setCurrentInstance } from "./component"

 // 生命周期
 const enum lifeCycle{
    BEFORE_MOUNT = 'bm',
    MOUBTED = 'm',
    BEFOREM_UNPDATE = 'bu',
    UPDATE ='u',
 }

 const injectHook = (lifeCycle:any,hook:Function,target:any) => {
        if(!target) return
        const hooks = target[lifeCycle] || (target[lifeCycle] = [])
        // 切片化 函数劫持
        const rap = () => {
            setCurrentInstance(target)
            hook() // 执行说明周期前，存放一些当前实例
            setCurrentInstance(null)
        }
        hooks.push(rap)
 }
function createHook(lifeCycle:any) {
    return function(hook:Function,target:any = currentInstance) {
         injectHook(lifeCycle,hook,target)
    }
}

 export  const onBeforeMount = createHook(lifeCycle.BEFORE_MOUNT)
 export  const onMounted = createHook(lifeCycle.MOUBTED)
 export  const onBeforeUpdate =createHook(lifeCycle.BEFOREM_UNPDATE)
 export  const onUpdated = createHook(lifeCycle.UPDATE)

 export function invokeArrayFns(arr:Array<Function>) {
    arr.forEach(fn => fn())
 }