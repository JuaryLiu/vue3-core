// runtime-dom 操作dom  1.节点 2. 属性
import { extend } from "@vue/shared";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";
import { createRender} from "@vue/runtime-core";

// vue3 dom 所有的操作
const renderOptionsDom = extend({patchProp},nodeOps)

export const createApp = (rootComponent:any,rootProps:Object) => {
    let app = createRender(renderOptionsDom).createApp(rootComponent,rootProps)
    let {mount} = app
    app.mount = function(container:any) {
        // 挂载组件
        container = nodeOps.querySlecter(container)
        
        container.innerHTML = ''

        //  将组件渲染的dom元素进行挂载
        mount(container)
    }
    return   app
}

export * from '@vue/runtime-core'

