import { createVnode } from "./vnode"
// 将组件转换为虚拟dom
export function ApiCreateApp(render:Function) {
    return function createApp(rootComponent: any, rootProps: any) { // 那个组件，那个属性
        let app = {
            // 添加相关的属性
            _component:rootComponent,
            _props:rootProps,
            _container:null,
            mount(container: any) { // 挂载的位置
                // 1. 创建vnode ，根据组件创建虚拟节点
                let vnode = createVnode(rootComponent,rootProps)
                // console.log(vnode);
                
                //渲染
                render(vnode,container)
                app._container = container
            }
        }
        return app
    }
} 