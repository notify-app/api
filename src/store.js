'use strict'

const store = require('notify-store')
const config = require('../config')
const auth = require('./auth')

const notifyStore = Object.create(store)

notifyStore.init({
  url: config.db.url,
  authorize: auth
})

module.exports = notifyStore
