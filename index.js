'use strict'

const cluster = require('cluster')
const {worker} = require('ipc-emitter')
const config = require('./config')

if (cluster.isMaster) {
  const {master} = require('ipc-emitter')
  master.echo()

  processArgs()

  worker.emit('logs:info', 'api', 'deploying servers')
  for (let i = 0; i < config.instances; i ++) {
    const instance = cluster.fork()
    master.ack(instance.process)
  }
} else {
  worker.emit('logs:info', 'api', `server deployed`, {
    id: cluster.worker.id,
    pid: process.pid
  })

  require('./src/server')
}

function processArgs () {
  const argv = require('minimist')(process.argv.slice(2))

  if ('dbURL' in argv) config.db.url = argv.dbURL
  if ('sessionCookie' in argv) config.session.cookie = argv.sessionCookie
  if ('sessionMaxAge' in argv) config.session.maxAge = argv.sessionMaxAge
  if ('port' in argv) config.port = argv.port
  if ('instances' in argv) config.instances = argv.instances
  if ('sessionHeader' in argv) {
    config.session.header = argv.sessionHeader
    const corsheaders = config.accessControl.headers
    if (!!~corsheaders.indexOf(argv.sessionHeader)) {
      corsheaders.push(argv.sessionHeader)
    }
  }
}
