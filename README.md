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
  yarn add typescript -D -W // 安装ts 
  
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

- 一万个人有一万种ts写法，所以大家不必纠结去看我的ts或者源码的ts ，对于类型的定义我也有很多偷懒的地方，莫要见怪0.0 咱们主要看的是逻辑嘛，。 还有大部分的api没有完成，后续有时间都会陆续更新
- 其中具体的操作，放到一个md文件中 [vue3](https://github.com/JuaryLiu/vue3-core/blob/master/vue3-core.md)
- 因为我也是小白，所以思路基本都是跟着源码走的，希望大家能给我一个star，支持支持我这只小白
- ![01CC7D21](https://github.com/JuaryLiu/vue3-core/assets/128942977/43ecec75-a342-4642-820c-5db442c65c0e)

