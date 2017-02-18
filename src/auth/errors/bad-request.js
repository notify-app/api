'use strict'

module.exports = (fortune, err) => {
  return new fortune.errors.BadRequestError(err.message)
}
