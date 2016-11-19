'use strict'

const errors = require('../errors')

module.exports = (requestOptions) => {
  switch (requestOptions.method) {
    // STATES can be READ.
    case 'find': return Promise.resolve()

    // STATES cannot be CREATED, MODIFIED or DELETED from api.
    default: return authDefault()
  }
}

/**
 * authDefault will be invoked when the user tries to: CREATE, UPDATE or DELETE
 * TOKENS. This method disables these functionalities and return what
 * functionality the user can utilize.
 * @return {Promise} Rejected promise containing details about available
 * functionality
 */
function authDefault () {
  return Promise.reject({
    type: errors.METHOD_NOT_ALLOWED,
    allowed: 'GET'
  })
}
