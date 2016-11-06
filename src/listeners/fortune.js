'use strict'

const jsonAPISerializer = require('fortune-json-api')
const createListener = require('fortune-http')

const notifyStore = require('../store')

module.exports = createListener(notifyStore.store, {
  serializers: [
    [ jsonAPISerializer, {
      inflectType: false,
      inflectKeys: false
    }]
  ]
})
