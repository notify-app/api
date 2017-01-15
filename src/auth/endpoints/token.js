'use strict'

const errors = require('../errors')

module.exports = (requestOptions, user) => {
  switch (requestOptions.method) {
    // TOKENS can only be CREATED.
    case 'create': Promise.resolve()

    // TOKENS cannot be MODIFIED, DELETED and READ.
    default: return Promise.reject({
      type: errors.METHOD_NOT_ALLOWED,
      allowed: 'POST'
    })
  }
}
