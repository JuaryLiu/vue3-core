// 为了适配多种平台，不同的平台，dom，属性方法也会不同，这里就只是vue
import { ShapeFlags } from "@vue/shared"
import { ApiCreateApp } from "./apiCreateApp"
import { crteatComponentInstance, setupComponent } from "./component"
import { effect } from "@vue/reactivity"
import { CVnode, TEXT } from "./vnode"
import { invokeArrayFns } from "./apiLifecycle"
export function createRender(renderOptionsDom: any) {// 实现渲染
    // 获取全部的dom操作
    const {
        insert: hostInsert,
        remove: hostRemove,
        patchProp: hostPatchProp,
        forcePatchProp: hostForcePatchProp,
        createElement: hostCreateElement,
        createText: hostCreateText,
        createComment: hostCreateComment,
        setText: hostSetText,
        setElementText: hostSetElementText,
    } = renderOptionsDom
    function setupRenderEffect(instance: any, container: any) {
        // 创建effect 在effect中调用render方法，render就能收集依赖
        effect(function componentEffect() {
            if (!instance.isMounted) { // 第一次加载
                // 渲染之前
                let {bm,m} = instance
                if(bm) {
                    invokeArrayFns(bm)
                }
                // 获取到render的返回值
                let proxy = instance.proxy
                
                let subTree = instance.subTree= instance.render.call(proxy, proxy) // 执行render,在组件中创建dom节点
                
                //将h函数返回的vnode渲染到页面
                patch(null, subTree, container)
                // 渲染完成
                if(m) {
                    invokeArrayFns(m)
                }
                instance.isMounted =true
            } else {
                // 更新操作
                let {u,bu} = instance 
                // 更新前
                if(bu) {
                    invokeArrayFns(bu)
                }
                let proxy = instance.proxy
                const prevTree = instance.subTree
                const nextTree = instance.render.call(proxy, proxy)
                instance.subTree = nextTree
                patch(prevTree,nextTree,container)
                // 更新后
                if(u) {
                    invokeArrayFns(u)
                }
            }
        })
    }


    //----------------- 处理文本-----------------

    const processtext = (n1: any, n2: any, container: any) => {
            if(n1===null) {
                // 创建文本 =》真实dom =》 加载到页面
                n2.el = hostCreateText(n2.children)
                
                hostInsert(n2.el,container)
               
            } else {

            }
    }

    //-------------- 处理组件 ------------------
    // 组件渲染的流程
    const mountComponent = (InitialVnode: any, container: any) => {
        // 1. 先有一个组件的实例对象
        const instance = InitialVnode.component = crteatComponentInstance(InitialVnode)
        // 2.解析数据到这个实例对象中
        setupComponent(instance)
        // 3.创建一个effect ，让render函数执行
        setupRenderEffect(instance, container)
    }
    // 组件的创建
    const processComponent = (n1: any, n2: any, container: any) => {
        if (n1 === null) { // 第一次加载
            mountComponent(n2, container)
        } else { // 更新操作

        }
    }

 
    // -------------- 处理元素 ---------------
    const mountChildren = (el: any, children: any) => {
        children.forEach((item: any) => {
            let child = CVnode(item)
            patch(null, child, el)
        })
    }

    const mountElement = (n2: any, container: any,ancher:any) => {
        // 递归渲染  =》 真实dom =》 放到对应的页面
        const { props, shapeFlag, type, children } = n2
        // 创建元素
        let el = n2.el = hostCreateElement(type)

        //添加属性
        if (props) {
            for (let k in props) {
                hostPatchProp(el, k, null, props[k])
            }
        }
        // 处理children
        if (children) {
            if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
                // 创建文本元素
                hostSetElementText(el, children)
                
            } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 递归
                mountChildren(el, children)
            }
        }
        // 加载到对应的位置
        hostInsert(el, container,ancher)
    }

    //--------------------diff比对----------------------------------
    // 属性比对
    const patchProps = (oldProps:any,newProps:any,el:any) => {
       if(oldProps !=newProps) { // 属性不相同的时候
        for(let k in newProps ) {
            const prev = oldProps[k]
            const next = newProps[k]
            if(prev != next) {
                hostPatchProp(el,k,prev,next)
            }
        }   
       }
       for(let k in oldProps) {
        if(!(k in newProps)) {
            hostPatchProp(el,k,oldProps[k],null)
        }
       }
    }

    // 最长递增子序列
    function getSequence(arr:Array<number>) {
        let len = arr.length
        let start ,end,mid
        let result = [0]
        let p = arr.slice(0)
        for(let i =0;i<len;i++) {
            const arrI  = arr[i]
            if(arrI!==0) {
                let resultLastIndex =result[result.length-1] 
                if(arrI> arr[resultLastIndex]) {
                    p[i] = resultLastIndex
                    result.push(i)
                    continue
                }
                // 二分查找
                start =0
                end = result.length-1
                while (start < end) {
                    mid = (start + end)/2 |0
                   if(arr[result[mid]]<arrI) {
                    start = mid + 1
                   } else {
                    end =mid
                   }
                } 
                if(arrI<arr[result[start]]) {
                    if(start > 0) {
                        p[i] = result[start-1]  
                    }
                    result[start] = i
                }
    
            }
        }
    
        // 驱节点 向前查找
        start =result.length
        end = result[start-1]
        while (start-- > 0) {
            result[start] = end
            end = p[end]
          }
        return result
    }
    // 儿子都是数组的情况
    const patchKeyChild = (c1:any,c2:any,el:any) => {
        // vue3比对规则：从头部开始比对，遇到不相同的就停止比对，然后从尾部开始比对，那个数组没有了就停止比对
        let i = 0 // 记录指针位置
        let l1 = c1.length-1
        let l2 = c2.length -1
        //async form start: 头部比对
        while(i<= l1 && i<= l2) {
            const n1 = c1[i]
            const n2 = c2[i]
            if(isSomeVnode(n1,n2)) {
                patch(n1,n2,el)
            } else {
                break
            }
            i++
        }

        // async form end ： 尾部开始比对
        while(i<= l1 && i<= l2) {
            const n1 = c1[l1]
            const n2 = c2[l2]
            if(isSomeVnode(n1,n2)) {
                patch(n1,n2,el)
            } else {
                break
            }
            l1--
            l2--
        }

        if(i>l1) { // 新比旧的多
            // 添加数据
            const next= l2 + 1 // 插入的位置
          const ancher =  next < c2.length?c2[next].el:null
          while(i<=l2) {
            patch(null,c2[i++],el,ancher)
          }
        } else if(i > l2){ // 旧比新的多
            while(i<=l1) {
                unmount(c1[i++])  // 删除多出来的的数据
            }
        } else { // 乱序
            // vue3 解决思路  用新的乱序的数据创建一个乱序的映射表，用旧的乱序的数据，去新的里面找，找到就复用，没有就删除
            let s1 = i
            let s2 = i

            // 解决乱序对比之后的问题：没有更新到对应的位置，创建的元素，没有插入
            const toBePatched =l2 - s2 +1
            const newIndexToPatchMap = new Array(toBePatched).fill(0)

            // 创建表
            let keyIndexMap = new Map()
            for(let i = s2;i<=l2;i++) {
                keyIndexMap.set(c2[i].key,i)
            }
            for(let i = s1;i<=l1;i++) {
             let newIndex = keyIndexMap.get(c1[i].key)
                if(newIndex) {
                    newIndexToPatchMap[newIndex-s2] = i+1
                    patch(c1[i],c2[newIndex],el)
                   
                }else {
                    unmount(c1[i])
                }
            }
            // 
            const increasingNewIndexSequence = getSequence(newIndexToPatchMap)
            let  j =increasingNewIndexSequence.length-1
            for(let i = toBePatched-1;i>=0 ;i--) {
                let currentIndex = i + s2 
                let child = c2[currentIndex]
                let ancher = currentIndex +1> c2.length?c2[currentIndex+1].el:null
                if(newIndexToPatchMap[i] ===0) {
                    patch(null,child ,el,ancher)
                } else {
                    if(i !==increasingNewIndexSequence[j]) { // 不同就移动插入到相应位置
                        hostInsert(child.el,el,ancher)
                    } else { // 相同就不需要移动
                        j--
                    }
                    
                }
            }
        }
    }
    // chiid比对 
    const patchChild = (n1:any,n2:any,el:any) => {
        const c1 = n1.children
        const c2 = n2.children
        const prevShapeFlage = n1.shapeFlag
        const nextShapeFlage = n2.shapeFlag
        if(nextShapeFlage&ShapeFlags.TEXT_CHILDREN) { // 文本的情况
            if(prevShapeFlage&ShapeFlags.ARRAY_CHILDREN) {
                // unmount(c1)
                // hostSetElementText(el,c2)
            } else {
                hostSetElementText(el,c2)
            }  
        } else { // 不是文本，是 数组
            if(prevShapeFlage&ShapeFlags.ARRAY_CHILDREN) {
                patchKeyChild(c1,c2,el)
            } else { // 旧的是文本
                hostSetElementText(el,'')
                mountChildren(el,c2)
            }
        }
    }

    const pacthElement = (n1:any,n2:any,container:any,ancher:any) => {
           //  属性 =》 children
           const oldProps = n1.props
           const newProps = n2.props
           let el = (n2.el =n1.el)
           patchProps(oldProps,newProps,el)

           // 比对children
           patchChild(n1,n2,el)
    }
    function processElement(n1: any, n2: any, container: any,ancher:any) {
        if (n1 === null) {
            mountElement(n2, container,ancher)
        } else { // 更新
            // 同一个元素比对
            pacthElement(n1,n2,container,ancher)
        }
    }


    // 渲染的操作

    const isSomeVnode = (n1:any,n2:any) => {
        return n1.type === n2.type  && n1.key === n2.key
    }
    const unmount = (vnode:any) => {
        hostRemove(vnode.el)
    }
    const patch = (n1: any, n2: any, container: any,ancher:any =null) => {
        // 针对不同的类型  
        if(n1 && isSomeVnode(n1,n2)) {            
            unmount(n1)
            n1 =null
        }
        
        let { shapeFlag, type } = n2
        switch (type) {
            case TEXT:
                processtext(n1, n2, container)
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) { // 元素
                    processElement(n1, n2, container,ancher)

                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) { //组件
                    processComponent(n1, n2, container)
                }
        }

    }
    let render = (vnode: object, container: any) => {
        // 组件的初始化
        patch(null, vnode, container) // 第一次 渲染
    }
    return {
        createApp: ApiCreateApp(render) // 创建虚拟dom
    }
}
