'use strict'

module.exports = (fortune, err) => {
  const output = new fortune.errors.UnauthorizedError('Unauthorized')

  output.meta = {
    headers: {
      'WWW-Authenticate': 'FormBased'
    }
  }

  return output
}
