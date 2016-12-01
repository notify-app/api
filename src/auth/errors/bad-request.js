'use strict'

module.exports = (fortune, err) => {
  return new fortune.errors.BadRequestError('Bad Request', err.message)
}
