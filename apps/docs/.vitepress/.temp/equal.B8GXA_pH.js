;(function () {
  try {
    var e =
      typeof window < 'u'
        ? window
        : typeof global < 'u'
          ? global
          : typeof globalThis < 'u'
            ? globalThis
            : typeof self < 'u'
              ? self
              : {}
    e.SENTRY_RELEASE = { id: '63d551497be1158ac55eeefaf1dec4a9182e3c76' }
    var d = new e.Error().stack
    d &&
      ((e._sentryDebugIds = e._sentryDebugIds || {}),
      (e._sentryDebugIds[d] = 'e8feb66a-3ad7-4f46-8da9-6f2b467f83dc'),
      (e._sentryDebugIdIdentifier =
        'sentry-dbid-e8feb66a-3ad7-4f46-8da9-6f2b467f83dc'))
  } catch {}
})()
const f = '/CoreFront-EndConcepts/img/equal.png'
export { f as _ }
//# sourceMappingURL=equal.B8GXA_pH.js.map
