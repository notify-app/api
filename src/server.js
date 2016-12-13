'use strict'

const http = require('http')
const {worker} = require('ipc-emitter')
const middleware = require('notify-middleware')

const listeners = require('./listeners')
const config = require('../config')

const app = middleware()

app.use(...listeners)

http.createServer(app).listen(config.port, () => {
  worker.emit('logs:info', 'api', `listening on port ${config.port}`)
})
