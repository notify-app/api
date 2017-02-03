'use strict'

module.exports = (fortune, err) => {
  const output = new fortune.errors.UnauthorizedError(err.message)

  output.meta = {
    headers: {
      'WWW-Authenticate': 'FormBased'
    }
  }

  return output
}
