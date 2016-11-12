'use strict'

const http = require('http')
const middleware = require('notify-middleware')

const corsListener = require('./listeners/cors')
const fortuneListener = require('./listeners/fortune')
const config = require('../config')

const app = middleware()

app.use(corsListener)
app.use(fortuneListener)

const server = http.createServer(app).listen(config.port, () => {
  console.info(`api server: listening on port ${config.port}`)
})
