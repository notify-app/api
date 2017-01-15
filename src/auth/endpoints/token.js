'use strict'

const errors = require('../errors')
const grants = require('../grants')


module.exports = (requestOptions, user, notifyStore) => {
  switch (requestOptions.method) {
    // TOKENS can only be CREATED.
    case 'create': return authCreate(requestOptions, user, notifyStore)

    // TOKENS cannot be MODIFIED, DELETED and READ.
    default: return Promise.reject({
      type: errors.METHOD_NOT_ALLOWED,
      allowed: 'POST'
    })
  }
}

/**
 * authCreate verifies that the consumer is allowed to create tokens.
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about user.
 * @param  {Object} notifyStore    Notify store instance.
 * @return {Promise}               Resolved if the consumer is allowed to create
 *                                 tokens. Rejected otherwise.
 */
function authCreate (requestOptions, user, notifyStore) {
  return grants(notifyStore)
    .then(grants => {
      const canCreateToken = user.grants.indexOf(grants['CREATE_TOKEN']) !== -1
      if (canCreateToken === true) return Promise.resolve()
      return Promise.reject({ type: errors.UN_AUTHORIZED })
    })
}