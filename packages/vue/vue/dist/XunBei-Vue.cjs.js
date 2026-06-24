'use strict';

function toDisplayString(value) {
  return String(value);
}

var ShapeFlags = /* @__PURE__ */ ((ShapeFlags2) => {
  ShapeFlags2[ShapeFlags2["ELEMENT"] = 1] = "ELEMENT";
  ShapeFlags2[ShapeFlags2["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
  ShapeFlags2[ShapeFlags2["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
  ShapeFlags2[ShapeFlags2["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
  ShapeFlags2[ShapeFlags2["SLOT_CHILDREN"] = 16] = "SLOT_CHILDREN";
  return ShapeFlags2;
})(ShapeFlags || {});

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (value) => {
  return value !== null && typeof value === "object";
};
const isArray = Array.isArray;
const isString = (value) => typeof value === "string";
const hasChanged = (val, newVal) => {
  return !Object.is(val, newVal);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandleKey = (str) => {
  return str ? "on" + capitalize(str) : "";
};
const camelize = (str) => {
  return str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : "";
  });
};

const Fragement = /* @__PURE__ */ Symbol("Fragement");
const Text = /* @__PURE__ */ Symbol("Text");
function isVNode(value) {
  return value ? value.__v_isVNode === true : false;
}
function createVNode(type, props, children) {
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,
    key: props && props.key,
    ShapeFlag: getShapeFlag(type),
    component: null,
    el: null
  };
  if (typeof children === "string") {
    vnode.ShapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.ShapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }
  if (vnode.ShapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === "object") {
      vnode.ShapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }
  return vnode;
}
function createTextVNode(text) {
  return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
  return typeof type === "string" ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}

function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren);
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVNode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}

function renderSlots(slots, name, props) {
  const slot = slots[name];
  if (slot) {
    if (typeof slot === "function") {
      return createVNode(Fragement, {}, slot(props));
    }
  }
}

function initProps(instance, rawProps) {
  instance.props = rawProps || {};
}

const PublicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
  $props: (i) => i.props
};
const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;
    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }
    const publicGetter = PublicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  }
};

let activeEffect;
let shouldTrack;
class ReactiveEffect {
  _fn;
  //是否是computed
  computed;
  //依赖数组
  deps = [];
  //是否可用 响应式
  active = true;
  //清空依赖执行的副作用函数
  onStop;
  scheduler;
  constructor(fn, scheduler) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    if (!this.active) {
      return this._fn();
    }
    shouldTrack = true;
    activeEffect = this;
    const result = this._fn();
    shouldTrack = false;
    return result;
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}
function cleanupEffect(effect2) {
  effect2.deps.forEach((dep) => {
    dep.delete(effect2);
  });
  effect2.deps.length = 0;
}
function effect(fn, options) {
  const scheduler = options && options.scheduler;
  const _effect = new ReactiveEffect(fn, scheduler);
  extend(_effect, options);
  if (!options || !options.lazy) {
    _effect.run();
  }
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
const targetMap = /* @__PURE__ */ new Map();
function track(target, propertyKey) {
  if (!isTracking()) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = /* @__PURE__ */ new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(propertyKey);
  if (!dep) {
    dep = /* @__PURE__ */ new Set();
    depsMap.set(propertyKey, dep);
  }
  trackEffects(dep);
}
function trackEffects(dep) {
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}
function isTracking() {
  return shouldTrack && activeEffect !== void 0;
}
function trigger(target, propertyKey) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(propertyKey);
  if (!dep) {
    return;
  }
  triggerEffects(dep);
}
function triggerEffects(dep) {
  for (const effect2 of dep) {
    if (effect2.scheduler) {
      effect2.scheduler();
    } else {
      effect2.run();
    }
  }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
  return function get2(target, propertyKey) {
    if (propertyKey === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (propertyKey === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target, propertyKey);
    if (shallow) {
      return res;
    }
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    if (!isReadonly) {
      track(target, propertyKey);
    }
    return res;
  };
}
function createSetter() {
  return function set2(target, propertyKey, value) {
    const res = Reflect.set(target, propertyKey, value);
    trigger(target, propertyKey);
    return res;
  };
}
const mutableHandlers = {
  get,
  set
};
const readonlyHandlers = {
  get: readonlyGet,
  set(target, propertyKey) {
    console.warn(
      `key :"${String(propertyKey)}" set \u5931\u8D25\uFF0C\u56E0\u4E3A target \u662F readonly \u7C7B\u578B`,
      target
    );
    return true;
  }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet
});

var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
  ReactiveFlags2["IS_REACTIVE"] = "__v_isReactive";
  ReactiveFlags2["IS_READONLY"] = "__v_isReadonly";
  return ReactiveFlags2;
})(ReactiveFlags || {});
function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(target, baseHandlers) {
  if (!isObject(target)) {
    console.warn(`target :"${target}"\u5FC5\u987B\u662F\u4E00\u4E2A\u5BF9\u8C61`);
    return target;
  }
  return new Proxy(target, baseHandlers);
}
function isReactive(value) {
  return !!value["__v_isReactive" /* IS_REACTIVE */];
}
function isReadonly(value) {
  return !!value["__v_isReadonly" /* IS_READONLY */];
}
function isProxy(value) {
  return isReadonly(value) || isReactive(value);
}

class RefImpl {
  _value;
  dep;
  _rawValue;
  __v_isRef = true;
  constructor(value) {
    this._rawValue = value;
    this._value = convert(value);
    this.dep = /* @__PURE__ */ new Set();
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (hasChanged(this._rawValue, newValue)) {
      this._rawValue = newValue;
      this._value = convert(newValue);
      triggerEffects(this.dep);
    }
  }
}
function convert(value) {
  return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref2) {
  if (isTracking()) {
    trackEffects(ref2.dep);
  }
}
function ref(value) {
  return new RefImpl(value);
}
function isRef(ref2) {
  return !!ref2.__v_isRef;
}
function unRef(ref2) {
  return isRef(ref2) ? ref2.value : ref2;
}
function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, propertyKey) {
      return unRef(Reflect.get(target, propertyKey));
    },
    set(target, propertyKey, value) {
      if (isRef(target[propertyKey]) && !isRef(value)) {
        return target[propertyKey].value = value;
      } else {
        return Reflect.set(target, propertyKey, value);
      }
    }
  });
}

class ComputedRefImpl {
  dep;
  _getter;
  _dirty = true;
  //缓存标识 true：没有缓存值 false:有缓存值
  _value;
  _effect;
  constructor(getter) {
    console.log(this._getter);
    this._getter = getter;
    this.dep = /* @__PURE__ */ new Set();
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        triggerEffects(this.dep);
      }
    });
    this._effect.computed = this;
  }
  get value() {
    trackRefValue(this);
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}
function computed(getter) {
  return new ComputedRefImpl(getter);
}

function emit(instance, event, ...args) {
  const { props } = instance;
  const handleName = toHandleKey(camelize(event));
  const handler = props[handleName];
  handler && handler(...args);
}

function initSlots(instance, children) {
  const { vnode } = instance;
  if (vnode.ShapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}
function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    const value = children[key];
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}
function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    //vnode类型
    next: null,
    //下一个更新的vnode
    setupState: {},
    //setup方法里面返回的属性
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    //provide数据
    parent,
    //父组件 vnode
    isMounted: false,
    subTree: {},
    ///记录上一个vnode节点
    emit: () => {
    }
  };
  component.emit = emit.bind(null, component);
  return component;
}
function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
  const Component = instance.type;
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
  const { setup } = Component;
  if (setup) {
    setCurrentInstance(instance);
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    });
    setCurrentInstance(null);
    handleSetupResult(instance, setupResult);
  }
}
function handleSetupResult(instance, setupResult) {
  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }
  finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
  const Component = instance.type;
  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template);
    }
  }
  instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
  return currentInstance;
}
function setCurrentInstance(instance) {
  currentInstance = instance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
  compiler = _compiler;
}

function inject(key, defaultValue) {
  const currentInstance = getCurrentInstance();
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      if (typeof defaultValue === "function") {
        return defaultValue();
      }
      return defaultValue;
    }
  }
}
function provide(key, value) {
  const currentInstance = getCurrentInstance();
  if (currentInstance) {
    let { provides } = currentInstance;
    const parentProvides = currentInstance.parent.provides;
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}

function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        const vnode = createVNode(rootComponent);
        render(vnode, rootContainer);
      }
    };
  };
}

function shouldUpdateComponent(prevVnode, nextVnode) {
  const { props: prevProps } = prevVnode;
  const { props: nextProps } = nextVnode;
  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}

const queue = [];
const activePreFlushCbs = [];
let isFlushPending = false;
const p = Promise.resolve();
function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
}
function flushJobs() {
  isFlushPending = false;
  let job;
  flushPreCbs();
  while (job = queue.shift()) {
    job && job();
  }
}
function flushPreCbs() {
  for (let i = 0; i < activePreFlushCbs.length; i++) {
    activePreFlushCbs[i]();
  }
}
function queuePreFlushCb(job) {
  activePreFlushCbs.push(job);
  queueFlush();
}
function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flushJobs);
}
function nextTick(fn) {
  return fn ? p.then(fn) : p;
}

function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options;
  function render(vnode, container) {
    patch(null, vnode, container, null, null);
  }
  function patch(n1, n2, container, parentComponent, anchor) {
    const { type, ShapeFlag } = n2;
    switch (type) {
      case Fragement:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (ShapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (ShapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }
  function processFragment(n1, n2, container, parentComponent, anchor) {
    console.log("oldFragment", n1);
    mountChildren(n2.children, container, parentComponent, anchor);
  }
  function processText(n1, n2, container) {
    console.log("oldText", n1);
    const { children } = n2;
    const textNode = n2.el = document.createTextNode(children);
    container.append(textNode);
  }
  function processComponent(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }
  function updateComponent(n1, n2) {
    console.log("2");
    if (shouldUpdateComponent(n1, n2)) {
      const instance = n2.component = n1.component;
      instance.next = n2;
      instance.update();
    } else {
      const instance = n2.component = n1.component;
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }
  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }
  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log("patchElement container", container);
    const el = n2.el = n1.el;
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    patchProps(el, oldProps, newProps);
    patchChildren(n1, n2, el, parentComponent, anchor);
  }
  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];
        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  }
  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapeFlag = n1.ShapeFlag;
    const nextShapeFlag = n2.ShapeFlag;
    const c1 = n1.children;
    const c2 = n2.children;
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(n1.children);
        hostSetElementText(container, c2);
      } else {
        if (c1 !== c2) {
          hostSetElementText(container, c2);
        }
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }
  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
    }
  }
  function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    function isSameVnodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < c2.length ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      const s1 = i;
      const s2 = i;
      const toBePatched = e2 - s2 + 1;
      let patched = 0;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
      let moved = false;
      let maxNewIndexSoFar = 0;
      for (let i2 = s2; i2 <= e2; i2++) {
        const nextChild = c2[i2];
        keyToNewIndexMap.set(nextChild.key, i2);
      }
      for (let i2 = s1; i2 <= e1; i2++) {
        const prevChild = c1[i2];
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }
        let newIndex;
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let j2 = s2; j2 <= e2; j2++) {
            if (isSameVnodeType(prevChild, c2[j2])) {
              newIndex = j2;
              break;
            }
          }
        }
        if (newIndex === void 0) {
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          newIndexToOldIndexMap[newIndex - s2] = i2 + 1;
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
      let j = increasingNewIndexSequence.length - 1;
      for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
        const nextIndex = i2 + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;
        if (newIndexToOldIndexMap[i2] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i2 !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }
  function mountElement(vnode, container, parentComponent, anchor) {
    const el = vnode.el = hostCreateElement(vnode.type);
    const { children, ShapeFlag } = vnode;
    if (ShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (ShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor);
    }
    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, null, val);
    }
    hostInsert(el, container, anchor);
  }
  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }
  function mountComponent(initialVnode, container, parentComponent, anchor) {
    const instance = initialVnode.component = createComponentInstance(
      initialVnode,
      parentComponent
    );
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container, anchor);
  }
  function setupRenderEffect(instance, initialVnode, container, anchor) {
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          console.log("init");
          const { proxy } = instance;
          const subTree = instance.subTree = instance.render.call(
            proxy,
            proxy
          );
          patch(null, subTree, container, instance, anchor);
          initialVnode.el = subTree.el;
          instance.isMounted = true;
        } else {
          console.log("1");
          console.log("update");
          const { next, vnode } = instance;
          if (next) {
            next.el = vnode.el;
            updateComponentPreRender(instance, next);
          }
          const { proxy } = instance;
          const subTree = instance.render.call(proxy, proxy);
          const previousSubTree = instance.subTree;
          instance.subTree = subTree;
          patch(previousSubTree, subTree, container, instance, anchor);
        }
      },
      {
        scheduler() {
          console.log("update scheduler");
          queueJobs(instance.update);
        }
      }
    );
  }
  return {
    createApp: createAppAPI(render)
  };
}
function updateComponentPreRender(instance, nextVnode) {
  instance.vnode = nextVnode;
  instance.next = null;
  instance.props = nextVnode.props;
}
function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = u + v >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}

function watch(source, cb, options) {
  return doWatch(source, cb, options);
}
function doWatch(source, cb, { immediate, deep } = EMPTY_OBJ) {
  let getter;
  if (isReactive(source)) {
    getter = () => source;
    deep = true;
  } else {
    getter = () => {
    };
  }
  if (cb && deep) {
    const baseGetter = getter;
    getter = () => traverse(baseGetter());
  }
  let oldValue = {};
  const job = () => {
    if (cb) {
      const newValue = effect.run();
      if (deep || hasChanged(newValue, oldValue)) {
        cb(newValue, oldValue);
        oldValue = newValue;
      }
    }
  };
  let scheduler = () => queuePreFlushCb(job);
  const effect = new ReactiveEffect(getter, scheduler);
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  } else {
    effect.run();
  }
  return () => {
    effect.stop();
  };
}
function traverse(value, seen) {
  if (!isObject(value)) {
    return value;
  }
  seen = seen || /* @__PURE__ */ new Set();
  seen.add(value);
  for (const key in value) {
    traverse(value[key], seen);
  }
  return value;
}

function createElement(type) {
  return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
  console.log("\u65E7\u7684props", prevVal);
  const isOn = (key2) => /^on[A-Z]/.test(key2);
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextVal);
  } else {
    if (nextVal === void 0 || nextVal === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}
function insert(child, parent, anchor) {
  parent.insertBefore(child, anchor || null);
}
function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}
function setElementText(el, text) {
  el.textContent = text;
}
const renderer = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText
});
function createApp(...args) {
  return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
  __proto__: null,
  ReactiveEffect: ReactiveEffect,
  computed: computed,
  createApp: createApp,
  createElementVNode: createVNode,
  createRenderer: createRenderer,
  createTextVNode: createTextVNode,
  effect: effect,
  getCurrentInstance: getCurrentInstance,
  h: h,
  inject: inject,
  isProxy: isProxy,
  isReactive: isReactive,
  isReadonly: isReadonly,
  isRef: isRef,
  nextTick: nextTick,
  provide: provide,
  proxyRefs: proxyRefs,
  reactive: reactive,
  readonly: readonly,
  ref: ref,
  registerRuntimeCompiler: registerRuntimeCompiler,
  renderSlots: renderSlots,
  shallowReadonly: shallowReadonly,
  toDisplayString: toDisplayString,
  unRef: unRef,
  watch: watch
});

const TO_DISPLAY_STRING = /* @__PURE__ */ Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = /* @__PURE__ */ Symbol("createElementVNode");
const helperMapName = {
  [TO_DISPLAY_STRING]: "toDisplayString",
  [CREATE_ELEMENT_VNODE]: "createElementVNode"
};

var NodeTypes = /* @__PURE__ */ ((NodeTypes2) => {
  NodeTypes2[NodeTypes2["INTERPOLATION"] = 0] = "INTERPOLATION";
  NodeTypes2[NodeTypes2["SIMPLE_EXPRESSION"] = 1] = "SIMPLE_EXPRESSION";
  NodeTypes2[NodeTypes2["ELEMENT"] = 2] = "ELEMENT";
  NodeTypes2[NodeTypes2["TEXT"] = 3] = "TEXT";
  NodeTypes2[NodeTypes2["ROOT"] = 4] = "ROOT";
  NodeTypes2[NodeTypes2["COMPOUND_EXPRESSION"] = 5] = "COMPOUND_EXPRESSION";
  return NodeTypes2;
})(NodeTypes || {});
function createVnodeCall(context, tag, props, children) {
  context.helper(CREATE_ELEMENT_VNODE);
  return {
    type: 2 /* ELEMENT */,
    tag,
    props,
    children
  };
}

function generate(ast) {
  const context = createCodegenContext();
  const { push } = context;
  genFunctionPreamble(ast, context);
  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(", ");
  push(`function ${functionName}(${signature}){`);
  push("return ");
  genNode(ast.codegenNode, context);
  push("}");
  return {
    code: context.code
  };
}
function genFunctionPreamble(ast, context) {
  const { push } = context;
  const VueBinging = "Vue";
  const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelper).join(", ")}}=${VueBinging}`);
  }
  push("\n");
  push("return ");
}
function createCodegenContext() {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapName[key]}`;
    }
  };
  return context;
}
function genNode(node, context) {
  switch (node.type) {
    //处理string类型
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    //处理插值类型
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    //处理表达式
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    //处理标签
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    //处理复合类型
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
  }
}
function genText(node, context) {
  const { push } = context;
  push(`'${node.content}'`);
}
function genInterpolation(node, context) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(`)`);
}
function genExpression(node, context) {
  const { push } = context;
  push(`${node.content}`);
}
function genElement(node, context) {
  const { push, helper } = context;
  const { tag, children, props } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  genNodeList(genNullable([tag, props, children]), context);
  push(")");
}
function genNullable(args) {
  return args.map((arg) => arg || "null");
}
function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else {
      genNode(node, context);
    }
    if (i < nodes.length - 1) {
      push(", ");
    }
  }
}
function genCompoundExpression(node, context) {
  const { push } = context;
  const { children } = node;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
}

function baseParse(content) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context, []));
}
function createParseContext(content) {
  return {
    source: content
  };
}
function createRoot(children) {
  return {
    children,
    type: NodeTypes.ROOT
  };
}
function parseChildren(context, ancestors) {
  const nodes = [];
  while (!isEnd(context, ancestors)) {
    let node;
    const s = context.source;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }
    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}
function isEnd(context, ancestors) {
  const s = context.source;
  if (s.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const currentTag = ancestors[i].tag;
      if (startsWithEndTagOpen(s, currentTag)) {
        return true;
      }
    }
  }
  return !s;
}
function parseElement(context, ancestors) {
  const element = parseTag(context, 0 /* Start */);
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  ancestors.pop();
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, 1 /* End */);
  } else {
    throw new Error("\u7F3A\u5C11\u7ED3\u675F\u6807\u7B7E:" + element.tag);
  }
  return element;
}
function startsWithEndTagOpen(source, tag) {
  return source.startsWith("</") && source.slice(2, 2 + tag.length).toLowerCase() === tag;
}
function parseTag(context, type) {
  const match = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  if (type === 1 /* End */) return;
  return {
    type: NodeTypes.ELEMENT,
    tag,
    children: []
  };
}
function parseText(context) {
  let endIndex = context.source.length;
  let endTokens = ["{{", "<"];
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  const content = parseTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content
  };
}
function parseInterpolation(context) {
  const openDelLimiter = "{{";
  const closeDelLimiter = "}}";
  const closeIndex = context.source.indexOf(
    closeDelLimiter,
    openDelLimiter.length
  );
  advanceBy(context, openDelLimiter.length);
  const rawContentLength = closeIndex - openDelLimiter.length;
  const rawContent = parseTextData(context, rawContentLength);
  const content = rawContent.trim();
  advanceBy(context, closeDelLimiter.length);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content
    }
  };
}
function advanceBy(context, length) {
  context.source = context.source.slice(length);
}
function parseTextData(context, length) {
  const content = context.source.slice(0, length);
  advanceBy(context, length);
  return content;
}

function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  createRootCodegen(root);
  root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
  const child = root.children[0];
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = root.children[0];
  }
}
function createTransformContext(root, options) {
  const context = {
    root,
    //ast转换方法
    nodeTransforms: options.nodeTransforms || [],
    //存储函数的参数
    helpers: /* @__PURE__ */ new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    }
  };
  return context;
}
function traverseNode(node, context) {
  const nodeTransforms = context.nodeTransforms;
  const exitFns = [];
  for (let i2 = 0; i2 < nodeTransforms.length; i2++) {
    const transform2 = nodeTransforms[i2];
    const onExit = transform2(node, context);
    if (onExit) exitFns.push(onExit);
  }
  switch (node.type) {
    //表达式
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    //Root和标签 需要深度递归遍历子节点
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      transformNode(node, context);
      break;
  }
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}
function transformNode(node, context) {
  const children = node.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      const node2 = children[i];
      traverseNode(node2, context);
    }
  }
}

function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const vnodeTag = `'${node.tag}'`;
      let vnodeProps;
      const { children } = node;
      let vnodeChildren = children[0];
      node.codegenNode = createVnodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      );
    };
  }
}

function transformExpression(node) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  }
}
function processExpression(node) {
  node.content = `_ctx.${node.content}`;
  return node;
}

function isTextNode(node) {
  return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION;
}

function transformText(node) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      let currentContainer;
      const { children } = node;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isTextNode(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const nextNode = children[j];
            if (isTextNode(nextNode)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child]
                };
              }
              currentContainer.children.push(" + ");
              currentContainer.children.push(nextNode);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = void 0;
              break;
            }
          }
        }
      }
    };
  }
}

function baseCompile(template) {
  const ast = baseParse(template);
  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText]
  });
  return generate(ast);
}

function compileToFunction(template) {
  const { code } = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}
registerRuntimeCompiler(compileToFunction);

exports.ReactiveEffect = ReactiveEffect;
exports.computed = computed;
exports.createApp = createApp;
exports.createElementVNode = createVNode;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.nextTick = nextTick;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.renderSlots = renderSlots;
exports.shallowReadonly = shallowReadonly;
exports.toDisplayString = toDisplayString;
exports.unRef = unRef;
exports.watch = watch;
