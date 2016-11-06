'use strict'

const store = require('notify-store')
const config = require('../config')

const notifyStore = Object.create(store)

notifyStore.init({
  url: config.db.url
})

module.exports = notifyStore
