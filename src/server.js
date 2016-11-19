'use strict'

const http = require('http')
const middleware = require('notify-middleware')

const listeners = require('./listeners')
const config = require('../config')

const app = middleware()

app.use(...listeners)

const server = http.createServer(app).listen(config.port, () => {
  console.info(`api server: listening on port ${config.port}`)
})
