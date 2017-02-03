'use strict'

const errors = require('../errors')

module.exports = (requestOptions) => {
  switch (requestOptions.method) {
    // GRANTS can be read.
    case 'find': return Promise.resolve()

    // GRANTS cannot be CREATED, MODIFIED or DELETED from a JSONAPI endpoint.
    default: return authDefault()
  }
}

/**
 * authDefault is invoked when the user tries to CREATE, MODIFY or DELETE a
 * GRANT resource. When this happens the request is rejected.
 * @return {Promise} Rejected promise containing info about the allowed methods
 *                   and HTTP Response status.
 */
function authDefault () {
  return Promise.reject({
    type: errors.METHOD_NOT_ALLOWED,
    allowed: 'GET'
  })
}
