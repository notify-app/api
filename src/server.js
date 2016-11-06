'use strict'

const http = require('http')

const corsListener = require('./listeners/cors')
const fortuneListener = require('./listeners/fortune')
const config = require('../config')

const server = http.createServer((req, res) => {
  corsListener(req, res)
    && fortuneListener(req, res)
})

server.listen(config.port, () => {
  console.info(`api server: listening on port ${config.port}`)
})
