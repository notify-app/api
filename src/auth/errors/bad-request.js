'use strict'

const fortune = require('fortune')

module.exports = (err) => {
  return new fortune.errors.BadRequestError('Bad Request', err.message)
}
