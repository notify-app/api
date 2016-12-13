'use strict'

const errors = require('../errors')

module.exports = (requestOptions, user) => {
  switch (requestOptions.method) {
    // USERS can only be UPDATED by the owner.
    case 'update': return authUpdate(requestOptions, user)

    // USERS cannot be DELETED.
    case 'delete': return authDelete()

    // USERS can be CREATED and READ.
    default: return Promise.resolve()
  }
}

/**
 * authUpdate verifies that the consumer is updating his own info.
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about user.
 * @return {Promise}               Resolved when the consumer is updating his
 *                                 own details. Rejected otherwise.
 */
function authUpdate (requestOptions, user) {
  delete requestOptions.payload[0].replace.username

  if (user.id === requestOptions.ids[0]) return Promise.resolve()
  return Promise.reject({ type: errors.NOT_FOUND })
}

/**
 * authDelete disable the delete functionality, since users cannot be deleted.
 * @return {Promise} Rejected promise containing details about available
 * functionality
 */
function authDelete () {
  return Promise.reject({
    type: errors.METHOD_NOT_ALLOWED,
    allowed: 'GET, POST, PATCH'
  })
}
