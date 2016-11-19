'use strict'

const fortune = require('fortune')

module.exports = (err) => {
  const output = new fortune.errors.UnauthorizedError('Unauthorized')

  output.meta = {
    headers: {
      'WWW-Authenticate': 'FormBased'
    }
  }

  return output
}
