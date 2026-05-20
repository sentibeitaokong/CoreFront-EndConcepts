// node_modules/@fancyapps/ui/dist/utils/isString.js
var t = t9 => 'string' == typeof t9

// node_modules/@fancyapps/ui/dist/utils/isNode.js
var n = n11 =>
  n11 && null !== n11 && n11 instanceof Element && 'nodeType' in n11

// node_modules/@fancyapps/ui/dist/utils/getScrollableParent.js
var e = function (e10) {
  if (!(e10 && e10 instanceof Element && e10.offsetParent)) return false
  let n11 = false,
    i8 = false
  if (e10.scrollWidth > e10.clientWidth) {
    const i9 = window.getComputedStyle(e10).overflowX,
      t9 = -1 !== i9.indexOf('hidden'),
      o9 = -1 !== i9.indexOf('clip'),
      d3 = -1 !== i9.indexOf('visible')
    n11 = !t9 && !o9 && !d3
  }
  if (e10.scrollHeight > e10.clientHeight) {
    const n12 = window.getComputedStyle(e10).overflowY,
      t9 = -1 !== n12.indexOf('hidden'),
      o9 = -1 !== n12.indexOf('clip'),
      d3 = -1 !== n12.indexOf('visible')
    i8 = !t9 && !o9 && !d3
  }
  return n11 || i8
}
var n2 = function (i8, t9 = void 0) {
  return !i8 || i8 === document.body || (t9 && i8 === t9)
    ? null
    : e(i8)
      ? i8
      : n2(i8.parentElement, t9)
}

// node_modules/@fancyapps/ui/dist/utils/strToHtml.js
var e2 = function (e10) {
  var t9 = new DOMParser().parseFromString(e10, 'text/html').body
  if (t9.childElementCount > 1) {
    for (var n11 = document.createElement('div'); t9.firstChild; )
      n11.appendChild(t9.firstChild)
    return n11
  }
  let r7 = t9.firstChild
  return !r7 || r7 instanceof HTMLElement
    ? r7
    : ((n11 = document.createElement('div')).appendChild(r7), n11)
}

// node_modules/@fancyapps/ui/dist/utils/clamp.js
var t2 = function (t9 = 0, n11 = 0, a7 = 0) {
  return Math.max(Math.min(n11, a7), t9)
}

// node_modules/@fancyapps/ui/dist/utils/isPlainObject.js
var t3 = t9 =>
  'object' == typeof t9 &&
  null !== t9 &&
  t9.constructor === Object &&
  '[object Object]' === Object.prototype.toString.call(t9)

// node_modules/@fancyapps/ui/dist/utils/isEqual.js
function e3(e10) {
  return t3(e10) || Array.isArray(e10)
}
function n3(t9, r7) {
  const o9 = Object.keys(t9),
    c6 = Object.keys(r7)
  return (
    o9.length === c6.length &&
    o9.every(o10 => {
      const c7 = t9[o10],
        i8 = r7[o10]
      return 'function' == typeof c7
        ? `${c7}` == `${i8}`
        : e3(c7) && e3(i8)
          ? n3(c7, i8)
          : c7 === i8
    })
  )
}

// node_modules/@fancyapps/ui/dist/libs/tween.js
var e4 = function (n11) {
  for (const t9 of s) t9.getState() === i.Running && t9.tick(a ? n11 - a : 0)
  ;((a = n11), (u = window.requestAnimationFrame(e4)))
}
var i
var o
var r
;(!(function (n11) {
  ;((n11[(n11.Initializing = 0)] = 'Initializing'),
    (n11[(n11.Running = 1)] = 'Running'),
    (n11[(n11.Paused = 2)] = 'Paused'),
    (n11[(n11.Completed = 3)] = 'Completed'),
    (n11[(n11.Destroyed = 4)] = 'Destroyed'))
})(i || (i = {})),
  (function (n11) {
    ;((n11[(n11.Spring = 0)] = 'Spring'), (n11[(n11.Ease = 1)] = 'Ease'))
  })(o || (o = {})),
  (function (n11) {
    ;((n11[(n11.Loop = 0)] = 'Loop'), (n11[(n11.Reverse = 1)] = 'Reverse'))
  })(r || (r = {})))
var s = /* @__PURE__ */ new Set()
var u = null
var a = 0
function c() {
  let a7 = i.Initializing,
    f3 = o.Ease,
    l8 = 0,
    g2 = 0,
    p2 = c.Easings.Linear,
    m4 = 500,
    d3 = 0,
    b3 = 0,
    S2 = 0,
    h4 = 0,
    y3 = 1 / 0,
    E3 = 0.01,
    R2 = 0.01,
    M4 = false,
    j2 = {},
    w3 = null,
    v4 = {},
    O2 = {},
    C = {},
    L = 0,
    I2 = 0,
    D2 = r.Loop,
    z2 = c.Easings.Linear
  const N2 = /* @__PURE__ */ new Map()
  function V(n11, ...t9) {
    for (const e10 of N2.get(n11) || []) e10(...t9)
  }
  function q2(n11) {
    return (
      (g2 = 0),
      n11
        ? (w3 = setTimeout(() => {
            x3()
          }, n11))
        : x3(),
      F2
    )
  }
  function x3() {
    ;((a7 = i.Running), V('start', v4, O2))
  }
  function A() {
    if (((a7 = i.Completed), (C = {}), V('end', v4), a7 === i.Completed))
      if (l8 < L) {
        if ((l8++, D2 === r.Reverse)) {
          const n11 = Object.assign({}, j2)
          ;((j2 = Object.assign({}, O2)), (O2 = n11))
        }
        q2(I2)
      } else l8 = 0
    return F2
  }
  const F2 = {
    getState: function () {
      return a7
    },
    easing: function (n11) {
      return ((p2 = n11), (f3 = o.Ease), (C = {}), F2)
    },
    duration: function (n11) {
      return ((m4 = n11), F2)
    },
    spring: function (n11 = {}) {
      f3 = o.Spring
      const t9 = {
          velocity: 0,
          mass: 1,
          tension: 170,
          friction: 26,
          restDelta: 0.1,
          restSpeed: 0.1,
          maxSpeed: 1 / 0,
          clamp: true,
        },
        {
          velocity: e10,
          mass: i8,
          tension: r7,
          friction: s11,
          restDelta: u6,
          restSpeed: a8,
          maxSpeed: c6,
          clamp: l9,
        } = Object.assign(Object.assign({}, t9), n11)
      return (
        (d3 = e10),
        (b3 = i8),
        (S2 = r7),
        (h4 = s11),
        (R2 = u6),
        (E3 = a8),
        (y3 = c6),
        (M4 = l9),
        (C = {}),
        F2
      )
    },
    isRunning: function () {
      return a7 === i.Running
    },
    isSpring: function () {
      return f3 === o.Spring
    },
    from: function (n11) {
      return ((v4 = Object.assign({}, n11)), F2)
    },
    to: function (n11) {
      return ((O2 = n11), F2)
    },
    repeat: function (n11, t9 = 0, e10 = r.Loop, i8) {
      return ((L = n11), (I2 = t9), (D2 = e10), (z2 = i8 || p2), F2)
    },
    on: function (n11, t9) {
      var e10, i8
      return (
        (e10 = n11),
        (i8 = t9),
        N2.set(e10, [...(N2.get(e10) || []), i8]),
        F2
      )
    },
    off: function (n11, t9) {
      var e10, i8
      return (
        (e10 = n11),
        (i8 = t9),
        N2.has(e10) &&
          N2.set(
            e10,
            N2.get(e10).filter(n12 => n12 !== i8),
          ),
        F2
      )
    },
    start: function (n11) {
      return (
        n3(v4, O2) ||
          ((a7 = i.Initializing),
          (j2 = Object.assign({}, v4)),
          s.add(this),
          u || (u = window.requestAnimationFrame(e4)),
          q2(n11)),
        F2
      )
    },
    pause: function () {
      return (
        w3 && (clearTimeout(w3), (w3 = null)),
        a7 === i.Running && ((a7 = i.Paused), V('pause', v4)),
        F2
      )
    },
    end: A,
    tick: function (e10) {
      ;(e10 > 50 && (e10 = 50), (g2 += e10))
      let s11 = 0,
        u6 = false
      if (a7 !== i.Running) return F2
      if (f3 === o.Ease) {
        ;((s11 = t2(0, g2 / m4, 1)), (u6 = 1 === s11))
        const t9 = D2 === r.Reverse ? z2 : p2
        for (const n11 in v4) v4[n11] = j2[n11] + (O2[n11] - j2[n11]) * t9(s11)
      }
      if (f3 === o.Spring) {
        const t9 = 1e-3 * e10
        let i8 = 0
        for (const e11 in v4) {
          const o9 = O2[e11]
          let r7 = v4[e11]
          if (
            'number' != typeof o9 ||
            isNaN(o9) ||
            'number' != typeof r7 ||
            isNaN(r7)
          )
            continue
          if (Math.abs(o9 - r7) <= R2) {
            ;((v4[e11] = o9), (C[e11] = 0))
            continue
          }
          C[e11] ||
            ('object' == typeof d3 && 'number' == typeof d3[e11]
              ? (C[e11] = d3[e11])
              : (C[e11] = 'number' == typeof d3 ? d3 : 0))
          let s12 = C[e11]
          s12 = t2(-1 * Math.abs(y3), s12, Math.abs(y3))
          const u7 = s12 * b3 * h4
          ;((s12 +=
            (((r7 > o9 ? -1 : 1) * (Math.abs(o9 - r7) * S2) - u7) / b3) * t9),
            (r7 += s12 * t9))
          const a8 = v4[e11] > o9 ? r7 < o9 : r7 > o9
          let c7 = Math.abs(s12) < E3 && Math.abs(o9 - r7) <= R2
          ;(M4 && a8 && (c7 = true),
            c7 ? ((r7 = o9), (s12 = 0)) : i8++,
            (v4[e11] = r7),
            (C[e11] = s12))
        }
        u6 = !i8
      }
      const c6 = Object.assign({}, O2)
      return (
        V('step', v4, j2, O2, s11),
        u6 && a7 === i.Running && n3(O2, c6) && ((a7 = i.Completed), A()),
        F2
      )
    },
    getStartValues: function () {
      return j2
    },
    getCurrentValues: function () {
      return v4
    },
    getCurrentVelocities: function () {
      return C
    },
    getEndValues: function () {
      return O2
    },
    destroy: function () {
      ;((a7 = i.Destroyed),
        w3 && (clearTimeout(w3), (w3 = null)),
        (j2 = v4 = O2 = {}),
        s.delete(this))
    },
  }
  return F2
}
;((c.destroy = () => {
  for (const n11 of s) n11.destroy()
  u && (cancelAnimationFrame(u), (u = null))
}),
  (c.Easings = {
    Linear: function (n11) {
      return n11
    },
    EaseIn: function (n11) {
      return 0 === n11 ? 0 : Math.pow(2, 10 * n11 - 10)
    },
    EaseOut: function (n11) {
      return 1 === n11 ? 1 : 1 - Math.pow(2, -10 * n11)
    },
    EaseInOut: function (n11) {
      return 0 === n11
        ? 0
        : 1 === n11
          ? 1
          : n11 < 0.5
            ? Math.pow(2, 20 * n11 - 10) / 2
            : (2 - Math.pow(2, -20 * n11 + 10)) / 2
    },
  }))

// node_modules/@fancyapps/ui/dist/libs/gestures.js
function e5(e10) {
  return 'undefined' != typeof TouchEvent && e10 instanceof TouchEvent
}
function t4(t9, n11) {
  const o9 = [],
    s11 = e5(t9)
      ? t9[n11]
      : t9 instanceof MouseEvent &&
          ('changedTouches' === n11 || 'mouseup' !== t9.type)
        ? [t9]
        : []
  for (const e10 of s11)
    o9.push({ x: e10.clientX, y: e10.clientY, ts: Date.now() })
  return o9
}
function n4(e10) {
  return t4(e10, 'touches')
}
function o2(e10) {
  return t4(e10, 'targetTouches')
}
function s2(e10) {
  return t4(e10, 'changedTouches')
}
function i2(e10) {
  const t9 = e10[0],
    n11 = e10[1] || t9
  return { x: (t9.x + n11.x) / 2, y: (t9.y + n11.y) / 2, ts: n11.ts }
}
function r2(e10) {
  const t9 = e10[0],
    n11 = e10[1] || e10[0]
  return t9 && n11
    ? -1 *
        Math.sqrt(
          (n11.x - t9.x) * (n11.x - t9.x) + (n11.y - t9.y) * (n11.y - t9.y),
        )
    : 0
}
var c2 = e10 => {
  e10.cancelable && e10.preventDefault()
}
var a2 = { passive: false }
var u2 = {
  panThreshold: 5,
  swipeThreshold: 3,
  ignore: [
    'textarea',
    'input',
    'select',
    '[contenteditable]',
    '[data-selectable]',
    '[data-draggable]',
  ],
}
var d = false
var l = true
var f = (e10, t9) => {
  let f3,
    h4,
    v4,
    g2,
    p2,
    m4 = Object.assign(Object.assign({}, u2), t9),
    E3 = [],
    w3 = [],
    y3 = [],
    T = false,
    b3 = false,
    M4 = false,
    L = false,
    x3 = 0,
    P = 0,
    D2 = 0,
    X = 0,
    Y = 0,
    j2 = 0,
    k2 = 0,
    R2 = 0,
    z2 = 0,
    A = []
  const O2 = /* @__PURE__ */ new Map()
  function S2(e11) {
    const t10 = r2(w3),
      n11 = r2(y3),
      o9 = t10 && n11 ? t10 / n11 : 0,
      s11 = Math.abs(k2) > Math.abs(R2) ? k2 : R2,
      i8 = {
        srcEvent: f3,
        isPanRecognized: T,
        isSwipeRecognized: b3,
        firstTouch: E3,
        previousTouch: y3,
        currentTouch: w3,
        deltaX: D2,
        deltaY: X,
        offsetX: Y,
        offsetY: j2,
        velocityX: k2,
        velocityY: R2,
        velocity: s11,
        angle: z2,
        axis: v4,
        scale: o9,
        center: h4,
      }
    for (const t11 of O2.get(e11) || []) t11(i8)
  }
  function q2(e11) {
    const t10 = e11.target,
      n11 = e11.composedPath()[0],
      o9 = m4.ignore.join(','),
      s11 = e12 =>
        e12 &&
        e12 instanceof HTMLElement &&
        (e12.matches(o9) || e12.closest(o9))
    if (s11(t10) || s11(n11)) return false
  }
  function C(e11) {
    const t10 = Date.now()
    if (
      ((A = A.filter(e12 => !e12.ts || e12.ts > t10 - 100)),
      e11 && A.push(e11),
      (k2 = 0),
      (R2 = 0),
      A.length > 3)
    ) {
      const e12 = A[0],
        t11 = A[A.length - 1]
      if (e12 && t11) {
        const n11 = t11.x - e12.x,
          o9 = t11.y - e12.y,
          s11 = e12.ts && t11.ts ? t11.ts - e12.ts : 0
        s11 > 0 &&
          ((k2 = Math.abs(n11) > 3 ? n11 / (s11 / 30) : 0),
          (R2 = Math.abs(o9) > 3 ? o9 / (s11 / 30) : 0))
      }
    }
  }
  function H2(e11) {
    if (false === q2(e11)) return
    if ('undefined' != typeof MouseEvent && e11 instanceof MouseEvent) {
      if (d) return
    } else d = true
    if ('undefined' != typeof MouseEvent && e11 instanceof MouseEvent) {
      if (!e11.buttons || 0 !== e11.button) return
      c2(e11)
    }
    ;(e11 instanceof MouseEvent &&
      (window.addEventListener('mousemove', I2),
      window.addEventListener('mouseup', B2)),
      window.addEventListener('blur', F2),
      (f3 = e11),
      (w3 = o2(e11)),
      (E3 = [...w3]),
      (y3 = []),
      (P = w3.length),
      (h4 = i2(w3)),
      1 === P && ((T = false), (b3 = false), (M4 = false)),
      P && C(i2(w3)))
    const t10 = Date.now(),
      n11 = t10 - (x3 || t10)
    ;((L = n11 > 0 && n11 <= 250 && 1 === P),
      (x3 = t10),
      clearTimeout(g2),
      S2('start'))
  }
  function I2(e11) {
    var t10
    if (!E3.length) return
    if (e11.defaultPrevented) return
    if (false === q2(e11)) return
    ;((f3 = e11), (y3 = [...w3]), (w3 = n4(e11)))
    const o9 = i2(y3),
      s11 = i2(n4(e11))
    if (
      (C(s11),
      (P = w3.length),
      (h4 = s11),
      y3.length === w3.length
        ? ((D2 = s11.x - o9.x), (X = s11.y - o9.y))
        : ((D2 = 0), (X = 0)),
      E3.length)
    ) {
      const e12 = i2(E3)
      ;((Y = s11.x - e12.x), (j2 = s11.y - e12.y))
    }
    if (w3.length > 1) {
      const e12 = r2(w3),
        t11 = r2(y3)
      Math.abs(e12 - t11) >= 0.1 && ((M4 = true), S2('pinch'))
    }
    ;(T ||
      ((T = Math.abs(Y) >= m4.panThreshold || Math.abs(j2) >= m4.panThreshold),
      T &&
        ((l = false),
        clearTimeout(p2),
        (p2 = void 0),
        (z2 = Math.abs((180 * Math.atan2(j2, Y)) / Math.PI)),
        (v4 = z2 > 45 && z2 < 135 ? 'y' : 'x'),
        (E3 = [...w3]),
        (y3 = [...w3]),
        (Y = 0),
        (j2 = 0),
        (D2 = 0),
        (X = 0),
        null === (t10 = window.getSelection()) ||
          void 0 === t10 ||
          t10.removeAllRanges(),
        S2('panstart'))),
      T && (D2 || X) && S2('pan'),
      S2('move'))
  }
  function B2(e11) {
    if (((f3 = e11), !E3.length)) return
    const t10 = o2(e11),
      n11 = s2(e11)
    if (
      ((P = t10.length),
      (h4 = i2(n11)),
      n11.length && C(i2(n11)),
      (y3 = [...w3]),
      (w3 = [...t10]),
      (E3 = [...t10]),
      P > 0)
    )
      (S2('end'), (T = false), (b3 = false), (A = []))
    else {
      const e12 = m4.swipeThreshold
      ;((Math.abs(k2) > e12 || Math.abs(R2) > e12) && (b3 = true),
        T && S2('panend'),
        b3 && S2('swipe'),
        T ||
          b3 ||
          M4 ||
          (S2('tap'),
          L
            ? S2('doubleTap')
            : (g2 = setTimeout(function () {
                S2('singleTap')
              }, 250))),
        S2('end'),
        G())
    }
  }
  function F2() {
    ;(clearTimeout(g2), G(), T && S2('panend'), S2('end'))
  }
  function G() {
    ;((d = false),
      (T = false),
      (b3 = false),
      (L = false),
      (P = 0),
      (A = []),
      (w3 = []),
      (y3 = []),
      (E3 = []),
      (D2 = 0),
      (X = 0),
      (Y = 0),
      (j2 = 0),
      (k2 = 0),
      (R2 = 0),
      (z2 = 0),
      (v4 = void 0),
      window.removeEventListener('mousemove', I2),
      window.removeEventListener('mouseup', B2),
      window.removeEventListener('blur', F2),
      l ||
        p2 ||
        (p2 = setTimeout(() => {
          ;((l = true), (p2 = void 0))
        }, 100)))
  }
  function J(e11) {
    const t10 = e11.target
    ;((d = false),
      t10 && !e11.defaultPrevented && (l || (c2(e11), e11.stopPropagation())))
  }
  const K = {
    init: function () {
      return (
        e10 &&
          (e10.addEventListener('click', J, a2),
          e10.addEventListener('mousedown', H2, a2),
          e10.addEventListener('touchstart', H2, a2),
          e10.addEventListener('touchmove', I2, a2),
          e10.addEventListener('touchend', B2),
          e10.addEventListener('touchcancel', B2)),
        K
      )
    },
    on: function (e11, t10) {
      return (
        (function (e12, t11) {
          O2.set(e12, [...(O2.get(e12) || []), t11])
        })(e11, t10),
        K
      )
    },
    off: function (e11, t10) {
      return (
        O2.has(e11) &&
          O2.set(
            e11,
            O2.get(e11).filter(e12 => e12 !== t10),
          ),
        K
      )
    },
    isPointerDown: () => P > 0,
    destroy: function () {
      ;(clearTimeout(g2),
        clearTimeout(p2),
        (p2 = void 0),
        e10 &&
          (e10.removeEventListener('click', J, a2),
          e10.removeEventListener('mousedown', H2, a2),
          e10.removeEventListener('touchstart', H2, a2),
          e10.removeEventListener('touchmove', I2, a2),
          e10.removeEventListener('touchend', B2),
          e10.removeEventListener('touchcancel', B2)),
        (e10 = null),
        G())
    },
  }
  return K
}
f.isClickAllowed = () => l

// node_modules/@fancyapps/ui/dist/panzoom/l10n/en_EN.js
var e6 = {
  IMAGE_ERROR: "This image couldn't be loaded. <br /> Please try again later.",
  MOVE_UP: 'Move up',
  MOVE_DOWN: 'Move down',
  MOVE_LEFT: 'Move left',
  MOVE_RIGHT: 'Move right',
  ZOOM_IN: 'Zoom in',
  ZOOM_OUT: 'Zoom out',
  TOGGLE_FULL: 'Toggle zoom level',
  TOGGLE_1TO1: 'Toggle zoom level',
  ITERATE_ZOOM: 'Toggle zoom level',
  ROTATE_CCW: 'Rotate counterclockwise',
  ROTATE_CW: 'Rotate clockwise',
  FLIP_X: 'Flip horizontally',
  FLIP_Y: 'Flip vertically',
  RESET: 'Reset',
  TOGGLE_FS: 'Toggle fullscreen',
}

// node_modules/@fancyapps/ui/dist/utils/addClass.js
var s3 = (s11, t9 = '') => {
  s11 &&
    s11.classList &&
    t9.split(' ').forEach(t10 => {
      t10 && s11.classList.add(t10)
    })
}

// node_modules/@fancyapps/ui/dist/utils/removeClass.js
var s4 = (s11, t9 = '') => {
  s11 &&
    s11.classList &&
    t9.split(' ').forEach(t10 => {
      t10 && s11.classList.remove(t10)
    })
}

// node_modules/@fancyapps/ui/dist/utils/toggleClass.js
var s5 = (s11, t9 = '', c6) => {
  s11 &&
    s11.classList &&
    t9.split(' ').forEach(t10 => {
      t10 && s11.classList.toggle(t10, c6 || false)
    })
}

// node_modules/@fancyapps/ui/dist/panzoom/panzoom.js
var h = e10 => {
  e10.cancelable && e10.preventDefault()
}
var m = (e10, t9 = 1e4) => (
  (e10 = parseFloat(e10 + '') || 0),
  Math.round((e10 + Number.EPSILON) * t9) / t9
)
var p = e10 => e10 instanceof HTMLImageElement
var v
var b
;(!(function (e10) {
  ;((e10.Reset = 'reset'),
    (e10.Zoom = 'zoom'),
    (e10.ZoomIn = 'zoomIn'),
    (e10.ZoomOut = 'zoomOut'),
    (e10.ZoomTo = 'zoomTo'),
    (e10.ToggleCover = 'toggleCover'),
    (e10.ToggleFull = 'toggleFull'),
    (e10.ToggleMax = 'toggleMax'),
    (e10.IterateZoom = 'iterateZoom'),
    (e10.Pan = 'pan'),
    (e10.Swipe = 'swipe'),
    (e10.Move = 'move'),
    (e10.MoveLeft = 'moveLeft'),
    (e10.MoveRight = 'moveRight'),
    (e10.MoveUp = 'moveUp'),
    (e10.MoveDown = 'moveDown'),
    (e10.RotateCCW = 'rotateCCW'),
    (e10.RotateCW = 'rotateCW'),
    (e10.FlipX = 'flipX'),
    (e10.FlipY = 'flipY'),
    (e10.ToggleFS = 'toggleFS'))
})(v || (v = {})),
  (function (e10) {
    ;((e10.Cover = 'cover'), (e10.Full = 'full'), (e10.Max = 'max'))
  })(b || (b = {})))
var y = { x: 0, y: 0, scale: 1, angle: 0, flipX: 1, flipY: 1 }
var x = {
  bounds: true,
  classes: {
    container: 'f-panzoom',
    wrapper: 'f-panzoom__wrapper',
    content: 'f-panzoom__content',
    viewport: 'f-panzoom__viewport',
  },
  clickAction: v.ToggleFull,
  dblClickAction: false,
  gestures: {},
  height: 'auto',
  l10n: e6,
  maxScale: 4,
  minScale: 1,
  mouseMoveFactor: 1,
  panMode: 'drag',
  protected: false,
  singleClickAction: false,
  spinnerTpl: '<div class="f-spinner"></div>',
  wheelAction: v.Zoom,
  width: 'auto',
}
var w
var M = 0
var j = 0
var E = 0
var S = (c6, b3 = {}, S2 = {}) => {
  let k2,
    O2,
    T,
    A,
    C,
    F2,
    Z,
    L,
    P = 0,
    X = Object.assign(Object.assign({}, x), b3),
    Y = {},
    R2 = Object.assign({}, y),
    z2 = Object.assign({}, y)
  const D2 = []
  function I2(e10) {
    let t9 = X[e10]
    return t9 && 'function' == typeof t9 ? t9(Ee) : t9
  }
  function W() {
    return c6 && c6.parentElement && k2 && 3 === P
  }
  const $ = /* @__PURE__ */ new Map()
  function q2(e10, ...t9) {
    const n11 = [...($.get(e10) || [])]
    X.on && n11.push(X.on[e10])
    for (const e11 of n11) e11 && 'function' == typeof e11 && e11(Ee, ...t9)
    '*' !== e10 && q2('*', e10, ...t9)
  }
  function H2(e10) {
    if (!W()) return
    const t9 = e10.target
    if (n2(t9)) return
    const o9 = Date.now(),
      s11 = [-e10.deltaX || 0, -e10.deltaY || 0, -e10.detail || 0].reduce(
        function (e11, t10) {
          return Math.abs(t10) > Math.abs(e11) ? t10 : e11
        },
      ),
      a7 = t2(-1, s11, 1)
    q2('wheel', e10, a7)
    const r7 = I2('wheelAction')
    if (!r7) return
    if (e10.defaultPrevented) return
    const l8 = z2.scale
    let c7 = l8 * (a7 > 0 ? 1.5 : 0.5)
    if (r7 === v.Zoom) {
      const t10 = Math.abs(e10.deltaY) < 100 && Math.abs(e10.deltaX) < 100
      if (o9 - j < (t10 ? 200 : 45)) return void h(e10)
      j = o9
      const n11 = ne(),
        s12 = se()
      if (
        (m(c7) < m(n11) && m(l8) <= m(n11)
          ? ((E += Math.abs(a7)), (c7 = n11))
          : m(c7) > m(s12) && m(l8) >= m(s12)
            ? ((E += Math.abs(a7)), (c7 = s12))
            : ((E = 0), (c7 = t2(n11, c7, s12))),
        E > 7)
      )
        return
    }
    switch ((h(e10), r7)) {
      case v.Pan:
        ce(r7, {
          srcEvent: e10,
          deltaX: 2 * -e10.deltaX,
          deltaY: 2 * -e10.deltaY,
        })
        break
      case v.Zoom:
        ce(v.ZoomTo, {
          srcEvent: e10,
          scale: c7,
          center: { x: e10.clientX, y: e10.clientY },
        })
        break
      default:
        ce(r7, { srcEvent: e10 })
    }
  }
  function _2(e10) {
    var n11, o9
    const i8 = e10.composedPath()[0]
    if (!f.isClickAllowed()) return
    if (!n(i8) || e10.defaultPrevented) return
    if (!(null == c6 ? void 0 : c6.contains(i8))) return
    if (
      i8.hasAttribute('disabled') ||
      i8.hasAttribute('aria-disabled') ||
      i8.hasAttribute('data-carousel-go-prev') ||
      i8.hasAttribute('data-carousel-go-next')
    )
      return
    const s11 = i8.closest('[data-panzoom-action]'),
      a7 =
        null === (n11 = null == s11 ? void 0 : s11.dataset) || void 0 === n11
          ? void 0
          : n11.panzoomAction,
      r7 =
        (null === (o9 = null == s11 ? void 0 : s11.dataset) || void 0 === o9
          ? void 0
          : o9.panzoomValue) || ''
    if (a7) {
      switch ((h(e10), a7)) {
        case v.ZoomTo:
        case v.ZoomIn:
        case v.ZoomOut:
          ce(a7, { scale: parseFloat(r7 || '') || void 0 })
          break
        case v.MoveLeft:
        case v.MoveRight:
          ce(a7, { deltaX: parseFloat(r7 || '') || void 0 })
          break
        case v.MoveUp:
        case v.MoveDown:
          ce(a7, { deltaY: parseFloat(r7 || '') || void 0 })
          break
        case v.ToggleFS:
          Me()
          break
        default:
          ce(a7)
      }
      return
    }
    if (!(null == k2 ? void 0 : k2.contains(i8))) return
    const u6 = { srcEvent: e10 }
    if ((ce(I2('clickAction'), u6), I2('dblClickAction'))) {
      const e11 = Date.now(),
        t9 = e11 - (M || e11)
      ;((M = e11),
        t9 > 0 && t9 <= 250
          ? (w && (clearTimeout(w), (w = void 0)), ce(I2('dblClickAction'), u6))
          : (w = setTimeout(() => {
              ce(I2('singleClickAction'), u6)
            }, 250)))
    }
  }
  function B2(e10) {
    if (((L = e10), !W() || !Q())) return
    if (R2.scale <= 1 || z2.scale <= 1) return
    if (
      ((null == k2 ? void 0 : k2.dataset.animationName) || '').indexOf('zoom') >
      -1
    )
      return
    const t9 = ee(z2.scale)
    if (!t9) return
    const { x: n11, y: o9 } = t9
    ce(v.Pan, { deltaX: n11 - z2.x, deltaY: o9 - z2.y })
  }
  function N2() {
    var e10
    c6 &&
      (s4(c6, 'is-loading'),
      null === (e10 = c6.querySelector('.f-spinner')) ||
        void 0 === e10 ||
        e10.remove())
  }
  function V() {
    if (!c6 || !O2) return
    if ((N2(), p(O2) && (!O2.complete || !O2.naturalWidth)))
      return (
        (P = 2),
        null == k2 || k2.classList.add('has-error'),
        void q2('error')
      )
    q2('loaded')
    const { width: e10, height: t9 } = J()
    ;(p(O2) &&
      (O2.setAttribute('width', e10 + ''), O2.setAttribute('height', t9 + '')),
      k2 &&
        (s4(k2, 'has-error'),
        p(O2) &&
          (k2.setAttribute('width', e10 + ''),
          k2.setAttribute('height', t9 + ''),
          (k2.style.aspectRatio = `${e10 / t9 || ''}`))),
      (F2 = c()
        .on('start', (e11, t10) => {
          ;(void 0 !== t10.angle &&
            (t10.angle = 90 * Math.round(t10.angle / 90)),
            void 0 !== t10.flipX && (t10.flipX = t10.flipX > 0 ? 1 : -1),
            void 0 !== t10.flipY && (t10.flipY = t10.flipY > 0 ? 1 : -1),
            (z2 = Object.assign(Object.assign({}, y), t10)),
            le(),
            q2('animationStart'))
        })
        .on('pause', e11 => {
          z2 = Object.assign(Object.assign({}, y), e11)
        })
        .on('step', e11 => {
          if (!W()) return void (null == F2 || F2.end())
          if (
            ((R2 = Object.assign(Object.assign({}, y), e11)),
            Q() ||
              !I2('bounds') ||
              ye() ||
              z2.scale > R2.scale ||
              z2.scale < oe())
          )
            return void ue()
          const t10 = ae(z2.scale)
          let n12 = false,
            o9 = false,
            s11 = false,
            a7 = false
          ;(R2.x < t10.x[0] && (n12 = true),
            R2.x > t10.x[1] && (o9 = true),
            R2.y < t10.y[0] && (a7 = true),
            R2.y > t10.y[1] && (s11 = true))
          let r7 = false,
            l8 = false,
            c7 = false,
            u6 = false
          ;(z2.x < t10.x[0] && (r7 = true),
            z2.x > t10.x[1] && (l8 = true),
            z2.y < t10.y[0] && (u6 = true),
            z2.y > t10.y[1] && (c7 = true))
          let d3 = false
          ;(((o9 && l8) || (n12 && r7)) &&
            ((z2.x = t2(t10.x[0], z2.x, t10.x[1])), (d3 = true)),
            ((s11 && c7) || (a7 && u6)) &&
              ((z2.y = t2(t10.y[0], z2.y, t10.y[1])), (d3 = true)),
            d3 &&
              F2 &&
              F2.spring({
                tension: 94,
                friction: 17,
                maxSpeed: 555 * z2.scale,
                restDelta: 0.1,
                restSpeed: 0.1,
                velocity: F2.getCurrentVelocities(),
              })
                .from(R2)
                .to(z2)
                .start(),
            ue())
        })
        .on('end', () => {
          ;((null == C ? void 0 : C.isPointerDown()) || re(),
            (null == F2 ? void 0 : F2.isRunning()) ||
              (le(), q2('animationEnd')))
        })),
      (function () {
        const e11 = I2('gestures')
        if (!e11) return
        if (!A || !O2) return
        let t10 = false
        C = f(A, e11)
          .on('start', e12 => {
            if (!I2('gestures')) return
            if (!F2) return
            if (!W() || Q()) return
            const n12 = e12.srcEvent
            ;((R2.scale > 1 || be(R2.angle) || e12.currentTouch.length > 1) &&
              (null == n12 || n12.stopPropagation(), F2.pause(), (t10 = true)),
              1 === e12.currentTouch.length && q2('touchStart'))
          })
          .on('move', e12 => {
            var n12
            t10 &&
              (1 !== z2.scale || be(z2.angle) || e12.currentTouch.length > 1) &&
              (h(e12.srcEvent),
              null === (n12 = e12.srcEvent) ||
                void 0 === n12 ||
                n12.stopPropagation())
          })
          .on('pan', e12 => {
            if (!t10) return
            const n12 = e12.srcEvent
            ;(1 !== z2.scale || be(z2.angle) || e12.currentTouch.length > 1) &&
              (h(n12), ce(v.Pan, e12))
          })
          .on('swipe', e12 => {
            t10 && (z2.scale > 1 || be(z2.angle)) && ce(v.Swipe, e12)
          })
          .on('tap', e12 => {
            q2('click', e12)
          })
          .on('singleTap', e12 => {
            q2('singleClick', e12)
          })
          .on('doubleTap', e12 => {
            q2('dblClick', e12)
          })
          .on('pinch', e12 => {
            t10 &&
              (e12.scale > oe()
                ? ce(v.ZoomIn, e12)
                : e12.scale < oe()
                  ? ce(v.ZoomOut, e12)
                  : ce(v.Pan, e12))
          })
          .on('end', e12 => {
            t10 &&
              (e12.currentTouch.length
                ? (e12.srcEvent.stopPropagation(),
                  h(e12.srcEvent),
                  null == F2 || F2.end())
                : ((t10 = false), le(), re(), q2('touchEnd')))
          })
          .init()
      })(),
      A &&
        (A.addEventListener('wheel', H2, { passive: false }),
        D2.push(() => {
          null == A || A.removeEventListener('wheel', H2, { passive: false })
        })),
      null == c6 || c6.addEventListener('click', _2),
      null === document ||
        void 0 === document ||
        document.addEventListener('mousemove', B2),
      D2.push(() => {
        ;(null == c6 || c6.removeEventListener('click', _2),
          null === document ||
            void 0 === document ||
            document.removeEventListener('mousemove', B2))
      }))
    const n11 = U()
    ;((R2 = Object.assign({}, n11)),
      (z2 = Object.assign({}, n11)),
      (P = 3),
      ue(),
      le(),
      q2('ready'),
      requestAnimationFrame(() => {
        3 === P && (N2(), A && (A.style.visibility = ''))
      }))
  }
  function U() {
    const e10 = Object.assign({}, I2('startPos') || {})
    let t9 = e10.scale,
      n11 = 1
    n11 = 'string' == typeof t9 ? te(t9) : 'number' == typeof t9 ? t9 : oe()
    const o9 = Object.assign(Object.assign(Object.assign({}, y), e10), {
        scale: n11,
      }),
      i8 = Q() ? ee(n11) : void 0
    if (i8) {
      const { x: e11, y: t10 } = i8
      ;((o9.x = e11), (o9.y = t10))
    }
    return o9
  }
  function G() {
    const e10 = { top: 0, left: 0, width: 0, height: 0 }
    if (k2) {
      const t9 = k2.getBoundingClientRect()
      be(z2.angle)
        ? ((e10.top = t9.top + 0.5 * t9.height - 0.5 * t9.width),
          (e10.left = t9.left + 0.5 * t9.width - 0.5 * t9.height),
          (e10.width = t9.height),
          (e10.height = t9.width))
        : ((e10.top = t9.top),
          (e10.left = t9.left),
          (e10.width = t9.width),
          (e10.height = t9.height))
    }
    return e10
  }
  function J() {
    let t9 = I2('width'),
      n11 = I2('height')
    if (O2 && 'auto' === t9) {
      const e10 = O2.getAttribute('width')
      t9 = e10
        ? parseFloat(e10 + '')
        : void 0 !== O2.dataset.width
          ? parseFloat(O2.dataset.width + '')
          : p(A)
            ? A.naturalWidth
            : p(O2)
              ? O2.naturalWidth
              : (null == k2 ? void 0 : k2.getBoundingClientRect().width) || 0
    } else t9 = t(t9) ? parseFloat(t9) : t9
    if (O2 && 'auto' === n11) {
      const e10 = O2.getAttribute('height')
      n11 = e10
        ? parseFloat(e10 + '')
        : void 0 !== O2.dataset.height
          ? parseFloat(O2.dataset.height + '')
          : p(A)
            ? A.naturalHeight
            : p(O2)
              ? O2.naturalHeight
              : (null == k2 ? void 0 : k2.getBoundingClientRect().height) || 0
    } else n11 = t(n11) ? parseFloat(n11) : n11
    return { width: t9, height: n11 }
  }
  function K() {
    const e10 = G()
    return { width: e10.width, height: e10.height }
  }
  function Q() {
    return 'mousemove' === I2('panMode') && matchMedia('(hover: hover)').matches
  }
  function ee(e10) {
    const t9 = L || I2('event'),
      n11 = null == k2 ? void 0 : k2.getBoundingClientRect()
    if (!t9 || !n11 || e10 <= 1) return { x: 0, y: 0 }
    const o9 = (t9.clientX || 0) - n11.left,
      s11 = (t9.clientY || 0) - n11.top,
      { width: a7, height: r7 } = K(),
      l8 = ae(e10)
    if (e10 > 1) {
      const t10 = I2('mouseMoveFactor')
      t10 > 1 && (e10 *= t10)
    }
    let c7 = a7 * e10,
      u6 = r7 * e10,
      d3 = 0.5 * (c7 - a7) - (((o9 / a7) * 100) / 100) * (c7 - a7),
      f3 = 0.5 * (u6 - r7) - (((s11 / r7) * 100) / 100) * (u6 - r7)
    return (
      (d3 = t2(l8.x[0], d3, l8.x[1])),
      (f3 = t2(l8.y[0], f3, l8.y[1])),
      { x: d3, y: f3 }
    )
  }
  function te(e10) {
    if (!e10) return z2.scale
    if (!c6) return 1
    const t9 = c6.getBoundingClientRect(),
      n11 = G(),
      { width: o9, height: s11 } = J(),
      a7 = e11 => {
        if ('number' == typeof e11) return e11
        switch (e11) {
          case 'min':
          case 'base':
            return 1
          case 'cover':
            return Math.max(t9.height / n11.height, t9.width / n11.width) || 1
          case 'full':
          case 'max': {
            const e12 = be(z2.angle) ? s11 : o9
            return e12 && n11.width ? e12 / n11.width : 1
          }
        }
      },
      r7 = I2('minScale'),
      l8 = I2('maxScale'),
      u6 = Math.min(a7('full'), a7(r7)),
      d3 =
        'number' == typeof l8 ? a7('full') * l8 : Math.min(a7('full'), a7(l8))
    switch (e10) {
      case 'min':
        return u6
      case 'base':
        return t2(u6, 1, d3)
      case 'cover':
        return a7('cover')
      case 'full':
        return Math.min(d3, a7('full'))
      case 'max':
        return d3
    }
  }
  function ne() {
    return te('min')
  }
  function oe() {
    return te('base')
  }
  function ie() {
    return te('full')
  }
  function se() {
    return te('max')
  }
  function ae(e10) {
    const t9 = { x: [0, 0], y: [0, 0] },
      n11 = null == c6 ? void 0 : c6.getBoundingClientRect()
    if (!n11) return t9
    const o9 = G(),
      i8 = n11.width,
      s11 = n11.height
    let a7 = o9.width,
      r7 = o9.height,
      l8 = (e10 = void 0 === e10 ? z2.scale : e10),
      u6 = e10
    if (Q() && e10 > 1) {
      const t10 = I2('mouseMoveFactor')
      t10 > 1 &&
        (a7 * e10 > i8 + 0.01 && (l8 *= t10),
        r7 * e10 > s11 + 0.01 && (u6 *= t10))
    }
    if (((a7 *= l8), (r7 *= u6), a7 > i8)) {
      ;((t9.x[0] = 0.5 * (i8 - a7)), (t9.x[1] = 0.5 * (a7 - i8)))
      const e11 = 0.5 * (o9.left - n11.left),
        s12 = 0.5 * (o9.left + o9.width - n11.right)
      ;((t9.x[0] -= e11 + s12), (t9.x[1] -= e11 + s12))
    }
    if (r7 > s11) {
      ;((t9.y[0] = 0.5 * (s11 - r7)), (t9.y[1] = 0.5 * (r7 - s11)))
      const e11 = 0.5 * (o9.top - n11.top),
        i9 = 0.5 * (o9.top + o9.height - n11.bottom)
      ;((t9.y[0] -= e11 + i9), (t9.y[1] -= e11 + i9))
    }
    return t9
  }
  function re() {
    if (!W()) return
    if (!I2('bounds')) return
    if (!F2) return
    const e10 = ne(),
      t9 = se(),
      n11 = t2(e10, z2.scale, t9)
    if (z2.scale < e10 - 0.01 || z2.scale > t9 + 0.01)
      return void ce(v.ZoomTo, { scale: n11 })
    if (F2.isRunning()) return
    if (ye()) return
    const o9 = ae(n11)
    z2.x < o9.x[0] || z2.x > o9.x[1] || z2.y < o9.y[0] || z2.y > o9.y[1]
      ? ((z2.x = t2(o9.x[0], z2.x, o9.x[1])),
        (z2.y = t2(o9.y[0], z2.y, o9.y[1])),
        F2.spring({
          tension: 170,
          friction: 17,
          restDelta: 1e-3,
          restSpeed: 1e-3,
          maxSpeed: 1 / 0,
          velocity: F2.getCurrentVelocities(),
        }),
        F2.from(R2).to(z2).start())
      : ue()
  }
  function le(e10) {
    var t9
    if (!W()) return
    const n11 = ve(),
      o9 = ye(),
      i8 = xe(),
      s11 = we(),
      a7 = fe(),
      r7 = ge()
    ;(s5(k2, 'is-fullsize', s11),
      s5(k2, 'is-expanded', i8),
      s5(k2, 'is-dragging', o9),
      s5(k2, 'can-drag', n11),
      s5(k2, 'will-zoom-in', a7),
      s5(k2, 'will-zoom-out', r7))
    const l8 = me(),
      u6 = pe(),
      d3 = he(),
      g2 = !W()
    for (const n12 of (null === (t9 = e10 || c6) || void 0 === t9
      ? void 0
      : t9.querySelectorAll('[data-panzoom-action]')) || []) {
      const e11 = n12.dataset.panzoomAction
      let t10 = false
      if (g2) t10 = true
      else
        switch (e11) {
          case v.ZoomIn:
            l8 || (t10 = true)
            break
          case v.ZoomOut:
            d3 || (t10 = true)
            break
          case v.ToggleFull: {
            u6 || d3 || (t10 = true)
            const e12 = n12.querySelector('g')
            e12 && (e12.style.display = s11 && !t10 ? 'none' : '')
            break
          }
          case v.IterateZoom: {
            l8 || d3 || (t10 = true)
            const e12 = n12.querySelector('g')
            e12 && (e12.style.display = l8 || t10 ? '' : 'none')
            break
          }
          case v.ToggleCover:
          case v.ToggleMax:
            l8 || d3 || (t10 = true)
        }
      t10
        ? (n12.setAttribute('aria-disabled', ''),
          n12.setAttribute('tabindex', '-1'))
        : (n12.removeAttribute('aria-disabled'),
          n12.removeAttribute('tabindex'))
    }
  }
  function ce(e10, t9) {
    var n11
    if (!(e10 && c6 && O2 && F2 && W())) return
    if (e10 === v.Swipe && Math.abs(F2.getCurrentVelocities().scale) > 0.01)
      return
    const o9 = Object.assign({}, z2)
    let s11 = Object.assign({}, z2),
      l8 = ae(Q() ? o9.scale : R2.scale)
    const u6 = F2.getCurrentVelocities(),
      d3 = G(),
      f3 =
        ((null === (n11 = (t9 = t9 || {}).currentTouch) || void 0 === n11
          ? void 0
          : n11.length) || 0) > 1,
      h4 = t9.velocityX || 0,
      m4 = t9.velocityY || 0
    let p2 = t9.center
    t9.srcEvent && (p2 = i2(s2(t9.srcEvent)))
    let b4 = t9.deltaX || 0,
      x3 = t9.deltaY || 0
    switch (e10) {
      case v.MoveRight:
        b4 = t9.deltaX || 100
        break
      case v.MoveLeft:
        b4 = t9.deltaX || -100
        break
      case v.MoveUp:
        x3 = t9.deltaY || -100
        break
      case v.MoveDown:
        x3 = t9.deltaY || 100
    }
    let w3 = []
    if ('number' == typeof e10) s11.scale = e10
    else
      switch (e10) {
        case v.Reset:
          ;((s11 = Object.assign({}, y)), (s11.scale = oe()))
          break
        case v.ZoomTo:
        case v.ZoomIn:
        case v.ZoomOut:
        case v.ToggleCover:
        case v.ToggleFull:
        case v.ToggleMax:
        case v.IterateZoom:
        case v.Zoom:
          s11.scale = de(e10, t9)
          break
        case v.Pan:
        case v.Move:
        case v.MoveLeft:
        case v.MoveRight:
        case v.MoveUp:
        case v.MoveDown:
          if (ye()) {
            let e11 = 1,
              t10 = 1
            ;(s11.x <= l8.x[0] &&
              h4 <= 0 &&
              ((e11 = Math.max(
                0.01,
                1 - Math.abs((1 / d3.width) * Math.abs(s11.x - l8.x[0])),
              )),
              (e11 *= 0.2)),
              s11.x >= l8.x[1] &&
                h4 >= 0 &&
                ((e11 = Math.max(
                  0.01,
                  1 - Math.abs((1 / d3.width) * Math.abs(s11.x - l8.x[1])),
                )),
                (e11 *= 0.2)),
              s11.y <= l8.y[0] &&
                m4 <= 0 &&
                ((t10 = Math.max(
                  0.01,
                  1 - Math.abs((1 / d3.height) * Math.abs(s11.y - l8.y[0])),
                )),
                (t10 *= 0.2)),
              s11.y >= l8.y[1] &&
                m4 >= 0 &&
                ((t10 = Math.max(
                  0.01,
                  1 - Math.abs((1 / d3.height) * Math.abs(s11.y - l8.y[1])),
                )),
                (t10 *= 0.2)),
              (s11.x += b4 * e11),
              (s11.y += x3 * t10))
          } else
            ((s11.x = t2(l8.x[0], s11.x + b4, l8.x[1])),
              (s11.y = t2(l8.y[0], s11.y + x3, l8.y[1])))
          break
        case v.Swipe:
          const n12 = (e11 = 0) => Math.sign(e11) * Math.pow(Math.abs(e11), 1.5)
          ;((s11.x += t2(-1e3, n12(h4), 1e3)),
            (s11.y += t2(-1e3, n12(m4), 1e3)),
            m4 && !h4 && (s11.x = t2(l8.x[0], s11.x, l8.x[1])),
            !m4 && h4 && (s11.y = t2(l8.y[0], s11.y, l8.y[1])),
            (u6.x = h4),
            (u6.y = m4))
          break
        case v.RotateCW:
          s11.angle += 90
          break
        case v.RotateCCW:
          s11.angle -= 90
          break
        case v.FlipX:
          s11.flipX *= -1
          break
        case v.FlipY:
          s11.flipY *= -1
      }
    if (
      (void 0 !== R2.angle &&
        Math.abs(R2.angle) >= 360 &&
        ((s11.angle -= 360 * Math.floor(R2.angle / 360)),
        (R2.angle -= 360 * Math.floor(R2.angle / 360))),
      w3.length)
    ) {
      const e11 = w3.findIndex(e12 => e12 > s11.scale + 1e-4)
      s11.scale = w3[e11] || w3[0]
    }
    if (
      (f3 &&
        (s11.scale = t2(
          ne() * (f3 ? 0.8 : 1),
          s11.scale,
          se() * (f3 ? 1.6 : 1),
        )),
      Q())
    ) {
      const e11 = ee(s11.scale)
      if (e11) {
        const { x: t10, y: n12 } = e11
        ;((s11.x = t10), (s11.y = n12))
      }
    } else if (Math.abs(s11.scale - o9.scale) > 1e-4) {
      let e11 = 0,
        t10 = 0
      if (p2) ((e11 = p2.x), (t10 = p2.y))
      else {
        const n13 = c6.getBoundingClientRect()
        ;((e11 = n13.x + 0.5 * n13.width), (t10 = n13.y + 0.5 * n13.height))
      }
      let n12 = e11 - d3.left,
        a7 = t10 - d3.top
      ;((n12 -= 0.5 * d3.width), (a7 -= 0.5 * d3.height))
      const r7 = (n12 - o9.x) / o9.scale,
        u7 = (a7 - o9.y) / o9.scale
      ;((s11.x = n12 - r7 * s11.scale),
        (s11.y = a7 - u7 * s11.scale),
        !f3 &&
          I2('bounds') &&
          ((l8 = ae(s11.scale)),
          (s11.x = t2(l8.x[0], s11.x, l8.x[1])),
          (s11.y = t2(l8.y[0], s11.y, l8.y[1]))))
    }
    if (e10 === v.Swipe) {
      let e11 = 94,
        t10 = 17,
        n12 = 500 * s11.scale,
        o10 = u6
      F2.spring({
        tension: e11,
        friction: t10,
        maxSpeed: n12,
        restDelta: 0.1,
        restSpeed: 0.1,
        velocity: o10,
      })
    } else
      e10 === v.Pan || f3
        ? F2.spring({
            tension: 900,
            friction: 17,
            restDelta: 0.01,
            restSpeed: 0.01,
            maxSpeed: 1,
          })
        : F2.spring({
            tension: 170,
            friction: 17,
            restDelta: 1e-3,
            restSpeed: 1e-3,
            maxSpeed: 1 / 0,
            velocity: u6,
          })
    if (0 === t9.velocity || n3(R2, s11))
      ((R2 = Object.assign({}, s11)),
        (z2 = Object.assign({}, s11)),
        F2.end(),
        ue(),
        le())
    else {
      if (n3(z2, s11)) return
      F2.from(R2).to(s11).start()
    }
    q2('action', e10)
  }
  function ue() {
    if (!O2 || !k2 || !A) return
    const { width: e10, height: t9 } = J()
    Object.assign(k2.style, {
      maxWidth: `min(${e10}px, 100%)`,
      maxHeight: `min(${t9}px, 100%)`,
    })
    const n11 = (function () {
        const { width: e11, height: t10 } = J(),
          { width: n12, height: o10 } = K()
        if (!c6)
          return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            scale: 0,
            flipX: 0,
            flipY: 0,
            angle: 0,
            fitWidth: n12,
            fitHeight: o10,
            fullWidth: e11,
            fullHeight: t10,
          }
        let { x: i9, y: s12, scale: a8, angle: r8, flipX: l9, flipY: u7 } = R2,
          d4 = 1 / ie(),
          f4 = e11,
          g2 = t10,
          h4 = R2.scale * d4,
          m4 = z2.scale * d4
        const p2 = Math.max(n12, o10),
          v4 = Math.min(n12, o10)
        e11 > t10 ? ((f4 = p2), (g2 = v4)) : ((f4 = v4), (g2 = p2))
        h4 = e11 > t10 ? (p2 * a8) / e11 || 1 : (p2 * a8) / t10 || 1
        let b4 = f4 ? e11 * m4 : 0,
          y3 = g2 ? t10 * m4 : 0,
          x3 = f4 && g2 ? (e11 * h4) / b4 : 0
        return (
          (i9 = i9 + 0.5 * f4 - 0.5 * b4),
          (s12 = s12 + 0.5 * g2 - 0.5 * y3),
          {
            x: i9,
            y: s12,
            width: b4,
            height: y3,
            scale: x3,
            flipX: l9,
            flipY: u7,
            angle: r8,
            fitWidth: n12,
            fitHeight: o10,
            fullWidth: e11,
            fullHeight: t10,
          }
        )
      })(),
      {
        x: o9,
        y: i8,
        width: s11,
        height: a7,
        scale: r7,
        angle: l8,
        flipX: u6,
        flipY: d3,
      } = n11
    let f3 = `translate(${m(o9, 100)}px, ${m(i8, 100)}px)`
    ;((f3 +=
      1 !== u6 || 1 !== d3
        ? ` scaleX(${m(r7 * u6)}) scaleY(${m(r7 * d3)})`
        : ` scale(${m(r7)})`),
      0 !== l8 && (f3 += ` rotate(${l8}deg)`),
      (A.style.width = `${m(s11)}px`),
      (A.style.height = `${m(a7)}px`),
      (A.style.transform = `${f3}`),
      q2('render'))
  }
  function de(e10 = I2('clickAction'), t9 = {}) {
    let n11 = z2.scale,
      o9 = oe(),
      s11 = []
    if ('number' == typeof e10) o9 = e10
    else if (e10) {
      switch (e10) {
        case v.ZoomTo:
          o9 = t9.scale || 1
          break
        case v.ZoomIn:
          o9 = n11 * (t9.scale || 2)
          break
        case v.ZoomOut:
          o9 = n11 * (t9.scale || 0.5)
          break
        case v.ToggleCover:
          s11 = [oe(), te('cover')]
          break
        case v.ToggleFull:
          s11 = [oe(), ie()]
          break
        case v.ToggleMax:
          s11 = [oe(), se()]
          break
        case v.IterateZoom:
          s11 = [oe(), ie(), se()]
          break
        case v.Zoom: {
          const e11 = ie()
          o9 = n11 >= e11 - 0.05 ? oe() : Math.min(e11, n11 * (t9.scale || 2))
          break
        }
      }
      if (s11.length) {
        const e11 = s11.find(e12 => e12 > n11 + 1e-4)
        o9 = null != e11 ? e11 : oe()
      }
    }
    return (e10 !== v.ZoomTo && (o9 = t2(ne(), o9, se())), o9)
  }
  function fe() {
    return !!(W() && de() > z2.scale)
  }
  function ge() {
    return !!(W() && de() < z2.scale)
  }
  function he() {
    return !!(W() && z2.scale > ne())
  }
  function me() {
    return !!(W() && z2.scale < se())
  }
  function pe() {
    return !!(W() && z2.scale < ie())
  }
  function ve() {
    return !(!W() || (!xe() && !be(z2.angle)) || !C || Q())
  }
  function be(e10) {
    return 90 === Math.abs(e10 % 180)
  }
  function ye() {
    return !(!W() || !(null == C ? void 0 : C.isPointerDown()) || Q())
  }
  function xe() {
    return !!(W() && z2.scale > oe())
  }
  function we() {
    return !!(W() && z2.scale >= ie())
  }
  function Me() {
    const e10 = 'in-fullscreen',
      t9 = 'with-panzoom-in-fullscreen'
    null == c6 || c6.classList.toggle(e10)
    const n11 = null == c6 ? void 0 : c6.classList.contains(e10)
    ;(n11
      ? (document.documentElement.classList.add(t9),
        document.addEventListener('keydown', je, true))
      : (document.documentElement.classList.remove(t9),
        document.removeEventListener('keydown', je, true)),
      ue(),
      q2(n11 ? 'enterFS' : 'exitFS'))
  }
  function je(e10) {
    'Escape' !== e10.key || e10.defaultPrevented || Me()
  }
  const Ee = {
    canDrag: ve,
    canZoomIn: me,
    canZoomOut: he,
    canZoomToFull: pe,
    destroy: function () {
      q2('destroy')
      for (const e10 of Object.values(Y)) null == e10 || e10.destroy(Ee)
      for (const e10 of D2) e10()
      return (
        k2 &&
          ((k2.style.aspectRatio = ''),
          (k2.style.maxWidth = ''),
          (k2.style.maxHeight = '')),
        A &&
          ((A.style.width = ''),
          (A.style.height = ''),
          (A.style.transform = '')),
        (k2 = void 0),
        (O2 = void 0),
        (A = void 0),
        (R2 = Object.assign({}, y)),
        (z2 = Object.assign({}, y)),
        null == F2 || F2.destroy(),
        (F2 = void 0),
        null == C || C.destroy(),
        (C = void 0),
        (P = 4),
        Ee
      )
    },
    emit: q2,
    execute: ce,
    getBoundaries: ae,
    getContainer: function () {
      return c6
    },
    getContent: function () {
      return O2
    },
    getFullDim: J,
    getGestures: function () {
      return C
    },
    getMousemovePos: ee,
    getOptions: function () {
      return X
    },
    getPlugins: function () {
      return Y
    },
    getScale: te,
    getStartPosition: U,
    getState: function () {
      return P
    },
    getTransform: function (e10) {
      return true === e10 ? z2 : R2
    },
    getTween: function () {
      return F2
    },
    getViewport: function () {
      return A
    },
    getWrapper: function () {
      return k2
    },
    init: function () {
      return (
        (P = 0),
        q2('init'),
        (function () {
          for (const [e10, t9] of Object.entries(
            Object.assign(Object.assign({}, S2), X.plugins || {}),
          ))
            if (e10 && !Y[e10] && t9 instanceof Function) {
              const n11 = t9()
              ;(n11.init(Ee), (Y[e10] = n11))
            }
          q2('initPlugins')
        })(),
        (function () {
          var e10, t9, n11
          const o9 = Object.assign(Object.assign({}, x.classes), I2('classes')),
            i8 =
              null === (e10 = o9.content) || void 0 === e10
                ? void 0
                : e10.split(' ').shift(),
            s11 =
              null === (t9 = o9.wrapper) || void 0 === t9
                ? void 0
                : t9.split(' ').shift(),
            a7 =
              null === (n11 = o9.viewport) || void 0 === n11
                ? void 0
                : n11.split(' ').shift()
          if (!i8 || !s11 || !a7) return
          if (!c6) return
          if (
            (s3(c6, o9.container),
            (O2 = c6.querySelector(`.${i8}:not(.is-clone)`)),
            !O2)
          )
            return
          ;(O2.setAttribute('draggable', 'false'),
            (k2 = c6.querySelector(`.${s11}`)),
            k2 ||
              ((k2 = document.createElement('div')),
              s3(k2, o9.wrapper),
              O2.insertAdjacentElement('beforebegin', k2),
              k2.insertAdjacentElement('afterbegin', O2)))
          ;((A = c6.querySelector(`.${a7}`)),
            A ||
              ((A = document.createElement('div')),
              s3(A, o9.viewport),
              k2.insertAdjacentElement('beforeend', A)))
          A.contains(O2) || A.insertAdjacentElement('afterbegin', O2)
          ;((T = c6.querySelector(`.${i8}.is-clone`)),
            T ||
              ((T = O2.cloneNode(true)),
              T.removeAttribute('id'),
              s3(T, 'is-clone'),
              k2.insertAdjacentElement('afterbegin', T)))
          O2 instanceof HTMLPictureElement && (O2 = O2.querySelector('img'))
          T instanceof HTMLPictureElement && (T = T.querySelector('img'))
          A instanceof HTMLPictureElement && (A = A.querySelector('img'))
          if (A && ((A.style.visibility = 'hidden'), I2('protected'))) {
            A.addEventListener('contextmenu', e12 => {
              h(e12)
            })
            const e11 = document.createElement('div')
            ;(s3(e11, 'f-panzoom__protected'), A.appendChild(e11))
          }
          q2('initLayout')
        })(),
        (function () {
          if (c6 && k2 && !Z) {
            let e10 = null
            ;((Z = new ResizeObserver(() => {
              W() &&
                (e10 =
                  e10 ||
                  requestAnimationFrame(() => {
                    ;(W() && (le(), re(), q2('refresh')), (e10 = null))
                  }))
            })),
              Z.observe(k2),
              D2.push(() => {
                ;(null == Z || Z.disconnect(),
                  (Z = void 0),
                  e10 && (cancelAnimationFrame(e10), (e10 = null)))
              }))
          }
        })(),
        (function () {
          if (!c6 || !O2) return
          if (!p(O2) || !p(T)) return void V()
          const e10 = () => {
            O2 &&
              p(O2) &&
              O2.decode()
                .then(() => {
                  V()
                })
                .catch(() => {
                  V()
                })
          }
          if (
            ((P = 1),
            c6.classList.add('is-loading'),
            q2('loading'),
            T.src && T.complete)
          )
            return void e10()
          ;((function () {
            if (!c6) return
            if (null == c6 ? void 0 : c6.querySelector('.f-spinner')) return
            const e11 = I2('spinnerTpl'),
              t9 = e2(e11)
            t9 &&
              (t9.classList.add('f-spinner'),
              c6.classList.add('is-loading'),
              null == k2 || k2.insertAdjacentElement('afterbegin', t9))
          })(),
            T.addEventListener('load', e10, false),
            T.addEventListener('error', e10, false),
            D2.push(() => {
              ;(null == T || T.removeEventListener('load', e10, false),
                null == T || T.removeEventListener('error', e10, false))
            }))
        })(),
        Ee
      )
    },
    isDragging: ye,
    isExpanded: xe,
    isFullsize: we,
    isMousemoveMode: Q,
    localize: function (e10, t9 = []) {
      const n11 = I2('l10n') || {}
      e10 = String(e10).replace(/\{\{(\w+)\}\}/g, (e11, t10) => n11[t10] || e11)
      for (let n12 = 0; n12 < t9.length; n12++)
        e10 = e10.split(t9[n12][0]).join(t9[n12][1])
      return (e10 = e10.replace(/\{\{(.*?)\}\}/g, (e11, t10) => t10))
    },
    off: function (e10, t9) {
      for (const n11 of e10 instanceof Array ? e10 : [e10])
        $.has(n11) &&
          $.set(
            n11,
            $.get(n11).filter(e11 => e11 !== t9),
          )
      return Ee
    },
    on: function (e10, t9) {
      for (const n11 of e10 instanceof Array ? e10 : [e10])
        $.set(n11, [...($.get(n11) || []), t9])
      return Ee
    },
    toggleFS: Me,
    updateControls: le,
    version: '6.1.14',
    willZoomIn: fe,
    willZoomOut: ge,
  }
  return Ee
}
;((S.l10n = { en_EN: e6 }), (S.getDefaults = () => x))

// node_modules/@fancyapps/ui/dist/utils/getDirectChildren.js
var e7 = (e10, o9) => {
  let t9 = []
  return (
    e10.childNodes.forEach(e11 => {
      e11.nodeType !== Node.ELEMENT_NODE ||
        (o9 && !e11.matches(o9)) ||
        t9.push(e11)
    }),
    t9
  )
}

// node_modules/@fancyapps/ui/dist/utils/extend.js
var r3 = (t9, ...e10) => {
  const n11 = e10.length
  for (let c6 = 0; c6 < n11; c6++) {
    const n12 = e10[c6] || {}
    Object.entries(n12).forEach(([e11, n13]) => {
      const c7 = Array.isArray(n13) ? [] : {}
      ;(t9[e11] || Object.assign(t9, { [e11]: c7 }),
        t3(n13)
          ? Object.assign(t9[e11], r3(t9[e11], n13))
          : Array.isArray(n13)
            ? Object.assign(t9, { [e11]: [...n13] })
            : Object.assign(t9, { [e11]: n13 }))
    })
  }
  return t9
}

// node_modules/@fancyapps/ui/dist/utils/map.js
var t5 = function (t9 = 0, n11 = 0, r7 = 0, c6 = 0, m4 = 0, p2 = false) {
  const s11 = ((t9 - n11) / (r7 - n11)) * (m4 - c6) + c6
  return p2 ? (c6 < m4 ? t2(c6, s11, m4) : t2(m4, s11, c6)) : s11
}

// node_modules/@fancyapps/ui/dist/carousel/l10n/en_EN.js
var o3 = Object.assign(Object.assign({}, e6), {
  ERROR: 'Something went wrong. <br /> Please try again later.',
  NEXT: 'Next page',
  PREV: 'Previous page',
  GOTO: 'Go to page #%d',
  DOWNLOAD: 'Download',
  TOGGLE_FULLSCREEN: 'Toggle full-screen mode',
  TOGGLE_EXPAND: 'Toggle full-size mode',
  TOGGLE_THUMBS: 'Toggle thumbnails',
  TOGGLE_AUTOPLAY: 'Toggle slideshow',
})

// node_modules/@fancyapps/ui/dist/carousel/carousel.js
var m2 = t9 => {
  t9.cancelable && t9.preventDefault()
}
var h2 = {
  adaptiveHeight: false,
  center: true,
  classes: {
    container: 'f-carousel',
    isEnabled: 'is-enabled',
    isLTR: 'is-ltr',
    isRTL: 'is-rtl',
    isHorizontal: 'is-horizontal',
    isVertical: 'is-vertical',
    hasAdaptiveHeight: 'has-adaptive-height',
    viewport: 'f-carousel__viewport',
    slide: 'f-carousel__slide',
    isSelected: 'is-selected',
  },
  dragFree: false,
  enabled: true,
  errorTpl: '<div class="f-html">{{ERROR}}</div>',
  fill: true,
  infinite: true,
  initialPage: 0,
  l10n: o3,
  rtl: false,
  slides: [],
  slidesPerPage: 'auto',
  spinnerTpl: '<div class="f-spinner"></div>',
  transition: 'fade',
  tween: {
    clamp: true,
    mass: 1,
    tension: 160,
    friction: 25,
    restDelta: 1,
    restSpeed: 1,
    velocity: 0,
  },
  vertical: false,
}
var b2
var y2
var E2 = 0
var x2 = (g2, M4 = {}, w3 = {}) => {
  E2++
  let S2,
    A,
    j2,
    L,
    P,
    T = 0,
    O2 = Object.assign({}, h2),
    R2 = Object.assign({}, h2),
    H2 = {},
    V = null,
    C = null,
    $ = 0,
    D2 = 0,
    I2 = 0,
    q2 = false,
    k2 = false,
    F2 = false,
    z2 = 'height',
    B2 = 0,
    N2 = true,
    _2 = 0,
    G = 0,
    X = 0,
    Y = 0,
    W = '*',
    J = [],
    K = []
  const Q = /* @__PURE__ */ new Set()
  let U = [],
    Z = [],
    tt = 0,
    et = 0,
    nt = 0
  function it(t9, ...e10) {
    let n11 = R2[t9]
    return n11 && n11 instanceof Function ? n11(Ft, ...e10) : n11
  }
  function ot(t9, e10 = []) {
    const n11 = it('l10n') || {}
    t9 = String(t9).replace(/\{\{(\w+)\}\}/g, (t10, e11) => n11[e11] || t10)
    for (let n12 = 0; n12 < e10.length; n12++)
      t9 = t9.split(e10[n12][0]).join(e10[n12][1])
    return (t9 = t9.replace(/\{\{(.*?)\}\}/g, (t10, e11) => e11))
  }
  const st = /* @__PURE__ */ new Map()
  function rt(t9, ...e10) {
    const n11 = [...(st.get(t9) || [])]
    R2.on && n11.push(R2.on[t9])
    for (const t10 of n11) t10 && t10 instanceof Function && t10(Ft, ...e10)
    ;('click' === t9 && Ot(e10[0]), '*' !== t9 && rt('*', t9, ...e10))
  }
  function lt() {
    var e10, n11
    const i8 = r3({}, h2, O2)
    let r7 = ''
    const l8 = O2.breakpoints || {}
    for (const [t9, e11] of Object.entries(l8))
      window.matchMedia(t9).matches && ((r7 += t9), r3(i8, e11))
    if (void 0 === P || r7 !== P) {
      if (((P = r7), 0 !== T)) {
        let t9 =
          null ===
            (n11 =
              null === (e10 = Z[_2]) || void 0 === e10
                ? void 0
                : e10.slides[0]) || void 0 === n11
            ? void 0
            : n11.index
        ;(void 0 === t9 && (t9 = R2.initialSlide),
          (i8.initialSlide = t9),
          (i8.slides = []))
        for (const t10 of J) t10.isVirtual && i8.slides.push(t10)
      }
      ;(It(),
        (R2 = i8),
        false !== it('enabled') &&
          ((T = 0),
          rt('init'),
          (function () {
            for (const [t9, e11] of Object.entries(
              Object.assign(Object.assign({}, w3), R2.plugins || {}),
            ))
              if (t9 && !H2[t9] && e11 instanceof Function) {
                const n12 = e11()
                ;(n12.init(Ft, x2), (H2[t9] = n12))
              }
            rt('initPlugins')
          })(),
          (function () {
            if (!V) return
            const e11 = it('classes') || {}
            s3(V, e11.container)
            const n12 = it('style')
            if (n12 && t3(n12))
              for (const [t9, e12] of Object.entries(n12))
                V.style.setProperty(t9, e12)
            ;((C =
              Array.from(V.querySelectorAll(`.${e11.viewport}`))
                .filter(t9 => t9.closest(`.${e11.container}`) === V)
                .pop() || null),
              C ||
                ((C = document.createElement('div')),
                s3(C, e11.viewport),
                C.append(...e7(V, `.${e11.slide}`)),
                V.insertAdjacentElement('afterbegin', C)),
              (V.carousel = Ft),
              rt('initLayout'))
          })(),
          (function () {
            if (!C) return
            const t9 = it('classes') || {}
            ;((J = []),
              [...e7(C, `.${t9.slide}`)].forEach(t10 => {
                if (t10.parentElement) {
                  const e11 = Et(
                    Object.assign(
                      { el: t10, isVirtual: false },
                      t10.dataset || {},
                    ),
                  )
                  ;(rt('createSlide', e11), J.push(e11))
                }
              }),
              St())
            for (const t10 of J) rt('addSlide', t10)
            yt(it('slides'))
            for (const t10 of J) {
              const e11 = t10.el
              ;(null == e11 ? void 0 : e11.parentElement) === C &&
                (s3(e11, R2.classes.slide),
                s3(e11, t10.class),
                Vt(t10),
                rt('attachSlideEl', t10))
            }
            rt('initSlides')
          })(),
          At(),
          (T = 1),
          s3(V, (it('classes') || {}).isEnabled || ''),
          Dt(),
          ft(),
          (A = c()
            .on('start', () => {
              ;(S2 && S2.isPointerDown()) || (ut(), Dt())
            })
            .on('step', t9 => {
              const e11 = B2
              ;((B2 = t9.pos), B2 !== e11 && ((N2 = false), Dt()))
            })
            .on('end', t9 => {
              ;(null == S2 ? void 0 : S2.isPointerDown()) ||
                ((B2 = t9.pos),
                A && !q2 && (B2 < X || B2 > Y)
                  ? A.spring({
                      clamp: true,
                      mass: 1,
                      tension: 200,
                      friction: 25,
                      velocity: 0,
                      restDelta: 1,
                      restSpeed: 1,
                    })
                      .from({ pos: B2 })
                      .to({ pos: t2(X, B2, Y) })
                      .start()
                  : N2 || ((N2 = true), rt('settle')))
            })),
          ct(),
          (function () {
            if (!V || !C) return
            ;(V.addEventListener('click', Tt),
              document.addEventListener('mousemove', at),
              y2 ||
                ((y2 = function (t10) {
                  var e11, n12
                  const i9 =
                    null ===
                      (n12 =
                        null === (e11 = t10.target) || void 0 === e11
                          ? void 0
                          : e11.dataset) || void 0 === n12
                      ? void 0
                      : n12.carouselTarget
                  if (i9) {
                    const e12 = document.getElementById(
                        `${i9.split('#').pop()}`,
                      ),
                      n13 = null == e12 ? void 0 : e12.carousel
                    null == n13 || n13.emit('click', t10)
                  }
                }),
                document.addEventListener('click', y2)))
            const t9 = C.getBoundingClientRect()
            if (((tt = t9.height), (et = t9.width), !j2)) {
              let t10 = null
              ;((j2 = new ResizeObserver(() => {
                t10 ||
                  (t10 = requestAnimationFrame(() => {
                    ;(!(function () {
                      if (1 !== T || !C) return
                      const t11 = Z.length,
                        e11 = C.getBoundingClientRect(),
                        n12 = e11.height,
                        i9 = e11.width
                      ;(t11 > 1 &&
                        ((F2 && Math.abs(n12 - tt) < 0.5) ||
                          (!F2 && Math.abs(i9 - et) < 0.5))) ||
                        (At(),
                        ct(),
                        (tt = n12),
                        (et = i9),
                        (F2 && !tt) ||
                          (!F2 && !et) ||
                          (V &&
                            C &&
                            ((t11 === Z.length &&
                              (null == S2 ? void 0 : S2.isPointerDown())) ||
                              (it('dragFree') && (q2 || (B2 > X && B2 < Y))
                                ? (ut(), Dt())
                                : Ct(_2, { transition: false })))))
                    })(),
                      (t10 = null))
                  }))
              })),
                j2.observe(C))
            }
          })(),
          rt('ready')))
    }
  }
  function at(t9) {
    b2 = t9
  }
  function ct() {
    ;(false === it('gestures')
      ? S2 && (S2.destroy(), (S2 = void 0))
      : S2 ||
        (function () {
          const t9 = it('gestures')
          !S2 &&
            false !== t9 &&
            C &&
            (S2 = f(C, t9)
              .on('start', t10 => {
                var e10, n11
                if (!A) return
                if (false === it('gestures', t10)) return
                const { srcEvent: o9 } = t10
                ;(F2 && e5(o9) && !n2(o9.target) && m2(o9),
                  A.pause(),
                  (A.getCurrentVelocities().pos = 0))
                const s11 =
                    null === (e10 = Z[_2]) || void 0 === e10
                      ? void 0
                      : e10.slides[0],
                  r7 = null == s11 ? void 0 : s11.el
                ;(s11 &&
                  Q.has(s11.index) &&
                  r7 &&
                  ((B2 = s11.offset || 0),
                  (B2 +=
                    ((function (t11) {
                      const e11 = window.getComputedStyle(t11),
                        n12 = new DOMMatrixReadOnly(e11.transform)
                      return { width: n12.m41 || 0, height: n12.m42 || 0 }
                    })(r7)[z2] || 0) * (k2 && !F2 ? 1 : -1))),
                  Lt(),
                  q2 ||
                    ((B2 < X || B2 > Y) &&
                      A.spring({
                        clamp: true,
                        mass: 1,
                        tension: 500,
                        friction: 25,
                        velocity:
                          (null === (n11 = A.getCurrentVelocities()) ||
                          void 0 === n11
                            ? void 0
                            : n11.pos) || 0,
                        restDelta: 1,
                        restSpeed: 1,
                      })
                        .from({ pos: B2 })
                        .to({ pos: t2(X, B2, Y) })
                        .start()))
              })
              .on('move', t10 => {
                var e10, n11
                if (false === it('gestures', t10)) return
                const { srcEvent: o9, axis: s11, deltaX: r7, deltaY: l8 } = t10
                if (
                  e5(o9) &&
                  (null === (e10 = o9.touches) || void 0 === e10
                    ? void 0
                    : e10.length) > 1
                )
                  return
                const a7 = o9.target,
                  c6 = n2(a7),
                  d3 = c6
                    ? c6.scrollHeight > c6.clientHeight
                      ? 'y'
                      : 'x'
                    : void 0
                if (c6 && c6 !== C && (!s11 || s11 === d3)) return
                if (!s11)
                  return (
                    m2(o9),
                    o9.stopPropagation(),
                    void o9.stopImmediatePropagation()
                  )
                if (('y' === s11 && !F2) || ('x' === s11 && F2)) return
                if ((m2(o9), o9.stopPropagation(), !A)) return
                const u6 = k2 && !F2 ? 1 : -1,
                  f3 = F2 ? l8 : r7
                let v4 = (null == A ? void 0 : A.isRunning())
                    ? A.getEndValues().pos
                    : B2,
                  g3 = 1
                ;(q2 ||
                  (v4 <= X && f3 * u6 < 0
                    ? ((g3 = Math.max(
                        0.01,
                        1 - (Math.abs((1 / mt()) * Math.abs(v4 - X)) || 0),
                      )),
                      (g3 *= 0.2))
                    : v4 >= Y &&
                      f3 * u6 > 0 &&
                      ((g3 = Math.max(
                        0.01,
                        1 - (Math.abs((1 / mt()) * Math.abs(v4 - Y)) || 0),
                      )),
                      (g3 *= 0.2))),
                  (v4 += f3 * g3 * u6),
                  A.spring({
                    clamp: true,
                    mass: 1,
                    tension: 700,
                    friction: 25,
                    velocity:
                      (null === (n11 = A.getCurrentVelocities()) ||
                      void 0 === n11
                        ? void 0
                        : n11.pos) || 0,
                    restDelta: 1,
                    restSpeed: 1,
                  })
                    .from({ pos: B2 })
                    .to({ pos: v4 })
                    .start())
              })
              .on('panstart', t10 => {
                false !== it('gestures', t10) &&
                  (null == t10 ? void 0 : t10.axis) === (F2 ? 'y' : 'x') &&
                  s3(C, 'is-dragging')
              })
              .on('panend', t10 => {
                false !== it('gestures', t10) && s4(C, 'is-dragging')
              })
              .on('end', t10 => {
                var e10, n11
                if (false === it('gestures', t10)) return
                const {
                  srcEvent: o9,
                  axis: s11,
                  velocityX: r7,
                  velocityY: l8,
                  currentTouch: c6,
                } = t10
                if (c6.length > 0 || !A) return
                const d3 = o9.target,
                  u6 = n2(d3),
                  f3 = u6
                    ? u6.scrollHeight > u6.clientHeight
                      ? 'y'
                      : 'x'
                    : void 0,
                  v4 = u6 && (!s11 || s11 === f3)
                F2 && e5(o9) && !s11 && Tt(o9)
                const g3 = Z.length,
                  m4 = it('dragFree')
                if (!g3) return
                let h4 = v4 ? 0 : it('vertical') ? l8 : r7
                s11 !== (F2 ? 'y' : 'x') && (h4 = 0)
                let b3 = (null == A ? void 0 : A.isRunning())
                  ? A.getEndValues().pos
                  : B2
                const y3 = k2 && !F2 ? 1 : -1
                if (
                  (v4 || (b3 += h4 * (m4 ? 5 : 1) * y3),
                  !q2 && ((h4 * y3 <= 0 && b3 < X) || (h4 * y3 >= 0 && b3 > Y)))
                ) {
                  let t11 = 0
                  return (
                    Math.abs(h4) > 0 &&
                      ((t11 = 2 * Math.abs(h4)),
                      (t11 = Math.min(0.3 * mt(), t11))),
                    (b3 = t2(X + -1 * t11, b3, Y + t11)),
                    void A.spring({
                      clamp: true,
                      mass: 1,
                      tension: 380,
                      friction: 25,
                      velocity: -1 * h4,
                      restDelta: 1,
                      restSpeed: 1,
                    })
                      .from({ pos: B2 })
                      .to({ pos: b3 })
                      .start()
                  )
                }
                if (
                  m4 ||
                  (null === (e10 = H2.Autoscroll) || void 0 === e10
                    ? void 0
                    : e10.isEnabled())
                )
                  return void (Math.abs(h4) > 10
                    ? A.spring({
                        clamp: true,
                        mass: 1,
                        tension: 150,
                        friction: 25,
                        velocity: -1 * h4,
                        restDelta: 1,
                        restSpeed: 1,
                      })
                        .from({ pos: B2 })
                        .to({ pos: b3 })
                        .start()
                    : A.isRunning() || N2 || ((N2 = true), rt('settle')))
                if (
                  !m4 &&
                  !(null === (n11 = H2.Autoscroll) || void 0 === n11
                    ? void 0
                    : n11.isEnabled()) &&
                  ((!t10.offsetX && !t10.offsetY) ||
                    ('y' === s11 && !F2) ||
                    ('x' === s11 && F2))
                )
                  return void Ct(_2, { transition: 'tween' })
                let E3 = pt(b3)
                ;(Math.abs(h4) > 10 &&
                  E3 === _2 &&
                  (E3 += h4 > 0 ? (k2 && !F2 ? 1 : -1) : k2 && !F2 ? -1 : 1),
                  Ct(E3, { transition: 'tween', tween: { velocity: -1 * h4 } }))
              })
              .init())
        })(),
      s5(C, 'is-draggable', !!S2 && Z.length > 0))
  }
  function dt(t9 = '*') {
    var e10
    const n11 = []
    for (const i8 of J)
      ('*' === t9 ||
        (i8.class && i8.class.includes(t9)) ||
        (i8.el &&
          (null === (e10 = i8.el) || void 0 === e10
            ? void 0
            : e10.classList.contains(t9)))) &&
        n11.push(i8)
    ;((L = void 0), (W = t9), (K = [...n11]))
  }
  function ut() {
    if (!A) return
    const t9 = pt(
      (null == A ? void 0 : A.isRunning()) ? A.getEndValues().pos : B2,
    )
    t9 !== _2 && ((L = _2), (_2 = t9), Vt(), ft(), vt(), rt('change', _2, L))
  }
  function ft() {
    var t9, e10
    if (!V) return
    for (const t10 of V.querySelectorAll('[data-carousel-index]'))
      t10.innerHTML = _2 + ''
    for (const t10 of V.querySelectorAll('[data-carousel-page]'))
      t10.innerHTML = _2 + 1 + ''
    for (const t10 of V.querySelectorAll('[data-carousel-pages]'))
      t10.innerHTML = Z.length + ''
    const n11 = it('classes') || {},
      i8 = Array.from(V.querySelectorAll('[data-carousel-go-to]')).filter(
        t10 => t10.closest(`.${n11.container}`) === V,
      )
    for (const e11 of i8) {
      parseInt(
        (null === (t9 = e11.dataset) || void 0 === t9
          ? void 0
          : t9.carouselGoTo) || '-1',
        10,
      ) === _2
        ? e11.setAttribute('aria-current', 'true')
        : e11.removeAttribute('aria-current')
    }
    for (const t10 of V.querySelectorAll('[data-carousel-go-prev]'))
      (t10.toggleAttribute('aria-disabled', !qt()),
        qt()
          ? t10.removeAttribute('tabindex')
          : t10.setAttribute('tabindex', '-1'))
    for (const t10 of V.querySelectorAll('[data-carousel-go-next]'))
      (t10.toggleAttribute('aria-disabled', !kt()),
        kt()
          ? t10.removeAttribute('tabindex')
          : t10.setAttribute('tabindex', '-1'))
    let o9 = false
    const s11 =
      null === (e10 = Z[_2]) || void 0 === e10 ? void 0 : e10.slides[0]
    s11 && (s11.downloadSrc || ('image' === s11.type && s11.src)) && (o9 = true)
    for (const t10 of V.querySelectorAll('[data-carousel-download]'))
      t10.toggleAttribute('aria-disabled', !o9)
  }
  function vt(t9) {
    var e10
    t9 ||
      (t9 = null === (e10 = Z[_2]) || void 0 === e10 ? void 0 : e10.slides[0])
    const n11 = null == t9 ? void 0 : t9.el
    if (n11)
      for (const e11 of n11.querySelectorAll('[data-slide-index]'))
        e11.innerHTML = t9.index + 1 + ''
  }
  function pt(t9) {
    var e10, n11, i8
    if (!Z.length) return 0
    const o9 = ht()
    let s11 = t9
    q2
      ? (s11 -=
          Math.floor(
            (t9 -
              (null === (e10 = Z[0]) || void 0 === e10 ? void 0 : e10.pos)) /
              o9,
          ) * o9 || 0)
      : (s11 = t2(
          null === (n11 = Z[0]) || void 0 === n11 ? void 0 : n11.pos,
          t9,
          null === (i8 = Z[Z.length - 1]) || void 0 === i8 ? void 0 : i8.pos,
        ))
    const r7 = /* @__PURE__ */ new Map()
    let l8 = 0
    for (const t10 of Z) {
      const e11 = Math.abs(t10.pos - s11),
        n12 = Math.abs(t10.pos - s11 - o9),
        i9 = Math.abs(t10.pos - s11 + o9),
        a7 = Math.min(e11, n12, i9)
      ;(r7.set(l8, a7), l8++)
    }
    const c6 =
      r7.size > 0
        ? [...r7.entries()].reduce((t10, e11) => (e11[1] < t10[1] ? e11 : t10))
        : [_2, 0]
    return parseInt(c6[0])
  }
  function gt() {
    return nt
  }
  function mt() {
    return $
  }
  function ht(t9 = true) {
    return K.length
      ? K.reduce((t10, e10) => t10 + e10.dim, 0) +
          (K.length - (q2 && t9 ? 0 : 1)) * nt
      : 0
  }
  function bt(t9) {
    const e10 = ht(),
      n11 = mt()
    if (!e10 || !C || !n11) return []
    const i8 = []
    ;((t9 = void 0 === t9 ? B2 : t9),
      q2 && (t9 -= Math.floor(t9 / e10) * e10 || 0))
    let o9 = 0
    for (let s11 of K) {
      const r7 = (e11 = 0) => {
        i8.indexOf(s11) > -1 ||
          ((s11.pos = o9 - t9 + e11 || 0),
          s11.offset + e11 > t9 - s11.dim - D2 + 0.51 &&
            s11.offset + e11 < t9 + n11 + I2 - 0.51 &&
            i8.push(s11))
      }
      ;((s11.offset = o9),
        q2 && (r7(e10), r7(-1 * e10)),
        r7(),
        (o9 += s11.dim + nt))
    }
    return i8
  }
  function yt(t9, e10) {
    const n11 = []
    for (const e11 of Array.isArray(t9) ? t9 : [t9]) {
      const t10 = Et(Object.assign(Object.assign({}, e11), { isVirtual: true }))
      ;(t10.el || (t10.el = document.createElement('div')),
        rt('createSlide', t10),
        n11.push(t10))
    }
    ;(J.splice(void 0 === e10 ? J.length : e10, 0, ...n11), St())
    for (const t10 of n11) (rt('addSlide', t10), xt(t10))
    return (dt(W), n11)
  }
  function Et(t9) {
    return (
      (t(t9) || t9 instanceof HTMLElement) && (t9 = { html: t9 }),
      Object.assign(
        {
          index: -1,
          el: void 0,
          class: '',
          isVirtual: true,
          dim: 0,
          pos: 0,
          offset: 0,
          html: '',
          src: '',
        },
        t9,
      )
    )
  }
  function xt(t9) {
    let e10 = t9.el
    if (!t9 || !e10) return
    const n11 = t9.html
      ? t9.html instanceof HTMLElement
        ? t9.html
        : e2(t9.html)
      : void 0
    n11 &&
      (s3(n11, 'f-html'),
      (t9.htmlEl = n11),
      s3(e10, 'has-html'),
      e10.append(n11),
      rt('contentReady', t9))
  }
  function Mt(t9) {
    if (!C || !t9) return
    let e10 = t9.el
    if (e10) {
      if ((e10.setAttribute('index', t9.index + ''), e10.parentElement !== C)) {
        let n11
        ;(s3(e10, R2.classes.slide), s3(e10, t9.class), Vt(t9))
        for (const e11 of J)
          if (e11.index > t9.index) {
            n11 = e11.el
            break
          }
        ;(C.insertBefore(e10, n11 && C.contains(n11) ? n11 : null),
          rt('attachSlideEl', t9))
      }
      return (vt(t9), e10)
    }
  }
  function wt(t9) {
    const e10 = null == t9 ? void 0 : t9.el
    e10 && (e10.remove(), jt(e10), rt('detachSlideEl', t9))
  }
  function St() {
    for (let t9 = 0; t9 < J.length; t9++) {
      const e10 = J[t9],
        n11 = e10.el
      ;(n11 &&
        (e10.index !== t9 && jt(n11), n11.setAttribute('index', `${t9}`)),
        (e10.index = t9))
    }
  }
  function At() {
    var t9, n11, i8, o9, s11
    if (!V || !C) return
    ;((k2 = it('rtl')), (F2 = it('vertical')), (z2 = F2 ? 'height' : 'width'))
    const r7 = it('classes')
    if (
      (s5(V, r7.isLTR, !k2),
      s5(V, r7.isRTL, k2),
      s5(V, r7.isHorizontal, !F2),
      s5(V, r7.isVertical, F2),
      s5(V, r7.hasAdaptiveHeight, it('adaptiveHeight')),
      ($ = 0),
      (D2 = 0),
      (I2 = 0),
      (nt = 0),
      C)
    ) {
      C.childElementCount || (C.style.display = 'grid')
      const t10 = C.getBoundingClientRect()
      $ = C.getBoundingClientRect()[z2] || 0
      const e10 = window.getComputedStyle(C)
      nt = parseFloat(e10.getPropertyValue('--f-carousel-gap')) || 0
      ;('visible' === e10.getPropertyValue('overflow-' + (F2 ? 'y' : 'x')) &&
        ((D2 = Math.abs(t10[F2 ? 'top' : 'left'])),
        (I2 = Math.abs(
          window[F2 ? 'innerHeight' : 'innerWidth'] -
            t10[F2 ? 'bottom' : 'right'],
        ))),
        (C.style.display = ''))
    }
    if (!$) return
    const l8 = (function () {
      let t10 = 0
      if (C) {
        let e10 = document.createElement('div')
        ;((e10.style.display = 'block'),
          s3(e10, R2.classes.slide),
          C.appendChild(e10),
          (t10 = e10.getBoundingClientRect()[z2]),
          e10.remove(),
          (e10 = void 0))
      }
      return t10
    })()
    for (const n12 of K) {
      const i9 = n12.el
      let o10 = 0
      if (!n12.isVirtual && i9 && n(i9)) {
        let e10 = false
        ;((i9.parentElement && i9.parentElement === C) ||
          (C.appendChild(i9), (e10 = true)),
          (o10 = i9.getBoundingClientRect()[z2]),
          e10 &&
            (null === (t9 = i9.parentElement) ||
              void 0 === t9 ||
              t9.removeChild(i9)))
      } else o10 = l8
      n12.dim = o10
    }
    if (((q2 = false), it('infinite'))) {
      q2 = true
      const t10 = ht()
      let e10 = $ + D2 + I2
      for (let i9 = 0; i9 < K.length; i9++) {
        const o10 =
          (null === (n11 = K[i9]) || void 0 === n11 ? void 0 : n11.dim) + nt
        if (t10 - o10 < e10 && t10 - o10 - e10 < o10) {
          q2 = false
          break
        }
      }
    }
    ;(!(function () {
      var t10
      if (!V) return
      const e10 = mt(),
        n12 = ht(false)
      let i9 = it('slidesPerPage')
      ;((i9 = 'auto' === i9 ? 1 / 0 : parseFloat(i9 + '')), (Z = []))
      let o10 = 0,
        s12 = 0
      for (const n13 of K)
        ((!Z.length || o10 + n13.dim - e10 > 0.05 || s12 >= i9) &&
          (Z.push({ index: Z.length, slides: [], dim: 0, offset: 0, pos: 0 }),
          (o10 = 0),
          (s12 = 0)),
          null === (t10 = Z[Z.length - 1]) ||
            void 0 === t10 ||
            t10.slides.push(n13),
          (o10 += n13.dim + nt),
          s12++)
      const r8 = it('center'),
        l9 = it('fill')
      let c6 = 0
      for (const t11 of Z) {
        t11.dim = (t11.slides.length - 1) * nt
        for (const e11 of t11.slides) t11.dim += e11.dim
        ;((t11.offset = c6),
          (t11.pos = c6),
          false !== r8 && (t11.pos -= 0.5 * (e10 - t11.dim)),
          l9 && !q2 && n12 > e10 && (t11.pos = t2(0, t11.pos, n12 - e10)),
          (c6 += t11.dim + nt))
      }
      const d3 = []
      let u6
      for (const t11 of Z) {
        const e11 = Object.assign({}, t11)
        u6 && Math.abs(e11.pos - u6.pos) < 0.1
          ? ((u6.dim += e11.dim), (u6.slides = [...u6.slides, ...e11.slides]))
          : ((u6 = e11), (e11.index = d3.length), d3.push(e11))
      }
      ;((Z = d3), (_2 = t2(0, _2, Z.length - 1)))
    })(),
      (X = (null === (i8 = Z[0]) || void 0 === i8 ? void 0 : i8.pos) || 0),
      (Y =
        (null === (o9 = Z[Z.length - 1]) || void 0 === o9 ? void 0 : o9.pos) ||
        0),
      0 === T
        ? (function () {
            var t10
            ;((L = void 0), (_2 = it('initialPage')))
            const e10 = it('initialSlide') || void 0
            ;(void 0 !== e10 && (_2 = Ft.getPageIndex(e10) || 0),
              (_2 = t2(0, _2, Z.length - 1)),
              (B2 =
                (null === (t10 = Z[_2]) || void 0 === t10 ? void 0 : t10.pos) ||
                0),
              (G = B2))
          })()
        : (G =
            (null === (s11 = Z[_2 || 0]) || void 0 === s11
              ? void 0
              : s11.pos) || 0),
      rt('refresh'),
      ft())
  }
  function jt(t9) {
    if (!t9 || !n(t9)) return
    const n11 = parseInt(t9.getAttribute('index') || '-1')
    let i8 = ''
    for (const e10 of Array.from(t9.classList)) {
      const t10 = e10.match(/^f-(\w+)(Out|In)$/)
      t10 && t10[1] && (i8 = t10[1] + '')
    }
    if (!t9 || !i8) return
    const o9 = [
      `f-${i8}Out`,
      `f-${i8}In`,
      'to-prev',
      'to-next',
      'from-prev',
      'from-next',
    ]
    ;(t9.removeEventListener('animationend', Pt),
      s4(t9, o9.join(' ')),
      Q.delete(n11))
  }
  function Lt() {
    if (!C) return
    const t9 = Q.size > 0
    for (const t10 of K) jt(t10.el)
    ;(Q.clear(), t9 && Dt())
  }
  function Pt(t9) {
    var e10
    'f-' ===
      (null === (e10 = t9.animationName) || void 0 === e10
        ? void 0
        : e10.substring(0, 2)) &&
      (jt(t9.target),
      Q.size ||
        (s4(V, 'in-transition'),
        !N2 &&
          Math.abs(Ft.getPosition(true) - G) < 0.5 &&
          ((N2 = true), rt('settle'))),
      Dt())
  }
  function Tt(t9) {
    ;(Ot(t9), rt('click', t9))
  }
  function Ot(t9) {
    var e10
    if (t9.defaultPrevented) return
    const n11 = t9.composedPath()[0]
    if (n11.closest('[data-carousel-go-prev]')) return (m2(t9), void Ft.prev())
    if (n11.closest('[data-carousel-go-next]')) return (m2(t9), void Ft.next())
    const i8 = n11.closest('[data-carousel-go-to]')
    if (i8)
      return (
        m2(t9),
        void Ft.goTo(parseFloat(i8.dataset.carouselGoTo || '') || 0)
      )
    if (n11.closest('[data-carousel-download]')) {
      m2(t9)
      const n12 =
        null === (e10 = Z[_2]) || void 0 === e10 ? void 0 : e10.slides[0]
      if (n12 && (n12.downloadSrc || ('image' === n12.type && n12.src))) {
        const t10 = n12.downloadFilename,
          e11 = document.createElement('a'),
          i9 = n12.downloadSrc || n12.src || ''
        ;((e11.href = i9),
          (e11.target = '_blank'),
          (e11.download = t10 || i9),
          e11.click())
      }
      return
    }
  }
  function Rt(t9) {
    var e10
    const n11 = t9.el
    n11 &&
      (null === (e10 = n11.querySelector('.f-spinner')) ||
        void 0 === e10 ||
        e10.remove())
  }
  function Ht(t9) {
    var e10
    const n11 = t9.el
    n11 &&
      (null === (e10 = n11.querySelector('.f-html.is-error')) ||
        void 0 === e10 ||
        e10.remove(),
      s4(n11, 'has-error'))
  }
  function Vt(t9) {
    var e10
    t9 ||
      (t9 = null === (e10 = Z[_2]) || void 0 === e10 ? void 0 : e10.slides[0])
    const i8 = null == t9 ? void 0 : t9.el
    if (!i8) return
    let o9 = it('formatCaption', t9)
    ;(void 0 === o9 && (o9 = t9.caption), (o9 = o9 || ''))
    const s11 = it('captionEl')
    if (s11 && s11 instanceof HTMLElement) {
      if (t9.index !== _2) return
      if ((t(o9) && (s11.innerHTML = ot(o9 + '')), o9 instanceof HTMLElement)) {
        if (o9.parentElement === s11) return
        ;((s11.innerHTML = ''),
          o9.parentElement && (o9 = o9.cloneNode(true)),
          s11.append(o9))
      }
      return
    }
    if (!o9) return
    let r7 = t9.captionEl || i8.querySelector('.f-caption')
    ;(!r7 &&
      o9 instanceof HTMLElement &&
      o9.classList.contains('f-caption') &&
      (r7 = o9),
      r7 ||
        ((r7 = document.createElement('div')),
        s3(r7, 'f-caption'),
        t(o9)
          ? (r7.innerHTML = ot(o9 + ''))
          : o9 instanceof HTMLElement &&
            (o9.parentElement && (o9 = o9.cloneNode(true)), r7.append(o9))))
    const l8 = `f-caption-${E2}_${t9.index}`
    ;(r7.setAttribute('id', l8),
      (r7.dataset.selectable = 'true'),
      s3(i8, 'has-caption'),
      i8.setAttribute('aria-labelledby', l8),
      (t9.captionEl = r7),
      i8.insertAdjacentElement('beforeend', r7))
  }
  function Ct(e10, i8 = {}) {
    var o9, r7
    let { transition: l8, tween: u6 } = Object.assign(
      { transition: R2.transition, tween: R2.tween },
      i8 || {},
    )
    if (!V || !A) return
    const f3 = Z.length
    if (!f3) return
    if (
      (function (t9, e11) {
        var i9, o10, s11
        if (!(V && $ && A && e11 && t(e11) && 'tween' !== e11)) return false
        for (const t10 of U) if ($ - t10.dim > 0.5) return false
        if (D2 > 0.5 || I2 > 0.5) return
        const r8 = Z.length
        let l9 = t9 > _2 ? 1 : -1
        ;((t9 = q2 ? ((t9 % r8) + r8) % r8 : t2(0, t9, r8 - 1)),
          k2 && (l9 *= -1))
        const u7 =
            null === (i9 = Z[_2]) || void 0 === i9 ? void 0 : i9.slides[0],
          f4 = null == u7 ? void 0 : u7.index,
          v5 =
            null === (o10 = Z[t9]) || void 0 === o10 ? void 0 : o10.slides[0],
          p3 = null == v5 ? void 0 : v5.index,
          g3 = null === (s11 = Z[t9]) || void 0 === s11 ? void 0 : s11.pos
        if (
          void 0 === p3 ||
          void 0 === f4 ||
          f4 === p3 ||
          B2 === g3 ||
          Math.abs($ - ((null == v5 ? void 0 : v5.dim) || 0)) > 1
        )
          return false
        ;((N2 = false), A.pause(), Lt(), s3(V, 'in-transition'), (B2 = G = g3))
        const m4 = Mt(u7),
          h4 = Mt(v5)
        return (
          ut(),
          m4 &&
            (Q.add(f4),
            (m4.style.transform = ''),
            m4.addEventListener('animationend', Pt),
            s4(m4, R2.classes.isSelected),
            (m4.inert = false),
            s3(m4, `f-${e11}Out to-${l9 > 0 ? 'next' : 'prev'}`)),
          h4 &&
            (Q.add(p3),
            (h4.style.transform = ''),
            h4.addEventListener('animationend', Pt),
            s3(h4, R2.classes.isSelected),
            (h4.inert = false),
            s3(h4, `f-${e11}In from-${l9 > 0 ? 'prev' : 'next'}`)),
          Dt(),
          true
        )
      })(e10, l8)
    )
      return
    e10 = q2 ? ((e10 % f3) + f3) % f3 : t2(0, e10, f3 - 1)
    const v4 =
      (null === (o9 = Z[e10 || 0]) || void 0 === o9 ? void 0 : o9.pos) || 0
    G = v4
    const p2 = A.isRunning() ? A.getEndValues().pos : B2
    if (Math.abs(G - p2) < 1)
      return (
        (B2 = G),
        _2 !== e10 &&
          (Vt(), (L = _2), (_2 = e10), ft(), vt(), rt('change', _2, L)),
        Dt(),
        void (N2 || ((N2 = true), rt('settle')))
      )
    if ((A.pause(), Lt(), q2)) {
      const t9 = ht(),
        e11 =
          Math.floor(
            (p2 - (null === (r7 = Z[0]) || void 0 === r7 ? void 0 : r7.pos)) /
              t9,
          ) || 0,
        n11 = G + e11 * t9
      G = [n11 + t9, n11, n11 - t9].reduce(function (t10, e12) {
        return Math.abs(e12 - p2) < Math.abs(t10 - p2) ? e12 : t10
      })
    }
    false !== l8 && t3(u6)
      ? A.spring(r3({}, R2.tween, u6))
          .from({ pos: B2 })
          .to({ pos: G })
          .start()
      : ((B2 = G), ut(), Dt(), N2 || ((N2 = true), rt('settle')))
  }
  function $t(t9) {
    var e10
    let n11 = B2
    if (q2 && true !== t9) {
      const t10 = ht()
      n11 -=
        (Math.floor(
          (B2 - (null === (e10 = Z[0]) || void 0 === e10 ? void 0 : e10.pos) ||
            0) / t10,
        ) || 0) * t10
    }
    return n11
  }
  function Dt() {
    var t9
    if (!V || !C) return
    U = bt()
    const e10 = /* @__PURE__ */ new Set(),
      n11 = [],
      i8 = Z[_2],
      s11 = R2.setTransform
    let l8
    for (const o9 of K) {
      const s12 = Q.has(o9.index),
        r7 = U.indexOf(o9) > -1,
        a7 =
          (null === (t9 = null == i8 ? void 0 : i8.slides) || void 0 === t9
            ? void 0
            : t9.indexOf(o9)) > -1
      if (o9.isVirtual && !s12 && !r7) continue
      let c6 = Mt(o9)
      if (c6 && (n11.push(o9), a7 && e10.add(c6), it('adaptiveHeight') && a7)) {
        const t10 = (c6.lastElementChild || c6).getBoundingClientRect().height
        l8 = null == l8 ? t10 : Math.max(l8, t10)
      }
    }
    ;(C && l8 && (C.style.height = `${l8}px`),
      [...e7(C, `.${R2.classes.slide}`)].forEach(t10 => {
        s5(t10, R2.classes.isSelected, e10.has(t10))
        const n12 = J[parseInt(t10.getAttribute('index') || '-1')]
        if (!n12) return (t10.remove(), void jt(t10))
        const i9 = Q.has(n12.index),
          o9 = U.indexOf(n12) > -1
        if (n12.isVirtual && !i9 && !o9) return void wt(n12)
        if (((t10.inert = !o9), false === s11)) return
        let l9 = n12.pos ? Math.round(1e4 * n12.pos) / 1e4 : 0,
          a7 = 0,
          c6 = 0,
          d3 = 0,
          f3 = 0
        ;(i9 ||
          ((a7 = F2 ? 0 : k2 ? -1 * l9 : l9),
          (c6 = F2 ? l9 : 0),
          (d3 = t5(a7, 0, n12.dim, 0, 100)),
          (f3 = t5(c6, 0, n12.dim, 0, 100))),
          s11 instanceof Function && !i9
            ? s11(Ft, n12, { x: a7, y: c6, xPercent: d3, yPercent: f3 })
            : (t10.style.transform =
                a7 || c6 ? `translate3d(${d3}%, ${f3}%,0)` : ''))
      }),
      rt('render', n11))
  }
  function It() {
    ;(null == V || V.removeEventListener('click', Tt),
      document.removeEventListener('mousemove', at),
      Q.clear(),
      null == j2 || j2.disconnect(),
      (j2 = void 0))
    for (const t9 of J) {
      let n11 = t9.el
      n11 &&
        n(n11) &&
        ((t9.state = void 0),
        Rt(t9),
        Ht(t9),
        t9.isVirtual
          ? (wt(t9), (t9.el = void 0))
          : (jt(n11),
            (n11.style.transform = ''),
            C && !C.contains(n11) && C.appendChild(n11)))
    }
    for (const t9 of Object.values(H2)) null == t9 || t9.destroy()
    ;((H2 = {}),
      null == S2 || S2.destroy(),
      (S2 = void 0),
      null == A || A.destroy(),
      (A = void 0))
    for (const [t9, e10] of Object.entries(R2.classes || {}))
      'container' !== t9 && s4(V, e10)
    s4(C, 'is-draggable')
  }
  function qt() {
    return q2 || _2 > 0
  }
  function kt() {
    return q2 || _2 < Z.length - 1
  }
  const Ft = {
    add: function (t9, e10) {
      var n11
      let i8 = B2
      const o9 = _2,
        s11 = ht(),
        r7 = (null == A ? void 0 : A.isRunning()) ? A.getEndValues().pos : B2,
        l8 =
          (s11 &&
            Math.floor(
              (r7 -
                ((null === (n11 = Z[0]) || void 0 === n11 ? void 0 : n11.pos) ||
                  0)) /
                s11,
            )) ||
          0
      return (
        yt(t9, e10),
        dt(W),
        At(),
        A &&
          s11 &&
          (o9 === _2 && (i8 -= l8 * s11),
          i8 === G
            ? (B2 = G)
            : A.spring({
                clamp: true,
                mass: 1,
                tension: 300,
                friction: 25,
                restDelta: 1,
                restSpeed: 1,
              })
                .from({ pos: i8 })
                .to({ pos: G })
                .start()),
        Dt(),
        Ft
      )
    },
    canGoPrev: qt,
    canGoNext: kt,
    destroy: function () {
      return (
        rt('destroy'),
        window.removeEventListener('resize', lt),
        It(),
        st.clear(),
        (V = null),
        (Z = []),
        (J = []),
        (R2 = Object.assign({}, h2)),
        (H2 = {}),
        (K = []),
        (P = void 0),
        (W = '*'),
        (T = 2),
        Ft
      )
    },
    emit: rt,
    filter: function (t9 = '*') {
      return (dt(t9), At(), (B2 = t2(X, B2, Y)), Dt(), rt('filter', t9), Ft)
    },
    getContainer: function () {
      return V
    },
    getGapDim: gt,
    getGestures: function () {
      return S2
    },
    getLastMouseMove: function () {
      return b2
    },
    getOption: function (t9) {
      return it(t9)
    },
    getOptions: function () {
      return R2
    },
    getPage: function () {
      return Z[_2]
    },
    getPageIndex: function (t9) {
      if (void 0 !== t9) {
        for (const e10 of Z || [])
          for (const n11 of e10.slides) if (n11.index === t9) return e10.index
        return -1
      }
      return _2
    },
    getPageIndexFromPosition: pt,
    getPageProgress: function (t9, e10) {
      var n11
      void 0 === t9 && (t9 = _2)
      const i8 = Z[t9]
      if (!i8) return t9 > _2 ? -1 : 1
      const o9 = ht(),
        s11 = gt()
      let r7 = i8.pos,
        l8 = $t()
      if (q2 && true !== e10) {
        const t10 =
          Math.floor(
            (l8 -
              (null === (n11 = Z[0]) || void 0 === n11 ? void 0 : n11.pos)) /
              o9,
          ) || 0
        ;((l8 -= t10 * o9),
          (r7 = [r7 + o9, r7, r7 - o9].reduce(function (t11, e11) {
            return Math.abs(e11 - l8) < Math.abs(t11 - l8) ? e11 : t11
          })))
      }
      return (l8 - r7) / (i8.dim + s11) || 0
    },
    getPageVisibility: function (t9) {
      var e10
      void 0 === t9 && (t9 = _2)
      const n11 = Z[t9]
      if (!n11) return t9 > _2 ? -1 : 1
      const i8 = $t(),
        o9 = mt()
      let s11 = n11.pos
      if (q2) {
        const t10 = ht(),
          n12 =
            s11 +
            (Math.floor(
              (i8 -
                (null === (e10 = Z[0]) || void 0 === e10 ? void 0 : e10.pos)) /
                t10,
            ) || 0) *
              t10
        s11 = [n12 + t10, n12, n12 - t10].reduce(function (t11, e11) {
          return Math.abs(e11 - i8) < Math.abs(t11 - i8) ? e11 : t11
        })
      }
      return s11 > i8 && s11 + n11.dim < i8 + o9
        ? 1
        : s11 < i8
          ? (s11 + n11.dim - i8) / n11.dim || 0
          : (s11 + n11.dim > i8 + o9 && (i8 + o9 - s11) / n11.dim) || 0
    },
    getPages: function () {
      return Z
    },
    getPlugins: function () {
      return H2
    },
    getPosition: $t,
    getSlides: function () {
      return J
    },
    getState: function () {
      return T
    },
    getTotalSlideDim: ht,
    getTween: function () {
      return A
    },
    getViewport: function () {
      return C
    },
    getViewportDim: mt,
    getVisibleSlides: function (t9) {
      return void 0 === t9 ? U : bt(t9)
    },
    goTo: Ct,
    hasNavigated: function () {
      return void 0 !== L
    },
    hideError: Ht,
    hideLoading: Rt,
    init: function () {
      if (!g2 || !n(g2)) throw new Error('No Element found')
      return (
        0 !== T && (It(), (T = 0)),
        (V = g2),
        (O2 = M4),
        window.removeEventListener('resize', lt),
        O2.breakpoints && window.addEventListener('resize', lt),
        lt(),
        Ft
      )
    },
    isInfinite: function () {
      return q2
    },
    isInTransition: function () {
      return Q.size > 0
    },
    isRTL: function () {
      return k2
    },
    isSettled: function () {
      return N2
    },
    isVertical: function () {
      return F2
    },
    localize: ot,
    next: function (t9 = {}) {
      return (Ct(_2 + 1, t9), Ft)
    },
    off: function (t9, e10) {
      for (const n11 of t9 instanceof Array ? t9 : [t9])
        st.has(n11) &&
          st.set(
            n11,
            st.get(n11).filter(t10 => t10 !== e10),
          )
      return Ft
    },
    on: function (t9, e10) {
      for (const n11 of t9 instanceof Array ? t9 : [t9])
        st.set(n11, [...(st.get(n11) || []), e10])
      return Ft
    },
    prev: function (t9 = {}) {
      return (Ct(_2 - 1, t9), Ft)
    },
    reInit: function (e10 = {}, n11) {
      return (
        It(),
        (T = 0),
        (P = void 0),
        (W = '*'),
        (M4 = e10),
        (O2 = e10),
        t3(n11) && (w3 = n11),
        lt(),
        Ft
      )
    },
    remove: function (t9) {
      void 0 === t9 && (t9 = J.length - 1)
      const e10 = J[t9]
      return (
        e10 &&
          (rt('removeSlide', e10),
          e10.el && (jt(e10.el), e10.el.remove(), (e10.el = void 0)),
          J.splice(t9, 1),
          dt(W),
          At(),
          (B2 = t2(X, B2, Y)),
          Dt()),
        Ft
      )
    },
    setPosition: function (t9) {
      ;((B2 = t9), ut(), Dt())
    },
    showError: function (t9, e10) {
      if (1 === T) {
        ;(Rt(t9), Ht(t9))
        const n11 = t9.el
        if (n11) {
          const i8 = document.createElement('div')
          ;(s3(i8, 'f-html'),
            s3(i8, 'is-error'),
            (i8.innerHTML = ot(e10 || '<p>{{ERROR}}</p>')),
            (t9.htmlEl = i8),
            s3(n11, 'has-html has-error'),
            n11.insertAdjacentElement('afterbegin', i8),
            rt('contentReady', t9))
        }
      }
      return Ft
    },
    showLoading: function (t9) {
      const e10 = t9.el,
        n11 = null == e10 ? void 0 : e10.querySelector('.f-spinner')
      if (!e10 || n11) return Ft
      const i8 = it('spinnerTpl'),
        o9 = e2(i8)
      return (
        o9 && (s3(o9, 'f-spinner'), e10.insertAdjacentElement('beforeend', o9)),
        Ft
      )
    },
    version: '6.1.14',
  }
  return Ft
}
;((x2.l10n = { en_EN: o3 }), (x2.getDefaults = () => h2))

// node_modules/@fancyapps/ui/dist/utils/scrollLock.js
var t6 = (
  t9 = true,
  e10 = '--f-scrollbar-compensate',
  s11 = '--f-body-margin',
  o9 = 'hide-scrollbar',
) => {
  const n11 = document,
    r7 = n11.body,
    l8 = n11.documentElement
  if (t9) {
    if (r7.classList.contains(o9)) return
    let t10 = window.innerWidth - l8.getBoundingClientRect().width
    ;(t10 < 0 && (t10 = 0), l8.style.setProperty(e10, `${t10}px`))
    const n12 = parseFloat(window.getComputedStyle(r7).marginRight)
    ;(n12 && r7.style.setProperty(s11, `${n12}px`), r7.classList.add(o9))
  } else
    (r7.classList.remove(o9),
      r7.style.setProperty(s11, ''),
      n11.documentElement.style.setProperty(e10, ''))
}

// node_modules/@fancyapps/ui/dist/utils/canUseDOM.js
function e8() {
  return !(
    'undefined' == typeof window ||
    !window.document ||
    !window.document.createElement
  )
}

// node_modules/@fancyapps/ui/dist/utils/replaceAll.js
var n5 = function (n11 = '', t9 = '', o9 = '') {
  return n11.split(t9).join(o9)
}

// node_modules/@fancyapps/ui/dist/carousel/carousel.zoomable.js
var a3 = {
  tpl: t9 => `<img class="f-panzoom__content" 
    ${t9.srcset ? 'data-lazy-srcset="{{srcset}}"' : ''} 
    ${t9.sizes ? 'data-lazy-sizes="{{sizes}}"' : ''} 
    data-lazy-src="{{src}}" alt="{{alt}}" />`,
}
var s6 = () => {
  let s11
  function l8(e10, o9) {
    const n11 = null == s11 ? void 0 : s11.getOptions().Zoomable
    let i8 = (t3(n11) ? Object.assign(Object.assign({}, a3), n11) : a3)[e10]
    return i8 && 'function' == typeof i8 && o9 ? i8(o9) : i8
  }
  function c6() {
    s11 &&
      false !== s11.getOptions().Zoomable &&
      (s11.on('addSlide', f3),
      s11.on('removeSlide', u6),
      s11.on('attachSlideEl', g2),
      s11.on('click', d3),
      s11.on('change', r7),
      s11.on('ready', r7))
  }
  function r7() {
    m4()
    const t9 = (null == s11 ? void 0 : s11.getVisibleSlides()) || []
    if (
      t9.length > 1 ||
      'slide' === (null == s11 ? void 0 : s11.getOption('transition'))
    )
      for (const e10 of t9) {
        const t10 = e10.panzoomRef
        t10 &&
          ((null == s11 ? void 0 : s11.getPage().slides) || []).indexOf(e10) <
            0 &&
          t10.execute(v.ZoomTo, Object.assign({}, t10.getStartPosition()))
      }
  }
  function d3(t9, e10) {
    const o9 = e10.target
    o9 &&
      !e10.defaultPrevented &&
      o9.dataset.panzoomAction &&
      p2(o9.dataset.panzoomAction)
  }
  function f3(t9, i8) {
    const a7 = i8.el
    if (!s11 || !a7 || i8.panzoomRef) return
    const c7 = i8.src || i8.lazySrc || '',
      r8 = i8.alt || i8.caption || `Image #${i8.index}`,
      d4 = i8.srcset || i8.lazySrcset || '',
      f4 = i8.sizes || i8.lazySizes || ''
    if (c7 && t(c7) && !i8.html && (!i8.type || 'image' === i8.type)) {
      ;((i8.type = 'image'), (i8.thumbSrc = i8.thumbSrc || c7))
      let t10 = l8('tpl', i8)
      ;((t10 = n5(t10, '{{src}}', c7 + '')),
        (t10 = n5(t10, '{{srcset}}', d4 + '')),
        (t10 = n5(t10, '{{sizes}}', f4 + '')),
        a7.insertAdjacentHTML('afterbegin', t10))
    }
    const u7 = a7.querySelector('.f-panzoom__content')
    if (!u7) return
    u7.setAttribute('alt', r8 + '')
    const g3 =
        i8.width && 'auto' !== i8.width ? parseFloat(i8.width + '') : 'auto',
      p3 =
        i8.height && 'auto' !== i8.height ? parseFloat(i8.height + '') : 'auto',
      z2 = S(
        a7,
        Object.assign(
          {
            width: g3,
            height: p3,
            classes: { container: 'f-zoomable' },
            event: () => (null == s11 ? void 0 : s11.getLastMouseMove()),
            spinnerTpl: () =>
              (null == s11 ? void 0 : s11.getOption('spinnerTpl')) || '',
          },
          l8('Panzoom'),
        ),
      )
    ;(z2.on('*', (t10, e10, ...o9) => {
      s11 &&
        ('loading' === e10 && (i8.state = 0),
        'loaded' === e10 && (i8.state = 1),
        'error' === e10 &&
          ((i8.state = 2), null == s11 || s11.showError(i8, '{{IMAGE_ERROR}}')),
        s11.emit(`panzoom:${e10}`, i8, ...o9),
        'loading' === e10 && s11.emit('contentLoading', i8),
        'ready' === e10 && s11.emit('contentReady', i8),
        i8.index === (null == s11 ? void 0 : s11.getPageIndex()) && m4())
    }),
      (i8.panzoomRef = z2))
  }
  function u6(t9, e10) {
    e10.panzoomRef && (e10.panzoomRef.destroy(), (e10.panzoomRef = void 0))
  }
  function g2(t9, e10) {
    const o9 = e10.panzoomRef
    if (o9)
      switch (o9.getState()) {
        case 0:
          o9.init()
          break
        case 3:
          o9.execute(
            v.ZoomTo,
            Object.assign(Object.assign({}, o9.getStartPosition()), {
              velocity: 0,
            }),
          )
      }
  }
  function m4() {
    var t9, e10
    const o9 = (null == s11 ? void 0 : s11.getContainer()) || void 0,
      n11 =
        null ===
          (e10 =
            null === (t9 = null == s11 ? void 0 : s11.getPage()) ||
            void 0 === t9
              ? void 0
              : t9.slides[0]) || void 0 === e10
          ? void 0
          : e10.panzoomRef
    if (o9)
      if (n11) n11.updateControls(o9)
      else
        for (const t10 of o9.querySelectorAll('[data-panzoom-action]') || [])
          (t10.setAttribute('aria-disabled', ''),
            t10.setAttribute('tabindex', '-1'))
  }
  function p2(t9, ...e10) {
    var o9
    null === (o9 = null == s11 ? void 0 : s11.getPage().slides[0].panzoomRef) ||
      void 0 === o9 ||
      o9.execute(t9, ...e10)
  }
  return {
    init: function (t9) {
      ;((s11 = t9), s11.on('initPlugins', c6))
    },
    destroy: function () {
      if (s11) {
        ;(s11.off('initPlugins', c6),
          s11.off('addSlide', f3),
          s11.off('removeSlide', u6),
          s11.off('attachSlideEl', g2),
          s11.off('click', d3),
          s11.off('change', r7),
          s11.off('ready', r7))
        for (const t9 of s11.getSlides()) u6(0, t9)
      }
      s11 = void 0
    },
    execute: p2,
  }
}

// node_modules/@fancyapps/ui/dist/carousel/carousel.sync.js
var e9 = { syncOnChange: false, syncOnClick: true, syncOnHover: false }
var i3 = () => {
  let i8, t9
  function o9() {
    const t10 = null == i8 ? void 0 : i8.getOptions().Sync
    return t3(t10) ? Object.assign(Object.assign({}, e9), t10) : e9
  }
  function s11(n11) {
    var e10, s12, l9
    i8 &&
      n11 &&
      ((t9 = n11),
      (i8.getOptions().classes = Object.assign(
        Object.assign({}, i8.getOptions().classes),
        { isSelected: '' },
      )),
      (i8.getOptions().initialSlide =
        (null ===
          (s12 =
            null === (e10 = t9.getPage()) || void 0 === e10
              ? void 0
              : e10.slides[0]) || void 0 === s12
          ? void 0
          : s12.index) || 0),
      o9().syncOnChange && i8.on('change', c6),
      o9().syncOnClick && i8.on('click', g2),
      o9().syncOnHover &&
        (null === (l9 = i8.getViewport()) ||
          void 0 === l9 ||
          l9.addEventListener('mouseover', u6)),
      (function () {
        if (!i8 || !t9) return
        ;(i8.on('ready', d3),
          i8.on('refresh', a7),
          t9.on('change', r7),
          t9.on('filter', f3))
      })())
  }
  function l8() {
    const n11 = o9().target
    i8 && n11 && s11(n11)
  }
  function d3() {
    v4()
  }
  function c6() {
    var n11
    if (i8 && t9) {
      const e10 =
          (null === (n11 = i8.getPage()) || void 0 === n11
            ? void 0
            : n11.slides) || [],
        o10 = t9.getPageIndex(e10[0].index || 0)
      ;(o10 > -1 &&
        t9.goTo(
          o10,
          i8.hasNavigated() ? void 0 : { tween: false, transition: false },
        ),
        v4())
    }
  }
  function r7() {
    var n11
    if (i8 && t9) {
      const e10 = i8.getPageIndex(
        (null === (n11 = t9.getPage()) || void 0 === n11
          ? void 0
          : n11.slides[0].index) || 0,
      )
      ;(e10 > -1 &&
        i8.goTo(
          e10,
          t9.hasNavigated() ? void 0 : { tween: false, transition: false },
        ),
        v4())
    }
  }
  function g2(n11, e10) {
    var o10
    if (!i8 || !t9) return
    if (
      null === (o10 = i8.getTween()) || void 0 === o10
        ? void 0
        : o10.isRunning()
    )
      return
    const s12 = null == i8 ? void 0 : i8.getOptions().classes.slide
    if (!s12) return
    const l9 = e10.target.closest(`.${s12}`)
    if (l9) {
      const n12 = parseInt(l9.getAttribute('index') || '') || 0,
        e11 = t9.getPageIndex(n12)
      t9.goTo(e11)
    }
  }
  function u6(n11) {
    i8 && g2(0, n11)
  }
  function a7() {
    var n11
    if (i8 && t9) {
      const e10 = i8.getPageIndex(
        (null === (n11 = t9.getPage()) || void 0 === n11
          ? void 0
          : n11.slides[0].index) || 0,
      )
      ;(e10 > -1 && i8.goTo(e10, { tween: false, transition: false }), v4())
    }
  }
  function f3(n11, e10) {
    i8 && t9 && (i8.filter(e10), r7())
  }
  function v4() {
    var n11, e10, o10
    if (!t9) return
    const s12 =
      (null ===
        (e10 =
          null === (n11 = t9.getPage()) || void 0 === n11
            ? void 0
            : n11.slides[0]) || void 0 === e10
        ? void 0
        : e10.index) || 0
    for (const n12 of (null == i8 ? void 0 : i8.getSlides()) || [])
      null === (o10 = n12.el) ||
        void 0 === o10 ||
        o10.classList.toggle('is-selected', n12.index === s12)
  }
  return {
    init: function (n11) {
      ;((i8 = n11), i8.on('initSlides', l8))
    },
    destroy: function () {
      var n11
      ;(null == i8 || i8.off('ready', d3),
        null == i8 || i8.off('refresh', a7),
        null == i8 || i8.off('change', c6),
        null == i8 || i8.off('click', g2),
        null === (n11 = null == i8 ? void 0 : i8.getViewport()) ||
          void 0 === n11 ||
          n11.removeEventListener('mouseover', u6),
        null == t9 || t9.off('change', r7),
        null == t9 || t9.off('filter', f3),
        (t9 = void 0),
        null == i8 || i8.off('initSlides', l8),
        (i8 = void 0))
    },
    getTarget: function () {
      return t9
    },
  }
}

// node_modules/@fancyapps/ui/dist/carousel/carousel.lazyload.js
var s7 = { showLoading: true, preload: 1 }
var l2 = 'is-lazyloading'
var o4 = 'is-lazyloaded'
var n6 = 'has-lazyerror'
var i4 = () => {
  let i8
  function d3() {
    const e10 = null == i8 ? void 0 : i8.getOptions().Lazyload
    return t3(e10) ? Object.assign(Object.assign({}, s7), e10) : s7
  }
  function r7(t9) {
    var s11
    const r8 = t9.el
    if (!r8) return
    const c7 = d3(),
      u6 = '[data-lazy-src],[data-lazy-srcset],[data-lazy-bg]',
      f3 = Array.from(r8.querySelectorAll(u6))
    r8.matches(u6) && f3.push(r8)
    for (const d4 of f3) {
      const r9 = d4.dataset.lazySrc,
        u7 = d4.dataset.lazySrcset,
        f4 = d4.dataset.lazySizes,
        y3 = d4.dataset.lazyBg,
        z2 =
          (d4 instanceof HTMLImageElement || d4 instanceof HTMLSourceElement) &&
          (r9 || u7),
        g2 = !!y3
      if (!z2 && !g2) continue
      const m4 = r9 || u7 || y3
      if (m4) {
        if (z2) {
          const y4 =
            null === (s11 = d4.parentElement) || void 0 === s11
              ? void 0
              : s11.classList.contains('f-panzoom__wrapper')
          ;(c7.showLoading && (null == i8 || i8.showLoading(t9)),
            d4.addEventListener('load', () => {
              ;(null == i8 || i8.hideLoading(t9),
                s4(d4, n6),
                d4 instanceof HTMLImageElement
                  ? d4
                      .decode()
                      .finally(() => {
                        ;(s4(d4, l2), s3(d4, o4))
                      })
                      .catch(() => {})
                  : (s4(d4, l2), s3(d4, o4)),
                y4 || null == i8 || i8.emit('lazyLoad:loaded', t9, d4, m4))
            }),
            d4.addEventListener('error', () => {
              ;(null == i8 || i8.hideLoading(t9),
                s4(d4, l2),
                s3(d4, n6),
                y4 || null == i8 || i8.emit('lazyLoad:error', t9, d4, m4))
            }),
            d4.classList.add('f-lazyload'),
            d4.classList.add(l2),
            y4 || null == i8 || i8.emit('lazyLoad:load', t9, d4, m4),
            r9 && (d4.src = r9),
            u7 && (d4.srcset = u7),
            f4 && (d4.sizes = f4))
        } else g2 && (d4.style.backgroundImage = `url('${y3}')`)
        ;(delete d4.dataset.lazySrc,
          delete d4.dataset.lazySrcset,
          delete d4.dataset.lazySizes,
          delete d4.dataset.lazyBg)
      }
    }
  }
  function c6() {
    if (!i8) return
    const e10 = [...i8.getVisibleSlides()],
      t9 = d3().preload
    if (t9 > 0) {
      const a7 = i8.getPosition(),
        s11 = i8.getViewportDim()
      e10.push(
        ...i8.getVisibleSlides(a7 + s11 * t9),
        ...i8.getVisibleSlides(a7 - s11 * t9),
      )
    }
    for (const t10 of e10) r7(t10)
  }
  return {
    init: function (e10) {
      ;((i8 = e10), i8.on('render', c6))
    },
    destroy: function () {
      ;(null == i8 || i8.off('render', c6), (i8 = void 0))
    },
  }
}

// node_modules/@fancyapps/ui/dist/carousel/carousel.arrows.js
var i5 = '<svg width="24" height="24" viewBox="0 0 24 24" tabindex="-1">'
var r4 = '</svg>'
var s8 = {
  prevTpl: i5 + '<path d="M15 3l-9 9 9 9"></path>' + r4,
  nextTpl: i5 + '<path d="M9 3l9 9-9 9"></path>' + r4,
}
var l3 = () => {
  let i8, r7, l8
  function a7(o9) {
    const r8 = (function () {
        const t9 = null == i8 ? void 0 : i8.getOptions().Arrows
        return t3(t9) ? Object.assign(Object.assign({}, s8), t9) : s8
      })(),
      l9 =
        `<button data-carousel-go-${o9} tabindex="0" class="f-button is-arrow is-${o9}" title="{{${o9.toUpperCase()}}}">` +
        r8[`${o9}Tpl`] +
        '</button>',
      a8 = e2(i8.localize(l9)) || void 0
    return (a8 && s3(a8, r8[`${o9}Class`]), a8)
  }
  function u6() {
    var t9
    ;(null == r7 || r7.remove(),
      (r7 = void 0),
      null == l8 || l8.remove(),
      (l8 = void 0),
      null === (t9 = null == i8 ? void 0 : i8.getContainer()) ||
        void 0 === t9 ||
        t9.classList.remove('has-arrows'))
  }
  function c6() {
    i8 && false !== i8.getOptions().Arrows && i8.getPages().length > 1
      ? (!(function () {
          if (!i8) return
          const t9 = i8.getViewport()
          t9 &&
            (r7 ||
              ((r7 = a7('prev')),
              r7 && t9.insertAdjacentElement('beforebegin', r7)),
            l8 ||
              ((l8 = a7('next')),
              l8 && t9.insertAdjacentElement('afterend', l8)),
            s5(i8.getContainer(), 'has-arrows', true))
        })(),
        i8 &&
          (null == r7 || r7.toggleAttribute('aria-disabled', !i8.canGoPrev()),
          null == l8 || l8.toggleAttribute('aria-disabled', !i8.canGoNext())))
      : u6()
  }
  return {
    init: function (t9) {
      i8 = t9.on(['change', 'refresh'], c6)
    },
    destroy: function () {
      ;(u6(), null == i8 || i8.off(['change', 'refresh'], c6), (i8 = void 0))
    },
  }
}

// node_modules/@fancyapps/ui/dist/shared/buttons.js
var t7 = '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.35-4.35M8 11h6"/>'
var M2 = '<g><line x1="11" y1="8" x2="11" y2="14"></line></g>' + t7
var o5 = {
  moveLeft: ['moveLeft', 'MOVE_LEFT', '<path d="M5 12h14M5 12l6 6M5 12l6-6"/>'],
  moveRight: [
    'moveRight',
    'MOVE_RIGHT',
    '<path d="M5 12h14M13 18l6-6M13 6l6 6"/>',
  ],
  moveUp: ['moveUp', 'MOVE_UP', '<path d="M12 5v14M18 11l-6-6M6 11l6-6"/>'],
  moveDown: [
    'moveDown',
    'MOVE_DOWN',
    '<path d="M12 5v14M18 13l-6 6M6 13l6 6"/>',
  ],
  zoomOut: ['zoomOut', 'ZOOM_OUT', t7],
  zoomIn: ['zoomIn', 'ZOOM_IN', M2],
  toggleFull: ['toggleFull', 'TOGGLE_FULL', M2],
  iterateZoom: ['iterateZoom', 'ITERATE_ZOOM', M2],
  toggle1to1: [
    'toggleFull',
    'TOGGLE_FULL',
    '<path d="M3.51 3.07c5.74.02 11.48-.02 17.22.02 1.37.1 2.34 1.64 2.18 3.13 0 4.08.02 8.16 0 12.23-.1 1.54-1.47 2.64-2.79 2.46-5.61-.01-11.24.02-16.86-.01-1.36-.12-2.33-1.65-2.17-3.14 0-4.07-.02-8.16 0-12.23.1-1.36 1.22-2.48 2.42-2.46Z"/><path d="M5.65 8.54h1.49v6.92m8.94-6.92h1.49v6.92M11.5 9.4v.02m0 5.18v0"/>',
  ],
  rotateCCW: [
    'rotateCCW',
    'ROTATE_CCW',
    '<path d="M15 4.55a8 8 0 0 0-6 14.9M9 15v5H4M18.37 7.16v.01M13 19.94v.01M16.84 18.37v.01M19.37 15.1v.01M19.94 11v.01"/>',
  ],
  rotateCW: [
    'rotateCW',
    'ROTATE_CW',
    '<path d="M9 4.55a8 8 0 0 1 6 14.9M15 15v5h5M5.63 7.16v.01M4.06 11v.01M4.63 15.1v.01M7.16 18.37v.01M11 19.94v.01"/>',
  ],
  flipX: [
    'flipX',
    'FLIP_X',
    '<path d="M12 3v18M16 7v10h5L16 7M8 7v10H3L8 7"/>',
  ],
  flipY: [
    'flipY',
    'FLIP_Y',
    '<path d="M3 12h18M7 16h10L7 21v-5M7 8h10L7 3v5"/>',
  ],
  reset: [
    'reset',
    'RESET',
    '<path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/>',
  ],
  toggleFS: [
    'toggleFS',
    'TOGGLE_FS',
    '<g><path d="M14.5 9.5 21 3m0 0h-6m6 0v6M3 21l6.5-6.5M3 21v-6m0 6h6"/></g><g><path d="m14 10 7-7m-7 7h6m-6 0V4M3 21l7-7m0 0v6m0-6H4"/></g>',
  ],
}
var v2 = {}
for (const t9 of Object.keys(o5)) {
  const M4 = o5[t9]
  v2[t9] = {
    tpl: `<button data-panzoom-action="${M4[0]}" class="f-button" title="{{${M4[1]}}}"><svg>${M4[2]}</svg></button>`,
  }
}

// node_modules/@fancyapps/ui/dist/carousel/carousel.toolbar.js
var a4
!(function (t9) {
  ;((t9.Left = 'left'), (t9.middle = 'middle'), (t9.right = 'right'))
})(a4 || (a4 = {}))
var r5 = Object.assign(
  {
    counter: {
      tpl: '<div class="f-counter"><span data-carousel-page></span>/<span data-carousel-pages></span></div>',
    },
    download: {
      tpl: '<button data-carousel-download class="f-button" title="{{DOWNLOAD}}"><svg><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12"/></svg></button>',
    },
    autoplay: {
      tpl: '<button data-autoplay-action="toggle" class="f-button" title="{{TOGGLE_AUTOPLAY}}"><svg><g><path d="M5 3.5 19 12 5 20.5Z"/></g><g><path d="M8 4v15M17 4v15"/></g></svg></button>',
    },
    thumbs: {
      tpl: '<button data-thumbs-action="toggle" class="f-button" title="{{TOGGLE_THUMBS}}"><svg><rect width="18" height="14" x="3" y="3" rx="2"/><path d="M4 21h1M9 21h1M14 21h1M19 21h1"/></svg></button>',
    },
  },
  v2,
)
var u3 = {
  absolute: false,
  display: {
    left: [],
    middle: [
      'zoomIn',
      'zoomOut',
      'toggle1to1',
      'rotateCCW',
      'rotateCW',
      'flipX',
      'flipY',
      'reset',
    ],
    right: [],
  },
  enabled: 'auto',
  items: {},
}
var c3 = () => {
  let a7, c6
  function d3(e10) {
    const o9 = null == a7 ? void 0 : a7.getOptions().Toolbar
    let n11 = (t3(o9) ? Object.assign(Object.assign({}, u3), o9) : u3)[e10]
    return n11 && 'function' == typeof n11 && a7 ? n11(a7) : n11
  }
  function f3() {
    var s11
    if (!a7 || c6) return
    if (false === (null == a7 ? void 0 : a7.getOptions().Toolbar)) return
    const u6 = a7.getContainer()
    if (!u6) return
    let f4 = d3('enabled')
    if (!f4) return
    const p2 = d3('absolute'),
      g2 = a7.getSlides().length > 1
    let b3 = false,
      m4 = false
    for (const t9 of a7.getSlides())
      (t9.panzoomRef && (b3 = true),
        (t9.downloadSrc || ('image' === t9.type && t9.src)) && (m4 = true))
    const v4 =
        (null === (s11 = a7.getPlugins().Thumbs) || void 0 === s11
          ? void 0
          : s11.isEnabled()) || false,
      h4 = (g2 && a7.getPlugins().Autoplay) || false,
      j2 =
        a7.getPlugins().Fullscreen &&
        (document.fullscreenEnabled || document.webkitFullscreenEnabled)
    if (('auto' === f4 && (f4 = b3), !f4)) return
    ;((c6 = u6.querySelector('.f-carousel__toolbar') || void 0),
      c6 ||
        ((c6 = document.createElement('div')), s3(c6, 'f-carousel__toolbar')))
    const E3 = d3('display'),
      y3 = r3({}, r5, d3('items'))
    for (const l8 of ['left', 'middle', 'right']) {
      const s12 = E3[l8] || [],
        r7 = document.createElement('div')
      s3(r7, `f-carousel__toolbar__column is-${l8}`)
      for (const l9 of s12) {
        let i8
        if (t(l9)) {
          if ('counter' === l9 && !g2) continue
          if ('autoplay' === l9 && !h4) continue
          if (v2[l9] && !b3) continue
          if ('fullscreen' === l9 && !j2) continue
          if ('thumbs' === l9 && !v4) continue
          if ('download' === l9 && !m4) continue
          i8 = y3[l9]
        }
        if ((t3(l9) && (i8 = l9), i8 && i8.tpl)) {
          let t9 = a7.localize(i8.tpl)
          t9 = t9
            .split('<svg>')
            .join(
              '<svg tabindex="-1" width="24" height="24" viewBox="0 0 24 24">',
            )
          const e10 = e2(t9)
          e10 &&
            ('function' == typeof i8.click &&
              a7 &&
              e10.addEventListener('click', t10 => {
                ;(t10.preventDefault(),
                  t10.stopPropagation(),
                  'function' == typeof i8.click && a7 && i8.click(a7, t10))
              }),
            r7.append(e10))
        }
      }
      c6.append(r7)
    }
    if (c6.childElementCount) {
      if ((p2 && s3(c6, 'is-absolute'), !c6.parentElement)) {
        const t9 = d3('parentEl')
        t9
          ? t9.insertAdjacentElement('afterbegin', c6)
          : u6.insertAdjacentElement('afterbegin', c6)
      }
      u6.contains(c6) &&
        (s3(u6, 'has-toolbar'), p2 && s3(u6, 'has-absolute-toolbar'))
    }
  }
  return {
    init: function (t9) {
      ;((a7 = t9), null == a7 || a7.on('initSlides', f3))
    },
    destroy: function () {
      ;(null == a7 || a7.off('initSlides', f3),
        s4(
          null == a7 ? void 0 : a7.getContainer(),
          'has-toolbar has-absolute-toolbar',
        ),
        null == c6 || c6.remove(),
        (c6 = void 0))
    },
    add: function (t9, e10) {
      r5[t9] = e10
    },
    isEnabled: function () {
      return !!c6
    },
  }
}

// node_modules/@fancyapps/ui/dist/carousel/carousel.autoplay.js
var n7 = {
  autoStart: true,
  pauseOnHover: true,
  showProgressbar: true,
  timeout: 2e3,
}
var o6 = () => {
  let o9,
    i8,
    a7 = false,
    s11 = false,
    l8 = false,
    r7 = null
  function u6(e10) {
    const i9 = null == o9 ? void 0 : o9.getOptions().Autoplay
    let a8 = (t3(i9) ? Object.assign(Object.assign({}, n7), i9) : n7)[e10]
    return a8 && 'function' == typeof a8 && o9 ? a8(o9) : a8
  }
  function f3() {
    ;(clearTimeout(i8), (i8 = void 0))
  }
  function g2() {
    if (
      !o9 ||
      !a7 ||
      l8 ||
      s11 ||
      i8 ||
      !o9.isSettled() ||
      (function () {
        var t10
        const e10 =
          (null === (t10 = null == o9 ? void 0 : o9.getPage()) || void 0 === t10
            ? void 0
            : t10.slides) || []
        for (const t11 of e10) if (0 === t11.state) return true
        return false
      })()
    )
      return
    !(function () {
      var t10, n11, i9, a8
      if (!o9) return
      if ((v4(), !u6('showProgressbar'))) return
      let s12 = u6('progressbarParentEl')
      !s12 &&
        (null === (t10 = o9.getPlugins().Toolbar) || void 0 === t10
          ? void 0
          : t10.isEnabled()) &&
        (s12 = o9.getContainer())
      if (
        !s12 &&
        true !==
          (null === (n11 = o9.getPlugins().Toolbar) || void 0 === n11
            ? void 0
            : n11.isEnabled())
      ) {
        const t11 =
            (null === (i9 = o9.getPages()[0]) || void 0 === i9
              ? void 0
              : i9.slides) || [],
          e10 =
            (null === (a8 = o9.getPage()) || void 0 === a8
              ? void 0
              : a8.slides) || []
        1 === t11.length && 1 === e10.length && (s12 = e10[0].el)
      }
      s12 || (s12 = o9.getViewport())
      if (!s12) return
      ;((r7 = document.createElement('div')),
        s3(r7, 'f-progressbar'),
        s12.prepend(r7))
      const l9 = u6('timeout') || 1e3
      r7.style.animationDuration = `${l9}ms`
    })()
    const t9 = u6('timeout')
    i8 = setTimeout(() => {
      o9 &&
        a7 &&
        !s11 &&
        (o9.isInfinite() || o9.getPageIndex() !== o9.getPages().length - 1
          ? o9.next()
          : o9.goTo(0))
    }, t9)
  }
  function c6() {
    var t9
    if (!o9 || o9.getPages().length < 2 || false === o9.getOptions().Autoplay)
      return
    if (a7) return
    ;((a7 = true),
      o9.emit('autoplay:start', u6('timeout')),
      s3(o9.getContainer(), 'has-autoplay'),
      null === (t9 = o9.getTween()) || void 0 === t9 || t9.on('start', b3))
    const n11 = null == o9 ? void 0 : o9.getContainer()
    ;(n11 &&
      u6('pauseOnHover') &&
      matchMedia('(hover: hover)').matches &&
      (n11.addEventListener('mouseenter', E3, false),
      n11.addEventListener('mouseleave', w3, false)),
      o9.on('change', P),
      o9.on('settle', y3),
      o9.on('contentReady', p2),
      o9.on('panzoom:touchStart', d3),
      o9.on('panzoom:wheel', d3),
      o9.isSettled() && g2())
  }
  function d3() {
    var t9
    if ((f3(), v4(), o9)) {
      if (a7) {
        ;(o9.emit('autoplay:end'),
          null === (t9 = o9.getTween()) || void 0 === t9 || t9.off('start', b3))
        const e10 = o9.getContainer()
        e10 &&
          (e10.classList.remove('has-autoplay'),
          e10.removeEventListener('mouseenter', E3, false),
          e10.removeEventListener('mouseleave', w3, false))
      }
      ;(o9.off('change', P),
        o9.off('settle', y3),
        o9.off('contentReady', p2),
        o9.off('panzoom:touchStart', d3),
        o9.off('panzoom:wheel', d3))
    }
    ;((a7 = false), (s11 = false))
  }
  function v4() {
    r7 && (r7.remove(), (r7 = null))
  }
  function m4() {
    o9 && o9.getPages().length > 1 && u6('autoStart') && c6()
  }
  function p2() {
    g2()
  }
  function h4(t9, e10) {
    const n11 = e10.target
    n11 &&
      !e10.defaultPrevented &&
      'toggle' === n11.dataset.autoplayAction &&
      O2.toggle()
  }
  function P() {
    !o9 ||
    (!(null == o9 ? void 0 : o9.isInfinite()) &&
      o9.getPageIndex() === o9.getPages().length - 1)
      ? d3()
      : (f3(), v4())
  }
  function y3() {
    g2()
  }
  function b3() {
    ;(f3(), v4())
  }
  function E3() {
    ;((l8 = true), a7 && (f3(), v4()))
  }
  function w3() {
    ;((l8 = false),
      a7 && !s11 && (null == o9 ? void 0 : o9.isSettled()) && g2())
  }
  const O2 = {
    init: function (t9) {
      ;((o9 = t9), o9.on('ready', m4), o9.on('click', h4))
    },
    destroy: function () {
      ;(d3(),
        null == o9 || o9.off('ready', m4),
        null == o9 || o9.off('click', h4),
        (o9 = void 0))
    },
    isEnabled: () => a7,
    pause: function () {
      ;((s11 = true), f3(), v4())
    },
    resume: function () {
      ;((s11 = false), a7 && !l8 && g2())
    },
    start() {
      c6()
    },
    stop() {
      d3()
    },
    toggle() {
      a7 ? d3() : c6()
    },
  }
  return O2
}

// node_modules/@fancyapps/ui/dist/carousel/carousel.thumbs.js
var u4 = {
  Carousel: { Lazyload: { showLoading: false } },
  minCount: 2,
  showOnStart: true,
  thumbTpl:
    '<button aria-label="Slide to #{{page}}"><img draggable="false" alt="{{alt}}" data-lazy-src="{{src}}" /></button>',
  type: 'modern',
}
var a5
var c4 = () => {
  let c6,
    d3,
    f3,
    m4,
    g2,
    h4 = 0,
    v4 = 0,
    p2 = true
  function b3(e10) {
    const n11 = null == c6 ? void 0 : c6.getOptions().Thumbs
    let o9 = (t3(n11) ? Object.assign(Object.assign({}, u4), n11) : u4)[e10]
    return o9 && 'function' == typeof o9 && c6 ? o9(c6) : o9
  }
  function y3() {
    if (!c6) return false
    if (false === (null == c6 ? void 0 : c6.getOptions().Thumbs)) return false
    let t9 = 0
    for (const e10 of c6.getSlides()) e10.thumbSrc && t9++
    return t9 >= b3('minCount')
  }
  function x3() {
    return 'modern' === b3('type')
  }
  function S2() {
    return 'scrollable' === b3('type')
  }
  function C() {
    const t9 = [],
      e10 = (null == c6 ? void 0 : c6.getSlides()) || []
    for (const n11 of e10)
      t9.push({ index: n11.index, class: n11.thumbClass, html: T(n11) })
    return t9
  }
  function T(t9) {
    const e10 = t9.thumb
        ? t9.thumb instanceof HTMLImageElement
          ? t9.thumb.src
          : t9.thumb
        : t9.thumbSrc || void 0,
      o9 =
        void 0 === t9.thumbAlt
          ? `Thumbnail #${(t9.index || 0) + 1}`
          : t9.thumbAlt + ''
    let i8 = b3('thumbTpl')
    return (
      (i8 = n5(i8, '{{alt}}', o9)),
      (i8 = n5(i8, '{{src}}', e10 + '')),
      (i8 = n5(i8, '{{index}}', `${t9.index || 0}`)),
      (i8 = n5(i8, '{{page}}', `${(t9.index || 0) + 1}`)),
      i8
    )
  }
  function L(t9) {
    return `<div index="${t9.index || 0}" class="f-thumbs__slide ${t9.class || ''}">${t9.html || ''}</div>`
  }
  function E3(t9 = false) {
    var e10
    const n11 = null == c6 ? void 0 : c6.getContainer()
    if (!c6 || !n11 || f3 || !y3()) return
    const o9 =
      (null === (e10 = b3('Carousel')) || void 0 === e10
        ? void 0
        : e10.classes) || {}
    if (((o9.container = o9.container || 'f-thumbs'), !f3)) {
      const t10 = n11.nextElementSibling
      ;(null == t10 ? void 0 : t10.classList.contains(o9.container)) &&
        (f3 = t10)
    }
    if (!f3) {
      f3 = document.createElement('div')
      const t10 = b3('parentEl')
      t10
        ? t10.insertAdjacentElement('beforeend', f3)
        : n11.insertAdjacentElement('afterend', f3)
    }
    ;(s3(f3, o9.container),
      s3(f3, 'f-thumbs'),
      s3(f3, `is-${b3('type')}`),
      t9 && s3(f3, 'is-hidden'))
  }
  function P() {
    if (!f3 || !S2()) return
    ;((m4 = document.createElement('div')), s3(m4, 'f-thumbs__viewport'))
    let t9 = ''
    for (const e10 of C()) {
      'string' == typeof (e10.html || '') && (t9 += L(e10))
    }
    ;((m4.innerHTML = t9),
      f3.append(m4),
      f3.addEventListener('click', t10 => {
        t10.preventDefault()
        const e10 = t10.target.closest('[index]'),
          n11 = parseInt(
            (null == e10 ? void 0 : e10.getAttribute('index')) || '-1',
          )
        c6 && n11 > -1 && c6.goTo(n11)
      }),
      (g2 = new IntersectionObserver(
        t10 => {
          t10.forEach(t11 => {
            t11.isIntersecting &&
              t11.target instanceof HTMLImageElement &&
              ((t11.target.src = t11.target.getAttribute('data-lazy-src') + ''),
              t11.target.removeAttribute('data-lazy-src'),
              null == g2 || g2.unobserve(t11.target))
          })
        },
        { root: m4, rootMargin: '100px' },
      )),
      f3.querySelectorAll('[data-lazy-src]').forEach(t10 => {
        null == g2 || g2.observe(t10)
      }),
      null == c6 || c6.emit('thumbs:ready'))
  }
  function w3() {
    var t9
    if (!a5 || !c6 || !f3 || S2() || d3) return
    const n11 = C()
    if (!n11.length) return
    const o9 = r3(
      {},
      {
        Sync: { target: c6 },
        Lazyload: { preload: 1 },
        slides: n11,
        classes: {
          container: 'f-thumbs',
          viewport: 'f-thumbs__viewport',
          slide: 'f-thumbs__slide',
        },
        center: true,
        fill: !x3(),
        infinite: false,
        dragFree: true,
        rtl: c6.getOptions().rtl || false,
        slidesPerPage: t10 => {
          let e10 = 0
          return (
            x3() &&
              (!(function () {
                if (!x3()) return
                if (!f3) return
                const t11 = t12 =>
                  (f3 &&
                    parseFloat(
                      getComputedStyle(f3).getPropertyValue('--f-thumb-' + t12),
                    )) ||
                  0
                ;((h4 = t11('width')), (v4 = t11('clip-width')))
              })(),
              (e10 = 4 * (h4 - v4))),
            t10 && t10.getTotalSlideDim() <= t10.getViewportDim() - e10
              ? 1 / 0
              : 1
          )
        },
      },
      u4.Carousel || {},
      b3('Carousel') || {},
    )
    ;((d3 = a5(f3, o9, { Sync: i3, Lazyload: i4 })),
      d3.on('ready', () => {
        ;(s3(f3, 'is-syncing'),
          null == c6 || c6.emit('thumbs:ready'),
          x3() && (null == c6 || c6.on('render', $)))
      }),
      d3.on('destroy', () => {
        null == c6 || c6.emit('thumbs:destroy')
      }),
      d3.init(),
      null === (t9 = d3.getGestures()) ||
        void 0 === t9 ||
        t9.on('start', () => {
          p2 = false
        }),
      d3.on('click', (t10, e10) => {
        const n12 = e10.target
        if (n12) {
          const t11 = n12.matches('button') ? n12 : n12.firstElementChild
          t11 &&
            t11.matches('button') &&
            (e10.preventDefault(), t11.focus({ preventScroll: true }))
        }
      }),
      s3(c6.getContainer(), 'has-thumbs'),
      R2())
  }
  function j2() {
    y3() && b3('showOnStart') && (E3(), P())
  }
  function A() {
    var t9
    y3() &&
      (w3(),
      null == c6 || c6.on('addSlide', z2),
      null == c6 || c6.on('removeSlide', _2),
      null == c6 || c6.on('click', I2),
      null == c6 || c6.on('refresh', q2),
      null === (t9 = null == c6 ? void 0 : c6.getGestures()) ||
        void 0 === t9 ||
        t9.on('start', M4),
      D2(true))
  }
  function M4() {
    var t9, e10
    p2 = true
    ;(null === (t9 = document.activeElement) || void 0 === t9
      ? void 0
      : t9.closest('.f-thumbs')) &&
      (null === (e10 = document.activeElement) || void 0 === e10 || e10.blur())
  }
  function $() {
    var t9, e10
    ;(null == f3 ||
      f3.classList.toggle(
        'is-syncing',
        false === (null == c6 ? void 0 : c6.hasNavigated()) ||
          (null === (t9 = null == c6 ? void 0 : c6.getTween()) || void 0 === t9
            ? void 0
            : t9.isRunning()),
      ),
      R2(),
      (null === (e10 = null == c6 ? void 0 : c6.getGestures()) || void 0 === e10
        ? void 0
        : e10.isPointerDown()) &&
        (function () {
          if (!x3()) return
          if (!c6 || !d3) return
          if (!p2) return
          const t10 = d3.getTween(),
            e11 = d3.getPages(),
            n11 = c6.getPageIndex() || 0,
            i8 = c6.getPageProgress() || 0
          if (!(c6 && e11 && e11[n11] && t10)) return
          const l8 = t10.isRunning()
            ? t10.getCurrentValues().pos
            : d3.getPosition()
          if (void 0 === l8) return
          let r7 = e11[n11].pos + i8 * (h4 - v4)
          ;((r7 = t2(e11[0].pos, r7, e11[e11.length - 1].pos)),
            t10.from({ pos: l8 }).to({ pos: r7 }).start())
        })())
  }
  function O2() {
    ;((p2 = true), D2())
  }
  function z2(t9, e10) {
    const n11 = { html: T(e10) }
    if (d3) d3.add(n11, e10.index)
    else if (m4) {
      const t10 = e2(L(n11))
      if (t10) {
        m4.append(t10)
        const e11 = t10.querySelector('img')
        e11 && (null == g2 || g2.observe(e11))
      }
    }
  }
  function _2(t9, e10) {
    var n11
    d3
      ? d3.remove(e10.index)
      : m4 &&
        (null === (n11 = m4.querySelector(`[index="${e10.index}"]`)) ||
          void 0 === n11 ||
          n11.remove())
  }
  function I2(t9, e10) {
    var n11
    const o9 = e10.target
    e10.defaultPrevented ||
      'toggle' !==
        (null === (n11 = null == o9 ? void 0 : o9.dataset) || void 0 === n11
          ? void 0
          : n11.thumbsAction) ||
      (f3 || (E3(true), P(), w3()), f3 && f3.classList.toggle('is-hidden'))
  }
  function q2() {
    D2()
  }
  function D2(t9 = false) {
    if (!c6 || !m4 || !S2()) return
    const e10 = c6.getPageIndex()
    m4.querySelectorAll('.is-selected').forEach(t10 => {
      t10.classList.remove('is-selected')
    })
    const n11 = m4.querySelector(`[index="${e10}"]`)
    if (n11) {
      n11.classList.add('is-selected')
      const e11 = m4.getBoundingClientRect(),
        o9 = n11.getBoundingClientRect(),
        i8 = n11.offsetTop - m4.offsetTop - 0.5 * e11.height + 0.5 * o9.height,
        l8 = n11.scrollLeft - m4.scrollLeft - 0.5 * e11.width + 0.5 * o9.width
      m4.scrollTo({ top: i8, left: l8, behavior: t9 ? 'instant' : 'smooth' })
    }
  }
  function R2() {
    if (!x3()) return
    if (!c6 || !d3) return
    const t9 = (null == d3 ? void 0 : d3.getSlides()) || []
    let e10 = -0.5 * h4
    for (const n11 of t9) {
      const t10 = n11.el
      if (!t10) continue
      let o9 = c6.getPageProgress(n11.index) || 0
      ;((o9 = Math.max(-1, Math.min(1, o9))),
        o9 > -1 && o9 < 1 && (e10 += 0.5 * h4 * (1 - Math.abs(o9))),
        (o9 = Math.round(1e4 * o9) / 1e4),
        (e10 = Math.round(1e4 * e10) / 1e4),
        t10.style.setProperty('--progress', `${Math.abs(o9)}`),
        t10.style.setProperty(
          '--shift',
          `${(null == c6 ? void 0 : c6.isRTL()) ? -1 * e10 : e10}px`,
        ),
        o9 > -1 && o9 < 1 && (e10 += 0.5 * h4 * (1 - Math.abs(o9))))
    }
  }
  return {
    init: function (t9, e10) {
      ;((a5 = e10),
        (c6 = t9),
        c6.on('ready', A),
        c6.on('initSlides', j2),
        c6.on('change', O2))
    },
    destroy: function () {
      var t9, e10
      ;(S2() && (null == c6 || c6.emit('thumbs:destroy')),
        null == c6 || c6.off('ready', A),
        null == c6 || c6.off('initSlides', j2),
        null == c6 || c6.off('change', O2),
        null == c6 || c6.off('render', $),
        null == c6 || c6.off('addSlide', z2),
        null == c6 || c6.off('click', I2),
        null == c6 || c6.off('refresh', q2),
        null === (t9 = null == c6 ? void 0 : c6.getGestures()) ||
          void 0 === t9 ||
          t9.off('start', M4),
        null === (e10 = null == c6 ? void 0 : c6.getContainer()) ||
          void 0 === e10 ||
          e10.classList.remove('has-thumbs'),
        (c6 = void 0),
        null == d3 || d3.destroy(),
        (d3 = void 0),
        null == f3 || f3.remove(),
        (f3 = void 0))
    },
    getCarousel: function () {
      return d3
    },
    getContainer: function () {
      return f3
    },
    getType: function () {
      return b3('type')
    },
    isEnabled: y3,
  }
}

// node_modules/@fancyapps/ui/dist/carousel/carousel.html.js
var n8 = {
  autosize: false,
  iframeAttr: { allow: 'autoplay; fullscreen', scrolling: 'auto' },
  preload: false,
}
var l4 = () => {
  let l8
  function s11() {
    const e10 = null == l8 ? void 0 : l8.getOptions().Html
    return t3(e10) ? r3({}, n8, e10) : n8
  }
  function r7() {
    return false !== (null == l8 ? void 0 : l8.getOptions().Html)
  }
  function d3(t9) {
    return 'iframe' === t9.type || 'pdf' === t9.type || 'gmap' === t9.type
  }
  function c6(t9) {
    const e10 = `${t9}`
    return e10.match(/^\d+$/) ? `${e10}px` : e10
  }
  function p2(t9) {
    if (void 0 === t9 || '' === t9) return
    const e10 = `${t9}`.trim()
    if (!e10.match(/^\d+(\.\d+)?(px)?$/)) return
    const o9 = parseFloat(e10)
    return Number.isFinite(o9) ? o9 : void 0
  }
  function h4(t9, e10) {
    var o9
    const i8 = null !== (o9 = t9[e10]) && void 0 !== o9 ? o9 : s11()[e10]
    return 'true' === i8 || ('false' !== i8 && i8)
  }
  function m4(t9, o9) {
    if (!r7()) return
    let i8 = o9.type,
      a7 = o9.src
    if (!i8 && t(a7)) {
      if (
        ('#' === a7.charAt(0)
          ? (i8 = 'inline')
          : a7.match(
                /(^data:image\/[a-z0-9+\/=]*,)|(\.((a)?png|avif|gif|jp(g|eg)|pjp(eg)?|jfif|svg|webp|bmp|ico|tif(f)?)((\?|#).*)?$)/i,
              )
            ? (i8 = 'image')
            : a7.match(/\.(pdf)((\?|#).*)?$/i)
              ? (i8 = 'pdf')
              : a7.match(/\.(html|php)((\?|#).*)?$/i) && (i8 = 'iframe'),
        !i8)
      ) {
        const t10 = a7.match(
          /(?:maps\.)?google\.([a-z]{2,3}(?:\.[a-z]{2})?)\/(?:(?:(?:maps\/(?:place\/(?:.*)\/)?\@(.*),(\d+\.?\d+?)z))|(?:\?ll=))(.*)?/i,
        )
        t10 &&
          ((a7 = `https://maps.google.${t10[1]}/?ll=${(t10[2] ? t10[2] + '&z=' + Math.floor(parseFloat(t10[3])) + (t10[4] ? t10[4].replace(/^\//, '&') : '') : t10[4] + '').replace(/\?/, '&')}&output=${t10[4] && t10[4].indexOf('layer=c') > 0 ? 'svembed' : 'embed'}`),
          (i8 = 'gmap'))
      }
      if (!i8) {
        const t10 = a7.match(
          /(?:maps\.)?google\.([a-z]{2,3}(?:\.[a-z]{2})?)\/(?:maps\/search\/)(.*)/i,
        )
        t10 &&
          ((a7 = `https://maps.google.${t10[1]}/maps?q=${t10[2].replace('query=', 'q=').replace('api=1', '')}&output=embed`),
          (i8 = 'gmap'))
      }
      i8 && ((o9.src = a7), (o9.type = i8))
    }
  }
  function f3(t9, e10) {
    r7() &&
      d3(e10) &&
      (function (t10) {
        const e11 = t10.el,
          o9 = t10.src
        if (!l8 || !e11 || !o9) return
        const n11 = document.createElement('iframe')
        s3(n11, 'f-iframe')
        for (const [t11, e12] of Object.entries(s11().iframeAttr || {}))
          n11.setAttribute(t11, e12)
        n11.onerror = () => {
          ;((t10.state = 2),
            null == l8 || l8.showError(t10, '{{IFRAME_ERROR}}'))
        }
        const r8 = document.createElement('div')
        ;(s3(r8, 'f-html'),
          r8.append(n11),
          (t10.htmlEl = r8),
          (t10.contentEl = n11),
          s3(e11, `has-html has-iframe has-${t10.type}`),
          e11.prepend(r8),
          y3(t10))
        const d4 = h4(t10, 'preload'),
          c7 = h4(t10, 'autosize')
        'iframe' === t10.type && (d4 || c7)
          ? ((t10.state = 0),
            l8.showLoading(t10),
            s3(e11, 'is-loading'),
            (n11.onload = () => {
              if (
                !l8 ||
                2 === l8.getState() ||
                !n11.src.length ||
                t10.contentEl !== n11 ||
                !n11.isConnected
              )
                return
              t10.state = 1
              const o10 = 'true' !== n11.dataset.ready
              ;((n11.dataset.ready = 'true'),
                v4(t10),
                l8.hideLoading(t10),
                o10 && l8.emit('contentReady', t10),
                s4(e11, 'is-loading'))
            }),
            (n11.src = `${o9}`))
          : ((n11.src = `${o9}`), l8.emit('contentReady', t10))
      })(e10)
  }
  function u6(t9, e10) {
    var o9, i8
    if (d3(e10)) {
      const t10 = e10.el
      ;(null == l8 || l8.hideError(e10),
        null === (o9 = e10.contentEl) || void 0 === o9 || o9.remove(),
        (e10.contentEl = void 0),
        null === (i8 = e10.htmlEl) || void 0 === i8 || i8.remove(),
        (e10.htmlEl = void 0),
        t10 &&
          (s4(t10, 'has-html has-iframe has-pdf has-gmap'),
          s4(t10, 'is-loading')))
    }
  }
  function g2() {
    for (const t9 of (null == l8 ? void 0 : l8.getSlides()) || [])
      d3(t9) && (y3(t9), 1 === t9.state && v4(t9))
  }
  function y3(t9) {
    const e10 = t9.htmlEl
    if (
      e10 &&
      d3(t9) &&
      ((e10.style.aspectRatio = ''),
      (e10.style.width = ''),
      (e10.style.height = ''),
      (e10.style.maxWidth = ''),
      (e10.style.maxHeight = ''),
      t9.width && (e10.style.maxWidth = c6(t9.width)),
      t9.height && (e10.style.maxHeight = c6(t9.height)),
      t9.aspectRatio)
    ) {
      const o9 = t9.aspectRatio.split('/'),
        i8 = parseFloat(o9[0].trim()),
        a7 = o9[1] ? parseFloat(o9[1].trim()) : 0,
        n11 = i8 && a7 ? i8 / a7 : i8
      e10.offsetHeight
      const l9 = e10.getBoundingClientRect(),
        s12 = n11 < (l9.width || 1) / (l9.height || 1)
      ;((e10.style.aspectRatio = `${t9.aspectRatio}`),
        (e10.style.width = s12 ? 'auto' : ''),
        (e10.style.height = s12 ? '' : 'auto'))
    }
  }
  function v4(t9) {
    const e10 = t9.contentEl,
      o9 = null == e10 ? void 0 : e10.parentElement,
      i8 = null == o9 ? void 0 : o9.style
    let a7 = h4(t9, 'autosize'),
      n11 = p2(t9.width) || 0,
      l9 = p2(t9.height) || 0
    if ((n11 && l9 && (a7 = false), e10 && o9 && i8 && a7)) {
      try {
        const t10 = window.getComputedStyle(o9),
          a8 = parseFloat(t10.paddingLeft) + parseFloat(t10.paddingRight),
          s12 = parseFloat(t10.paddingTop) + parseFloat(t10.paddingBottom),
          r8 = e10.contentWindow
        if (r8) {
          const t11 = r8.document,
            e11 = t11.getElementsByTagName('html')[0],
            o10 = t11.body
          i8.width = ''
          const d4 = window.getComputedStyle(o10),
            c7 = parseFloat(d4.marginLeft) + parseFloat(d4.marginRight),
            p3 = o10.style.overflow || ''
          ;((o10.style.overflow = 'hidden'),
            (n11 = n11 || o10.scrollWidth + c7 + a8),
            (i8.flex = '0 0 auto'),
            (i8.width = `${n11}px`),
            (i8.height = `${o10.scrollHeight}px`),
            (o10.style.overflow = p3))
          l9 =
            Math.max(
              e11.scrollHeight,
              Math.ceil(e11.getBoundingClientRect().height),
            ) + s12
        }
      } catch (t10) {}
      ;(n11 || l9) &&
        Object.assign(i8, {
          flex: '0 1 auto',
          width: n11 ? `${n11}px` : '',
          height: l9 ? `${l9}px` : '',
        })
    }
  }
  return {
    init: function (t9) {
      ;((l8 = t9),
        l8.on('addSlide', m4),
        l8.on('attachSlideEl', f3),
        l8.on('detachSlideEl', u6),
        l8.on('refresh', g2))
    },
    destroy: function () {
      ;(null == l8 || l8.off('addSlide', m4),
        null == l8 || l8.off('attachSlideEl', f3),
        null == l8 || l8.off('detachSlideEl', u6),
        null == l8 || l8.off('refresh', g2),
        (l8 = void 0))
    },
  }
}

// node_modules/@fancyapps/ui/dist/carousel/carousel.video.js
var i6 = (t9, e10 = {}) => {
  const o9 = new URL(t9),
    n11 = new URLSearchParams(o9.search),
    i8 = new URLSearchParams()
  for (const [t10, o10] of [...n11, ...Object.entries(e10)]) {
    let e11 = o10 + ''
    if ('t' === t10) {
      let t11 = e11.match(/((\d*)m)?(\d*)s?/)
      t11 &&
        i8.set(
          'start',
          60 * parseInt(t11[2] || '0') + parseInt(t11[3] || '0') + '',
        )
    } else i8.set(t10, e11)
  }
  let l8 = i8 + '',
    s11 = t9.match(/#t=((.*)?\d+s)/)
  return (s11 && (l8 += `#t=${s11[1]}`), l8)
}
var l5 = {
  autoplay: false,
  html5videoTpl: `<video class="f-html5video" playsinline controls controlsList="nodownload" poster="{{poster}}">
    <source src="{{src}}" type="{{format}}" />Sorry, your browser doesn't support embedded videos.</video>`,
  iframeAttr: {
    allow: 'autoplay; fullscreen',
    scrolling: 'no',
    referrerPolicy: 'strict-origin-when-cross-origin',
    credentialless: '',
  },
  vimeo: { byline: 1, color: '00adef', controls: 1, dnt: 1, muted: 0 },
  youtube: { controls: 1, enablejsapi: 1, nocookie: 1, rel: 0, fs: 1 },
}
var s9 = () => {
  let s11,
    r7 = false
  function c6() {
    const t9 = null == s11 ? void 0 : s11.getOptions().Video
    return t3(t9) ? Object.assign(Object.assign({}, l5), t9) : l5
  }
  function a7() {
    var t9
    return null === (t9 = null == s11 ? void 0 : s11.getPage()) || void 0 === t9
      ? void 0
      : t9.slides[0]
  }
  const d3 = t9 => {
    var e10
    try {
      let o9 = JSON.parse(t9.data)
      if ('https://player.vimeo.com' === t9.origin) {
        if ('ready' === o9.event)
          for (let o10 of Array.from(
            (null === (e10 = null == s11 ? void 0 : s11.getContainer()) ||
            void 0 === e10
              ? void 0
              : e10.getElementsByClassName('f-iframe')) || [],
          ))
            o10 instanceof HTMLIFrameElement &&
              o10.contentWindow === t9.source &&
              (o10.dataset.ready = 'true')
      } else if (
        t9.origin.match(/^https:\/\/(www.)?youtube(-nocookie)?.com$/) &&
        'onReady' === o9.event
      ) {
        const t10 = document.getElementById(o9.id)
        t10 && (t10.dataset.ready = 'true')
      }
    } catch (t10) {}
  }
  function m4(t9, e10) {
    const n11 = e10.src
    if (!t(n11)) return
    let l8 = e10.type
    if (!l8 || 'html5video' === l8) {
      const t10 = n11.match(/\.(mp4|mov|ogv|webm)((\?|#).*)?$/i)
      t10 &&
        ((l8 = 'html5video'),
        (e10.html5videoFormat =
          e10.html5videoFormat ||
          'video/' + ('ogv' === t10[1] ? 'ogg' : t10[1])))
    }
    if (!l8 || 'youtube' === l8) {
      const t10 = n11.match(
        /(youtube\.com|youtu\.be|youtube\-nocookie\.com)\/(?:watch\?(?:.*&)?v=|v\/|u\/|shorts\/|embed\/?)?(videoseries\?list=(?:.*)|[\w-]{11}|\?listType=(?:.*)&list=(?:.*))(?:.*)/i,
      )
      if (t10) {
        const o9 = Object.assign(
            Object.assign({}, c6().youtube),
            e10.youtube || {},
          ),
          s12 = `www.youtube${o9.nocookie ? '-nocookie' : ''}.com`,
          r8 = i6(n11, o9),
          a8 = encodeURIComponent(t10[2])
        ;((e10.videoId = a8),
          (e10.src = `https://${s12}/embed/${a8}?${r8}`),
          (e10.thumb =
            e10.thumb || `https://i.ytimg.com/vi/${a8}/mqdefault.jpg`),
          (l8 = 'youtube'))
      }
    }
    if (!l8 || 'vimeo' === l8) {
      const t10 = n11.match(
        /^.+vimeo.com\/(?:\/)?(video\/)?([\d]+)((\/|\?h=)([a-z0-9]+))?(.*)?/,
      )
      if (t10) {
        const o9 = Object.assign(
            Object.assign({}, c6().vimeo),
            e10.vimeo || {},
          ),
          s12 = i6(n11, o9),
          r8 = encodeURIComponent(t10[2]),
          a8 = t10[5] || ''
        ;((e10.videoId = r8),
          (e10.src = `https://player.vimeo.com/video/${r8}?${a8 ? `h=${a8}${s12 ? '&' : ''}` : ''}${s12}`),
          (l8 = 'vimeo'))
      }
    }
    e10.type = l8
  }
  function u6(e10, i8) {
    ;('html5video' === i8.type &&
      (function (e11) {
        const i9 = e11.el,
          l8 = e11.src
        if (!s11 || !i9 || !l8) return
        const r8 = e11.html5videoTpl || c6().html5videoTpl,
          a8 = e11.html5videoFormat || c6().html5videoFormat
        if (!r8) return
        const d4 = e11.poster || (e11.thumb && t(e11.thumb) ? e11.thumb : ''),
          m5 = e2(
            r8
              .replace(/\{\{src\}\}/gi, l8 + '')
              .replace(/\{\{format\}\}/gi, a8 || '')
              .replace(/\{\{poster\}\}/gi, d4 + ''),
          )
        if (!m5) return
        const u7 = document.createElement('div')
        ;(s3(u7, 'f-html'),
          u7.append(m5),
          (e11.contentEl = m5),
          (e11.htmlEl = u7),
          s3(i9, `has-${e11.type}`),
          i9.prepend(u7),
          v4(e11),
          s11.emit('contentReady', e11))
      })(i8),
      ('youtube' !== i8.type && 'vimeo' !== i8.type) ||
        (function (e11) {
          const o9 = e11.el,
            n11 = e11.src
          if (!s11 || !o9 || !n11) return
          const i9 = document.createElement('iframe')
          ;(s3(i9, 'f-iframe'),
            i9.setAttribute('id', `f-iframe_${e11.videoId}`))
          for (const [t9, e12] of Object.entries(c6().iframeAttr || {}))
            i9.setAttribute(t9, e12)
          ;('youtube' === e11.type &&
            (i9.onload = () => {
              var t9
              1 === (null == s11 ? void 0 : s11.getState()) &&
                (null === (t9 = i9.contentWindow) ||
                  void 0 === t9 ||
                  t9.postMessage(
                    JSON.stringify({
                      event: 'listening',
                      id: i9.getAttribute('id'),
                    }),
                    '*',
                  ))
            }),
            (i9.onerror = () => {
              null == s11 || s11.showError(e11, '{{IFRAME_ERROR}}')
            }))
          const l8 = document.createElement('div')
          ;(s3(l8, 'f-html'),
            l8.append(i9),
            (e11.contentEl = i9),
            (e11.htmlEl = l8),
            s3(o9, `has-html has-iframe has-${e11.type}`),
            (i9.src = `${e11.src}`),
            o9.prepend(l8),
            v4(e11),
            s11.emit('contentReady', e11))
        })(i8))
  }
  function f3(t9, e10) {
    var o9, n11
    ;(('html5video' !== e10.type &&
      'youtube' !== e10.type &&
      'vimeo' !== e10.type) ||
      (null === (o9 = e10.contentEl) || void 0 === o9 || o9.remove(),
      (e10.contentEl = void 0),
      null === (n11 = e10.htmlEl) || void 0 === n11 || n11.remove(),
      (e10.htmlEl = void 0)),
      e10.poller && clearTimeout(e10.poller))
  }
  function p2() {
    r7 = false
  }
  function h4() {
    if (r7) return
    r7 = true
    const t9 = a7()
    ;(t9 && void 0 !== t9.autoplay ? t9.autoplay : c6().autoplay) &&
      ((function () {
        var t10
        const e10 = a7(),
          o9 = null == e10 ? void 0 : e10.el
        if (o9 && 'html5video' === (null == e10 ? void 0 : e10.type))
          try {
            const t11 = o9.querySelector('video')
            if (t11) {
              const e11 = t11.play()
              void 0 !== e11 &&
                e11
                  .then(() => {})
                  .catch(e12 => {
                    ;((t11.muted = true), t11.play())
                  })
            }
          } catch (t11) {}
        const n11 = null == e10 ? void 0 : e10.htmlEl
        n11 instanceof HTMLIFrameElement &&
          (null === (t10 = n11.contentWindow) ||
            void 0 === t10 ||
            t10.postMessage(
              '{"event":"command","func":"stopVideo","args":""}',
              '*',
            ))
      })(),
      (function () {
        const t10 = a7(),
          e10 = null == t10 ? void 0 : t10.type
        if (
          !(null == t10 ? void 0 : t10.el) ||
          ('youtube' !== e10 && 'vimeo' !== e10)
        )
          return
        const o9 = () => {
          if (
            t10.contentEl &&
            t10.contentEl instanceof HTMLIFrameElement &&
            t10.contentEl.contentWindow
          ) {
            let e11
            if ('true' === t10.contentEl.dataset.ready)
              return (
                (e11 =
                  'youtube' === t10.type
                    ? { event: 'command', func: 'playVideo' }
                    : { method: 'play', value: 'true' }),
                e11 &&
                  t10.contentEl.contentWindow.postMessage(
                    JSON.stringify(e11),
                    '*',
                  ),
                void (t10.poller = void 0)
              )
            'youtube' === t10.type &&
              ((e11 = {
                event: 'listening',
                id: t10.contentEl.getAttribute('id'),
              }),
              t10.contentEl.contentWindow.postMessage(JSON.stringify(e11), '*'))
          }
          t10.poller = setTimeout(o9, 250)
        }
        o9()
      })())
  }
  function v4(t9) {
    const e10 = null == t9 ? void 0 : t9.htmlEl
    if (
      t9 &&
      e10 &&
      ('html5video' === t9.type || 'youtube' === t9.type || 'vimeo' === t9.type)
    ) {
      if (
        ((e10.style.aspectRatio = ''),
        (e10.style.width = ''),
        (e10.style.height = ''),
        (e10.style.maxWidth = ''),
        (e10.style.maxHeight = ''),
        t9.width)
      ) {
        let o9 = `${t9.width}`
        ;(o9.match(/^\d+$/) && (o9 += 'px'), (e10.style.maxWidth = `${o9}`))
      }
      if (t9.height) {
        let o9 = `${t9.height}`
        ;(o9.match(/^\d+$/) && (o9 += 'px'), (e10.style.maxHeight = `${o9}`))
      }
      if (t9.aspectRatio) {
        const o9 = t9.aspectRatio.split('/'),
          n11 = parseFloat(o9[0].trim()),
          i8 = o9[1] ? parseFloat(o9[1].trim()) : 0,
          l8 = n11 && i8 ? n11 / i8 : n11
        e10.offsetHeight
        const s12 = e10.getBoundingClientRect(),
          r8 = l8 < (s12.width || 1) / (s12.height || 1)
        ;((e10.style.aspectRatio = `${t9.aspectRatio}`),
          (e10.style.width = r8 ? 'auto' : ''),
          (e10.style.height = r8 ? '' : 'auto'))
      }
    }
  }
  function y3() {
    v4(a7())
  }
  return {
    init: function (t9) {
      ;((s11 = t9),
        s11.on('addSlide', m4),
        s11.on('attachSlideEl', u6),
        s11.on('detachSlideEl', f3),
        s11.on('ready', h4),
        s11.on('change', p2),
        s11.on('settle', h4),
        s11.on('refresh', y3),
        window.addEventListener('message', d3))
    },
    destroy: function () {
      ;(null == s11 || s11.off('addSlide', m4),
        null == s11 || s11.off('attachSlideEl', u6),
        null == s11 || s11.off('detachSlideEl', f3),
        null == s11 || s11.off('ready', h4),
        null == s11 || s11.off('change', p2),
        null == s11 || s11.off('settle', h4),
        null == s11 || s11.off('refresh', y3),
        window.removeEventListener('message', d3),
        (s11 = void 0))
    },
  }
}

// node_modules/@fancyapps/ui/dist/carousel/carousel.fullscreen.js
var n9 = {
  autoStart: false,
  btnTpl:
    '<button data-fullscreen-action="toggle" class="f-button" title="{{TOGGLE_FULLSCREEN}}"><svg><g><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></g><g><path d="M15 19v-2a2 2 0 0 1 2-2h2M15 5v2a2 2 0 0 0 2 2h2M5 15h2a2 2 0 0 1 2 2v2M5 9h2a2 2 0 0 0 2-2V5"/></g></svg></button>',
}
var t8 = 'in-fullscreen-mode'
var l6 = () => {
  let l8
  function u6(t9) {
    const u7 = null == l8 ? void 0 : l8.getOptions().Fullscreen
    let o10 = (t3(u7) ? Object.assign(Object.assign({}, n9), u7) : n9)[t9]
    return o10 && 'function' == typeof o10 && l8 ? o10(l8) : o10
  }
  function o9() {
    var e10
    null === (e10 = null == l8 ? void 0 : l8.getPlugins().Toolbar) ||
      void 0 === e10 ||
      e10.add('fullscreen', { tpl: u6('btnTpl') })
  }
  function c6() {
    if (u6('autoStart')) {
      const e10 = s11()
      e10 && a7(e10)
    }
  }
  function i8(e10, n11) {
    const t9 = n11.target
    t9 &&
      !n11.defaultPrevented &&
      'toggle' === t9.dataset.fullscreenAction &&
      d3()
  }
  function s11() {
    return u6('el') || (null == l8 ? void 0 : l8.getContainer()) || void 0
  }
  function r7() {
    const e10 = document
    return e10.fullscreenEnabled
      ? !!e10.fullscreenElement
      : !!e10.webkitFullscreenEnabled && !!e10.webkitFullscreenElement
  }
  function a7(e10) {
    const n11 = document
    let l9
    return (
      e10 || (e10 = n11.documentElement),
      n11.fullscreenEnabled
        ? (l9 = e10.requestFullscreen())
        : n11.webkitFullscreenEnabled &&
          (l9 = e10.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)),
      l9 &&
        l9.then(() => {
          e10.classList.add(t8)
        }),
      l9
    )
  }
  function f3() {
    const e10 = document
    let n11
    return (
      e10.fullscreenEnabled
        ? (n11 = e10.fullscreenElement && e10.exitFullscreen())
        : e10.webkitFullscreenEnabled &&
          (n11 = e10.webkitFullscreenElement && e10.webkitExitFullscreen()),
      n11 &&
        n11.then(() => {
          var e11
          null === (e11 = s11()) || void 0 === e11 || e11.classList.remove(t8)
        }),
      n11
    )
  }
  function d3() {
    if (r7()) f3()
    else {
      const e10 = s11()
      e10 && a7(e10)
    }
  }
  return {
    init: function (e10) {
      ;((l8 = e10),
        l8.on('initPlugins', o9),
        l8.on('ready', c6),
        l8.on('click', i8))
    },
    destroy: function () {
      ;(null == l8 || l8.off('initPlugins', o9),
        null == l8 || l8.off('ready', c6),
        null == l8 || l8.off('click', i8))
    },
    exit: f3,
    inFullscreen: r7,
    request: a7,
    toggle: d3,
  }
}

// node_modules/@fancyapps/ui/dist/fancybox/fancybox.hash.js
var n10
var o7
var r6 = false
var i7 = false
var l7 = false
var s10 = false
var a6 = () => {
  const t9 = new URL(document.URL).hash,
    e10 = t9.slice(1).split('-'),
    n11 = e10[e10.length - 1],
    o9 = (n11 && /^\+?\d+$/.test(n11) && parseInt(e10.pop() || '1', 10)) || 1
  return { urlHash: t9, urlSlug: e10.join('-'), urlIndex: o9 }
}
var u5 = () => {
  const t9 = null == n10 ? void 0 : n10.getInstance(),
    e10 = null == t9 ? void 0 : t9.getState()
  return !(!t9 || (0 !== e10 && 1 !== e10))
}
var c5 = () => {
  if (!n10) return
  if (u5()) return
  const { urlSlug: t9, urlIndex: e10 } = a6()
  if (!t9) return
  let o9 = document.querySelector(`[data-slug="${t9}"]`)
  ;(o9 && n10.fromTriggerEl(o9),
    u5() ||
      ((o9 = document.querySelectorAll(`[data-fancybox="${t9}"]`)[e10 - 1]),
      o9 && n10.fromTriggerEl(o9, { startIndex: e10 - 1 })),
    u5() &&
      o9 &&
      !o9.closest('[inert]') &&
      o9.scrollIntoView({
        behavior: 'instant',
        block: 'center',
        inline: 'center',
      }))
}
var d2 = t9 => {
  const n11 = t9.getOptions().Hash,
    o9 = t9.getSlide()
  return (o9 && (o9.slug || o9.fancybox || (t3(n11) ? n11.slug : ''))) || ''
}
var g = t9 => {
  var e10, n11
  const o9 = d2(t9),
    r7 = t9.getSlide()
  if (!r7 || !o9) return ''
  let i8 = parseInt(r7.index + '', 10) + 1,
    l8 = r7.slug ? `#${r7.slug}` : `#${o9}-${i8}`
  return (
    ((null ===
      (n11 =
        null === (e10 = t9.getCarousel()) || void 0 === e10
          ? void 0
          : e10.getPages()) || void 0 === n11
      ? void 0
      : n11.length) || 0) < 2 && (l8 = `#${o9}`),
    l8
  )
}
var f2 = () => {
  if (!n10) return
  if (l7) return
  const t9 = null == n10 ? void 0 : n10.getInstance(),
    o9 = null == t9 ? void 0 : t9.getCarousel(),
    { urlSlug: r7, urlIndex: u6 } = a6(),
    d3 = null == t9 ? void 0 : t9.getOptions().Hash
  if (false !== d3) {
    if (t9 && 1 === t9.getState() && o9) {
      const n11 = o9.getSlides()
      for (const t10 of n11 || [])
        if (
          t10.slug === r7 ||
          ((t10.fancybox === r7 || (t3(d3) && d3.slug === r7)) &&
            t10.index === u6 - 1)
        )
          return ((i7 = false), void o9.goTo(t10.index))
      ;((s10 = true), t9.close(), (s10 = false))
    }
    c5()
  }
}
var h3 = () => {
  n10 &&
    ((o7 = setTimeout(() => {
      ;((r6 = true), c5(), (r6 = false))
    }, 300)),
    window.addEventListener('hashchange', f2, false))
}
var w2
function v3() {
  history.scrollRestoration &&
    w2 &&
    ((history.scrollRestoration = w2), (w2 = void 0))
}
var m3 = () => {
  let t9,
    e10 = ''
  function u6() {
    var n11
    if (!t9 || !t9.isTopMost() || false === t9.getOptions().Hash) return
    if (r6) {
      const e11 = t9.getOptions().sync
      e11 &&
        e11.goTo(
          (null === (n11 = null == t9 ? void 0 : t9.getCarousel()) ||
          void 0 === n11
            ? void 0
            : n11.getPageIndex()) || 0,
          { transition: false, tween: false },
        )
    }
    const o9 = t9.getCarousel()
    if (!o9) return
    if (!t9.getSlide()) return
    const l8 = d2(t9)
    if (!l8) return
    const { urlHash: s11, urlSlug: u7 } = a6(),
      f4 = g(t9)
    ;(s11 !== f4 && (e10 = s11),
      history.scrollRestoration &&
        !w2 &&
        ((w2 = history.scrollRestoration),
        (history.scrollRestoration = 'manual'),
        window.addEventListener('beforeunload', v3)),
      o9.on('change', c6))
    const h4 = l8 !== u7
    try {
      ;(window.history[h4 ? 'pushState' : 'replaceState'](
        {},
        document.title,
        window.location.pathname + window.location.search + f4,
      ),
        h4 && (i7 = true))
    } catch (t10) {}
  }
  function c6() {
    if (!t9 || !t9.isTopMost() || false === t9.getOptions().Hash) return
    if (!t9.getSlide()) return
    if (!d2(t9)) return
    const e11 = g(t9)
    l7 = true
    try {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search + e11,
      )
    } catch (t10) {}
    l7 = false
  }
  function f3() {
    var n11
    if (!t9 || !t9.isTopMost() || false === t9.getOptions().Hash || s10) return
    if (d2(t9)) {
      l7 = true
      try {
        i7 &&
        !(function () {
          if (window.parent === window) return false
          try {
            var t10 = window.frameElement
          } catch (e11) {
            t10 = null
          }
          return null === t10
            ? 'data:' === location.protocol
            : t10.hasAttribute('sandbox')
        })() &&
        'IFRAME' !==
          (null === (n11 = document.activeElement) || void 0 === n11
            ? void 0
            : n11.nodeName)
          ? window.history.back()
          : window.history.replaceState(
              {},
              document.title,
              window.location.pathname + window.location.search + e10,
            )
      } catch (t10) {}
      l7 = false
    }
  }
  return {
    init: function (e11) {
      ;(clearTimeout(o7), (t9 = e11), t9.on('ready', u6), t9.on('close', f3))
    },
    destroy: function () {
      ;(null == t9 || t9.off('ready', u6), null == t9 || t9.off('close', f3))
      const e11 = null == t9 ? void 0 : t9.getCarousel()
      ;(e11 && e11.off('change', c6),
        (t9 = void 0),
        (null == n10 ? void 0 : n10.getInstance()) ||
          (v3(), window.removeEventListener('beforeunload', v3)))
    },
  }
}
;((m3.getInfoFromURL = a6),
  (m3.startFromUrl = c5),
  (m3.setup = function (e10) {
    n10 ||
      ((n10 = e10),
      e8() &&
        (/complete|interactive|loaded/.test(document.readyState)
          ? h3()
          : document.addEventListener('DOMContentLoaded', h3)))
  }))

// node_modules/@fancyapps/ui/dist/fancybox/l10n/en_EN.js
var o8 = Object.assign(Object.assign({}, o3), {
  CLOSE: 'Close',
  NEXT: 'Next',
  PREV: 'Previous',
  MODAL: 'You can close this modal content with the ESC key',
  ELEMENT_NOT_FOUND: 'HTML Element Not Found',
  IFRAME_ERROR: 'Error Loading Page',
  NO_CAPTION: 'No Caption',
  TOGGLE_SIDEBAR: 'Toggle sidebar',
})

// node_modules/@fancyapps/ui/dist/fancybox/fancybox.js
var M3 =
  '<button class="f-button" title="{{CLOSE}}" data-fancybox-close><svg tabindex="-1" width="24" height="24" viewBox="0 0 24 24"><path d="M19.286 4.714 4.714 19.286M4.714 4.714l14.572 14.572" /></svg></button>'
c3().add('close', { tpl: M3 })
var k = e10 => {
  e10.cancelable && e10.preventDefault()
}
var R = (e10 = null, t9 = '', n11) => {
  if (!e10 || !e10.parentElement || !t9) return void (n11 && n11())
  O(e10)
  const o9 = i8 => {
    i8.target === e10 &&
      e10.dataset.animationName &&
      (e10.removeEventListener('animationend', o9),
      delete e10.dataset.animationName,
      n11 && n11(),
      e10.classList.remove(t9))
  }
  ;((e10.dataset.animationName = t9),
    e10.addEventListener('animationend', o9),
    s3(e10, t9))
}
var O = e10 => {
  e10 &&
    e10.dispatchEvent(
      new CustomEvent('animationend', {
        bubbles: false,
        cancelable: true,
        currentTarget: e10,
      }),
    )
}
var _
!(function (e10) {
  ;((e10[(e10.Init = 0)] = 'Init'),
    (e10[(e10.Ready = 1)] = 'Ready'),
    (e10[(e10.Closing = 2)] = 'Closing'),
    (e10[(e10.Destroyed = 3)] = 'Destroyed'))
})(_ || (_ = {}))
var I = {
  ajax: null,
  backdropClick: 'close',
  Carousel: {},
  closeButton: 'auto',
  closeButtonTpl: M3,
  closeExisting: false,
  delegateEl: void 0,
  dragToClose: true,
  fadeEffect: true,
  groupAll: false,
  groupAttr: 'data-fancybox',
  hideClass: 'f-fadeOut',
  hideScrollbar: true,
  id: void 0,
  idle: false,
  keyboard: {
    Escape: 'close',
    Delete: 'close',
    Backspace: 'close',
    PageUp: 'next',
    PageDown: 'prev',
    ArrowUp: 'prev',
    ArrowDown: 'next',
    ArrowRight: 'next',
    ArrowLeft: 'prev',
  },
  l10n: o8,
  mainClass: '',
  mainStyle: {},
  mainTpl:
    '<dialog class="fancybox__dialog">\n    <div class="fancybox__container" tabindex="0" aria-label="{{MODAL}}">\n      <div class="fancybox__backdrop"></div>\n      <div class="fancybox__carousel"></div>\n    </div>\n  </dialog>',
  modal: true,
  on: {},
  parentEl: void 0,
  placeFocusBack: true,
  showClass: 'f-zoomInUp',
  startIndex: 0,
  sync: void 0,
  theme: 'dark',
  triggerEl: void 0,
  triggerEvent: void 0,
  zoomEffect: true,
}
var z = /* @__PURE__ */ new Map()
var H = 0
var B = 'with-fancybox'
var D = () => {
  let r7,
    T,
    A,
    M4,
    D2,
    q2,
    N2,
    V = _.Init,
    W = Object.assign({}, I),
    $ = -1,
    K = {},
    U = [],
    X = false,
    G = true,
    Y = 0
  function Z(e10, ...t9) {
    let n11 = W[e10]
    return n11 && 'function' == typeof n11 ? n11(Re, ...t9) : n11
  }
  function J(e10, t9 = []) {
    const n11 = Z('l10n') || {}
    e10 = String(e10).replace(/\{\{(\w+)\}\}/g, (e11, t10) => n11[t10] || e11)
    for (let n12 = 0; n12 < t9.length; n12++)
      e10 = e10.split(t9[n12][0]).join(t9[n12][1])
    return (e10 = e10.replace(/\{\{(.*?)\}\}/g, (e11, t10) => t10))
  }
  const Q = /* @__PURE__ */ new Map()
  function ee(e10, ...t9) {
    const n11 = [...(Q.get(e10) || [])]
    for (const [t10, o9] of Object.entries(W.on || {}))
      (t10 === e10 || t10.split(' ').indexOf(e10) > -1) && n11.push(o9)
    for (const e11 of n11) e11 && 'function' == typeof e11 && e11(Re, ...t9)
    '*' !== e10 && ee('*', e10, ...t9)
  }
  function te() {
    s4(T, 'is-revealing')
    try {
      if (document.activeElement === r7) {
        ;((null == T ? void 0 : T.querySelector('[autofocus]')) || T).focus()
      }
    } catch (e10) {}
  }
  function ne(e10, n11) {
    var o9
    ;(ve(n11),
      de(),
      null === (o9 = n11.el) ||
        void 0 === o9 ||
        o9.addEventListener('click', ie),
      ('inline' !== n11.type && 'clone' !== n11.type) ||
        (function (e11) {
          if (!M4 || !e11 || !e11.el) return
          let n12 = null
          if (t(e11.src)) {
            const t9 = e11.src.split('#', 2).pop()
            n12 = t9 ? document.getElementById(t9) : null
          }
          if (n12) {
            if (
              (s3(n12, 'f-html'),
              'clone' === e11.type || n12.closest('.fancybox__carousel'))
            ) {
              n12 = n12.cloneNode(true)
              const t9 = n12.dataset.animationName
              t9 && (n12.classList.remove(t9), delete n12.dataset.animationName)
              let o10 = n12.getAttribute('id')
              ;((o10 = o10 ? `${o10}--clone` : `clone-${$}-${e11.index}`),
                n12.setAttribute('id', o10))
            } else if (n12.parentNode) {
              const t9 = document.createElement('div')
              ;((t9.inert = true),
                n12.parentNode.insertBefore(t9, n12),
                (e11.placeholderEl = t9))
            }
            ;((e11.htmlEl = n12),
              s3(e11.el, 'has-html'),
              e11.el.prepend(n12),
              n12.classList.remove('hidden'),
              'none' === n12.style.display && (n12.style.display = ''),
              'none' === getComputedStyle(n12).getPropertyValue('display') &&
                (n12.style.display = n12.dataset.display || 'flex'),
              null == M4 || M4.emit('contentReady', e11))
          } else null == M4 || M4.showError(e11, '{{ELEMENT_NOT_FOUND}}')
        })(n11),
      'ajax' === n11.type &&
        (function (e11) {
          const t9 = e11.el
          if (!t9) return
          if (e11.htmlEl || e11.xhr) return
          ;(null == M4 || M4.showLoading(e11), (e11.state = 0))
          const n12 = new XMLHttpRequest()
          n12.onreadystatechange = function () {
            if (n12.readyState === XMLHttpRequest.DONE && V === _.Ready)
              if (
                (null == M4 || M4.hideLoading(e11),
                (e11.state = 1),
                200 === n12.status)
              ) {
                let o11 = n12.responseText + '',
                  i8 = null,
                  s11 = null
                if (e11.filter) {
                  const t10 = document.createElement('div')
                  ;((t10.innerHTML = o11),
                    (s11 = t10.querySelector(e11.filter + '')))
                }
                ;(s11 && s11 instanceof HTMLElement
                  ? (i8 = s11)
                  : ((i8 = document.createElement('div')),
                    (i8.innerHTML = o11)),
                  i8.classList.add('f-html'),
                  (e11.htmlEl = i8),
                  t9.classList.add('has-html'),
                  t9.classList.add('has-ajax'),
                  t9.prepend(i8),
                  null == M4 || M4.emit('contentReady', e11))
              } else null == M4 || M4.showError(e11)
          }
          const o10 = Z('ajax') || null
          ;(n12.open(o10 ? 'POST' : 'GET', e11.src + ''),
            n12.setRequestHeader(
              'Content-Type',
              'application/x-www-form-urlencoded',
            ),
            n12.setRequestHeader('X-Requested-With', 'XMLHttpRequest'),
            n12.send(o10),
            (e11.xhr = n12))
        })(n11))
  }
  function oe(e10, t9) {
    var n11
    ;(ye(t9),
      null === (n11 = t9.el) ||
        void 0 === n11 ||
        n11.removeEventListener('click', ie),
      ('inline' !== t9.type && 'clone' !== t9.type) ||
        (function (e11) {
          const t10 = e11.htmlEl,
            n12 = e11.placeholderEl
          t10 &&
            ('none' !== getComputedStyle(t10).getPropertyValue('display') &&
              (t10.style.display = 'none'),
            t10.offsetHeight)
          n12 &&
            (t10 && n12.parentNode && n12.parentNode.insertBefore(t10, n12),
            n12.remove())
          ;((e11.htmlEl = void 0), (e11.placeholderEl = void 0))
        })(t9),
      t9.xhr && (t9.xhr.abort(), (t9.xhr = void 0)))
  }
  function ie(e10) {
    if (!he()) return
    if (V !== _.Ready) return (k(e10), void e10.stopPropagation())
    if (e10.defaultPrevented) return
    if (!f.isClickAllowed()) return
    const t9 = e10.composedPath()[0]
    t9.closest('.fancybox__carousel') &&
      t9.classList.contains('fancybox__slide') &&
      fe(e10)
  }
  function se() {
    ;((G = false), T && M4 && T.classList.remove('is-revealing'), de())
    const e10 = Z('sync')
    if (M4 && e10) {
      const t9 = e10.getPageIndex(M4.getPageIndex()) || 0
      e10.goTo(t9, { transition: false, tween: false })
    }
  }
  function le() {
    var e10
    ;(!(function () {
      const e11 = null == M4 ? void 0 : M4.getViewport()
      if (!Z('dragToClose') || !M4 || !e11) return
      if (((D2 = f(e11).init()), !D2)) return
      let t10 = false,
        n11 = 0,
        o9 = 0,
        s11 = {},
        l8 = 1
      function r8() {
        var e12, t11
        null == q2 ||
          q2
            .spring({
              clamp: true,
              mass: 1,
              tension: 0 === o9 ? 140 : 960,
              friction: 17,
              restDelta: 0.1,
              restSpeed: 0.1,
              maxSpeed: 1 / 0,
            })
            .from({ y: n11 })
            .to({ y: o9 })
            .start()
        const i8 =
            (null === (e12 = null == M4 ? void 0 : M4.getViewport()) ||
            void 0 === e12
              ? void 0
              : e12.getBoundingClientRect().height) || 0,
          s12 =
            null === (t11 = Ee()) || void 0 === t11 ? void 0 : t11.panzoomRef
        if (i8 && s12)
          if (0 === o9) s12.execute(v.Reset)
          else {
            const e13 = t5(Math.abs(n11), 0, 0.33 * i8, l8, 0.77 * l8, false)
            s12.execute(v.ZoomTo, { scale: e13 })
          }
      }
      const c6 = e12 => {
        var t11
        const n12 = e12.srcEvent,
          o10 = n12.target
        return (
          M4 &&
          !(
            e5(n12) &&
            (null === (t11 = n12.touches) || void 0 === t11
              ? void 0
              : t11.length) > 1
          ) &&
          o10 &&
          !n2(o10)
        )
      }
      ;((q2 = c().on('step', t11 => {
        if (T && e11 && V === _.Ready) {
          const o10 = e11.getBoundingClientRect().height
          n11 = Math.min(o10, Math.max(-1 * o10, t11.y))
          const i8 = t5(Math.abs(n11), 0, 0.65 * o10, 1, 0.2, true)
          ;(T.style.setProperty('--f-drag-opacity', i8 + ''),
            T.style.setProperty('--f-drag-offset', n11 + 'px'))
        }
      })),
        D2.on('start', function () {
          t10 || (null == q2 || q2.pause(), (o9 = n11))
        })
          .on('panstart', e12 => {
            var n12, o10
            if (!t10 && c6(e12) && 'y' === e12.axis) {
              ;(k(e12.srcEvent),
                (t10 = true),
                Te(),
                null === (n12 = null == M4 ? void 0 : M4.getViewport()) ||
                  void 0 === n12 ||
                  n12.classList.add('is-dragging'))
              const i8 =
                null === (o10 = Ee()) || void 0 === o10
                  ? void 0
                  : o10.panzoomRef
              if (i8) {
                l8 = i8.getTransform().scale || 1
                const e13 = i8.getOptions()
                ;((s11 = Object.assign({}, e13)),
                  (e13.bounds = false),
                  (e13.gestures = false))
              }
            } else t10 = false
          })
          .on('pan', function (e12) {
            t10 &&
              c6(e12) &&
              (k(e12.srcEvent),
              e12.srcEvent.stopPropagation(),
              'y' === e12.axis && ((o9 += e12.deltaY), r8()))
          })
          .on('end', e12 => {
            var i8, l9, a7
            if (
              (null === (i8 = null == M4 ? void 0 : M4.getViewport()) ||
                void 0 === i8 ||
                i8.classList.remove('is-dragging'),
              t10)
            ) {
              const t11 =
                null === (l9 = Ee()) || void 0 === l9 ? void 0 : l9.panzoomRef
              if (t11) {
                null === (a7 = t11.getTween()) || void 0 === a7 || a7.end()
                const e13 = t11.getOptions()
                ;((e13.bounds = s11.bounds || false),
                  (e13.gestures = s11.gestures || false))
              }
              c6(e12) &&
                'y' === e12.axis &&
                (Math.abs(e12.velocityY) > 5 || Math.abs(n11) > 50) &&
                Ae(
                  e12.srcEvent,
                  'f-throwOut' + (e12.velocityY > 0 ? 'Down' : 'Up'),
                )
            }
            ;((t10 = false), V === _.Ready && 0 !== n11 && ((o9 = 0), r8()))
          }))
    })(),
      document.body.addEventListener('click', pe),
      document.body.addEventListener('keydown', ge, {
        passive: false,
        capture: true,
      }),
      de(),
      Le())
    const t9 = Z('sync')
    ;(M4 &&
      t9 &&
      (null === (e10 = t9.getTween()) || void 0 === e10 || e10.start()),
      be(Ee()))
  }
  function re() {
    ;(null == M4 ? void 0 : M4.canGoNext()) ? Le() : Pe()
  }
  function ae(e10, t9) {
    ve(t9)
  }
  function ce(e10, t9) {
    ;(ve(t9), be(t9))
  }
  function ue() {
    var e10
    const t9 = null == M4 ? void 0 : M4.getPlugins().Thumbs
    ;(s5(T, 'has-thumbs', (null == t9 ? void 0 : t9.isEnabled()) || false),
      s5(
        T,
        'has-vertical-thumbs',
        !!t9 &&
          ('scrollable' === t9.getType() ||
            true ===
              (null === (e10 = t9.getCarousel()) || void 0 === e10
                ? void 0
                : e10.isVertical())),
      ))
  }
  function de() {
    if (!T) return
    const e10 = (null == M4 ? void 0 : M4.getPages().length) || 0,
      t9 = (null == M4 ? void 0 : M4.getPageIndex()) || 0,
      n11 = T.querySelectorAll(
        '[data-fancybox-index],[data-fancybox-page],[data-fancybox-pages]',
      )
    for (const o9 of n11)
      o9.hasAttribute('data-fancybox-index')
        ? (o9.textContent = String(t9))
        : o9.hasAttribute('data-fancybox-page')
          ? (o9.textContent = String(t9 + 1))
          : (o9.textContent = String(e10))
  }
  function fe(e10) {
    if (!!e10.composedPath()[0].closest('[data-fancybox-close]'))
      return void Ae(e10)
    if ((ee('backdropClick', e10), e10.defaultPrevented)) return
    Z('backdropClick') && Ae(e10)
  }
  function me() {
    Ce()
  }
  function ge(e10) {
    if (!he()) return
    if (V !== _.Ready) return
    const t9 = e10.key,
      o9 = Z('keyboard')
    if (!o9) return
    if (e10.ctrlKey || e10.altKey || e10.shiftKey) return
    const i8 = e10.composedPath()[0]
    if (!n(i8)) return
    if (
      'Escape' !== t9 &&
      (e11 => {
        const t10 = [
          'input',
          'textarea',
          'select',
          'option',
          'video',
          'iframe',
          '[contenteditable]',
          '[data-selectable]',
          '[data-draggable]',
        ].join(',')
        return e11.matches(t10) || e11.closest(t10)
      })(i8)
    )
      return
    if ((ee('keydown', e10), e10.defaultPrevented)) return
    const s11 = o9[t9]
    if (s11)
      switch (s11) {
        case 'close':
          Ae(e10)
          break
        case 'next':
          ;(k(e10), null == M4 || M4.next())
          break
        case 'prev':
          ;(k(e10), null == M4 || M4.prev())
      }
  }
  function pe(e10) {
    if (!he()) return
    if (V !== _.Ready) return
    if ((Ce(), e10.defaultPrevented)) return
    const t9 = e10.composedPath()[0],
      n11 = !!t9.closest('[data-fancybox-close]'),
      o9 = t9.classList.contains('fancybox__backdrop')
    ;(n11 || o9) && fe(e10)
  }
  function ve(e10) {
    var t9
    const { el: n11, htmlEl: i8, panzoomRef: s11, closeButtonEl: l8 } = e10,
      r8 = s11 ? s11.getWrapper() : i8
    if (!n11 || !n11.parentElement || !r8) return
    let a7 = Z('closeButton')
    if (
      ('auto' === a7 &&
        (a7 =
          true !==
          (null === (t9 = null == M4 ? void 0 : M4.getPlugins().Toolbar) ||
          void 0 === t9
            ? void 0
            : t9.isEnabled())),
      a7)
    ) {
      if (!l8) {
        const t10 = e2(J(Z('closeButtonTpl')))
        t10 &&
          (s3(t10, 'is-close-button'),
          (e10.closeButtonEl = r8.insertAdjacentElement('afterbegin', t10)),
          s3(n11, 'has-close-btn'))
      }
    } else ye(e10)
  }
  function ye(e10) {
    ;(e10.closeButtonEl &&
      (e10.closeButtonEl.remove(), (e10.closeButtonEl = void 0)),
      s4(e10.el, 'has-close-btn'))
  }
  function be(e10) {
    if (
      !(
        G &&
        M4 &&
        1 === M4.getState() &&
        e10 &&
        e10.index === M4.getOptions().initialPage &&
        e10.el &&
        e10.el.parentElement
      )
    )
      return
    if (void 0 !== e10.state && 1 !== e10.state) return
    G = false
    const t9 = e10.panzoomRef,
      n11 = null == t9 ? void 0 : t9.getTween(),
      o9 = Z('zoomEffect') && n11 ? we(e10) : void 0
    if (t9 && n11 && o9) {
      const { x: e11, y: i9, scale: s11 } = t9.getStartPosition()
      return void n11
        .spring({
          tension: 215,
          friction: 25,
          restDelta: 1e-3,
          restSpeed: 1e-3,
          maxSpeed: 1 / 0,
        })
        .from(o9)
        .to({ x: e11, y: i9, scale: s11 })
        .start()
    }
    const i8 = (null == t9 ? void 0 : t9.getContent()) || e10.htmlEl
    i8 && R(i8, Z('showClass', e10))
  }
  function he() {
    var e10
    return (
      (null === (e10 = F.getInstance()) || void 0 === e10
        ? void 0
        : e10.getId()) === $
    )
  }
  function Ee() {
    var e10
    return null === (e10 = null == M4 ? void 0 : M4.getPage()) || void 0 === e10
      ? void 0
      : e10.slides[0]
  }
  function xe() {
    const e10 = Ee()
    return e10 ? e10.triggerEl || Z('triggerEl') : void 0
  }
  function we(e10) {
    var t9, n11
    const o9 = e10.thumbEl
    if (
      !o9 ||
      !(e11 => {
        const t10 = e11.getBoundingClientRect(),
          n12 = e11.closest('[style]'),
          o10 = null == n12 ? void 0 : n12.parentElement
        if (n12 && n12.style.transform && o10) {
          const e12 = o10.getBoundingClientRect()
          if (
            t10.left < e12.left ||
            t10.left > e12.left + e12.width - t10.width
          )
            return false
          if (t10.top < e12.top || t10.top > e12.top + e12.height - t10.height)
            return false
        }
        const i9 = Math.max(
            document.documentElement.clientHeight,
            window.innerHeight,
          ),
          s12 = Math.max(
            document.documentElement.clientWidth,
            window.innerWidth,
          )
        return !(
          t10.bottom < 0 ||
          t10.top - i9 >= 0 ||
          t10.right < 0 ||
          t10.left - s12 >= 0
        )
      })(o9)
    )
      return
    const i8 =
        null ===
          (n11 =
            null === (t9 = e10.panzoomRef) || void 0 === t9
              ? void 0
              : t9.getWrapper()) || void 0 === n11
          ? void 0
          : n11.getBoundingClientRect(),
      s11 = null == i8 ? void 0 : i8.width,
      l8 = null == i8 ? void 0 : i8.height
    if (!s11 || !l8) return
    const r8 = o9.getBoundingClientRect()
    let a7 = r8.width,
      c6 = r8.height,
      u6 = r8.left,
      d3 = r8.top
    if (!r8 || !a7 || !c6) return
    if (o9 instanceof HTMLImageElement) {
      const e11 = window.getComputedStyle(o9).getPropertyValue('object-fit')
      if ('contain' === e11 || 'scale-down' === e11) {
        const { width: t10, height: n12 } = ((
          e12,
          t11,
          n13,
          o10,
          i9 = 'contain',
        ) => {
          if ('contain' === i9 || e12 > n13 || t11 > o10) {
            const i10 = n13 / e12,
              s12 = o10 / t11,
              l9 = Math.min(i10, s12)
            ;((e12 *= l9), (t11 *= l9))
          }
          return { width: e12, height: t11 }
        })(o9.naturalWidth, o9.naturalHeight, a7, c6, e11)
        ;((u6 += 0.5 * (a7 - t10)),
          (d3 += 0.5 * (c6 - n12)),
          (a7 = t10),
          (c6 = n12))
      }
    }
    if (Math.abs(s11 / l8 - a7 / c6) > 0.1) return
    return {
      x: u6 + 0.5 * a7 - (i8.left + 0.5 * s11),
      y: d3 + 0.5 * c6 - (i8.top + 0.5 * l8),
      scale: a7 / s11,
    }
  }
  function je() {
    ;(N2 && clearTimeout(N2),
      (N2 = void 0),
      document.removeEventListener('mousemove', me))
  }
  function Le() {
    if (X) return
    if (N2) return
    const e10 = Z('idle')
    e10 && (N2 = setTimeout(Se, e10))
  }
  function Se() {
    T &&
      (je(),
      s3(T, 'is-idle'),
      document.addEventListener('mousemove', me),
      (X = true))
  }
  function Ce() {
    X && (Pe(), Le())
  }
  function Pe() {
    ;(je(), null == T || T.classList.remove('is-idle'), (X = false))
  }
  function Te() {
    const e10 = xe()
    var t9
    !e10 ||
      ((t9 = e10.getBoundingClientRect()).bottom > 0 &&
        t9.right > 0 &&
        t9.left < (window.innerWidth || document.documentElement.clientWidth) &&
        t9.top <
          (window.innerHeight || document.documentElement.clientHeight)) ||
      e10.closest('[inert]') ||
      e10.scrollIntoView({
        behavior: 'instant',
        block: 'center',
        inline: 'center',
      })
  }
  function Ae(e10, t9) {
    var n11, o9, i8, s11, r8
    if (V === _.Closing || V === _.Destroyed) return
    const a7 = new Event('shouldClose', { bubbles: true, cancelable: true })
    if ((ee('shouldClose', a7, e10), a7.defaultPrevented)) return
    if ((je(), e10)) {
      if (e10.defaultPrevented) return
      ;(k(e10), e10.stopPropagation(), e10.stopImmediatePropagation())
    }
    if (
      ((V = _.Closing),
      null == q2 || q2.pause(),
      null == D2 || D2.destroy(),
      M4)
    ) {
      ;(null === (n11 = M4.getGestures()) || void 0 === n11 || n11.destroy(),
        null === (o9 = M4.getTween()) || void 0 === o9 || o9.pause())
      for (const e11 of M4.getSlides()) {
        const t10 = e11.panzoomRef
        t10 &&
          (r3(t10.getOptions(), {
            clickAction: false,
            dblClickAction: false,
            wheelAction: false,
            bounds: false,
            minScale: 0,
            maxScale: 1 / 0,
          }),
          null === (i8 = t10.getGestures()) || void 0 === i8 || i8.destroy(),
          null === (s11 = t10.getTween()) || void 0 === s11 || s11.pause())
      }
    }
    const c6 = null == M4 ? void 0 : M4.getPlugins()
    null === (r8 = null == c6 ? void 0 : c6.Autoplay) ||
      void 0 === r8 ||
      r8.stop()
    const u6 = null == c6 ? void 0 : c6.Fullscreen
    u6 && u6.inFullscreen()
      ? Promise.resolve(u6.exit()).then(() => {
          setTimeout(() => {
            Me(e10, t9)
          }, 150)
        })
      : Me(e10, t9)
  }
  function Me(e10, t9) {
    var n11, o9
    if (V !== _.Closing) return
    ;(ee('close', e10),
      (G = false),
      document.body.removeEventListener('click', pe),
      document.body.removeEventListener('keydown', ge, {
        passive: false,
        capture: true,
      }),
      Z('placeFocusBack') && Te())
    const i8 = document.activeElement
    ;(i8 && (null == r7 ? void 0 : r7.contains(i8)) && i8.blur(),
      Z('fadeEffect') &&
        (null == T || T.classList.remove('is-ready'),
        null == T || T.classList.add('is-hiding')),
      null == T || T.classList.add('is-closing'))
    const s11 = Ee(),
      l8 = null == s11 ? void 0 : s11.el,
      a7 = null == s11 ? void 0 : s11.panzoomRef,
      c6 =
        null === (n11 = null == s11 ? void 0 : s11.panzoomRef) || void 0 === n11
          ? void 0
          : n11.getTween(),
      u6 = t9 || Z('hideClass')
    let d3 = false,
      m4 = false
    if (M4 && s11 && l8 && a7 && c6) {
      let e11
      if ((Z('zoomEffect') && 1 === s11.state && (e11 = we(s11)), e11)) {
        d3 = true
        const t10 = () => {
          ;((e11 = we(s11)),
            e11 ? c6.to(Object.assign(Object.assign({}, y), e11)) : ke())
        }
        ;(a7.on('refresh', () => {
          t10()
        }),
          c6
            .easing(c.Easings.EaseOut)
            .duration(350)
            .from(Object.assign({}, a7.getTransform()))
            .to(Object.assign(Object.assign({}, y), e11))
            .start(),
          (null == l8 ? void 0 : l8.getAnimations()) &&
            ((l8.style.animationPlayState = 'paused'),
            requestAnimationFrame(() => {
              t10()
            })))
      }
    }
    const g2 =
      (null == s11 ? void 0 : s11.htmlEl) ||
      (null === (o9 = null == s11 ? void 0 : s11.panzoomRef) || void 0 === o9
        ? void 0
        : o9.getWrapper())
    ;(g2 && O(g2),
      !d3 &&
        u6 &&
        g2 &&
        ((m4 = true),
        R(g2, u6, () => {
          ke()
        })),
      d3 || m4
        ? setTimeout(() => {
            ke()
          }, 350)
        : ke())
  }
  function ke() {
    var e10, t9, n11, o9, i8
    if (V === _.Destroyed) return
    V = _.Destroyed
    const l8 = xe()
    ;(ee('destroy'),
      null ===
        (t9 =
          null === (e10 = Z('sync')) || void 0 === e10
            ? void 0
            : e10.getPlugins().Autoplay) ||
        void 0 === t9 ||
        t9.resume(),
      null ===
        (o9 =
          null === (n11 = Z('sync')) || void 0 === n11
            ? void 0
            : n11.getPlugins().Autoscroll) ||
        void 0 === o9 ||
        o9.resume(),
      r7 instanceof HTMLDialogElement && r7.close(),
      null === (i8 = null == M4 ? void 0 : M4.getContainer()) ||
        void 0 === i8 ||
        i8.classList.remove('is-idle'),
      null == M4 || M4.destroy())
    for (const e11 of Object.values(K)) null == e11 || e11.destroy()
    if (
      ((K = {}),
      null == r7 || r7.remove(),
      (r7 = void 0),
      (T = void 0),
      (M4 = void 0),
      z.delete($),
      !z.size &&
        (t6(false),
        document.documentElement.classList.remove(B),
        Z('placeFocusBack') && l8 && !l8.closest('[inert]')))
    )
      try {
        null == l8 || l8.focus({ preventScroll: true })
      } catch (e11) {}
  }
  const Re = {
    close: Ae,
    destroy: ke,
    getCarousel: function () {
      return M4
    },
    getContainer: function () {
      return T
    },
    getId: function () {
      return $
    },
    getOptions: function () {
      return W
    },
    getPlugins: function () {
      return K
    },
    getSlide: function () {
      return Ee()
    },
    getState: function () {
      return V
    },
    init: function (t9 = [], n11 = {}) {
      ;(V !== _.Init && (Re.destroy(), (V = _.Init)),
        (W = r3({}, I, n11)),
        ($ = Z('id') || 'fancybox-' + ++H))
      const a7 = z.get($)
      if (
        (a7 && a7.destroy(),
        z.set($, Re),
        ee('init'),
        (function () {
          for (const [e10, t10] of Object.entries(
            Object.assign(Object.assign({}, F.Plugins), W.plugins || {}),
          ))
            if (e10 && !K[e10] && t10 instanceof Function) {
              const n12 = t10()
              ;(n12.init(Re), (K[e10] = n12))
            }
          ee('initPlugins')
        })(),
        (function (e10 = []) {
          ;(ee('initSlides', e10), (U = [...e10]))
        })(t9),
        (function () {
          const t10 = Z('parentEl') || document.body
          if (!(t10 && t10 instanceof HTMLElement)) return
          const n12 = J(Z('mainTpl') || '')
          if (((r7 = e2(n12) || void 0), !r7)) return
          if (
            ((T = r7.querySelector('.fancybox__container')),
            !(T && T instanceof HTMLElement))
          )
            return
          const l8 = Z('mainClass')
          l8 && s3(T, l8)
          const a8 = Z('mainStyle')
          if (a8 && t3(a8))
            for (const [e10, t11] of Object.entries(a8))
              T.style.setProperty(e10, t11)
          const u6 = Z('theme'),
            d3 =
              'auto' === u6
                ? window.matchMedia('(prefers-color-scheme:light)').matches
                : 'light' === u6
          ;(T.setAttribute('theme', d3 ? 'light' : 'dark'),
            r7.setAttribute('id', `${$}`),
            r7.addEventListener('keydown', e10 => {
              'Escape' === e10.key && k(e10)
            }),
            r7.addEventListener(
              'wheel',
              e10 => {
                const t11 = e10.target
                let n13 = Z('wheel', e10)
                t11.closest('.f-thumbs') && (n13 = 'slide')
                const o9 = 'slide' === n13,
                  s11 = [
                    -e10.deltaX || 0,
                    -e10.deltaY || 0,
                    -e10.detail || 0,
                  ].reduce(function (e11, t12) {
                    return Math.abs(t12) > Math.abs(e11) ? t12 : e11
                  }),
                  l9 = Math.max(-1, Math.min(1, s11)),
                  r8 = Date.now()
                Y && r8 - Y < 300
                  ? o9 && k(e10)
                  : ((Y = r8),
                    ee('wheel', e10, l9),
                    e10.defaultPrevented ||
                      ('close' === n13
                        ? Ae(e10)
                        : 'slide' === n13 &&
                          M4 &&
                          !n2(t11) &&
                          (k(e10), M4[l9 > 0 ? 'prev' : 'next']())))
              },
              { capture: true, passive: false },
            ),
            r7.addEventListener('cancel', e10 => {
              Ae(e10)
            }),
            t10.append(r7),
            1 === z.size &&
              (Z('hideScrollbar') && t6(true),
              document.documentElement.classList.add(B)))
          ;(ee('initLayout'),
            r7 instanceof HTMLDialogElement &&
              (Z('modal') ? r7.showModal() : r7.show()))
        })(),
        (function () {
          if (
            ((A =
              (null == r7 ? void 0 : r7.querySelector('.fancybox__carousel')) ||
              void 0),
            !A)
          )
            return
          A.fancybox = Re
          const e10 = r3(
            {},
            {
              Autoplay: {
                autoStart: false,
                pauseOnHover: false,
                progressbarParentEl: e11 => {
                  const t10 = e11.getContainer()
                  return (
                    (null == t10
                      ? void 0
                      : t10.querySelector(
                          '.f-carousel__toolbar [data-autoplay-action]',
                        )) || t10
                  )
                },
              },
              Fullscreen: { el: T },
              Toolbar: {
                absolute: true,
                items: {
                  counter: {
                    tpl: '<div class="f-counter"><span data-fancybox-page></span>/<span data-fancybox-pages></span></div>',
                  },
                },
                display: {
                  left: ['counter'],
                  right: [
                    'toggleFull',
                    'autoplay',
                    'fullscreen',
                    'thumbs',
                    'close',
                  ],
                },
              },
              Video: { autoplay: true },
              Thumbs: {
                minCount: 2,
                Carousel: { classes: { container: 'fancybox__thumbs' } },
              },
              classes: {
                container: 'fancybox__carousel',
                viewport: 'fancybox__viewport',
                slide: 'fancybox__slide',
              },
              spinnerTpl: '<div class="f-spinner" data-fancybox-close></div>',
              dragFree: false,
              slidesPerPage: 1,
              plugins: {
                Sync: i3,
                Arrows: l3,
                Lazyload: i4,
                Zoomable: s6,
                Html: l4,
                Video: s9,
                Autoplay: o6,
                Fullscreen: l6,
                Thumbs: c4,
                Toolbar: c3,
              },
            },
            Z('Carousel') || {},
            {
              slides: U,
              enabled: true,
              initialPage: Z('startIndex') || 0,
              l10n: Z('l10n'),
            },
          )
          ;((M4 = x2(A, e10)),
            ee('initCarousel', M4),
            M4.on('*', (e11, t10, ...n12) => {
              ee(`Carousel.${t10}`, e11, ...n12)
            }),
            M4.on('attachSlideEl', ne),
            M4.on('detachSlideEl', oe),
            M4.on('contentLoading', ae),
            M4.on('contentReady', ce),
            M4.on('ready', le),
            M4.on('change', se),
            M4.on('settle', re),
            M4.on('thumbs:ready', ue),
            M4.on('thumbs:destroy', ue),
            M4.init())
        })(),
        r7 && T)
      ) {
        if (Z('closeExisting'))
          for (const [e10, t10] of z.entries()) e10 !== $ && t10.close()
        ;(Z('fadeEffect')
          ? (setTimeout(() => {
              te()
            }, 500),
            s3(T, 'is-revealing'))
          : te(),
          T.classList.add('is-ready'),
          (V = _.Ready),
          ee('ready'))
      }
    },
    isCurrentSlide: function (e10) {
      const t9 = Ee()
      return !(!e10 || !t9) && t9.index === e10.index
    },
    isTopMost: function () {
      return he()
    },
    localize: J,
    off: function (e10, t9) {
      return (
        Q.has(e10) &&
          Q.set(
            e10,
            Q.get(e10).filter(e11 => e11 !== t9),
          ),
        Re
      )
    },
    on: function (e10, t9) {
      return (Q.set(e10, [...(Q.get(e10) || []), t9]), Re)
    },
    toggleIdle(e10) {
      ;((X || true === e10) && Se(), (X && false !== e10) || Pe())
    },
  }
  return Re
}
function q() {
  for (const e10 of Object.values(F.Plugins)) {
    const t9 = e10.setup
    'function' == typeof t9 && t9(F)
  }
}
function N(e10, t9 = {}) {
  var n11, o9, i8
  if (!(e10 && e10 instanceof Element)) return
  let s11,
    r7,
    a7,
    c6,
    u6 = {}
  for (const [t10, n12] of F.openers)
    if (t10.contains(e10))
      for (const [o10, i9] of n12) {
        let n13
        if (o10) {
          for (const i10 of t10.querySelectorAll(o10))
            if (i10.contains(e10)) {
              n13 = i10
              break
            }
          if (!n13) continue
        }
        for (const [o11, d4] of i9) {
          let i10 = null
          try {
            i10 = e10.closest(o11)
          } catch (e11) {}
          i10 &&
            ((r7 = t10), (a7 = n13), (s11 = i10), (c6 = o11), r3(u6, d4 || {}))
        }
      }
  if (!r7 || !c6 || !s11) return
  const d3 = r3({}, I, t9, u6, { triggerEl: s11 })
  let f3 = [].slice.call((a7 || r7).querySelectorAll(c6))
  const m4 = s11.closest('.f-carousel'),
    g2 = null == m4 ? void 0 : m4.carousel
  if (g2 && (!a7 || !m4.contains(a7))) {
    const e11 = []
    for (const t10 of null == g2 ? void 0 : g2.getSlides()) {
      const n12 = t10.el
      n12 &&
        (n12.matches(c6)
          ? e11.push(n12)
          : e11.push(...[].slice.call(n12.querySelectorAll(c6))))
    }
    e11.length &&
      ((f3 = [...e11]),
      null === (n11 = g2.getPlugins().Autoplay) ||
        void 0 === n11 ||
        n11.pause(),
      null === (o9 = g2.getPlugins().Autoscroll) || void 0 === o9 || o9.pause(),
      (d3.sync = g2))
  }
  if (false === d3.groupAll) {
    const e11 = d3.groupAttr,
      t10 = e11 && s11 ? s11.getAttribute(`${e11}`) : ''
    f3 =
      e11 && t10 && 'true' !== t10
        ? f3.filter(n12 => n12.getAttribute(`${e11}`) === t10)
        : [s11]
  }
  if (!f3.length) return
  null === (i8 = d3.triggerEvent) || void 0 === i8 || i8.preventDefault()
  const p2 = F.getInstance(),
    v4 = null == p2 ? void 0 : p2.getState()
  if (p2 && (v4 === _.Init || v4 === _.Ready)) {
    const e11 = p2.getOptions().triggerEl
    if (e11 && f3.indexOf(e11) > -1) return
  }
  return (
    Object.assign({}, d3.Carousel || {}).rtl && (f3 = f3.reverse()),
    s11 && void 0 === t9.startIndex && (d3.startIndex = f3.indexOf(s11)),
    F.fromNodes(f3, d3)
  )
}
var F = {
  Plugins: { Hash: m3 },
  version: '6.1.14',
  openers: /* @__PURE__ */ new Map(),
  bind: function (e10, n11, o9, i8) {
    if (!e8()) return
    let s11 = document.body,
      l8 = null,
      a7 = '[data-fancybox]',
      c6 = {}
    ;(e10 instanceof Element && (s11 = e10),
      t(e10) && t(n11)
        ? ((l8 = e10), (a7 = n11))
        : t(n11) && t(o9)
          ? ((l8 = n11), (a7 = o9))
          : t(n11)
            ? (a7 = n11)
            : t(e10) && (a7 = e10),
      'object' == typeof n11 && (c6 = n11 || {}),
      'object' == typeof o9 && (c6 = o9 || {}),
      'object' == typeof i8 && (c6 = i8 || {}),
      (function (e11, t9, n12, o10 = {}) {
        if (!(e11 && e11 instanceof Element && n12)) return
        const i9 = F.openers.get(e11) || /* @__PURE__ */ new Map(),
          s12 = i9.get(t9) || /* @__PURE__ */ new Map()
        ;(s12.set(n12, o10),
          i9.set(t9, s12),
          F.openers.set(e11, i9),
          1 === i9.size && e11.addEventListener('click', F.fromEvent),
          q())
      })(s11, l8, a7, c6))
  },
  close: function (e10 = true, ...t9) {
    if (e10) for (const e11 of z.values()) e11.close(...t9)
    else {
      const e11 = F.getInstance()
      e11 && e11.close(...t9)
    }
  },
  destroy: function () {
    let e10
    for (; (e10 = F.getInstance()); ) e10.destroy()
    for (const e11 of F.openers.keys())
      e11.removeEventListener('click', F.fromEvent)
    F.openers.clear()
  },
  fromEvent: function (e10) {
    if (e10.defaultPrevented) return
    if (e10.button && 0 !== e10.button) return
    if (e10.ctrlKey || e10.metaKey || e10.shiftKey) return
    let t9 = e10.composedPath()[0]
    const n11 = { triggerEvent: e10 }
    if (t9.closest('.fancybox__container.is-hiding'))
      return (k(e10), void e10.stopPropagation())
    const o9 = t9.closest('[data-fancybox-delegate]') || void 0
    if (o9) {
      const e11 = o9.dataset.fancyboxDelegate || '',
        i8 = document.querySelectorAll(`[data-fancybox="${e11}"]`),
        s11 = parseInt(o9.dataset.fancyboxIndex || '', 10) || 0
      ;((t9 = i8[s11] || i8[0]), r3(n11, { delegateEl: o9, startIndex: s11 }))
    }
    return N(t9, n11)
  },
  fromNodes: function (e10, t9) {
    t9 = r3({}, I, t9 || {})
    const n11 = [],
      o9 = e11 =>
        e11 instanceof HTMLImageElement
          ? e11
          : e11 instanceof HTMLElement
            ? e11.querySelector('img:not([aria-hidden])')
            : void 0
    for (const i8 of e10) {
      const s11 = i8.dataset || {},
        l8 =
          t9.delegateEl && e10.indexOf(i8) === t9.startIndex
            ? t9.delegateEl
            : void 0,
        r7 = o9(l8) || o9(i8) || void 0,
        a7 =
          s11.src ||
          i8.getAttribute('href') ||
          i8.getAttribute('currentSrc') ||
          i8.getAttribute('src') ||
          void 0,
        c6 =
          s11.thumb ||
          s11.thumbSrc ||
          (null == r7 ? void 0 : r7.getAttribute('currentSrc')) ||
          (null == r7 ? void 0 : r7.getAttribute('src')) ||
          (null == r7 ? void 0 : r7.dataset.lazySrc) ||
          void 0,
        u6 = {
          src: a7,
          alt:
            s11.alt || (null == r7 ? void 0 : r7.getAttribute('alt')) || void 0,
          thumbSrc: c6,
          thumbEl: r7,
          triggerEl: i8,
          delegateEl: l8,
        }
      for (const e11 in s11) {
        let t10 = s11[e11] + ''
        u6[e11] =
          'true' === t10 ? 'fancybox' !== e11 || '' : 'false' !== t10 && t10
      }
      n11.push(u6)
    }
    return F.show(n11, t9)
  },
  fromSelector: function (e10, n11, o9, i8) {
    if (!e8()) return
    let s11 = document.body,
      l8 = null,
      a7 = '[data-fancybox]',
      c6 = {}
    ;(e10 instanceof Element && (s11 = e10),
      t(e10) && t(n11)
        ? ((l8 = e10), (a7 = n11))
        : t(n11) && t(o9)
          ? ((l8 = n11), (a7 = o9))
          : t(n11)
            ? (a7 = n11)
            : t(e10) && (a7 = e10),
      'object' == typeof n11 && (c6 = n11 || {}),
      'object' == typeof o9 && (c6 = o9 || {}),
      'object' == typeof i8 && (c6 = i8 || {}))
    for (const [e11, t9] of F.openers)
      for (const [n12, o10] of t9)
        for (const [t10, i9] of o10)
          if (e11 === s11 && n12 === l8) {
            const e12 = s11.querySelector((n12 ? `${n12} ` : '') + a7)
            if (e12 && e12.matches(t10)) return F.fromTriggerEl(e12, c6)
          }
  },
  fromTriggerEl: N,
  getCarousel: function () {
    var e10
    return (
      (null === (e10 = F.getInstance()) || void 0 === e10
        ? void 0
        : e10.getCarousel()) || void 0
    )
  },
  getDefaults: function () {
    return I
  },
  getInstance: function (e10) {
    if (e10) {
      const t9 = z.get(e10)
      return t9 && t9.getState() !== _.Destroyed ? t9 : void 0
    }
    return (
      Array.from(z.values())
        .reverse()
        .find(e11 => {
          if (e11.getState() !== _.Destroyed) return e11
        }) || void 0
    )
  },
  getSlide: function () {
    var e10
    return (
      (null === (e10 = F.getInstance()) || void 0 === e10
        ? void 0
        : e10.getSlide()) || void 0
    )
  },
  show: function (e10 = [], t9 = {}) {
    return (q(), D().init(e10, t9))
  },
  unbind: function (e10, n11, o9) {
    if (!e8()) return
    let i8 = document.body,
      s11 = null,
      l8 = '[data-fancybox]'
    ;(e10 instanceof Element && (i8 = e10),
      t(e10) && t(n11)
        ? ((s11 = e10), (l8 = n11))
        : t(n11) && t(o9)
          ? ((s11 = n11), (l8 = o9))
          : t(n11)
            ? (l8 = n11)
            : t(e10) && (l8 = e10),
      (function (e11, t9, n12) {
        if (!(e11 && e11 instanceof Element && n12)) return
        const o10 = F.openers.get(e11) || /* @__PURE__ */ new Map(),
          i9 = o10.get(t9) || /* @__PURE__ */ new Map()
        ;(i9 && n12 && i9.delete(n12),
          (i9.size && n12) || o10.delete(t9),
          o10.size ||
            (F.openers.delete(e11),
            e11.removeEventListener('click', F.fromEvent)))
      })(i8, s11, l8))
  },
}
export {
  l3 as Arrows,
  o6 as Autoplay,
  x2 as Carousel,
  F as Fancybox,
  _ as FancyboxState,
  l6 as Fullscreen,
  l4 as Html,
  i4 as Lazyload,
  y as PANZOOM_DEFAULT_POS,
  S as Panzoom,
  v as PanzoomAction,
  b as PanzoomZoomLevel,
  i3 as Sync,
  c4 as Thumbs,
  c3 as Toolbar,
  a4 as ToolbarColumn,
  s9 as Video,
  s6 as Zoomable,
}
/*! Bundled license information:

@fancyapps/ui/dist/utils/isString.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/isNode.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/getScrollableParent.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/strToHtml.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/clamp.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/isPlainObject.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/isEqual.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/libs/tween.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/libs/gestures.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/panzoom/l10n/en_EN.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/addClass.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/removeClass.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/toggleClass.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/panzoom/panzoom.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/getDirectChildren.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/extend.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/map.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/carousel/l10n/en_EN.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/carousel/carousel.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/scrollLock.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/canUseDOM.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/utils/replaceAll.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/carousel/carousel.zoomable.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/carousel/carousel.sync.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/carousel/carousel.lazyload.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/carousel/carousel.arrows.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/shared/buttons.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/carousel/carousel.toolbar.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/carousel/carousel.autoplay.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/carousel/carousel.thumbs.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/carousel/carousel.html.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/carousel/carousel.video.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/carousel/carousel.fullscreen.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/fancybox/fancybox.hash.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/fancybox/l10n/en_EN.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/fancybox/fancybox.js:
  (*! License details at fancyapps.com/license *)

@fancyapps/ui/dist/index.js:
  (*! License details at fancyapps.com/license *)
*/
//# sourceMappingURL=@fancyapps_ui.js.map
