# vu3-core

### 打包依赖

- [roollup + execa](https://github.com/JuaryLiu/vue3-core/blob/master/rollup.config.js)

### reactivity响应式

- [reactive响应式](https://github.com/JuaryLiu/vue3-core/blob/master/packages/reactivity/src/reactivety.ts)
- [effect依赖收集](https://github.com/JuaryLiu/vue3-core/blob/master/packages/reactivity/src/effect.ts)
- [ref](https://github.com/JuaryLiu/vue3-core/blob/master/packages/reactivity/src/ref.ts)

### dom操作，组件渲染

- [操作节点，增删改查](https://github.com/JuaryLiu/vue3-core/blob/master/packages/runtime-dom/src/nodeOps.ts)
- [操作属性，自定义属性，class类，style，event事件...](https://github.com/JuaryLiu/vue3-core/blob/master/packages/runtime-dom/src/patchProp.ts)
- [vnode生成虚拟dom](https://github.com/JuaryLiu/vue3-core/blob/master/packages/runtime-core/src/vnode.ts)
- [render渲染操作]()
- [h函数](https://github.com/JuaryLiu/vue3-core/blob/master/packages/runtime-core/src/h.ts)
- [组件实例](https://github.com/JuaryLiu/vue3-core/blob/master/packages/runtime-core/src/component.ts)
- [生命周期钩子](https://github.com/JuaryLiu/vue3-core/blob/master/packages/runtime-core/src/apiCreateApp.ts)

### 初始化

- ```js
  yarn init -y  // 初始化项目
  ```

- ```js
  yarn add typescript -D -W // 安装ts ，不用的可以不安装
  
  npx tsc --init // 生成ts配置文件
  ```

- ```js
  yarn add rollup rollup-plugin-typescript2 @rollup/plugin-node-resolve @rollup/plugin-json execa -D -W //安装rollup打包相关依赖
  ```

  ```js
  // 打包操作
  npm run build  // 全局打包
  
  npm run dev // 针对指定的文件夹进行打包
  ```

  

### 备注：

- .ts就是摆设，本来是要定义类型的，所以创建的typescript，但是时间能力有限，就没定义类型，就是anyscript  0_0,莫要见怪，咱们主要看的是逻辑嘛，要是不会ts，或者不想定义类型的就用js文件也可以，要定义类型的也只能看源码了。 还有大部分的api没有完成，后续有时间都会陆续更新
- 其中具体的操作，放到一个md文件中 [vue3](https://github.com/JuaryLiu/vue3-core/blob/master/vue3-core.md)

