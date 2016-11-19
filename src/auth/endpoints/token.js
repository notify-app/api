'use strict'

const errors = require('../errors')

module.exports = () => {
  // TOKENS cannot be CRUD from API.
  return Promise.reject({ type: errors.METHOD_NOT_ALLOWED })
}
