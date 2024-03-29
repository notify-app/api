'use strict'

const errors = require('../errors')

module.exports = (requestOptions) => {
  switch (requestOptions.method) {
    // STATES can be READ.
    case 'find': return Promise.resolve()

    // STATES cannot be CREATED, MODIFIED or DELETED from JSONAPI endpoint.
    default: return authDefault()
  }
}

/**
 * authDefault is invoked when the user tries to CREATE, MODIFY or DELETE a
 * STATE resource. When this happens the request is rejected.
 * @return {Promise} Rejected promise containing info about the allowed methods
 *                   and HTTP Response status.
 */
function authDefault () {
  return Promise.reject({
    type: errors.METHOD_NOT_ALLOWED,
    allowed: 'GET'
  })
}
