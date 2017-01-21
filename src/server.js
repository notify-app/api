'use strict'

const http = require('http')
const middleware = require('notify-middleware')
const logger = require('./logger')

const listeners = require('./listeners')
const config = require('../config')

const app = middleware()

app.use(...listeners)

http.createServer(app).listen(config.port, () => {
  logger.info(`listening on port ${config.port}`)
})
