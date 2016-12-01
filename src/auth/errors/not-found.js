'use strict'

module.exports = (fortune, err) => {
  return new fortune.errors.NotFoundError('No records match the request')
}
