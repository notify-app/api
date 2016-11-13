'use strict'

const createListener = require('fortune-http')
const jsonAPISerializer = require('fortune-json-api')

const notifyStore = require('../../store')

const listener = createListener(notifyStore.store, {
  serializers: [
    [
      jsonAPISerializer,
      {
        inflectType: false,
        inflectKeys: false,
        authorize: contextRequest => {
          return Promise.resolve()
        }
      }
    ]
  ]
})

module.exports = function (req, res) {
  listener(req, res)
    .catch(function (err) {
      console.error(err)
    })
}
