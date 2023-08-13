'use strict';

const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
const isArray = Array.isArray;
const isFunction = (val) => typeof val === 'function';
const isObject = (val) => val !== null && typeof val === 'object';
// 判断数组的key 是不是一个整数
const isIntegerKey = (key) => parseInt(key) + '' === key;
//判断两个值是否相等
const hasChanged = (value, oldval) => value !== oldval;

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

exports.computed = computed;
exports.effect = effect;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
exports.toRef = toRef;
exports.toRefs = toRefs;
//# sourceMappingURL=reactivity.cjs.js.map
