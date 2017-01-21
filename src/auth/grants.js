'use strict'

let promise = null

module.exports = (notifyStore) => {
  if (promise !== null) return promise
  promise = notifyStore.store.find(notifyStore.types.GRANTS)
    .then(({payload}) => {
      let grants = {}

      payload.records.forEach(grant => {
        grants[grant.name] = grant.id
      })

      return grants
    })
  return promise
}
