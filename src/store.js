'use strict'

const {worker} = require('ipc-emitter')
const store = require('notify-store')
const config = require('../config')
const auth = require('./auth')

const notifyStore = Object.create(store)

notifyStore.init({
  worker,
  url: config.db.url,
  authorize: auth
})

module.exports = notifyStore
