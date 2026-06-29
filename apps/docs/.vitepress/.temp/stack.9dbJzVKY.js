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
    var n = new e.Error().stack
    n &&
      ((e._sentryDebugIds = e._sentryDebugIds || {}),
      (e._sentryDebugIds[n] = '4e47fcc9-7066-4517-91f3-c8aea1be91bc'),
      (e._sentryDebugIdIdentifier =
        'sentry-dbid-4e47fcc9-7066-4517-91f3-c8aea1be91bc'))
  } catch {}
})()
const t = '/CoreFront-EndConcepts/img/stack.png'
export { t as _ }
//# sourceMappingURL=stack.9dbJzVKY.js.map
