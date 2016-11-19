'use strict'

const createListener = require('fortune-http')
const jsonAPISerializer = require('fortune-json-api')
const {worker} = require('ipc-emitter')

const notifyStore = require('../../store')

const listener = createListener(notifyStore.store, {
  serializers: [
    [
      jsonAPISerializer,
      {
        inflectType: false,
        inflectKeys: false
      }
    ]
  ]
})

module.exports = function (req, res) {
  listener(req, res)
    .catch(function (err) {
      worker.emit('logs:error', 'api', 'FortuneJS error:', err.message, err)
    })
}
