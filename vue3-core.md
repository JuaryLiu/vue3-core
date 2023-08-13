# **vue-core**

### vue3依赖

1. 使用yarn init -y 初始化项目

2. 在page.json中使用workspaces:["packages/*"] 来设置文件位置

3. 下载rollup和打包执行文件

   ```
   - yarn add typescript -D -W 来安装ts
   - npx tsc --init 生成 ts的json配置文件
   - yarn add rollup rollup-plugin-typescript2 @rollup/plugin-node-resolve @rollup/plugin-json execa -D -W 安装rollup打包相关依赖
   ```

   

4. 创建packages文件夹，在里面创建reactivity响应式模块和shared公共方法的文件夹，分别在这些文件下执行yarn init -y 来初始化每个模块，在生成的配置文件中设置

   ```json
     "buildOptions":{
       "name": "****",
       "formats": [
         "esm-bundler",
         "cjs",
         "global"
       ]
     }
   ```

5. 创建一个scripts文件夹，来存放打包的js文件build.js（全局打包）

   ```js
   // 导入fs 和 execa模块
   import * as fs from 'fs'
   import { execa } from 'execa'
   
   //利用 fs获取packages下面的文件夹
   const dir = fs.reddirSync('packages').filter(p => {
       if(fs.statSnyc(`packages/${p}`).isDirectory()) {
           return false
       }
       return true
   })
   // 利用execa进行并行打包 这里我会封装成一个build函数
/**
    execa第一个参数是打包的形式，第二个是一个数组
    -c 执行rullup配置， --environment环境变量  TARGET依赖
     stdio: "inherit"  子进程的输出在父进程里边出现
   */
   async function build(target) {
       await execa('rollup', ['-c', '--environment', `TARGET:${target}`], { stdio: "inherit" }) 
   }
   
   // 我需要对每个文件都要执行打包 所以我就要对获取到的dir进行遍历执行build函数,我创建了一个runParaller的函数来执行操作，有两个参数一个是需要打包的文件数组，一个是要执行的函数
   async function runParaller(dir,itemfn) {
       let result = []
       dir.forEach(item =>{
           result.push(itemfn(item))
       })
       // 返回一个Promise.all(result) 来保证返回的状态，而且也能确保result中的每个结果的是成功的才会进行打包
       return Promise.all(result)
   }
   
   // 然后我去调用runParaller这个方法，runParaller会返回一个promise，所以我们可以监听到执行结果的状态
   runParaller(dirs, build).then(() => {
       console.log('success');
   }).catch((err) => {
       console.log('error', err);
   })
   ```
   
6. 因为我们是通过rollup进行打包，所以在packages同目录的文件夹下我会创建一个rollup.config.js   rollup的js配置文件

   ```js
   // 1. 引入相关依赖
   // 这里因为之前在page.json中配置type：module的原因，所以不支持require的方法导入
   import ts from 'rollup-plugin-typescript2' //解析 ts
   import json from '@rollup/plugin-json' //解析json
   import resolvePlugin from '@rollup/plugin-node-resolve' //解析 第三方插件
   import path from 'path' //处理路径
   
   //用import方法导入path，它无法获取到——dirname，根路径的绝对路径，所以这里使用了url和path中的一个api，来配置——dirname
   import { fileURLToPath } from 'url';
   import {dirname} from 'path'
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = dirname(__filename);
   
   // 这里将require转换为模块，为了后续方便获去文件内容
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
   
   // 2. 获取文件的路径
   const packagesDir = path.reslove(__dirname,'packages')
   
   // 获取需要打包的文件
   // process.env.TARGET可以获取到之前在build文件中使用execa中传过去的target参数
   const packageDir = path.reslove(packagesDir,process.env.TARGET)
   
   // 获取到需要打包的文件的配置,定义一个reslove函数来获取改配置文件的路径
   let reslove = p => path.reslove(packageDir,p)
   let pkg = require(reslove('package.json')) // 获取json配置
   // 获取pkg配置文件中的buildOptions配置项
   const packageOptions = pkg.buildOptions || {}
   
   // 获取文件名字
   const name = path.basename(packageDir)
   
   // 创建一个输出映射表，对于输出文件的类型做一个匹配
   const outputOptions = {
       // 不同的格式会打包成不同的文件类型
       "esm-bundler":{
           file:resolve(`dist/${name}.esm-bundler.js`),
           format:'es'
       },
       "cjs":{
           file:resolve(`dist/${name}.cjs.js`),
           format:'cjs' 
       },
       "global":{
           file:resolve(`dist/${name}.global.js`),
           format:'iife' 
       }
   }
   //这里就是rullup需要导出的配置
   function createConfig(format , output) {
       output.name = packageOptions.name
       output.sourcemap = true
       
       return {
           input:reslove('src/index.ts'),
           output,
           plugins:[
               json(), //json 配置
               ts({
                   tsconfig:path.resolve(__dirname,'tsconfig.json') //ts配置
               }),  
               resolvePlugin() // 第三方插件
       }
   }
   
   
   //  rullup需要导出一个配置，这里我定义了一个createConfig函数，来来获取要导出的配置
   export default packageOptions.formats.map(format => createConfig(format，outputOptions[format]))
   ```

7. 然后对于开发环境配置的编译于打包配置了一个dev.js文件也在scripts中，然后在package.json中的调试配置项scripts中设置了"dev" : "node scripts/dev.js"，使用node rundev 来方便开发调试

   ```js
   // 在开发环境打包中 就会简单很多，这里就没有获取文件信息
   import { execa } from 'execa'
   
   // 因为开发环境中需要重复打包，所以在execa中增加了一个 W 参数，来自动检测打包，只要target目标文件发送改变就会重新打包
   async function dev(target) {
       console.log(target);
       // execa第一个参数是打包的形式，第二个是一个数组
       // -c 执行rullup配置， --environment环境变量  TARGET依赖 w 自动检测打包
       await execa('rollup', ['-cw', '--environment', `TARGET:${target}`], { stdio: "inherit" })//子进程的输出在父进程里边出现
   }
   dev('reactivity')
   ```

   ### vue3响应式api的实现
   
   1. reactivety文件夹中，创建响应式文件，响应式api最常用的就四种，reactive, readonly，shallowReactive，shallowReadonly，在vue3中我们对于数据的代理方式是proxy，下面我们去实现这些api
   
      ```js
      // 针对这四个api 它们都是要劫持一个数据对象来进行绑定，不同的就是不是可读和是不是深代理，所以这里使用了高阶函数的柯里化来实现
      // 我们分别定义四个函数来对应那四个api方法，传入目标值，最后返回一个proxy代理的对象，所以这里使用一个函数来对我们的数据做proxy代理
      export function reactive(target:Object) {
          return createReactObj(target,false,reactiveHandlers)
      }
      export function shallowReactive(target:Object) {
          return createReactObj(target,false,shallowReactiveHandlers)
      }
      
      export function readonly(target:Object) {
          return createReactObj(target,true,readonlyHandlers)
      }
      
      export function shallowReadonly(target:Object) {
          return createReactObj(target,true,shallowReadonlyHandlers)
      }
      
      //数据结构，用来收集被代理的数据，避免重复代理
      const reactiveMap = new WeakMap() // 类似于map，但是这个key必须是对象，并且会自动的垃圾回收
      const readonlyMap = new WeakMap()
      function createReactObj(target:any,isReadonly:boolean,baseHandlers:object) { // 接收三个参数，分别是目标对象，是否是只读的，还有proxy的配置项
         if(!isObject(target)) { //isObject 判断目标值是不是对象，这个方法我写在了shared文件夹src里的index.ts里面，后续的公共方法，都写在了里面
             return target
         }
          const proxymap = isReadonly?readonlyMap:reactiveMap // 判断该数据收集到那个数据结构中
          const proxyEs = proxymap.get(target) // 判断目标值有没有被代理过
          if(proxyEs) { // 被代理过就直接返回结果
              return proxyEs
          }
          // 没有，就进行proxy 代理
          const proxy = new Proxy(target,baseHandlers)
          // 然后将数据存入proxymap中
          proxymap.set(target,proxy)
          return proxy
      }
      ```
   
   2. 为了逻辑保持清楚，这里我把这四个api的代理配置项单独放到了一个baseHandlers.ts的文件中，避免页面太乱
   
      ```js
      //先定义带出这些配置项
      const shallowSet = createSetter(true)
      export const reactiveHandlers = {
          get,
          set
      }
      
      export const readonlyHandlers = {
          get: readonlyGet,
          set: () => {
              console.log('只读！！！无法修改值');
          }
      }
      
      export const shallowReactiveHandlers = {
          get: shallowGet,
          set: shallowSet
      }
      
      export const shallowReadonlyHandlers = {
          get: shallowReadonlyGet,
          set: () => {
              console.log('只读！！！无法修改值改值');
          }
      }
      
      // 我们配置项中要执行的函数是一样的，只是根据参数的不同，输出不同的结果，所以我们这里也使用柯里化
      // 在配置项中常用的有get和set方法，下面定义这些方法
      // 先定义方法，方法会有两个参数，是不是只读和是不是浅代理，不是只读我们会收集依赖，浅代理就会直接返回，不是则要判断该值是不是对象，然后判断是不是只读的，分别进行不同的递归调用，这个方法会返回一个get函数此时get有三个参数target：目标对象，key：目标对象的key值，receiver：目标对象的实例
      function createGetter(isReadonly = false, shallow = false) {
          return function get(target: object, key: string | symbol, receiver: object) {
              const res = Reflect.get(target, key, receiver)
              if(!isReadonly) { // 不是只读，就收集依赖，做响应式处理
                  // 这是依赖收集的函数还没有定义，会在有个单独的effect.ts文件中进行定义的，set的tirgger也是一样
                  Tarack(terget,TrackOpTypes.Get,key) //terget:收集的目标对象,TrackOpTypes.Get：收集处理的类型,key：目标对象的key值 
              }
              if(shallow) {
                  return res
              }
              if(isObject(res)) { // key是一个对象的时候
                  return isReadonly?readonly(res):reactive(res) // 进行递归调用，代理更深层次的对象
              }
              return res
          }
      }
      // 这里我们创建实例对象，来得到不同的get函数
      const get = createGetter()
      const shallowGet = createGetter(false, true)
      const readonlyGet = createGetter(true, false)
      const shallowReadonlyGet = createGetter(true, true)
      
      
      // 然后就是set方法，和get大致是一样的，不同的是set只有一个参数shallow，判断是不是深代理，因为只读属性不能进行修改，所以不能使用set方法对数据进行修改，自然实例对象也就只有两个,返回的set函数中会多一个参数，这个值就是我们需要修改的结果，也就是新值
      fuction cteateSetter(shallow = false) {
          return function(target: any, key: string | symbol, value: unknown, receiver: object) {
              const oldvalue = target[key] // 先将老值储存起来
              const result = Reflect.set(target, key, value, receiver)
              
              // 这里主要是处理数组的改变
              let haskey = isArray(target)&& isInteferKey(key)?Number(key)<target.length:hasOwn(target,key) // 这些都是公共方法和isObject是一样的 isArray判断是不是数组，是会返回true ，isInteferKey：判断key是不是整数，是就返回true，hasOwn：判断可以key是不是target本身的属性
              if(!haskey) { // 代表数组新增
                  // trigger 触发依赖
                  trigger(target, TriggerOpTypes.ADD, key, value)
              } else if(hasChanged(value, oldvalue)) {
                  // hasChanged 是来潘墩新值后之前的值是不是相等的，是的就返回false，就不进行处理
                  tirgger(target, TriggerOpTypes.SET, key, value, oldvalue) //这里我们就处理新增和修改，就不处理删除，清除了；这些属性我都定义到了operations.ts中，使用枚举的方式
              }
              return result
          }
      }
      
      // set 的实例 
      const set = createSetter()
      const shallowSet = createSetter(true)
      ```
   
   3. 下面我们来完成上面提到的收集依赖，我创建了一个effect.ts文件来处理这些问题,effect就类似于vue2中的watcher属性，用来收集依赖，参数是有两个，一个用户处理函数，一个就是配置对象
   
      ```js
      // 首先我定义一个effect函数，依然会是用高级函数的柯里化
      function effect(fn: Function, options: any = {}) {
          // 创建一个effect实例来返回effect收集的属性
          const effect =  createReactEffect(fn,options)
         if(!options.lazy) {
             effect()
         }
          return effect
      }
      
      let uid =0 // 来记录不同的effct
      let activeEffect:any  // 用来保存当前的effect
      const effectStack:any = [] // 定义一个栈结构，避免effect嵌套的问题
      // 用来返回 收集到的属性和方法
      function createReactEffect(fn: Function, options: any) {
          const effect = function reactiveEffect() {
              // 防止多个effect嵌套
              if(effectStark.includes(effect)) { // 确保effect 没有入栈
                  try {
                      // 入栈
                      effectStarck.push(effect)
                      activeEffect = effect
                      retuen fn() // 返回收集函数的结果 
                  }finally {
                      // 出栈
                      effectStarck.pop()
                      activeEffect = effectStarck[effectStarck.length-1]
                  }
              }
          }
          effect.id = uid++  // 区别effect作用者
          effect._isEffect = true // 区分effect 是不是响应式的
          effect.raw = fn  //保存用户的方法
          effect.options = options  //保存用户的配置项
          return effect
      }
      
      // 触发get 的时候 收集effect 
      let targetMap = new WeakMap() // 创建结构表,收集effect
      export function Track(target: object, type: any, key: string | symbol) {
          // key 和 effect 一一对应关系， map =》 key =》 target对象：value =》 [effect] Set	
          if(activeEffect === undefined) { //没有effect中使用
              return
          }
          let depMap = targetMap.get(target)
          if(!depMap) {
              targetMap.set(target,(depMap = new Map()))
          }
          let dep = depMap.get(key)
          if(!dep) {//没有属性
              depMap.set(key,(dep = new Set()))
          }
          if(!dep.has(activeEffect)) { // 有没有使用的effect
              dep.add(activeEffect)
          }
      }
      
      
      // 触发set的时候 触发effect
      export function trigger(target:object,type:any,key?:any,newValue?:any,oldValue?:any) {
          const depsMap = targetMap.get(target)
          if(!depsMap) return // 目标对象没有effect依赖直接返回
          // 有依赖的情况
          let effectSet = new Set // 避免重复，减少执行次数
          const add = (effectAdd:any) => { // 定义一个add方法，将depsMap中的得依赖存入到 effectSet中
              depsMap.forEach((effect:any) => effectSet.add(effect))
          }
          
          // 当可以key 为length的时候，修改数组的length 
          if(key === 'length' && isArray(target)) {
              depsMap.forEach((dep,key) => {
                  if(key === 'length' || key >= (newValue as number)) {
                      add(dep)
                  }
              })
          } else {
              if(key != undefined) {
                  add(depsMap.get(key))
              }
              // 当数组通过所以来修改时
              switch(type) {
                  case TriggerOptypes.ADD:
                      if(isArray(target)&&isIntegerKey(key)) {
                          add(depsMap.get('length'))
                      }
              }
          }
          effectSet.forEach((effect:any) => {
              if(effect.options.sch) {
               effect.options.sch() // 让_dirty为true
              } else {
                  effect()
              }
          } )
      }
      ```
      
   4. 对复杂数据类型使用reactive，对于普通数据类型我们是人ref来进行代理，ref返回的是一对构造函数实例，toRef是将目标对象的某一个属性变成ref，如果这个属性目标对象不是响应式，那么toRef也不具备响应式，toRefs是将目标对象的所有属性都变成ref，其他和toRef一样
   
      ```js
      import { hasChanged, isArray } from "@vue/shared"
      import { Track, trigger } from "./effect"
      import { TrackOpTypes, TriggerOpTypes } from "./operations"
      
      // 先创建一个ref的函数，我们也需要判断是不是浅代理，所以这里也使用了函数的柯里化
      export function ref(rawValue) {
          return createRef(rawValue,shallow)
      }
      export function shallowRef(rawValue:any) {
          return createRef(rawValue,true)
      }
      // ref最终会返回一个构造函数实例
      function createRef(rawValue:any,shallow=false) {
          return new RefImpl(rawValue,shallow)
      }
      class RefUmpl {
          // 类自身的属性
         public _v_isRef = true
          public _value
          constructor(public rawValue:any,public shallow:boolean) {
              this._value = rawValue
          }
      	// ref完成响应式是使用definePrototy进行代理劫持，在class中我们使用类的属性访问器也是可以实现的
          get value() {
      		// 当获取到这个数据时，就是这个事件被使用的时候我们会触发get这个方法，然后依赖收集起来,然后返回这个最新的值
              Track(this,TrackOpTypes.GET,'value')
              return this._value
          }
      	set value(newValue) { // 修改的值得时候触发
                if(hasChanged(newValue,this._value)) { // 判断新的值和旧的值是不是相等的，避免相同的值进行操作
                  this._value =newValue
                  this.rawValue = newValue
                  trigger(this,TriggerOpTypes.SET,'value',newValue) // 进行触发依赖
              }
          }
      }
      
      
      // toRef 将我们的目标对象的某个属性变成 ref，如果这个属性目标对象不是响应式，那么toRef也不具备响应式，有两个参数一个是目标对象，一个是目标对象的key,一样会返回一个实例对象
      export function toRef(target:any,key:any) {
          return new ObjectRefImpl(target,key)
      }
      
      class ObjectRefImpl {
          public _v_isRef = true
          public _object:any
          constructor(public target:any, public key:any) {
              this._object = target[key]
              get value() {
             	return  this._object
          	}
              set value(newValue) {
                  this._object = newValue
      			this.target[this.key] = newValue	
              }
          }
      }
      
      //toRefs 将我们的目标对象的所有属性变成 ref,就是递归版的toRef
      epxort function toRefs(target) {
          let res = isArray(target)?new Array(target.length):{}
          for(let key in target) {
              res[key] = toRef(target,key)
          }
          return res
      }
      ```
   
   5. 然后就是我们的computed计算属性api，也是我写的最后一个api了，当参数是一个函数的时候，和不是函数的时候我们进行不同的处理，最后都会返回对应的get和set, computed最终会返回一个实例对象
   
      ```js
      getterOrOptions
      export function computed(getterOrOptions) {
          let getter
          let setter
          if(isFunction(getterOrOptions)) {// 参数是一个函数的时候，就是没有set方法，这时候我们就定义了一个set警告
              getter = getterOrOptions
              setter = () => {
                  console.warn('computed value must be readonly')
              }
      	} else {
               getter = getterOrOptions.get
              setter = getterOrOptions.set
          }
          return new ComputedRefImpl(getter,setter)
      }
      class ComputedRefImpl {
           public _v_isReadonly = true //是不是只读
          public _v_isRef = true
          public _dirty = true // 判断是否执行
          public _value: any
          public effect:any  // 收集依赖
          constructor(getter:Function,public setter:Function) {
              	this.effect = effect(getter,{
                      lazy:true,
                      sch:()=> {
                          if(!this._dirty) {
                              this._dirty = true
                          }
                      } 
                  })
          }
      	get value() {
              if(this._dirty) {
                  this._value = this.effect()
                  this._dirty = false
              }
              return this._value
          }
      	set value(newValue) {
              this.setter(newValue)
          }
      }
      ```
   
      ### dom操作
      
      1. 下面就是dom操作，这里和之前响应式一样，我们在package文件夹下面创建两个文件夹分别是runtime-dom（进行dom操作）和runtime-core（所有使用到的方法），和之前一样 创建配置文件，修改其配置，然后进行打包编译，
      
         ```js
         // 在vue3中注册，挂载的操作
         let App = {
             setup(props,context) { //当setup返回值是一个函数的时候，那么它返回的就是下面的render函数，如果不是，那么返回的值就是下面render函数的参数
                 ***
             }
             render(proxy) {
                 ***
             }
         }
         createApp(App,{属性}).mount('#app') // 挂载到dom节点上
         ```
      
      2. 根据上面所知道的，我们要创建一个createApp的方法，参数就是一个app的配置对象，和属性，里面会有一个mount方法来进行挂载，参数就是要挂载的节点
      
         ```js
         // 在runtime-dom的src下的index.ts文件中创建一个createApp的方法,并且导出
         import { extend } from "@vue/shared"; // 对象合并的方法
         import { nodeOps } from "./nodeOps"; // 操作节点的文件
         import { patchProp } from "./patchProp"; // 操作属性的文件
         import { createRender } from "@vue/runtime-core"; // 组件渲染的操作，会在runtime-core的文件下进行讲解
         // vue3 dom 所有的操作
         const renderOptionsDom = extend({patchProp},nodeOps)
         
         export const createApp = (rootComponent,rootProps) => {
             // 这里的createApp操作主要是为了适配多个平台，因为每个平台的dom操作方法都不同，renderOptionsDom是vue3 dom的全部操作（属性和节点的操作）这些操作我分为两个单独的文件来写，然后通过对象和并的方式将它们合并为一个配置对象
             let app = createRender(renderOptionsDom).createApp(rootComponent,rootProps)
             let {mount} = app
             app.mount = function(container) { // 挂载组件，container挂载节点
                 container = nodeOps.querySlecter(container) // nodeOps上面提到的节点的操作的文件，里面自己定义的一个获取节点的方法，就是document.querySelector(***)
                 // 然后清空这个节点内容
                  container.innerHTML = ''
                   //  将组件渲染的dom元素进行挂载
                 mount(container)
             }
             return app
         }
         ```
      
      3. 下面这里就是上面提到的操作dom的两大方向，节点和属性
      
         ```js
         // 节点的操作 ，增删改查
         export const nodeOps ={
             // 操作元素
             // 创建元素
             createElement:(tagName:any) => document.createElement(tagName),
             // 删除元素
             remove:(child:any) => {
                 let parent = child.parentNode
                 if(parent) {
                     parent.removeChild(child)
                 }
             },
             // 插入元素
             insert:(child:any,parent:any,ancher=null) => {
                 parent.insertBefore(child,ancher) //如果ancher为null的时候，就类似于appendChild追加子元素
         
             },
             //获取元素
             querySlecter:(select:any) => document.querySelector(select),
             // 获取元素文本
             setElementText:(el:any,text:any) => el.textConent = text,
         
         
             // 操作文本
             //创建文本
             createText:(text:any )=> document.createTextNode(text),
             //设置文本
             setText:(node:any,text:any) => node.nodevalue(text),
         
         }
         
         //操作属性 ，属性分为class属性，style属性，event事件的处理，自定义的属性，这四种属性的操作，我分了四个文件夹，在同级目录下创建了一个modules文件进行存放
         import {patchClass} from './modules/class'
         import { patchStyle } from './modules/style'; 
         import { pathAttr } from './modules/attr';
         import { pathEvent } from './modules/event';
         
         export const patchProp = (el,key,prevValue,nextValue) {// 因为属性的操作，涉及到更新，添加，删除得到，四个参数分别是元素的节点或组件，唯一的标识，之前的值，和现在的值
             switch(key) {
                      case 'class':
                     patchClass(el,prevValue) // 针对class属性的操作
                 break;
                 case 'style':
                     patchStyle(el,prevValue,nextValue) // 针对style属性的操作
                 break;
                 default:
                     if(/^on[^a-z]/.test(key)) { // 是不是事件 //针对事件的操作
                         pathEvent(el,key,nextValue)
                     } else {
                         pathAttr(el,key,nextValue)
                     }
                     break;
             }
         }
         
         
         //  处理 class样式 patchClass
         export const patchClass = (el,value) => { 
             if(value === '')  { // 渲染的新节点的class类为空，就清空节点的class类
                el.className = ''
             }
             el.className = value // 不为空，就设置上新值
         }
         
         
         // style 的处理 patchStyle
         export const patchStyle = (el, prev, next) => {
             const style = el.style
             if (next === null) { // 更新节点没有style属性，就清除style属性
                 el.removeAttribute('style')
             } else {
                 // 旧的有，新的没有 
                 if (prev) {
                     for (let k in prev) { // 遍历每个旧的属性，找到新的没有的属性，将属性设置为空
                         if (next[k]) {
                             style[k] = ''
                         }
                     }
                 }
                 // 新的有
                 for (let k in next) { // 遍历每个新的属性，将属性设置带style中
                     style[k] = next[k]
                 }
         
             }
         }
         
         
         // 处理事件 pathEvent
         export const pathEvent = (el,key,value) => { // key事件操作符：onClick...，value就是对应的函数，el就是操作的节点
             // 1. 对函数进行缓存
             const invokers = el._vei || (el._vet ={}) // 有就直接为这个对象，没有就设置为空对象
             const exists = invokers[key] // 对应的执行函数
             if(exists&&value) { // 缓存的函数表中有
                 exists.value =value
             } else {
                 const eventName = key.slice(2).toLowerCase() //将属性 onClick 变为click
                 if(value) {
                     let invoker = invokers[eventName] = createInvoker(value) // 连等就是将这个函数存储起来
                     el.addEventListener(eventName,invoker)
                 } else { // 没有 ，删除之前的
                     el.removeEventListener(eventName,exists)
                     invokers[eventName] = undefined
                 }
             }
         }
         function createInvoker(value) {
             const invoker = (e) => { // 处理执行函数自带的参数e
                 invoker.value(e)
             }
             invoker.value = value
             return invoker
         }
         
         
         
         // 自定义属性 pathAttr 和class的操作类似
         export const pathAttr = (el,key,value) => {
             if(value === null) {
                 el.removeAttribute(key)
             } else {
                 el.removeAttribute(key,value)
             }
         }
         ```
      
      4. 然后这里我们就写上面提到的runtime-core文件，这里写上面提到的适配多种平台的createRender
      
         ```js
         import { ShapeFlags } from "@vue/shared"
         import { ApiCreateApp } from "./apiCreateApp"
         import { crteatComponentInstance ,setupComponent ,setupRenderEffect} from "./component"
         import { effect } from "@vue/reactivity"
         import { CVnode, TEXT } from "./vnode"
         import { invokeArrayFns } from "./apiLifecycle"
         export function createRender(renderOptionsDom) {// 实现渲染
             const mountComponent = (InitialVnode,container) => { // InitialVnode 初始化的虚拟dom
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
                 
                 
                 const setupRenderEffect = (instance,container) => {
                     // 创建effect 在effect中调用render方法，render就能收集依赖
                     effect(function componentEffect(){
                         if(!instance.isMounted) { // 第一次加载
                             let {m,bm} = instance
                             if(bm) {
                                  invokeArrayFns(bm)
                             }
                             let proxy = instance.proxy
                             let subTree = instance.subTree = instance.render.call(proxy, proxy) // 执行render函数，返回虚拟dom
                             patch(null,subTree,container)
                             if(m) {
                                 invokeArrayFns(m)
                             }
                         } else { //更新
                             if(u,bu) = instance
                             if(bu) {
                                 invokeArrayFns(bu)
                             }
                             let proxy = instance.proxy
                             let prevTree = instance.subTree
                             let nextTree = instance.render.call(proxy,proxy)
                             instance.subTree = nextTree
                             patch(prevTree,nextTree,container)
                             if(u) {
                                 invokeArrayFns(u)
                             }
                         }
                     })
                 }
                 
               
               //----------------- 处理文本-----------------  
                 const processtext = (n1,n2,container) => {
                      if(n1===null) {
                          n2.el = hostCreateText(n2.children)
                            hostInsert(n2.el,container)
                      }
                 } 
                 
              //-------------- 处理组件 ------------------
              // 组件渲染的流程
             const mountComponent = (n2,container) =>{
                 // 1. 先有一个组件的实例对象 
                 const instance = InitialVnode.component = crteatComponentInstance(InitialVnode)
                 //  2.解析数据到这个实例对象中
                 setupComponent(instance)
                  // 3.创建一个effect ，让render函数执行 当数据发生改变的时候就会执行
                 setupRenderEffect(instance,container)
                 
             }
             
             const processComponent = (n1,n2,container) => {
                 if(n1 === null) { //代表第一次加载
                     mountComponent(n2,container) // 进行加载
                 }
             }
             
             
            // -------------- 处理元素 ---------------
             const TEXT = Symbol('test')
             function CVnode(child) {
                 if(isObject(child)) return child
                  return createVnode(TEXT,null,String(child))
             }
             
             
             const mountChildren = (el, children) => {
                 children.forEach(item => {
                     let child = CVnode(itme)
                     patch(null,child,el)
                 })
             }
             
             
             const mountElement =(n2,container) => {
                 // 递归渲染  =》 真实dom =》 放到对应的页面
                 const { props, shapeFlag, type, children} = n2
                let el = n2.el = hostCreateElement(type)
                
                // 添加属性
                if(props) {
                    for( let k in props) {
                        hostPatchProp(el,k,null,props[k])
                    }
                }
                 
                 //处理children
                 if(children) {
                     if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
                         hostSetElementText(el,children)
                     } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                         mountChildren(el, children)
                     }
                 }
             }
               // 对比属性
             cosnt patchProps = (oldProps,newProps,el) => {
                 if(oldProps !=newProps ) {
                     for(let k in newProps) {
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
             
             // 最长子递增序列
          function getSequence(arr) {
             let len = arr.length
             let start,end,mid
             let result = [0] 
             let p = arr.slice(0) 
             for(let i =0;i<len;i++) {
                 const arrI = arr[i] 
                 if(arrI !== 0) {
                     let resultLastIndex = result[result.length -1]
                     if(arrI > arr[resultLastIndex]) {
                         p[i] = resultLastIndex
                         result.push(i)
                         continue
                     }
                     // 二分法查找
                     start = 0     
                     end = result.length-1
                     while(start < end) {
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
             
             
             const patchKeyChild = (c1,c2,el) => {
                 // vue3的比对规则：从头部开始比对，遇到不相同的就停止比对，然后从尾部开始比对，那个数组没有了就停止比对
                 let i= 0 // 记录指针位置
                 // 拿到数组的长度
                 let l1 = c1.length-1
                 let l2 = c2.length -1
                 
                  //async form start: 头部比对
                 while(i<=l1 && i<=l2) {
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
                   while(i<=l1 && i<=l2) {
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
                 // 添加删除元素
                 if(i > l1) { // 新比旧的多
                     // 添加数据
                     const = l2 +1 // 插入的位置
                     const ancher = next < c2.length?c2[next].el:null // 要插入前后的元素
                     while(i<=l2) {
                         patch(null,c2[i++],el,ancher)
                     }
                 } else if(i>l2) { // 旧比新的多
                     unmount(c1[i++]) // 删除多出来的的数据
                 } else { // 乱序 diff算法的核心，用新的乱序的数据创建一个乱序的映射表，用旧的乱序的数据，去新的里面找，找到就复用，没有就删除
                     let s1 = i
                     let s2 = i
                      // 解决乱序对比之后的问题：没有更新到对应的位置，创建的元素，没有插入
                     const toBePatched = l2 -s2
                     const newIndexToPatchMap = new Arrar(toBePatched).fill(0)
                     
                     let keyIndexMap = new Map()
                     for(let i = s2; i<=l2; i++) {
                          keyIndexMap.set(c2[i].key,i)
                     }
                     for(let i =s1;i<=l1;i++) {
                         let newIndex = keyIndexMap.get(c1[i].key)
                         if(newIndex) {
                              // 问题： 没有更新到对应的位置，创建的元素，没有插入
                             newIndexToPatchMap[newIndex-s2] = i+1
                             patch(c1[i],c2[newIndex],el)
                         } else {
                             unmount(c1[i])
                         }
                     }
                     
                     // 利用最长子序列来对排序进行优，相同的元素只替换位置，不重新添加
                      const increasingNewIndexSequence = getSequence(newIndexToPatchMap)
                      let j = increasingNewIndexSequence
                      for(let i = toBePatched-1;i>=0;i--) {
                          let currentIndex = i + s2
                          let child = c2[currentIndex]
                          let ancher = currentIndex +1  > c2.length?c2[currentIndex+1].el:null
                          if(newIndexToPatchMap[i] ===0) {
                               patch(null,child ,el,ancher)
                          } esle {
                                if(i !==increasingNewIndexSequence[j]) { // 不同就移动插入到相应位置
                                 hostInsert(child.el,el,ancher)
                             } else { // 相同就不需要移动
                                 j--
                             }
                          }
                      }
                     
                 }
                 
             }
             const patchChild = (n1,n2,el) => {
                 const c1 = n1.children
                 const c2 = n2.children
                 const prevShapeFlage = n1.shapeFlag
                 const nextShapeFlage = n2.shapeFlag
                 if(nextShapeFlage& ShapeFlags.TEXT_CHILDREN) {// 新的孩子为文本的情况
                     if(prevShapeFlage&ShapeFlags.ARRAY_CHILDREN) { // 旧的孩子为数组
                          unmount(c1)
                         hostSetElementText(el,c2)
                     } else {
                         hostSetElementText(el,c2)
                     }
                 } else {
                     if(prevShapeFlage&ShapeFlags.ARRAY_CHILDREN) { // 新旧都是数组
                         patchKeyChild(c1,c2,el)
                     }
                 }
             }
             const pacthElement =(n1,n2,container,anche) => {
                 const oldProps = n1.props
                 const newProps = n2.props
                 let el = (n2.el =n1.el) 
                 // 对比属性
                 patchProps(oldProps,newProps,el)
                 // 对比children
                 patchChild(n1,n2,el)
             }
             const processElement = (n1,n2,container,ancher) => {
                 if(n1 === null) { //代表第一次加载
                     mountElement(n2,container) // 进行加载
                 } else { //更新
                      // 同一个元素比对
                     pacthElement(n1,n2,container,ancher)
                 }
             }
             
             const isSomeVnode =(n1,n2) =>{ // 判断是不是相同元素
                 return n1.type === n2.type && n1.key === n2.key
             }
             const unmount = (n1) => { // 删除元素
                 hostRemove(vnode.el)
             }
             
             let patch = (n1,n2,container) => { // n1:旧的虚拟dom n2:新的虚拟dom
                 if(n1&&isSomeVnode(n1,n2)) { // 两个元素相同，直接删除在添加
                     unmount(n1)
                     n1 = null
                 }
                 
                 let {shapeFlag} = n2 // 拿到新的虚拟dom的标识符
                 
                  // 判断新的虚拟dom是元素还是组件
               	switch(type) {
                     case TEXT :
                          processtext(n1, n2, container)
                         break;
                     default:
                         if (shapeFlag & ShapeFlags.ELEMENT) { // 元素
                             processElement(n1, n2, container,ancher)
         
                         } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) { //组件
                             processComponent(n1, n2, container)
                         }
                 }
         
            
             
             
             
             let render = (vnode,container) => { // 渲染的函数
                     // 组件的初始化
                     patch(null,vnode,container) // 第一次 渲染
             }
             return {
                 createApp:ApiCreateApp(render) // 创建虚拟dom
             }
         }
         
         
             
             
             
         // 创建ApiCreateApp方法在apiCreateApp.ts文件下
         import { createVnode } from "./vnode" // 创建vnode的方法
         export function ApiCreateApp(render) {
               return function createApp(rootComponent, rootProps) { // 那个组件，那个属性
                 let app = { 
                     // 添加相关的属性
                     _component:rootComponent, // 组件
                     _props:rootProps, //属性
                     _container:null, // 根节点
                     mount(container) { // 挂载的位置
                         // 1. 创建vnode ，根据组件创建虚拟节点
                         let vnode = createVnode(rootComponent,rootProps)
                         //渲染
                         render(vnode,container)
                         app._container = container
                     }
                 }
                 return app
             }
         }
         
         
         // 创建虚拟节点 createVnode方法，这个方法我写到了vnode.ts文件里
         // 这里的createVnode 就类似于h函数
         // 这里的ShapeFlags方法是通过枚举的位移操作符，通过二进制的&和|的性质来判断类型，这个文件也会在下面展现出来
         import { ShapeFlags, isArray, isObject, isString } from "@vue/shared"
         export const createVnode(type, props, children = null) => { // 参数为 组件，对应的属性，和孩子节点或是插槽
             // 来 区分 是组件还是元素
             let shapeFlag = isString(type)?ShapeFlags.ELEMENT:isObject(type)?ShapeFlags.STATEFUL_COMPONENT:0
             const vnode = { // 因为 虚拟dom的本质就是一个对象
                 _v_isVnode:true, // 是不是一个虚拟节点
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
         
         function normalizeChildren(vnode,children) {
             let type = 0 //先定义一个标识
             if(children == null) {
                 children = null
             }else if(isArray(children)) { // 数组
                 type = ShapeFlags.ARRAY_CHILDREN
             } else { // 文本
                 type =ShapeFlags.TEXT_CHILDREN
             }
             vnode.shapeFlag = vnode.shapeFlag | type // 合并标识
         }
         
         
         
         // ShapeFlags文件
         // 位移运算符 判断是不是组件
         // 1<<1  向左移动一位 
         export const enum ShapeFlags { 
             ELEMENT = 1,
             FUNCTIONAL_COMPONENT = 1 << 1, //00000010  2
             STATEFUL_COMPONENT = 1 << 2, //00000100  4
             TEXT_CHILDREN = 1 << 3, //00001000  8
             ARRAY_CHILDREN = 1 << 4,
             SLOTS_CHILDREN = 1 << 5,
             TELEPORT = 1 << 6,
             SUSPENSE = 1 << 7,
             COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
             COMPONENT_KEPT_ALIVE = 1 << 9,
             COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
         }
         /**
          * 组件 COMPONENT
             ShapeFlags.STATEFUL_COMPONENT：00000100
             ShapeFlags.FUNCTIONAL_COMPONENT:00000010
             COMPONENT = 00000100 | 00000010 => 00000110
          */
         
         
         
         // 上面提到的创建dom的方法
         import { ShapeFlags } from "@vue/shared"
         export const crteatComponentInstance = (InitialVnode) => {
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
         
         export const setupComponent = (instance) => {
             const {props,children} = instance.InitialVnode
              instance.props = props
            	instance.children = children // slots 插槽
              // 判断这个组件有没有setup
              let shapeFlag = instance.InitialVnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
               if(shapeFlag) { // 有状态的组件
                 setupStateComponent(instance)
            }
         }
         
         
         //-------- 下面的代理配置项，单独放到了componentPubilcInstance.ts文件里--------
         import { hasOwn } from "@vue/shared"
         // instance.ctx = {_:instance}
         const componentPubilcInstance = {
             get({_:instance}，key) {
                 const {prpos,setupState} = instance
                 if(key[0] === '$') { // 属性$开头的不能获取
                     return
                 }
                 if(hasOwn(props,key)) {
                     return props[key]
                 } else if(hasOwn(setupState,key) {
                     	return setupState[key]      
                 }
             },
             set({_:instance},key,value) {
                    const {props,setupState} = instance
                    if(hasOwn(props,key)) {
                        props[key] = value
                    } else if(hasOwn(setupState,key)) {
                        setupState[key] = value
                    }
                 }
             }
         }
         //-------------------------------------------------------------------------
         
         
         // 处理setup
         function setupStateComponent(instance) {
             instance.proxy = new Proxy(instance.ctx,componentPubilcInstance) //将实例中的ctx进行代理，方便操作取值 componentPubilcInstance就是配置项
             // setup 的返回值 是render函数的参数
             let Component = instance.type
             let {setup} = Component
             if(setup) {
                 let setupContext = createContext(instance)
                 let setupResult = setup(instance.props,setupContext)
                  handlerSetupResult(instance,setupResult) // 判断返回值是对象还是函数，对象就把结果放到instance.setupState上，如果是 函数，那么就是render函数
             } else {
                 finishComponentSetup(instance)
             }
             Component.render(instance.proxy)
         }
         function handlerSetupResult(instance,setupResult) {
             if(isObject(setupResult)) { // 是对象
                  instance.setupState = setupResult
             } 
              if(isFunction(setupResult)) { // 是函数
                 instance.render = setupResult
             }
         	// 执行render方法
             finishComponentSetup(instance)
         }
         
         // 处理render
         function finishComponentSetup(instance) {
              let Component = instance.type
              if(!instance.render) { // render存在
                  if(!Component.render&&Component.template) { 
                      // 将template编译成render函数
                  }
                  instance.render = Component.render
              }
             insrance.render()
         }
         
         
         function createContext(instance) {
             return {
                 attrs:instance.attrs,
                 slots:instance.children,
                 emit:()=> {},
                 expose:()=>{}
             }
         }
         
         
         
         
         // 把节点变成vnode h函数
         const isVnode = (vnode) =>{
              return vnode._v_isVnode
         }
         export function h(type,propsOrchildren,children = null) {
             const l =arguments.length // 拿到参数的长度
             if(l ===2) {//就是有两个参数
              	 // 元素+ 属性   元素 + children    两种可能
                 if(isObject(propsOrchildren) && !isArray(propsOrchildren)) {
                 	    if(isVnode(propsOrchildren)) {// 是虚拟dom
                             createVnode(type,null,[propsOrchildren])
                         }
                      return createVnode(type,propsOrchildren)
         		} else {
                     return createVnode(type,null,propsOrchildren)
                 }
             } else {
                 if(l > 3) {
                     children = Array.prototype.slice.call(arguments,2) // 拿到多有child的参数
                     
                 } else if(l === 3) {
                     children = [children]
                 }
                 return createVnode(type,propsOrchildren,children)
             }
             
         }
         ```
         
      5. vue3的生命周期都是在setup里面进行执行的，setup函数就相当于vue2中的beforeCreate和created，onMounted，onBeforeMount，onUpdated，onBeforeUpdate，unMounted，unBeforeMount
      
         ```js
         // 生命周期
         // 利用ts的枚举特效，对数据进行映射
         // 获取当前实例
         export const getCurrentInstance = () => {
             return  currentInstance
         }
         // 设置当前实例
         export const setCurrentInstance = (target:any) => {
             currentInstance = target
         }
          const enum lifeCycle{
             BEFORE_MOUNT = 'bm',
             MOUBTED = 'm',
             BEFOREM_UNPDATE = 'bu',
             UPDATE ='u',
          }
          function injectHook(lifeCycle,hook,target) => {
              if(!target) return
              const hooks = target[lifeCycle] || (target[lifeCycle] =[])
              // 函数劫持
              const rap = {
                  setCurrentInstance(target)
                  hook()
                  setCurrentInstance(null)
              }
              hooks.push(rap)
          }
          function createHook(lifeCycle) {
              return function(hook,target = currentInstance) { // 在vue3中的生命周期函数中，可以调用全局的实例
                  injectHook(lifeCycle,hook,target)
              }
          }
          export  const onBeforeMount = createHook(lifeCycle.BEFORE_MOUNT)
          export  const onMounted = createHook(lifeCycle.MOUBTED)
          export  const onBeforeUpdate =createHook(lifeCycle.BEFOREM_UNPDATE)
          export  const onUpdated = createHook(lifeCycle.UPDATE)
          
          export function invokeArrayFns(arr) {
              arr.forEach(fn => fn())
          }
         ```
      
         
