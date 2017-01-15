'use strict'

const errors = require('../errors')
const grants = require('../grants')

module.exports = (requestOptions, user, notifyStore) => {
  switch (requestOptions.method) {
    // USERS can only be UPDATED by the owner.
    case 'update': return authUpdate(requestOptions, user)

    // USERS cannot be DELETED.
    case 'delete': return authDelete()

    // USERS with CREATE_USER grant will be able to create users.
    // USERS with CREATE_BOT grant will be able to create bots.
    case 'create': return authCreate(requestOptions, user, notifyStore)

    // USERS can be CREATED and READ.
    default: return Promise.resolve()
  }
}

/**
 * authCreate verifies that the consumer is allowed to create BOTS and/or USERS.
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about user.
 * @param  {Object} notifyStore    Notify store instance.
 * @return {Promise}               Resolved if the consumer is allowed to create
 *                                 the user or bot. Rejected otherwise.
 */
function authCreate (requestOptions, user, notifyStore) {
  return grants(notifyStore)
    .then(grants => {
      const canCreateBot = (user.grants.indexOf(grants['CREATE_BOT']) !== -1)
      const canCreateUser = (user.grants.indexOf(grants['CREATE_USER']) !== -1)

      const creatingBot = (requestOptions.payload[0].bot === true)
      const creatingUser = (requestOptions.payload[0].bot === false)

      if (canCreateBot && creatingBot) return Promise.resolve()
      if (canCreateUser && creatingUser) return Promise.resolve()

      return Promise.reject({ type: errors.UN_AUTHORIZED })
    })
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
  return Promise.reject({ type: errors.UN_AUTHORIZED })
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
