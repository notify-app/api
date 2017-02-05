'use strict'

const errors = require('../errors')
const grants = require('../grants')

module.exports = (requestOptions, user, notifyStore) => {
  switch (requestOptions.method) {
    // USERS can be READ.
    case 'find': return Promise.resolve()

    // USERS can be CREATED only if the creator is allowed to.
    case 'create': return authCreate(requestOptions, user, notifyStore)

    // USERS can only be modified by the modifier.
    case 'update': return authUpdate(requestOptions, user)

    // USERS cannot be deleted.
    case 'delete': return authDelete()
  }
}

/**
 * authCreate verifies that the creator is allowed to create BOTS and/or USERS.
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about creator.
 * @param  {Object} notifyStore    Notify store instance.
 * @return {Promise}               Resolved if the creator is allowed to create
 *                                 the user or bot. Rejected otherwise.
 */
function authCreate (requestOptions, user, notifyStore) {
  // Make sure that the creator is allowed to create the user.
  return grants(notifyStore)
    .then(grants => {
      const canCreateBot = (user.grants.indexOf(grants['CREATE_BOT']) !== -1)
      const canCreateUser = (user.grants.indexOf(grants['CREATE_USER']) !== -1)

      const creatingBot = (requestOptions.payload[0].bot === true)
      const creatingUser = (requestOptions.payload[0].bot === false)

      // Default restricted fields.
      requestOptions.payload[0].rooms = []
      requestOptions.payload[0].created = []
      requestOptions.payload[0].messages = []
      requestOptions.payload[0].grants = []
      requestOptions.payload[0].token = null
      requestOptions.payload[0].creator = user.id

      if (canCreateBot && creatingBot) return Promise.resolve()
      if (canCreateUser && creatingUser) return Promise.resolve()

      return Promise.reject({
        type: errors.UN_AUTHORIZED,
        message: 'You are not allowed to create new users'
      })
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
  // Remove modifications to restricted fields.
  requestOptions.payload[0].replace.username
  requestOptions.payload[0].replace.internalID
  requestOptions.payload[0].replace.bot
  requestOptions.payload[0].replace.grants
  requestOptions.payload[0].replace.token
  requestOptions.payload[0].replace.rooms
  requestOptions.payload[0].replace.creator
  requestOptions.payload[0].replace.created
  requestOptions.payload[0].replace.messages

  // Make sure that the user is updating his own info.
  if (user.id === requestOptions.ids[0]) return Promise.resolve()
  return Promise.reject({
    type: errors.UN_AUTHORIZED,
    message: 'You are only allowed to modify your own user'
  })
}

/**
 * authDefault is invoked when the user tries to DELETE a USER resource. When
 * this happens the request is rejected.
 * @return {Promise} Rejected promise containing info about the allowed methods
 *                   and HTTP Response status.
 */
function authDelete () {
  return Promise.reject({
    type: errors.METHOD_NOT_ALLOWED,
    allowed: 'GET, POST, PATCH'
  })
}
