'use strict'

const hat = require('hat')
const errors = require('../errors')
const grants = require('../grants')

module.exports = (requestOptions, user, notifyStore) => {
  switch (requestOptions.method) {
    // TOKENS can only be CREATED.
    case 'create': return authCreate(requestOptions, user, notifyStore)

    // TOKENS cannot be MODIFIED, DELETED or READ from JSONAPI endpoint.
    default: return authDefault()
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
      const canCreateBot = user.grants.indexOf(grants['CREATE_BOT']) !== -1
      const canCreateToken = user.grants.indexOf(grants['CREATE_TOKEN']) !== -1

      // If user cannot create bots or tokens, he is not allowed to create a
      // token.
      if (!canCreateBot && !canCreateToken) {
        return Promise.reject({
          type: errors.UN_AUTHORIZED,
          message: 'You are not allowed to create Access Tokens'
        })
      }

      // Store token object to be persisted.
      const token = requestOptions.payload[0]

      // Newly created tokens must have info about the user they belong to.
      const hasUserInfo = (token.user === undefined)

      // Tokens can only be created for users who have been created by the user
      // creating the token.
      const userAffectedIsChild = user.created.indexOf(token.user.id) === -1
      
      if (!hasUserInfo || !userAffectedIsChild) {
        return Promise.reject({
          type: errors.UN_AUTHORIZED,
          message: 'You are not allowed to create tokens for users who have not'
            + ' been created by yourself'
        })
      }

      // Default values.
      requestOptions.payload[0].token = hat()
      requestOptions.payload[0].created = new Date()

      return Promise.resolve()
    })
}

/**
 * authDefault is invoked when the user tries to FIND, MODIFY or DELETE a
 * TOKEN resource. When this happens the request is rejected.
 * @return {Promise} Rejected promise containing info about the allowed methods
 *                   and HTTP Response status.
 */
function authDefault () {
  return Promise.reject({
    type: errors.METHOD_NOT_ALLOWED,
    allowed: 'POST'
  })
}
