'use strict'

const fortune = require('fortune')

module.exports = (err) => {
  return new fortune.errors.NotFoundError('No records match the request')
}
