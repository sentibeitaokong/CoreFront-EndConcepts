import {
  Fragment,
  Transition,
  computed,
  createBaseVNode,
  createBlock,
  createCommentVNode,
  createElementBlock,
  createTextVNode,
  createVNode,
  defineComponent,
  getCurrentScope,
  guardReactiveProps,
  h,
  inject,
  isRef,
  mergeProps,
  nextTick,
  normalizeClass,
  normalizeProps,
  normalizeStyle,
  onMounted,
  onScopeDispose,
  onUnmounted,
  openBlock,
  provide,
  reactive,
  ref,
  render,
  renderList,
  renderSlot,
  shallowReactive,
  shallowReadonly,
  shallowRef,
  toDisplayString,
  toHandlers,
  unref,
  useAttrs,
  vModelDynamic,
  vModelText,
  vShow,
  watch,
  withCtx,
  withDirectives,
  withKeys,
  withModifiers
} from "./chunk-TFIIBY6E.js";
import {
  config$1,
  icon,
  library$1,
  parse$1,
  text
} from "./chunk-VYB25A4C.js";
import {
  icons
} from "./chunk-3SKVTWUA.js";

// node_modules/@fortawesome/vue-fontawesome/index.es.js
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _objectWithoutProperties(e, t) {
  if (null == e) return {};
  var o, r, i = _objectWithoutPropertiesLoose(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}
function objectWithKey(key, value) {
  return Array.isArray(value) && value.length > 0 || !Array.isArray(value) && value ? _defineProperty({}, key, value) : {};
}
function classList(props) {
  var _classes;
  var classes = (_classes = {
    "fa-spin": props.spin,
    "fa-pulse": props.pulse,
    // the fixedWidth property has been deprecated as of version 7.0.0
    "fa-fw": props.fixedWidth,
    "fa-border": props.border,
    "fa-li": props.listItem,
    "fa-inverse": props.inverse,
    "fa-flip": props.flip === true,
    "fa-flip-horizontal": props.flip === "horizontal" || props.flip === "both",
    "fa-flip-vertical": props.flip === "vertical" || props.flip === "both"
  }, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_classes, "fa-".concat(props.size), props.size !== null), "fa-rotate-".concat(props.rotation), props.rotation !== null), "fa-rotate-by", props.rotateBy), "fa-pull-".concat(props.pull), props.pull !== null), "fa-swap-opacity", props.swapOpacity), "fa-bounce", props.bounce), "fa-shake", props.shake), "fa-beat", props.beat), "fa-fade", props.fade), "fa-beat-fade", props.beatFade), _defineProperty(_defineProperty(_defineProperty(_defineProperty(_classes, "fa-flash", props.flash), "fa-spin-pulse", props.spinPulse), "fa-spin-reverse", props.spinReverse), "fa-width-auto", props.widthAuto));
  return Object.keys(classes).map(function(key) {
    return classes[key] ? key : null;
  }).filter(function(key) {
    return key;
  });
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var humps$1 = { exports: {} };
(function(module2) {
  (function(global2) {
    var _processKeys = function(convert2, obj, options) {
      if (!_isObject(obj) || _isDate(obj) || _isRegExp(obj) || _isBoolean(obj) || _isFunction(obj)) {
        return obj;
      }
      var output, i = 0, l = 0;
      if (_isArray(obj)) {
        output = [];
        for (l = obj.length; i < l; i++) {
          output.push(_processKeys(convert2, obj[i], options));
        }
      } else {
        output = {};
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            output[convert2(key, options)] = _processKeys(convert2, obj[key], options);
          }
        }
      }
      return output;
    };
    var separateWords = function(string3, options) {
      options = options || {};
      var separator = options.separator || "_";
      var split = options.split || /(?=[A-Z])/;
      return string3.split(split).join(separator);
    };
    var camelize = function(string3) {
      if (_isNumerical(string3)) {
        return string3;
      }
      string3 = string3.replace(/[\-_\s]+(.)?/g, function(match, chr) {
        return chr ? chr.toUpperCase() : "";
      });
      return string3.substr(0, 1).toLowerCase() + string3.substr(1);
    };
    var pascalize = function(string3) {
      var camelized = camelize(string3);
      return camelized.substr(0, 1).toUpperCase() + camelized.substr(1);
    };
    var decamelize = function(string3, options) {
      return separateWords(string3, options).toLowerCase();
    };
    var toString = Object.prototype.toString;
    var _isFunction = function(obj) {
      return typeof obj === "function";
    };
    var _isObject = function(obj) {
      return obj === Object(obj);
    };
    var _isArray = function(obj) {
      return toString.call(obj) == "[object Array]";
    };
    var _isDate = function(obj) {
      return toString.call(obj) == "[object Date]";
    };
    var _isRegExp = function(obj) {
      return toString.call(obj) == "[object RegExp]";
    };
    var _isBoolean = function(obj) {
      return toString.call(obj) == "[object Boolean]";
    };
    var _isNumerical = function(obj) {
      obj = obj - 0;
      return obj === obj;
    };
    var _processor = function(convert2, options) {
      var callback = options && "process" in options ? options.process : options;
      if (typeof callback !== "function") {
        return convert2;
      }
      return function(string3, options2) {
        return callback(string3, convert2, options2);
      };
    };
    var humps2 = {
      camelize,
      decamelize,
      pascalize,
      depascalize: decamelize,
      camelizeKeys: function(object4, options) {
        return _processKeys(_processor(camelize, options), object4);
      },
      decamelizeKeys: function(object4, options) {
        return _processKeys(_processor(decamelize, options), object4, options);
      },
      pascalizeKeys: function(object4, options) {
        return _processKeys(_processor(pascalize, options), object4);
      },
      depascalizeKeys: function() {
        return this.decamelizeKeys.apply(this, arguments);
      }
    };
    if (module2.exports) {
      module2.exports = humps2;
    } else {
      global2.humps = humps2;
    }
  })(commonjsGlobal);
})(humps$1);
var humps = humps$1.exports;
var _excluded = ["class", "style"];
function styleToObject(style) {
  return style.split(";").map(function(s) {
    return s.trim();
  }).filter(function(s) {
    return s;
  }).reduce(function(output, pair) {
    var idx = pair.indexOf(":");
    var prop = humps.camelize(pair.slice(0, idx));
    var value = pair.slice(idx + 1).trim();
    output[prop] = value;
    return output;
  }, {});
}
function classToObject(classes) {
  return classes.split(/\s+/).reduce(function(output, className) {
    output[className] = true;
    return output;
  }, {});
}
function convert(abstractElement) {
  var props = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  var attrs = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof abstractElement === "string") {
    return abstractElement;
  }
  var children = (abstractElement.children || []).map(function(child) {
    return convert(child);
  });
  var mixins = Object.keys(abstractElement.attributes || {}).reduce(function(mixins2, key) {
    var value = abstractElement.attributes[key];
    switch (key) {
      case "class":
        mixins2.class = classToObject(value);
        break;
      case "style":
        mixins2.style = styleToObject(value);
        break;
      default:
        mixins2.attrs[key] = value;
    }
    return mixins2;
  }, {
    attrs: {},
    class: {},
    style: {}
  });
  attrs.class;
  var _attrs$style = attrs.style, aStyle = _attrs$style === void 0 ? {} : _attrs$style, otherAttrs = _objectWithoutProperties(attrs, _excluded);
  return h(abstractElement.tag, _objectSpread2(_objectSpread2(_objectSpread2({}, props), {}, {
    class: mixins.class,
    style: _objectSpread2(_objectSpread2({}, mixins.style), aStyle)
  }, mixins.attrs), otherAttrs), children);
}
var PRODUCTION = false;
try {
  PRODUCTION = false;
} catch (e) {
}
function log() {
  if (!PRODUCTION && console && typeof console.error === "function") {
    var _console;
    (_console = console).error.apply(_console, arguments);
  }
}
function normalizeIconArgs(icon2) {
  if (icon2 && _typeof(icon2) === "object" && icon2.prefix && icon2.iconName && icon2.icon) {
    return icon2;
  }
  if (parse$1.icon) {
    return parse$1.icon(icon2);
  }
  if (icon2 === null) {
    return null;
  }
  if (_typeof(icon2) === "object" && icon2.prefix && icon2.iconName) {
    return icon2;
  }
  if (Array.isArray(icon2) && icon2.length === 2) {
    return {
      prefix: icon2[0],
      iconName: icon2[1]
    };
  }
  if (typeof icon2 === "string") {
    return {
      prefix: "fas",
      iconName: icon2
    };
  }
}
var FontAwesomeIcon = defineComponent({
  name: "FontAwesomeIcon",
  props: {
    border: {
      type: Boolean,
      default: false
    },
    // the fixedWidth property has been deprecated as of version 7
    fixedWidth: {
      type: Boolean,
      default: false
    },
    flip: {
      type: [Boolean, String],
      default: false,
      validator: function validator(value) {
        return [true, false, "horizontal", "vertical", "both"].indexOf(value) > -1;
      }
    },
    icon: {
      type: [Object, Array, String],
      required: true
    },
    mask: {
      type: [Object, Array, String],
      default: null
    },
    maskId: {
      type: String,
      default: null
    },
    listItem: {
      type: Boolean,
      default: false
    },
    pull: {
      type: String,
      default: null,
      validator: function validator2(value) {
        return ["right", "left"].indexOf(value) > -1;
      }
    },
    pulse: {
      type: Boolean,
      default: false
    },
    rotation: {
      type: [String, Number],
      default: null,
      validator: function validator3(value) {
        return [90, 180, 270].indexOf(Number.parseInt(value, 10)) > -1;
      }
    },
    // the rotateBy property is only supported in version 7.0.0 and later
    rotateBy: {
      type: Boolean,
      default: false
    },
    swapOpacity: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: null,
      validator: function validator4(value) {
        return ["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"].indexOf(value) > -1;
      }
    },
    spin: {
      type: Boolean,
      default: false
    },
    transform: {
      type: [String, Object],
      default: null
    },
    symbol: {
      type: [Boolean, String],
      default: false
    },
    title: {
      type: String,
      default: null
    },
    titleId: {
      type: String,
      default: null
    },
    inverse: {
      type: Boolean,
      default: false
    },
    bounce: {
      type: Boolean,
      default: false
    },
    shake: {
      type: Boolean,
      default: false
    },
    beat: {
      type: Boolean,
      default: false
    },
    fade: {
      type: Boolean,
      default: false
    },
    beatFade: {
      type: Boolean,
      default: false
    },
    flash: {
      type: Boolean,
      default: false
    },
    spinPulse: {
      type: Boolean,
      default: false
    },
    spinReverse: {
      type: Boolean,
      default: false
    },
    // the widthAuto property is only supported in version 7.0.0 and later
    widthAuto: {
      type: Boolean,
      default: false
    }
  },
  setup: function setup(props, _ref) {
    var attrs = _ref.attrs;
    var icon$1 = computed(function() {
      return normalizeIconArgs(props.icon);
    });
    var classes = computed(function() {
      return objectWithKey("classes", classList(props));
    });
    var transform = computed(function() {
      return objectWithKey("transform", typeof props.transform === "string" ? parse$1.transform(props.transform) : props.transform);
    });
    var mask = computed(function() {
      return objectWithKey("mask", normalizeIconArgs(props.mask));
    });
    var renderedIcon = computed(function() {
      var iconProps = _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, classes.value), transform.value), mask.value), {}, {
        symbol: props.symbol,
        maskId: props.maskId
      });
      iconProps.title = props.title;
      iconProps.titleId = props.titleId;
      return icon(icon$1.value, iconProps);
    });
    watch(renderedIcon, function(value) {
      if (!value) {
        return log("Could not find one or more icon(s)", icon$1.value, mask.value);
      }
    }, {
      immediate: true
    });
    var vnode = computed(function() {
      return renderedIcon.value ? convert(renderedIcon.value.abstract[0], {}, attrs) : null;
    });
    return function() {
      return vnode.value;
    };
  }
});
var FontAwesomeLayers = defineComponent({
  name: "FontAwesomeLayers",
  props: {
    fixedWidth: {
      type: Boolean,
      default: false
    }
  },
  setup: function setup2(props, _ref) {
    var slots = _ref.slots;
    var familyPrefix = config$1.familyPrefix;
    var className = computed(function() {
      return ["".concat(familyPrefix, "-layers")].concat(_toConsumableArray(props.fixedWidth ? ["".concat(familyPrefix, "-fw")] : []));
    });
    return function() {
      return h("div", {
        class: className.value
      }, slots.default ? slots.default() : []);
    };
  }
});
var FontAwesomeLayersText = defineComponent({
  name: "FontAwesomeLayersText",
  props: {
    value: {
      type: [String, Number],
      default: ""
    },
    transform: {
      type: [String, Object],
      default: null
    },
    counter: {
      type: Boolean,
      default: false
    },
    position: {
      type: String,
      default: null,
      validator: function validator5(value) {
        return ["bottom-left", "bottom-right", "top-left", "top-right"].indexOf(value) > -1;
      }
    }
  },
  setup: function setup3(props, _ref) {
    var attrs = _ref.attrs;
    var familyPrefix = config$1.familyPrefix;
    var classes = computed(function() {
      return objectWithKey("classes", [].concat(_toConsumableArray(props.counter ? ["".concat(familyPrefix, "-layers-counter")] : []), _toConsumableArray(props.position ? ["".concat(familyPrefix, "-layers-").concat(props.position)] : [])));
    });
    var transform = computed(function() {
      return objectWithKey("transform", typeof props.transform === "string" ? parse$1.transform(props.transform) : props.transform);
    });
    var abstractElement = computed(function() {
      var _text = text(props.value.toString(), _objectSpread2(_objectSpread2({}, transform.value), classes.value)), abstract = _text.abstract;
      if (props.counter) {
        abstract[0].attributes.class = abstract[0].attributes.class.replace("fa-layers-text", "");
      }
      return abstract[0];
    });
    var vnode = computed(function() {
      return convert(abstractElement.value, {}, attrs);
    });
    return function() {
      return vnode.value;
    };
  }
});

// node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var sides = ["top", "right", "bottom", "left"];
var alignments = ["start", "end"];
var placements = sides.reduce((acc, side) => acc.concat(side, side + "-" + alignments[0], side + "-" + alignments[1]), []);
var min = Math.min;
var max = Math.max;
var round = Math.round;
var floor = Math.floor;
var createCoords = (v) => ({
  x: v,
  y: v
});
function clamp(start, value, end) {
  return max(start, min(value, end));
}
function evaluate(value, param) {
  return typeof value === "function" ? value(param) : value;
}
function getSide(placement) {
  return placement.split("-")[0];
}
function getAlignment(placement) {
  return placement.split("-")[1];
}
function getOppositeAxis(axis) {
  return axis === "x" ? "y" : "x";
}
function getAxisLength(axis) {
  return axis === "y" ? "height" : "width";
}
function getSideAxis(placement) {
  const firstChar = placement[0];
  return firstChar === "t" || firstChar === "b" ? "y" : "x";
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function expandPaddingObject(padding) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...padding
  };
}
function getPaddingObject(padding) {
  return typeof padding !== "number" ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  const {
    x,
    y,
    width,
    height
  } = rect;
  return {
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    x,
    y
  };
}

// node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === "y";
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case "top":
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case "bottom":
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case "right":
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case "left":
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  switch (getAlignment(placement)) {
    case "start":
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
      break;
    case "end":
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
      break;
  }
  return coords;
}
async function detectOverflow(state, options) {
  var _await$platform$isEle;
  if (options === void 0) {
    options = {};
  }
  const {
    x,
    y,
    platform: platform2,
    rects,
    elements,
    strategy
  } = state;
  const {
    boundary = "clippingAncestors",
    rootBoundary = "viewport",
    elementContext = "floating",
    altBoundary = false,
    padding = 0
  } = evaluate(options, state);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === "floating" ? "reference" : "floating";
  const element = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform2.getClippingRect({
    element: ((_await$platform$isEle = await (platform2.isElement == null ? void 0 : platform2.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform2.getDocumentElement == null ? void 0 : platform2.getDocumentElement(elements.floating)),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === "floating" ? {
    x,
    y,
    width: rects.floating.width,
    height: rects.floating.height
  } : rects.reference;
  const offsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating));
  const offsetScale = await (platform2.isElement == null ? void 0 : platform2.isElement(offsetParent)) ? await (platform2.getScale == null ? void 0 : platform2.getScale(offsetParent)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements,
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}
var MAX_RESET_COUNT = 50;
var computePosition = async (reference, floating, config) => {
  const {
    placement = "bottom",
    strategy = "absolute",
    middleware = [],
    platform: platform2
  } = config;
  const platformWithDetectOverflow = platform2.detectOverflow ? platform2 : {
    ...platform2,
    detectOverflow
  };
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(floating));
  let rects = await platform2.getElementRects({
    reference,
    floating,
    strategy
  });
  let {
    x,
    y
  } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let resetCount = 0;
  const middlewareData = {};
  for (let i = 0; i < middleware.length; i++) {
    const currentMiddleware = middleware[i];
    if (!currentMiddleware) {
      continue;
    }
    const {
      name,
      fn
    } = currentMiddleware;
    const {
      x: nextX,
      y: nextY,
      data,
      reset
    } = await fn({
      x,
      y,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform: platformWithDetectOverflow,
      elements: {
        reference,
        floating
      }
    });
    x = nextX != null ? nextX : x;
    y = nextY != null ? nextY : y;
    middlewareData[name] = {
      ...middlewareData[name],
      ...data
    };
    if (reset && resetCount < MAX_RESET_COUNT) {
      resetCount++;
      if (typeof reset === "object") {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? await platform2.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({
          x,
          y
        } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i = -1;
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
};
var arrow = (options) => ({
  name: "arrow",
  options,
  async fn(state) {
    const {
      x,
      y,
      placement,
      rects,
      platform: platform2,
      elements,
      middlewareData
    } = state;
    const {
      element,
      padding = 0
    } = evaluate(options, state) || {};
    if (element == null) {
      return {};
    }
    const paddingObject = getPaddingObject(padding);
    const coords = {
      x,
      y
    };
    const axis = getAlignmentAxis(placement);
    const length = getAxisLength(axis);
    const arrowDimensions = await platform2.getDimensions(element);
    const isYAxis = axis === "y";
    const minProp = isYAxis ? "top" : "left";
    const maxProp = isYAxis ? "bottom" : "right";
    const clientProp = isYAxis ? "clientHeight" : "clientWidth";
    const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
    const startDiff = coords[axis] - rects.reference[axis];
    const arrowOffsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(element));
    let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;
    if (!clientSize || !await (platform2.isElement == null ? void 0 : platform2.isElement(arrowOffsetParent))) {
      clientSize = elements.floating[clientProp] || rects.floating[length];
    }
    const centerToReference = endDiff / 2 - startDiff / 2;
    const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
    const minPadding = min(paddingObject[minProp], largestPossiblePadding);
    const maxPadding = min(paddingObject[maxProp], largestPossiblePadding);
    const min$1 = minPadding;
    const max2 = clientSize - arrowDimensions[length] - maxPadding;
    const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
    const offset3 = clamp(min$1, center, max2);
    const shouldAddOffset = !middlewareData.arrow && getAlignment(placement) != null && center !== offset3 && rects.reference[length] / 2 - (center < min$1 ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
    const alignmentOffset = shouldAddOffset ? center < min$1 ? center - min$1 : center - max2 : 0;
    return {
      [axis]: coords[axis] + alignmentOffset,
      data: {
        [axis]: offset3,
        centerOffset: center - offset3 - alignmentOffset,
        ...shouldAddOffset && {
          alignmentOffset
        }
      },
      reset: shouldAddOffset
    };
  }
});
var originSides = /* @__PURE__ */ new Set(["left", "top"]);
async function convertValueToCoords(state, options) {
  const {
    placement,
    platform: platform2,
    elements
  } = state;
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getSideAxis(placement) === "y";
  const mainAxisMulti = originSides.has(side) ? -1 : 1;
  const crossAxisMulti = rtl && isVertical ? -1 : 1;
  const rawValue = evaluate(options, state);
  let {
    mainAxis,
    crossAxis,
    alignmentAxis
  } = typeof rawValue === "number" ? {
    mainAxis: rawValue,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: rawValue.mainAxis || 0,
    crossAxis: rawValue.crossAxis || 0,
    alignmentAxis: rawValue.alignmentAxis
  };
  if (alignment && typeof alignmentAxis === "number") {
    crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
  }
  return isVertical ? {
    x: crossAxis * crossAxisMulti,
    y: mainAxis * mainAxisMulti
  } : {
    x: mainAxis * mainAxisMulti,
    y: crossAxis * crossAxisMulti
  };
}
var offset = function(options) {
  if (options === void 0) {
    options = 0;
  }
  return {
    name: "offset",
    options,
    async fn(state) {
      var _middlewareData$offse, _middlewareData$arrow;
      const {
        x,
        y,
        placement,
        middlewareData
      } = state;
      const diffCoords = await convertValueToCoords(state, options);
      if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      return {
        x: x + diffCoords.x,
        y: y + diffCoords.y,
        data: {
          ...diffCoords,
          placement
        }
      };
    }
  };
};
var shift = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "shift",
    options,
    async fn(state) {
      const {
        x,
        y,
        placement,
        platform: platform2
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = false,
        limiter = {
          fn: (_ref) => {
            let {
              x: x2,
              y: y2
            } = _ref;
            return {
              x: x2,
              y: y2
            };
          }
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const coords = {
        x,
        y
      };
      const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
      const crossAxis = getSideAxis(getSide(placement));
      const mainAxis = getOppositeAxis(crossAxis);
      let mainAxisCoord = coords[mainAxis];
      let crossAxisCoord = coords[crossAxis];
      if (checkMainAxis) {
        const minSide = mainAxis === "y" ? "top" : "left";
        const maxSide = mainAxis === "y" ? "bottom" : "right";
        const min2 = mainAxisCoord + overflow[minSide];
        const max2 = mainAxisCoord - overflow[maxSide];
        mainAxisCoord = clamp(min2, mainAxisCoord, max2);
      }
      if (checkCrossAxis) {
        const minSide = crossAxis === "y" ? "top" : "left";
        const maxSide = crossAxis === "y" ? "bottom" : "right";
        const min2 = crossAxisCoord + overflow[minSide];
        const max2 = crossAxisCoord - overflow[maxSide];
        crossAxisCoord = clamp(min2, crossAxisCoord, max2);
      }
      const limitedCoords = limiter.fn({
        ...state,
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord
      });
      return {
        ...limitedCoords,
        data: {
          x: limitedCoords.x - x,
          y: limitedCoords.y - y,
          enabled: {
            [mainAxis]: checkMainAxis,
            [crossAxis]: checkCrossAxis
          }
        }
      };
    }
  };
};
var size = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "size",
    options,
    async fn(state) {
      var _state$middlewareData, _state$middlewareData2;
      const {
        placement,
        rects,
        platform: platform2,
        elements
      } = state;
      const {
        apply = () => {
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
      const side = getSide(placement);
      const alignment = getAlignment(placement);
      const isYAxis = getSideAxis(placement) === "y";
      const {
        width,
        height
      } = rects.floating;
      let heightSide;
      let widthSide;
      if (side === "top" || side === "bottom") {
        heightSide = side;
        widthSide = alignment === (await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right";
      } else {
        widthSide = side;
        heightSide = alignment === "end" ? "top" : "bottom";
      }
      const maximumClippingHeight = height - overflow.top - overflow.bottom;
      const maximumClippingWidth = width - overflow.left - overflow.right;
      const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
      const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
      const noShift = !state.middlewareData.shift;
      let availableHeight = overflowAvailableHeight;
      let availableWidth = overflowAvailableWidth;
      if ((_state$middlewareData = state.middlewareData.shift) != null && _state$middlewareData.enabled.x) {
        availableWidth = maximumClippingWidth;
      }
      if ((_state$middlewareData2 = state.middlewareData.shift) != null && _state$middlewareData2.enabled.y) {
        availableHeight = maximumClippingHeight;
      }
      if (noShift && !alignment) {
        const xMin = max(overflow.left, 0);
        const xMax = max(overflow.right, 0);
        const yMin = max(overflow.top, 0);
        const yMax = max(overflow.bottom, 0);
        if (isYAxis) {
          availableWidth = width - 2 * (xMin !== 0 || xMax !== 0 ? xMin + xMax : max(overflow.left, overflow.right));
        } else {
          availableHeight = height - 2 * (yMin !== 0 || yMax !== 0 ? yMin + yMax : max(overflow.top, overflow.bottom));
        }
      }
      await apply({
        ...state,
        availableWidth,
        availableHeight
      });
      const nextDimensions = await platform2.getDimensions(elements.floating);
      if (width !== nextDimensions.width || height !== nextDimensions.height) {
        return {
          reset: {
            rects: true
          }
        };
      }
      return {};
    }
  };
};

// node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function hasWindow() {
  return typeof window !== "undefined";
}
function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || "").toLowerCase();
  }
  return "#document";
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
  if (!hasWindow() || typeof ShadowRoot === "undefined") {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle2(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && display !== "inline" && display !== "contents";
}
function isTableElement(element) {
  return /^(table|td|th)$/.test(getNodeName(element));
}
function isTopLayer(element) {
  try {
    if (element.matches(":popover-open")) {
      return true;
    }
  } catch (_e) {
  }
  try {
    return element.matches(":modal");
  } catch (_e) {
    return false;
  }
}
var willChangeRe = /transform|translate|scale|rotate|perspective|filter/;
var containRe = /paint|layout|strict|content/;
var isNotNone = (value) => !!value && value !== "none";
var isWebKitValue;
function isContainingBlock(elementOrCss) {
  const css = isElement(elementOrCss) ? getComputedStyle2(elementOrCss) : elementOrCss;
  return isNotNone(css.transform) || isNotNone(css.translate) || isNotNone(css.scale) || isNotNone(css.rotate) || isNotNone(css.perspective) || !isWebKit() && (isNotNone(css.backdropFilter) || isNotNone(css.filter)) || willChangeRe.test(css.willChange || "") || containRe.test(css.contain || "");
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else if (isTopLayer(currentNode)) {
      return null;
    }
    currentNode = getParentNode(currentNode);
  }
  return null;
}
function isWebKit() {
  if (isWebKitValue == null) {
    isWebKitValue = typeof CSS !== "undefined" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none");
  }
  return isWebKitValue;
}
function isLastTraversableNode(node) {
  return /^(html|body|#document)$/.test(getNodeName(node));
}
function getComputedStyle2(element) {
  return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.scrollX,
    scrollTop: element.scrollY
  };
}
function getParentNode(node) {
  if (getNodeName(node) === "html") {
    return node;
  }
  const result = (
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot || // DOM Element detected.
    node.parentNode || // ShadowRoot detected.
    isShadowRoot(node) && node.host || // Fallback.
    getDocumentElement(node)
  );
  return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : node.body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  if (traverseIframes === void 0) {
    traverseIframes = true;
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    const frameElement = getFrameElement(win);
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
  } else {
    return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
  }
}
function getFrameElement(win) {
  return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}

// node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function getCssDimensions(element) {
  const css = getComputedStyle2(element);
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}
function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}
function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $: $2
  } = getCssDimensions(domElement);
  let x = ($2 ? round(rect.width) : rect.width) / width;
  let y = ($2 ? round(rect.height) : rect.height) / height;
  if (!x || !Number.isFinite(x)) {
    x = 1;
  }
  if (!y || !Number.isFinite(y)) {
    y = 1;
  }
  return {
    x,
    y
  };
}
var noOffsets = createCoords(0);
function getVisualOffsets(element) {
  const win = getWindow(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
    return false;
  }
  return isFixed;
}
function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x = (clientRect.left + visualOffsets.x) / scale.x;
  let y = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement) {
    const win = getWindow(domElement);
    const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentWin = win;
    let currentIFrame = getFrameElement(currentWin);
    while (currentIFrame && offsetParent && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle2(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x += left;
      y += top;
      currentWin = getWindow(currentIFrame);
      currentIFrame = getFrameElement(currentWin);
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y
  });
}
function getWindowScrollBarX(element, rect) {
  const leftScroll = getNodeScroll(element).scrollLeft;
  if (!rect) {
    return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
  }
  return rect.left + leftScroll;
}
function getHTMLOffset(documentElement, scroll) {
  const htmlRect = documentElement.getBoundingClientRect();
  const x = htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect);
  const y = htmlRect.top + scroll.scrollTop;
  return {
    x,
    y
  };
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    elements,
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isFixed = strategy === "fixed";
  const documentElement = getDocumentElement(offsetParent);
  const topLayer = elements ? isTopLayer(elements.floating) : false;
  if (offsetParent === documentElement || topLayer && isFixed) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
  };
}
function getClientRects(element) {
  return Array.from(element.getClientRects());
}
function getDocumentRect(element) {
  const html = getDocumentElement(element);
  const scroll = getNodeScroll(element);
  const body = element.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x = -scroll.scrollLeft + getWindowScrollBarX(element);
  const y = -scroll.scrollTop;
  if (getComputedStyle2(body).direction === "rtl") {
    x += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}
var SCROLLBAR_MAX = 25;
function getViewportRect(element, strategy) {
  const win = getWindow(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x = 0;
  let y = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    const visualViewportBased = isWebKit();
    if (!visualViewportBased || visualViewportBased && strategy === "fixed") {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }
  const windowScrollbarX = getWindowScrollBarX(html);
  if (windowScrollbarX <= 0) {
    const doc = html.ownerDocument;
    const body = doc.body;
    const bodyStyles = getComputedStyle(body);
    const bodyMarginInline = doc.compatMode === "CSS1Compat" ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
    const clippingStableScrollbarWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
    if (clippingStableScrollbarWidth <= SCROLLBAR_MAX) {
      width -= clippingStableScrollbarWidth;
    }
  } else if (windowScrollbarX <= SCROLLBAR_MAX) {
    width += windowScrollbarX;
  }
  return {
    width,
    height,
    x,
    y
  };
}
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
  const top = clientRect.top + element.clientTop;
  const left = clientRect.left + element.clientLeft;
  const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x = left * scale.x;
  const y = top * scale.y;
  return {
    width,
    height,
    x,
    y
  };
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === "viewport") {
    rect = getViewportRect(element, strategy);
  } else if (clippingAncestor === "document") {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y,
      width: clippingAncestor.width,
      height: clippingAncestor.height
    };
  }
  return rectToClientRect(rect);
}
function hasFixedPositionAncestor(element, stopNode) {
  const parentNode = getParentNode(element);
  if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
    return false;
  }
  return getComputedStyle2(parentNode).position === "fixed" || hasFixedPositionAncestor(parentNode, stopNode);
}
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element, [], false).filter((el2) => isElement(el2) && getNodeName(el2) !== "body");
  let currentContainingBlockComputedStyle = null;
  const elementIsFixed = getComputedStyle2(element).position === "fixed";
  let currentNode = elementIsFixed ? getParentNode(element) : element;
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle2(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    if (!currentNodeIsContaining && computedStyle.position === "fixed") {
      currentContainingBlockComputedStyle = null;
    }
    const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === "static" && !!currentContainingBlockComputedStyle && (currentContainingBlockComputedStyle.position === "absolute" || currentContainingBlockComputedStyle.position === "fixed") || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
    if (shouldDropCurrentNode) {
      result = result.filter((ancestor) => ancestor !== currentNode);
    } else {
      currentContainingBlockComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element, result);
  return result;
}
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy);
  let top = firstRect.top;
  let right = firstRect.right;
  let bottom = firstRect.bottom;
  let left = firstRect.left;
  for (let i = 1; i < clippingAncestors.length; i++) {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestors[i], strategy);
    top = max(rect.top, top);
    right = min(rect.right, right);
    bottom = min(rect.bottom, bottom);
    left = max(rect.left, left);
  }
  return {
    width: right - left,
    height: bottom - top,
    x: left,
    y: top
  };
}
function getDimensions(element) {
  const {
    width,
    height
  } = getCssDimensions(element);
  return {
    width,
    height
  };
}
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === "fixed";
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  function setLeftRTLScrollbarOffset() {
    offsets.x = getWindowScrollBarX(documentElement);
  }
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) {
      setLeftRTLScrollbarOffset();
    }
  }
  if (isFixed && !isOffsetParentAnElement && documentElement) {
    setLeftRTLScrollbarOffset();
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x;
  const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y;
  return {
    x,
    y,
    width: rect.width,
    height: rect.height
  };
}
function isStaticPositioned(element) {
  return getComputedStyle2(element).position === "static";
}
function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement(element) || getComputedStyle2(element).position === "fixed") {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  let rawOffsetParent = element.offsetParent;
  if (getDocumentElement(element) === rawOffsetParent) {
    rawOffsetParent = rawOffsetParent.ownerDocument.body;
  }
  return rawOffsetParent;
}
function getOffsetParent(element, polyfill) {
  const win = getWindow(element);
  if (isTopLayer(element)) {
    return win;
  }
  if (!isHTMLElement(element)) {
    let svgOffsetParent = getParentNode(element);
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent;
      }
      svgOffsetParent = getParentNode(svgOffsetParent);
    }
    return win;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
    return win;
  }
  return offsetParent || getContainingBlock(element) || win;
}
var getElementRects = async function(data) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  const floatingDimensions = await getDimensionsFn(data.floating);
  return {
    reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height
    }
  };
};
function isRTL(element) {
  return getComputedStyle2(element).direction === "rtl";
}
var platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL
};
function rectsAreEqual(a, b) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
function observeMove(element, onMove) {
  let io2 = null;
  let timeoutId;
  const root = getDocumentElement(element);
  function cleanup() {
    var _io;
    clearTimeout(timeoutId);
    (_io = io2) == null || _io.disconnect();
    io2 = null;
  }
  function refresh(skip, threshold) {
    if (skip === void 0) {
      skip = false;
    }
    if (threshold === void 0) {
      threshold = 1;
    }
    cleanup();
    const elementRectForRootMargin = element.getBoundingClientRect();
    const {
      left,
      top,
      width,
      height
    } = elementRectForRootMargin;
    if (!skip) {
      onMove();
    }
    if (!width || !height) {
      return;
    }
    const insetTop = floor(top);
    const insetRight = floor(root.clientWidth - (left + width));
    const insetBottom = floor(root.clientHeight - (top + height));
    const insetLeft = floor(left);
    const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
    const options = {
      rootMargin,
      threshold: max(0, min(1, threshold)) || 1
    };
    let isFirstUpdate = true;
    function handleObserve(entries) {
      const ratio = entries[0].intersectionRatio;
      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          return refresh();
        }
        if (!ratio) {
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7);
          }, 1e3);
        } else {
          refresh(false, ratio);
        }
      }
      if (ratio === 1 && !rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())) {
        refresh();
      }
      isFirstUpdate = false;
    }
    try {
      io2 = new IntersectionObserver(handleObserve, {
        ...options,
        // Handle <iframe>s
        root: root.ownerDocument
      });
    } catch (_e) {
      io2 = new IntersectionObserver(handleObserve, options);
    }
    io2.observe(element);
  }
  refresh(true);
  return cleanup;
}
function autoUpdate(reference, floating, update, options) {
  if (options === void 0) {
    options = {};
  }
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === "function",
    layoutShift = typeof IntersectionObserver === "function",
    animationFrame = false
  } = options;
  const referenceEl = unwrapElement(reference);
  const ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...floating ? getOverflowAncestors(floating) : []] : [];
  ancestors.forEach((ancestor) => {
    ancestorScroll && ancestor.addEventListener("scroll", update, {
      passive: true
    });
    ancestorResize && ancestor.addEventListener("resize", update);
  });
  const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;
  let reobserveFrame = -1;
  let resizeObserver = null;
  if (elementResize) {
    resizeObserver = new ResizeObserver((_ref) => {
      let [firstEntry] = _ref;
      if (firstEntry && firstEntry.target === referenceEl && resizeObserver && floating) {
        resizeObserver.unobserve(floating);
        cancelAnimationFrame(reobserveFrame);
        reobserveFrame = requestAnimationFrame(() => {
          var _resizeObserver;
          (_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
        });
      }
      update();
    });
    if (referenceEl && !animationFrame) {
      resizeObserver.observe(referenceEl);
    }
    if (floating) {
      resizeObserver.observe(floating);
    }
  }
  let frameId;
  let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
  if (animationFrame) {
    frameLoop();
  }
  function frameLoop() {
    const nextRefRect = getBoundingClientRect(reference);
    if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) {
      update();
    }
    prevRefRect = nextRefRect;
    frameId = requestAnimationFrame(frameLoop);
  }
  update();
  return () => {
    var _resizeObserver2;
    ancestors.forEach((ancestor) => {
      ancestorScroll && ancestor.removeEventListener("scroll", update);
      ancestorResize && ancestor.removeEventListener("resize", update);
    });
    cleanupIo == null || cleanupIo();
    (_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
    resizeObserver = null;
    if (animationFrame) {
      cancelAnimationFrame(frameId);
    }
  };
}
var offset2 = offset;
var shift2 = shift;
var size2 = size;
var arrow2 = arrow;
var computePosition2 = (reference, floating, options) => {
  const cache = /* @__PURE__ */ new Map();
  const mergedOptions = {
    platform,
    ...options
  };
  const platformWithCache = {
    ...mergedOptions.platform,
    _c: cache
  };
  return computePosition(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache
  });
};

// node_modules/@floating-ui/vue/dist/floating-ui.vue.mjs
function isComponentPublicInstance(target) {
  return target != null && typeof target === "object" && "$el" in target;
}
function unwrapElement2(target) {
  if (isComponentPublicInstance(target)) {
    const element = target.$el;
    return isNode(element) && getNodeName(element) === "#comment" ? null : element;
  }
  return target;
}
function toValue(source) {
  return typeof source === "function" ? source() : unref(source);
}
function arrow3(options) {
  return {
    name: "arrow",
    options,
    fn(args) {
      const element = unwrapElement2(toValue(options.element));
      if (element == null) {
        return {};
      }
      return arrow2({
        element,
        padding: options.padding
      }).fn(args);
    }
  };
}
function getDPR(element) {
  if (typeof window === "undefined") {
    return 1;
  }
  const win = element.ownerDocument.defaultView || window;
  return win.devicePixelRatio || 1;
}
function roundByDPR(element, value) {
  const dpr = getDPR(element);
  return Math.round(value * dpr) / dpr;
}
function useFloating(reference, floating, options) {
  if (options === void 0) {
    options = {};
  }
  const whileElementsMountedOption = options.whileElementsMounted;
  const openOption = computed(() => {
    var _toValue;
    return (_toValue = toValue(options.open)) != null ? _toValue : true;
  });
  const middlewareOption = computed(() => toValue(options.middleware));
  const placementOption = computed(() => {
    var _toValue2;
    return (_toValue2 = toValue(options.placement)) != null ? _toValue2 : "bottom";
  });
  const strategyOption = computed(() => {
    var _toValue3;
    return (_toValue3 = toValue(options.strategy)) != null ? _toValue3 : "absolute";
  });
  const transformOption = computed(() => {
    var _toValue4;
    return (_toValue4 = toValue(options.transform)) != null ? _toValue4 : true;
  });
  const referenceElement = computed(() => unwrapElement2(reference.value));
  const floatingElement = computed(() => unwrapElement2(floating.value));
  const x = ref(0);
  const y = ref(0);
  const strategy = ref(strategyOption.value);
  const placement = ref(placementOption.value);
  const middlewareData = shallowRef({});
  const isPositioned = ref(false);
  const floatingStyles = computed(() => {
    const initialStyles = {
      position: strategy.value,
      left: "0",
      top: "0"
    };
    if (!floatingElement.value) {
      return initialStyles;
    }
    const xVal = roundByDPR(floatingElement.value, x.value);
    const yVal = roundByDPR(floatingElement.value, y.value);
    if (transformOption.value) {
      return {
        ...initialStyles,
        transform: "translate(" + xVal + "px, " + yVal + "px)",
        ...getDPR(floatingElement.value) >= 1.5 && {
          willChange: "transform"
        }
      };
    }
    return {
      position: strategy.value,
      left: xVal + "px",
      top: yVal + "px"
    };
  });
  let whileElementsMountedCleanup;
  function update() {
    if (referenceElement.value == null || floatingElement.value == null) {
      return;
    }
    const open = openOption.value;
    computePosition2(referenceElement.value, floatingElement.value, {
      middleware: middlewareOption.value,
      placement: placementOption.value,
      strategy: strategyOption.value
    }).then((position) => {
      x.value = position.x;
      y.value = position.y;
      strategy.value = position.strategy;
      placement.value = position.placement;
      middlewareData.value = position.middlewareData;
      isPositioned.value = open !== false;
    });
  }
  function cleanup() {
    if (typeof whileElementsMountedCleanup === "function") {
      whileElementsMountedCleanup();
      whileElementsMountedCleanup = void 0;
    }
  }
  function attach() {
    cleanup();
    if (whileElementsMountedOption === void 0) {
      update();
      return;
    }
    if (referenceElement.value != null && floatingElement.value != null) {
      whileElementsMountedCleanup = whileElementsMountedOption(referenceElement.value, floatingElement.value, update);
      return;
    }
  }
  function reset() {
    if (!openOption.value) {
      isPositioned.value = false;
    }
  }
  watch([middlewareOption, placementOption, strategyOption, openOption], update, {
    flush: "sync"
  });
  watch([referenceElement, floatingElement], attach, {
    flush: "sync"
  });
  watch(openOption, reset, {
    flush: "sync"
  });
  if (getCurrentScope()) {
    onScopeDispose(cleanup);
  }
  return {
    x: shallowReadonly(x),
    y: shallowReadonly(y),
    strategy: shallowReadonly(strategy),
    placement: shallowReadonly(placement),
    middlewareData: shallowReadonly(middlewareData),
    isPositioned: shallowReadonly(isPositioned),
    floatingStyles,
    update
  };
}

// node_modules/async-validator/dist-web/index.js
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  _setPrototypeOf(subClass, superClass);
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf2(o2) {
    return o2.__proto__ || Object.getPrototypeOf(o2);
  };
  return _getPrototypeOf(o);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf2(o2, p2) {
    o2.__proto__ = p2;
    return o2;
  };
  return _setPrototypeOf(o, p);
}
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;
  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
    return true;
  } catch (e) {
    return false;
  }
}
function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct.bind();
  } else {
    _construct = function _construct2(Parent2, args2, Class2) {
      var a = [null];
      a.push.apply(a, args2);
      var Constructor = Function.bind.apply(Parent2, a);
      var instance = new Constructor();
      if (Class2) _setPrototypeOf(instance, Class2.prototype);
      return instance;
    };
  }
  return _construct.apply(null, arguments);
}
function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}
function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? /* @__PURE__ */ new Map() : void 0;
  _wrapNativeSuper = function _wrapNativeSuper2(Class2) {
    if (Class2 === null || !_isNativeFunction(Class2)) return Class2;
    if (typeof Class2 !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }
    if (typeof _cache !== "undefined") {
      if (_cache.has(Class2)) return _cache.get(Class2);
      _cache.set(Class2, Wrapper);
    }
    function Wrapper() {
      return _construct(Class2, arguments, _getPrototypeOf(this).constructor);
    }
    Wrapper.prototype = Object.create(Class2.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class2);
  };
  return _wrapNativeSuper(Class);
}
var formatRegExp = /%[sdj%]/g;
var warning = function warning2() {
};
if (typeof process !== "undefined" && process.env && true && typeof window !== "undefined" && typeof document !== "undefined") {
  warning = function warning3(type4, errors) {
    if (typeof console !== "undefined" && console.warn && typeof ASYNC_VALIDATOR_NO_WARNING === "undefined") {
      if (errors.every(function(e) {
        return typeof e === "string";
      })) {
        console.warn(type4, errors);
      }
    }
  };
}
function convertFieldsError(errors) {
  if (!errors || !errors.length) return null;
  var fields = {};
  errors.forEach(function(error) {
    var field = error.field;
    fields[field] = fields[field] || [];
    fields[field].push(error);
  });
  return fields;
}
function format(template) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  var i = 0;
  var len = args.length;
  if (typeof template === "function") {
    return template.apply(null, args);
  }
  if (typeof template === "string") {
    var str = template.replace(formatRegExp, function(x) {
      if (x === "%%") {
        return "%";
      }
      if (i >= len) {
        return x;
      }
      switch (x) {
        case "%s":
          return String(args[i++]);
        case "%d":
          return Number(args[i++]);
        case "%j":
          try {
            return JSON.stringify(args[i++]);
          } catch (_2) {
            return "[Circular]";
          }
          break;
        default:
          return x;
      }
    });
    return str;
  }
  return template;
}
function isNativeStringType(type4) {
  return type4 === "string" || type4 === "url" || type4 === "hex" || type4 === "email" || type4 === "date" || type4 === "pattern";
}
function isEmptyValue(value, type4) {
  if (value === void 0 || value === null) {
    return true;
  }
  if (type4 === "array" && Array.isArray(value) && !value.length) {
    return true;
  }
  if (isNativeStringType(type4) && typeof value === "string" && !value) {
    return true;
  }
  return false;
}
function asyncParallelArray(arr, func, callback) {
  var results = [];
  var total = 0;
  var arrLength = arr.length;
  function count(errors) {
    results.push.apply(results, errors || []);
    total++;
    if (total === arrLength) {
      callback(results);
    }
  }
  arr.forEach(function(a) {
    func(a, count);
  });
}
function asyncSerialArray(arr, func, callback) {
  var index = 0;
  var arrLength = arr.length;
  function next(errors) {
    if (errors && errors.length) {
      callback(errors);
      return;
    }
    var original = index;
    index = index + 1;
    if (original < arrLength) {
      func(arr[original], next);
    } else {
      callback([]);
    }
  }
  next([]);
}
function flattenObjArr(objArr) {
  var ret = [];
  Object.keys(objArr).forEach(function(k) {
    ret.push.apply(ret, objArr[k] || []);
  });
  return ret;
}
var AsyncValidationError = function(_Error) {
  _inheritsLoose(AsyncValidationError2, _Error);
  function AsyncValidationError2(errors, fields) {
    var _this;
    _this = _Error.call(this, "Async Validation Error") || this;
    _this.errors = errors;
    _this.fields = fields;
    return _this;
  }
  return AsyncValidationError2;
}(_wrapNativeSuper(Error));
function asyncMap(objArr, option, func, callback, source) {
  if (option.first) {
    var _pending = new Promise(function(resolve, reject) {
      var next = function next2(errors) {
        callback(errors);
        return errors.length ? reject(new AsyncValidationError(errors, convertFieldsError(errors))) : resolve(source);
      };
      var flattenArr = flattenObjArr(objArr);
      asyncSerialArray(flattenArr, func, next);
    });
    _pending["catch"](function(e) {
      return e;
    });
    return _pending;
  }
  var firstFields = option.firstFields === true ? Object.keys(objArr) : option.firstFields || [];
  var objArrKeys = Object.keys(objArr);
  var objArrLength = objArrKeys.length;
  var total = 0;
  var results = [];
  var pending = new Promise(function(resolve, reject) {
    var next = function next2(errors) {
      results.push.apply(results, errors);
      total++;
      if (total === objArrLength) {
        callback(results);
        return results.length ? reject(new AsyncValidationError(results, convertFieldsError(results))) : resolve(source);
      }
    };
    if (!objArrKeys.length) {
      callback(results);
      resolve(source);
    }
    objArrKeys.forEach(function(key) {
      var arr = objArr[key];
      if (firstFields.indexOf(key) !== -1) {
        asyncSerialArray(arr, func, next);
      } else {
        asyncParallelArray(arr, func, next);
      }
    });
  });
  pending["catch"](function(e) {
    return e;
  });
  return pending;
}
function isErrorObj(obj) {
  return !!(obj && obj.message !== void 0);
}
function getValue(value, path) {
  var v = value;
  for (var i = 0; i < path.length; i++) {
    if (v == void 0) {
      return v;
    }
    v = v[path[i]];
  }
  return v;
}
function complementError(rule, source) {
  return function(oe) {
    var fieldValue;
    if (rule.fullFields) {
      fieldValue = getValue(source, rule.fullFields);
    } else {
      fieldValue = source[oe.field || rule.fullField];
    }
    if (isErrorObj(oe)) {
      oe.field = oe.field || rule.fullField;
      oe.fieldValue = fieldValue;
      return oe;
    }
    return {
      message: typeof oe === "function" ? oe() : oe,
      fieldValue,
      field: oe.field || rule.fullField
    };
  };
}
function deepMerge(target, source) {
  if (source) {
    for (var s in source) {
      if (source.hasOwnProperty(s)) {
        var value = source[s];
        if (typeof value === "object" && typeof target[s] === "object") {
          target[s] = _extends({}, target[s], value);
        } else {
          target[s] = value;
        }
      }
    }
  }
  return target;
}
var required$1 = function required(rule, value, source, errors, options, type4) {
  if (rule.required && (!source.hasOwnProperty(rule.field) || isEmptyValue(value, type4 || rule.type))) {
    errors.push(format(options.messages.required, rule.fullField));
  }
};
var whitespace = function whitespace2(rule, value, source, errors, options) {
  if (/^\s+$/.test(value) || value === "") {
    errors.push(format(options.messages.whitespace, rule.fullField));
  }
};
var urlReg;
var getUrlRegex = function() {
  if (urlReg) {
    return urlReg;
  }
  var word = "[a-fA-F\\d:]";
  var b = function b2(options) {
    return options && options.includeBoundaries ? "(?:(?<=\\s|^)(?=" + word + ")|(?<=" + word + ")(?=\\s|$))" : "";
  };
  var v4 = "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}";
  var v6seg = "[a-fA-F\\d]{1,4}";
  var v6 = ("\n(?:\n(?:" + v6seg + ":){7}(?:" + v6seg + "|:)|                                    // 1:2:3:4:5:6:7::  1:2:3:4:5:6:7:8\n(?:" + v6seg + ":){6}(?:" + v4 + "|:" + v6seg + "|:)|                             // 1:2:3:4:5:6::    1:2:3:4:5:6::8   1:2:3:4:5:6::8  1:2:3:4:5:6::1.2.3.4\n(?:" + v6seg + ":){5}(?::" + v4 + "|(?::" + v6seg + "){1,2}|:)|                   // 1:2:3:4:5::      1:2:3:4:5::7:8   1:2:3:4:5::8    1:2:3:4:5::7:1.2.3.4\n(?:" + v6seg + ":){4}(?:(?::" + v6seg + "){0,1}:" + v4 + "|(?::" + v6seg + "){1,3}|:)| // 1:2:3:4::        1:2:3:4::6:7:8   1:2:3:4::8      1:2:3:4::6:7:1.2.3.4\n(?:" + v6seg + ":){3}(?:(?::" + v6seg + "){0,2}:" + v4 + "|(?::" + v6seg + "){1,4}|:)| // 1:2:3::          1:2:3::5:6:7:8   1:2:3::8        1:2:3::5:6:7:1.2.3.4\n(?:" + v6seg + ":){2}(?:(?::" + v6seg + "){0,3}:" + v4 + "|(?::" + v6seg + "){1,5}|:)| // 1:2::            1:2::4:5:6:7:8   1:2::8          1:2::4:5:6:7:1.2.3.4\n(?:" + v6seg + ":){1}(?:(?::" + v6seg + "){0,4}:" + v4 + "|(?::" + v6seg + "){1,6}|:)| // 1::              1::3:4:5:6:7:8   1::8            1::3:4:5:6:7:1.2.3.4\n(?::(?:(?::" + v6seg + "){0,5}:" + v4 + "|(?::" + v6seg + "){1,7}|:))             // ::2:3:4:5:6:7:8  ::2:3:4:5:6:7:8  ::8             ::1.2.3.4\n)(?:%[0-9a-zA-Z]{1,})?                                             // %eth0            %1\n").replace(/\s*\/\/.*$/gm, "").replace(/\n/g, "").trim();
  var v46Exact = new RegExp("(?:^" + v4 + "$)|(?:^" + v6 + "$)");
  var v4exact = new RegExp("^" + v4 + "$");
  var v6exact = new RegExp("^" + v6 + "$");
  var ip = function ip2(options) {
    return options && options.exact ? v46Exact : new RegExp("(?:" + b(options) + v4 + b(options) + ")|(?:" + b(options) + v6 + b(options) + ")", "g");
  };
  ip.v4 = function(options) {
    return options && options.exact ? v4exact : new RegExp("" + b(options) + v4 + b(options), "g");
  };
  ip.v6 = function(options) {
    return options && options.exact ? v6exact : new RegExp("" + b(options) + v6 + b(options), "g");
  };
  var protocol = "(?:(?:[a-z]+:)?//)";
  var auth = "(?:\\S+(?::\\S*)?@)?";
  var ipv4 = ip.v4().source;
  var ipv6 = ip.v6().source;
  var host = "(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)";
  var domain = "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*";
  var tld = "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))";
  var port = "(?::\\d{2,5})?";
  var path = '(?:[/?#][^\\s"]*)?';
  var regex = "(?:" + protocol + "|www\\.)" + auth + "(?:localhost|" + ipv4 + "|" + ipv6 + "|" + host + domain + tld + ")" + port + path;
  urlReg = new RegExp("(?:^" + regex + "$)", "i");
  return urlReg;
};
var pattern$2 = {
  // http://emailregex.com/
  email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/,
  // url: new RegExp(
  //   '^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$',
  //   'i',
  // ),
  hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i
};
var types = {
  integer: function integer(value) {
    return types.number(value) && parseInt(value, 10) === value;
  },
  "float": function float(value) {
    return types.number(value) && !types.integer(value);
  },
  array: function array(value) {
    return Array.isArray(value);
  },
  regexp: function regexp(value) {
    if (value instanceof RegExp) {
      return true;
    }
    try {
      return !!new RegExp(value);
    } catch (e) {
      return false;
    }
  },
  date: function date(value) {
    return typeof value.getTime === "function" && typeof value.getMonth === "function" && typeof value.getYear === "function" && !isNaN(value.getTime());
  },
  number: function number(value) {
    if (isNaN(value)) {
      return false;
    }
    return typeof value === "number";
  },
  object: function object(value) {
    return typeof value === "object" && !types.array(value);
  },
  method: function method(value) {
    return typeof value === "function";
  },
  email: function email(value) {
    return typeof value === "string" && value.length <= 320 && !!value.match(pattern$2.email);
  },
  url: function url(value) {
    return typeof value === "string" && value.length <= 2048 && !!value.match(getUrlRegex());
  },
  hex: function hex(value) {
    return typeof value === "string" && !!value.match(pattern$2.hex);
  }
};
var type$1 = function type(rule, value, source, errors, options) {
  if (rule.required && value === void 0) {
    required$1(rule, value, source, errors, options);
    return;
  }
  var custom = ["integer", "float", "array", "regexp", "object", "method", "email", "number", "date", "url", "hex"];
  var ruleType = rule.type;
  if (custom.indexOf(ruleType) > -1) {
    if (!types[ruleType](value)) {
      errors.push(format(options.messages.types[ruleType], rule.fullField, rule.type));
    }
  } else if (ruleType && typeof value !== rule.type) {
    errors.push(format(options.messages.types[ruleType], rule.fullField, rule.type));
  }
};
var range = function range2(rule, value, source, errors, options) {
  var len = typeof rule.len === "number";
  var min2 = typeof rule.min === "number";
  var max2 = typeof rule.max === "number";
  var spRegexp = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  var val = value;
  var key = null;
  var num = typeof value === "number";
  var str = typeof value === "string";
  var arr = Array.isArray(value);
  if (num) {
    key = "number";
  } else if (str) {
    key = "string";
  } else if (arr) {
    key = "array";
  }
  if (!key) {
    return false;
  }
  if (arr) {
    val = value.length;
  }
  if (str) {
    val = value.replace(spRegexp, "_").length;
  }
  if (len) {
    if (val !== rule.len) {
      errors.push(format(options.messages[key].len, rule.fullField, rule.len));
    }
  } else if (min2 && !max2 && val < rule.min) {
    errors.push(format(options.messages[key].min, rule.fullField, rule.min));
  } else if (max2 && !min2 && val > rule.max) {
    errors.push(format(options.messages[key].max, rule.fullField, rule.max));
  } else if (min2 && max2 && (val < rule.min || val > rule.max)) {
    errors.push(format(options.messages[key].range, rule.fullField, rule.min, rule.max));
  }
};
var ENUM$1 = "enum";
var enumerable$1 = function enumerable(rule, value, source, errors, options) {
  rule[ENUM$1] = Array.isArray(rule[ENUM$1]) ? rule[ENUM$1] : [];
  if (rule[ENUM$1].indexOf(value) === -1) {
    errors.push(format(options.messages[ENUM$1], rule.fullField, rule[ENUM$1].join(", ")));
  }
};
var pattern$1 = function pattern(rule, value, source, errors, options) {
  if (rule.pattern) {
    if (rule.pattern instanceof RegExp) {
      rule.pattern.lastIndex = 0;
      if (!rule.pattern.test(value)) {
        errors.push(format(options.messages.pattern.mismatch, rule.fullField, value, rule.pattern));
      }
    } else if (typeof rule.pattern === "string") {
      var _pattern = new RegExp(rule.pattern);
      if (!_pattern.test(value)) {
        errors.push(format(options.messages.pattern.mismatch, rule.fullField, value, rule.pattern));
      }
    }
  }
};
var rules = {
  required: required$1,
  whitespace,
  type: type$1,
  range,
  "enum": enumerable$1,
  pattern: pattern$1
};
var string = function string2(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (isEmptyValue(value, "string") && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, "string");
    if (!isEmptyValue(value, "string")) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
      rules.pattern(rule, value, source, errors, options);
      if (rule.whitespace === true) {
        rules.whitespace(rule, value, source, errors, options);
      }
    }
  }
  callback(errors);
};
var method2 = function method3(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== void 0) {
      rules.type(rule, value, source, errors, options);
    }
  }
  callback(errors);
};
var number2 = function number3(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (value === "") {
      value = void 0;
    }
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== void 0) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
    }
  }
  callback(errors);
};
var _boolean = function _boolean2(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== void 0) {
      rules.type(rule, value, source, errors, options);
    }
  }
  callback(errors);
};
var regexp2 = function regexp3(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (!isEmptyValue(value)) {
      rules.type(rule, value, source, errors, options);
    }
  }
  callback(errors);
};
var integer2 = function integer3(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== void 0) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
    }
  }
  callback(errors);
};
var floatFn = function floatFn2(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== void 0) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
    }
  }
  callback(errors);
};
var array2 = function array3(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if ((value === void 0 || value === null) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, "array");
    if (value !== void 0 && value !== null) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
    }
  }
  callback(errors);
};
var object2 = function object3(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== void 0) {
      rules.type(rule, value, source, errors, options);
    }
  }
  callback(errors);
};
var ENUM = "enum";
var enumerable2 = function enumerable3(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== void 0) {
      rules[ENUM](rule, value, source, errors, options);
    }
  }
  callback(errors);
};
var pattern2 = function pattern3(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (isEmptyValue(value, "string") && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (!isEmptyValue(value, "string")) {
      rules.pattern(rule, value, source, errors, options);
    }
  }
  callback(errors);
};
var date2 = function date3(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (isEmptyValue(value, "date") && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (!isEmptyValue(value, "date")) {
      var dateObject;
      if (value instanceof Date) {
        dateObject = value;
      } else {
        dateObject = new Date(value);
      }
      rules.type(rule, dateObject, source, errors, options);
      if (dateObject) {
        rules.range(rule, dateObject.getTime(), source, errors, options);
      }
    }
  }
  callback(errors);
};
var required2 = function required3(rule, value, callback, source, options) {
  var errors = [];
  var type4 = Array.isArray(value) ? "array" : typeof value;
  rules.required(rule, value, source, errors, options, type4);
  callback(errors);
};
var type2 = function type3(rule, value, callback, source, options) {
  var ruleType = rule.type;
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (isEmptyValue(value, ruleType) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, ruleType);
    if (!isEmptyValue(value, ruleType)) {
      rules.type(rule, value, source, errors, options);
    }
  }
  callback(errors);
};
var any = function any2(rule, value, callback, source, options) {
  var errors = [];
  var validate = rule.required || !rule.required && source.hasOwnProperty(rule.field);
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
  }
  callback(errors);
};
var validators = {
  string,
  method: method2,
  number: number2,
  "boolean": _boolean,
  regexp: regexp2,
  integer: integer2,
  "float": floatFn,
  array: array2,
  object: object2,
  "enum": enumerable2,
  pattern: pattern2,
  date: date2,
  url: type2,
  hex: type2,
  email: type2,
  required: required2,
  any
};
function newMessages() {
  return {
    "default": "Validation error on field %s",
    required: "%s is required",
    "enum": "%s must be one of %s",
    whitespace: "%s cannot be empty",
    date: {
      format: "%s date %s is invalid for format %s",
      parse: "%s date could not be parsed, %s is invalid ",
      invalid: "%s date %s is invalid"
    },
    types: {
      string: "%s is not a %s",
      method: "%s is not a %s (function)",
      array: "%s is not an %s",
      object: "%s is not an %s",
      number: "%s is not a %s",
      date: "%s is not a %s",
      "boolean": "%s is not a %s",
      integer: "%s is not an %s",
      "float": "%s is not a %s",
      regexp: "%s is not a valid %s",
      email: "%s is not a valid %s",
      url: "%s is not a valid %s",
      hex: "%s is not a valid %s"
    },
    string: {
      len: "%s must be exactly %s characters",
      min: "%s must be at least %s characters",
      max: "%s cannot be longer than %s characters",
      range: "%s must be between %s and %s characters"
    },
    number: {
      len: "%s must equal %s",
      min: "%s cannot be less than %s",
      max: "%s cannot be greater than %s",
      range: "%s must be between %s and %s"
    },
    array: {
      len: "%s must be exactly %s in length",
      min: "%s cannot be less than %s in length",
      max: "%s cannot be greater than %s in length",
      range: "%s must be between %s and %s in length"
    },
    pattern: {
      mismatch: "%s value %s does not match pattern %s"
    },
    clone: function clone() {
      var cloned = JSON.parse(JSON.stringify(this));
      cloned.clone = this.clone;
      return cloned;
    }
  };
}
var messages = newMessages();
var Schema = function() {
  function Schema2(descriptor) {
    this.rules = null;
    this._messages = messages;
    this.define(descriptor);
  }
  var _proto = Schema2.prototype;
  _proto.define = function define(rules2) {
    var _this = this;
    if (!rules2) {
      throw new Error("Cannot configure a schema with no rules");
    }
    if (typeof rules2 !== "object" || Array.isArray(rules2)) {
      throw new Error("Rules must be an object");
    }
    this.rules = {};
    Object.keys(rules2).forEach(function(name) {
      var item = rules2[name];
      _this.rules[name] = Array.isArray(item) ? item : [item];
    });
  };
  _proto.messages = function messages2(_messages) {
    if (_messages) {
      this._messages = deepMerge(newMessages(), _messages);
    }
    return this._messages;
  };
  _proto.validate = function validate(source_, o, oc) {
    var _this2 = this;
    if (o === void 0) {
      o = {};
    }
    if (oc === void 0) {
      oc = function oc2() {
      };
    }
    var source = source_;
    var options = o;
    var callback = oc;
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    if (!this.rules || Object.keys(this.rules).length === 0) {
      if (callback) {
        callback(null, source);
      }
      return Promise.resolve(source);
    }
    function complete(results) {
      var errors = [];
      var fields = {};
      function add(e) {
        if (Array.isArray(e)) {
          var _errors;
          errors = (_errors = errors).concat.apply(_errors, e);
        } else {
          errors.push(e);
        }
      }
      for (var i = 0; i < results.length; i++) {
        add(results[i]);
      }
      if (!errors.length) {
        callback(null, source);
      } else {
        fields = convertFieldsError(errors);
        callback(errors, fields);
      }
    }
    if (options.messages) {
      var messages$1 = this.messages();
      if (messages$1 === messages) {
        messages$1 = newMessages();
      }
      deepMerge(messages$1, options.messages);
      options.messages = messages$1;
    } else {
      options.messages = this.messages();
    }
    var series = {};
    var keys = options.keys || Object.keys(this.rules);
    keys.forEach(function(z) {
      var arr = _this2.rules[z];
      var value = source[z];
      arr.forEach(function(r) {
        var rule = r;
        if (typeof rule.transform === "function") {
          if (source === source_) {
            source = _extends({}, source);
          }
          value = source[z] = rule.transform(value);
        }
        if (typeof rule === "function") {
          rule = {
            validator: rule
          };
        } else {
          rule = _extends({}, rule);
        }
        rule.validator = _this2.getValidationMethod(rule);
        if (!rule.validator) {
          return;
        }
        rule.field = z;
        rule.fullField = rule.fullField || z;
        rule.type = _this2.getType(rule);
        series[z] = series[z] || [];
        series[z].push({
          rule,
          value,
          source,
          field: z
        });
      });
    });
    var errorFields = {};
    return asyncMap(series, options, function(data, doIt) {
      var rule = data.rule;
      var deep = (rule.type === "object" || rule.type === "array") && (typeof rule.fields === "object" || typeof rule.defaultField === "object");
      deep = deep && (rule.required || !rule.required && data.value);
      rule.field = data.field;
      function addFullField(key, schema) {
        return _extends({}, schema, {
          fullField: rule.fullField + "." + key,
          fullFields: rule.fullFields ? [].concat(rule.fullFields, [key]) : [key]
        });
      }
      function cb(e) {
        if (e === void 0) {
          e = [];
        }
        var errorList = Array.isArray(e) ? e : [e];
        if (!options.suppressWarning && errorList.length) {
          Schema2.warning("async-validator:", errorList);
        }
        if (errorList.length && rule.message !== void 0) {
          errorList = [].concat(rule.message);
        }
        var filledErrors = errorList.map(complementError(rule, source));
        if (options.first && filledErrors.length) {
          errorFields[rule.field] = 1;
          return doIt(filledErrors);
        }
        if (!deep) {
          doIt(filledErrors);
        } else {
          if (rule.required && !data.value) {
            if (rule.message !== void 0) {
              filledErrors = [].concat(rule.message).map(complementError(rule, source));
            } else if (options.error) {
              filledErrors = [options.error(rule, format(options.messages.required, rule.field))];
            }
            return doIt(filledErrors);
          }
          var fieldsSchema = {};
          if (rule.defaultField) {
            Object.keys(data.value).map(function(key) {
              fieldsSchema[key] = rule.defaultField;
            });
          }
          fieldsSchema = _extends({}, fieldsSchema, data.rule.fields);
          var paredFieldsSchema = {};
          Object.keys(fieldsSchema).forEach(function(field) {
            var fieldSchema = fieldsSchema[field];
            var fieldSchemaList = Array.isArray(fieldSchema) ? fieldSchema : [fieldSchema];
            paredFieldsSchema[field] = fieldSchemaList.map(addFullField.bind(null, field));
          });
          var schema = new Schema2(paredFieldsSchema);
          schema.messages(options.messages);
          if (data.rule.options) {
            data.rule.options.messages = options.messages;
            data.rule.options.error = options.error;
          }
          schema.validate(data.value, data.rule.options || options, function(errs) {
            var finalErrors = [];
            if (filledErrors && filledErrors.length) {
              finalErrors.push.apply(finalErrors, filledErrors);
            }
            if (errs && errs.length) {
              finalErrors.push.apply(finalErrors, errs);
            }
            doIt(finalErrors.length ? finalErrors : null);
          });
        }
      }
      var res;
      if (rule.asyncValidator) {
        res = rule.asyncValidator(rule, data.value, cb, data.source, options);
      } else if (rule.validator) {
        try {
          res = rule.validator(rule, data.value, cb, data.source, options);
        } catch (error) {
          console.error == null ? void 0 : console.error(error);
          if (!options.suppressValidatorError) {
            setTimeout(function() {
              throw error;
            }, 0);
          }
          cb(error.message);
        }
        if (res === true) {
          cb();
        } else if (res === false) {
          cb(typeof rule.message === "function" ? rule.message(rule.fullField || rule.field) : rule.message || (rule.fullField || rule.field) + " fails");
        } else if (res instanceof Array) {
          cb(res);
        } else if (res instanceof Error) {
          cb(res.message);
        }
      }
      if (res && res.then) {
        res.then(function() {
          return cb();
        }, function(e) {
          return cb(e);
        });
      }
    }, function(results) {
      complete(results);
    }, source);
  };
  _proto.getType = function getType(rule) {
    if (rule.type === void 0 && rule.pattern instanceof RegExp) {
      rule.type = "pattern";
    }
    if (typeof rule.validator !== "function" && rule.type && !validators.hasOwnProperty(rule.type)) {
      throw new Error(format("Unknown rule type %s", rule.type));
    }
    return rule.type || "string";
  };
  _proto.getValidationMethod = function getValidationMethod(rule) {
    if (typeof rule.validator === "function") {
      return rule.validator;
    }
    var keys = Object.keys(rule);
    var messageIndex = keys.indexOf("message");
    if (messageIndex !== -1) {
      keys.splice(messageIndex, 1);
    }
    if (keys.length === 1 && keys[0] === "required") {
      return validators.required;
    }
    return validators[this.getType(rule)] || void 0;
  };
  return Schema2;
}();
Schema.register = function register(type4, validator6) {
  if (typeof validator6 !== "function") {
    throw new Error("Cannot register a validator by type, validator is not a function");
  }
  validators[type4] = validator6;
};
Schema.warning = warning;
Schema.messages = messages;
Schema.validators = validators;

// node_modules/xb-element/dist/es/x-element.js
var Pt = typeof global == "object" && global && global.Object === Object && global;
var xn = typeof self == "object" && self && self.Object === Object && self;
var _ = Pt || xn || Function("return this")();
var L = _.Symbol;
var Et = Object.prototype;
var On = Et.hasOwnProperty;
var In = Et.toString;
var se = L ? L.toStringTag : void 0;
function Cn(e) {
  var t = On.call(e, se), n = e[se];
  try {
    e[se] = void 0;
    var r = true;
  } catch {
  }
  var o = In.call(e);
  return r && (t ? e[se] = n : delete e[se]), o;
}
var jn = Object.prototype;
var Sn = jn.toString;
function An(e) {
  return Sn.call(e);
}
var Vn = "[object Null]";
var Pn = "[object Undefined]";
var rt = L ? L.toStringTag : void 0;
function J(e) {
  return e == null ? e === void 0 ? Pn : Vn : rt && rt in Object(e) ? Cn(e) : An(e);
}
function Q(e) {
  return e != null && typeof e == "object";
}
var En = "[object Symbol]";
function Ee(e) {
  return typeof e == "symbol" || Q(e) && J(e) == En;
}
function Bt(e, t) {
  for (var n = -1, r = e == null ? 0 : e.length, o = Array(r); ++n < r; )
    o[n] = t(e[n], n, e);
  return o;
}
var ee = Array.isArray;
var ot = L ? L.prototype : void 0;
var at = ot ? ot.toString : void 0;
function Ft(e) {
  if (typeof e == "string")
    return e;
  if (ee(e))
    return Bt(e, Ft) + "";
  if (Ee(e))
    return at ? at.call(e) : "";
  var t = e + "";
  return t == "0" && 1 / e == -1 / 0 ? "-0" : t;
}
var Bn = /\s/;
function Fn(e) {
  for (var t = e.length; t-- && Bn.test(e.charAt(t)); )
    ;
  return t;
}
var Mn = /^\s+/;
function Dn(e) {
  return e && e.slice(0, Fn(e) + 1).replace(Mn, "");
}
function Z(e) {
  var t = typeof e;
  return e != null && (t == "object" || t == "function");
}
var it = NaN;
var Nn = /^[-+]0x[0-9a-f]+$/i;
var Rn = /^0b[01]+$/i;
var zn = /^0o[0-7]+$/i;
var _n = parseInt;
function lt(e) {
  if (typeof e == "number")
    return e;
  if (Ee(e))
    return it;
  if (Z(e)) {
    var t = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = Z(t) ? t + "" : t;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = Dn(e);
  var n = Rn.test(e);
  return n || zn.test(e) ? _n(e.slice(2), n ? 2 : 8) : Nn.test(e) ? it : +e;
}
function Ln(e) {
  return e;
}
var Un = "[object AsyncFunction]";
var Hn = "[object Function]";
var Kn = "[object GeneratorFunction]";
var Gn = "[object Proxy]";
function Ae(e) {
  if (!Z(e))
    return false;
  var t = J(e);
  return t == Hn || t == Kn || t == Un || t == Gn;
}
var De = _["__core-js_shared__"];
var st = function() {
  var e = /[^.]+$/.exec(De && De.keys && De.keys.IE_PROTO || "");
  return e ? "Symbol(src)_1." + e : "";
}();
function Wn(e) {
  return !!st && st in e;
}
var qn = Function.prototype;
var Xn = qn.toString;
function te(e) {
  if (e != null) {
    try {
      return Xn.call(e);
    } catch {
    }
    try {
      return e + "";
    } catch {
    }
  }
  return "";
}
var Zn = /[\\^$.*+?()[\]{}|]/g;
var Yn = /^\[object .+?Constructor\]$/;
var Jn = Function.prototype;
var Qn = Object.prototype;
var er = Jn.toString;
var tr = Qn.hasOwnProperty;
var nr = RegExp(
  "^" + er.call(tr).replace(Zn, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function rr(e) {
  if (!Z(e) || Wn(e))
    return false;
  var t = Ae(e) ? nr : Yn;
  return t.test(te(e));
}
function or(e, t) {
  return e == null ? void 0 : e[t];
}
function ne(e, t) {
  var n = or(e, t);
  return rr(n) ? n : void 0;
}
var Le = ne(_, "WeakMap");
function ar(e, t, n) {
  switch (n.length) {
    case 0:
      return e.call(t);
    case 1:
      return e.call(t, n[0]);
    case 2:
      return e.call(t, n[0], n[1]);
    case 3:
      return e.call(t, n[0], n[1], n[2]);
  }
  return e.apply(t, n);
}
var ir = 800;
var lr = 16;
var sr = Date.now;
function cr(e) {
  var t = 0, n = 0;
  return function() {
    var r = sr(), o = lr - (r - n);
    if (n = r, o > 0) {
      if (++t >= ir)
        return arguments[0];
    } else
      t = 0;
    return e.apply(void 0, arguments);
  };
}
function ur(e) {
  return function() {
    return e;
  };
}
var Ve = function() {
  try {
    var e = ne(Object, "defineProperty");
    return e({}, "", {}), e;
  } catch {
  }
}();
var dr = Ve ? function(e, t) {
  return Ve(e, "toString", {
    configurable: true,
    enumerable: false,
    value: ur(t),
    writable: true
  });
} : Ln;
var fr = cr(dr);
function pr(e, t) {
  for (var n = -1, r = e == null ? 0 : e.length; ++n < r && t(e[n], n, e) !== false; )
    ;
  return e;
}
var hr = 9007199254740991;
var vr = /^(?:0|[1-9]\d*)$/;
function mr(e, t) {
  var n = typeof e;
  return t = t ?? hr, !!t && (n == "number" || n != "symbol" && vr.test(e)) && e > -1 && e % 1 == 0 && e < t;
}
function Mt(e, t, n) {
  t == "__proto__" && Ve ? Ve(e, t, {
    configurable: true,
    enumerable: true,
    value: n,
    writable: true
  }) : e[t] = n;
}
function Dt(e, t) {
  return e === t || e !== e && t !== t;
}
var gr = Object.prototype;
var yr = gr.hasOwnProperty;
function Nt(e, t, n) {
  var r = e[t];
  (!(yr.call(e, t) && Dt(r, n)) || n === void 0 && !(t in e)) && Mt(e, t, n);
}
function br(e, t, n, r) {
  var o = !n;
  n || (n = {});
  for (var l = -1, a = t.length; ++l < a; ) {
    var s = t[l], c = void 0;
    c === void 0 && (c = e[s]), o ? Mt(n, s, c) : Nt(n, s, c);
  }
  return n;
}
var ct = Math.max;
function $r(e, t, n) {
  return t = ct(t === void 0 ? e.length - 1 : t, 0), function() {
    for (var r = arguments, o = -1, l = ct(r.length - t, 0), a = Array(l); ++o < l; )
      a[o] = r[t + o];
    o = -1;
    for (var s = Array(t + 1); ++o < t; )
      s[o] = r[o];
    return s[t] = n(a), ar(e, this, s);
  };
}
var wr = 9007199254740991;
function Rt(e) {
  return typeof e == "number" && e > -1 && e % 1 == 0 && e <= wr;
}
function Tr(e) {
  return e != null && Rt(e.length) && !Ae(e);
}
var kr = Object.prototype;
function xr(e) {
  var t = e && e.constructor, n = typeof t == "function" && t.prototype || kr;
  return e === n;
}
function Or(e, t) {
  for (var n = -1, r = Array(e); ++n < e; )
    r[n] = t(n);
  return r;
}
var Ir = "[object Arguments]";
function ut(e) {
  return Q(e) && J(e) == Ir;
}
var zt = Object.prototype;
var Cr = zt.hasOwnProperty;
var jr = zt.propertyIsEnumerable;
var _t = ut(/* @__PURE__ */ function() {
  return arguments;
}()) ? ut : function(e) {
  return Q(e) && Cr.call(e, "callee") && !jr.call(e, "callee");
};
function Sr() {
  return false;
}
var Lt = typeof exports == "object" && exports && !exports.nodeType && exports;
var dt = Lt && typeof module == "object" && module && !module.nodeType && module;
var Ar = dt && dt.exports === Lt;
var ft = Ar ? _.Buffer : void 0;
var Vr = ft ? ft.isBuffer : void 0;
var Ut = Vr || Sr;
var Pr = "[object Arguments]";
var Er = "[object Array]";
var Br = "[object Boolean]";
var Fr = "[object Date]";
var Mr = "[object Error]";
var Dr = "[object Function]";
var Nr = "[object Map]";
var Rr = "[object Number]";
var zr = "[object Object]";
var _r = "[object RegExp]";
var Lr = "[object Set]";
var Ur = "[object String]";
var Hr = "[object WeakMap]";
var Kr = "[object ArrayBuffer]";
var Gr = "[object DataView]";
var Wr = "[object Float32Array]";
var qr = "[object Float64Array]";
var Xr = "[object Int8Array]";
var Zr = "[object Int16Array]";
var Yr = "[object Int32Array]";
var Jr = "[object Uint8Array]";
var Qr = "[object Uint8ClampedArray]";
var eo = "[object Uint16Array]";
var to = "[object Uint32Array]";
var w = {};
w[Wr] = w[qr] = w[Xr] = w[Zr] = w[Yr] = w[Jr] = w[Qr] = w[eo] = w[to] = true;
w[Pr] = w[Er] = w[Kr] = w[Br] = w[Gr] = w[Fr] = w[Mr] = w[Dr] = w[Nr] = w[Rr] = w[zr] = w[_r] = w[Lr] = w[Ur] = w[Hr] = false;
function no(e) {
  return Q(e) && Rt(e.length) && !!w[J(e)];
}
function Ze(e) {
  return function(t) {
    return e(t);
  };
}
var Ht = typeof exports == "object" && exports && !exports.nodeType && exports;
var ue = Ht && typeof module == "object" && module && !module.nodeType && module;
var ro = ue && ue.exports === Ht;
var Ne = ro && Pt.process;
var ie = function() {
  try {
    var e = ue && ue.require && ue.require("util").types;
    return e || Ne && Ne.binding && Ne.binding("util");
  } catch {
  }
}();
var pt = ie && ie.isTypedArray;
var oo = pt ? Ze(pt) : no;
function ao(e, t) {
  var n = ee(e), r = !n && _t(e), o = !n && !r && Ut(e), l = !n && !r && !o && oo(e), a = n || r || o || l, s = a ? Or(e.length, String) : [], c = s.length;
  for (var i in e)
    a && // Safari 9 has enumerable `arguments.length` in strict mode.
    (i == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
    o && (i == "offset" || i == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    l && (i == "buffer" || i == "byteLength" || i == "byteOffset") || // Skip index properties.
    mr(i, c)) || s.push(i);
  return s;
}
function io(e, t) {
  return function(n) {
    return e(t(n));
  };
}
function lo(e) {
  var t = [];
  if (e != null)
    for (var n in Object(e))
      t.push(n);
  return t;
}
var so = Object.prototype;
var co = so.hasOwnProperty;
function uo(e) {
  if (!Z(e))
    return lo(e);
  var t = xr(e), n = [];
  for (var r in e)
    r == "constructor" && (t || !co.call(e, r)) || n.push(r);
  return n;
}
function fo(e) {
  return Tr(e) ? ao(e) : uo(e);
}
var po = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var ho = /^\w*$/;
function vo(e, t) {
  if (ee(e))
    return false;
  var n = typeof e;
  return n == "number" || n == "symbol" || n == "boolean" || e == null || Ee(e) ? true : ho.test(e) || !po.test(e) || t != null && e in Object(t);
}
var he = ne(Object, "create");
function mo() {
  this.__data__ = he ? he(null) : {}, this.size = 0;
}
function go(e) {
  var t = this.has(e) && delete this.__data__[e];
  return this.size -= t ? 1 : 0, t;
}
var yo = "__lodash_hash_undefined__";
var bo = Object.prototype;
var $o = bo.hasOwnProperty;
function wo(e) {
  var t = this.__data__;
  if (he) {
    var n = t[e];
    return n === yo ? void 0 : n;
  }
  return $o.call(t, e) ? t[e] : void 0;
}
var To = Object.prototype;
var ko = To.hasOwnProperty;
function xo(e) {
  var t = this.__data__;
  return he ? t[e] !== void 0 : ko.call(t, e);
}
var Oo = "__lodash_hash_undefined__";
function Io(e, t) {
  var n = this.__data__;
  return this.size += this.has(e) ? 0 : 1, n[e] = he && t === void 0 ? Oo : t, this;
}
function Y(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.clear(); ++t < n; ) {
    var r = e[t];
    this.set(r[0], r[1]);
  }
}
Y.prototype.clear = mo;
Y.prototype.delete = go;
Y.prototype.get = wo;
Y.prototype.has = xo;
Y.prototype.set = Io;
function Co() {
  this.__data__ = [], this.size = 0;
}
function Be(e, t) {
  for (var n = e.length; n--; )
    if (Dt(e[n][0], t))
      return n;
  return -1;
}
var jo = Array.prototype;
var So = jo.splice;
function Ao(e) {
  var t = this.__data__, n = Be(t, e);
  if (n < 0)
    return false;
  var r = t.length - 1;
  return n == r ? t.pop() : So.call(t, n, 1), --this.size, true;
}
function Vo(e) {
  var t = this.__data__, n = Be(t, e);
  return n < 0 ? void 0 : t[n][1];
}
function Po(e) {
  return Be(this.__data__, e) > -1;
}
function Eo(e, t) {
  var n = this.__data__, r = Be(n, e);
  return r < 0 ? (++this.size, n.push([e, t])) : n[r][1] = t, this;
}
function G(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.clear(); ++t < n; ) {
    var r = e[t];
    this.set(r[0], r[1]);
  }
}
G.prototype.clear = Co;
G.prototype.delete = Ao;
G.prototype.get = Vo;
G.prototype.has = Po;
G.prototype.set = Eo;
var ve = ne(_, "Map");
function Bo() {
  this.size = 0, this.__data__ = {
    hash: new Y(),
    map: new (ve || G)(),
    string: new Y()
  };
}
function Fo(e) {
  var t = typeof e;
  return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
}
function Fe(e, t) {
  var n = e.__data__;
  return Fo(t) ? n[typeof t == "string" ? "string" : "hash"] : n.map;
}
function Mo(e) {
  var t = Fe(this, e).delete(e);
  return this.size -= t ? 1 : 0, t;
}
function Do(e) {
  return Fe(this, e).get(e);
}
function No(e) {
  return Fe(this, e).has(e);
}
function Ro(e, t) {
  var n = Fe(this, e), r = n.size;
  return n.set(e, t), this.size += n.size == r ? 0 : 1, this;
}
function q(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.clear(); ++t < n; ) {
    var r = e[t];
    this.set(r[0], r[1]);
  }
}
q.prototype.clear = Bo;
q.prototype.delete = Mo;
q.prototype.get = Do;
q.prototype.has = No;
q.prototype.set = Ro;
var zo = "Expected a function";
function Ye(e, t) {
  if (typeof e != "function" || t != null && typeof t != "function")
    throw new TypeError(zo);
  var n = function() {
    var r = arguments, o = t ? t.apply(this, r) : r[0], l = n.cache;
    if (l.has(o))
      return l.get(o);
    var a = e.apply(this, r);
    return n.cache = l.set(o, a) || l, a;
  };
  return n.cache = new (Ye.Cache || q)(), n;
}
Ye.Cache = q;
var _o = 500;
function Lo(e) {
  var t = Ye(e, function(r) {
    return n.size === _o && n.clear(), r;
  }), n = t.cache;
  return t;
}
var Uo = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
var Ho = /\\(\\)?/g;
var Ko = Lo(function(e) {
  var t = [];
  return e.charCodeAt(0) === 46 && t.push(""), e.replace(Uo, function(n, r, o, l) {
    t.push(o ? l.replace(Ho, "$1") : r || n);
  }), t;
});
function Go(e) {
  return e == null ? "" : Ft(e);
}
function Je(e, t) {
  return ee(e) ? e : vo(e, t) ? [e] : Ko(Go(e));
}
function Kt(e) {
  if (typeof e == "string" || Ee(e))
    return e;
  var t = e + "";
  return t == "0" && 1 / e == -1 / 0 ? "-0" : t;
}
function Wo(e, t) {
  t = Je(t, e);
  for (var n = 0, r = t.length; e != null && n < r; )
    e = e[Kt(t[n++])];
  return n && n == r ? e : void 0;
}
function Qe(e, t) {
  for (var n = -1, r = t.length, o = e.length; ++n < r; )
    e[o + n] = t[n];
  return e;
}
var ht = L ? L.isConcatSpreadable : void 0;
function qo(e) {
  return ee(e) || _t(e) || !!(ht && e && e[ht]);
}
function Xo(e, t, n, r, o) {
  var l = -1, a = e.length;
  for (n || (n = qo), o || (o = []); ++l < a; ) {
    var s = e[l];
    n(s) ? Qe(o, s) : o[o.length] = s;
  }
  return o;
}
function Zo(e) {
  var t = e == null ? 0 : e.length;
  return t ? Xo(e) : [];
}
function Yo(e) {
  return fr($r(e, void 0, Zo), e + "");
}
var Gt = io(Object.getPrototypeOf, Object);
var Jo = "[object Object]";
var Qo = Function.prototype;
var ea = Object.prototype;
var Wt = Qo.toString;
var ta = ea.hasOwnProperty;
var na = Wt.call(Object);
function ra(e) {
  if (!Q(e) || J(e) != Jo)
    return false;
  var t = Gt(e);
  if (t === null)
    return true;
  var n = ta.call(t, "constructor") && t.constructor;
  return typeof n == "function" && n instanceof n && Wt.call(n) == na;
}
function oa(e, t, n) {
  var r = -1, o = e.length;
  t < 0 && (t = -t > o ? 0 : o + t), n = n > o ? o : n, n < 0 && (n += o), o = t > n ? 0 : n - t >>> 0, t >>>= 0;
  for (var l = Array(o); ++r < o; )
    l[r] = e[r + t];
  return l;
}
function aa() {
  this.__data__ = new G(), this.size = 0;
}
function ia(e) {
  var t = this.__data__, n = t.delete(e);
  return this.size = t.size, n;
}
function la(e) {
  return this.__data__.get(e);
}
function sa(e) {
  return this.__data__.has(e);
}
var ca = 200;
function ua(e, t) {
  var n = this.__data__;
  if (n instanceof G) {
    var r = n.__data__;
    if (!ve || r.length < ca - 1)
      return r.push([e, t]), this.size = ++n.size, this;
    n = this.__data__ = new q(r);
  }
  return n.set(e, t), this.size = n.size, this;
}
function le(e) {
  var t = this.__data__ = new G(e);
  this.size = t.size;
}
le.prototype.clear = aa;
le.prototype.delete = ia;
le.prototype.get = la;
le.prototype.has = sa;
le.prototype.set = ua;
var qt = typeof exports == "object" && exports && !exports.nodeType && exports;
var vt = qt && typeof module == "object" && module && !module.nodeType && module;
var da = vt && vt.exports === qt;
var mt = da ? _.Buffer : void 0;
mt && mt.allocUnsafe;
function fa(e, t) {
  return e.slice();
}
function pa(e, t) {
  for (var n = -1, r = e == null ? 0 : e.length, o = 0, l = []; ++n < r; ) {
    var a = e[n];
    t(a, n, e) && (l[o++] = a);
  }
  return l;
}
function Xt() {
  return [];
}
var ha = Object.prototype;
var va = ha.propertyIsEnumerable;
var gt = Object.getOwnPropertySymbols;
var ma = gt ? function(e) {
  return e == null ? [] : (e = Object(e), pa(gt(e), function(t) {
    return va.call(e, t);
  }));
} : Xt;
var ga = Object.getOwnPropertySymbols;
var ya = ga ? function(e) {
  for (var t = []; e; )
    Qe(t, ma(e)), e = Gt(e);
  return t;
} : Xt;
function ba(e, t, n) {
  var r = t(e);
  return ee(e) ? r : Qe(r, n(e));
}
function Zt(e) {
  return ba(e, fo, ya);
}
var Ue = ne(_, "DataView");
var He = ne(_, "Promise");
var Ke = ne(_, "Set");
var yt = "[object Map]";
var $a = "[object Object]";
var bt = "[object Promise]";
var $t = "[object Set]";
var wt = "[object WeakMap]";
var Tt = "[object DataView]";
var wa = te(Ue);
var Ta = te(ve);
var ka = te(He);
var xa = te(Ke);
var Oa = te(Le);
var U = J;
(Ue && U(new Ue(new ArrayBuffer(1))) != Tt || ve && U(new ve()) != yt || He && U(He.resolve()) != bt || Ke && U(new Ke()) != $t || Le && U(new Le()) != wt) && (U = function(e) {
  var t = J(e), n = t == $a ? e.constructor : void 0, r = n ? te(n) : "";
  if (r)
    switch (r) {
      case wa:
        return Tt;
      case Ta:
        return yt;
      case ka:
        return bt;
      case xa:
        return $t;
      case Oa:
        return wt;
    }
  return t;
});
var Ia = Object.prototype;
var Ca = Ia.hasOwnProperty;
function ja(e) {
  var t = e.length, n = new e.constructor(t);
  return t && typeof e[0] == "string" && Ca.call(e, "index") && (n.index = e.index, n.input = e.input), n;
}
var kt = _.Uint8Array;
function et(e) {
  var t = new e.constructor(e.byteLength);
  return new kt(t).set(new kt(e)), t;
}
function Sa(e, t) {
  var n = et(e.buffer);
  return new e.constructor(n, e.byteOffset, e.byteLength);
}
var Aa = /\w*$/;
function Va(e) {
  var t = new e.constructor(e.source, Aa.exec(e));
  return t.lastIndex = e.lastIndex, t;
}
var xt = L ? L.prototype : void 0;
var Ot = xt ? xt.valueOf : void 0;
function Pa(e) {
  return Ot ? Object(Ot.call(e)) : {};
}
function Ea(e, t) {
  var n = et(e.buffer);
  return new e.constructor(n, e.byteOffset, e.length);
}
var Ba = "[object Boolean]";
var Fa = "[object Date]";
var Ma = "[object Map]";
var Da = "[object Number]";
var Na = "[object RegExp]";
var Ra = "[object Set]";
var za = "[object String]";
var _a = "[object Symbol]";
var La = "[object ArrayBuffer]";
var Ua = "[object DataView]";
var Ha = "[object Float32Array]";
var Ka = "[object Float64Array]";
var Ga = "[object Int8Array]";
var Wa = "[object Int16Array]";
var qa = "[object Int32Array]";
var Xa = "[object Uint8Array]";
var Za = "[object Uint8ClampedArray]";
var Ya = "[object Uint16Array]";
var Ja = "[object Uint32Array]";
function Qa(e, t, n) {
  var r = e.constructor;
  switch (t) {
    case La:
      return et(e);
    case Ba:
    case Fa:
      return new r(+e);
    case Ua:
      return Sa(e);
    case Ha:
    case Ka:
    case Ga:
    case Wa:
    case qa:
    case Xa:
    case Za:
    case Ya:
    case Ja:
      return Ea(e);
    case Ma:
      return new r();
    case Da:
    case za:
      return new r(e);
    case Na:
      return Va(e);
    case Ra:
      return new r();
    case _a:
      return Pa(e);
  }
}
var ei = "[object Map]";
function ti(e) {
  return Q(e) && U(e) == ei;
}
var It = ie && ie.isMap;
var ni = It ? Ze(It) : ti;
var ri = "[object Set]";
function oi(e) {
  return Q(e) && U(e) == ri;
}
var Ct = ie && ie.isSet;
var ai = Ct ? Ze(Ct) : oi;
var Yt = "[object Arguments]";
var ii = "[object Array]";
var li = "[object Boolean]";
var si = "[object Date]";
var ci = "[object Error]";
var Jt = "[object Function]";
var ui = "[object GeneratorFunction]";
var di = "[object Map]";
var fi = "[object Number]";
var Qt = "[object Object]";
var pi = "[object RegExp]";
var hi = "[object Set]";
var vi = "[object String]";
var mi = "[object Symbol]";
var gi = "[object WeakMap]";
var yi = "[object ArrayBuffer]";
var bi = "[object DataView]";
var $i = "[object Float32Array]";
var wi = "[object Float64Array]";
var Ti = "[object Int8Array]";
var ki = "[object Int16Array]";
var xi = "[object Int32Array]";
var Oi = "[object Uint8Array]";
var Ii = "[object Uint8ClampedArray]";
var Ci = "[object Uint16Array]";
var ji = "[object Uint32Array]";
var $ = {};
$[Yt] = $[ii] = $[yi] = $[bi] = $[li] = $[si] = $[$i] = $[wi] = $[Ti] = $[ki] = $[xi] = $[di] = $[fi] = $[Qt] = $[pi] = $[hi] = $[vi] = $[mi] = $[Oi] = $[Ii] = $[Ci] = $[ji] = true;
$[ci] = $[Jt] = $[gi] = false;
function ge(e, t, n, r, o, l) {
  var a;
  if (n && (a = o ? n(e, r, o, l) : n(e)), a !== void 0)
    return a;
  if (!Z(e))
    return e;
  var s = ee(e);
  if (s)
    a = ja(e);
  else {
    var c = U(e), i = c == Jt || c == ui;
    if (Ut(e))
      return fa(e);
    if (c == Qt || c == Yt || i && !o)
      a = {};
    else {
      if (!$[c])
        return o ? e : {};
      a = Qa(e, c);
    }
  }
  l || (l = new le());
  var p = l.get(e);
  if (p)
    return p;
  l.set(e, a), ai(e) ? e.forEach(function(u) {
    a.add(ge(u, t, n, u, e, l));
  }) : ni(e) && e.forEach(function(u, f) {
    a.set(f, ge(u, t, n, f, e, l));
  });
  var T = Zt, C = s ? void 0 : T(e);
  return pr(C || e, function(u, f) {
    C && (f = u, u = e[f]), Nt(a, f, ge(u, t, n, f, e, l));
  }), a;
}
var Re = function() {
  return _.Date.now();
};
var Si = "Expected a function";
var Ai = Math.max;
var Vi = Math.min;
function Ge(e, t, n) {
  var r, o, l, a, s, c, i = 0, p = false, T = false, C = true;
  if (typeof e != "function")
    throw new TypeError(Si);
  t = lt(t) || 0, Z(n) && (p = !!n.leading, T = "maxWait" in n, l = T ? Ai(lt(n.maxWait) || 0, t) : l, C = "trailing" in n ? !!n.trailing : C);
  function u(y) {
    var h2 = r, b = o;
    return r = o = void 0, i = y, a = e.apply(b, h2), a;
  }
  function f(y) {
    return i = y, s = setTimeout(S, t), p ? u(y) : a;
  }
  function I(y) {
    var h2 = y - c, b = y - i, g = t - h2;
    return T ? Vi(g, l - b) : g;
  }
  function V(y) {
    var h2 = y - c, b = y - i;
    return c === void 0 || h2 >= t || h2 < 0 || T && b >= l;
  }
  function S() {
    var y = Re();
    if (V(y))
      return D(y);
    s = setTimeout(S, I(y));
  }
  function D(y) {
    return s = void 0, C && r ? u(y) : (r = o = void 0, a);
  }
  function m() {
    s !== void 0 && clearTimeout(s), i = 0, r = c = o = s = void 0;
  }
  function N() {
    return s === void 0 ? a : D(Re());
  }
  function F() {
    var y = Re(), h2 = V(y);
    if (r = arguments, o = this, c = y, h2) {
      if (s === void 0)
        return f(c);
      if (T)
        return clearTimeout(s), s = setTimeout(S, t), u(c);
    }
    return s === void 0 && (s = setTimeout(S, t)), a;
  }
  return F.cancel = m, F.flush = N, F;
}
function Pi(e) {
  var t = e == null ? 0 : e.length;
  return t ? e[t - 1] : void 0;
}
function Ei(e, t) {
  return t.length < 2 ? e : Wo(e, oa(t, 0, -1));
}
function ze(e) {
  return e == null;
}
var Bi = Object.prototype;
var Fi = Bi.hasOwnProperty;
function Mi(e, t) {
  t = Je(t, e);
  var n = -1, r = t.length;
  if (!r)
    return true;
  for (var o = e == null || typeof e != "object" && typeof e != "function"; ++n < r; ) {
    var l = t[n];
    if (typeof l == "string") {
      if (l === "__proto__" && !Fi.call(e, "__proto__"))
        return false;
      if (l === "constructor" && n + 1 < r && typeof t[n + 1] == "string" && t[n + 1] === "prototype") {
        if (o && n === 0)
          continue;
        return false;
      }
    }
  }
  var a = Ei(e, t);
  return a == null || delete a[Kt(Pi(t))];
}
function Di(e) {
  return ra(e) ? void 0 : e;
}
var Ni = 1;
var Ri = 2;
var zi = 4;
var _i = Yo(function(e, t) {
  var n = {};
  if (e == null)
    return n;
  var r = false;
  t = Bt(t, function(l) {
    return l = Je(l, e), r || (r = l.length > 1), l;
  }), br(e, Zt(e), n), r && (n = ge(n, Ni | Ri | zi, Di));
  for (var o = t.length; o--; )
    Mi(n, t[o]);
  return n;
});
var E = defineComponent({
  name: "VkIcon",
  inheritAttrs: false,
  __name: "Icon",
  props: {
    border: { type: Boolean },
    fixedWidth: { type: Boolean },
    flip: { type: [String, Boolean] },
    icon: {},
    mask: {},
    maskId: {},
    listItem: { type: Boolean },
    pull: {},
    pulse: { type: Boolean },
    rotation: {},
    rotateBy: { type: Boolean },
    swapOpacity: { type: Boolean },
    size: {},
    spin: { type: Boolean },
    transform: {},
    symbol: { type: [Boolean, String] },
    title: {},
    titleId: {},
    inverse: { type: Boolean },
    bounce: { type: Boolean },
    shake: { type: Boolean },
    beat: { type: Boolean },
    fade: { type: Boolean },
    beatFade: { type: Boolean },
    spinPulse: { type: Boolean },
    spinReverse: { type: Boolean },
    widthAuto: { type: Boolean },
    type: {},
    color: {}
  },
  setup(e) {
    const t = e, n = computed(() => _i(t, ["color", "type"])), r = computed(() => t.color ? { color: t.color } : {});
    return (o, l) => (openBlock(), createElementBlock("i", mergeProps({
      class: ["vk-icon", { [`vk-icon--${e.type}`]: e.type }]
    }, o.$attrs, { style: r.value }), [
      createVNode(unref(FontAwesomeIcon), normalizeProps(guardReactiveProps(n.value)), null, 16)
    ], 16));
  }
});
var Li = ["disabled", "autofocus", "nativeType"];
var ye = defineComponent({
  name: "VkButton",
  __name: "Button",
  props: {
    type: {},
    plain: { type: Boolean },
    size: {},
    round: { type: Boolean },
    circle: { type: Boolean },
    disabled: { type: Boolean },
    icon: {},
    loading: { type: Boolean },
    nativeType: { default: "button" },
    autofocus: { type: Boolean }
  },
  setup(e, { expose: t }) {
    const n = ref();
    return t({
      ref: n
    }), (r, o) => (openBlock(), createElementBlock("button", {
      ref_key: "buttonRef",
      ref: n,
      class: normalizeClass(["vk-button", {
        [`vk-button--${e.type}`]: e.type,
        [`vk-button--${e.size}`]: e.size,
        "is-circle": e.circle,
        "is-plain": e.plain,
        "is-round": e.round,
        "is-loading": e.loading,
        "is-disabled": e.disabled
      }]),
      disabled: e.disabled || e.loading,
      autofocus: e.autofocus,
      nativeType: e.nativeType
    }, [
      e.loading ? (openBlock(), createBlock(E, {
        key: 0,
        icon: "spinner",
        spin: ""
      })) : createCommentVNode("", true),
      e.icon ? (openBlock(), createBlock(E, {
        key: 1,
        icon: e.icon
      }, null, 8, ["icon"])) : createCommentVNode("", true),
      createBaseVNode("span", null, [
        renderSlot(r.$slots, "default")
      ])
    ], 10, Li));
  }
});
ye.install = (e) => {
  e.component(ye.name || "VkButton", ye);
};
var en = Symbol("collapseContextKey");
var Ui = { class: "vk-collapse" };
var be = defineComponent({
  name: "VkCollapse",
  __name: "Collapse",
  props: {
    modelValue: { default: () => ["a"] },
    accordion: { type: Boolean }
  },
  emits: ["update:modelValue", "change"],
  setup(e, { emit: t }) {
    const n = e, r = t, o = ref(n.modelValue);
    return watch(() => n.modelValue, () => {
      o.value = n.modelValue;
    }), n.accordion && o.value.length > 1 && console.warn("accordion mode should only have one acitve item"), provide(en, {
      activeNames: o,
      handleItemClick: (a) => {
        let s = [...o.value];
        if (n.accordion)
          s = [o.value[0] == a ? "" : a], o.value = s;
        else {
          const c = o.value.indexOf(a);
          c > -1 ? s.splice(c, 1) : s.push(a), o.value = s;
        }
        r("update:modelValue", s), r("change", s);
      }
    }), (a, s) => (openBlock(), createElementBlock("div", Ui, [
      renderSlot(a.$slots, "default")
    ]));
  }
});
var Hi = ["id"];
var Ki = { class: "vk-collapse-item__wrapper" };
var Gi = { class: "vk-collapse-item__content" };
var $e = defineComponent({
  name: "VkCollapseItem",
  __name: "CollapseItem",
  props: {
    name: {},
    title: {},
    disabled: { type: Boolean }
  },
  setup(e) {
    const t = e, n = inject(en), r = computed(() => n == null ? void 0 : n.activeNames.value.includes(t.name)), o = () => {
      t.disabled || (n == null ? void 0 : n.handleItemClick(t.name));
    }, l = {
      beforeEnter(a) {
        a.style.height = "0px", a.style.overflow = "hidden";
      },
      enter(a) {
        a.style.height = `${a.scrollHeight}px`;
      },
      afterEnter(a) {
        a.style.height = "", a.style.overflow = "";
      },
      beforeLeave(a) {
        a.style.height = `${a.scrollHeight}px`, a.style.overflow = "hidden";
      },
      leave(a) {
        a.style.height = "0px";
      },
      afterLeave(a) {
        a.style.height = "", a.style.overflow = "";
      }
    };
    return (a, s) => (openBlock(), createElementBlock("div", {
      class: normalizeClass(["vk-collapse-item", {
        "is-disabled": e.disabled
      }])
    }, [
      createBaseVNode("div", {
        class: normalizeClass(["vk-collapse-item__header", {
          "is-active": r.value,
          "is-disabled": e.disabled
        }]),
        id: `vk-collapse-item-${e.name}`,
        onClick: o
      }, [
        renderSlot(a.$slots, "title", {}, () => [
          createTextVNode(toDisplayString(e.title), 1)
        ]),
        createVNode(E, {
          icon: "angle-right",
          class: "header-angle"
        })
      ], 10, Hi),
      createVNode(Transition, mergeProps({ name: "slide" }, toHandlers(l)), {
        default: withCtx(() => [
          withDirectives(createBaseVNode("div", Ki, [
            createBaseVNode("div", Gi, [
              renderSlot(a.$slots, "default")
            ])
          ], 512), [
            [vShow, r.value]
          ])
        ]),
        _: 3
      }, 16)
    ], 2));
  }
});
be.install = (e) => {
  e.component(be.name || "VkCollapse", be);
};
$e.install = (e) => {
  e.component($e.name || "VkCollapseItem", $e);
};
var Wi = (e, t) => {
  const n = (r) => {
    e.value && r.target && (e.value.contains(r.target) || t(r));
  };
  onMounted(() => {
    document.addEventListener("click", n);
  }), onUnmounted(() => {
    document.removeEventListener("click", n);
  });
};
var re = defineComponent({
  name: "VkTooltip",
  __name: "Tooltip",
  props: {
    content: {},
    trigger: { default: "click" },
    placement: { default: "right" },
    manual: { type: Boolean },
    popperOptions: {},
    externalMiddleware: {},
    transition: { default: "fade" },
    openDelay: { default: 0 },
    closeDelay: { default: 0 }
  },
  emits: ["visible-change", "click-outside"],
  setup(e, { expose: t, emit: n }) {
    const r = computed(() => {
      var _a2, _b;
      const g = [
        offset2(10),
        shift2({ padding: 8 }),
        // flip({
        //   // 可选配置：翻转的备选顺序，默认会自动寻找可用空间
        //   fallbackPlacements: ['bottom', 'right', 'left']
        // }),
        arrow3({ element: i, padding: 4 })
      ];
      let R;
      return ((_a2 = e.popperOptions) == null ? void 0 : _a2.middleware) ? R = [
        ...g,
        ...Array.isArray((_b = e.popperOptions) == null ? void 0 : _b.middleware) ? e.popperOptions.middleware : []
      ] : R = [...g], {
        placement: e.placement,
        whileElementsMounted: autoUpdate,
        ...e.popperOptions,
        middleware: R
      };
    }), o = n, l = ref(false), a = ref(), s = ref(), c = ref(), i = ref();
    let p = reactive({}), T = reactive({});
    const { floatingStyles: C, middlewareData: u, placement: f } = useFloating(
      a,
      s,
      r.value
      // 直接传递 computed 引用
    ), I = computed(() => f.value.split("-")[0]), V = computed(() => {
      const g = u.value.arrow;
      if (!g) return {};
      const { x: R, y: Me } = g, nn = {
        top: "bottom",
        right: "left",
        bottom: "top",
        left: "right"
      }[I.value];
      return {
        left: R != null ? `${R}px` : "",
        top: Me != null ? `${Me}px` : "",
        right: "",
        bottom: "",
        // 将箭头向外推出其自身大小的一半（假设箭头是 8x8，这里就是 -4px）
        // 这使得箭头呈现“一半在 Tooltip 内，一半在 Tooltip 外”的视觉效果
        [nn]: "-4px"
      };
    }), S = () => {
      l.value = true, o("visible-change", true);
    }, D = () => {
      l.value = false, o("visible-change", false);
    }, m = Ge(S, e.openDelay), N = Ge(D, e.closeDelay), F = () => {
      N.cancel(), m();
    }, y = () => {
      m.cancel(), N();
    }, h2 = () => {
      l.value ? y() : F();
    }, b = () => {
      e.trigger === "hover" ? (p.mouseenter = F, T.mouseleave = y) : e.trigger === "click" && (p.click = h2);
    };
    return Wi(c, () => {
      l.value && e.trigger === "click" && !e.manual && y(), l.value && o("click-outside", true);
    }), watch(
      () => e.trigger,
      (g, R) => {
        g !== R && (p = {}, T = {}, b());
      }
    ), e.manual || b(), watch(() => e.manual, (g) => {
      g ? (p = {}, T = {}) : b();
    }), onUnmounted(() => {
      l.value = false;
    }), t({
      show: F,
      hide: y
    }), (g, R) => (openBlock(), createElementBlock("div", mergeProps({ class: "vk-tooltip" }, toHandlers(unref(T), true), {
      ref_key: "popperOutContainer",
      ref: c
    }), [
      createBaseVNode("div", mergeProps({
        class: "vk-tooltip__trigger",
        ref_key: "triggerNode",
        ref: a
      }, toHandlers(unref(p), true)), [
        renderSlot(g.$slots, "default")
      ], 16),
      createVNode(Transition, { name: e.transition }, {
        default: withCtx(() => [
          l.value ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: "vk-tooltip__popper",
            ref_key: "overlayNode",
            ref: s,
            style: normalizeStyle(unref(C))
          }, [
            renderSlot(g.$slots, "content", {}, () => [
              createTextVNode(toDisplayString(e.content), 1)
            ]),
            createBaseVNode("div", {
              ref_key: "arrowRef",
              ref: i,
              id: "arrow",
              class: normalizeClass(`arrow-${I.value}`),
              style: normalizeStyle(V.value)
            }, null, 6)
          ], 4)) : createCommentVNode("", true)
        ]),
        _: 3
      }, 8, ["name"])
    ], 16));
  }
});
var tt = defineComponent({
  props: {
    vNode: {
      type: [String, Object],
      required: true
    }
  },
  setup(e) {
    return () => e.vNode;
  }
});
var qi = { class: "vk-dropdown" };
var Xi = { class: "vk-dropdown__menu" };
var Zi = {
  key: 0,
  role: "separator",
  class: "divided-placeholder"
};
var Yi = ["onClick", "id"];
var we = defineComponent({
  name: "VkDropDown",
  __name: "Dropdown",
  props: {
    menuOptions: {},
    hideAfterClick: { type: Boolean, default: true },
    content: {},
    trigger: {},
    placement: {},
    manual: { type: Boolean },
    popperOptions: {},
    externalMiddleware: {},
    transition: {},
    openDelay: {},
    closeDelay: {}
  },
  emits: ["visible-change", "select"],
  setup(e, { expose: t, emit: n }) {
    const r = n, o = ref(), l = (s) => {
      r("visible-change", s);
    }, a = (s) => {
      var _a2;
      s.disabled || (r("select", s), e.hideAfterClick && ((_a2 = o.value) == null ? void 0 : _a2.hide()));
    };
    return t({
      show: () => {
        var _a2;
        return (_a2 = o.value) == null ? void 0 : _a2.show();
      },
      hide: () => {
        var _a2;
        return (_a2 = o.value) == null ? void 0 : _a2.hide();
      }
    }), (s, c) => (openBlock(), createElementBlock("div", qi, [
      createVNode(re, {
        placement: e.placement,
        trigger: e.trigger,
        "close-delay": e.closeDelay,
        "open-delay": e.openDelay,
        "popper-options": e.popperOptions,
        manual: e.manual,
        ref_key: "TooltipRef",
        ref: o,
        onVisibleChange: l
      }, {
        content: withCtx(() => [
          createBaseVNode("ul", Xi, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(e.menuOptions, (i) => (openBlock(), createElementBlock(Fragment, {
              key: i.key
            }, [
              i.divided ? (openBlock(), createElementBlock("li", Zi)) : createCommentVNode("", true),
              createBaseVNode("li", {
                onClick: () => a(i),
                class: normalizeClass(["vk-dropdown__item", { "is-disabled": i.disabled, "is-divided": i.divided }]),
                id: `dropdown-item-${i.key}`
              }, [
                createVNode(unref(tt), {
                  "v-node": i.label
                }, null, 8, ["v-node"])
              ], 10, Yi)
            ], 64))), 128))
          ])
        ]),
        default: withCtx(() => [
          renderSlot(s.$slots, "default")
        ]),
        _: 3
      }, 8, ["placement", "trigger", "close-delay", "open-delay", "popper-options", "manual"])
    ]));
  }
});
we.install = (e) => {
  e.component(we.name || "VkDropdown", we);
};
var tn = Symbol("formContextKey");
var Ji = Symbol("formItemContextKey");
var Qi = { class: "vk-form" };
var Te = defineComponent({
  name: "VkForm",
  __name: "Form",
  props: {
    model: {},
    rules: {}
  },
  setup(e, { expose: t }) {
    const n = [], r = (c) => {
      n.push(c);
    }, o = (c) => {
      c.prop && n.splice(n.indexOf(c), 1);
    };
    return provide(tn, { model: e.model, rules: e.rules, addField: r, removeField: o }), t({
      validate: async () => {
        let c = {};
        for (const i of n)
          try {
            await i.validate("");
          } catch (p) {
            c = {
              ...c,
              ...p.fields
            };
          }
        return Object.keys(c).length === 0 ? true : Promise.reject(c);
      },
      clearValidate: (c = []) => {
        (c.length > 0 ? n.filter((p) => c.includes(p.prop)) : n).forEach((p) => p.clearValidate());
      },
      resetFields: (c = []) => {
        (c.length > 0 ? n.filter((p) => c.includes(p.prop)) : n).forEach((p) => p.resetField());
      }
    }), (c, i) => (openBlock(), createElementBlock("form", Qi, [
      renderSlot(c.$slots, "default")
    ]));
  }
});
var el = { class: "vk-form-item__label" };
var tl = { class: "vk-form-item__content" };
var nl = {
  key: 0,
  class: "vk-form-item__error-msg"
};
var ke = defineComponent({
  name: "VkFormItem",
  __name: "FormItem",
  props: {
    label: {},
    prop: {}
  },
  setup(e, { expose: t }) {
    let n = null;
    const r = inject(tn), o = reactive({
      state: "init",
      errorMsg: "",
      loading: false
    }), l = computed(() => {
      const u = r == null ? void 0 : r.model;
      return u && e.prop && !ze(u[e.prop]) ? u[e.prop] : null;
    }), a = computed(() => {
      const u = r == null ? void 0 : r.rules;
      return u && e.prop && !ze(u[e.prop]) ? u[e.prop] : [];
    }), s = (u) => {
      const f = a.value;
      return f ? f.filter((I) => !I.trigger || !u ? true : I.trigger && I.trigger === u) : [];
    }, c = computed(() => a.value.some((u) => u.required)), i = async (u) => {
      const f = e.prop, I = s(u);
      if (I.length === 0)
        return true;
      if (f) {
        const V = new Schema({
          [f]: I
        });
        return o.loading = true, V.validate({ [f]: l.value }).then((S) => {
          o.state = "success", console.log(S);
        }).catch((S) => {
          var _a2;
          const { errors: D } = S;
          return o.state = "error", o.errorMsg = D && D.length > 0 && ((_a2 = D[0]) == null ? void 0 : _a2.message) || "", Promise.reject(S);
        }).finally(() => {
          o.loading = false;
        });
      }
    }, p = () => {
      o.loading = false, o.errorMsg = "", o.state = "init";
    }, T = () => {
      p();
      const u = r == null ? void 0 : r.model;
      u && e.prop && !ze(u[e.prop]) && (u[e.prop] = n);
    }, C = {
      prop: e.prop || "",
      validate: i,
      resetField: T,
      clearValidate: p
    };
    return provide(Ji, C), onMounted(() => {
      e.prop && (r == null ? void 0 : r.addField(C), n = l.value);
    }), onUnmounted(() => {
      r == null ? void 0 : r.removeField(C);
    }), t({
      validateStatus: o,
      validate: i,
      resetField: T,
      clearValidate: p
    }), (u, f) => (openBlock(), createElementBlock("div", {
      class: normalizeClass(["vk-form-item", {
        "is-error": o.state === "error",
        "is-success": o.state === "success",
        "is-loading": o.loading,
        "is-required": c.value
      }])
    }, [
      createBaseVNode("label", el, [
        renderSlot(u.$slots, "label", { label: e.label }, () => [
          createTextVNode(toDisplayString(e.label), 1)
        ])
      ]),
      createBaseVNode("div", tl, [
        renderSlot(u.$slots, "default", { validate: i }),
        o.state === "error" ? (openBlock(), createElementBlock("div", nl, toDisplayString(o.errorMsg), 1)) : createCommentVNode("", true)
      ])
    ], 2));
  }
});
Te.install = (e) => {
  e.component(Te.name || "VkForm", Te);
};
ke.install = (e) => {
  e.component(ke.name || "VkFormItem", ke);
};
E.install = (e) => {
  e.component(E.name || "VkIcon", E);
};
var jt = ref(0);
var rl = (e = 2e3) => {
  const t = ref(e), n = computed(() => jt.value + t.value);
  return {
    currentIndex: n,
    nextIndex: () => (jt.value++, n.value),
    initialZIndex: t
  };
};
var ol = 1;
var X = shallowReactive([]);
var { nextIndex: al } = rl();
var Bl = (e) => {
  const t = `message_${ol++}`, n = document.createElement("div"), r = () => {
    const i = X.findIndex((p) => p.id === t);
    i !== -1 && (X.splice(i, 1), render(null, n));
  }, o = () => {
    const i = X.find((p) => p.id === t);
    i && (i.vm.exposed.visible.value = false);
  }, l = {
    ...e,
    id: t,
    zIndex: al(),
    onDestory: r
  }, a = h(de, l);
  render(a, n), document.body.appendChild(n.firstElementChild);
  const s = a.component, c = {
    id: t,
    vnode: a,
    vm: s,
    props: l,
    destory: o
  };
  return X.push(c), c;
};
var il = (e) => {
  const t = X.findIndex((n) => n.id === e);
  return t <= 0 ? 0 : X[t - 1].vm.exposed.bottomOffset.value;
};
var Fl = () => {
  X.forEach((e) => {
    e.destory();
  });
};
function ll(e, t, n) {
  isRef(e) ? watch(e, (r, o) => {
    o == null ? void 0 : o.removeEventListener(t, n), r == null ? void 0 : r.addEventListener(t, n);
  }) : onMounted(() => {
    e == null ? void 0 : e.addEventListener(t, n);
  }), onUnmounted(() => {
    var _a2;
    (_a2 = unref(e)) == null ? void 0 : _a2.removeEventListener(t, n);
  });
}
var sl = { class: "vk-message__content" };
var cl = {
  key: 0,
  class: "vk-message__close"
};
var de = defineComponent({
  __name: "Message",
  props: {
    message: {},
    duration: { default: 3e3 },
    showClose: { type: Boolean },
    type: { default: "info" },
    onDestory: { type: Function },
    id: {},
    zIndex: {},
    offset: { default: 30 },
    transitionName: { default: "fade-up" }
  },
  setup(e, { expose: t }) {
    const n = ref(false), r = ref(), o = ref(0), l = computed(() => il(e.id)), a = computed(() => e.offset + l.value), s = computed(() => a.value + o.value), c = computed(() => ({
      top: a.value + "px",
      zIndex: e.zIndex
    }));
    let i;
    function p() {
      e.duration !== 0 && (i = setTimeout(() => {
        n.value = false;
      }, e.duration));
    }
    function T() {
      clearTimeout(i);
    }
    const C = () => {
      n.value = false;
    };
    onMounted(async () => {
      n.value = true, p();
    });
    function u(V) {
      V.code === "Escape" && (n.value = false);
    }
    ll(document, "keydown", u);
    function f() {
      e.onDestory();
    }
    function I() {
      o.value = r.value.getBoundingClientRect().height;
    }
    return t({
      bottomOffset: s,
      visible: n
    }), (V, S) => (openBlock(), createBlock(Transition, {
      name: e.transitionName,
      onEnter: I,
      onAfterLeave: f
    }, {
      default: withCtx(() => [
        withDirectives(createBaseVNode("div", {
          class: normalizeClass(["vk-message", {
            [`vk-message--${e.type}`]: e.type,
            "is-close": e.showClose
          }]),
          style: normalizeStyle(c.value),
          ref_key: "messageRef",
          ref: r,
          role: "alert",
          onMouseenter: T,
          onMouseleave: p
        }, [
          createBaseVNode("div", sl, [
            renderSlot(V.$slots, "default", {}, () => [
              e.message ? (openBlock(), createBlock(unref(tt), {
                key: 0,
                "v-node": e.message
              }, null, 8, ["v-node"])) : createCommentVNode("", true)
            ])
          ]),
          e.showClose ? (openBlock(), createElementBlock("div", cl, [
            createVNode(unref(E), {
              onClick: withModifiers(C, ["stop"]),
              icon: "xmark"
            })
          ])) : createCommentVNode("", true)
        ], 38), [
          [vShow, n.value]
        ])
      ]),
      _: 3
    }, 8, ["name"]));
  }
});
de.install = (e) => {
  e.component(de.name || "VkMessage", de);
};
var ul = {
  key: 0,
  class: "vk-input__prepend"
};
var dl = { class: "vk-input__wrapper" };
var fl = {
  key: 0,
  class: "vk-input__prefix"
};
var pl = ["disabled", "readonly", "autocomplete", "placeholder", "autoFocus", "form", "type"];
var hl = {
  key: 1,
  class: "vk-input__append"
};
var vl = ["disabled", "readonly", "autocomplete", "placeholder", "autoFocus", "form"];
var fe = defineComponent({
  name: "VkInput",
  inheritAttrs: false,
  __name: "Input",
  props: {
    type: { default: "text" },
    modelValue: {},
    size: {},
    placeholder: {},
    disabled: { type: Boolean },
    clearable: { type: Boolean },
    showPassword: { type: Boolean },
    readonly: { type: Boolean },
    autoFocus: { type: Boolean },
    form: {},
    autocomplete: { default: "false" }
  },
  emits: ["update:modelValue", "input", "change", "focus", "blur", "clear"],
  setup(e, { expose: t, emit: n }) {
    const r = n, o = ref(e.modelValue), l = ref(false), a = ref(false), s = useAttrs(), c = ref(), i = computed(() => e.clearable && !e.disabled && !!o.value && l.value), p = computed(() => e.showPassword && !e.disabled && !!o.value), T = () => {
      a.value = !a.value;
    }, C = async () => {
      var _a2;
      await nextTick(), (_a2 = c.value) == null ? void 0 : _a2.focus();
    }, u = () => {
      r("update:modelValue", o.value), r("input", o.value);
    }, f = () => {
      r("change", o.value);
    }, I = (m) => {
      l.value = true, r("focus", m);
    }, V = (m) => {
      l.value = false, r("blur", m);
    }, S = () => {
      o.value = "", r("update:modelValue", ""), r("input", ""), r("change", ""), r("clear");
    }, D = () => {
    };
    return watch(
      () => e.modelValue,
      (m) => {
        o.value = m;
      }
    ), t({
      ref: c
    }), (m, N) => (openBlock(), createElementBlock("div", {
      class: normalizeClass(["vk-input", {
        [`vk-input--${e.type}`]: e.type,
        [`vk-input--${e.size}`]: e.size,
        "is-disabled": e.disabled,
        "is-prepend": m.$slots.prepend,
        "is-append": m.$slots.append,
        "is-suffix": m.$slots.suffix,
        "is-prefix": m.$slots.prefix,
        "is-focus": l.value
      }])
    }, [
      e.type !== "textarea" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
        m.$slots.prepend ? (openBlock(), createElementBlock("div", ul, [
          renderSlot(m.$slots, "prepend")
        ])) : createCommentVNode("", true),
        createBaseVNode("div", dl, [
          m.$slots.prefix ? (openBlock(), createElementBlock("div", fl, [
            renderSlot(m.$slots, "prefix")
          ])) : createCommentVNode("", true),
          withDirectives(createBaseVNode("input", mergeProps({
            "onUpdate:modelValue": N[0] || (N[0] = (F) => o.value = F)
          }, unref(s), {
            ref_key: "inputRef",
            ref: c,
            class: "vk-input__inner",
            disabled: e.disabled,
            readonly: e.readonly,
            autocomplete: e.autocomplete,
            placeholder: e.placeholder,
            autoFocus: e.autoFocus,
            form: e.form,
            onInput: u,
            onChange: f,
            onFocus: I,
            onBlur: V,
            type: e.showPassword ? a.value ? "text" : "password" : e.type
          }), null, 16, pl), [
            [vModelDynamic, o.value]
          ]),
          m.$slots.suffix || i.value || e.showPassword ? (openBlock(), createElementBlock("div", {
            key: 1,
            class: "vk-input__suffix",
            onClick: C
          }, [
            renderSlot(m.$slots, "suffix"),
            i.value ? (openBlock(), createBlock(unref(E), {
              key: 0,
              icon: "circle-xmark",
              class: "vk-input__clear",
              onClick: S,
              onMousedown: withModifiers(D, ["prevent"])
            })) : createCommentVNode("", true),
            p.value && a.value ? (openBlock(), createBlock(unref(E), {
              key: 1,
              icon: "eye",
              class: "vk-input__password",
              onClick: T
            })) : createCommentVNode("", true),
            p.value && !a.value ? (openBlock(), createBlock(unref(E), {
              key: 2,
              icon: "eye-slash",
              class: "vk-input__password",
              onClick: T
            })) : createCommentVNode("", true)
          ])) : createCommentVNode("", true)
        ]),
        m.$slots.append ? (openBlock(), createElementBlock("div", hl, [
          renderSlot(m.$slots, "append")
        ])) : createCommentVNode("", true)
      ], 64)) : withDirectives((openBlock(), createElementBlock("textarea", mergeProps({
        key: 1,
        class: "vk-textarea__wrapper"
      }, unref(s), {
        ref_key: "inputRef",
        ref: c,
        disabled: e.disabled,
        readonly: e.readonly,
        autocomplete: e.autocomplete,
        placeholder: e.placeholder,
        autoFocus: e.autoFocus,
        form: e.form,
        "onUpdate:modelValue": N[1] || (N[1] = (F) => o.value = F),
        onInput: u,
        onChange: f,
        onFocus: I,
        onBlur: V
      }), null, 16, vl)), [
        [vModelText, o.value]
      ])
    ], 2));
  }
});
fe.install = (e) => {
  e.component(fe.name || "VkInput", fe);
};
var ml = {
  key: 0,
  class: "vk-select__loading"
};
var gl = {
  key: 1,
  class: "vk-select__noData"
};
var yl = {
  key: 2,
  class: "vk-select__menu"
};
var bl = ["id", "onClick"];
var xe = defineComponent({
  name: "VkSelect",
  __name: "Select",
  props: {
    modelValue: {},
    options: { default: () => [] },
    placeholder: { default: "" },
    disabled: { type: Boolean },
    clearable: { type: Boolean, default: false },
    renderLabel: { type: Function },
    filterable: { type: Boolean },
    filterMethod: { type: Function },
    remote: { type: Boolean },
    remoteMethod: { type: Function }
  },
  emits: ["change", "update:modelValue", "visible-change", "clear"],
  setup(e, { emit: t }) {
    const n = t, r = ref(), o = ref(), l = computed(() => e.remote ? 300 : 0), a = (h2) => {
      const b = e.options.find((g) => g.value === h2);
      return b || null;
    };
    let s = a(e.modelValue);
    watch(() => e.modelValue, (h2) => {
      s = a(h2);
    });
    const c = ref(false), i = reactive({
      inputValue: s ? s.label : "",
      selectedOption: s,
      mouseHover: false,
      loading: false,
      highlightIndex: -1
    }), p = {
      middleware: [
        size2({
          apply({ rects: h2, elements: b }) {
            Object.assign(b.floating.style, {
              // rects.reference.width 就是你输入框的真实 DOM 宽度
              width: `${h2.reference.width}px`
            });
          }
        })
      ]
    }, T = computed(() => e.clearable && i.mouseHover && i.selectedOption && i.inputValue.trim() !== "" && !e.disabled), C = () => {
      i.selectedOption = null, i.inputValue = "", n("clear"), n("change", ""), n("update:modelValue", "");
    }, u = () => {
    }, f = ref(e.options);
    watch(
      () => e.options,
      (h2) => {
        f.value = h2;
      }
    );
    const I = async (h2) => {
      if (e.filterable) {
        if (e.filterMethod && Ae(e.filterMethod))
          f.value = e.filterMethod(h2);
        else if (e.remote && e.remoteMethod && Ae(e.remoteMethod)) {
          i.loading = true;
          try {
            f.value = await e.remoteMethod(h2);
          } catch (b) {
            console.error(b), f.value = [];
          } finally {
            i.loading = false;
          }
        } else
          f.value = e.options.filter((b) => b.label.includes(h2));
        i.highlightIndex = -1;
      }
    }, V = () => {
      I(i.inputValue);
    }, S = Ge(() => {
      V();
    }, l.value), D = computed(() => e.filterable && i.selectedOption && c.value ? i.selectedOption.label : e.placeholder), m = (h2) => {
      h2 ? (e.filterable && i.selectedOption && (i.inputValue = ""), e.filterable && I(i.inputValue), r.value.show()) : (r.value.hide(), e.filterable && (i.inputValue = i.selectedOption ? i.selectedOption.label : ""), i.highlightIndex = -1), c.value = h2, n("visible-change", h2);
    }, N = () => {
      e.disabled || (c.value ? m(false) : m(true));
    }, F = (h2) => {
      switch (h2.key) {
        case "Enter":
          c.value ? i.highlightIndex > -1 && f.value[i.highlightIndex] ? y(f.value[i.highlightIndex]) : m(false) : N();
          break;
        case "Escape":
          c.value && m(false);
          break;
        case "ArrowUp":
          h2.preventDefault(), f.value.length > 0 && (i.highlightIndex === -1 || i.highlightIndex === 0 ? i.highlightIndex = f.value.length - 1 : i.highlightIndex--);
          break;
        case "ArrowDown":
          h2.preventDefault(), f.value.length > 0 && (i.highlightIndex === -1 || i.highlightIndex === f.value.length - 1 ? i.highlightIndex = 0 : i.highlightIndex++);
          break;
      }
    }, y = (h2) => {
      h2.disabled || (i.inputValue = h2.label, i.selectedOption = h2, n("change", h2.value), n("update:modelValue", h2.value), m(false), o.value.ref.focus());
    };
    return (h2, b) => (openBlock(), createElementBlock("div", {
      class: normalizeClass(["vk-select", { "is-disabled": e.disabled }]),
      onClick: N,
      onMouseenter: b[2] || (b[2] = (g) => i.mouseHover = true),
      onMouseleave: b[3] || (b[3] = (g) => i.mouseHover = false)
    }, [
      createVNode(re, {
        placement: "bottom-start",
        manual: "",
        ref_key: "tooltipRef",
        ref: r,
        "popper-options": p,
        onClickOutside: b[1] || (b[1] = (g) => m(false))
      }, {
        content: withCtx(() => [
          i.loading ? (openBlock(), createElementBlock("div", ml, [
            createVNode(unref(E), {
              icon: "spinner",
              spin: ""
            })
          ])) : e.filterable && f.value.length === 0 ? (openBlock(), createElementBlock("div", gl, " no matching data ")) : (openBlock(), createElementBlock("ul", yl, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(f.value, (g, R) => {
              var _a2;
              return openBlock(), createElementBlock("li", {
                key: R,
                class: normalizeClass(["vk-select__menu-item", {
                  "is-disabled": g.disabled,
                  "is-selected": ((_a2 = i.selectedOption) == null ? void 0 : _a2.value) === g.value,
                  "is-highlightIndex": i.highlightIndex === R
                }]),
                id: `select-item-${g.value}`,
                onClick: withModifiers((Me) => y(g), ["stop"])
              }, [
                createVNode(unref(tt), {
                  "v-node": e.renderLabel ? e.renderLabel(g) : g.label
                }, null, 8, ["v-node"])
              ], 10, bl);
            }), 128))
          ]))
        ]),
        default: withCtx(() => [
          createVNode(fe, {
            type: "select",
            modelValue: i.inputValue,
            "onUpdate:modelValue": b[0] || (b[0] = (g) => i.inputValue = g),
            disabled: e.disabled,
            placeholder: D.value,
            ref_key: "inputRef",
            ref: o,
            readonly: !e.filterable || !c.value,
            onInput: unref(S),
            onKeydown: F
          }, {
            suffix: withCtx(() => [
              T.value ? (openBlock(), createBlock(unref(E), {
                key: 0,
                onClick: withModifiers(C, ["stop"]),
                onMousedown: withModifiers(u, ["prevent"]),
                icon: "circle-xmark",
                class: "vk-input__clear"
              })) : (openBlock(), createBlock(unref(E), {
                key: 1,
                icon: "angle-down",
                class: normalizeClass(["header-angle", { "is-active": c.value }])
              }, null, 8, ["class"]))
            ]),
            _: 1
          }, 8, ["modelValue", "disabled", "placeholder", "readonly", "onInput"])
        ]),
        _: 1
      }, 512)
    ], 34));
  }
});
xe.install = (e) => {
  e.component(xe.name || "VkSelect", xe);
};
var $l = ["name", "disabled"];
var wl = { class: "vk-switch__core" };
var Tl = { class: "vk-switch__core-inner" };
var kl = {
  key: 0,
  class: "vk-switch__core-inner-text"
};
var Oe = defineComponent({
  name: "VkSwitch",
  __name: "Switch",
  props: {
    modelValue: { type: [Boolean, String, Number] },
    disabled: { type: Boolean },
    activeText: {},
    inactiveText: {},
    activeValue: { type: [Boolean, String, Number], default: true },
    inactiveValue: { type: [Boolean, String, Number], default: false },
    name: {},
    id: {},
    size: {}
  },
  emits: ["change", "update:modelValue"],
  setup(e, { emit: t }) {
    const n = t, r = ref(e.modelValue), o = computed(() => r.value === e.activeValue), l = ref(), a = () => {
      if (e.disabled)
        return;
      const s = o.value ? e.inactiveValue : e.activeValue;
      r.value = s, n("change", s), n("update:modelValue", s);
    };
    return onMounted(() => {
      l.value.checked = o.value;
    }), watch(o, (s) => {
      l.value.checked = s;
    }), watch(() => e.modelValue, (s) => {
      r.value = s;
    }), (s, c) => (openBlock(), createElementBlock("div", {
      onClick: a,
      class: normalizeClass(["vk-switch", {
        [`vk-switch--${e.size}`]: e.size,
        "is-disabled": e.disabled,
        "is-checked": o.value
      }])
    }, [
      createBaseVNode("input", {
        class: "vk-switch__input",
        type: "checkbox",
        role: "switch",
        ref_key: "input",
        ref: l,
        name: e.name,
        disabled: e.disabled,
        onKeydown: withKeys(a, ["enter"])
      }, null, 40, $l),
      createBaseVNode("div", wl, [
        createBaseVNode("div", Tl, [
          e.activeText || e.inactiveText ? (openBlock(), createElementBlock("span", kl, toDisplayString(o.value ? e.activeText : e.inactiveText), 1)) : createCommentVNode("", true)
        ]),
        c[0] || (c[0] = createBaseVNode("div", { class: "vk-switch__core-action" }, null, -1))
      ])
    ], 2));
  }
});
Oe.install = (e) => {
  e.component(Oe.name || "VkSwitch", Oe);
};
re.install = (e) => {
  e.component(re.name || "VkTooltip", re);
};
var xl = { class: "vk-progress-bar" };
var Ol = {
  key: 0,
  class: "vk-inner-text"
};
var Ie = defineComponent({
  name: "VkProgress",
  __name: "Progress",
  props: {
    percent: {},
    strokeHeight: { default: 15 },
    showText: { type: Boolean, default: false },
    type: { default: "info" }
  },
  setup(e) {
    return (t, n) => (openBlock(), createElementBlock("div", xl, [
      createBaseVNode("div", {
        class: "vk-progress-bar-outer",
        style: normalizeStyle({ height: e.strokeHeight + "px" })
      }, [
        createBaseVNode("div", {
          class: normalizeClass(["vk-progress-bar-inner", {
            [`vk-color-${e.type}`]: e.type
          }]),
          style: normalizeStyle({ width: e.percent + "%" })
        }, [
          e.showText ? (openBlock(), createElementBlock("span", Ol, toDisplayString(e.percent) + "%", 1)) : createCommentVNode("", true)
        ], 6)
      ], 4)
    ]));
  }
});
Ie.install = (e) => {
  e.component(Ie.name || "VkProgress", Ie);
};
library$1.add(icons);
var Il = [
  ye,
  be,
  $e,
  we,
  Te,
  ke,
  E,
  de,
  fe,
  xe,
  Oe,
  re,
  Ie
];
var Cl = (e) => {
  Il.forEach((t) => {
    e.component(t.name, t);
  });
};
var Ml = {
  install: Cl
};
export {
  ye as Button,
  be as Collapse,
  $e as CollapseItem,
  we as Dropdown,
  Te as Form,
  ke as FormItem,
  E as Icon,
  fe as Input,
  de as Message,
  Ie as Progress,
  xe as Select,
  Oe as Switch,
  re as Tooltip,
  Fl as closeAll,
  en as collapseContextKey,
  Bl as createMessage,
  Ml as default,
  tn as formContextKey,
  Ji as formItemContextKey,
  Cl as install
};
//# sourceMappingURL=xb-element_dist_es_x-element.js.map
