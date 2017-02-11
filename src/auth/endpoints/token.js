'use strict'

const hat = require('hat')
const errors = require('../errors')
const grants = require('../grants')

module.exports = (requestOptions, user, notifyStore) => {
  switch (requestOptions.method) {
    // Only tokens of Child Bots can be read.
    case 'find': return authFind(requestOptions, user, notifyStore)

    // TOKENS can only be CREATED.
    case 'create': return authCreate(requestOptions, user, notifyStore)

    // TOKENS can only be MODIFIED.
    case 'update': return authUpdate(requestOptions, user, notifyStore)

    // TOKENS cannot be MODIFIED, DELETED or READ from JSONAPI endpoint.
    default: return authDefault()
  }
}

/**
 * authFind verifies that the tokens returned belong to bots created by the
 * consumer.
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about user.
 * @param  {Object} notifyStore    Notify store instance.
 * @return {Promise}               Resolved if the consumer is allowed to create
 *                                 tokens. Rejected otherwise.
 */
function authFind (requestOptions, user, notifyStore) {
  return grants(notifyStore).then(grants => {
    const canCreateBot = user.grants.indexOf(grants['CREATE_BOT']) !== -1

    // If user cannot create bots or tokens, he is not allowed to create a
    // token.
    if (!canCreateBot) {
      return Promise.reject({
        type: errors.UN_AUTHORIZED,
        message: 'You are not allowed to view Access Tokens'
      })
    }

    // When the user doesn't request for specific tokens, it should only return
    // tokens which belong to bots the user created himself.
    let usersPromise = Promise.resolve(user.created)

    // When the user requests for specific tokens (using token ids) it should
    // first retrieve the IDs of users who are the owners of the tokens requested
    // and then filter these IDs to only have the IDs of bots who have been
    // created by the user himself.
    if (requestOptions.ids !== null) {
      // Retrieve tokens
      usersPromise = notifyStore.store
        .find(notifyStore.types.TOKENS, requestOptions.ids)
        .then(({payload}) => {
          const userIDs = []

          // Store the IDs of users who were created by the user.
          payload.records.forEach(token => {
            if (user.created.indexOf(token.user) !== -1) userIDs.push(token.user)
          })

          return userIDs
        })
    }

    // At this stage, we would have a list of user IDs which first of all are the
    // owner of the tokens requested and secondly have been created by the
    // consumer. Now all we have to do is to filter this list to only return the
    // token IDs of bots.
    return usersPromise.then(userIDs => {
      return notifyStore.store.find(notifyStore.types.USERS, userIDs)
    })
    .then(({payload}) => {
      const tokenIDs = []

      payload.records.forEach(childUser => {
        if (childUser.bot === true) tokenIDs.push(childUser.token)
      })

      requestOptions.ids = tokenIDs
    })
  })
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
  return grants(notifyStore).then(grants => {
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
    const hasUserInfo = (token.user !== undefined)

    // Tokens can only be created for users who have been created by the user
    // creating the token.
    const userAffectedIsChild = user.created.indexOf(token.user) !== -1
    
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
 * authUpdate verifies that the consumer is updating a token which belongs to a
 * bot that he has created himself.
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about user.
 * @param  {Object} notifyStore    Notify store instance.
 * @return {Promise}               Resolved if the consumer is allowed to modify
 *                                 the token, rejected otherwise.
 */
function authUpdate (requestOptions, user, notifyStore) {
  return grants(notifyStore).then(grants => {
    /**
     * Indicates whether the consumer is allowed to create bots.
     * @type {Boolean}
     */
    const canCreateBot = user.grants.indexOf(grants['CREATE_BOT']) !== -1

    // If user cannot create bots or tokens, he is not allowed to modify a
    // token.
    if (!canCreateBot) {
      return Promise.reject({
        type: errors.UN_AUTHORIZED,
        message: 'You are not allowed to modify Access Tokens'
      })
    }

    // Remove modifications to restricted fields.
    delete requestOptions.payload[0].replace.user
    delete requestOptions.payload[0].replace.created
    delete requestOptions.payload[0].replace.token

    /**
     * ID of token being modified
     * @type {String}
     */
    const tokenID = requestOptions.ids[0]

    return notifyStore.store.find(notifyStore.types.TOKENS, tokenID)
      .then(({payload}) => {
        /**
         * Token being modified
         * @type {Object}
         */
        const token = payload.records[0]

        // if the consumer is modifying a token which belongs to a user who he
        // hasn't created, stop the modify request.
        if (user.created.indexOf(token.user) === -1) {
          return Promise.reject({
            type: errors.UN_AUTHORIZED,
            message: 'You are only allowed to modify Access Tokens that belong '
              + 'to your own bots'
          })
        }

        return notifyStore.store.find(notifyStore.types.USERS, token.user)
      }).then(({payload}) => {
        /**
         * Owner of the token being modified
         * @type {Object}
         */
        const user = payload.records[0]

        // If the owner of the token is not a bot, stop the modify request.
        if (user.bot === false) {
          return Promise.reject({
            type: errors.UN_AUTHORIZED,
            message: 'You are only allowed to modify Access Tokens that belong '
              + 'to your own bots'
          })
        }
      })
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
    allowed: 'DELETE'
  })
}
