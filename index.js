'use strict'

const cluster = require('cluster')
const config = require('./config')

if (cluster.isMaster) {
  processArgs()
  console.info('deploying api servers')
  for (let i = 0; i < config.instances; i ++) {
    const worker = cluster.fork()
  }
} else {
  console.log(`api server deployed. PID: '${process.pid}'`)
  require('./src/server')
}

function processArgs () {
  const argv = require('minimist')(process.argv.slice(2))

  if ('dbURL' in argv) config.db.url = argv.dbURL
  if ('sessionName' in argv) config.session.name = argv.sessionName
  if ('sessionMaxAge' in argv) config.session.maxAge = argv.sessionMaxAge
  if ('port' in argv) config.port = argv.port
  if ('instances' in argv) config.instances = argv.instances
}
