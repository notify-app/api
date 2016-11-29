'use strict'

const {worker} = require('ipc-emitter')
const store = require('notify-store')
const config = require('../config')
const authorize = require('./auth')

const notifyStore = Object.create(store)

notifyStore.init({
  worker,
  authorize,
  url: config.db.url
})

module.exports = notifyStore
