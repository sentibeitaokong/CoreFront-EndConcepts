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
      (e._sentryDebugIds[d] = '02ca00d7-c7ea-412e-9af9-e7edce62c039'),
      (e._sentryDebugIdIdentifier =
        'sentry-dbid-02ca00d7-c7ea-412e-9af9-e7edce62c039'))
  } catch {}
})()
const t = '/CoreFront-EndConcepts/img/queue.png'
export { t as _ }
//# sourceMappingURL=queue._FFGch7l.js.map
