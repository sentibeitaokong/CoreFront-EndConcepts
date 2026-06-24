import {
  arrow,
  autoUpdate,
  offset,
  shift,
  size,
  useFloating
} from "./chunk-Z2CB3TEY.js";
import {
  Schema
} from "./chunk-G2ULECEI.js";
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
  onUnmounted,
  openBlock,
  provide,
  reactive,
  ref,
  render,
  renderList,
  renderSlot,
  shallowReactive,
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
} from "./chunk-N5XGNZJ6.js";
import "./chunk-PZ5AY32C.js";

// packages/xbElement/dist/es/x-element.js
import { FontAwesomeIcon as se } from "@fortawesome/vue-fontawesome";
var P = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports);
var he = P((e) => {
  Object.defineProperty(e, "__esModule", { value: true });
  var t = "fas", n = "spinner", r = 512, i = 512, a = [], o = "f110", s = "M208 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm0 416a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM48 208a48 48 0 1 1 0 96 48 48 0 1 1 0-96zm368 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM75 369.1A48 48 0 1 1 142.9 437 48 48 0 1 1 75 369.1zM75 75A48 48 0 1 1 142.9 142.9 48 48 0 1 1 75 75zM437 369.1A48 48 0 1 1 369.1 437 48 48 0 1 1 437 369.1z";
  e.definition = {
    prefix: t,
    iconName: n,
    icon: [
      r,
      i,
      a,
      o,
      s
    ]
  }, e.faSpinner = e.definition, e.prefix = t, e.iconName = n, e.width = r, e.height = i, e.ligatures = a, e.unicode = o, e.svgPathData = s, e.aliases = a;
});
var ge = typeof global == "object" && global && global.Object === Object && global;
var _e = typeof self == "object" && self && self.Object === Object && self;
var F = ge || _e || Function("return this")();
var I = F.Symbol;
var ve = Object.prototype;
var ye = ve.hasOwnProperty;
var be = ve.toString;
var xe = I ? I.toStringTag : void 0;
function Se(e) {
  var t = ye.call(e, xe), n = e[xe];
  try {
    e[xe] = void 0;
    var r = true;
  } catch {
  }
  var i = be.call(e);
  return r && (t ? e[xe] = n : delete e[xe]), i;
}
var Ce = Object.prototype.toString;
function we(e) {
  return Ce.call(e);
}
var Te = "[object Null]";
var Ee = "[object Undefined]";
var De = I ? I.toStringTag : void 0;
function L(e) {
  return e == null ? e === void 0 ? Ee : Te : De && De in Object(e) ? Se(e) : we(e);
}
function R(e) {
  return typeof e == "object" && !!e;
}
var Oe = "[object Symbol]";
function ke(e) {
  return typeof e == "symbol" || R(e) && L(e) == Oe;
}
function Ae(e, t) {
  for (var n = -1, r = e == null ? 0 : e.length, i = Array(r); ++n < r; ) i[n] = t(e[n], n, e);
  return i;
}
var z = Array.isArray;
var je = Infinity;
var Me = I ? I.prototype : void 0;
var Ne = Me ? Me.toString : void 0;
function Pe(e) {
  if (typeof e == "string") return e;
  if (z(e)) return Ae(e, Pe) + "";
  if (ke(e)) return Ne ? Ne.call(e) : "";
  var t = e + "";
  return t == "0" && 1 / e == -je ? "-0" : t;
}
var Fe = /\s/;
function Ie(e) {
  for (var t = e.length; t-- && Fe.test(e.charAt(t)); ) ;
  return t;
}
var Le = /^\s+/;
function Re(e) {
  return e && e.slice(0, Ie(e) + 1).replace(Le, "");
}
function B(e) {
  var t = typeof e;
  return e != null && (t == "object" || t == "function");
}
var ze = NaN;
var Be = /^[-+]0x[0-9a-f]+$/i;
var Ve = /^0b[01]+$/i;
var He = /^0o[0-7]+$/i;
var Ue = parseInt;
function We(e) {
  if (typeof e == "number") return e;
  if (ke(e)) return ze;
  if (B(e)) {
    var t = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = B(t) ? t + "" : t;
  }
  if (typeof e != "string") return e === 0 ? e : +e;
  e = Re(e);
  var n = Ve.test(e);
  return n || He.test(e) ? Ue(e.slice(2), n ? 2 : 8) : Be.test(e) ? ze : +e;
}
function Ge(e) {
  return e;
}
var Ke = "[object AsyncFunction]";
var qe = "[object Function]";
var Je = "[object GeneratorFunction]";
var Ye = "[object Proxy]";
function Xe(e) {
  if (!B(e)) return false;
  var t = L(e);
  return t == qe || t == Je || t == Ke || t == Ye;
}
var Ze = F["__core-js_shared__"];
var Qe = function() {
  var e = /[^.]+$/.exec(Ze && Ze.keys && Ze.keys.IE_PROTO || "");
  return e ? "Symbol(src)_1." + e : "";
}();
function $e(e) {
  return !!Qe && Qe in e;
}
var et = Function.prototype.toString;
function V(e) {
  if (e != null) {
    try {
      return et.call(e);
    } catch {
    }
    try {
      return e + "";
    } catch {
    }
  }
  return "";
}
var tt = /[\\^$.*+?()[\]{}|]/g;
var nt = /^\[object .+?Constructor\]$/;
var rt = Function.prototype;
var it = Object.prototype;
var at = rt.toString;
var ot = it.hasOwnProperty;
var st = RegExp("^" + at.call(ot).replace(tt, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
function ct(e) {
  return !B(e) || $e(e) ? false : (Xe(e) ? st : nt).test(V(e));
}
function lt(e, t) {
  return e == null ? void 0 : e[t];
}
function H(e, t) {
  var n = lt(e, t);
  return ct(n) ? n : void 0;
}
var ut = H(F, "WeakMap");
var dt = Object.create;
var ft = /* @__PURE__ */ function() {
  function e() {
  }
  return function(t) {
    if (!B(t)) return {};
    if (dt) return dt(t);
    e.prototype = t;
    var n = new e();
    return e.prototype = void 0, n;
  };
}();
function pt(e, t, n) {
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
function mt(e, t) {
  var n = -1, r = e.length;
  for (t || (t = Array(r)); ++n < r; ) t[n] = e[n];
  return t;
}
var ht = 800;
var gt = 16;
var _t = Date.now;
function vt(e) {
  var t = 0, n = 0;
  return function() {
    var r = _t(), i = gt - (r - n);
    if (n = r, i > 0) {
      if (++t >= ht) return arguments[0];
    } else t = 0;
    return e.apply(void 0, arguments);
  };
}
function yt(e) {
  return function() {
    return e;
  };
}
var bt = function() {
  try {
    var e = H(Object, "defineProperty");
    return e({}, "", {}), e;
  } catch {
  }
}();
var xt = vt(bt ? function(e, t) {
  return bt(e, "toString", {
    configurable: true,
    enumerable: false,
    value: yt(t),
    writable: true
  });
} : Ge);
function St(e, t) {
  for (var n = -1, r = e == null ? 0 : e.length; ++n < r && t(e[n], n, e) !== false; ) ;
  return e;
}
var Ct = 9007199254740991;
var wt = /^(?:0|[1-9]\d*)$/;
function Tt(e, t) {
  var n = typeof e;
  return t ?? (t = Ct), !!t && (n == "number" || n != "symbol" && wt.test(e)) && e > -1 && e % 1 == 0 && e < t;
}
function Et(e, t, n) {
  t == "__proto__" && bt ? bt(e, t, {
    configurable: true,
    enumerable: true,
    value: n,
    writable: true
  }) : e[t] = n;
}
function Dt(e, t) {
  return e === t || e !== e && t !== t;
}
var Ot = Object.prototype.hasOwnProperty;
function kt(e, t, n) {
  var r = e[t];
  (!(Ot.call(e, t) && Dt(r, n)) || n === void 0 && !(t in e)) && Et(e, t, n);
}
function At(e, t, n, r) {
  var i = !n;
  n || (n = {});
  for (var a = -1, o = t.length; ++a < o; ) {
    var s = t[a], c = r ? r(n[s], e[s], s, n, e) : void 0;
    c === void 0 && (c = e[s]), i ? Et(n, s, c) : kt(n, s, c);
  }
  return n;
}
var jt = Math.max;
function Mt(e, t, n) {
  return t = jt(t === void 0 ? e.length - 1 : t, 0), function() {
    for (var r = arguments, i = -1, a = jt(r.length - t, 0), o = Array(a); ++i < a; ) o[i] = r[t + i];
    i = -1;
    for (var s = Array(t + 1); ++i < t; ) s[i] = r[i];
    return s[t] = n(o), pt(e, this, s);
  };
}
var Nt = 9007199254740991;
function Pt(e) {
  return typeof e == "number" && e > -1 && e % 1 == 0 && e <= Nt;
}
function Ft(e) {
  return e != null && Pt(e.length) && !Xe(e);
}
var It = Object.prototype;
function Lt(e) {
  var t = e && e.constructor;
  return e === (typeof t == "function" && t.prototype || It);
}
function Rt(e, t) {
  for (var n = -1, r = Array(e); ++n < e; ) r[n] = t(n);
  return r;
}
var zt = "[object Arguments]";
function Bt(e) {
  return R(e) && L(e) == zt;
}
var Vt = Object.prototype;
var Ht = Vt.hasOwnProperty;
var Ut = Vt.propertyIsEnumerable;
var Wt = Bt(/* @__PURE__ */ function() {
  return arguments;
}()) ? Bt : function(e) {
  return R(e) && Ht.call(e, "callee") && !Ut.call(e, "callee");
};
function Gt() {
  return false;
}
var Kt = typeof exports == "object" && exports && !exports.nodeType && exports;
var qt = Kt && typeof module == "object" && module && !module.nodeType && module;
var Jt = qt && qt.exports === Kt ? F.Buffer : void 0;
var Yt = (Jt ? Jt.isBuffer : void 0) || Gt;
var Xt = "[object Arguments]";
var Zt = "[object Array]";
var Qt = "[object Boolean]";
var $t = "[object Date]";
var en = "[object Error]";
var tn = "[object Function]";
var nn = "[object Map]";
var rn = "[object Number]";
var an = "[object Object]";
var on = "[object RegExp]";
var sn = "[object Set]";
var cn = "[object String]";
var ln = "[object WeakMap]";
var un = "[object ArrayBuffer]";
var dn = "[object DataView]";
var fn = "[object Float32Array]";
var pn = "[object Float64Array]";
var mn = "[object Int8Array]";
var hn = "[object Int16Array]";
var gn = "[object Int32Array]";
var _n = "[object Uint8Array]";
var vn = "[object Uint8ClampedArray]";
var yn = "[object Uint16Array]";
var bn = "[object Uint32Array]";
var U = {};
U[fn] = U[pn] = U[mn] = U[hn] = U[gn] = U[_n] = U[vn] = U[yn] = U[bn] = true, U[Xt] = U[Zt] = U[un] = U[Qt] = U[dn] = U[$t] = U[en] = U[tn] = U[nn] = U[rn] = U[an] = U[on] = U[sn] = U[cn] = U[ln] = false;
function xn(e) {
  return R(e) && Pt(e.length) && !!U[L(e)];
}
function Sn(e) {
  return function(t) {
    return e(t);
  };
}
var Cn = typeof exports == "object" && exports && !exports.nodeType && exports;
var wn = Cn && typeof module == "object" && module && !module.nodeType && module;
var Tn = wn && wn.exports === Cn && ge.process;
var W = function() {
  try {
    return wn && wn.require && wn.require("util").types || Tn && Tn.binding && Tn.binding("util");
  } catch {
  }
}();
var En = W && W.isTypedArray;
var Dn = En ? Sn(En) : xn;
var On = Object.prototype.hasOwnProperty;
function kn(e, t) {
  var n = z(e), r = !n && Wt(e), i = !n && !r && Yt(e), a = !n && !r && !i && Dn(e), o = n || r || i || a, s = o ? Rt(e.length, String) : [], c = s.length;
  for (var l in e) (t || On.call(e, l)) && !(o && (l == "length" || i && (l == "offset" || l == "parent") || a && (l == "buffer" || l == "byteLength" || l == "byteOffset") || Tt(l, c))) && s.push(l);
  return s;
}
function An(e, t) {
  return function(n) {
    return e(t(n));
  };
}
var jn = An(Object.keys, Object);
var Mn = Object.prototype.hasOwnProperty;
function Nn(e) {
  if (!Lt(e)) return jn(e);
  var t = [];
  for (var n in Object(e)) Mn.call(e, n) && n != "constructor" && t.push(n);
  return t;
}
function Pn(e) {
  return Ft(e) ? kn(e) : Nn(e);
}
function Fn(e) {
  var t = [];
  if (e != null) for (var n in Object(e)) t.push(n);
  return t;
}
var In = Object.prototype.hasOwnProperty;
function Ln(e) {
  if (!B(e)) return Fn(e);
  var t = Lt(e), n = [];
  for (var r in e) r == "constructor" && (t || !In.call(e, r)) || n.push(r);
  return n;
}
function Rn(e) {
  return Ft(e) ? kn(e, true) : Ln(e);
}
var zn = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var Bn = /^\w*$/;
function Vn(e, t) {
  if (z(e)) return false;
  var n = typeof e;
  return n == "number" || n == "symbol" || n == "boolean" || e == null || ke(e) ? true : Bn.test(e) || !zn.test(e) || t != null && e in Object(t);
}
var Hn = H(Object, "create");
function Un() {
  this.__data__ = Hn ? Hn(null) : {}, this.size = 0;
}
function Wn(e) {
  var t = this.has(e) && delete this.__data__[e];
  return this.size -= +!!t, t;
}
var Gn = "__lodash_hash_undefined__";
var Kn = Object.prototype.hasOwnProperty;
function qn(e) {
  var t = this.__data__;
  if (Hn) {
    var n = t[e];
    return n === Gn ? void 0 : n;
  }
  return Kn.call(t, e) ? t[e] : void 0;
}
var Jn = Object.prototype.hasOwnProperty;
function Yn(e) {
  var t = this.__data__;
  return Hn ? t[e] !== void 0 : Jn.call(t, e);
}
var Xn = "__lodash_hash_undefined__";
function Zn(e, t) {
  var n = this.__data__;
  return this.size += +!this.has(e), n[e] = Hn && t === void 0 ? Xn : t, this;
}
function G(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.clear(); ++t < n; ) {
    var r = e[t];
    this.set(r[0], r[1]);
  }
}
G.prototype.clear = Un, G.prototype.delete = Wn, G.prototype.get = qn, G.prototype.has = Yn, G.prototype.set = Zn;
function Qn() {
  this.__data__ = [], this.size = 0;
}
function $n(e, t) {
  for (var n = e.length; n--; ) if (Dt(e[n][0], t)) return n;
  return -1;
}
var er = Array.prototype.splice;
function tr(e) {
  var t = this.__data__, n = $n(t, e);
  return n < 0 ? false : (n == t.length - 1 ? t.pop() : er.call(t, n, 1), --this.size, true);
}
function nr(e) {
  var t = this.__data__, n = $n(t, e);
  return n < 0 ? void 0 : t[n][1];
}
function rr(e) {
  return $n(this.__data__, e) > -1;
}
function ir(e, t) {
  var n = this.__data__, r = $n(n, e);
  return r < 0 ? (++this.size, n.push([e, t])) : n[r][1] = t, this;
}
function K(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.clear(); ++t < n; ) {
    var r = e[t];
    this.set(r[0], r[1]);
  }
}
K.prototype.clear = Qn, K.prototype.delete = tr, K.prototype.get = nr, K.prototype.has = rr, K.prototype.set = ir;
var ar = H(F, "Map");
function or() {
  this.size = 0, this.__data__ = {
    hash: new G(),
    map: new (ar || K)(),
    string: new G()
  };
}
function sr(e) {
  var t = typeof e;
  return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
}
function cr(e, t) {
  var n = e.__data__;
  return sr(t) ? n[typeof t == "string" ? "string" : "hash"] : n.map;
}
function lr(e) {
  var t = cr(this, e).delete(e);
  return this.size -= +!!t, t;
}
function ur(e) {
  return cr(this, e).get(e);
}
function dr(e) {
  return cr(this, e).has(e);
}
function fr(e, t) {
  var n = cr(this, e), r = n.size;
  return n.set(e, t), this.size += n.size == r ? 0 : 1, this;
}
function q(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.clear(); ++t < n; ) {
    var r = e[t];
    this.set(r[0], r[1]);
  }
}
q.prototype.clear = or, q.prototype.delete = lr, q.prototype.get = ur, q.prototype.has = dr, q.prototype.set = fr;
var pr = "Expected a function";
function mr(e, t) {
  if (typeof e != "function" || t != null && typeof t != "function") throw TypeError(pr);
  var n = function() {
    var r = arguments, i = t ? t.apply(this, r) : r[0], a = n.cache;
    if (a.has(i)) return a.get(i);
    var o = e.apply(this, r);
    return n.cache = a.set(i, o) || a, o;
  };
  return n.cache = new (mr.Cache || q)(), n;
}
mr.Cache = q;
var hr = 500;
function gr(e) {
  var t = mr(e, function(e2) {
    return n.size === hr && n.clear(), e2;
  }), n = t.cache;
  return t;
}
var _r = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
var vr = /\\(\\)?/g;
var yr = gr(function(e) {
  var t = [];
  return e.charCodeAt(0) === 46 && t.push(""), e.replace(_r, function(e2, n, r, i) {
    t.push(r ? i.replace(vr, "$1") : n || e2);
  }), t;
});
function br(e) {
  return e == null ? "" : Pe(e);
}
function xr(e, t) {
  return z(e) ? e : Vn(e, t) ? [e] : yr(br(e));
}
var Sr = Infinity;
function Cr(e) {
  if (typeof e == "string" || ke(e)) return e;
  var t = e + "";
  return t == "0" && 1 / e == -Sr ? "-0" : t;
}
function wr(e, t) {
  t = xr(t, e);
  for (var n = 0, r = t.length; e != null && n < r; ) e = e[Cr(t[n++])];
  return n && n == r ? e : void 0;
}
function Tr(e, t) {
  for (var n = -1, r = t.length, i = e.length; ++n < r; ) e[i + n] = t[n];
  return e;
}
var Er = I ? I.isConcatSpreadable : void 0;
function Dr(e) {
  return z(e) || Wt(e) || !!(Er && e && e[Er]);
}
function Or(e, t, n, r, i) {
  var a = -1, o = e.length;
  for (n || (n = Dr), i || (i = []); ++a < o; ) {
    var s = e[a];
    t > 0 && n(s) ? t > 1 ? Or(s, t - 1, n, r, i) : Tr(i, s) : r || (i[i.length] = s);
  }
  return i;
}
function kr(e) {
  return e != null && e.length ? Or(e, 1) : [];
}
function Ar(e) {
  return xt(Mt(e, void 0, kr), e + "");
}
var jr = An(Object.getPrototypeOf, Object);
var Mr = "[object Object]";
var Nr = Function.prototype;
var Pr = Object.prototype;
var Fr = Nr.toString;
var Ir = Pr.hasOwnProperty;
var Lr = Fr.call(Object);
function Rr(e) {
  if (!R(e) || L(e) != Mr) return false;
  var t = jr(e);
  if (t === null) return true;
  var n = Ir.call(t, "constructor") && t.constructor;
  return typeof n == "function" && n instanceof n && Fr.call(n) == Lr;
}
function zr(e, t, n) {
  var r = -1, i = e.length;
  t < 0 && (t = -t > i ? 0 : i + t), n = n > i ? i : n, n < 0 && (n += i), i = t > n ? 0 : n - t >>> 0, t >>>= 0;
  for (var a = Array(i); ++r < i; ) a[r] = e[r + t];
  return a;
}
function Br() {
  this.__data__ = new K(), this.size = 0;
}
function Vr(e) {
  var t = this.__data__, n = t.delete(e);
  return this.size = t.size, n;
}
function Hr(e) {
  return this.__data__.get(e);
}
function Ur(e) {
  return this.__data__.has(e);
}
var Wr = 200;
function Gr(e, t) {
  var n = this.__data__;
  if (n instanceof K) {
    var r = n.__data__;
    if (!ar || r.length < Wr - 1) return r.push([e, t]), this.size = ++n.size, this;
    n = this.__data__ = new q(r);
  }
  return n.set(e, t), this.size = n.size, this;
}
function J(e) {
  var t = this.__data__ = new K(e);
  this.size = t.size;
}
J.prototype.clear = Br, J.prototype.delete = Vr, J.prototype.get = Hr, J.prototype.has = Ur, J.prototype.set = Gr;
function Kr(e, t) {
  return e && At(t, Pn(t), e);
}
function qr(e, t) {
  return e && At(t, Rn(t), e);
}
var Jr = typeof exports == "object" && exports && !exports.nodeType && exports;
var Yr = Jr && typeof module == "object" && module && !module.nodeType && module;
var Xr = Yr && Yr.exports === Jr ? F.Buffer : void 0;
var Zr = Xr ? Xr.allocUnsafe : void 0;
function Qr(e, t) {
  if (t) return e.slice();
  var n = e.length, r = Zr ? Zr(n) : new e.constructor(n);
  return e.copy(r), r;
}
function $r(e, t) {
  for (var n = -1, r = e == null ? 0 : e.length, i = 0, a = []; ++n < r; ) {
    var o = e[n];
    t(o, n, e) && (a[i++] = o);
  }
  return a;
}
function ei() {
  return [];
}
var ti = Object.prototype.propertyIsEnumerable;
var ni = Object.getOwnPropertySymbols;
var ri = ni ? function(e) {
  return e == null ? [] : (e = Object(e), $r(ni(e), function(t) {
    return ti.call(e, t);
  }));
} : ei;
function ii(e, t) {
  return At(e, ri(e), t);
}
var ai = Object.getOwnPropertySymbols ? function(e) {
  for (var t = []; e; ) Tr(t, ri(e)), e = jr(e);
  return t;
} : ei;
function oi(e, t) {
  return At(e, ai(e), t);
}
function si(e, t, n) {
  var r = t(e);
  return z(e) ? r : Tr(r, n(e));
}
function ci(e) {
  return si(e, Pn, ri);
}
function li(e) {
  return si(e, Rn, ai);
}
var ui = H(F, "DataView");
var di = H(F, "Promise");
var fi = H(F, "Set");
var pi = "[object Map]";
var mi = "[object Object]";
var hi = "[object Promise]";
var gi = "[object Set]";
var _i = "[object WeakMap]";
var vi = "[object DataView]";
var yi = V(ui);
var bi = V(ar);
var xi = V(di);
var Si = V(fi);
var Ci = V(ut);
var Y = L;
(ui && Y(new ui(new ArrayBuffer(1))) != vi || ar && Y(new ar()) != pi || di && Y(di.resolve()) != hi || fi && Y(new fi()) != gi || ut && Y(new ut()) != _i) && (Y = function(e) {
  var t = L(e), n = t == mi ? e.constructor : void 0, r = n ? V(n) : "";
  if (r) switch (r) {
    case yi:
      return vi;
    case bi:
      return pi;
    case xi:
      return hi;
    case Si:
      return gi;
    case Ci:
      return _i;
  }
  return t;
});
var wi = Y;
var Ti = Object.prototype.hasOwnProperty;
function Ei(e) {
  var t = e.length, n = new e.constructor(t);
  return t && typeof e[0] == "string" && Ti.call(e, "index") && (n.index = e.index, n.input = e.input), n;
}
var Di = F.Uint8Array;
function Oi(e) {
  var t = new e.constructor(e.byteLength);
  return new Di(t).set(new Di(e)), t;
}
function ki(e, t) {
  var n = t ? Oi(e.buffer) : e.buffer;
  return new e.constructor(n, e.byteOffset, e.byteLength);
}
var Ai = /\w*$/;
function ji(e) {
  var t = new e.constructor(e.source, Ai.exec(e));
  return t.lastIndex = e.lastIndex, t;
}
var Mi = I ? I.prototype : void 0;
var Ni = Mi ? Mi.valueOf : void 0;
function Pi(e) {
  return Ni ? Object(Ni.call(e)) : {};
}
function Fi(e, t) {
  var n = t ? Oi(e.buffer) : e.buffer;
  return new e.constructor(n, e.byteOffset, e.length);
}
var Ii = "[object Boolean]";
var Li = "[object Date]";
var Ri = "[object Map]";
var zi = "[object Number]";
var Bi = "[object RegExp]";
var Vi = "[object Set]";
var Hi = "[object String]";
var Ui = "[object Symbol]";
var Wi = "[object ArrayBuffer]";
var Gi = "[object DataView]";
var Ki = "[object Float32Array]";
var qi = "[object Float64Array]";
var Ji = "[object Int8Array]";
var Yi = "[object Int16Array]";
var Xi = "[object Int32Array]";
var Zi = "[object Uint8Array]";
var Qi = "[object Uint8ClampedArray]";
var $i = "[object Uint16Array]";
var ea = "[object Uint32Array]";
function ta(e, t, n) {
  var r = e.constructor;
  switch (t) {
    case Wi:
      return Oi(e);
    case Ii:
    case Li:
      return new r(+e);
    case Gi:
      return ki(e, n);
    case Ki:
    case qi:
    case Ji:
    case Yi:
    case Xi:
    case Zi:
    case Qi:
    case $i:
    case ea:
      return Fi(e, n);
    case Ri:
      return new r();
    case zi:
    case Hi:
      return new r(e);
    case Bi:
      return ji(e);
    case Vi:
      return new r();
    case Ui:
      return Pi(e);
  }
}
function na(e) {
  return typeof e.constructor == "function" && !Lt(e) ? ft(jr(e)) : {};
}
var ra = "[object Map]";
function ia(e) {
  return R(e) && wi(e) == ra;
}
var aa = W && W.isMap;
var oa = aa ? Sn(aa) : ia;
var sa = "[object Set]";
function ca(e) {
  return R(e) && wi(e) == sa;
}
var la = W && W.isSet;
var ua = la ? Sn(la) : ca;
var da = 1;
var fa = 2;
var pa = 4;
var ma = "[object Arguments]";
var ha = "[object Array]";
var ga = "[object Boolean]";
var _a = "[object Date]";
var va = "[object Error]";
var ya = "[object Function]";
var ba = "[object GeneratorFunction]";
var xa = "[object Map]";
var Sa = "[object Number]";
var Ca = "[object Object]";
var wa = "[object RegExp]";
var Ta = "[object Set]";
var Ea = "[object String]";
var Da = "[object Symbol]";
var Oa = "[object WeakMap]";
var ka = "[object ArrayBuffer]";
var Aa = "[object DataView]";
var ja = "[object Float32Array]";
var Ma = "[object Float64Array]";
var Na = "[object Int8Array]";
var Pa = "[object Int16Array]";
var Fa = "[object Int32Array]";
var Ia = "[object Uint8Array]";
var La = "[object Uint8ClampedArray]";
var Ra = "[object Uint16Array]";
var za = "[object Uint32Array]";
var X = {};
X[ma] = X[ha] = X[ka] = X[Aa] = X[ga] = X[_a] = X[ja] = X[Ma] = X[Na] = X[Pa] = X[Fa] = X[xa] = X[Sa] = X[Ca] = X[wa] = X[Ta] = X[Ea] = X[Da] = X[Ia] = X[La] = X[Ra] = X[za] = true, X[va] = X[ya] = X[Oa] = false;
function Ba(e, t, n, r, i, a) {
  var o, s = t & da, c = t & fa, l = t & pa;
  if (n && (o = i ? n(e, r, i, a) : n(e)), o !== void 0) return o;
  if (!B(e)) return e;
  var u = z(e);
  if (u) {
    if (o = Ei(e), !s) return mt(e, o);
  } else {
    var d = wi(e), f = d == ya || d == ba;
    if (Yt(e)) return Qr(e, s);
    if (d == Ca || d == ma || f && !i) {
      if (o = c || f ? {} : na(e), !s) return c ? oi(e, qr(o, e)) : ii(e, Kr(o, e));
    } else {
      if (!X[d]) return i ? e : {};
      o = ta(e, d, s);
    }
  }
  a || (a = new J());
  var p = a.get(e);
  if (p) return p;
  a.set(e, o), ua(e) ? e.forEach(function(r2) {
    o.add(Ba(r2, t, n, r2, e, a));
  }) : oa(e) && e.forEach(function(r2, i2) {
    o.set(i2, Ba(r2, t, n, i2, e, a));
  });
  var m = u ? void 0 : (l ? c ? li : ci : c ? Rn : Pn)(e);
  return St(m || e, function(r2, i2) {
    m && (i2 = r2, r2 = e[i2]), kt(o, i2, Ba(r2, t, n, i2, e, a));
  }), o;
}
var Va = function() {
  return F.Date.now();
};
var Ha = "Expected a function";
var Ua = Math.max;
var Wa = Math.min;
function Ga(e, t, n) {
  var r, i, a, o, s, c, l = 0, u = false, d = false, f = true;
  if (typeof e != "function") throw TypeError(Ha);
  t = We(t) || 0, B(n) && (u = !!n.leading, d = "maxWait" in n, a = d ? Ua(We(n.maxWait) || 0, t) : a, f = "trailing" in n ? !!n.trailing : f);
  function p(t2) {
    var n2 = r, a2 = i;
    return r = i = void 0, l = t2, o = e.apply(a2, n2), o;
  }
  function m(e2) {
    return l = e2, s = setTimeout(_, t), u ? p(e2) : o;
  }
  function h2(e2) {
    var n2 = e2 - c, r2 = e2 - l, i2 = t - n2;
    return d ? Wa(i2, a - r2) : i2;
  }
  function g(e2) {
    var n2 = e2 - c, r2 = e2 - l;
    return c === void 0 || n2 >= t || n2 < 0 || d && r2 >= a;
  }
  function _() {
    var e2 = Va();
    if (g(e2)) return v(e2);
    s = setTimeout(_, h2(e2));
  }
  function v(e2) {
    return s = void 0, f && r ? p(e2) : (r = i = void 0, o);
  }
  function y() {
    s !== void 0 && clearTimeout(s), l = 0, r = c = i = s = void 0;
  }
  function b() {
    return s === void 0 ? o : v(Va());
  }
  function x() {
    var e2 = Va(), n2 = g(e2);
    if (r = arguments, i = this, c = e2, n2) {
      if (s === void 0) return m(c);
      if (d) return clearTimeout(s), s = setTimeout(_, t), p(c);
    }
    return s === void 0 && (s = setTimeout(_, t)), o;
  }
  return x.cancel = y, x.flush = b, x;
}
function Ka(e) {
  var t = e == null ? 0 : e.length;
  return t ? e[t - 1] : void 0;
}
function qa(e, t) {
  return t.length < 2 ? e : wr(e, zr(t, 0, -1));
}
function Ja(e) {
  return e == null;
}
var Ya = Object.prototype.hasOwnProperty;
function Xa(e, t) {
  t = xr(t, e);
  var n = -1, r = t.length;
  if (!r) return true;
  for (; ++n < r; ) {
    var i = Cr(t[n]);
    if (i === "__proto__" && !Ya.call(e, "__proto__") || (i === "constructor" || i === "prototype") && n < r - 1) return false;
  }
  var a = qa(e, t);
  return a == null || delete a[Cr(Ka(t))];
}
function Za(e) {
  return Rr(e) ? void 0 : e;
}
var Qa = 1;
var $a = 2;
var eo = 4;
var to = Ar(function(e, t) {
  var n = {};
  if (e == null) return n;
  var r = false;
  t = Ae(t, function(t2) {
    return t2 = xr(t2, e), r || (r = t2.length > 1), t2;
  }), At(e, li(e), n), r && (n = Ba(n, Qa | $a | eo, Za));
  for (var i = t.length; i--; ) Xa(n, t[i]);
  return n;
});
var no = he();
var Z = defineComponent({
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
    let t = e, r = computed(() => to(t, ["color", "type"])), i = computed(() => t.color ? { color: t.color } : {});
    return (t2, n) => (openBlock(), createElementBlock("i", mergeProps({ class: ["vk-icon", { [`vk-icon--${e.type}`]: e.type }] }, t2.$attrs, { style: i.value }), [createVNode(unref(se), normalizeProps(guardReactiveProps(r.value)), null, 16)], 16));
  }
});
var ro = [
  "disabled",
  "autofocus",
  "nativeType"
];
var io = defineComponent({
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
    let n = ref();
    return t({ ref: n }), (t2, s) => (openBlock(), createElementBlock("button", {
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
      e.loading ? (openBlock(), createBlock(Z, {
        key: 0,
        icon: unref(no.faSpinner),
        spin: ""
      }, null, 8, ["icon"])) : createCommentVNode("", true),
      e.icon ? (openBlock(), createBlock(Z, {
        key: 1,
        icon: e.icon
      }, null, 8, ["icon"])) : createCommentVNode("", true),
      createBaseVNode("span", null, [renderSlot(t2.$slots, "default")])
    ], 10, ro));
  }
});
io.install = (e) => {
  e.component(io.name || "VkButton", io);
};
var ao = io;
var oo = Symbol("collapseContextKey");
var so = { class: "vk-collapse" };
var co = defineComponent({
  name: "VkCollapse",
  __name: "Collapse",
  props: {
    modelValue: { default: () => ["a"] },
    accordion: { type: Boolean }
  },
  emits: ["update:modelValue", "change"],
  setup(e, { emit: t }) {
    let n = e, r = t, i = ref(n.modelValue);
    return watch(() => n.modelValue, () => {
      i.value = n.modelValue;
    }), n.accordion && i.value.length > 1 && console.warn("accordion mode should only have one acitve item"), provide(oo, {
      activeNames: i,
      handleItemClick: (e2) => {
        let t2 = [...i.value];
        if (n.accordion) t2 = [i.value[0] == e2 ? "" : e2], i.value = t2;
        else {
          let n2 = i.value.indexOf(e2);
          n2 > -1 ? t2.splice(n2, 1) : t2.push(e2), i.value = t2;
        }
        r("update:modelValue", t2), r("change", t2);
      }
    }), (e2, t2) => (openBlock(), createElementBlock("div", so, [renderSlot(e2.$slots, "default")]));
  }
});
var lo = P((e) => {
  Object.defineProperty(e, "__esModule", { value: true });
  var t = "fas", n = "angle-right", r = 256, i = 512, a = [8250], o = "f105", s = "M247.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L179.2 256 41.9 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z";
  e.definition = {
    prefix: t,
    iconName: n,
    icon: [
      r,
      i,
      a,
      o,
      s
    ]
  }, e.faAngleRight = e.definition, e.prefix = t, e.iconName = n, e.width = r, e.height = i, e.ligatures = a, e.unicode = o, e.svgPathData = s, e.aliases = a;
})();
var uo = ["id"];
var fo = { class: "vk-collapse-item__wrapper" };
var po = { class: "vk-collapse-item__content" };
var mo = defineComponent({
  name: "VkCollapseItem",
  __name: "CollapseItem",
  props: {
    name: {},
    title: {},
    disabled: { type: Boolean }
  },
  setup(e) {
    let r = e, i = inject(oo), l = computed(() => i == null ? void 0 : i.activeNames.value.includes(r.name)), u = () => {
      r.disabled || (i == null ? void 0 : i.handleItemClick(r.name));
    }, d = {
      beforeEnter(e2) {
        e2.style.height = "0px", e2.style.overflow = "hidden";
      },
      enter(e2) {
        e2.style.height = `${e2.scrollHeight}px`;
      },
      afterEnter(e2) {
        e2.style.height = "", e2.style.overflow = "";
      },
      beforeLeave(e2) {
        e2.style.height = `${e2.scrollHeight}px`, e2.style.overflow = "hidden";
      },
      leave(e2) {
        e2.style.height = "0px";
      },
      afterLeave(e2) {
        e2.style.height = "", e2.style.overflow = "";
      }
    };
    return (n, r2) => (openBlock(), createElementBlock("div", { class: normalizeClass(["vk-collapse-item", { "is-disabled": e.disabled }]) }, [createBaseVNode("div", {
      class: normalizeClass(["vk-collapse-item__header", {
        "is-active": l.value,
        "is-disabled": e.disabled
      }]),
      id: `vk-collapse-item-${e.name}`,
      onClick: u
    }, [renderSlot(n.$slots, "title", {}, () => [createTextVNode(toDisplayString(e.title), 1)]), createVNode(Z, {
      icon: unref(lo.faAngleRight),
      class: "header-angle"
    }, null, 8, ["icon"])], 10, uo), createVNode(Transition, mergeProps({ name: "slide" }, toHandlers(d)), {
      default: withCtx(() => [withDirectives(createBaseVNode("div", fo, [createBaseVNode("div", po, [renderSlot(n.$slots, "default")])], 512), [[vShow, l.value]])]),
      _: 3
    }, 16)], 2));
  }
});
co.install = (e) => {
  e.component(co.name || "VkCollapse", co);
}, mo.install = (e) => {
  e.component(mo.name || "VkCollapseItem", mo);
};
var ho = co;
var go = (e, t) => {
  let n = (n2) => {
    e.value && n2.target && (e.value.contains(n2.target) || t(n2));
  };
  onMounted(() => {
    document.addEventListener("click", n);
  }), onUnmounted(() => {
    document.removeEventListener("click", n);
  });
};
var _o = defineComponent({
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
  setup(e, { expose: r, emit: l }) {
    let u = computed(() => {
      var _a2, _b;
      let t = [
        offset(10),
        shift({ padding: 8 }),
        arrow({
          element: y,
          padding: 4
        })
      ], n;
      return n = ((_a2 = e.popperOptions) == null ? void 0 : _a2.middleware) ? [...t, ...Array.isArray((_b = e.popperOptions) == null ? void 0 : _b.middleware) ? e.popperOptions.middleware : []] : [...t], {
        placement: e.placement,
        whileElementsMounted: autoUpdate,
        ...e.popperOptions,
        middleware: n
      };
    }), d = l, f = ref(false), p = ref(), h2 = ref(), _ = ref(), y = ref(), S = reactive({}), T = reactive({}), { floatingStyles: ee, middlewareData: D, placement: te } = useFloating(p, h2, u.value), ne = computed(() => te.value.split("-")[0]), re = computed(() => {
      let e2 = D.value.arrow;
      if (!e2) return {};
      let { x: t, y: n } = e2, r2 = {
        top: "bottom",
        right: "left",
        bottom: "top",
        left: "right"
      }[ne.value];
      return {
        left: t == null ? "" : `${t}px`,
        top: n == null ? "" : `${n}px`,
        right: "",
        bottom: "",
        [r2]: "-4px"
      };
    }), ie = () => {
      f.value = true, d("visible-change", true);
    }, ae = () => {
      f.value = false, d("visible-change", false);
    }, oe = Ga(ie, e.openDelay), N = Ga(ae, e.closeDelay), se2 = () => {
      N.cancel(), oe();
    }, fe = () => {
      oe.cancel(), N();
    }, me = () => {
      f.value ? fe() : se2();
    }, P2 = () => {
      e.trigger === "hover" ? (S.mouseenter = se2, T.mouseleave = fe) : e.trigger === "click" && (S.click = me);
    };
    return go(_, () => {
      f.value && e.trigger === "click" && !e.manual && fe(), f.value && d("click-outside", true);
    }), watch(() => e.trigger, (e2, t) => {
      e2 !== t && (S = {}, T = {}, P2());
    }), e.manual || P2(), watch(() => e.manual, (e2) => {
      e2 ? (S = {}, T = {}) : P2();
    }), onUnmounted(() => {
      f.value = false;
    }), r({
      show: se2,
      hide: fe
    }), (n, r2) => (openBlock(), createElementBlock("div", mergeProps({ class: "vk-tooltip" }, toHandlers(unref(T), true), {
      ref_key: "popperOutContainer",
      ref: _
    }), [createBaseVNode("div", mergeProps({
      class: "vk-tooltip__trigger",
      ref_key: "triggerNode",
      ref: p
    }, toHandlers(unref(S), true)), [renderSlot(n.$slots, "default")], 16), createVNode(Transition, { name: e.transition }, {
      default: withCtx(() => [f.value ? (openBlock(), createElementBlock("div", {
        key: 0,
        class: "vk-tooltip__popper",
        ref_key: "overlayNode",
        ref: h2,
        style: normalizeStyle(unref(ee))
      }, [renderSlot(n.$slots, "content", {}, () => [createTextVNode(toDisplayString(e.content), 1)]), createBaseVNode("div", {
        ref_key: "arrowRef",
        ref: y,
        id: "arrow",
        class: normalizeClass(`arrow-${ne.value}`),
        style: normalizeStyle(re.value)
      }, null, 6)], 4)) : createCommentVNode("", true)]),
      _: 3
    }, 8, ["name"])], 16));
  }
});
var vo = defineComponent({
  props: { vNode: {
    type: [String, Object],
    required: true
  } },
  setup(e) {
    return () => e.vNode;
  }
});
var yo = { class: "vk-dropdown" };
var bo = { class: "vk-dropdown__menu" };
var xo = {
  key: 0,
  role: "separator",
  class: "divided-placeholder"
};
var So = ["onClick", "id"];
var Co = defineComponent({
  name: "VkDropDown",
  __name: "Dropdown",
  props: {
    menuOptions: {},
    hideAfterClick: {
      type: Boolean,
      default: true
    }
  },
  emits: ["visible-change", "select"],
  setup(t, { expose: n, emit: r }) {
    let s = t, l = r, u = ref(), d = (e) => {
      l("visible-change", e);
    }, f = (e) => {
      var _a2;
      e.disabled || (l("select", e), s.hideAfterClick && ((_a2 = u.value) == null ? void 0 : _a2.hide()));
    };
    return n({
      show: () => {
        var _a2;
        return (_a2 = u.value) == null ? void 0 : _a2.show();
      },
      hide: () => {
        var _a2;
        return (_a2 = u.value) == null ? void 0 : _a2.hide();
      }
    }), (n2, r2) => (openBlock(), createElementBlock("div", yo, [createVNode(_o, {
      placement: s.placement,
      trigger: s.trigger,
      "close-delay": s.closeDelay,
      "open-delay": s.openDelay,
      "popper-options": s.popperOptions,
      manual: s.manual,
      ref_key: "TooltipRef",
      ref: u,
      onVisibleChange: d
    }, {
      content: withCtx(() => [createBaseVNode("ul", bo, [(openBlock(true), createElementBlock(Fragment, null, renderList(t.menuOptions, (t2) => (openBlock(), createElementBlock(Fragment, { key: t2.key }, [t2.divided ? (openBlock(), createElementBlock("li", xo)) : createCommentVNode("", true), createBaseVNode("li", {
        onClick: () => f(t2),
        class: normalizeClass(["vk-dropdown__item", {
          "is-disabled": t2.disabled,
          "is-divided": t2.divided
        }]),
        id: `dropdown-item-${t2.key}`
      }, [createVNode(unref(vo), { "v-node": t2.label }, null, 8, ["v-node"])], 10, So)], 64))), 128))])]),
      default: withCtx(() => [renderSlot(n2.$slots, "default")]),
      _: 3
    }, 8, [
      "placement",
      "trigger",
      "close-delay",
      "open-delay",
      "popper-options",
      "manual"
    ])]));
  }
});
Co.install = (e) => {
  e.component(Co.name || "VkDropdown", Co);
};
var wo = Co;
var To = Symbol("formContextKey");
var Eo = Symbol("formItemContextKey");
var Do = { class: "vk-form" };
var Oo = defineComponent({
  name: "VkForm",
  __name: "Form",
  props: {
    model: {},
    rules: {}
  },
  setup(e, { expose: t }) {
    let n = [];
    return provide(To, {
      model: e.model,
      rules: e.rules,
      addField: (e2) => {
        n.push(e2);
      },
      removeField: (e2) => {
        e2.prop && n.splice(n.indexOf(e2), 1);
      }
    }), t({
      validate: async () => {
        let e2 = {};
        for (let t2 of n) try {
          await t2.validate("");
        } catch (t3) {
          let n2 = t3;
          e2 = {
            ...e2,
            ...n2.fields
          };
        }
        return Object.keys(e2).length === 0 ? true : Promise.reject(e2);
      },
      clearValidate: (e2 = []) => {
        (e2.length > 0 ? n.filter((t2) => e2.includes(t2.prop)) : n).forEach((e3) => e3.clearValidate());
      },
      resetFields: (e2 = []) => {
        (e2.length > 0 ? n.filter((t2) => e2.includes(t2.prop)) : n).forEach((e3) => e3.resetField());
      }
    }), (e2, t2) => (openBlock(), createElementBlock("form", Do, [renderSlot(e2.$slots, "default")]));
  }
});
var ko = { class: "vk-form-item__label" };
var Ao = { class: "vk-form-item__content" };
var jo = {
  key: 0,
  class: "vk-form-item__error-msg"
};
var Mo = defineComponent({
  name: "VkFormItem",
  __name: "FormItem",
  props: {
    label: {},
    prop: {}
  },
  setup(e, { expose: t }) {
    let r = null, c = inject(To), l = reactive({
      state: "init",
      errorMsg: "",
      loading: false
    }), u = computed(() => {
      let t2 = c == null ? void 0 : c.model;
      return t2 && e.prop && !Ja(t2[e.prop]) ? t2[e.prop] : null;
    }), d = computed(() => {
      let t2 = c == null ? void 0 : c.rules;
      return t2 && e.prop && !Ja(t2[e.prop]) ? t2[e.prop] : [];
    }), p = (e2) => {
      let t2 = d.value;
      return t2 ? t2.filter((t3) => !t3.trigger || !e2 ? true : t3.trigger && t3.trigger === e2) : [];
    }, m = computed(() => d.value.some((e2) => e2.required)), h2 = async (t2) => {
      let n = e.prop, r2 = p(t2);
      if (r2.length === 0) return true;
      if (n) {
        let e2 = new Schema({ [n]: r2 });
        return l.loading = true, e2.validate({ [n]: u.value }).then((e3) => {
          l.state = "success", console.log(e3);
        }).catch((e3) => {
          var _a2;
          let { errors: t3 } = e3;
          return l.state = "error", l.errorMsg = t3 && t3.length > 0 && ((_a2 = t3[0]) == null ? void 0 : _a2.message) || "", Promise.reject(e3);
        }).finally(() => {
          l.loading = false;
        });
      }
    }, _ = () => {
      l.loading = false, l.errorMsg = "", l.state = "init";
    }, v = () => {
      _();
      let t2 = c == null ? void 0 : c.model;
      t2 && e.prop && !Ja(t2[e.prop]) && (t2[e.prop] = r);
    }, w = {
      prop: e.prop || "",
      validate: h2,
      resetField: v,
      clearValidate: _
    };
    return provide(Eo, w), onMounted(() => {
      e.prop && (c == null ? void 0 : c.addField(w), r = u.value);
    }), onUnmounted(() => {
      c == null ? void 0 : c.removeField(w);
    }), t({
      validateStatus: l,
      validate: h2,
      resetField: v,
      clearValidate: _
    }), (t2, n) => (openBlock(), createElementBlock("div", { class: normalizeClass(["vk-form-item", {
      "is-error": l.state === "error",
      "is-success": l.state === "success",
      "is-loading": l.loading,
      "is-required": m.value
    }]) }, [createBaseVNode("label", ko, [renderSlot(t2.$slots, "label", { label: e.label }, () => [createTextVNode(toDisplayString(e.label), 1)])]), createBaseVNode("div", Ao, [renderSlot(t2.$slots, "default", { validate: h2 }), l.state === "error" ? (openBlock(), createElementBlock("div", jo, toDisplayString(l.errorMsg), 1)) : createCommentVNode("", true)])], 2));
  }
});
Oo.install = (e) => {
  e.component(Oo.name || "VkForm", Oo);
}, Mo.install = (e) => {
  e.component(Mo.name || "VkFormItem", Mo);
};
var No = Oo;
Z.install = (e) => {
  e.component(Z.name || "VkIcon", Z);
};
var Q = Z;
var Po = ref(0);
var Fo = (e = 2e3) => {
  let t = ref(e), r = computed(() => Po.value + t.value);
  return {
    currentIndex: r,
    nextIndex: () => (Po.value++, r.value),
    initialZIndex: t
  };
};
var Io = 1;
var $ = shallowReactive([]);
var { nextIndex: Lo } = Fo();
var Ro = (e) => {
  let t = `message_${Io++}`, n = document.createElement("div"), r = () => {
    let e2 = $.findIndex((e3) => e3.id === t);
    e2 !== -1 && ($.splice(e2, 1), render(null, n));
  }, i = () => {
    let e2 = $.find((e3) => e3.id === t);
    e2 && (e2.vm.exposed.visible.value = false);
  }, a = {
    ...e,
    id: t,
    zIndex: Lo(),
    onDestory: r
  }, o = h(Go, a);
  render(o, n), document.body.appendChild(n.firstElementChild);
  let s = {
    id: t,
    vnode: o,
    vm: o.component,
    props: a,
    destory: i
  };
  return $.push(s), s;
};
var zo = (e) => {
  let t = $.findIndex((t2) => t2.id === e);
  return t <= 0 ? 0 : $[t - 1].vm.exposed.bottomOffset.value;
};
var Bo = () => {
  $.forEach((e) => {
    e.destory();
  });
};
function Vo(e, t, n) {
  isRef(e) ? watch(e, (e2, r) => {
    r == null ? void 0 : r.removeEventListener(t, n), e2 == null ? void 0 : e2.addEventListener(t, n);
  }) : onMounted(() => {
    e == null ? void 0 : e.addEventListener(t, n);
  }), onUnmounted(() => {
    var _a2;
    (_a2 = unref(e)) == null ? void 0 : _a2.removeEventListener(t, n);
  });
}
var Ho = P((e) => {
  Object.defineProperty(e, "__esModule", { value: true });
  var t = "fas", n = "xmark", r = 384, i = 512, a = [
    128473,
    10005,
    10006,
    10060,
    215,
    "close",
    "multiply",
    "remove",
    "times"
  ], o = "f00d", s = "M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z";
  e.definition = {
    prefix: t,
    iconName: n,
    icon: [
      r,
      i,
      a,
      o,
      s
    ]
  }, e.faXmark = e.definition, e.prefix = t, e.iconName = n, e.width = r, e.height = i, e.ligatures = a, e.unicode = o, e.svgPathData = s, e.aliases = a;
})();
var Uo = { class: "vk-message__content" };
var Wo = {
  key: 0,
  class: "vk-message__close"
};
var Go = defineComponent({
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
  setup(e, { expose: s }) {
    let l = ref(false), u = ref(), d = ref(0), f = computed(() => zo(e.id)), p = computed(() => e.offset + f.value), m = computed(() => p.value + d.value), h2 = computed(() => ({
      top: p.value + "px",
      zIndex: e.zIndex
    })), _;
    function b() {
      e.duration !== 0 && (_ = setTimeout(() => {
        l.value = false;
      }, e.duration));
    }
    function S() {
      clearTimeout(_);
    }
    let C = () => {
      l.value = false;
    };
    onMounted(async () => {
      l.value = true, b();
    });
    function T(e2) {
      e2.code === "Escape" && (l.value = false);
    }
    Vo(document, "keydown", T);
    function ee() {
      e.onDestory();
    }
    function D() {
      d.value = u.value.getBoundingClientRect().height;
    }
    return s({
      bottomOffset: m,
      visible: l
    }), (n, s2) => (openBlock(), createBlock(Transition, {
      name: e.transitionName,
      onEnter: D,
      onAfterLeave: ee
    }, {
      default: withCtx(() => [withDirectives(createBaseVNode("div", {
        class: normalizeClass(["vk-message", {
          [`vk-message--${e.type}`]: e.type,
          "is-close": e.showClose
        }]),
        style: normalizeStyle(h2.value),
        ref_key: "messageRef",
        ref: u,
        role: "alert",
        onMouseenter: S,
        onMouseleave: b
      }, [createBaseVNode("div", Uo, [renderSlot(n.$slots, "default", {}, () => [e.message ? (openBlock(), createBlock(unref(vo), {
        key: 0,
        "v-node": e.message
      }, null, 8, ["v-node"])) : createCommentVNode("", true)])]), e.showClose ? (openBlock(), createElementBlock("div", Wo, [createVNode(unref(Q), {
        onClick: withModifiers(C, ["stop"]),
        icon: unref(Ho.faXmark)
      }, null, 8, ["icon"])])) : createCommentVNode("", true)], 38), [[vShow, l.value]])]),
      _: 3
    }, 8, ["name"]));
  }
});
Go.install = (e) => {
  e.component(Go.name || "VkMessage", Go);
};
var Ko = Go;
var qo = P((e) => {
  Object.defineProperty(e, "__esModule", { value: true });
  var t = "fas", n = "circle-xmark", r = 512, i = 512, a = [
    61532,
    "times-circle",
    "xmark-circle"
  ], o = "f057", s = "M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM167 167c9.4-9.4 24.6-9.4 33.9 0l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9z";
  e.definition = {
    prefix: t,
    iconName: n,
    icon: [
      r,
      i,
      a,
      o,
      s
    ]
  }, e.faCircleXmark = e.definition, e.prefix = t, e.iconName = n, e.width = r, e.height = i, e.ligatures = a, e.unicode = o, e.svgPathData = s, e.aliases = a;
});
var Jo = P((e) => {
  Object.defineProperty(e, "__esModule", { value: true });
  var t = "fas", n = "eye", r = 576, i = 512, a = [128065], o = "f06e", s = "M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z";
  e.definition = {
    prefix: t,
    iconName: n,
    icon: [
      r,
      i,
      a,
      o,
      s
    ]
  }, e.faEye = e.definition, e.prefix = t, e.iconName = n, e.width = r, e.height = i, e.ligatures = a, e.unicode = o, e.svgPathData = s, e.aliases = a;
});
var Yo = P((e) => {
  Object.defineProperty(e, "__esModule", { value: true });
  var t = "fas", n = "eye-slash", r = 576, i = 512, a = [], o = "f070", s = "M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-96.4-96.4c2.7-2.4 5.4-4.8 8-7.2 46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6-56.8 0-105.6 18.2-146 44.2L41-24.9zM204.5 138.7c23.5-16.8 52.4-26.7 83.5-26.7 79.5 0 144 64.5 144 144 0 31.1-9.9 59.9-26.7 83.5l-34.7-34.7c12.7-21.4 17-47.7 10.1-73.7-13.7-51.2-66.4-81.6-117.6-67.9-8.6 2.3-16.7 5.7-24 10l-34.7-34.7zM325.3 395.1c-11.9 3.2-24.4 4.9-37.3 4.9-79.5 0-144-64.5-144-144 0-12.9 1.7-25.4 4.9-37.3L69.4 139.2c-32.6 36.8-55 75.8-66.9 104.5-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6 37.3 0 71.2-7.9 101.5-20.6l-64.2-64.2z";
  e.definition = {
    prefix: t,
    iconName: n,
    icon: [
      r,
      i,
      a,
      o,
      s
    ]
  }, e.faEyeSlash = e.definition, e.prefix = t, e.iconName = n, e.width = r, e.height = i, e.ligatures = a, e.unicode = o, e.svgPathData = s, e.aliases = a;
});
var Xo = qo();
var Zo = Jo();
var Qo = Yo();
var $o = {
  key: 0,
  class: "vk-input__prepend"
};
var es = { class: "vk-input__wrapper" };
var ts = {
  key: 0,
  class: "vk-input__prefix"
};
var ns = [
  "disabled",
  "readonly",
  "autocomplete",
  "placeholder",
  "autoFocus",
  "form",
  "type"
];
var rs = {
  key: 1,
  class: "vk-input__append"
};
var is = [
  "disabled",
  "readonly",
  "autocomplete",
  "placeholder",
  "autoFocus",
  "form"
];
var as = defineComponent({
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
  emits: [
    "update:modelValue",
    "input",
    "change",
    "focus",
    "blur",
    "clear"
  ],
  setup(t, { expose: s, emit: c }) {
    let l = c, u = ref(t.modelValue), d = ref(false), f = ref(false), p = useAttrs(), _ = ref(), v = computed(() => t.clearable && !t.disabled && !!u.value && d.value), y = computed(() => t.showPassword && !t.disabled && !!u.value), b = () => {
      f.value = !f.value;
    }, S = async () => {
      var _a2;
      await nextTick(), (_a2 = _.value) == null ? void 0 : _a2.focus();
    }, C = () => {
      l("update:modelValue", u.value), l("input", u.value);
    }, T = () => {
      l("change", u.value);
    }, ee = (e) => {
      d.value = true, l("focus", e);
    }, D = (e) => {
      d.value = false, l("blur", e);
    }, O = () => {
      u.value = "", l("update:modelValue", ""), l("input", ""), l("change", ""), l("clear");
    }, k = () => {
    };
    return watch(() => t.modelValue, (e) => {
      u.value = e;
    }), s({ ref: _ }), (n, s2) => (openBlock(), createElementBlock("div", { class: normalizeClass(["vk-input", {
      [`vk-input--${t.type}`]: t.type,
      [`vk-input--${t.size}`]: t.size,
      "is-disabled": t.disabled,
      "is-prepend": n.$slots.prepend,
      "is-append": n.$slots.append,
      "is-suffix": n.$slots.suffix,
      "is-prefix": n.$slots.prefix,
      "is-focus": d.value
    }]) }, [t.type === "textarea" ? withDirectives((openBlock(), createElementBlock("textarea", mergeProps({
      key: 1,
      class: "vk-textarea__wrapper"
    }, unref(p), {
      ref_key: "inputRef",
      ref: _,
      disabled: t.disabled,
      readonly: t.readonly,
      autocomplete: t.autocomplete,
      placeholder: t.placeholder,
      autoFocus: t.autoFocus,
      form: t.form,
      "onUpdate:modelValue": s2[1] || (s2[1] = (e) => u.value = e),
      onInput: C,
      onChange: T,
      onFocus: ee,
      onBlur: D
    }), null, 16, is)), [[vModelText, u.value]]) : (openBlock(), createElementBlock(Fragment, { key: 0 }, [
      n.$slots.prepend ? (openBlock(), createElementBlock("div", $o, [renderSlot(n.$slots, "prepend")])) : createCommentVNode("", true),
      createBaseVNode("div", es, [
        n.$slots.prefix ? (openBlock(), createElementBlock("div", ts, [renderSlot(n.$slots, "prefix")])) : createCommentVNode("", true),
        withDirectives(createBaseVNode("input", mergeProps({ "onUpdate:modelValue": s2[0] || (s2[0] = (e) => u.value = e) }, unref(p), {
          ref_key: "inputRef",
          ref: _,
          class: "vk-input__inner",
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
          type: t.showPassword ? f.value ? "text" : "password" : t.type
        }), null, 16, ns), [[vModelDynamic, u.value]]),
        n.$slots.suffix || v.value || t.showPassword ? (openBlock(), createElementBlock("div", {
          key: 1,
          class: "vk-input__suffix",
          onClick: S
        }, [
          renderSlot(n.$slots, "suffix"),
          v.value ? (openBlock(), createBlock(unref(Q), {
            key: 0,
            icon: unref(Xo.faCircleXmark),
            class: "vk-input__clear",
            onClick: O,
            onMousedown: withModifiers(k, ["prevent"])
          }, null, 8, ["icon"])) : createCommentVNode("", true),
          y.value && f.value ? (openBlock(), createBlock(unref(Q), {
            key: 1,
            icon: unref(Zo.faEye),
            class: "vk-input__password",
            onClick: b
          }, null, 8, ["icon"])) : createCommentVNode("", true),
          y.value && !f.value ? (openBlock(), createBlock(unref(Q), {
            key: 2,
            icon: unref(Qo.faEyeSlash),
            class: "vk-input__password",
            onClick: b
          }, null, 8, ["icon"])) : createCommentVNode("", true)
        ])) : createCommentVNode("", true)
      ]),
      n.$slots.append ? (openBlock(), createElementBlock("div", rs, [renderSlot(n.$slots, "append")])) : createCommentVNode("", true)
    ], 64))], 2));
  }
});
as.install = (e) => {
  e.component(as.name || "VkInput", as);
};
var os = as;
var ss = P((e) => {
  Object.defineProperty(e, "__esModule", { value: true });
  var t = "fas", n = "angle-down", r = 384, i = 512, a = [8964], o = "f107", s = "M169.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 306.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z";
  e.definition = {
    prefix: t,
    iconName: n,
    icon: [
      r,
      i,
      a,
      o,
      s
    ]
  }, e.faAngleDown = e.definition, e.prefix = t, e.iconName = n, e.width = r, e.height = i, e.ligatures = a, e.unicode = o, e.svgPathData = s, e.aliases = a;
})();
var cs = {
  key: 0,
  class: "vk-select__loading"
};
var ls = {
  key: 1,
  class: "vk-select__noData"
};
var us = {
  key: 2,
  class: "vk-select__menu"
};
var ds = ["id", "onClick"];
var fs = defineComponent({
  name: "VkSelect",
  __name: "Select",
  props: {
    modelValue: {},
    options: { default: () => [] },
    placeholder: { default: "" },
    disabled: { type: Boolean },
    clearable: {
      type: Boolean,
      default: false
    },
    renderLabel: { type: Function },
    filterable: { type: Boolean },
    filterMethod: { type: Function },
    remote: { type: Boolean },
    remoteMethod: { type: Function }
  },
  emits: [
    "change",
    "update:modelValue",
    "visible-change",
    "clear"
  ],
  setup(t, { emit: i }) {
    let o = i, s = ref(), l = ref(), u = computed(() => t.remote ? 300 : 0), d = (e) => t.options.find((t2) => t2.value === e) || null, f = d(t.modelValue);
    watch(() => t.modelValue, (e) => {
      f = d(e);
    });
    let p = ref(false), m = reactive({
      inputValue: f ? f.label : "",
      selectedOption: f,
      mouseHover: false,
      loading: false,
      highlightIndex: -1
    }), h2 = { middleware: [size({ apply({ rects: e, elements: t2 }) {
      Object.assign(t2.floating.style, { width: `${e.reference.width}px` });
    } })] }, _ = computed(() => t.clearable && m.mouseHover && m.selectedOption && m.inputValue.trim() !== "" && !t.disabled), v = () => {
      m.selectedOption = null, m.inputValue = "", o("clear"), o("change", ""), o("update:modelValue", "");
    }, y = () => {
    }, b = ref(t.options);
    watch(() => t.options, (e) => {
      b.value = e;
    });
    let S = async (e) => {
      if (t.filterable) {
        if (t.filterMethod && Xe(t.filterMethod)) b.value = t.filterMethod(e);
        else if (t.remote && t.remoteMethod && Xe(t.remoteMethod)) {
          m.loading = true;
          try {
            b.value = await t.remoteMethod(e);
          } catch (e2) {
            console.error(e2), b.value = [];
          } finally {
            m.loading = false;
          }
        } else b.value = t.options.filter((t2) => t2.label.includes(e));
        m.highlightIndex = -1;
      }
    }, T = () => {
      S(m.inputValue);
    }, E = Ga(() => {
      T();
    }, u.value), D = computed(() => t.filterable && m.selectedOption && p.value ? m.selectedOption.label : t.placeholder), O = (e) => {
      e ? (t.filterable && m.selectedOption && (m.inputValue = ""), t.filterable && S(m.inputValue), s.value.show()) : (s.value.hide(), t.filterable && (m.inputValue = m.selectedOption ? m.selectedOption.label : ""), m.highlightIndex = -1), p.value = e, o("visible-change", e);
    }, k = () => {
      t.disabled || (p.value ? O(false) : O(true));
    }, te = (e) => {
      switch (e.key) {
        case "Enter":
          p.value ? m.highlightIndex > -1 && b.value[m.highlightIndex] ? ne(b.value[m.highlightIndex]) : O(false) : k();
          break;
        case "Escape":
          p.value && O(false);
          break;
        case "ArrowUp":
          e.preventDefault(), b.value.length > 0 && (m.highlightIndex === -1 || m.highlightIndex === 0 ? m.highlightIndex = b.value.length - 1 : m.highlightIndex--);
          break;
        case "ArrowDown":
          e.preventDefault(), b.value.length > 0 && (m.highlightIndex === -1 || m.highlightIndex === b.value.length - 1 ? m.highlightIndex = 0 : m.highlightIndex++);
          break;
        default:
          break;
      }
    }, ne = (e) => {
      e.disabled || (m.inputValue = e.label, m.selectedOption = e, o("change", e.value), o("update:modelValue", e.value), O(false), l.value.ref.focus());
    };
    return (n, i2) => (openBlock(), createElementBlock("div", {
      class: normalizeClass(["vk-select", { "is-disabled": t.disabled }]),
      onClick: k,
      onMouseenter: i2[2] || (i2[2] = (e) => m.mouseHover = true),
      onMouseleave: i2[3] || (i2[3] = (e) => m.mouseHover = false)
    }, [createVNode(_o, {
      placement: "bottom-start",
      manual: "",
      ref_key: "tooltipRef",
      ref: s,
      "popper-options": h2,
      onClickOutside: i2[1] || (i2[1] = (e) => O(false))
    }, {
      content: withCtx(() => [m.loading ? (openBlock(), createElementBlock("div", cs, [createVNode(unref(Q), {
        icon: unref(no.faSpinner),
        spin: ""
      }, null, 8, ["icon"])])) : t.filterable && b.value.length === 0 ? (openBlock(), createElementBlock("div", ls, " no matching data ")) : (openBlock(), createElementBlock("ul", us, [(openBlock(true), createElementBlock(Fragment, null, renderList(b.value, (e, n2) => {
        var _a2;
        return openBlock(), createElementBlock("li", {
          key: n2,
          class: normalizeClass(["vk-select__menu-item", {
            "is-disabled": e.disabled,
            "is-selected": ((_a2 = m.selectedOption) == null ? void 0 : _a2.value) === e.value,
            "is-highlightIndex": m.highlightIndex === n2
          }]),
          id: `select-item-${e.value}`,
          onClick: withModifiers((t2) => ne(e), ["stop"])
        }, [createVNode(unref(vo), { "v-node": t.renderLabel ? t.renderLabel(e) : e.label }, null, 8, ["v-node"])], 10, ds);
      }), 128))]))]),
      default: withCtx(() => [createVNode(as, {
        type: "select",
        modelValue: m.inputValue,
        "onUpdate:modelValue": i2[0] || (i2[0] = (e) => m.inputValue = e),
        disabled: t.disabled,
        placeholder: D.value,
        ref_key: "inputRef",
        ref: l,
        readonly: !t.filterable || !p.value,
        onInput: unref(E),
        onKeydown: te
      }, {
        suffix: withCtx(() => [_.value ? (openBlock(), createBlock(unref(Q), {
          key: 0,
          onClick: withModifiers(v, ["stop"]),
          onMousedown: withModifiers(y, ["prevent"]),
          icon: unref(Xo.faCircleXmark),
          class: "vk-input__clear"
        }, null, 8, ["icon"])) : (openBlock(), createBlock(unref(Q), {
          key: 1,
          icon: unref(ss.faAngleDown),
          class: normalizeClass(["header-angle", { "is-active": p.value }])
        }, null, 8, ["icon", "class"]))]),
        _: 1
      }, 8, [
        "modelValue",
        "disabled",
        "placeholder",
        "readonly",
        "onInput"
      ])]),
      _: 1
    }, 512)], 34));
  }
});
fs.install = (e) => {
  e.component(fs.name || "VkSelect", fs);
};
var ps = fs;
var ms = ["name", "disabled"];
var hs = { class: "vk-switch__core" };
var gs = { class: "vk-switch__core-inner" };
var _s = {
  key: 0,
  class: "vk-switch__core-inner-text"
};
var vs = defineComponent({
  name: "VkSwitch",
  __name: "Switch",
  props: {
    modelValue: { type: [
      Boolean,
      String,
      Number
    ] },
    disabled: { type: Boolean },
    activeText: {},
    inactiveText: {},
    activeValue: {
      type: [
        Boolean,
        String,
        Number
      ],
      default: true
    },
    inactiveValue: {
      type: [
        Boolean,
        String,
        Number
      ],
      default: false
    },
    name: {},
    id: {},
    size: {}
  },
  emits: ["change", "update:modelValue"],
  setup(e, { emit: t }) {
    let r = t, s = ref(e.modelValue), c = computed(() => s.value === e.activeValue), l = ref(), u = () => {
      if (e.disabled) return;
      let t2 = c.value ? e.inactiveValue : e.activeValue;
      s.value = t2, r("change", t2), r("update:modelValue", t2);
    };
    return onMounted(() => {
      l.value.checked = c.value;
    }), watch(c, (e2) => {
      l.value.checked = e2;
    }), watch(() => e.modelValue, (e2) => {
      s.value = e2;
    }), (t2, n) => (openBlock(), createElementBlock("div", {
      onClick: u,
      class: normalizeClass(["vk-switch", {
        [`vk-switch--${e.size}`]: e.size,
        "is-disabled": e.disabled,
        "is-checked": c.value
      }])
    }, [createBaseVNode("input", {
      class: "vk-switch__input",
      type: "checkbox",
      role: "switch",
      ref_key: "input",
      ref: l,
      name: e.name,
      disabled: e.disabled,
      onKeydown: withKeys(u, ["enter"])
    }, null, 40, ms), createBaseVNode("div", hs, [createBaseVNode("div", gs, [e.activeText || e.inactiveText ? (openBlock(), createElementBlock("span", _s, toDisplayString(c.value ? e.activeText : e.inactiveText), 1)) : createCommentVNode("", true)]), n[0] || (n[0] = createBaseVNode("div", { class: "vk-switch__core-action" }, null, -1))])], 2));
  }
});
vs.install = (e) => {
  e.component(vs.name || "VkSwitch", vs);
};
var ys = vs;
_o.install = (e) => {
  e.component(_o.name || "VkTooltip", _o);
};
var bs = _o;
var xs = { class: "vk-progress-bar" };
var Ss = {
  key: 0,
  class: "vk-inner-text"
};
var Cs = defineComponent({
  name: "VkProgress",
  __name: "Progress",
  props: {
    percent: {},
    strokeHeight: { default: 15 },
    showText: {
      type: Boolean,
      default: false
    },
    type: { default: "info" }
  },
  setup(e) {
    return (t, n) => (openBlock(), createElementBlock("div", xs, [createBaseVNode("div", {
      class: "vk-progress-bar-outer",
      style: normalizeStyle({ height: e.strokeHeight + "px" })
    }, [createBaseVNode("div", {
      class: normalizeClass(["vk-progress-bar-inner", { [`vk-color-${e.type}`]: e.type }]),
      style: normalizeStyle({ width: e.percent + "%" })
    }, [e.showText ? (openBlock(), createElementBlock("span", Ss, toDisplayString(e.percent) + "%", 1)) : createCommentVNode("", true)], 6)], 4)]));
  }
});
Cs.install = (e) => {
  e.component(Cs.name || "VkProgress", Cs);
};
var ws = Cs;
var Ts = [
  ao,
  ho,
  mo,
  wo,
  No,
  Mo,
  Q,
  Ko,
  os,
  ps,
  ys,
  bs,
  ws
];
var Es = (e) => {
  Ts.forEach((t) => {
    e.component(t.name, t);
  });
};
var Ds = { install: Es };
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
  Es as install
};
//# sourceMappingURL=xb-element.js.map
