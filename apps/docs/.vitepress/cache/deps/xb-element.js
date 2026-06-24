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
  withModifiers,
} from './chunk-N5XGNZJ6.js'
import './chunk-PZ5AY32C.js'

// packages/xbElement/dist/es/x-element.js
import { FontAwesomeIcon as se } from '@fortawesome/vue-fontawesome'

// node_modules/.pnpm/@floating-ui+utils@0.2.11/node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var sides = ['top', 'right', 'bottom', 'left']
var alignments = ['start', 'end']
var placements = sides.reduce(
  (acc, side) =>
    acc.concat(side, side + '-' + alignments[0], side + '-' + alignments[1]),
  [],
)
var min = Math.min
var max = Math.max
var round = Math.round
var floor = Math.floor
var createCoords = v => ({
  x: v,
  y: v,
})
function clamp(start, value, end) {
  return max(start, min(value, end))
}
function evaluate(value, param) {
  return typeof value === 'function' ? value(param) : value
}
function getSide(placement) {
  return placement.split('-')[0]
}
function getAlignment(placement) {
  return placement.split('-')[1]
}
function getOppositeAxis(axis) {
  return axis === 'x' ? 'y' : 'x'
}
function getAxisLength(axis) {
  return axis === 'y' ? 'height' : 'width'
}
function getSideAxis(placement) {
  const firstChar = placement[0]
  return firstChar === 't' || firstChar === 'b' ? 'y' : 'x'
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement))
}
function expandPaddingObject(padding) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...padding,
  }
}
function getPaddingObject(padding) {
  return typeof padding !== 'number'
    ? expandPaddingObject(padding)
    : {
        top: padding,
        right: padding,
        bottom: padding,
        left: padding,
      }
}
function rectToClientRect(rect) {
  const { x, y, width, height } = rect
  return {
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    x,
    y,
  }
}

// node_modules/.pnpm/@floating-ui+core@1.7.5/node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function computeCoordsFromPlacement(_ref, placement, rtl) {
  let { reference, floating } = _ref
  const sideAxis = getSideAxis(placement)
  const alignmentAxis = getAlignmentAxis(placement)
  const alignLength = getAxisLength(alignmentAxis)
  const side = getSide(placement)
  const isVertical = sideAxis === 'y'
  const commonX = reference.x + reference.width / 2 - floating.width / 2
  const commonY = reference.y + reference.height / 2 - floating.height / 2
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2
  let coords
  switch (side) {
    case 'top':
      coords = {
        x: commonX,
        y: reference.y - floating.height,
      }
      break
    case 'bottom':
      coords = {
        x: commonX,
        y: reference.y + reference.height,
      }
      break
    case 'right':
      coords = {
        x: reference.x + reference.width,
        y: commonY,
      }
      break
    case 'left':
      coords = {
        x: reference.x - floating.width,
        y: commonY,
      }
      break
    default:
      coords = {
        x: reference.x,
        y: reference.y,
      }
  }
  switch (getAlignment(placement)) {
    case 'start':
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1)
      break
    case 'end':
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1)
      break
  }
  return coords
}
async function detectOverflow(state, options) {
  var _await$platform$isEle
  if (options === void 0) {
    options = {}
  }
  const { x, y, platform: platform2, rects, elements, strategy } = state
  const {
    boundary = 'clippingAncestors',
    rootBoundary = 'viewport',
    elementContext = 'floating',
    altBoundary = false,
    padding = 0,
  } = evaluate(options, state)
  const paddingObject = getPaddingObject(padding)
  const altContext = elementContext === 'floating' ? 'reference' : 'floating'
  const element = elements[altBoundary ? altContext : elementContext]
  const clippingClientRect = rectToClientRect(
    await platform2.getClippingRect({
      element: (
        (_await$platform$isEle = await (platform2.isElement == null
          ? void 0
          : platform2.isElement(element))) != null
          ? _await$platform$isEle
          : true
      )
        ? element
        : element.contextElement ||
          (await (platform2.getDocumentElement == null
            ? void 0
            : platform2.getDocumentElement(elements.floating))),
      boundary,
      rootBoundary,
      strategy,
    }),
  )
  const rect =
    elementContext === 'floating'
      ? {
          x,
          y,
          width: rects.floating.width,
          height: rects.floating.height,
        }
      : rects.reference
  const offsetParent = await (platform2.getOffsetParent == null
    ? void 0
    : platform2.getOffsetParent(elements.floating))
  const offsetScale = (await (platform2.isElement == null
    ? void 0
    : platform2.isElement(offsetParent)))
    ? (await (platform2.getScale == null
        ? void 0
        : platform2.getScale(offsetParent))) || {
        x: 1,
        y: 1,
      }
    : {
        x: 1,
        y: 1,
      }
  const elementClientRect = rectToClientRect(
    platform2.convertOffsetParentRelativeRectToViewportRelativeRect
      ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
          elements,
          rect,
          offsetParent,
          strategy,
        })
      : rect,
  )
  return {
    top:
      (clippingClientRect.top - elementClientRect.top + paddingObject.top) /
      offsetScale.y,
    bottom:
      (elementClientRect.bottom -
        clippingClientRect.bottom +
        paddingObject.bottom) /
      offsetScale.y,
    left:
      (clippingClientRect.left - elementClientRect.left + paddingObject.left) /
      offsetScale.x,
    right:
      (elementClientRect.right -
        clippingClientRect.right +
        paddingObject.right) /
      offsetScale.x,
  }
}
var MAX_RESET_COUNT = 50
var computePosition = async (reference, floating, config) => {
  const {
    placement = 'bottom',
    strategy = 'absolute',
    middleware = [],
    platform: platform2,
  } = config
  const platformWithDetectOverflow = platform2.detectOverflow
    ? platform2
    : {
        ...platform2,
        detectOverflow,
      }
  const rtl = await (platform2.isRTL == null
    ? void 0
    : platform2.isRTL(floating))
  let rects = await platform2.getElementRects({
    reference,
    floating,
    strategy,
  })
  let { x, y } = computeCoordsFromPlacement(rects, placement, rtl)
  let statefulPlacement = placement
  let resetCount = 0
  const middlewareData = {}
  for (let i = 0; i < middleware.length; i++) {
    const currentMiddleware = middleware[i]
    if (!currentMiddleware) {
      continue
    }
    const { name, fn: fn2 } = currentMiddleware
    const {
      x: nextX,
      y: nextY,
      data,
      reset,
    } = await fn2({
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
        floating,
      },
    })
    x = nextX != null ? nextX : x
    y = nextY != null ? nextY : y
    middlewareData[name] = {
      ...middlewareData[name],
      ...data,
    }
    if (reset && resetCount < MAX_RESET_COUNT) {
      resetCount++
      if (typeof reset === 'object') {
        if (reset.placement) {
          statefulPlacement = reset.placement
        }
        if (reset.rects) {
          rects =
            reset.rects === true
              ? await platform2.getElementRects({
                  reference,
                  floating,
                  strategy,
                })
              : reset.rects
        }
        ;({ x, y } = computeCoordsFromPlacement(rects, statefulPlacement, rtl))
      }
      i = -1
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData,
  }
}
var arrow = options => ({
  name: 'arrow',
  options,
  async fn(state) {
    const {
      x,
      y,
      placement,
      rects,
      platform: platform2,
      elements,
      middlewareData,
    } = state
    const { element, padding = 0 } = evaluate(options, state) || {}
    if (element == null) {
      return {}
    }
    const paddingObject = getPaddingObject(padding)
    const coords = {
      x,
      y,
    }
    const axis = getAlignmentAxis(placement)
    const length = getAxisLength(axis)
    const arrowDimensions = await platform2.getDimensions(element)
    const isYAxis = axis === 'y'
    const minProp = isYAxis ? 'top' : 'left'
    const maxProp = isYAxis ? 'bottom' : 'right'
    const clientProp = isYAxis ? 'clientHeight' : 'clientWidth'
    const endDiff =
      rects.reference[length] +
      rects.reference[axis] -
      coords[axis] -
      rects.floating[length]
    const startDiff = coords[axis] - rects.reference[axis]
    const arrowOffsetParent = await (platform2.getOffsetParent == null
      ? void 0
      : platform2.getOffsetParent(element))
    let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0
    if (
      !clientSize ||
      !(await (platform2.isElement == null
        ? void 0
        : platform2.isElement(arrowOffsetParent)))
    ) {
      clientSize = elements.floating[clientProp] || rects.floating[length]
    }
    const centerToReference = endDiff / 2 - startDiff / 2
    const largestPossiblePadding =
      clientSize / 2 - arrowDimensions[length] / 2 - 1
    const minPadding = min(paddingObject[minProp], largestPossiblePadding)
    const maxPadding = min(paddingObject[maxProp], largestPossiblePadding)
    const min$1 = minPadding
    const max2 = clientSize - arrowDimensions[length] - maxPadding
    const center =
      clientSize / 2 - arrowDimensions[length] / 2 + centerToReference
    const offset3 = clamp(min$1, center, max2)
    const shouldAddOffset =
      !middlewareData.arrow &&
      getAlignment(placement) != null &&
      center !== offset3 &&
      rects.reference[length] / 2 -
        (center < min$1 ? minPadding : maxPadding) -
        arrowDimensions[length] / 2 <
        0
    const alignmentOffset = shouldAddOffset
      ? center < min$1
        ? center - min$1
        : center - max2
      : 0
    return {
      [axis]: coords[axis] + alignmentOffset,
      data: {
        [axis]: offset3,
        centerOffset: center - offset3 - alignmentOffset,
        ...(shouldAddOffset && {
          alignmentOffset,
        }),
      },
      reset: shouldAddOffset,
    }
  },
})
var originSides = /* @__PURE__ */ new Set(['left', 'top'])
async function convertValueToCoords(state, options) {
  const { placement, platform: platform2, elements } = state
  const rtl = await (platform2.isRTL == null
    ? void 0
    : platform2.isRTL(elements.floating))
  const side = getSide(placement)
  const alignment = getAlignment(placement)
  const isVertical = getSideAxis(placement) === 'y'
  const mainAxisMulti = originSides.has(side) ? -1 : 1
  const crossAxisMulti = rtl && isVertical ? -1 : 1
  const rawValue = evaluate(options, state)
  let { mainAxis, crossAxis, alignmentAxis } =
    typeof rawValue === 'number'
      ? {
          mainAxis: rawValue,
          crossAxis: 0,
          alignmentAxis: null,
        }
      : {
          mainAxis: rawValue.mainAxis || 0,
          crossAxis: rawValue.crossAxis || 0,
          alignmentAxis: rawValue.alignmentAxis,
        }
  if (alignment && typeof alignmentAxis === 'number') {
    crossAxis = alignment === 'end' ? alignmentAxis * -1 : alignmentAxis
  }
  return isVertical
    ? {
        x: crossAxis * crossAxisMulti,
        y: mainAxis * mainAxisMulti,
      }
    : {
        x: mainAxis * mainAxisMulti,
        y: crossAxis * crossAxisMulti,
      }
}
var offset = function (options) {
  if (options === void 0) {
    options = 0
  }
  return {
    name: 'offset',
    options,
    async fn(state) {
      var _middlewareData$offse, _middlewareData$arrow
      const { x, y, placement, middlewareData } = state
      const diffCoords = await convertValueToCoords(state, options)
      if (
        placement ===
          ((_middlewareData$offse = middlewareData.offset) == null
            ? void 0
            : _middlewareData$offse.placement) &&
        (_middlewareData$arrow = middlewareData.arrow) != null &&
        _middlewareData$arrow.alignmentOffset
      ) {
        return {}
      }
      return {
        x: x + diffCoords.x,
        y: y + diffCoords.y,
        data: {
          ...diffCoords,
          placement,
        },
      }
    },
  }
}
var shift = function (options) {
  if (options === void 0) {
    options = {}
  }
  return {
    name: 'shift',
    options,
    async fn(state) {
      const { x, y, placement, platform: platform2 } = state
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = false,
        limiter = {
          fn: _ref => {
            let { x: x2, y: y2 } = _ref
            return {
              x: x2,
              y: y2,
            }
          },
        },
        ...detectOverflowOptions
      } = evaluate(options, state)
      const coords = {
        x,
        y,
      }
      const overflow = await platform2.detectOverflow(
        state,
        detectOverflowOptions,
      )
      const crossAxis = getSideAxis(getSide(placement))
      const mainAxis = getOppositeAxis(crossAxis)
      let mainAxisCoord = coords[mainAxis]
      let crossAxisCoord = coords[crossAxis]
      if (checkMainAxis) {
        const minSide = mainAxis === 'y' ? 'top' : 'left'
        const maxSide = mainAxis === 'y' ? 'bottom' : 'right'
        const min2 = mainAxisCoord + overflow[minSide]
        const max2 = mainAxisCoord - overflow[maxSide]
        mainAxisCoord = clamp(min2, mainAxisCoord, max2)
      }
      if (checkCrossAxis) {
        const minSide = crossAxis === 'y' ? 'top' : 'left'
        const maxSide = crossAxis === 'y' ? 'bottom' : 'right'
        const min2 = crossAxisCoord + overflow[minSide]
        const max2 = crossAxisCoord - overflow[maxSide]
        crossAxisCoord = clamp(min2, crossAxisCoord, max2)
      }
      const limitedCoords = limiter.fn({
        ...state,
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord,
      })
      return {
        ...limitedCoords,
        data: {
          x: limitedCoords.x - x,
          y: limitedCoords.y - y,
          enabled: {
            [mainAxis]: checkMainAxis,
            [crossAxis]: checkCrossAxis,
          },
        },
      }
    },
  }
}
var size = function (options) {
  if (options === void 0) {
    options = {}
  }
  return {
    name: 'size',
    options,
    async fn(state) {
      var _state$middlewareData, _state$middlewareData2
      const { placement, rects, platform: platform2, elements } = state
      const { apply = () => {}, ...detectOverflowOptions } = evaluate(
        options,
        state,
      )
      const overflow = await platform2.detectOverflow(
        state,
        detectOverflowOptions,
      )
      const side = getSide(placement)
      const alignment = getAlignment(placement)
      const isYAxis = getSideAxis(placement) === 'y'
      const { width, height } = rects.floating
      let heightSide
      let widthSide
      if (side === 'top' || side === 'bottom') {
        heightSide = side
        widthSide =
          alignment ===
          ((await (platform2.isRTL == null
            ? void 0
            : platform2.isRTL(elements.floating)))
            ? 'start'
            : 'end')
            ? 'left'
            : 'right'
      } else {
        widthSide = side
        heightSide = alignment === 'end' ? 'top' : 'bottom'
      }
      const maximumClippingHeight = height - overflow.top - overflow.bottom
      const maximumClippingWidth = width - overflow.left - overflow.right
      const overflowAvailableHeight = min(
        height - overflow[heightSide],
        maximumClippingHeight,
      )
      const overflowAvailableWidth = min(
        width - overflow[widthSide],
        maximumClippingWidth,
      )
      const noShift = !state.middlewareData.shift
      let availableHeight = overflowAvailableHeight
      let availableWidth = overflowAvailableWidth
      if (
        (_state$middlewareData = state.middlewareData.shift) != null &&
        _state$middlewareData.enabled.x
      ) {
        availableWidth = maximumClippingWidth
      }
      if (
        (_state$middlewareData2 = state.middlewareData.shift) != null &&
        _state$middlewareData2.enabled.y
      ) {
        availableHeight = maximumClippingHeight
      }
      if (noShift && !alignment) {
        const xMin = max(overflow.left, 0)
        const xMax = max(overflow.right, 0)
        const yMin = max(overflow.top, 0)
        const yMax = max(overflow.bottom, 0)
        if (isYAxis) {
          availableWidth =
            width -
            2 *
              (xMin !== 0 || xMax !== 0
                ? xMin + xMax
                : max(overflow.left, overflow.right))
        } else {
          availableHeight =
            height -
            2 *
              (yMin !== 0 || yMax !== 0
                ? yMin + yMax
                : max(overflow.top, overflow.bottom))
        }
      }
      await apply({
        ...state,
        availableWidth,
        availableHeight,
      })
      const nextDimensions = await platform2.getDimensions(elements.floating)
      if (width !== nextDimensions.width || height !== nextDimensions.height) {
        return {
          reset: {
            rects: true,
          },
        }
      }
      return {}
    },
  }
}

// node_modules/.pnpm/@floating-ui+utils@0.2.11/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function hasWindow() {
  return typeof window !== 'undefined'
}
function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || '').toLowerCase()
  }
  return '#document'
}
function getWindow(node) {
  var _node$ownerDocument
  return (
    (node == null || (_node$ownerDocument = node.ownerDocument) == null
      ? void 0
      : _node$ownerDocument.defaultView) || window
  )
}
function getDocumentElement(node) {
  var _ref
  return (_ref =
    (isNode(node) ? node.ownerDocument : node.document) || window.document) ==
    null
    ? void 0
    : _ref.documentElement
}
function isNode(value) {
  if (!hasWindow()) {
    return false
  }
  return value instanceof Node || value instanceof getWindow(value).Node
}
function isElement(value) {
  if (!hasWindow()) {
    return false
  }
  return value instanceof Element || value instanceof getWindow(value).Element
}
function isHTMLElement(value) {
  if (!hasWindow()) {
    return false
  }
  return (
    value instanceof HTMLElement ||
    value instanceof getWindow(value).HTMLElement
  )
}
function isShadowRoot(value) {
  if (!hasWindow() || typeof ShadowRoot === 'undefined') {
    return false
  }
  return (
    value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot
  )
}
function isOverflowElement(element) {
  const { overflow, overflowX, overflowY, display } = getComputedStyle2(element)
  return (
    /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) &&
    display !== 'inline' &&
    display !== 'contents'
  )
}
function isTableElement(element) {
  return /^(table|td|th)$/.test(getNodeName(element))
}
function isTopLayer(element) {
  try {
    if (element.matches(':popover-open')) {
      return true
    }
  } catch (_e2) {}
  try {
    return element.matches(':modal')
  } catch (_e2) {
    return false
  }
}
var willChangeRe = /transform|translate|scale|rotate|perspective|filter/
var containRe = /paint|layout|strict|content/
var isNotNone = value => !!value && value !== 'none'
var isWebKitValue
function isContainingBlock(elementOrCss) {
  const css = isElement(elementOrCss)
    ? getComputedStyle2(elementOrCss)
    : elementOrCss
  return (
    isNotNone(css.transform) ||
    isNotNone(css.translate) ||
    isNotNone(css.scale) ||
    isNotNone(css.rotate) ||
    isNotNone(css.perspective) ||
    (!isWebKit() && (isNotNone(css.backdropFilter) || isNotNone(css.filter))) ||
    willChangeRe.test(css.willChange || '') ||
    containRe.test(css.contain || '')
  )
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element)
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode
    } else if (isTopLayer(currentNode)) {
      return null
    }
    currentNode = getParentNode(currentNode)
  }
  return null
}
function isWebKit() {
  if (isWebKitValue == null) {
    isWebKitValue =
      typeof CSS !== 'undefined' &&
      CSS.supports &&
      CSS.supports('-webkit-backdrop-filter', 'none')
  }
  return isWebKitValue
}
function isLastTraversableNode(node) {
  return /^(html|body|#document)$/.test(getNodeName(node))
}
function getComputedStyle2(element) {
  return getWindow(element).getComputedStyle(element)
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop,
    }
  }
  return {
    scrollLeft: element.scrollX,
    scrollTop: element.scrollY,
  }
}
function getParentNode(node) {
  if (getNodeName(node) === 'html') {
    return node
  }
  const result =
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot || // DOM Element detected.
    node.parentNode || // ShadowRoot detected.
    (isShadowRoot(node) && node.host) || // Fallback.
    getDocumentElement(node)
  return isShadowRoot(result) ? result.host : result
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node)
  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : node.body
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode
  }
  return getNearestOverflowAncestor(parentNode)
}
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2
  if (list === void 0) {
    list = []
  }
  if (traverseIframes === void 0) {
    traverseIframes = true
  }
  const scrollableAncestor = getNearestOverflowAncestor(node)
  const isBody =
    scrollableAncestor ===
    ((_node$ownerDocument2 = node.ownerDocument) == null
      ? void 0
      : _node$ownerDocument2.body)
  const win = getWindow(scrollableAncestor)
  if (isBody) {
    const frameElement = getFrameElement(win)
    return list.concat(
      win,
      win.visualViewport || [],
      isOverflowElement(scrollableAncestor) ? scrollableAncestor : [],
      frameElement && traverseIframes ? getOverflowAncestors(frameElement) : [],
    )
  } else {
    return list.concat(
      scrollableAncestor,
      getOverflowAncestors(scrollableAncestor, [], traverseIframes),
    )
  }
}
function getFrameElement(win) {
  return win.parent && Object.getPrototypeOf(win.parent)
    ? win.frameElement
    : null
}

// node_modules/.pnpm/@floating-ui+dom@1.7.6/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function getCssDimensions(element) {
  const css = getComputedStyle2(element)
  let width = parseFloat(css.width) || 0
  let height = parseFloat(css.height) || 0
  const hasOffset = isHTMLElement(element)
  const offsetWidth = hasOffset ? element.offsetWidth : width
  const offsetHeight = hasOffset ? element.offsetHeight : height
  const shouldFallback =
    round(width) !== offsetWidth || round(height) !== offsetHeight
  if (shouldFallback) {
    width = offsetWidth
    height = offsetHeight
  }
  return {
    width,
    height,
    $: shouldFallback,
  }
}
function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element
}
function getScale(element) {
  const domElement = unwrapElement(element)
  if (!isHTMLElement(domElement)) {
    return createCoords(1)
  }
  const rect = domElement.getBoundingClientRect()
  const { width, height, $: $2 } = getCssDimensions(domElement)
  let x = ($2 ? round(rect.width) : rect.width) / width
  let y = ($2 ? round(rect.height) : rect.height) / height
  if (!x || !Number.isFinite(x)) {
    x = 1
  }
  if (!y || !Number.isFinite(y)) {
    y = 1
  }
  return {
    x,
    y,
  }
}
var noOffsets = createCoords(0)
function getVisualOffsets(element) {
  const win = getWindow(element)
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop,
  }
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false
  }
  if (
    !floatingOffsetParent ||
    (isFixed && floatingOffsetParent !== getWindow(element))
  ) {
    return false
  }
  return isFixed
}
function getBoundingClientRect(
  element,
  includeScale,
  isFixedStrategy,
  offsetParent,
) {
  if (includeScale === void 0) {
    includeScale = false
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false
  }
  const clientRect = element.getBoundingClientRect()
  const domElement = unwrapElement(element)
  let scale = createCoords(1)
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent)
      }
    } else {
      scale = getScale(element)
    }
  }
  const visualOffsets = shouldAddVisualOffsets(
    domElement,
    isFixedStrategy,
    offsetParent,
  )
    ? getVisualOffsets(domElement)
    : createCoords(0)
  let x = (clientRect.left + visualOffsets.x) / scale.x
  let y = (clientRect.top + visualOffsets.y) / scale.y
  let width = clientRect.width / scale.x
  let height = clientRect.height / scale.y
  if (domElement) {
    const win = getWindow(domElement)
    const offsetWin =
      offsetParent && isElement(offsetParent)
        ? getWindow(offsetParent)
        : offsetParent
    let currentWin = win
    let currentIFrame = getFrameElement(currentWin)
    while (currentIFrame && offsetParent && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame)
      const iframeRect = currentIFrame.getBoundingClientRect()
      const css = getComputedStyle2(currentIFrame)
      const left =
        iframeRect.left +
        (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x
      const top =
        iframeRect.top +
        (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y
      x *= iframeScale.x
      y *= iframeScale.y
      width *= iframeScale.x
      height *= iframeScale.y
      x += left
      y += top
      currentWin = getWindow(currentIFrame)
      currentIFrame = getFrameElement(currentWin)
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y,
  })
}
function getWindowScrollBarX(element, rect) {
  const leftScroll = getNodeScroll(element).scrollLeft
  if (!rect) {
    return getBoundingClientRect(getDocumentElement(element)).left + leftScroll
  }
  return rect.left + leftScroll
}
function getHTMLOffset(documentElement, scroll) {
  const htmlRect = documentElement.getBoundingClientRect()
  const x =
    htmlRect.left +
    scroll.scrollLeft -
    getWindowScrollBarX(documentElement, htmlRect)
  const y = htmlRect.top + scroll.scrollTop
  return {
    x,
    y,
  }
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let { elements, rect, offsetParent, strategy } = _ref
  const isFixed = strategy === 'fixed'
  const documentElement = getDocumentElement(offsetParent)
  const topLayer = elements ? isTopLayer(elements.floating) : false
  if (offsetParent === documentElement || (topLayer && isFixed)) {
    return rect
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0,
  }
  let scale = createCoords(1)
  const offsets = createCoords(0)
  const isOffsetParentAnElement = isHTMLElement(offsetParent)
  if (isOffsetParentAnElement || (!isOffsetParentAnElement && !isFixed)) {
    if (
      getNodeName(offsetParent) !== 'body' ||
      isOverflowElement(documentElement)
    ) {
      scroll = getNodeScroll(offsetParent)
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent)
      scale = getScale(offsetParent)
      offsets.x = offsetRect.x + offsetParent.clientLeft
      offsets.y = offsetRect.y + offsetParent.clientTop
    }
  }
  const htmlOffset =
    documentElement && !isOffsetParentAnElement && !isFixed
      ? getHTMLOffset(documentElement, scroll)
      : createCoords(0)
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x:
      rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y,
  }
}
function getClientRects(element) {
  return Array.from(element.getClientRects())
}
function getDocumentRect(element) {
  const html = getDocumentElement(element)
  const scroll = getNodeScroll(element)
  const body = element.ownerDocument.body
  const width = max(
    html.scrollWidth,
    html.clientWidth,
    body.scrollWidth,
    body.clientWidth,
  )
  const height = max(
    html.scrollHeight,
    html.clientHeight,
    body.scrollHeight,
    body.clientHeight,
  )
  let x = -scroll.scrollLeft + getWindowScrollBarX(element)
  const y = -scroll.scrollTop
  if (getComputedStyle2(body).direction === 'rtl') {
    x += max(html.clientWidth, body.clientWidth) - width
  }
  return {
    width,
    height,
    x,
    y,
  }
}
var SCROLLBAR_MAX = 25
function getViewportRect(element, strategy) {
  const win = getWindow(element)
  const html = getDocumentElement(element)
  const visualViewport = win.visualViewport
  let width = html.clientWidth
  let height = html.clientHeight
  let x = 0
  let y = 0
  if (visualViewport) {
    width = visualViewport.width
    height = visualViewport.height
    const visualViewportBased = isWebKit()
    if (!visualViewportBased || (visualViewportBased && strategy === 'fixed')) {
      x = visualViewport.offsetLeft
      y = visualViewport.offsetTop
    }
  }
  const windowScrollbarX = getWindowScrollBarX(html)
  if (windowScrollbarX <= 0) {
    const doc = html.ownerDocument
    const body = doc.body
    const bodyStyles = getComputedStyle(body)
    const bodyMarginInline =
      doc.compatMode === 'CSS1Compat'
        ? parseFloat(bodyStyles.marginLeft) +
            parseFloat(bodyStyles.marginRight) || 0
        : 0
    const clippingStableScrollbarWidth = Math.abs(
      html.clientWidth - body.clientWidth - bodyMarginInline,
    )
    if (clippingStableScrollbarWidth <= SCROLLBAR_MAX) {
      width -= clippingStableScrollbarWidth
    }
  } else if (windowScrollbarX <= SCROLLBAR_MAX) {
    width += windowScrollbarX
  }
  return {
    width,
    height,
    x,
    y,
  }
}
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === 'fixed')
  const top = clientRect.top + element.clientTop
  const left = clientRect.left + element.clientLeft
  const scale = isHTMLElement(element) ? getScale(element) : createCoords(1)
  const width = element.clientWidth * scale.x
  const height = element.clientHeight * scale.y
  const x = left * scale.x
  const y = top * scale.y
  return {
    width,
    height,
    x,
    y,
  }
}
function getClientRectFromClippingAncestor(
  element,
  clippingAncestor,
  strategy,
) {
  let rect
  if (clippingAncestor === 'viewport') {
    rect = getViewportRect(element, strategy)
  } else if (clippingAncestor === 'document') {
    rect = getDocumentRect(getDocumentElement(element))
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy)
  } else {
    const visualOffsets = getVisualOffsets(element)
    rect = {
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y,
      width: clippingAncestor.width,
      height: clippingAncestor.height,
    }
  }
  return rectToClientRect(rect)
}
function hasFixedPositionAncestor(element, stopNode) {
  const parentNode = getParentNode(element)
  if (
    parentNode === stopNode ||
    !isElement(parentNode) ||
    isLastTraversableNode(parentNode)
  ) {
    return false
  }
  return (
    getComputedStyle2(parentNode).position === 'fixed' ||
    hasFixedPositionAncestor(parentNode, stopNode)
  )
}
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element)
  if (cachedResult) {
    return cachedResult
  }
  let result = getOverflowAncestors(element, [], false).filter(
    el => isElement(el) && getNodeName(el) !== 'body',
  )
  let currentContainingBlockComputedStyle = null
  const elementIsFixed = getComputedStyle2(element).position === 'fixed'
  let currentNode = elementIsFixed ? getParentNode(element) : element
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle2(currentNode)
    const currentNodeIsContaining = isContainingBlock(currentNode)
    if (!currentNodeIsContaining && computedStyle.position === 'fixed') {
      currentContainingBlockComputedStyle = null
    }
    const shouldDropCurrentNode = elementIsFixed
      ? !currentNodeIsContaining && !currentContainingBlockComputedStyle
      : (!currentNodeIsContaining &&
          computedStyle.position === 'static' &&
          !!currentContainingBlockComputedStyle &&
          (currentContainingBlockComputedStyle.position === 'absolute' ||
            currentContainingBlockComputedStyle.position === 'fixed')) ||
        (isOverflowElement(currentNode) &&
          !currentNodeIsContaining &&
          hasFixedPositionAncestor(element, currentNode))
    if (shouldDropCurrentNode) {
      result = result.filter(ancestor => ancestor !== currentNode)
    } else {
      currentContainingBlockComputedStyle = computedStyle
    }
    currentNode = getParentNode(currentNode)
  }
  cache.set(element, result)
  return result
}
function getClippingRect(_ref) {
  let { element, boundary, rootBoundary, strategy } = _ref
  const elementClippingAncestors =
    boundary === 'clippingAncestors'
      ? isTopLayer(element)
        ? []
        : getClippingElementAncestors(element, this._c)
      : [].concat(boundary)
  const clippingAncestors = [...elementClippingAncestors, rootBoundary]
  const firstRect = getClientRectFromClippingAncestor(
    element,
    clippingAncestors[0],
    strategy,
  )
  let top = firstRect.top
  let right = firstRect.right
  let bottom = firstRect.bottom
  let left = firstRect.left
  for (let i = 1; i < clippingAncestors.length; i++) {
    const rect = getClientRectFromClippingAncestor(
      element,
      clippingAncestors[i],
      strategy,
    )
    top = max(rect.top, top)
    right = min(rect.right, right)
    bottom = min(rect.bottom, bottom)
    left = max(rect.left, left)
  }
  return {
    width: right - left,
    height: bottom - top,
    x: left,
    y: top,
  }
}
function getDimensions(element) {
  const { width, height } = getCssDimensions(element)
  return {
    width,
    height,
  }
}
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent)
  const documentElement = getDocumentElement(offsetParent)
  const isFixed = strategy === 'fixed'
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent)
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0,
  }
  const offsets = createCoords(0)
  function setLeftRTLScrollbarOffset() {
    offsets.x = getWindowScrollBarX(documentElement)
  }
  if (isOffsetParentAnElement || (!isOffsetParentAnElement && !isFixed)) {
    if (
      getNodeName(offsetParent) !== 'body' ||
      isOverflowElement(documentElement)
    ) {
      scroll = getNodeScroll(offsetParent)
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(
        offsetParent,
        true,
        isFixed,
        offsetParent,
      )
      offsets.x = offsetRect.x + offsetParent.clientLeft
      offsets.y = offsetRect.y + offsetParent.clientTop
    } else if (documentElement) {
      setLeftRTLScrollbarOffset()
    }
  }
  if (isFixed && !isOffsetParentAnElement && documentElement) {
    setLeftRTLScrollbarOffset()
  }
  const htmlOffset =
    documentElement && !isOffsetParentAnElement && !isFixed
      ? getHTMLOffset(documentElement, scroll)
      : createCoords(0)
  const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x
  const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y
  return {
    x,
    y,
    width: rect.width,
    height: rect.height,
  }
}
function isStaticPositioned(element) {
  return getComputedStyle2(element).position === 'static'
}
function getTrueOffsetParent(element, polyfill) {
  if (
    !isHTMLElement(element) ||
    getComputedStyle2(element).position === 'fixed'
  ) {
    return null
  }
  if (polyfill) {
    return polyfill(element)
  }
  let rawOffsetParent = element.offsetParent
  if (getDocumentElement(element) === rawOffsetParent) {
    rawOffsetParent = rawOffsetParent.ownerDocument.body
  }
  return rawOffsetParent
}
function getOffsetParent(element, polyfill) {
  const win = getWindow(element)
  if (isTopLayer(element)) {
    return win
  }
  if (!isHTMLElement(element)) {
    let svgOffsetParent = getParentNode(element)
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent
      }
      svgOffsetParent = getParentNode(svgOffsetParent)
    }
    return win
  }
  let offsetParent = getTrueOffsetParent(element, polyfill)
  while (
    offsetParent &&
    isTableElement(offsetParent) &&
    isStaticPositioned(offsetParent)
  ) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill)
  }
  if (
    offsetParent &&
    isLastTraversableNode(offsetParent) &&
    isStaticPositioned(offsetParent) &&
    !isContainingBlock(offsetParent)
  ) {
    return win
  }
  return offsetParent || getContainingBlock(element) || win
}
var getElementRects = async function (data) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent
  const getDimensionsFn = this.getDimensions
  const floatingDimensions = await getDimensionsFn(data.floating)
  return {
    reference: getRectRelativeToOffsetParent(
      data.reference,
      await getOffsetParentFn(data.floating),
      data.strategy,
    ),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height,
    },
  }
}
function isRTL(element) {
  return getComputedStyle2(element).direction === 'rtl'
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
  isRTL,
}
function rectsAreEqual(a, b) {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  )
}
function observeMove(element, onMove) {
  let io2 = null
  let timeoutId
  const root = getDocumentElement(element)
  function cleanup() {
    var _io
    clearTimeout(timeoutId)
    ;(_io = io2) == null || _io.disconnect()
    io2 = null
  }
  function refresh(skip, threshold) {
    if (skip === void 0) {
      skip = false
    }
    if (threshold === void 0) {
      threshold = 1
    }
    cleanup()
    const elementRectForRootMargin = element.getBoundingClientRect()
    const { left, top, width, height } = elementRectForRootMargin
    if (!skip) {
      onMove()
    }
    if (!width || !height) {
      return
    }
    const insetTop = floor(top)
    const insetRight = floor(root.clientWidth - (left + width))
    const insetBottom = floor(root.clientHeight - (top + height))
    const insetLeft = floor(left)
    const rootMargin =
      -insetTop +
      'px ' +
      -insetRight +
      'px ' +
      -insetBottom +
      'px ' +
      -insetLeft +
      'px'
    const options = {
      rootMargin,
      threshold: max(0, min(1, threshold)) || 1,
    }
    let isFirstUpdate = true
    function handleObserve(entries) {
      const ratio = entries[0].intersectionRatio
      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          return refresh()
        }
        if (!ratio) {
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7)
          }, 1e3)
        } else {
          refresh(false, ratio)
        }
      }
      if (
        ratio === 1 &&
        !rectsAreEqual(
          elementRectForRootMargin,
          element.getBoundingClientRect(),
        )
      ) {
        refresh()
      }
      isFirstUpdate = false
    }
    try {
      io2 = new IntersectionObserver(handleObserve, {
        ...options,
        // Handle <iframe>s
        root: root.ownerDocument,
      })
    } catch (_e2) {
      io2 = new IntersectionObserver(handleObserve, options)
    }
    io2.observe(element)
  }
  refresh(true)
  return cleanup
}
function autoUpdate(reference, floating, update, options) {
  if (options === void 0) {
    options = {}
  }
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === 'function',
    layoutShift = typeof IntersectionObserver === 'function',
    animationFrame = false,
  } = options
  const referenceEl = unwrapElement(reference)
  const ancestors =
    ancestorScroll || ancestorResize
      ? [
          ...(referenceEl ? getOverflowAncestors(referenceEl) : []),
          ...(floating ? getOverflowAncestors(floating) : []),
        ]
      : []
  ancestors.forEach(ancestor => {
    ancestorScroll &&
      ancestor.addEventListener('scroll', update, {
        passive: true,
      })
    ancestorResize && ancestor.addEventListener('resize', update)
  })
  const cleanupIo =
    referenceEl && layoutShift ? observeMove(referenceEl, update) : null
  let reobserveFrame = -1
  let resizeObserver = null
  if (elementResize) {
    resizeObserver = new ResizeObserver(_ref => {
      let [firstEntry] = _ref
      if (
        firstEntry &&
        firstEntry.target === referenceEl &&
        resizeObserver &&
        floating
      ) {
        resizeObserver.unobserve(floating)
        cancelAnimationFrame(reobserveFrame)
        reobserveFrame = requestAnimationFrame(() => {
          var _resizeObserver
          ;(_resizeObserver = resizeObserver) == null ||
            _resizeObserver.observe(floating)
        })
      }
      update()
    })
    if (referenceEl && !animationFrame) {
      resizeObserver.observe(referenceEl)
    }
    if (floating) {
      resizeObserver.observe(floating)
    }
  }
  let frameId
  let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null
  if (animationFrame) {
    frameLoop()
  }
  function frameLoop() {
    const nextRefRect = getBoundingClientRect(reference)
    if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) {
      update()
    }
    prevRefRect = nextRefRect
    frameId = requestAnimationFrame(frameLoop)
  }
  update()
  return () => {
    var _resizeObserver2
    ancestors.forEach(ancestor => {
      ancestorScroll && ancestor.removeEventListener('scroll', update)
      ancestorResize && ancestor.removeEventListener('resize', update)
    })
    cleanupIo == null || cleanupIo()
    ;(_resizeObserver2 = resizeObserver) == null ||
      _resizeObserver2.disconnect()
    resizeObserver = null
    if (animationFrame) {
      cancelAnimationFrame(frameId)
    }
  }
}
var offset2 = offset
var shift2 = shift
var size2 = size
var arrow2 = arrow
var computePosition2 = (reference, floating, options) => {
  const cache = /* @__PURE__ */ new Map()
  const mergedOptions = {
    platform,
    ...options,
  }
  const platformWithCache = {
    ...mergedOptions.platform,
    _c: cache,
  }
  return computePosition(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache,
  })
}

// node_modules/.pnpm/@floating-ui+vue@1.1.11_vue@3.5.38_typescript@5.9.3_/node_modules/@floating-ui/vue/dist/floating-ui.vue.mjs
function isComponentPublicInstance(target) {
  return target != null && typeof target === 'object' && '$el' in target
}
function unwrapElement2(target) {
  if (isComponentPublicInstance(target)) {
    const element = target.$el
    return isNode(element) && getNodeName(element) === '#comment'
      ? null
      : element
  }
  return target
}
function toValue(source) {
  return typeof source === 'function' ? source() : unref(source)
}
function arrow3(options) {
  return {
    name: 'arrow',
    options,
    fn(args) {
      const element = unwrapElement2(toValue(options.element))
      if (element == null) {
        return {}
      }
      return arrow2({
        element,
        padding: options.padding,
      }).fn(args)
    },
  }
}
function getDPR(element) {
  if (typeof window === 'undefined') {
    return 1
  }
  const win = element.ownerDocument.defaultView || window
  return win.devicePixelRatio || 1
}
function roundByDPR(element, value) {
  const dpr = getDPR(element)
  return Math.round(value * dpr) / dpr
}
function useFloating(reference, floating, options) {
  if (options === void 0) {
    options = {}
  }
  const whileElementsMountedOption = options.whileElementsMounted
  const openOption = computed(() => {
    var _toValue
    return (_toValue = toValue(options.open)) != null ? _toValue : true
  })
  const middlewareOption = computed(() => toValue(options.middleware))
  const placementOption = computed(() => {
    var _toValue2
    return (_toValue2 = toValue(options.placement)) != null
      ? _toValue2
      : 'bottom'
  })
  const strategyOption = computed(() => {
    var _toValue3
    return (_toValue3 = toValue(options.strategy)) != null
      ? _toValue3
      : 'absolute'
  })
  const transformOption = computed(() => {
    var _toValue4
    return (_toValue4 = toValue(options.transform)) != null ? _toValue4 : true
  })
  const referenceElement = computed(() => unwrapElement2(reference.value))
  const floatingElement = computed(() => unwrapElement2(floating.value))
  const x = ref(0)
  const y = ref(0)
  const strategy = ref(strategyOption.value)
  const placement = ref(placementOption.value)
  const middlewareData = shallowRef({})
  const isPositioned = ref(false)
  const floatingStyles = computed(() => {
    const initialStyles = {
      position: strategy.value,
      left: '0',
      top: '0',
    }
    if (!floatingElement.value) {
      return initialStyles
    }
    const xVal = roundByDPR(floatingElement.value, x.value)
    const yVal = roundByDPR(floatingElement.value, y.value)
    if (transformOption.value) {
      return {
        ...initialStyles,
        transform: 'translate(' + xVal + 'px, ' + yVal + 'px)',
        ...(getDPR(floatingElement.value) >= 1.5 && {
          willChange: 'transform',
        }),
      }
    }
    return {
      position: strategy.value,
      left: xVal + 'px',
      top: yVal + 'px',
    }
  })
  let whileElementsMountedCleanup
  function update() {
    if (referenceElement.value == null || floatingElement.value == null) {
      return
    }
    const open = openOption.value
    computePosition2(referenceElement.value, floatingElement.value, {
      middleware: middlewareOption.value,
      placement: placementOption.value,
      strategy: strategyOption.value,
    }).then(position => {
      x.value = position.x
      y.value = position.y
      strategy.value = position.strategy
      placement.value = position.placement
      middlewareData.value = position.middlewareData
      isPositioned.value = open !== false
    })
  }
  function cleanup() {
    if (typeof whileElementsMountedCleanup === 'function') {
      whileElementsMountedCleanup()
      whileElementsMountedCleanup = void 0
    }
  }
  function attach() {
    cleanup()
    if (whileElementsMountedOption === void 0) {
      update()
      return
    }
    if (referenceElement.value != null && floatingElement.value != null) {
      whileElementsMountedCleanup = whileElementsMountedOption(
        referenceElement.value,
        floatingElement.value,
        update,
      )
      return
    }
  }
  function reset() {
    if (!openOption.value) {
      isPositioned.value = false
    }
  }
  watch(
    [middlewareOption, placementOption, strategyOption, openOption],
    update,
    {
      flush: 'sync',
    },
  )
  watch([referenceElement, floatingElement], attach, {
    flush: 'sync',
  })
  watch(openOption, reset, {
    flush: 'sync',
  })
  if (getCurrentScope()) {
    onScopeDispose(cleanup)
  }
  return {
    x: shallowReadonly(x),
    y: shallowReadonly(y),
    strategy: shallowReadonly(strategy),
    placement: shallowReadonly(placement),
    middlewareData: shallowReadonly(middlewareData),
    isPositioned: shallowReadonly(isPositioned),
    floatingStyles,
    update,
  }
}

// node_modules/.pnpm/async-validator@4.2.5/node_modules/async-validator/dist-web/index.js
function _extends() {
  _extends = Object.assign
    ? Object.assign.bind()
    : function (target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i]
          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key]
            }
          }
        }
        return target
      }
  return _extends.apply(this, arguments)
}
function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype)
  subClass.prototype.constructor = subClass
  _setPrototypeOf(subClass, superClass)
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf
    ? Object.getPrototypeOf.bind()
    : function _getPrototypeOf2(o2) {
        return o2.__proto__ || Object.getPrototypeOf(o2)
      }
  return _getPrototypeOf(o)
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf
    ? Object.setPrototypeOf.bind()
    : function _setPrototypeOf2(o2, p2) {
        o2.__proto__ = p2
        return o2
      }
  return _setPrototypeOf(o, p)
}
function _isNativeReflectConstruct() {
  if (typeof Reflect === 'undefined' || !Reflect.construct) return false
  if (Reflect.construct.sham) return false
  if (typeof Proxy === 'function') return true
  try {
    Boolean.prototype.valueOf.call(
      Reflect.construct(Boolean, [], function () {}),
    )
    return true
  } catch (e) {
    return false
  }
}
function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct.bind()
  } else {
    _construct = function _construct2(Parent2, args2, Class2) {
      var a = [null]
      a.push.apply(a, args2)
      var Constructor = Function.bind.apply(Parent2, a)
      var instance = new Constructor()
      if (Class2) _setPrototypeOf(instance, Class2.prototype)
      return instance
    }
  }
  return _construct.apply(null, arguments)
}
function _isNativeFunction(fn2) {
  return Function.toString.call(fn2).indexOf('[native code]') !== -1
}
function _wrapNativeSuper(Class) {
  var _cache = typeof Map === 'function' ? /* @__PURE__ */ new Map() : void 0
  _wrapNativeSuper = function _wrapNativeSuper2(Class2) {
    if (Class2 === null || !_isNativeFunction(Class2)) return Class2
    if (typeof Class2 !== 'function') {
      throw new TypeError('Super expression must either be null or a function')
    }
    if (typeof _cache !== 'undefined') {
      if (_cache.has(Class2)) return _cache.get(Class2)
      _cache.set(Class2, Wrapper)
    }
    function Wrapper() {
      return _construct(Class2, arguments, _getPrototypeOf(this).constructor)
    }
    Wrapper.prototype = Object.create(Class2.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    })
    return _setPrototypeOf(Wrapper, Class2)
  }
  return _wrapNativeSuper(Class)
}
var formatRegExp = /%[sdj%]/g
var warning = function warning2() {}
if (
  typeof process !== 'undefined' &&
  process.env &&
  true &&
  typeof window !== 'undefined' &&
  typeof document !== 'undefined'
) {
  warning = function warning3(type4, errors) {
    if (
      typeof console !== 'undefined' &&
      console.warn &&
      typeof ASYNC_VALIDATOR_NO_WARNING === 'undefined'
    ) {
      if (
        errors.every(function (e) {
          return typeof e === 'string'
        })
      ) {
        console.warn(type4, errors)
      }
    }
  }
}
function convertFieldsError(errors) {
  if (!errors || !errors.length) return null
  var fields = {}
  errors.forEach(function (error) {
    var field = error.field
    fields[field] = fields[field] || []
    fields[field].push(error)
  })
  return fields
}
function format(template) {
  for (
    var _len = arguments.length,
      args = new Array(_len > 1 ? _len - 1 : 0),
      _key = 1;
    _key < _len;
    _key++
  ) {
    args[_key - 1] = arguments[_key]
  }
  var i = 0
  var len = args.length
  if (typeof template === 'function') {
    return template.apply(null, args)
  }
  if (typeof template === 'string') {
    var str = template.replace(formatRegExp, function (x) {
      if (x === '%%') {
        return '%'
      }
      if (i >= len) {
        return x
      }
      switch (x) {
        case '%s':
          return String(args[i++])
        case '%d':
          return Number(args[i++])
        case '%j':
          try {
            return JSON.stringify(args[i++])
          } catch (_) {
            return '[Circular]'
          }
          break
        default:
          return x
      }
    })
    return str
  }
  return template
}
function isNativeStringType(type4) {
  return (
    type4 === 'string' ||
    type4 === 'url' ||
    type4 === 'hex' ||
    type4 === 'email' ||
    type4 === 'date' ||
    type4 === 'pattern'
  )
}
function isEmptyValue(value, type4) {
  if (value === void 0 || value === null) {
    return true
  }
  if (type4 === 'array' && Array.isArray(value) && !value.length) {
    return true
  }
  if (isNativeStringType(type4) && typeof value === 'string' && !value) {
    return true
  }
  return false
}
function asyncParallelArray(arr, func, callback) {
  var results = []
  var total = 0
  var arrLength = arr.length
  function count(errors) {
    results.push.apply(results, errors || [])
    total++
    if (total === arrLength) {
      callback(results)
    }
  }
  arr.forEach(function (a) {
    func(a, count)
  })
}
function asyncSerialArray(arr, func, callback) {
  var index = 0
  var arrLength = arr.length
  function next(errors) {
    if (errors && errors.length) {
      callback(errors)
      return
    }
    var original = index
    index = index + 1
    if (original < arrLength) {
      func(arr[original], next)
    } else {
      callback([])
    }
  }
  next([])
}
function flattenObjArr(objArr) {
  var ret = []
  Object.keys(objArr).forEach(function (k) {
    ret.push.apply(ret, objArr[k] || [])
  })
  return ret
}
var AsyncValidationError = (function (_Error) {
  _inheritsLoose(AsyncValidationError2, _Error)
  function AsyncValidationError2(errors, fields) {
    var _this
    _this = _Error.call(this, 'Async Validation Error') || this
    _this.errors = errors
    _this.fields = fields
    return _this
  }
  return AsyncValidationError2
})(_wrapNativeSuper(Error))
function asyncMap(objArr, option, func, callback, source) {
  if (option.first) {
    var _pending = new Promise(function (resolve, reject) {
      var next = function next2(errors) {
        callback(errors)
        return errors.length
          ? reject(new AsyncValidationError(errors, convertFieldsError(errors)))
          : resolve(source)
      }
      var flattenArr = flattenObjArr(objArr)
      asyncSerialArray(flattenArr, func, next)
    })
    _pending['catch'](function (e) {
      return e
    })
    return _pending
  }
  var firstFields =
    option.firstFields === true ? Object.keys(objArr) : option.firstFields || []
  var objArrKeys = Object.keys(objArr)
  var objArrLength = objArrKeys.length
  var total = 0
  var results = []
  var pending = new Promise(function (resolve, reject) {
    var next = function next2(errors) {
      results.push.apply(results, errors)
      total++
      if (total === objArrLength) {
        callback(results)
        return results.length
          ? reject(
              new AsyncValidationError(results, convertFieldsError(results)),
            )
          : resolve(source)
      }
    }
    if (!objArrKeys.length) {
      callback(results)
      resolve(source)
    }
    objArrKeys.forEach(function (key) {
      var arr = objArr[key]
      if (firstFields.indexOf(key) !== -1) {
        asyncSerialArray(arr, func, next)
      } else {
        asyncParallelArray(arr, func, next)
      }
    })
  })
  pending['catch'](function (e) {
    return e
  })
  return pending
}
function isErrorObj(obj) {
  return !!(obj && obj.message !== void 0)
}
function getValue(value, path) {
  var v = value
  for (var i = 0; i < path.length; i++) {
    if (v == void 0) {
      return v
    }
    v = v[path[i]]
  }
  return v
}
function complementError(rule, source) {
  return function (oe) {
    var fieldValue
    if (rule.fullFields) {
      fieldValue = getValue(source, rule.fullFields)
    } else {
      fieldValue = source[oe.field || rule.fullField]
    }
    if (isErrorObj(oe)) {
      oe.field = oe.field || rule.fullField
      oe.fieldValue = fieldValue
      return oe
    }
    return {
      message: typeof oe === 'function' ? oe() : oe,
      fieldValue,
      field: oe.field || rule.fullField,
    }
  }
}
function deepMerge(target, source) {
  if (source) {
    for (var s in source) {
      if (source.hasOwnProperty(s)) {
        var value = source[s]
        if (typeof value === 'object' && typeof target[s] === 'object') {
          target[s] = _extends({}, target[s], value)
        } else {
          target[s] = value
        }
      }
    }
  }
  return target
}
var required$1 = function required(
  rule,
  value,
  source,
  errors,
  options,
  type4,
) {
  if (
    rule.required &&
    (!source.hasOwnProperty(rule.field) ||
      isEmptyValue(value, type4 || rule.type))
  ) {
    errors.push(format(options.messages.required, rule.fullField))
  }
}
var whitespace = function whitespace2(rule, value, source, errors, options) {
  if (/^\s+$/.test(value) || value === '') {
    errors.push(format(options.messages.whitespace, rule.fullField))
  }
}
var urlReg
var getUrlRegex = function () {
  if (urlReg) {
    return urlReg
  }
  var word = '[a-fA-F\\d:]'
  var b = function b2(options) {
    return options && options.includeBoundaries
      ? '(?:(?<=\\s|^)(?=' + word + ')|(?<=' + word + ')(?=\\s|$))'
      : ''
  }
  var v4 =
    '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}'
  var v6seg = '[a-fA-F\\d]{1,4}'
  var v6 = (
    '\n(?:\n(?:' +
    v6seg +
    ':){7}(?:' +
    v6seg +
    '|:)|                                    // 1:2:3:4:5:6:7::  1:2:3:4:5:6:7:8\n(?:' +
    v6seg +
    ':){6}(?:' +
    v4 +
    '|:' +
    v6seg +
    '|:)|                             // 1:2:3:4:5:6::    1:2:3:4:5:6::8   1:2:3:4:5:6::8  1:2:3:4:5:6::1.2.3.4\n(?:' +
    v6seg +
    ':){5}(?::' +
    v4 +
    '|(?::' +
    v6seg +
    '){1,2}|:)|                   // 1:2:3:4:5::      1:2:3:4:5::7:8   1:2:3:4:5::8    1:2:3:4:5::7:1.2.3.4\n(?:' +
    v6seg +
    ':){4}(?:(?::' +
    v6seg +
    '){0,1}:' +
    v4 +
    '|(?::' +
    v6seg +
    '){1,3}|:)| // 1:2:3:4::        1:2:3:4::6:7:8   1:2:3:4::8      1:2:3:4::6:7:1.2.3.4\n(?:' +
    v6seg +
    ':){3}(?:(?::' +
    v6seg +
    '){0,2}:' +
    v4 +
    '|(?::' +
    v6seg +
    '){1,4}|:)| // 1:2:3::          1:2:3::5:6:7:8   1:2:3::8        1:2:3::5:6:7:1.2.3.4\n(?:' +
    v6seg +
    ':){2}(?:(?::' +
    v6seg +
    '){0,3}:' +
    v4 +
    '|(?::' +
    v6seg +
    '){1,5}|:)| // 1:2::            1:2::4:5:6:7:8   1:2::8          1:2::4:5:6:7:1.2.3.4\n(?:' +
    v6seg +
    ':){1}(?:(?::' +
    v6seg +
    '){0,4}:' +
    v4 +
    '|(?::' +
    v6seg +
    '){1,6}|:)| // 1::              1::3:4:5:6:7:8   1::8            1::3:4:5:6:7:1.2.3.4\n(?::(?:(?::' +
    v6seg +
    '){0,5}:' +
    v4 +
    '|(?::' +
    v6seg +
    '){1,7}|:))             // ::2:3:4:5:6:7:8  ::2:3:4:5:6:7:8  ::8             ::1.2.3.4\n)(?:%[0-9a-zA-Z]{1,})?                                             // %eth0            %1\n'
  )
    .replace(/\s*\/\/.*$/gm, '')
    .replace(/\n/g, '')
    .trim()
  var v46Exact = new RegExp('(?:^' + v4 + '$)|(?:^' + v6 + '$)')
  var v4exact = new RegExp('^' + v4 + '$')
  var v6exact = new RegExp('^' + v6 + '$')
  var ip = function ip2(options) {
    return options && options.exact
      ? v46Exact
      : new RegExp(
          '(?:' +
            b(options) +
            v4 +
            b(options) +
            ')|(?:' +
            b(options) +
            v6 +
            b(options) +
            ')',
          'g',
        )
  }
  ip.v4 = function (options) {
    return options && options.exact
      ? v4exact
      : new RegExp('' + b(options) + v4 + b(options), 'g')
  }
  ip.v6 = function (options) {
    return options && options.exact
      ? v6exact
      : new RegExp('' + b(options) + v6 + b(options), 'g')
  }
  var protocol = '(?:(?:[a-z]+:)?//)'
  var auth = '(?:\\S+(?::\\S*)?@)?'
  var ipv4 = ip.v4().source
  var ipv6 = ip.v6().source
  var host = '(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)'
  var domain = '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*'
  var tld = '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))'
  var port = '(?::\\d{2,5})?'
  var path = '(?:[/?#][^\\s"]*)?'
  var regex =
    '(?:' +
    protocol +
    '|www\\.)' +
    auth +
    '(?:localhost|' +
    ipv4 +
    '|' +
    ipv6 +
    '|' +
    host +
    domain +
    tld +
    ')' +
    port +
    path
  urlReg = new RegExp('(?:^' + regex + '$)', 'i')
  return urlReg
}
var pattern$2 = {
  // http://emailregex.com/
  email:
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/,
  // url: new RegExp(
  //   '^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$',
  //   'i',
  // ),
  hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i,
}
var types = {
  integer: function integer(value) {
    return types.number(value) && parseInt(value, 10) === value
  },
  float: function float(value) {
    return types.number(value) && !types.integer(value)
  },
  array: function array(value) {
    return Array.isArray(value)
  },
  regexp: function regexp(value) {
    if (value instanceof RegExp) {
      return true
    }
    try {
      return !!new RegExp(value)
    } catch (e) {
      return false
    }
  },
  date: function date(value) {
    return (
      typeof value.getTime === 'function' &&
      typeof value.getMonth === 'function' &&
      typeof value.getYear === 'function' &&
      !isNaN(value.getTime())
    )
  },
  number: function number(value) {
    if (isNaN(value)) {
      return false
    }
    return typeof value === 'number'
  },
  object: function object(value) {
    return typeof value === 'object' && !types.array(value)
  },
  method: function method(value) {
    return typeof value === 'function'
  },
  email: function email(value) {
    return (
      typeof value === 'string' &&
      value.length <= 320 &&
      !!value.match(pattern$2.email)
    )
  },
  url: function url(value) {
    return (
      typeof value === 'string' &&
      value.length <= 2048 &&
      !!value.match(getUrlRegex())
    )
  },
  hex: function hex(value) {
    return typeof value === 'string' && !!value.match(pattern$2.hex)
  },
}
var type$1 = function type(rule, value, source, errors, options) {
  if (rule.required && value === void 0) {
    required$1(rule, value, source, errors, options)
    return
  }
  var custom = [
    'integer',
    'float',
    'array',
    'regexp',
    'object',
    'method',
    'email',
    'number',
    'date',
    'url',
    'hex',
  ]
  var ruleType = rule.type
  if (custom.indexOf(ruleType) > -1) {
    if (!types[ruleType](value)) {
      errors.push(
        format(options.messages.types[ruleType], rule.fullField, rule.type),
      )
    }
  } else if (ruleType && typeof value !== rule.type) {
    errors.push(
      format(options.messages.types[ruleType], rule.fullField, rule.type),
    )
  }
}
var range = function range2(rule, value, source, errors, options) {
  var len = typeof rule.len === 'number'
  var min2 = typeof rule.min === 'number'
  var max2 = typeof rule.max === 'number'
  var spRegexp = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g
  var val = value
  var key = null
  var num = typeof value === 'number'
  var str = typeof value === 'string'
  var arr = Array.isArray(value)
  if (num) {
    key = 'number'
  } else if (str) {
    key = 'string'
  } else if (arr) {
    key = 'array'
  }
  if (!key) {
    return false
  }
  if (arr) {
    val = value.length
  }
  if (str) {
    val = value.replace(spRegexp, '_').length
  }
  if (len) {
    if (val !== rule.len) {
      errors.push(format(options.messages[key].len, rule.fullField, rule.len))
    }
  } else if (min2 && !max2 && val < rule.min) {
    errors.push(format(options.messages[key].min, rule.fullField, rule.min))
  } else if (max2 && !min2 && val > rule.max) {
    errors.push(format(options.messages[key].max, rule.fullField, rule.max))
  } else if (min2 && max2 && (val < rule.min || val > rule.max)) {
    errors.push(
      format(options.messages[key].range, rule.fullField, rule.min, rule.max),
    )
  }
}
var ENUM$1 = 'enum'
var enumerable$1 = function enumerable(rule, value, source, errors, options) {
  rule[ENUM$1] = Array.isArray(rule[ENUM$1]) ? rule[ENUM$1] : []
  if (rule[ENUM$1].indexOf(value) === -1) {
    errors.push(
      format(options.messages[ENUM$1], rule.fullField, rule[ENUM$1].join(', ')),
    )
  }
}
var pattern$1 = function pattern(rule, value, source, errors, options) {
  if (rule.pattern) {
    if (rule.pattern instanceof RegExp) {
      rule.pattern.lastIndex = 0
      if (!rule.pattern.test(value)) {
        errors.push(
          format(
            options.messages.pattern.mismatch,
            rule.fullField,
            value,
            rule.pattern,
          ),
        )
      }
    } else if (typeof rule.pattern === 'string') {
      var _pattern = new RegExp(rule.pattern)
      if (!_pattern.test(value)) {
        errors.push(
          format(
            options.messages.pattern.mismatch,
            rule.fullField,
            value,
            rule.pattern,
          ),
        )
      }
    }
  }
}
var rules = {
  required: required$1,
  whitespace,
  type: type$1,
  range,
  enum: enumerable$1,
  pattern: pattern$1,
}
var string = function string2(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (isEmptyValue(value, 'string') && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options, 'string')
    if (!isEmptyValue(value, 'string')) {
      rules.type(rule, value, source, errors, options)
      rules.range(rule, value, source, errors, options)
      rules.pattern(rule, value, source, errors, options)
      if (rule.whitespace === true) {
        rules.whitespace(rule, value, source, errors, options)
      }
    }
  }
  callback(errors)
}
var method2 = function method3(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options)
    if (value !== void 0) {
      rules.type(rule, value, source, errors, options)
    }
  }
  callback(errors)
}
var number2 = function number3(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (value === '') {
      value = void 0
    }
    if (isEmptyValue(value) && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options)
    if (value !== void 0) {
      rules.type(rule, value, source, errors, options)
      rules.range(rule, value, source, errors, options)
    }
  }
  callback(errors)
}
var _boolean = function _boolean2(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options)
    if (value !== void 0) {
      rules.type(rule, value, source, errors, options)
    }
  }
  callback(errors)
}
var regexp2 = function regexp3(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options)
    if (!isEmptyValue(value)) {
      rules.type(rule, value, source, errors, options)
    }
  }
  callback(errors)
}
var integer2 = function integer3(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options)
    if (value !== void 0) {
      rules.type(rule, value, source, errors, options)
      rules.range(rule, value, source, errors, options)
    }
  }
  callback(errors)
}
var floatFn = function floatFn2(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options)
    if (value !== void 0) {
      rules.type(rule, value, source, errors, options)
      rules.range(rule, value, source, errors, options)
    }
  }
  callback(errors)
}
var array2 = function array3(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if ((value === void 0 || value === null) && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options, 'array')
    if (value !== void 0 && value !== null) {
      rules.type(rule, value, source, errors, options)
      rules.range(rule, value, source, errors, options)
    }
  }
  callback(errors)
}
var object2 = function object3(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options)
    if (value !== void 0) {
      rules.type(rule, value, source, errors, options)
    }
  }
  callback(errors)
}
var ENUM = 'enum'
var enumerable2 = function enumerable3(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options)
    if (value !== void 0) {
      rules[ENUM](rule, value, source, errors, options)
    }
  }
  callback(errors)
}
var pattern2 = function pattern3(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (isEmptyValue(value, 'string') && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options)
    if (!isEmptyValue(value, 'string')) {
      rules.pattern(rule, value, source, errors, options)
    }
  }
  callback(errors)
}
var date2 = function date3(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (isEmptyValue(value, 'date') && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options)
    if (!isEmptyValue(value, 'date')) {
      var dateObject
      if (value instanceof Date) {
        dateObject = value
      } else {
        dateObject = new Date(value)
      }
      rules.type(rule, dateObject, source, errors, options)
      if (dateObject) {
        rules.range(rule, dateObject.getTime(), source, errors, options)
      }
    }
  }
  callback(errors)
}
var required2 = function required3(rule, value, callback, source, options) {
  var errors = []
  var type4 = Array.isArray(value) ? 'array' : typeof value
  rules.required(rule, value, source, errors, options, type4)
  callback(errors)
}
var type2 = function type3(rule, value, callback, source, options) {
  var ruleType = rule.type
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (isEmptyValue(value, ruleType) && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options, ruleType)
    if (!isEmptyValue(value, ruleType)) {
      rules.type(rule, value, source, errors, options)
    }
  }
  callback(errors)
}
var any = function any2(rule, value, callback, source, options) {
  var errors = []
  var validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field))
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback()
    }
    rules.required(rule, value, source, errors, options)
  }
  callback(errors)
}
var validators = {
  string,
  method: method2,
  number: number2,
  boolean: _boolean,
  regexp: regexp2,
  integer: integer2,
  float: floatFn,
  array: array2,
  object: object2,
  enum: enumerable2,
  pattern: pattern2,
  date: date2,
  url: type2,
  hex: type2,
  email: type2,
  required: required2,
  any,
}
function newMessages() {
  return {
    default: 'Validation error on field %s',
    required: '%s is required',
    enum: '%s must be one of %s',
    whitespace: '%s cannot be empty',
    date: {
      format: '%s date %s is invalid for format %s',
      parse: '%s date could not be parsed, %s is invalid ',
      invalid: '%s date %s is invalid',
    },
    types: {
      string: '%s is not a %s',
      method: '%s is not a %s (function)',
      array: '%s is not an %s',
      object: '%s is not an %s',
      number: '%s is not a %s',
      date: '%s is not a %s',
      boolean: '%s is not a %s',
      integer: '%s is not an %s',
      float: '%s is not a %s',
      regexp: '%s is not a valid %s',
      email: '%s is not a valid %s',
      url: '%s is not a valid %s',
      hex: '%s is not a valid %s',
    },
    string: {
      len: '%s must be exactly %s characters',
      min: '%s must be at least %s characters',
      max: '%s cannot be longer than %s characters',
      range: '%s must be between %s and %s characters',
    },
    number: {
      len: '%s must equal %s',
      min: '%s cannot be less than %s',
      max: '%s cannot be greater than %s',
      range: '%s must be between %s and %s',
    },
    array: {
      len: '%s must be exactly %s in length',
      min: '%s cannot be less than %s in length',
      max: '%s cannot be greater than %s in length',
      range: '%s must be between %s and %s in length',
    },
    pattern: {
      mismatch: '%s value %s does not match pattern %s',
    },
    clone: function clone() {
      var cloned = JSON.parse(JSON.stringify(this))
      cloned.clone = this.clone
      return cloned
    },
  }
}
var messages = newMessages()
var Schema = (function () {
  function Schema2(descriptor) {
    this.rules = null
    this._messages = messages
    this.define(descriptor)
  }
  var _proto = Schema2.prototype
  _proto.define = function define(rules2) {
    var _this = this
    if (!rules2) {
      throw new Error('Cannot configure a schema with no rules')
    }
    if (typeof rules2 !== 'object' || Array.isArray(rules2)) {
      throw new Error('Rules must be an object')
    }
    this.rules = {}
    Object.keys(rules2).forEach(function (name) {
      var item = rules2[name]
      _this.rules[name] = Array.isArray(item) ? item : [item]
    })
  }
  _proto.messages = function messages2(_messages) {
    if (_messages) {
      this._messages = deepMerge(newMessages(), _messages)
    }
    return this._messages
  }
  _proto.validate = function validate(source_, o, oc) {
    var _this2 = this
    if (o === void 0) {
      o = {}
    }
    if (oc === void 0) {
      oc = function oc2() {}
    }
    var source = source_
    var options = o
    var callback = oc
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    if (!this.rules || Object.keys(this.rules).length === 0) {
      if (callback) {
        callback(null, source)
      }
      return Promise.resolve(source)
    }
    function complete(results) {
      var errors = []
      var fields = {}
      function add(e) {
        if (Array.isArray(e)) {
          var _errors
          errors = (_errors = errors).concat.apply(_errors, e)
        } else {
          errors.push(e)
        }
      }
      for (var i = 0; i < results.length; i++) {
        add(results[i])
      }
      if (!errors.length) {
        callback(null, source)
      } else {
        fields = convertFieldsError(errors)
        callback(errors, fields)
      }
    }
    if (options.messages) {
      var messages$1 = this.messages()
      if (messages$1 === messages) {
        messages$1 = newMessages()
      }
      deepMerge(messages$1, options.messages)
      options.messages = messages$1
    } else {
      options.messages = this.messages()
    }
    var series = {}
    var keys = options.keys || Object.keys(this.rules)
    keys.forEach(function (z2) {
      var arr = _this2.rules[z2]
      var value = source[z2]
      arr.forEach(function (r) {
        var rule = r
        if (typeof rule.transform === 'function') {
          if (source === source_) {
            source = _extends({}, source)
          }
          value = source[z2] = rule.transform(value)
        }
        if (typeof rule === 'function') {
          rule = {
            validator: rule,
          }
        } else {
          rule = _extends({}, rule)
        }
        rule.validator = _this2.getValidationMethod(rule)
        if (!rule.validator) {
          return
        }
        rule.field = z2
        rule.fullField = rule.fullField || z2
        rule.type = _this2.getType(rule)
        series[z2] = series[z2] || []
        series[z2].push({
          rule,
          value,
          source,
          field: z2,
        })
      })
    })
    var errorFields = {}
    return asyncMap(
      series,
      options,
      function (data, doIt) {
        var rule = data.rule
        var deep =
          (rule.type === 'object' || rule.type === 'array') &&
          (typeof rule.fields === 'object' ||
            typeof rule.defaultField === 'object')
        deep = deep && (rule.required || (!rule.required && data.value))
        rule.field = data.field
        function addFullField(key, schema) {
          return _extends({}, schema, {
            fullField: rule.fullField + '.' + key,
            fullFields: rule.fullFields
              ? [].concat(rule.fullFields, [key])
              : [key],
          })
        }
        function cb(e) {
          if (e === void 0) {
            e = []
          }
          var errorList = Array.isArray(e) ? e : [e]
          if (!options.suppressWarning && errorList.length) {
            Schema2.warning('async-validator:', errorList)
          }
          if (errorList.length && rule.message !== void 0) {
            errorList = [].concat(rule.message)
          }
          var filledErrors = errorList.map(complementError(rule, source))
          if (options.first && filledErrors.length) {
            errorFields[rule.field] = 1
            return doIt(filledErrors)
          }
          if (!deep) {
            doIt(filledErrors)
          } else {
            if (rule.required && !data.value) {
              if (rule.message !== void 0) {
                filledErrors = []
                  .concat(rule.message)
                  .map(complementError(rule, source))
              } else if (options.error) {
                filledErrors = [
                  options.error(
                    rule,
                    format(options.messages.required, rule.field),
                  ),
                ]
              }
              return doIt(filledErrors)
            }
            var fieldsSchema = {}
            if (rule.defaultField) {
              Object.keys(data.value).map(function (key) {
                fieldsSchema[key] = rule.defaultField
              })
            }
            fieldsSchema = _extends({}, fieldsSchema, data.rule.fields)
            var paredFieldsSchema = {}
            Object.keys(fieldsSchema).forEach(function (field) {
              var fieldSchema = fieldsSchema[field]
              var fieldSchemaList = Array.isArray(fieldSchema)
                ? fieldSchema
                : [fieldSchema]
              paredFieldsSchema[field] = fieldSchemaList.map(
                addFullField.bind(null, field),
              )
            })
            var schema = new Schema2(paredFieldsSchema)
            schema.messages(options.messages)
            if (data.rule.options) {
              data.rule.options.messages = options.messages
              data.rule.options.error = options.error
            }
            schema.validate(
              data.value,
              data.rule.options || options,
              function (errs) {
                var finalErrors = []
                if (filledErrors && filledErrors.length) {
                  finalErrors.push.apply(finalErrors, filledErrors)
                }
                if (errs && errs.length) {
                  finalErrors.push.apply(finalErrors, errs)
                }
                doIt(finalErrors.length ? finalErrors : null)
              },
            )
          }
        }
        var res
        if (rule.asyncValidator) {
          res = rule.asyncValidator(rule, data.value, cb, data.source, options)
        } else if (rule.validator) {
          try {
            res = rule.validator(rule, data.value, cb, data.source, options)
          } catch (error) {
            console.error == null ? void 0 : console.error(error)
            if (!options.suppressValidatorError) {
              setTimeout(function () {
                throw error
              }, 0)
            }
            cb(error.message)
          }
          if (res === true) {
            cb()
          } else if (res === false) {
            cb(
              typeof rule.message === 'function'
                ? rule.message(rule.fullField || rule.field)
                : rule.message || (rule.fullField || rule.field) + ' fails',
            )
          } else if (res instanceof Array) {
            cb(res)
          } else if (res instanceof Error) {
            cb(res.message)
          }
        }
        if (res && res.then) {
          res.then(
            function () {
              return cb()
            },
            function (e) {
              return cb(e)
            },
          )
        }
      },
      function (results) {
        complete(results)
      },
      source,
    )
  }
  _proto.getType = function getType(rule) {
    if (rule.type === void 0 && rule.pattern instanceof RegExp) {
      rule.type = 'pattern'
    }
    if (
      typeof rule.validator !== 'function' &&
      rule.type &&
      !validators.hasOwnProperty(rule.type)
    ) {
      throw new Error(format('Unknown rule type %s', rule.type))
    }
    return rule.type || 'string'
  }
  _proto.getValidationMethod = function getValidationMethod(rule) {
    if (typeof rule.validator === 'function') {
      return rule.validator
    }
    var keys = Object.keys(rule)
    var messageIndex = keys.indexOf('message')
    if (messageIndex !== -1) {
      keys.splice(messageIndex, 1)
    }
    if (keys.length === 1 && keys[0] === 'required') {
      return validators.required
    }
    return validators[this.getType(rule)] || void 0
  }
  return Schema2
})()
Schema.register = function register(type4, validator) {
  if (typeof validator !== 'function') {
    throw new Error(
      'Cannot register a validator by type, validator is not a function',
    )
  }
  validators[type4] = validator
}
Schema.warning = warning
Schema.messages = messages
Schema.validators = validators

// packages/xbElement/dist/es/x-element.js
var P = (e, t) => () => (
  t || (e((t = { exports: {} }).exports, t), (e = null)),
  t.exports
)
var he = P(e => {
  Object.defineProperty(e, '__esModule', { value: true })
  var t = 'fas',
    n = 'spinner',
    r = 512,
    i = 512,
    a = [],
    o = 'f110',
    s =
      'M208 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm0 416a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM48 208a48 48 0 1 1 0 96 48 48 0 1 1 0-96zm368 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM75 369.1A48 48 0 1 1 142.9 437 48 48 0 1 1 75 369.1zM75 75A48 48 0 1 1 142.9 142.9 48 48 0 1 1 75 75zM437 369.1A48 48 0 1 1 369.1 437 48 48 0 1 1 437 369.1z'
  ;((e.definition = {
    prefix: t,
    iconName: n,
    icon: [r, i, a, o, s],
  }),
    (e.faSpinner = e.definition),
    (e.prefix = t),
    (e.iconName = n),
    (e.width = r),
    (e.height = i),
    (e.ligatures = a),
    (e.unicode = o),
    (e.svgPathData = s),
    (e.aliases = a))
})
var ge =
  typeof global == 'object' && global && global.Object === Object && global
var _e = typeof self == 'object' && self && self.Object === Object && self
var F = ge || _e || Function('return this')()
var I = F.Symbol
var ve = Object.prototype
var ye = ve.hasOwnProperty
var be = ve.toString
var xe = I ? I.toStringTag : void 0
function Se(e) {
  var t = ye.call(e, xe),
    n = e[xe]
  try {
    e[xe] = void 0
    var r = true
  } catch {}
  var i = be.call(e)
  return (r && (t ? (e[xe] = n) : delete e[xe]), i)
}
var Ce = Object.prototype.toString
function we(e) {
  return Ce.call(e)
}
var Te = '[object Null]'
var Ee = '[object Undefined]'
var De = I ? I.toStringTag : void 0
function L(e) {
  return e == null
    ? e === void 0
      ? Ee
      : Te
    : De && De in Object(e)
      ? Se(e)
      : we(e)
}
function R(e) {
  return typeof e == 'object' && !!e
}
var Oe = '[object Symbol]'
function ke(e) {
  return typeof e == 'symbol' || (R(e) && L(e) == Oe)
}
function Ae(e, t) {
  for (var n = -1, r = e == null ? 0 : e.length, i = Array(r); ++n < r; )
    i[n] = t(e[n], n, e)
  return i
}
var z = Array.isArray
var je = Infinity
var Me = I ? I.prototype : void 0
var Ne = Me ? Me.toString : void 0
function Pe(e) {
  if (typeof e == 'string') return e
  if (z(e)) return Ae(e, Pe) + ''
  if (ke(e)) return Ne ? Ne.call(e) : ''
  var t = e + ''
  return t == '0' && 1 / e == -je ? '-0' : t
}
var Fe = /\s/
function Ie(e) {
  for (var t = e.length; t-- && Fe.test(e.charAt(t)); );
  return t
}
var Le = /^\s+/
function Re(e) {
  return e && e.slice(0, Ie(e) + 1).replace(Le, '')
}
function B(e) {
  var t = typeof e
  return e != null && (t == 'object' || t == 'function')
}
var ze = NaN
var Be = /^[-+]0x[0-9a-f]+$/i
var Ve = /^0b[01]+$/i
var He = /^0o[0-7]+$/i
var Ue = parseInt
function We(e) {
  if (typeof e == 'number') return e
  if (ke(e)) return ze
  if (B(e)) {
    var t = typeof e.valueOf == 'function' ? e.valueOf() : e
    e = B(t) ? t + '' : t
  }
  if (typeof e != 'string') return e === 0 ? e : +e
  e = Re(e)
  var n = Ve.test(e)
  return n || He.test(e) ? Ue(e.slice(2), n ? 2 : 8) : Be.test(e) ? ze : +e
}
function Ge(e) {
  return e
}
var Ke = '[object AsyncFunction]'
var qe = '[object Function]'
var Je = '[object GeneratorFunction]'
var Ye = '[object Proxy]'
function Xe(e) {
  if (!B(e)) return false
  var t = L(e)
  return t == qe || t == Je || t == Ke || t == Ye
}
var Ze = F['__core-js_shared__']
var Qe = (function () {
  var e = /[^.]+$/.exec((Ze && Ze.keys && Ze.keys.IE_PROTO) || '')
  return e ? 'Symbol(src)_1.' + e : ''
})()
function $e(e) {
  return !!Qe && Qe in e
}
var et = Function.prototype.toString
function V(e) {
  if (e != null) {
    try {
      return et.call(e)
    } catch {}
    try {
      return e + ''
    } catch {}
  }
  return ''
}
var tt = /[\\^$.*+?()[\]{}|]/g
var nt = /^\[object .+?Constructor\]$/
var rt = Function.prototype
var it = Object.prototype
var at = rt.toString
var ot = it.hasOwnProperty
var st = RegExp(
  '^' +
    at
      .call(ot)
      .replace(tt, '\\$&')
      .replace(
        /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
        '$1.*?',
      ) +
    '$',
)
function ct(e) {
  return !B(e) || $e(e) ? false : (Xe(e) ? st : nt).test(V(e))
}
function lt(e, t) {
  return e == null ? void 0 : e[t]
}
function H(e, t) {
  var n = lt(e, t)
  return ct(n) ? n : void 0
}
var ut = H(F, 'WeakMap')
var dt = Object.create
var ft = /* @__PURE__ */ (function () {
  function e() {}
  return function (t) {
    if (!B(t)) return {}
    if (dt) return dt(t)
    e.prototype = t
    var n = new e()
    return ((e.prototype = void 0), n)
  }
})()
function pt(e, t, n) {
  switch (n.length) {
    case 0:
      return e.call(t)
    case 1:
      return e.call(t, n[0])
    case 2:
      return e.call(t, n[0], n[1])
    case 3:
      return e.call(t, n[0], n[1], n[2])
  }
  return e.apply(t, n)
}
function mt(e, t) {
  var n = -1,
    r = e.length
  for (t || (t = Array(r)); ++n < r; ) t[n] = e[n]
  return t
}
var ht = 800
var gt = 16
var _t = Date.now
function vt(e) {
  var t = 0,
    n = 0
  return function () {
    var r = _t(),
      i = gt - (r - n)
    if (((n = r), i > 0)) {
      if (++t >= ht) return arguments[0]
    } else t = 0
    return e.apply(void 0, arguments)
  }
}
function yt(e) {
  return function () {
    return e
  }
}
var bt = (function () {
  try {
    var e = H(Object, 'defineProperty')
    return (e({}, '', {}), e)
  } catch {}
})()
var xt = vt(
  bt
    ? function (e, t) {
        return bt(e, 'toString', {
          configurable: true,
          enumerable: false,
          value: yt(t),
          writable: true,
        })
      }
    : Ge,
)
function St(e, t) {
  for (
    var n = -1, r = e == null ? 0 : e.length;
    ++n < r && t(e[n], n, e) !== false;
  );
  return e
}
var Ct = 9007199254740991
var wt = /^(?:0|[1-9]\d*)$/
function Tt(e, t) {
  var n = typeof e
  return (
    t ?? (t = Ct),
    !!t &&
      (n == 'number' || (n != 'symbol' && wt.test(e))) &&
      e > -1 &&
      e % 1 == 0 &&
      e < t
  )
}
function Et(e, t, n) {
  t == '__proto__' && bt
    ? bt(e, t, {
        configurable: true,
        enumerable: true,
        value: n,
        writable: true,
      })
    : (e[t] = n)
}
function Dt(e, t) {
  return e === t || (e !== e && t !== t)
}
var Ot = Object.prototype.hasOwnProperty
function kt(e, t, n) {
  var r = e[t]
  ;(!(Ot.call(e, t) && Dt(r, n)) || (n === void 0 && !(t in e))) && Et(e, t, n)
}
function At(e, t, n, r) {
  var i = !n
  n || (n = {})
  for (var a = -1, o = t.length; ++a < o; ) {
    var s = t[a],
      c = r ? r(n[s], e[s], s, n, e) : void 0
    ;(c === void 0 && (c = e[s]), i ? Et(n, s, c) : kt(n, s, c))
  }
  return n
}
var jt = Math.max
function Mt(e, t, n) {
  return (
    (t = jt(t === void 0 ? e.length - 1 : t, 0)),
    function () {
      for (
        var r = arguments, i = -1, a = jt(r.length - t, 0), o = Array(a);
        ++i < a;
      )
        o[i] = r[t + i]
      i = -1
      for (var s = Array(t + 1); ++i < t; ) s[i] = r[i]
      return ((s[t] = n(o)), pt(e, this, s))
    }
  )
}
var Nt = 9007199254740991
function Pt(e) {
  return typeof e == 'number' && e > -1 && e % 1 == 0 && e <= Nt
}
function Ft(e) {
  return e != null && Pt(e.length) && !Xe(e)
}
var It = Object.prototype
function Lt(e) {
  var t = e && e.constructor
  return e === ((typeof t == 'function' && t.prototype) || It)
}
function Rt(e, t) {
  for (var n = -1, r = Array(e); ++n < e; ) r[n] = t(n)
  return r
}
var zt = '[object Arguments]'
function Bt(e) {
  return R(e) && L(e) == zt
}
var Vt = Object.prototype
var Ht = Vt.hasOwnProperty
var Ut = Vt.propertyIsEnumerable
var Wt = Bt(
  /* @__PURE__ */ (function () {
    return arguments
  })(),
)
  ? Bt
  : function (e) {
      return R(e) && Ht.call(e, 'callee') && !Ut.call(e, 'callee')
    }
function Gt() {
  return false
}
var Kt = typeof exports == 'object' && exports && !exports.nodeType && exports
var qt = Kt && typeof module == 'object' && module && !module.nodeType && module
var Jt = qt && qt.exports === Kt ? F.Buffer : void 0
var Yt = (Jt ? Jt.isBuffer : void 0) || Gt
var Xt = '[object Arguments]'
var Zt = '[object Array]'
var Qt = '[object Boolean]'
var $t = '[object Date]'
var en = '[object Error]'
var tn = '[object Function]'
var nn = '[object Map]'
var rn = '[object Number]'
var an = '[object Object]'
var on = '[object RegExp]'
var sn = '[object Set]'
var cn = '[object String]'
var ln = '[object WeakMap]'
var un = '[object ArrayBuffer]'
var dn = '[object DataView]'
var fn = '[object Float32Array]'
var pn = '[object Float64Array]'
var mn = '[object Int8Array]'
var hn = '[object Int16Array]'
var gn = '[object Int32Array]'
var _n = '[object Uint8Array]'
var vn = '[object Uint8ClampedArray]'
var yn = '[object Uint16Array]'
var bn = '[object Uint32Array]'
var U = {}
;((U[fn] =
  U[pn] =
  U[mn] =
  U[hn] =
  U[gn] =
  U[_n] =
  U[vn] =
  U[yn] =
  U[bn] =
    true),
  (U[Xt] =
    U[Zt] =
    U[un] =
    U[Qt] =
    U[dn] =
    U[$t] =
    U[en] =
    U[tn] =
    U[nn] =
    U[rn] =
    U[an] =
    U[on] =
    U[sn] =
    U[cn] =
    U[ln] =
      false))
function xn(e) {
  return R(e) && Pt(e.length) && !!U[L(e)]
}
function Sn(e) {
  return function (t) {
    return e(t)
  }
}
var Cn = typeof exports == 'object' && exports && !exports.nodeType && exports
var wn = Cn && typeof module == 'object' && module && !module.nodeType && module
var Tn = wn && wn.exports === Cn && ge.process
var W = (function () {
  try {
    return (
      (wn && wn.require && wn.require('util').types) ||
      (Tn && Tn.binding && Tn.binding('util'))
    )
  } catch {}
})()
var En = W && W.isTypedArray
var Dn = En ? Sn(En) : xn
var On = Object.prototype.hasOwnProperty
function kn(e, t) {
  var n = z(e),
    r = !n && Wt(e),
    i = !n && !r && Yt(e),
    a = !n && !r && !i && Dn(e),
    o = n || r || i || a,
    s = o ? Rt(e.length, String) : [],
    c = s.length
  for (var l in e)
    (t || On.call(e, l)) &&
      !(
        o &&
        (l == 'length' ||
          (i && (l == 'offset' || l == 'parent')) ||
          (a && (l == 'buffer' || l == 'byteLength' || l == 'byteOffset')) ||
          Tt(l, c))
      ) &&
      s.push(l)
  return s
}
function An(e, t) {
  return function (n) {
    return e(t(n))
  }
}
var jn = An(Object.keys, Object)
var Mn = Object.prototype.hasOwnProperty
function Nn(e) {
  if (!Lt(e)) return jn(e)
  var t = []
  for (var n in Object(e)) Mn.call(e, n) && n != 'constructor' && t.push(n)
  return t
}
function Pn(e) {
  return Ft(e) ? kn(e) : Nn(e)
}
function Fn(e) {
  var t = []
  if (e != null) for (var n in Object(e)) t.push(n)
  return t
}
var In = Object.prototype.hasOwnProperty
function Ln(e) {
  if (!B(e)) return Fn(e)
  var t = Lt(e),
    n = []
  for (var r in e) (r == 'constructor' && (t || !In.call(e, r))) || n.push(r)
  return n
}
function Rn(e) {
  return Ft(e) ? kn(e, true) : Ln(e)
}
var zn = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/
var Bn = /^\w*$/
function Vn(e, t) {
  if (z(e)) return false
  var n = typeof e
  return n == 'number' || n == 'symbol' || n == 'boolean' || e == null || ke(e)
    ? true
    : Bn.test(e) || !zn.test(e) || (t != null && e in Object(t))
}
var Hn = H(Object, 'create')
function Un() {
  ;((this.__data__ = Hn ? Hn(null) : {}), (this.size = 0))
}
function Wn(e) {
  var t = this.has(e) && delete this.__data__[e]
  return ((this.size -= +!!t), t)
}
var Gn = '__lodash_hash_undefined__'
var Kn = Object.prototype.hasOwnProperty
function qn(e) {
  var t = this.__data__
  if (Hn) {
    var n = t[e]
    return n === Gn ? void 0 : n
  }
  return Kn.call(t, e) ? t[e] : void 0
}
var Jn = Object.prototype.hasOwnProperty
function Yn(e) {
  var t = this.__data__
  return Hn ? t[e] !== void 0 : Jn.call(t, e)
}
var Xn = '__lodash_hash_undefined__'
function Zn(e, t) {
  var n = this.__data__
  return (
    (this.size += +!this.has(e)),
    (n[e] = Hn && t === void 0 ? Xn : t),
    this
  )
}
function G(e) {
  var t = -1,
    n = e == null ? 0 : e.length
  for (this.clear(); ++t < n; ) {
    var r = e[t]
    this.set(r[0], r[1])
  }
}
;((G.prototype.clear = Un),
  (G.prototype.delete = Wn),
  (G.prototype.get = qn),
  (G.prototype.has = Yn),
  (G.prototype.set = Zn))
function Qn() {
  ;((this.__data__ = []), (this.size = 0))
}
function $n(e, t) {
  for (var n = e.length; n--; ) if (Dt(e[n][0], t)) return n
  return -1
}
var er = Array.prototype.splice
function tr(e) {
  var t = this.__data__,
    n = $n(t, e)
  return n < 0
    ? false
    : (n == t.length - 1 ? t.pop() : er.call(t, n, 1), --this.size, true)
}
function nr(e) {
  var t = this.__data__,
    n = $n(t, e)
  return n < 0 ? void 0 : t[n][1]
}
function rr(e) {
  return $n(this.__data__, e) > -1
}
function ir(e, t) {
  var n = this.__data__,
    r = $n(n, e)
  return (r < 0 ? (++this.size, n.push([e, t])) : (n[r][1] = t), this)
}
function K(e) {
  var t = -1,
    n = e == null ? 0 : e.length
  for (this.clear(); ++t < n; ) {
    var r = e[t]
    this.set(r[0], r[1])
  }
}
;((K.prototype.clear = Qn),
  (K.prototype.delete = tr),
  (K.prototype.get = nr),
  (K.prototype.has = rr),
  (K.prototype.set = ir))
var ar = H(F, 'Map')
function or() {
  ;((this.size = 0),
    (this.__data__ = {
      hash: new G(),
      map: new (ar || K)(),
      string: new G(),
    }))
}
function sr(e) {
  var t = typeof e
  return t == 'string' || t == 'number' || t == 'symbol' || t == 'boolean'
    ? e !== '__proto__'
    : e === null
}
function cr(e, t) {
  var n = e.__data__
  return sr(t) ? n[typeof t == 'string' ? 'string' : 'hash'] : n.map
}
function lr(e) {
  var t = cr(this, e).delete(e)
  return ((this.size -= +!!t), t)
}
function ur(e) {
  return cr(this, e).get(e)
}
function dr(e) {
  return cr(this, e).has(e)
}
function fr(e, t) {
  var n = cr(this, e),
    r = n.size
  return (n.set(e, t), (this.size += n.size == r ? 0 : 1), this)
}
function q(e) {
  var t = -1,
    n = e == null ? 0 : e.length
  for (this.clear(); ++t < n; ) {
    var r = e[t]
    this.set(r[0], r[1])
  }
}
;((q.prototype.clear = or),
  (q.prototype.delete = lr),
  (q.prototype.get = ur),
  (q.prototype.has = dr),
  (q.prototype.set = fr))
var pr = 'Expected a function'
function mr(e, t) {
  if (typeof e != 'function' || (t != null && typeof t != 'function'))
    throw TypeError(pr)
  var n = function () {
    var r = arguments,
      i = t ? t.apply(this, r) : r[0],
      a = n.cache
    if (a.has(i)) return a.get(i)
    var o = e.apply(this, r)
    return ((n.cache = a.set(i, o) || a), o)
  }
  return ((n.cache = new (mr.Cache || q)()), n)
}
mr.Cache = q
var hr = 500
function gr(e) {
  var t = mr(e, function (e2) {
      return (n.size === hr && n.clear(), e2)
    }),
    n = t.cache
  return t
}
var _r =
  /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g
var vr = /\\(\\)?/g
var yr = gr(function (e) {
  var t = []
  return (
    e.charCodeAt(0) === 46 && t.push(''),
    e.replace(_r, function (e2, n, r, i) {
      t.push(r ? i.replace(vr, '$1') : n || e2)
    }),
    t
  )
})
function br(e) {
  return e == null ? '' : Pe(e)
}
function xr(e, t) {
  return z(e) ? e : Vn(e, t) ? [e] : yr(br(e))
}
var Sr = Infinity
function Cr(e) {
  if (typeof e == 'string' || ke(e)) return e
  var t = e + ''
  return t == '0' && 1 / e == -Sr ? '-0' : t
}
function wr(e, t) {
  t = xr(t, e)
  for (var n = 0, r = t.length; e != null && n < r; ) e = e[Cr(t[n++])]
  return n && n == r ? e : void 0
}
function Tr(e, t) {
  for (var n = -1, r = t.length, i = e.length; ++n < r; ) e[i + n] = t[n]
  return e
}
var Er = I ? I.isConcatSpreadable : void 0
function Dr(e) {
  return z(e) || Wt(e) || !!(Er && e && e[Er])
}
function Or(e, t, n, r, i) {
  var a = -1,
    o = e.length
  for (n || (n = Dr), i || (i = []); ++a < o; ) {
    var s = e[a]
    t > 0 && n(s)
      ? t > 1
        ? Or(s, t - 1, n, r, i)
        : Tr(i, s)
      : r || (i[i.length] = s)
  }
  return i
}
function kr(e) {
  return e != null && e.length ? Or(e, 1) : []
}
function Ar(e) {
  return xt(Mt(e, void 0, kr), e + '')
}
var jr = An(Object.getPrototypeOf, Object)
var Mr = '[object Object]'
var Nr = Function.prototype
var Pr = Object.prototype
var Fr = Nr.toString
var Ir = Pr.hasOwnProperty
var Lr = Fr.call(Object)
function Rr(e) {
  if (!R(e) || L(e) != Mr) return false
  var t = jr(e)
  if (t === null) return true
  var n = Ir.call(t, 'constructor') && t.constructor
  return typeof n == 'function' && n instanceof n && Fr.call(n) == Lr
}
function zr(e, t, n) {
  var r = -1,
    i = e.length
  ;(t < 0 && (t = -t > i ? 0 : i + t),
    (n = n > i ? i : n),
    n < 0 && (n += i),
    (i = t > n ? 0 : (n - t) >>> 0),
    (t >>>= 0))
  for (var a = Array(i); ++r < i; ) a[r] = e[r + t]
  return a
}
function Br() {
  ;((this.__data__ = new K()), (this.size = 0))
}
function Vr(e) {
  var t = this.__data__,
    n = t.delete(e)
  return ((this.size = t.size), n)
}
function Hr(e) {
  return this.__data__.get(e)
}
function Ur(e) {
  return this.__data__.has(e)
}
var Wr = 200
function Gr(e, t) {
  var n = this.__data__
  if (n instanceof K) {
    var r = n.__data__
    if (!ar || r.length < Wr - 1)
      return (r.push([e, t]), (this.size = ++n.size), this)
    n = this.__data__ = new q(r)
  }
  return (n.set(e, t), (this.size = n.size), this)
}
function J(e) {
  var t = (this.__data__ = new K(e))
  this.size = t.size
}
;((J.prototype.clear = Br),
  (J.prototype.delete = Vr),
  (J.prototype.get = Hr),
  (J.prototype.has = Ur),
  (J.prototype.set = Gr))
function Kr(e, t) {
  return e && At(t, Pn(t), e)
}
function qr(e, t) {
  return e && At(t, Rn(t), e)
}
var Jr = typeof exports == 'object' && exports && !exports.nodeType && exports
var Yr = Jr && typeof module == 'object' && module && !module.nodeType && module
var Xr = Yr && Yr.exports === Jr ? F.Buffer : void 0
var Zr = Xr ? Xr.allocUnsafe : void 0
function Qr(e, t) {
  if (t) return e.slice()
  var n = e.length,
    r = Zr ? Zr(n) : new e.constructor(n)
  return (e.copy(r), r)
}
function $r(e, t) {
  for (var n = -1, r = e == null ? 0 : e.length, i = 0, a = []; ++n < r; ) {
    var o = e[n]
    t(o, n, e) && (a[i++] = o)
  }
  return a
}
function ei() {
  return []
}
var ti = Object.prototype.propertyIsEnumerable
var ni = Object.getOwnPropertySymbols
var ri = ni
  ? function (e) {
      return e == null
        ? []
        : ((e = Object(e)),
          $r(ni(e), function (t) {
            return ti.call(e, t)
          }))
    }
  : ei
function ii(e, t) {
  return At(e, ri(e), t)
}
var ai = Object.getOwnPropertySymbols
  ? function (e) {
      for (var t = []; e; ) (Tr(t, ri(e)), (e = jr(e)))
      return t
    }
  : ei
function oi(e, t) {
  return At(e, ai(e), t)
}
function si(e, t, n) {
  var r = t(e)
  return z(e) ? r : Tr(r, n(e))
}
function ci(e) {
  return si(e, Pn, ri)
}
function li(e) {
  return si(e, Rn, ai)
}
var ui = H(F, 'DataView')
var di = H(F, 'Promise')
var fi = H(F, 'Set')
var pi = '[object Map]'
var mi = '[object Object]'
var hi = '[object Promise]'
var gi = '[object Set]'
var _i = '[object WeakMap]'
var vi = '[object DataView]'
var yi = V(ui)
var bi = V(ar)
var xi = V(di)
var Si = V(fi)
var Ci = V(ut)
var Y = L
;((ui && Y(new ui(new ArrayBuffer(1))) != vi) ||
  (ar && Y(new ar()) != pi) ||
  (di && Y(di.resolve()) != hi) ||
  (fi && Y(new fi()) != gi) ||
  (ut && Y(new ut()) != _i)) &&
  (Y = function (e) {
    var t = L(e),
      n = t == mi ? e.constructor : void 0,
      r = n ? V(n) : ''
    if (r)
      switch (r) {
        case yi:
          return vi
        case bi:
          return pi
        case xi:
          return hi
        case Si:
          return gi
        case Ci:
          return _i
      }
    return t
  })
var wi = Y
var Ti = Object.prototype.hasOwnProperty
function Ei(e) {
  var t = e.length,
    n = new e.constructor(t)
  return (
    t &&
      typeof e[0] == 'string' &&
      Ti.call(e, 'index') &&
      ((n.index = e.index), (n.input = e.input)),
    n
  )
}
var Di = F.Uint8Array
function Oi(e) {
  var t = new e.constructor(e.byteLength)
  return (new Di(t).set(new Di(e)), t)
}
function ki(e, t) {
  var n = t ? Oi(e.buffer) : e.buffer
  return new e.constructor(n, e.byteOffset, e.byteLength)
}
var Ai = /\w*$/
function ji(e) {
  var t = new e.constructor(e.source, Ai.exec(e))
  return ((t.lastIndex = e.lastIndex), t)
}
var Mi = I ? I.prototype : void 0
var Ni = Mi ? Mi.valueOf : void 0
function Pi(e) {
  return Ni ? Object(Ni.call(e)) : {}
}
function Fi(e, t) {
  var n = t ? Oi(e.buffer) : e.buffer
  return new e.constructor(n, e.byteOffset, e.length)
}
var Ii = '[object Boolean]'
var Li = '[object Date]'
var Ri = '[object Map]'
var zi = '[object Number]'
var Bi = '[object RegExp]'
var Vi = '[object Set]'
var Hi = '[object String]'
var Ui = '[object Symbol]'
var Wi = '[object ArrayBuffer]'
var Gi = '[object DataView]'
var Ki = '[object Float32Array]'
var qi = '[object Float64Array]'
var Ji = '[object Int8Array]'
var Yi = '[object Int16Array]'
var Xi = '[object Int32Array]'
var Zi = '[object Uint8Array]'
var Qi = '[object Uint8ClampedArray]'
var $i = '[object Uint16Array]'
var ea = '[object Uint32Array]'
function ta(e, t, n) {
  var r = e.constructor
  switch (t) {
    case Wi:
      return Oi(e)
    case Ii:
    case Li:
      return new r(+e)
    case Gi:
      return ki(e, n)
    case Ki:
    case qi:
    case Ji:
    case Yi:
    case Xi:
    case Zi:
    case Qi:
    case $i:
    case ea:
      return Fi(e, n)
    case Ri:
      return new r()
    case zi:
    case Hi:
      return new r(e)
    case Bi:
      return ji(e)
    case Vi:
      return new r()
    case Ui:
      return Pi(e)
  }
}
function na(e) {
  return typeof e.constructor == 'function' && !Lt(e) ? ft(jr(e)) : {}
}
var ra = '[object Map]'
function ia(e) {
  return R(e) && wi(e) == ra
}
var aa = W && W.isMap
var oa = aa ? Sn(aa) : ia
var sa = '[object Set]'
function ca(e) {
  return R(e) && wi(e) == sa
}
var la = W && W.isSet
var ua = la ? Sn(la) : ca
var da = 1
var fa = 2
var pa = 4
var ma = '[object Arguments]'
var ha = '[object Array]'
var ga = '[object Boolean]'
var _a = '[object Date]'
var va = '[object Error]'
var ya = '[object Function]'
var ba = '[object GeneratorFunction]'
var xa = '[object Map]'
var Sa = '[object Number]'
var Ca = '[object Object]'
var wa = '[object RegExp]'
var Ta = '[object Set]'
var Ea = '[object String]'
var Da = '[object Symbol]'
var Oa = '[object WeakMap]'
var ka = '[object ArrayBuffer]'
var Aa = '[object DataView]'
var ja = '[object Float32Array]'
var Ma = '[object Float64Array]'
var Na = '[object Int8Array]'
var Pa = '[object Int16Array]'
var Fa = '[object Int32Array]'
var Ia = '[object Uint8Array]'
var La = '[object Uint8ClampedArray]'
var Ra = '[object Uint16Array]'
var za = '[object Uint32Array]'
var X = {}
;((X[ma] =
  X[ha] =
  X[ka] =
  X[Aa] =
  X[ga] =
  X[_a] =
  X[ja] =
  X[Ma] =
  X[Na] =
  X[Pa] =
  X[Fa] =
  X[xa] =
  X[Sa] =
  X[Ca] =
  X[wa] =
  X[Ta] =
  X[Ea] =
  X[Da] =
  X[Ia] =
  X[La] =
  X[Ra] =
  X[za] =
    true),
  (X[va] = X[ya] = X[Oa] = false))
function Ba(e, t, n, r, i, a) {
  var o,
    s = t & da,
    c = t & fa,
    l = t & pa
  if ((n && (o = i ? n(e, r, i, a) : n(e)), o !== void 0)) return o
  if (!B(e)) return e
  var u = z(e)
  if (u) {
    if (((o = Ei(e)), !s)) return mt(e, o)
  } else {
    var d = wi(e),
      f = d == ya || d == ba
    if (Yt(e)) return Qr(e, s)
    if (d == Ca || d == ma || (f && !i)) {
      if (((o = c || f ? {} : na(e)), !s))
        return c ? oi(e, qr(o, e)) : ii(e, Kr(o, e))
    } else {
      if (!X[d]) return i ? e : {}
      o = ta(e, d, s)
    }
  }
  a || (a = new J())
  var p = a.get(e)
  if (p) return p
  ;(a.set(e, o),
    ua(e)
      ? e.forEach(function (r2) {
          o.add(Ba(r2, t, n, r2, e, a))
        })
      : oa(e) &&
        e.forEach(function (r2, i2) {
          o.set(i2, Ba(r2, t, n, i2, e, a))
        }))
  var m = u ? void 0 : (l ? (c ? li : ci) : c ? Rn : Pn)(e)
  return (
    St(m || e, function (r2, i2) {
      ;(m && ((i2 = r2), (r2 = e[i2])), kt(o, i2, Ba(r2, t, n, i2, e, a)))
    }),
    o
  )
}
var Va = function () {
  return F.Date.now()
}
var Ha = 'Expected a function'
var Ua = Math.max
var Wa = Math.min
function Ga(e, t, n) {
  var r,
    i,
    a,
    o,
    s,
    c,
    l = 0,
    u = false,
    d = false,
    f = true
  if (typeof e != 'function') throw TypeError(Ha)
  ;((t = We(t) || 0),
    B(n) &&
      ((u = !!n.leading),
      (d = 'maxWait' in n),
      (a = d ? Ua(We(n.maxWait) || 0, t) : a),
      (f = 'trailing' in n ? !!n.trailing : f)))
  function p(t2) {
    var n2 = r,
      a2 = i
    return ((r = i = void 0), (l = t2), (o = e.apply(a2, n2)), o)
  }
  function m(e2) {
    return ((l = e2), (s = setTimeout(_, t)), u ? p(e2) : o)
  }
  function h2(e2) {
    var n2 = e2 - c,
      r2 = e2 - l,
      i2 = t - n2
    return d ? Wa(i2, a - r2) : i2
  }
  function g(e2) {
    var n2 = e2 - c,
      r2 = e2 - l
    return c === void 0 || n2 >= t || n2 < 0 || (d && r2 >= a)
  }
  function _() {
    var e2 = Va()
    if (g(e2)) return v(e2)
    s = setTimeout(_, h2(e2))
  }
  function v(e2) {
    return ((s = void 0), f && r ? p(e2) : ((r = i = void 0), o))
  }
  function y() {
    ;(s !== void 0 && clearTimeout(s), (l = 0), (r = c = i = s = void 0))
  }
  function b() {
    return s === void 0 ? o : v(Va())
  }
  function x() {
    var e2 = Va(),
      n2 = g(e2)
    if (((r = arguments), (i = this), (c = e2), n2)) {
      if (s === void 0) return m(c)
      if (d) return (clearTimeout(s), (s = setTimeout(_, t)), p(c))
    }
    return (s === void 0 && (s = setTimeout(_, t)), o)
  }
  return ((x.cancel = y), (x.flush = b), x)
}
function Ka(e) {
  var t = e == null ? 0 : e.length
  return t ? e[t - 1] : void 0
}
function qa(e, t) {
  return t.length < 2 ? e : wr(e, zr(t, 0, -1))
}
function Ja(e) {
  return e == null
}
var Ya = Object.prototype.hasOwnProperty
function Xa(e, t) {
  t = xr(t, e)
  var n = -1,
    r = t.length
  if (!r) return true
  for (; ++n < r; ) {
    var i = Cr(t[n])
    if (
      (i === '__proto__' && !Ya.call(e, '__proto__')) ||
      ((i === 'constructor' || i === 'prototype') && n < r - 1)
    )
      return false
  }
  var a = qa(e, t)
  return a == null || delete a[Cr(Ka(t))]
}
function Za(e) {
  return Rr(e) ? void 0 : e
}
var Qa = 1
var $a = 2
var eo = 4
var to = Ar(function (e, t) {
  var n = {}
  if (e == null) return n
  var r = false
  ;((t = Ae(t, function (t2) {
    return ((t2 = xr(t2, e)), r || (r = t2.length > 1), t2)
  })),
    At(e, li(e), n),
    r && (n = Ba(n, Qa | $a | eo, Za)))
  for (var i = t.length; i--; ) Xa(n, t[i])
  return n
})
var no = he()
var Z = defineComponent({
  name: 'VkIcon',
  inheritAttrs: false,
  __name: 'Icon',
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
    color: {},
  },
  setup(e) {
    let t = e,
      r = computed(() => to(t, ['color', 'type'])),
      i = computed(() => (t.color ? { color: t.color } : {}))
    return (t2, n) => (
      openBlock(),
      createElementBlock(
        'i',
        mergeProps(
          { class: ['vk-icon', { [`vk-icon--${e.type}`]: e.type }] },
          t2.$attrs,
          { style: i.value },
        ),
        [
          createVNode(
            unref(se),
            normalizeProps(guardReactiveProps(r.value)),
            null,
            16,
          ),
        ],
        16,
      )
    )
  },
})
var ro = ['disabled', 'autofocus', 'nativeType']
var io = defineComponent({
  name: 'VkButton',
  __name: 'Button',
  props: {
    type: {},
    plain: { type: Boolean },
    size: {},
    round: { type: Boolean },
    circle: { type: Boolean },
    disabled: { type: Boolean },
    icon: {},
    loading: { type: Boolean },
    nativeType: { default: 'button' },
    autofocus: { type: Boolean },
  },
  setup(e, { expose: t }) {
    let n = ref()
    return (
      t({ ref: n }),
      (t2, s) => (
        openBlock(),
        createElementBlock(
          'button',
          {
            ref_key: 'buttonRef',
            ref: n,
            class: normalizeClass([
              'vk-button',
              {
                [`vk-button--${e.type}`]: e.type,
                [`vk-button--${e.size}`]: e.size,
                'is-circle': e.circle,
                'is-plain': e.plain,
                'is-round': e.round,
                'is-loading': e.loading,
                'is-disabled': e.disabled,
              },
            ]),
            disabled: e.disabled || e.loading,
            autofocus: e.autofocus,
            nativeType: e.nativeType,
          },
          [
            e.loading
              ? (openBlock(),
                createBlock(
                  Z,
                  {
                    key: 0,
                    icon: unref(no.faSpinner),
                    spin: '',
                  },
                  null,
                  8,
                  ['icon'],
                ))
              : createCommentVNode('', true),
            e.icon
              ? (openBlock(),
                createBlock(
                  Z,
                  {
                    key: 1,
                    icon: e.icon,
                  },
                  null,
                  8,
                  ['icon'],
                ))
              : createCommentVNode('', true),
            createBaseVNode('span', null, [renderSlot(t2.$slots, 'default')]),
          ],
          10,
          ro,
        )
      )
    )
  },
})
io.install = e => {
  e.component(io.name || 'VkButton', io)
}
var ao = io
var oo = Symbol('collapseContextKey')
var so = { class: 'vk-collapse' }
var co = defineComponent({
  name: 'VkCollapse',
  __name: 'Collapse',
  props: {
    modelValue: { default: () => ['a'] },
    accordion: { type: Boolean },
  },
  emits: ['update:modelValue', 'change'],
  setup(e, { emit: t }) {
    let n = e,
      r = t,
      i = ref(n.modelValue)
    return (
      watch(
        () => n.modelValue,
        () => {
          i.value = n.modelValue
        },
      ),
      n.accordion &&
        i.value.length > 1 &&
        console.warn('accordion mode should only have one acitve item'),
      provide(oo, {
        activeNames: i,
        handleItemClick: e2 => {
          let t2 = [...i.value]
          if (n.accordion) ((t2 = [i.value[0] == e2 ? '' : e2]), (i.value = t2))
          else {
            let n2 = i.value.indexOf(e2)
            ;(n2 > -1 ? t2.splice(n2, 1) : t2.push(e2), (i.value = t2))
          }
          ;(r('update:modelValue', t2), r('change', t2))
        },
      }),
      (e2, t2) => (
        openBlock(),
        createElementBlock('div', so, [renderSlot(e2.$slots, 'default')])
      )
    )
  },
})
var lo = P(e => {
  Object.defineProperty(e, '__esModule', { value: true })
  var t = 'fas',
    n = 'angle-right',
    r = 256,
    i = 512,
    a = [8250],
    o = 'f105',
    s =
      'M247.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L179.2 256 41.9 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z'
  ;((e.definition = {
    prefix: t,
    iconName: n,
    icon: [r, i, a, o, s],
  }),
    (e.faAngleRight = e.definition),
    (e.prefix = t),
    (e.iconName = n),
    (e.width = r),
    (e.height = i),
    (e.ligatures = a),
    (e.unicode = o),
    (e.svgPathData = s),
    (e.aliases = a))
})()
var uo = ['id']
var fo = { class: 'vk-collapse-item__wrapper' }
var po = { class: 'vk-collapse-item__content' }
var mo = defineComponent({
  name: 'VkCollapseItem',
  __name: 'CollapseItem',
  props: {
    name: {},
    title: {},
    disabled: { type: Boolean },
  },
  setup(e) {
    let r = e,
      i = inject(oo),
      l = computed(() =>
        i == null ? void 0 : i.activeNames.value.includes(r.name),
      ),
      u = () => {
        r.disabled || (i == null ? void 0 : i.handleItemClick(r.name))
      },
      d = {
        beforeEnter(e2) {
          ;((e2.style.height = '0px'), (e2.style.overflow = 'hidden'))
        },
        enter(e2) {
          e2.style.height = `${e2.scrollHeight}px`
        },
        afterEnter(e2) {
          ;((e2.style.height = ''), (e2.style.overflow = ''))
        },
        beforeLeave(e2) {
          ;((e2.style.height = `${e2.scrollHeight}px`),
            (e2.style.overflow = 'hidden'))
        },
        leave(e2) {
          e2.style.height = '0px'
        },
        afterLeave(e2) {
          ;((e2.style.height = ''), (e2.style.overflow = ''))
        },
      }
    return (n, r2) => (
      openBlock(),
      createElementBlock(
        'div',
        {
          class: normalizeClass([
            'vk-collapse-item',
            { 'is-disabled': e.disabled },
          ]),
        },
        [
          createBaseVNode(
            'div',
            {
              class: normalizeClass([
                'vk-collapse-item__header',
                {
                  'is-active': l.value,
                  'is-disabled': e.disabled,
                },
              ]),
              id: `vk-collapse-item-${e.name}`,
              onClick: u,
            },
            [
              renderSlot(n.$slots, 'title', {}, () => [
                createTextVNode(toDisplayString(e.title), 1),
              ]),
              createVNode(
                Z,
                {
                  icon: unref(lo.faAngleRight),
                  class: 'header-angle',
                },
                null,
                8,
                ['icon'],
              ),
            ],
            10,
            uo,
          ),
          createVNode(
            Transition,
            mergeProps({ name: 'slide' }, toHandlers(d)),
            {
              default: withCtx(() => [
                withDirectives(
                  createBaseVNode(
                    'div',
                    fo,
                    [
                      createBaseVNode('div', po, [
                        renderSlot(n.$slots, 'default'),
                      ]),
                    ],
                    512,
                  ),
                  [[vShow, l.value]],
                ),
              ]),
              _: 3,
            },
            16,
          ),
        ],
        2,
      )
    )
  },
})
;((co.install = e => {
  e.component(co.name || 'VkCollapse', co)
}),
  (mo.install = e => {
    e.component(mo.name || 'VkCollapseItem', mo)
  }))
var ho = co
var go = (e, t) => {
  let n = n2 => {
    e.value && n2.target && (e.value.contains(n2.target) || t(n2))
  }
  ;(onMounted(() => {
    document.addEventListener('click', n)
  }),
    onUnmounted(() => {
      document.removeEventListener('click', n)
    }))
}
var _o = defineComponent({
  name: 'VkTooltip',
  __name: 'Tooltip',
  props: {
    content: {},
    trigger: { default: 'click' },
    placement: { default: 'right' },
    manual: { type: Boolean },
    popperOptions: {},
    externalMiddleware: {},
    transition: { default: 'fade' },
    openDelay: { default: 0 },
    closeDelay: { default: 0 },
  },
  emits: ['visible-change', 'click-outside'],
  setup(e, { expose: r, emit: l }) {
    let u = computed(() => {
        var _a2, _b
        let t = [
            offset2(10),
            shift2({ padding: 8 }),
            arrow3({
              element: y,
              padding: 4,
            }),
          ],
          n
        return (
          (n = ((_a2 = e.popperOptions) == null ? void 0 : _a2.middleware)
            ? [
                ...t,
                ...(Array.isArray(
                  (_b = e.popperOptions) == null ? void 0 : _b.middleware,
                )
                  ? e.popperOptions.middleware
                  : []),
              ]
            : [...t]),
          {
            placement: e.placement,
            whileElementsMounted: autoUpdate,
            ...e.popperOptions,
            middleware: n,
          }
        )
      }),
      d = l,
      f = ref(false),
      p = ref(),
      h2 = ref(),
      _ = ref(),
      y = ref(),
      S = reactive({}),
      T = reactive({}),
      {
        floatingStyles: ee,
        middlewareData: D,
        placement: te,
      } = useFloating(p, h2, u.value),
      ne = computed(() => te.value.split('-')[0]),
      re = computed(() => {
        let e2 = D.value.arrow
        if (!e2) return {}
        let { x: t, y: n } = e2,
          r2 = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right',
          }[ne.value]
        return {
          left: t == null ? '' : `${t}px`,
          top: n == null ? '' : `${n}px`,
          right: '',
          bottom: '',
          [r2]: '-4px',
        }
      }),
      ie = () => {
        ;((f.value = true), d('visible-change', true))
      },
      ae = () => {
        ;((f.value = false), d('visible-change', false))
      },
      oe = Ga(ie, e.openDelay),
      N = Ga(ae, e.closeDelay),
      se2 = () => {
        ;(N.cancel(), oe())
      },
      fe = () => {
        ;(oe.cancel(), N())
      },
      me = () => {
        f.value ? fe() : se2()
      },
      P2 = () => {
        e.trigger === 'hover'
          ? ((S.mouseenter = se2), (T.mouseleave = fe))
          : e.trigger === 'click' && (S.click = me)
      }
    return (
      go(_, () => {
        ;(f.value && e.trigger === 'click' && !e.manual && fe(),
          f.value && d('click-outside', true))
      }),
      watch(
        () => e.trigger,
        (e2, t) => {
          e2 !== t && ((S = {}), (T = {}), P2())
        },
      ),
      e.manual || P2(),
      watch(
        () => e.manual,
        e2 => {
          e2 ? ((S = {}), (T = {})) : P2()
        },
      ),
      onUnmounted(() => {
        f.value = false
      }),
      r({
        show: se2,
        hide: fe,
      }),
      (n, r2) => (
        openBlock(),
        createElementBlock(
          'div',
          mergeProps({ class: 'vk-tooltip' }, toHandlers(unref(T), true), {
            ref_key: 'popperOutContainer',
            ref: _,
          }),
          [
            createBaseVNode(
              'div',
              mergeProps(
                {
                  class: 'vk-tooltip__trigger',
                  ref_key: 'triggerNode',
                  ref: p,
                },
                toHandlers(unref(S), true),
              ),
              [renderSlot(n.$slots, 'default')],
              16,
            ),
            createVNode(
              Transition,
              { name: e.transition },
              {
                default: withCtx(() => [
                  f.value
                    ? (openBlock(),
                      createElementBlock(
                        'div',
                        {
                          key: 0,
                          class: 'vk-tooltip__popper',
                          ref_key: 'overlayNode',
                          ref: h2,
                          style: normalizeStyle(unref(ee)),
                        },
                        [
                          renderSlot(n.$slots, 'content', {}, () => [
                            createTextVNode(toDisplayString(e.content), 1),
                          ]),
                          createBaseVNode(
                            'div',
                            {
                              ref_key: 'arrowRef',
                              ref: y,
                              id: 'arrow',
                              class: normalizeClass(`arrow-${ne.value}`),
                              style: normalizeStyle(re.value),
                            },
                            null,
                            6,
                          ),
                        ],
                        4,
                      ))
                    : createCommentVNode('', true),
                ]),
                _: 3,
              },
              8,
              ['name'],
            ),
          ],
          16,
        )
      )
    )
  },
})
var vo = defineComponent({
  props: {
    vNode: {
      type: [String, Object],
      required: true,
    },
  },
  setup(e) {
    return () => e.vNode
  },
})
var yo = { class: 'vk-dropdown' }
var bo = { class: 'vk-dropdown__menu' }
var xo = {
  key: 0,
  role: 'separator',
  class: 'divided-placeholder',
}
var So = ['onClick', 'id']
var Co = defineComponent({
  name: 'VkDropDown',
  __name: 'Dropdown',
  props: {
    menuOptions: {},
    hideAfterClick: {
      type: Boolean,
      default: true,
    },
    content: {},
    trigger: {},
    placement: {},
    manual: { type: Boolean },
    popperOptions: {},
    externalMiddleware: {},
    transition: {},
    openDelay: {},
    closeDelay: {},
  },
  emits: ['visible-change', 'select'],
  setup(t, { expose: n, emit: r }) {
    let s = r,
      l = ref(),
      u = e => {
        s('visible-change', e)
      },
      d = e => {
        var _a2
        e.disabled ||
          (s('select', e),
          t.hideAfterClick && ((_a2 = l.value) == null ? void 0 : _a2.hide()))
      }
    return (
      n({
        show: () => {
          var _a2
          return (_a2 = l.value) == null ? void 0 : _a2.show()
        },
        hide: () => {
          var _a2
          return (_a2 = l.value) == null ? void 0 : _a2.hide()
        },
      }),
      (n2, r2) => (
        openBlock(),
        createElementBlock('div', yo, [
          createVNode(
            _o,
            {
              placement: t.placement,
              trigger: t.trigger,
              'close-delay': t.closeDelay,
              'open-delay': t.openDelay,
              'popper-options': t.popperOptions,
              manual: t.manual,
              ref_key: 'TooltipRef',
              ref: l,
              onVisibleChange: u,
            },
            {
              content: withCtx(() => [
                createBaseVNode('ul', bo, [
                  (openBlock(true),
                  createElementBlock(
                    Fragment,
                    null,
                    renderList(
                      t.menuOptions,
                      t2 => (
                        openBlock(),
                        createElementBlock(
                          Fragment,
                          { key: t2.key },
                          [
                            t2.divided
                              ? (openBlock(), createElementBlock('li', xo))
                              : createCommentVNode('', true),
                            createBaseVNode(
                              'li',
                              {
                                onClick: () => d(t2),
                                class: normalizeClass([
                                  'vk-dropdown__item',
                                  {
                                    'is-disabled': t2.disabled,
                                    'is-divided': t2.divided,
                                  },
                                ]),
                                id: `dropdown-item-${t2.key}`,
                              },
                              [
                                createVNode(
                                  unref(vo),
                                  { 'v-node': t2.label },
                                  null,
                                  8,
                                  ['v-node'],
                                ),
                              ],
                              10,
                              So,
                            ),
                          ],
                          64,
                        )
                      ),
                    ),
                    128,
                  )),
                ]),
              ]),
              default: withCtx(() => [renderSlot(n2.$slots, 'default')]),
              _: 3,
            },
            8,
            [
              'placement',
              'trigger',
              'close-delay',
              'open-delay',
              'popper-options',
              'manual',
            ],
          ),
        ])
      )
    )
  },
})
Co.install = e => {
  e.component(Co.name || 'VkDropdown', Co)
}
var wo = Co
var To = Symbol('formContextKey')
var Eo = Symbol('formItemContextKey')
var Do = { class: 'vk-form' }
var Oo = defineComponent({
  name: 'VkForm',
  __name: 'Form',
  props: {
    model: {},
    rules: {},
  },
  setup(e, { expose: t }) {
    let n = []
    return (
      provide(To, {
        model: e.model,
        rules: e.rules,
        addField: e2 => {
          n.push(e2)
        },
        removeField: e2 => {
          e2.prop && n.splice(n.indexOf(e2), 1)
        },
      }),
      t({
        validate: async () => {
          let e2 = {}
          for (let t2 of n)
            try {
              await t2.validate('')
            } catch (t3) {
              let n2 = t3
              e2 = {
                ...e2,
                ...n2.fields,
              }
            }
          return Object.keys(e2).length === 0 ? true : Promise.reject(e2)
        },
        clearValidate: (e2 = []) => {
          ;(e2.length > 0 ? n.filter(t2 => e2.includes(t2.prop)) : n).forEach(
            e3 => e3.clearValidate(),
          )
        },
        resetFields: (e2 = []) => {
          ;(e2.length > 0 ? n.filter(t2 => e2.includes(t2.prop)) : n).forEach(
            e3 => e3.resetField(),
          )
        },
      }),
      (e2, t2) => (
        openBlock(),
        createElementBlock('form', Do, [renderSlot(e2.$slots, 'default')])
      )
    )
  },
})
var ko = { class: 'vk-form-item__label' }
var Ao = { class: 'vk-form-item__content' }
var jo = {
  key: 0,
  class: 'vk-form-item__error-msg',
}
var Mo = defineComponent({
  name: 'VkFormItem',
  __name: 'FormItem',
  props: {
    label: {},
    prop: {},
  },
  setup(e, { expose: t }) {
    let r = null,
      c = inject(To),
      l = reactive({
        state: 'init',
        errorMsg: '',
        loading: false,
      }),
      u = computed(() => {
        let t2 = c == null ? void 0 : c.model
        return t2 && e.prop && !Ja(t2[e.prop]) ? t2[e.prop] : null
      }),
      d = computed(() => {
        let t2 = c == null ? void 0 : c.rules
        return t2 && e.prop && !Ja(t2[e.prop]) ? t2[e.prop] : []
      }),
      p = e2 => {
        let t2 = d.value
        return t2
          ? t2.filter(t3 =>
              !t3.trigger || !e2 ? true : t3.trigger && t3.trigger === e2,
            )
          : []
      },
      m = computed(() => d.value.some(e2 => e2.required)),
      h2 = async t2 => {
        let n = e.prop,
          r2 = p(t2)
        if (r2.length === 0) return true
        if (n) {
          let e2 = new Schema({ [n]: r2 })
          return (
            (l.loading = true),
            e2
              .validate({ [n]: u.value })
              .then(e3 => {
                ;((l.state = 'success'), console.log(e3))
              })
              .catch(e3 => {
                var _a2
                let { errors: t3 } = e3
                return (
                  (l.state = 'error'),
                  (l.errorMsg =
                    (t3 &&
                      t3.length > 0 &&
                      ((_a2 = t3[0]) == null ? void 0 : _a2.message)) ||
                    ''),
                  Promise.reject(e3)
                )
              })
              .finally(() => {
                l.loading = false
              })
          )
        }
      },
      _ = () => {
        ;((l.loading = false), (l.errorMsg = ''), (l.state = 'init'))
      },
      v = () => {
        _()
        let t2 = c == null ? void 0 : c.model
        t2 && e.prop && !Ja(t2[e.prop]) && (t2[e.prop] = r)
      },
      w = {
        prop: e.prop || '',
        validate: h2,
        resetField: v,
        clearValidate: _,
      }
    return (
      provide(Eo, w),
      onMounted(() => {
        e.prop && (c == null ? void 0 : c.addField(w), (r = u.value))
      }),
      onUnmounted(() => {
        c == null ? void 0 : c.removeField(w)
      }),
      t({
        validateStatus: l,
        validate: h2,
        resetField: v,
        clearValidate: _,
      }),
      (t2, n) => (
        openBlock(),
        createElementBlock(
          'div',
          {
            class: normalizeClass([
              'vk-form-item',
              {
                'is-error': l.state === 'error',
                'is-success': l.state === 'success',
                'is-loading': l.loading,
                'is-required': m.value,
              },
            ]),
          },
          [
            createBaseVNode('label', ko, [
              renderSlot(t2.$slots, 'label', { label: e.label }, () => [
                createTextVNode(toDisplayString(e.label), 1),
              ]),
            ]),
            createBaseVNode('div', Ao, [
              renderSlot(t2.$slots, 'default', { validate: h2 }),
              l.state === 'error'
                ? (openBlock(),
                  createElementBlock('div', jo, toDisplayString(l.errorMsg), 1))
                : createCommentVNode('', true),
            ]),
          ],
          2,
        )
      )
    )
  },
})
;((Oo.install = e => {
  e.component(Oo.name || 'VkForm', Oo)
}),
  (Mo.install = e => {
    e.component(Mo.name || 'VkFormItem', Mo)
  }))
var No = Oo
Z.install = e => {
  e.component(Z.name || 'VkIcon', Z)
}
var Q = Z
var Po = ref(0)
var Fo = (e = 2e3) => {
  let t = ref(e),
    r = computed(() => Po.value + t.value)
  return {
    currentIndex: r,
    nextIndex: () => (Po.value++, r.value),
    initialZIndex: t,
  }
}
var Io = 1
var $ = shallowReactive([])
var { nextIndex: Lo } = Fo()
var Ro = e => {
  let t = `message_${Io++}`,
    n = document.createElement('div'),
    r = () => {
      let e2 = $.findIndex(e3 => e3.id === t)
      e2 !== -1 && ($.splice(e2, 1), render(null, n))
    },
    i = () => {
      let e2 = $.find(e3 => e3.id === t)
      e2 && (e2.vm.exposed.visible.value = false)
    },
    a = {
      ...e,
      id: t,
      zIndex: Lo(),
      onDestory: r,
    },
    o = h(Go, a)
  ;(render(o, n), document.body.appendChild(n.firstElementChild))
  let s = {
    id: t,
    vnode: o,
    vm: o.component,
    props: a,
    destory: i,
  }
  return ($.push(s), s)
}
var zo = e => {
  let t = $.findIndex(t2 => t2.id === e)
  return t <= 0 ? 0 : $[t - 1].vm.exposed.bottomOffset.value
}
var Bo = () => {
  $.forEach(e => {
    e.destory()
  })
}
function Vo(e, t, n) {
  ;(isRef(e)
    ? watch(e, (e2, r) => {
        ;(r == null ? void 0 : r.removeEventListener(t, n),
          e2 == null ? void 0 : e2.addEventListener(t, n))
      })
    : onMounted(() => {
        e == null ? void 0 : e.addEventListener(t, n)
      }),
    onUnmounted(() => {
      var _a2
      ;(_a2 = unref(e)) == null ? void 0 : _a2.removeEventListener(t, n)
    }))
}
var Ho = P(e => {
  Object.defineProperty(e, '__esModule', { value: true })
  var t = 'fas',
    n = 'xmark',
    r = 384,
    i = 512,
    a = [
      128473,
      10005,
      10006,
      10060,
      215,
      'close',
      'multiply',
      'remove',
      'times',
    ],
    o = 'f00d',
    s =
      'M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z'
  ;((e.definition = {
    prefix: t,
    iconName: n,
    icon: [r, i, a, o, s],
  }),
    (e.faXmark = e.definition),
    (e.prefix = t),
    (e.iconName = n),
    (e.width = r),
    (e.height = i),
    (e.ligatures = a),
    (e.unicode = o),
    (e.svgPathData = s),
    (e.aliases = a))
})()
var Uo = { class: 'vk-message__content' }
var Wo = {
  key: 0,
  class: 'vk-message__close',
}
var Go = defineComponent({
  __name: 'Message',
  props: {
    message: {},
    duration: { default: 3e3 },
    showClose: { type: Boolean },
    type: { default: 'info' },
    onDestory: { type: Function },
    id: {},
    zIndex: {},
    offset: { default: 30 },
    transitionName: { default: 'fade-up' },
  },
  setup(e, { expose: s }) {
    let l = ref(false),
      u = ref(),
      d = ref(0),
      f = computed(() => zo(e.id)),
      p = computed(() => e.offset + f.value),
      m = computed(() => p.value + d.value),
      h2 = computed(() => ({
        top: p.value + 'px',
        zIndex: e.zIndex,
      })),
      _
    function b() {
      e.duration !== 0 &&
        (_ = setTimeout(() => {
          l.value = false
        }, e.duration))
    }
    function S() {
      clearTimeout(_)
    }
    let C = () => {
      l.value = false
    }
    onMounted(async () => {
      ;((l.value = true), b())
    })
    function T(e2) {
      e2.code === 'Escape' && (l.value = false)
    }
    Vo(document, 'keydown', T)
    function ee() {
      e.onDestory()
    }
    function D() {
      d.value = u.value.getBoundingClientRect().height
    }
    return (
      s({
        bottomOffset: m,
        visible: l,
      }),
      (n, s2) => (
        openBlock(),
        createBlock(
          Transition,
          {
            name: e.transitionName,
            onEnter: D,
            onAfterLeave: ee,
          },
          {
            default: withCtx(() => [
              withDirectives(
                createBaseVNode(
                  'div',
                  {
                    class: normalizeClass([
                      'vk-message',
                      {
                        [`vk-message--${e.type}`]: e.type,
                        'is-close': e.showClose,
                      },
                    ]),
                    style: normalizeStyle(h2.value),
                    ref_key: 'messageRef',
                    ref: u,
                    role: 'alert',
                    onMouseenter: S,
                    onMouseleave: b,
                  },
                  [
                    createBaseVNode('div', Uo, [
                      renderSlot(n.$slots, 'default', {}, () => [
                        e.message
                          ? (openBlock(),
                            createBlock(
                              unref(vo),
                              {
                                key: 0,
                                'v-node': e.message,
                              },
                              null,
                              8,
                              ['v-node'],
                            ))
                          : createCommentVNode('', true),
                      ]),
                    ]),
                    e.showClose
                      ? (openBlock(),
                        createElementBlock('div', Wo, [
                          createVNode(
                            unref(Q),
                            {
                              onClick: withModifiers(C, ['stop']),
                              icon: unref(Ho.faXmark),
                            },
                            null,
                            8,
                            ['icon'],
                          ),
                        ]))
                      : createCommentVNode('', true),
                  ],
                  38,
                ),
                [[vShow, l.value]],
              ),
            ]),
            _: 3,
          },
          8,
          ['name'],
        )
      )
    )
  },
})
Go.install = e => {
  e.component(Go.name || 'VkMessage', Go)
}
var Ko = Go
var qo = P(e => {
  Object.defineProperty(e, '__esModule', { value: true })
  var t = 'fas',
    n = 'circle-xmark',
    r = 512,
    i = 512,
    a = [61532, 'times-circle', 'xmark-circle'],
    o = 'f057',
    s =
      'M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM167 167c9.4-9.4 24.6-9.4 33.9 0l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9z'
  ;((e.definition = {
    prefix: t,
    iconName: n,
    icon: [r, i, a, o, s],
  }),
    (e.faCircleXmark = e.definition),
    (e.prefix = t),
    (e.iconName = n),
    (e.width = r),
    (e.height = i),
    (e.ligatures = a),
    (e.unicode = o),
    (e.svgPathData = s),
    (e.aliases = a))
})
var Jo = P(e => {
  Object.defineProperty(e, '__esModule', { value: true })
  var t = 'fas',
    n = 'eye',
    r = 576,
    i = 512,
    a = [128065],
    o = 'f06e',
    s =
      'M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z'
  ;((e.definition = {
    prefix: t,
    iconName: n,
    icon: [r, i, a, o, s],
  }),
    (e.faEye = e.definition),
    (e.prefix = t),
    (e.iconName = n),
    (e.width = r),
    (e.height = i),
    (e.ligatures = a),
    (e.unicode = o),
    (e.svgPathData = s),
    (e.aliases = a))
})
var Yo = P(e => {
  Object.defineProperty(e, '__esModule', { value: true })
  var t = 'fas',
    n = 'eye-slash',
    r = 576,
    i = 512,
    a = [],
    o = 'f070',
    s =
      'M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-96.4-96.4c2.7-2.4 5.4-4.8 8-7.2 46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6-56.8 0-105.6 18.2-146 44.2L41-24.9zM204.5 138.7c23.5-16.8 52.4-26.7 83.5-26.7 79.5 0 144 64.5 144 144 0 31.1-9.9 59.9-26.7 83.5l-34.7-34.7c12.7-21.4 17-47.7 10.1-73.7-13.7-51.2-66.4-81.6-117.6-67.9-8.6 2.3-16.7 5.7-24 10l-34.7-34.7zM325.3 395.1c-11.9 3.2-24.4 4.9-37.3 4.9-79.5 0-144-64.5-144-144 0-12.9 1.7-25.4 4.9-37.3L69.4 139.2c-32.6 36.8-55 75.8-66.9 104.5-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6 37.3 0 71.2-7.9 101.5-20.6l-64.2-64.2z'
  ;((e.definition = {
    prefix: t,
    iconName: n,
    icon: [r, i, a, o, s],
  }),
    (e.faEyeSlash = e.definition),
    (e.prefix = t),
    (e.iconName = n),
    (e.width = r),
    (e.height = i),
    (e.ligatures = a),
    (e.unicode = o),
    (e.svgPathData = s),
    (e.aliases = a))
})
var Xo = qo()
var Zo = Jo()
var Qo = Yo()
var $o = {
  key: 0,
  class: 'vk-input__prepend',
}
var es = { class: 'vk-input__wrapper' }
var ts = {
  key: 0,
  class: 'vk-input__prefix',
}
var ns = [
  'disabled',
  'readonly',
  'autocomplete',
  'placeholder',
  'autoFocus',
  'form',
  'type',
]
var rs = {
  key: 1,
  class: 'vk-input__append',
}
var is = [
  'disabled',
  'readonly',
  'autocomplete',
  'placeholder',
  'autoFocus',
  'form',
]
var as = defineComponent({
  name: 'VkInput',
  inheritAttrs: false,
  __name: 'Input',
  props: {
    type: { default: 'text' },
    modelValue: {},
    size: {},
    placeholder: {},
    disabled: { type: Boolean },
    clearable: { type: Boolean },
    showPassword: { type: Boolean },
    readonly: { type: Boolean },
    autoFocus: { type: Boolean },
    form: {},
    autocomplete: { default: 'false' },
  },
  emits: ['update:modelValue', 'input', 'change', 'focus', 'blur', 'clear'],
  setup(t, { expose: s, emit: c }) {
    let l = c,
      u = ref(t.modelValue),
      d = ref(false),
      f = ref(false),
      p = useAttrs(),
      _ = ref(),
      v = computed(() => t.clearable && !t.disabled && !!u.value && d.value),
      y = computed(() => t.showPassword && !t.disabled && !!u.value),
      b = () => {
        f.value = !f.value
      },
      S = async () => {
        var _a2
        ;(await nextTick(), (_a2 = _.value) == null ? void 0 : _a2.focus())
      },
      C = () => {
        ;(l('update:modelValue', u.value), l('input', u.value))
      },
      T = () => {
        l('change', u.value)
      },
      ee = e => {
        ;((d.value = true), l('focus', e))
      },
      D = e => {
        ;((d.value = false), l('blur', e))
      },
      O = () => {
        ;((u.value = ''),
          l('update:modelValue', ''),
          l('input', ''),
          l('change', ''),
          l('clear'))
      },
      k = () => {}
    return (
      watch(
        () => t.modelValue,
        e => {
          u.value = e
        },
      ),
      s({ ref: _ }),
      (n, s2) => (
        openBlock(),
        createElementBlock(
          'div',
          {
            class: normalizeClass([
              'vk-input',
              {
                [`vk-input--${t.type}`]: t.type,
                [`vk-input--${t.size}`]: t.size,
                'is-disabled': t.disabled,
                'is-prepend': n.$slots.prepend,
                'is-append': n.$slots.append,
                'is-suffix': n.$slots.suffix,
                'is-prefix': n.$slots.prefix,
                'is-focus': d.value,
              },
            ]),
          },
          [
            t.type === 'textarea'
              ? withDirectives(
                  (openBlock(),
                  createElementBlock(
                    'textarea',
                    mergeProps(
                      {
                        key: 1,
                        class: 'vk-textarea__wrapper',
                      },
                      unref(p),
                      {
                        ref_key: 'inputRef',
                        ref: _,
                        disabled: t.disabled,
                        readonly: t.readonly,
                        autocomplete: t.autocomplete,
                        placeholder: t.placeholder,
                        autoFocus: t.autoFocus,
                        form: t.form,
                        'onUpdate:modelValue':
                          s2[1] || (s2[1] = e => (u.value = e)),
                        onInput: C,
                        onChange: T,
                        onFocus: ee,
                        onBlur: D,
                      },
                    ),
                    null,
                    16,
                    is,
                  )),
                  [[vModelText, u.value]],
                )
              : (openBlock(),
                createElementBlock(
                  Fragment,
                  { key: 0 },
                  [
                    n.$slots.prepend
                      ? (openBlock(),
                        createElementBlock('div', $o, [
                          renderSlot(n.$slots, 'prepend'),
                        ]))
                      : createCommentVNode('', true),
                    createBaseVNode('div', es, [
                      n.$slots.prefix
                        ? (openBlock(),
                          createElementBlock('div', ts, [
                            renderSlot(n.$slots, 'prefix'),
                          ]))
                        : createCommentVNode('', true),
                      withDirectives(
                        createBaseVNode(
                          'input',
                          mergeProps(
                            {
                              'onUpdate:modelValue':
                                s2[0] || (s2[0] = e => (u.value = e)),
                            },
                            unref(p),
                            {
                              ref_key: 'inputRef',
                              ref: _,
                              class: 'vk-input__inner',
                              disabled: t.disabled,
                              readonly: t.readonly,
                              autocomplete: t.autocomplete,
                              placeholder: t.placeholder,
                              autoFocus: t.autoFocus,
                              form: t.form,
                              onInput: C,
                              onChange: T,
                              onFocus: ee,
                              onBlur: D,
                              type: t.showPassword
                                ? f.value
                                  ? 'text'
                                  : 'password'
                                : t.type,
                            },
                          ),
                          null,
                          16,
                          ns,
                        ),
                        [[vModelDynamic, u.value]],
                      ),
                      n.$slots.suffix || v.value || t.showPassword
                        ? (openBlock(),
                          createElementBlock(
                            'div',
                            {
                              key: 1,
                              class: 'vk-input__suffix',
                              onClick: S,
                            },
                            [
                              renderSlot(n.$slots, 'suffix'),
                              v.value
                                ? (openBlock(),
                                  createBlock(
                                    unref(Q),
                                    {
                                      key: 0,
                                      icon: unref(Xo.faCircleXmark),
                                      class: 'vk-input__clear',
                                      onClick: O,
                                      onMousedown: withModifiers(k, [
                                        'prevent',
                                      ]),
                                    },
                                    null,
                                    8,
                                    ['icon'],
                                  ))
                                : createCommentVNode('', true),
                              y.value && f.value
                                ? (openBlock(),
                                  createBlock(
                                    unref(Q),
                                    {
                                      key: 1,
                                      icon: unref(Zo.faEye),
                                      class: 'vk-input__password',
                                      onClick: b,
                                    },
                                    null,
                                    8,
                                    ['icon'],
                                  ))
                                : createCommentVNode('', true),
                              y.value && !f.value
                                ? (openBlock(),
                                  createBlock(
                                    unref(Q),
                                    {
                                      key: 2,
                                      icon: unref(Qo.faEyeSlash),
                                      class: 'vk-input__password',
                                      onClick: b,
                                    },
                                    null,
                                    8,
                                    ['icon'],
                                  ))
                                : createCommentVNode('', true),
                            ],
                          ))
                        : createCommentVNode('', true),
                    ]),
                    n.$slots.append
                      ? (openBlock(),
                        createElementBlock('div', rs, [
                          renderSlot(n.$slots, 'append'),
                        ]))
                      : createCommentVNode('', true),
                  ],
                  64,
                )),
          ],
          2,
        )
      )
    )
  },
})
as.install = e => {
  e.component(as.name || 'VkInput', as)
}
var os = as
var ss = P(e => {
  Object.defineProperty(e, '__esModule', { value: true })
  var t = 'fas',
    n = 'angle-down',
    r = 384,
    i = 512,
    a = [8964],
    o = 'f107',
    s =
      'M169.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 306.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z'
  ;((e.definition = {
    prefix: t,
    iconName: n,
    icon: [r, i, a, o, s],
  }),
    (e.faAngleDown = e.definition),
    (e.prefix = t),
    (e.iconName = n),
    (e.width = r),
    (e.height = i),
    (e.ligatures = a),
    (e.unicode = o),
    (e.svgPathData = s),
    (e.aliases = a))
})()
var cs = {
  key: 0,
  class: 'vk-select__loading',
}
var ls = {
  key: 1,
  class: 'vk-select__noData',
}
var us = {
  key: 2,
  class: 'vk-select__menu',
}
var ds = ['id', 'onClick']
var fs = defineComponent({
  name: 'VkSelect',
  __name: 'Select',
  props: {
    modelValue: {},
    options: { default: () => [] },
    placeholder: { default: '' },
    disabled: { type: Boolean },
    clearable: {
      type: Boolean,
      default: false,
    },
    renderLabel: { type: Function },
    filterable: { type: Boolean },
    filterMethod: { type: Function },
    remote: { type: Boolean },
    remoteMethod: { type: Function },
  },
  emits: ['change', 'update:modelValue', 'visible-change', 'clear'],
  setup(t, { emit: i }) {
    let o = i,
      s = ref(),
      l = ref(),
      u = computed(() => (t.remote ? 300 : 0)),
      d = e => t.options.find(t2 => t2.value === e) || null,
      f = d(t.modelValue)
    watch(
      () => t.modelValue,
      e => {
        f = d(e)
      },
    )
    let p = ref(false),
      m = reactive({
        inputValue: f ? f.label : '',
        selectedOption: f,
        mouseHover: false,
        loading: false,
        highlightIndex: -1,
      }),
      h2 = {
        middleware: [
          size2({
            apply({ rects: e, elements: t2 }) {
              Object.assign(t2.floating.style, {
                width: `${e.reference.width}px`,
              })
            },
          }),
        ],
      },
      _ = computed(
        () =>
          t.clearable &&
          m.mouseHover &&
          m.selectedOption &&
          m.inputValue.trim() !== '' &&
          !t.disabled,
      ),
      v = () => {
        ;((m.selectedOption = null),
          (m.inputValue = ''),
          o('clear'),
          o('change', ''),
          o('update:modelValue', ''))
      },
      y = () => {},
      b = ref(t.options)
    watch(
      () => t.options,
      e => {
        b.value = e
      },
    )
    let S = async e => {
        if (t.filterable) {
          if (t.filterMethod && Xe(t.filterMethod)) b.value = t.filterMethod(e)
          else if (t.remote && t.remoteMethod && Xe(t.remoteMethod)) {
            m.loading = true
            try {
              b.value = await t.remoteMethod(e)
            } catch (e2) {
              ;(console.error(e2), (b.value = []))
            } finally {
              m.loading = false
            }
          } else b.value = t.options.filter(t2 => t2.label.includes(e))
          m.highlightIndex = -1
        }
      },
      T = () => {
        S(m.inputValue)
      },
      E = Ga(() => {
        T()
      }, u.value),
      D = computed(() =>
        t.filterable && m.selectedOption && p.value
          ? m.selectedOption.label
          : t.placeholder,
      ),
      O = e => {
        ;(e
          ? (t.filterable && m.selectedOption && (m.inputValue = ''),
            t.filterable && S(m.inputValue),
            s.value.show())
          : (s.value.hide(),
            t.filterable &&
              (m.inputValue = m.selectedOption ? m.selectedOption.label : ''),
            (m.highlightIndex = -1)),
          (p.value = e),
          o('visible-change', e))
      },
      k = () => {
        t.disabled || (p.value ? O(false) : O(true))
      },
      te = e => {
        switch (e.key) {
          case 'Enter':
            p.value
              ? m.highlightIndex > -1 && b.value[m.highlightIndex]
                ? ne(b.value[m.highlightIndex])
                : O(false)
              : k()
            break
          case 'Escape':
            p.value && O(false)
            break
          case 'ArrowUp':
            ;(e.preventDefault(),
              b.value.length > 0 &&
                (m.highlightIndex === -1 || m.highlightIndex === 0
                  ? (m.highlightIndex = b.value.length - 1)
                  : m.highlightIndex--))
            break
          case 'ArrowDown':
            ;(e.preventDefault(),
              b.value.length > 0 &&
                (m.highlightIndex === -1 ||
                m.highlightIndex === b.value.length - 1
                  ? (m.highlightIndex = 0)
                  : m.highlightIndex++))
            break
          default:
            break
        }
      },
      ne = e => {
        e.disabled ||
          ((m.inputValue = e.label),
          (m.selectedOption = e),
          o('change', e.value),
          o('update:modelValue', e.value),
          O(false),
          l.value.ref.focus())
      }
    return (n, i2) => (
      openBlock(),
      createElementBlock(
        'div',
        {
          class: normalizeClass(['vk-select', { 'is-disabled': t.disabled }]),
          onClick: k,
          onMouseenter: i2[2] || (i2[2] = e => (m.mouseHover = true)),
          onMouseleave: i2[3] || (i2[3] = e => (m.mouseHover = false)),
        },
        [
          createVNode(
            _o,
            {
              placement: 'bottom-start',
              manual: '',
              ref_key: 'tooltipRef',
              ref: s,
              'popper-options': h2,
              onClickOutside: i2[1] || (i2[1] = e => O(false)),
            },
            {
              content: withCtx(() => [
                m.loading
                  ? (openBlock(),
                    createElementBlock('div', cs, [
                      createVNode(
                        unref(Q),
                        {
                          icon: unref(no.faSpinner),
                          spin: '',
                        },
                        null,
                        8,
                        ['icon'],
                      ),
                    ]))
                  : t.filterable && b.value.length === 0
                    ? (openBlock(),
                      createElementBlock('div', ls, ' no matching data '))
                    : (openBlock(),
                      createElementBlock('ul', us, [
                        (openBlock(true),
                        createElementBlock(
                          Fragment,
                          null,
                          renderList(b.value, (e, n2) => {
                            var _a2
                            return (
                              openBlock(),
                              createElementBlock(
                                'li',
                                {
                                  key: n2,
                                  class: normalizeClass([
                                    'vk-select__menu-item',
                                    {
                                      'is-disabled': e.disabled,
                                      'is-selected':
                                        ((_a2 = m.selectedOption) == null
                                          ? void 0
                                          : _a2.value) === e.value,
                                      'is-highlightIndex':
                                        m.highlightIndex === n2,
                                    },
                                  ]),
                                  id: `select-item-${e.value}`,
                                  onClick: withModifiers(t2 => ne(e), ['stop']),
                                },
                                [
                                  createVNode(
                                    unref(vo),
                                    {
                                      'v-node': t.renderLabel
                                        ? t.renderLabel(e)
                                        : e.label,
                                    },
                                    null,
                                    8,
                                    ['v-node'],
                                  ),
                                ],
                                10,
                                ds,
                              )
                            )
                          }),
                          128,
                        )),
                      ])),
              ]),
              default: withCtx(() => [
                createVNode(
                  as,
                  {
                    type: 'select',
                    modelValue: m.inputValue,
                    'onUpdate:modelValue':
                      i2[0] || (i2[0] = e => (m.inputValue = e)),
                    disabled: t.disabled,
                    placeholder: D.value,
                    ref_key: 'inputRef',
                    ref: l,
                    readonly: !t.filterable || !p.value,
                    onInput: unref(E),
                    onKeydown: te,
                  },
                  {
                    suffix: withCtx(() => [
                      _.value
                        ? (openBlock(),
                          createBlock(
                            unref(Q),
                            {
                              key: 0,
                              onClick: withModifiers(v, ['stop']),
                              onMousedown: withModifiers(y, ['prevent']),
                              icon: unref(Xo.faCircleXmark),
                              class: 'vk-input__clear',
                            },
                            null,
                            8,
                            ['icon'],
                          ))
                        : (openBlock(),
                          createBlock(
                            unref(Q),
                            {
                              key: 1,
                              icon: unref(ss.faAngleDown),
                              class: normalizeClass([
                                'header-angle',
                                { 'is-active': p.value },
                              ]),
                            },
                            null,
                            8,
                            ['icon', 'class'],
                          )),
                    ]),
                    _: 1,
                  },
                  8,
                  [
                    'modelValue',
                    'disabled',
                    'placeholder',
                    'readonly',
                    'onInput',
                  ],
                ),
              ]),
              _: 1,
            },
            512,
          ),
        ],
        34,
      )
    )
  },
})
fs.install = e => {
  e.component(fs.name || 'VkSelect', fs)
}
var ps = fs
var ms = ['name', 'disabled']
var hs = { class: 'vk-switch__core' }
var gs = { class: 'vk-switch__core-inner' }
var _s = {
  key: 0,
  class: 'vk-switch__core-inner-text',
}
var vs = defineComponent({
  name: 'VkSwitch',
  __name: 'Switch',
  props: {
    modelValue: { type: [Boolean, String, Number] },
    disabled: { type: Boolean },
    activeText: {},
    inactiveText: {},
    activeValue: {
      type: [Boolean, String, Number],
      default: true,
    },
    inactiveValue: {
      type: [Boolean, String, Number],
      default: false,
    },
    name: {},
    id: {},
    size: {},
  },
  emits: ['change', 'update:modelValue'],
  setup(e, { emit: t }) {
    let r = t,
      s = ref(e.modelValue),
      c = computed(() => s.value === e.activeValue),
      l = ref(),
      u = () => {
        if (e.disabled) return
        let t2 = c.value ? e.inactiveValue : e.activeValue
        ;((s.value = t2), r('change', t2), r('update:modelValue', t2))
      }
    return (
      onMounted(() => {
        l.value.checked = c.value
      }),
      watch(c, e2 => {
        l.value.checked = e2
      }),
      watch(
        () => e.modelValue,
        e2 => {
          s.value = e2
        },
      ),
      (t2, n) => (
        openBlock(),
        createElementBlock(
          'div',
          {
            onClick: u,
            class: normalizeClass([
              'vk-switch',
              {
                [`vk-switch--${e.size}`]: e.size,
                'is-disabled': e.disabled,
                'is-checked': c.value,
              },
            ]),
          },
          [
            createBaseVNode(
              'input',
              {
                class: 'vk-switch__input',
                type: 'checkbox',
                role: 'switch',
                ref_key: 'input',
                ref: l,
                name: e.name,
                disabled: e.disabled,
                onKeydown: withKeys(u, ['enter']),
              },
              null,
              40,
              ms,
            ),
            createBaseVNode('div', hs, [
              createBaseVNode('div', gs, [
                e.activeText || e.inactiveText
                  ? (openBlock(),
                    createElementBlock(
                      'span',
                      _s,
                      toDisplayString(c.value ? e.activeText : e.inactiveText),
                      1,
                    ))
                  : createCommentVNode('', true),
              ]),
              n[0] ||
                (n[0] = createBaseVNode(
                  'div',
                  { class: 'vk-switch__core-action' },
                  null,
                  -1,
                )),
            ]),
          ],
          2,
        )
      )
    )
  },
})
vs.install = e => {
  e.component(vs.name || 'VkSwitch', vs)
}
var ys = vs
_o.install = e => {
  e.component(_o.name || 'VkTooltip', _o)
}
var bs = _o
var xs = { class: 'vk-progress-bar' }
var Ss = {
  key: 0,
  class: 'vk-inner-text',
}
var Cs = defineComponent({
  name: 'VkProgress',
  __name: 'Progress',
  props: {
    percent: {},
    strokeHeight: { default: 15 },
    showText: {
      type: Boolean,
      default: false,
    },
    type: { default: 'info' },
  },
  setup(e) {
    return (t, n) => (
      openBlock(),
      createElementBlock('div', xs, [
        createBaseVNode(
          'div',
          {
            class: 'vk-progress-bar-outer',
            style: normalizeStyle({ height: e.strokeHeight + 'px' }),
          },
          [
            createBaseVNode(
              'div',
              {
                class: normalizeClass([
                  'vk-progress-bar-inner',
                  { [`vk-color-${e.type}`]: e.type },
                ]),
                style: normalizeStyle({ width: e.percent + '%' }),
              },
              [
                e.showText
                  ? (openBlock(),
                    createElementBlock(
                      'span',
                      Ss,
                      toDisplayString(e.percent) + '%',
                      1,
                    ))
                  : createCommentVNode('', true),
              ],
              6,
            ),
          ],
          4,
        ),
      ])
    )
  },
})
Cs.install = e => {
  e.component(Cs.name || 'VkProgress', Cs)
}
var ws = Cs
var Ts = [ao, ho, mo, wo, No, Mo, Q, Ko, os, ps, ys, bs, ws]
var Es = e => {
  Ts.forEach(t => {
    e.component(t.name, t)
  })
}
var Ds = { install: Es }
export {
  ao as Button,
  ho as Collapse,
  mo as CollapseItem,
  wo as Dropdown,
  No as Form,
  Mo as FormItem,
  Q as Icon,
  os as Input,
  Ko as Message,
  ws as Progress,
  ps as Select,
  ys as Switch,
  bs as Tooltip,
  Bo as closeAll,
  oo as collapseContextKey,
  Ro as createMessage,
  Ds as default,
  To as formContextKey,
  Eo as formItemContextKey,
  Es as install,
}
//# sourceMappingURL=xb-element.js.map
