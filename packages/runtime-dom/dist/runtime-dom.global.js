var VueRunTimeDom = (function (exports) {
    'use strict';

    const extend = Object.assign;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const hasOwn = (val, key) => hasOwnProperty.call(val, key);
    const isArray = Array.isArray;
    const isFunction = (val) => typeof val === 'function';
    const isString = (val) => typeof val === 'string';
    const isObject = (val) => val !== null && typeof val === 'object';
    // 判断数组的key 是不是一个整数
    const isIntegerKey = (key) => parseInt(key) + '' === key;
    //判断两个值是否相等
    const hasChanged = (value, oldval) => value !== oldval;

    // 操作节点 增删改查
    const nodeOps = {
        // 操作元素
        // 创建元素
        createElement: (tagName) => document.createElement(tagName),
        // 删除元素
        remove: (child) => {
            let parent = child.parentNode;
            if (parent) {
                parent.removeChild(child);
            }
        },
        // 插入元素
        insert: (child, parent, ancher = null) => {
            parent.insertBefore(child, ancher); //如果ancher为null的时候，就类似于appendChild追加子元素
        },
        //获取元素
        querySlecter: (select) => document.querySelector(select),
        // 获取元素文本
        setElementText: (el, text) => el.textContent = text,
        // 操作文本
        //创建文本
        createText: (text) => document.createTextNode(text),
        //设置文本
        setText: (node, text) => node.nodevalue(text),
    };

    // 处理 class样式
    const patchClass = (el, value) => {
        if (value === '') {
            value = '';
        }
        el.className = value;
    };

    // style 的处理
    const patchStyle = (el, prev, next) => {
        const style = el.style;
        if (next === null) {
            el.removeAttribute('style');
        }
        else {
            // 旧的有，新的没有
            if (prev) {
                for (let k in prev) {
                    if (next[k]) {
                        style[k] = '';
                    }
                }
            }
            // 新的有
            for (let k in next) {
                style[k] = next[k];
            }
        }
    };

    // 自定义属性
    const pathAttr = (el, key, value) => {
        if (value === null) {
            el.removeAttribute(key);
        }
        else {
            el.removeAttribute(key, value);
        }
    };

    // 处理事件
    const pathEvent = (el, key, value) => {
        // 1. 对函数进行缓存
        const invokers = el._vei || (el._vet = {});
        const exists = invokers[key];
        if (exists && value) { // 缓存的函数表中有
            exists.value = value;
        }
        else {
            const eventName = key.slice(2).toLowerCase();
            if (value) {
                let invoker = invokers[eventName] = createInvoker(value);
                el.addEventListener(eventName, invoker);
            }
            else { // 没有 ，删除之前的
                el.removeEventListener(eventName, exists);
                invokers[eventName] = undefined;
            }
        }
    };
    function createInvoker(value) {
        const invoker = (e) => {
            invoker.value(e);
        };
        invoker.value = value;
        return invoker;
    }

    // 操作属性
    const patchProp = (el, key, prevValue, nextValue) => {
        switch (key) {
            case 'class':
                patchClass(el, prevValue);
                break;
            case 'style':
                patchStyle(el, prevValue, nextValue);
                break;
            default:
                if (/^on[^a-z]/.test(key)) { // 是不是事件
                    pathEvent(el, key, nextValue);
                }
                else {
                    pathAttr(el, key, nextValue);
                }
                break;
        }
    };

    // 创建vnode
    // createVnode = h函数
    const createVnode = (type, props, children = null) => {
        // 区分 是组件还是元素
        let shapeFlag = isString(type) ? 1 /* ShapeFlags.ELEMENT */ : isObject(type) ? 4 /* ShapeFlags.STATEFUL_COMPONENT */ : 0;
        const vnode = {
            _v_isVnode: true,
            type,
            props,
            children,
            key: props && props.key,
            el: null,
            component: {},
            shapeFlag
        };
        //children 标识
        normalizeChildren(vnode, children);
        return vnode;
    };
    function normalizeChildren(vnode, children) {
        let type = 0;
        if (children == null) {
            children = null;
        }
        else if (isArray(children)) { // 数组
            type = 16 /* ShapeFlags.ARRAY_CHILDREN */;
        }
        else { // 文本
            type = 8 /* ShapeFlags.TEXT_CHILDREN */;
        }
        vnode.shapeFlag = vnode.shapeFlag | type; // 合并标识
    }
    function isVnode(vnode) {
        return vnode._v_isVnode;
    }
    const TEXT = Symbol('test');
    function CVnode(child) {
        if (isObject(child))
            return child;
        return createVnode(TEXT, null, String(child));
    }

    // 将组件转换为虚拟dom
    function ApiCreateApp(render) {
        return function createApp(rootComponent, rootProps) {
            let app = {
                // 添加相关的属性
                _component: rootComponent,
                _props: rootProps,
                _container: null,
                mount(container) {
                    // 1. 创建vnode ，根据组件创建虚拟节点
                    let vnode = createVnode(rootComponent, rootProps);
                    // console.log(vnode);
                    //渲染
                    render(vnode, container);
                    app._container = container;
                }
            };
            return app;
        };
    }

    const componentPubilcInstance = {
        get({ _: instance }, key) {
            const { props, setupState } = instance;
            if (key[0] === '$') { // 属性$开头的不能获取
                return;
            }
            if (hasOwn(props, key)) {
                return props[key];
            }
            else if (hasOwn(setupState, key)) {
                return setupState[key];
            }
        },
        set({ _: instance }, key, value) {
            const { props, setupState } = instance;
            if (hasOwn(props, key)) {
                props[key] = value;
            }
            else if (hasOwn(setupState, key)) {
                setupState[key] = value;
            }
        }
    };

    const getCurrentInstance = () => {
        return currentInstance;
    };
    const setCurrentInstance = (target) => {
        currentInstance = target;
    };
    // 创建一个组件实例
    const crteatComponentInstance = (InitialVnode) => {
        const instance = {
            InitialVnode,
            type: InitialVnode.type,
            props: {},
            attrs: {},
            setupState: {},
            ctx: {},
            proxy: {},
            render: false,
            isMounted: false, // 是否挂载 
        };
        instance.ctx = { _: instance };
        return instance;
    };
    // 解析数据到组件实例
    const setupComponent = (instance) => {
        const { props, children } = instance.InitialVnode;
        instance.props = props;
        instance.children = children; // slots 插槽
        // 判断这个组件有没有setup
        let shapeFlag = instance.InitialVnode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */;
        if (shapeFlag) { // 有状态的组件
            setupStateComponent(instance);
        }
    };
    // 处理 setup
    let currentInstance;
    function setupStateComponent(instance) {
        instance.proxy = new Proxy(instance.ctx, componentPubilcInstance); // 方便取值
        // setup 的返回值 是render函数的参数
        let Component = instance.type;
        let { setup } = Component;
        if (setup) { // 判断setup是否存在
            let setupContext = createContext(instance);
            // 在 setup之前创建全局的实例
            currentInstance = instance;
            let setupResult = setup(instance.props, setupContext);
            currentInstance = null;
            handlerSetupResult(instance, setupResult); // 判断返回值是对象还是函数，对象就把结果放到instance.setupState上，如果是 函数，那么就是render函数
        }
        else {
            // 调用render
            finishComponentSetup(instance);
        }
        // Component.render(instance.proxy)
    }
    // 处理setup 的返回结果
    function handlerSetupResult(instance, setupResult) {
        if (isObject(setupResult)) {
            instance.setupState = setupResult;
        }
        if (isFunction(setupResult)) {
            instance.render = setupResult;
        }
        // 执行render方法
        finishComponentSetup(instance);
    }
    // 处理render
    function finishComponentSetup(instance) {
        let Component = instance.type;
        console.log(Component, instance);
        if (!instance.render) {
            if (!Component.render && Component.template) ;
            instance.render = Component.render;
        }
        instance.render(instance.proxy);
    }
    function createContext(instance) {
        return {
            attrs: instance.attrs,
            slots: instance.children,
            emit: () => { },
            expose: () => { }
        };
    }

    // effect 收集依赖
    function effect(fn, options = {}) {
        const effect = createReactEffect(fn, options);
        if (!options.lazy) {
            effect();
        }
        return effect;
    }
    let uid = 0;
    let activeEffect; //保存当前的effect
    const effectStack = []; //定义一个栈结构 来解决effect的树结构
    function createReactEffect(fn, options) {
        const effect = function reactiveEffect() {
            // 防止多个effect嵌套
            if (!effectStack.includes(effect)) { // 确保effect 没有入栈
                try {
                    // 入栈
                    effectStack.push(effect);
                    activeEffect = effect;
                    return fn();
                }
                finally {
                    // 出栈
                    effectStack.pop();
                    activeEffect = effectStack[effectStack.length - 1];
                }
            }
        };
        effect.id = uid++; // 区别effect作用者
        effect._isEffect = true; // 区分effect 是不是响应式的
        effect.raw = fn; //保存用户的方法
        effect.options = options; //保存用户的配置项
        return effect;
    }
    // 收集effect 触发get的时候 收集effect
    let targetMap = new WeakMap(); // 创建结构表
    function Track(target, type, key) {
        // 对应的key 
        // key 和 effect 一一对应  map => key =>target对象 value => [effect] set
        if (activeEffect === undefined) { //没有effect中使用
            return;
        }
        // 获取effect
        let depMap = targetMap.get(target);
        if (!depMap) {
            targetMap.set(target, (depMap = new Map));
        }
        let dep = depMap.get(key);
        if (!dep) { //没有属性
            depMap.set(key, (dep = new Set));
        }
        if (!dep.has(activeEffect)) {
            dep.add(activeEffect);
        }
        // console.log(targetMap);
    }
    function trigger(target, type, key, newValue, oldValue) {
        // console.log(target,key,type,newValue,oldValue);
        const depsMap = targetMap.get(target); //Map
        // 收集依赖结构表中没有这个对象
        if (!depsMap)
            return;
        //有
        let effectSet = new Set(); // 避免重复，减少执行次数
        const add = (effectAdd) => {
            if (effectAdd) {
                effectAdd.forEach((effect) => effectSet.add(effect));
            }
        };
        // 处理数组 当key为lenght的时候   就是修改数组的length
        if (key === 'length' && isArray(target)) {
            depsMap.forEach((dep, key) => {
                if (key === 'length' || key >= newValue) {
                    add(dep);
                }
            });
        }
        else {
            // 可能是对象
            if (key != undefined) {
                add(depsMap.get(key));
            }
            // 数组 通过索引来修改
            switch (type) {
                case "add" /* TriggerOpTypes.ADD */:
                    if (isArray(target) && isIntegerKey(key)) {
                        add(depsMap.get('length'));
                    }
            }
        }
        effectSet.forEach((effect) => {
            if (effect.options.sch) {
                effect.options.sch(); // 此时_dirty = true
            }
            else {
                effect();
            }
        });
    }

    /**
     *
     * @param isReadonly 是否只读
     * @param shallow  是否是浅代理
     * @returns  get函数 有三个参数分别是target：目标对象，key：目标对象的属性 receiver：目标对象的实例
     */
    function createGetter(isReadonly = false, shallow = false) {
        return function get(target, key, receiver) {
            const res = Reflect.get(target, key, receiver); // target[k]
            if (!isReadonly) {
                // 收集依赖
                Track(target, "get" /* TrackOpTypes.GET */, key);
            }
            if (shallow) {
                return res;
            }
            if (isObject(res)) { // key是一个对象的时候
                return isReadonly ? readonly(res) : reactive(res); // 递归
            }
            return res;
        };
    }
    const get = createGetter();
    const shallowGet = createGetter(false, true);
    const readonlyGet = createGetter(true, false);
    const shallowReadonlyGet = createGetter(true, true);
    function createSetter(shallow = false) {
        return function (target, key, value, receiver) {
            const oldvalue = target[key];
            const result = Reflect.set(target, key, value, receiver);
            let haskey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
            if (!haskey) { // 数组新增
                trigger(target, "add" /* TriggerOpTypes.ADD */, key, value);
            }
            else if (hasChanged(value, oldvalue)) { // 数组修改,当新值与原来的值一样的时候
                trigger(target, "set" /* TriggerOpTypes.SET */, key, value);
            }
            return result;
        };
    }
    const set = createSetter();
    const shallowSet = createSetter(true);
    const reactiveHandlers = {
        get,
        set
    };
    const readonlyHandlers = {
        get: readonlyGet,
        set: () => {
            console.log('只读！！！无法修改值');
        }
    };
    const shallowReactiveHandlers = {
        get: shallowGet,
        set: shallowSet
    };
    const shallowReadonlyHandlers = {
        get: shallowReadonlyGet,
        set: () => {
            console.log('只读！！！无法修改值改值');
        }
    };

    //四个方法的注重点 ： 1.是不是可读 2.是不是深代理
    // 核心proxy 源码中采用高阶函数的柯里化
    function reactive(target) {
        return createReactObj(target, false, reactiveHandlers);
    }
    function shallowReactive(target) {
        return createReactObj(target, false, shallowReactiveHandlers);
    }
    function readonly(target) {
        return createReactObj(target, true, readonlyHandlers);
    }
    function shallowReadonly(target) {
        return createReactObj(target, true, shallowReadonlyHandlers);
    }
    //核心代理的实现
    //数据结构，用来收集被代理的数据，避免重复代理
    const reactiveMap = new WeakMap(); // 类似于map，但是这个key必须是对象，并且会自动的垃圾回收
    const readonlyMap = new WeakMap();
    function createReactObj(target, isReadonly, baseHandlers) {
        if (!isObject(target)) {
            return target;
        }
        const proxymap = isReadonly ? readonlyMap : reactiveMap;
        const proxyEs = proxymap.get(target); //proxymap中是否存在被代理的target
        if (proxyEs) {
            return proxyEs;
        }
        const proxy = new Proxy(target, baseHandlers);
        proxymap.set(target, proxy);
        return proxy;
    }

    function ref(rawValue) {
        return createRef(rawValue);
    }
    // 创建RefImpl类
    class RefImpl {
        rawValue;
        shallow;
        // 属性
        _v_isRef = true;
        _value;
        constructor(rawValue, shallow) {
            this.rawValue = rawValue;
            this.shallow = shallow;
            this._value = rawValue;
        }
        // 类的属性访问器
        get value() {
            Track(this, "get" /* TrackOpTypes.GET */, 'value');
            return this._value;
        }
        set value(newValue) {
            if (hasChanged(newValue, this._value)) {
                this._value = newValue;
                this.rawValue = newValue;
                trigger(this, "set" /* TriggerOpTypes.SET */, 'value', newValue);
            }
        }
    }
    function createRef(rawValue, shallow = false) {
        return new RefImpl(rawValue, shallow);
    }
    // toRef 将我们的目标对象的某个属性变成 ref，如果这个属性目标对象不是响应式，那么toRef也不具备响应式
    function toRef(target, key) {
        return new ObjectRefImpl(target, key);
    }
    class ObjectRefImpl {
        target;
        key;
        _v_isRef = true;
        _object;
        constructor(target, key) {
            this.target = target;
            this.key = key;
            this._object = target[key];
        }
        get value() {
            return this._object;
        }
        set value(newValue) {
            this._object = newValue;
            this.target[this.key] = newValue;
        }
    }
    // toRefs 将将我们的目标对象的所有属性变成 ref
    function toRefs(target) {
        let res = isArray(target) ? new Array(target.length) : {};
        for (let key in target) {
            res[key] = toRef(target, key);
        }
        return res;
    }

    // computed计算属性有两个参数，一个是
    function computed(getterOrOptions) {
        let getter;
        let setter;
        if (isFunction(getterOrOptions)) {
            getter = getterOrOptions;
            setter = () => {
                console.warn('computed value must be readonly');
            };
        }
        else {
            getter = getterOrOptions.get;
            setter = getterOrOptions.set;
        }
        return new ComputedRefImpl(getter, setter);
    }
    class ComputedRefImpl {
        setter;
        _v_isReadonly = true;
        _v_isRef = true;
        _dirty = true;
        _value;
        effect;
        constructor(getter, setter) {
            this.setter = setter;
            this.effect = effect(getter, {
                lazy: true,
                sch: () => {
                    if (!this._dirty) {
                        this._dirty = true;
                    }
                }
            });
        }
        get value() {
            // 获取执行
            if (this._dirty) {
                this._value = this.effect();
                this._dirty = false;
            }
            return this._value;
        }
        set value(newValue) {
            this.setter(newValue);
        }
    }

    const injectHook = (lifeCycle, hook, target) => {
        if (!target)
            return;
        const hooks = target[lifeCycle] || (target[lifeCycle] = []);
        // 切片化 函数劫持
        const rap = () => {
            setCurrentInstance(target);
            hook(); // 执行说明周期前，存放一些当前实例
            setCurrentInstance(null);
        };
        hooks.push(rap);
    };
    function createHook(lifeCycle) {
        return function (hook, target = currentInstance) {
            injectHook(lifeCycle, hook, target);
        };
    }
    const onBeforeMount = createHook("bm" /* lifeCycle.BEFORE_MOUNT */);
    const onMounted = createHook("m" /* lifeCycle.MOUBTED */);
    const onBeforeUpdate = createHook("bu" /* lifeCycle.BEFOREM_UNPDATE */);
    const onUpdated = createHook("u" /* lifeCycle.UPDATE */);
    function invokeArrayFns(arr) {
        arr.forEach(fn => fn());
    }

    function createRender(renderOptionsDom) {
        // 获取全部的dom操作
        const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, forcePatchProp: hostForcePatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, } = renderOptionsDom;
        function setupRenderEffect(instance, container) {
            // 创建effect 在effect中调用render方法，render就能收集依赖
            effect(function componentEffect() {
                if (!instance.isMounted) { // 第一次加载
                    // 渲染之前
                    let { bm, m } = instance;
                    if (bm) {
                        invokeArrayFns(bm);
                    }
                    // 获取到render的返回值
                    let proxy = instance.proxy;
                    let subTree = instance.subTree = instance.render.call(proxy, proxy); // 执行render,在组件中创建dom节点
                    //将h函数返回的vnode渲染到页面
                    patch(null, subTree, container);
                    // 渲染完成
                    if (m) {
                        invokeArrayFns(m);
                    }
                    instance.isMounted = true;
                }
                else {
                    // 更新操作
                    let { u, bu } = instance;
                    // 更新前
                    if (bu) {
                        invokeArrayFns(bu);
                    }
                    let proxy = instance.proxy;
                    const prevTree = instance.subTree;
                    const nextTree = instance.render.call(proxy, proxy);
                    instance.subTree = nextTree;
                    patch(prevTree, nextTree, container);
                    // 更新后
                    if (u) {
                        invokeArrayFns(u);
                    }
                }
            });
        }
        //----------------- 处理文本-----------------
        const processtext = (n1, n2, container) => {
            if (n1 === null) {
                // 创建文本 =》真实dom =》 加载到页面
                n2.el = hostCreateText(n2.children);
                hostInsert(n2.el, container);
            }
        };
        //-------------- 处理组件 ------------------
        // 组件渲染的流程
        const mountComponent = (InitialVnode, container) => {
            // 1. 先有一个组件的实例对象
            const instance = InitialVnode.component = crteatComponentInstance(InitialVnode);
            // 2.解析数据到这个实例对象中
            setupComponent(instance);
            // 3.创建一个effect ，让render函数执行
            setupRenderEffect(instance, container);
        };
        // 组件的创建
        const processComponent = (n1, n2, container) => {
            if (n1 === null) { // 第一次加载
                mountComponent(n2, container);
            }
        };
        // -------------- 处理元素 ---------------
        const mountChildren = (el, children) => {
            children.forEach((item) => {
                let child = CVnode(item);
                patch(null, child, el);
            });
        };
        const mountElement = (n2, container, ancher) => {
            // 递归渲染  =》 真实dom =》 放到对应的页面
            const { props, shapeFlag, type, children } = n2;
            // 创建元素
            let el = n2.el = hostCreateElement(type);
            //添加属性
            if (props) {
                for (let k in props) {
                    hostPatchProp(el, k, null, props[k]);
                }
            }
            // 处理children
            if (children) {
                if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                    // 创建文本元素
                    hostSetElementText(el, children);
                }
                else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                    // 递归
                    mountChildren(el, children);
                }
            }
            // 加载到对应的位置
            hostInsert(el, container, ancher);
        };
        //--------------------diff比对----------------------------------
        // 属性比对
        const patchProps = (oldProps, newProps, el) => {
            if (oldProps != newProps) { // 属性不相同的时候
                for (let k in newProps) {
                    const prev = oldProps[k];
                    const next = newProps[k];
                    if (prev != next) {
                        hostPatchProp(el, k, prev, next);
                    }
                }
            }
            for (let k in oldProps) {
                if (!(k in newProps)) {
                    hostPatchProp(el, k, oldProps[k], null);
                }
            }
        };
        // 最长递增子序列
        function getSequence(arr) {
            let len = arr.length;
            let start, end, mid;
            let result = [0];
            let p = arr.slice(0);
            for (let i = 0; i < len; i++) {
                const arrI = arr[i];
                if (arrI !== 0) {
                    let resultLastIndex = result[result.length - 1];
                    if (arrI > arr[resultLastIndex]) {
                        p[i] = resultLastIndex;
                        result.push(i);
                        continue;
                    }
                    // 二分查找
                    start = 0;
                    end = result.length - 1;
                    while (start < end) {
                        mid = (start + end) / 2 | 0;
                        if (arr[result[mid]] < arrI) {
                            start = mid + 1;
                        }
                        else {
                            end = mid;
                        }
                    }
                    if (arrI < arr[result[start]]) {
                        if (start > 0) {
                            p[i] = result[start - 1];
                        }
                        result[start] = i;
                    }
                }
            }
            // 驱节点 向前查找
            start = result.length;
            end = result[start - 1];
            while (start-- > 0) {
                result[start] = end;
                end = p[end];
            }
            return result;
        }
        // 儿子都是数组的情况
        const patchKeyChild = (c1, c2, el) => {
            // vue3比对规则：从头部开始比对，遇到不相同的就停止比对，然后从尾部开始比对，那个数组没有了就停止比对
            let i = 0; // 记录指针位置
            let l1 = c1.length - 1;
            let l2 = c2.length - 1;
            //async form start: 头部比对
            while (i <= l1 && i <= l2) {
                const n1 = c1[i];
                const n2 = c2[i];
                if (isSomeVnode(n1, n2)) {
                    patch(n1, n2, el);
                }
                else {
                    break;
                }
                i++;
            }
            // async form end ： 尾部开始比对
            while (i <= l1 && i <= l2) {
                const n1 = c1[l1];
                const n2 = c2[l2];
                if (isSomeVnode(n1, n2)) {
                    patch(n1, n2, el);
                }
                else {
                    break;
                }
                l1--;
                l2--;
            }
            if (i > l1) { // 新比旧的多
                // 添加数据
                const next = l2 + 1; // 插入的位置
                const ancher = next < c2.length ? c2[next].el : null;
                while (i <= l2) {
                    patch(null, c2[i++], el, ancher);
                }
            }
            else if (i > l2) { // 旧比新的多
                while (i <= l1) {
                    unmount(c1[i++]); // 删除多出来的的数据
                }
            }
            else { // 乱序
                // vue3 解决思路  用新的乱序的数据创建一个乱序的映射表，用旧的乱序的数据，去新的里面找，找到就复用，没有就删除
                let s1 = i;
                let s2 = i;
                // 解决乱序对比之后的问题：没有更新到对应的位置，创建的元素，没有插入
                const toBePatched = l2 - s2 + 1;
                const newIndexToPatchMap = new Array(toBePatched).fill(0);
                // 创建表
                let keyIndexMap = new Map();
                for (let i = s2; i <= l2; i++) {
                    keyIndexMap.set(c2[i].key, i);
                }
                for (let i = s1; i <= l1; i++) {
                    let newIndex = keyIndexMap.get(c1[i].key);
                    if (newIndex) {
                        newIndexToPatchMap[newIndex - s2] = i + 1;
                        patch(c1[i], c2[newIndex], el);
                    }
                    else {
                        unmount(c1[i]);
                    }
                }
                // 
                const increasingNewIndexSequence = getSequence(newIndexToPatchMap);
                let j = increasingNewIndexSequence.length - 1;
                for (let i = toBePatched - 1; i >= 0; i--) {
                    let currentIndex = i + s2;
                    let child = c2[currentIndex];
                    let ancher = currentIndex + 1 > c2.length ? c2[currentIndex + 1].el : null;
                    if (newIndexToPatchMap[i] === 0) {
                        patch(null, child, el, ancher);
                    }
                    else {
                        if (i !== increasingNewIndexSequence[j]) { // 不同就移动插入到相应位置
                            hostInsert(child.el, el, ancher);
                        }
                        else { // 相同就不需要移动
                            j--;
                        }
                    }
                }
            }
        };
        // chiid比对 
        const patchChild = (n1, n2, el) => {
            const c1 = n1.children;
            const c2 = n2.children;
            const prevShapeFlage = n1.shapeFlag;
            const nextShapeFlage = n2.shapeFlag;
            if (nextShapeFlage & 8 /* ShapeFlags.TEXT_CHILDREN */) { // 文本的情况
                if (prevShapeFlage & 16 /* ShapeFlags.ARRAY_CHILDREN */) ;
                else {
                    hostSetElementText(el, c2);
                }
            }
            else { // 不是文本，是 数组
                if (prevShapeFlage & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                    patchKeyChild(c1, c2, el);
                }
                else { // 旧的是文本
                    hostSetElementText(el, '');
                    mountChildren(el, c2);
                }
            }
        };
        const pacthElement = (n1, n2, container, ancher) => {
            //  属性 =》 children
            const oldProps = n1.props;
            const newProps = n2.props;
            let el = (n2.el = n1.el);
            patchProps(oldProps, newProps, el);
            // 比对children
            patchChild(n1, n2, el);
        };
        function processElement(n1, n2, container, ancher) {
            if (n1 === null) {
                mountElement(n2, container, ancher);
            }
            else { // 更新
                // 同一个元素比对
                pacthElement(n1, n2);
            }
        }
        // 渲染的操作
        const isSomeVnode = (n1, n2) => {
            return n1.type === n2.type && n1.key === n2.key;
        };
        const unmount = (vnode) => {
            hostRemove(vnode.el);
        };
        const patch = (n1, n2, container, ancher = null) => {
            // 针对不同的类型  
            if (n1 && isSomeVnode(n1, n2)) {
                unmount(n1);
                n1 = null;
            }
            let { shapeFlag, type } = n2;
            switch (type) {
                case TEXT:
                    processtext(n1, n2, container);
                    break;
                default:
                    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) { // 元素
                        processElement(n1, n2, container, ancher);
                    }
                    else if (shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) { //组件
                        processComponent(n1, n2, container);
                    }
            }
        };
        let render = (vnode, container) => {
            // 组件的初始化
            patch(null, vnode, container); // 第一次 渲染
        };
        return {
            createApp: ApiCreateApp(render) // 创建虚拟dom
        };
    }

    // 把节点变成vnode
    function h(type, propsOrchildren, children = null) {
        const len = arguments.length;
        if (len === 2) { //就是有两个参数
            // 元素+ 属性   元素 + children
            if (isObject(propsOrchildren) && !isArray(propsOrchildren)) {
                if (isVnode(propsOrchildren)) {
                    return createVnode(type, null, [propsOrchildren]);
                }
                return createVnode(type, propsOrchildren);
            }
            else {
                return createVnode(type, null, propsOrchildren);
            }
        }
        else {
            if (len > 3) {
                children = Array.prototype.slice.call(arguments, 2);
            }
            else if (len === 3 && isVnode(children)) {
                children = [children];
            }
            return createVnode(type, propsOrchildren, children);
        }
    }

    // runtime-dom 操作dom  1.节点 2. 属性
    // vue3 dom 所有的操作
    const renderOptionsDom = extend({ patchProp }, nodeOps);
    const createApp = (rootComponent, rootProps) => {
        let app = createRender(renderOptionsDom).createApp(rootComponent, rootProps);
        let { mount } = app;
        app.mount = function (container) {
            // 挂载组件
            container = nodeOps.querySlecter(container);
            container.innerHTML = '';
            //  将组件渲染的dom元素进行挂载
            mount(container);
        };
        return app;
    };

    exports.computed = computed;
    exports.createApp = createApp;
    exports.createRender = createRender;
    exports.effect = effect;
    exports.getCurrentInstance = getCurrentInstance;
    exports.h = h;
    exports.invokeArrayFns = invokeArrayFns;
    exports.onBeforeMount = onBeforeMount;
    exports.onBeforeUpdate = onBeforeUpdate;
    exports.onMounted = onMounted;
    exports.onUpdated = onUpdated;
    exports.reactive = reactive;
    exports.readonly = readonly;
    exports.ref = ref;
    exports.shallowReactive = shallowReactive;
    exports.shallowReadonly = shallowReadonly;
    exports.toRef = toRef;
    exports.toRefs = toRefs;

    return exports;

})({});
//# sourceMappingURL=runtime-dom.global.js.map
