'use strict'

const {worker} = require('ipc-emitter')
const Logger = require('notify-logger')

// Create new logger with namespace 'api'.
module.exports = new Logger(worker, 'api')
