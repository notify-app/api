'use strict'

const utils = require('notify-utils')

const config = require('../../config')
const errors = require('./errors')
const endpoints = require('./endpoints')

const badRequestError = require('./errors/bad-request')
const notFoundError = require('./errors/not-found')
const unAuthorizedError = require('./errors/un-authorized')
const methodNotAllowedError = require('./errors/method-not-allowed')

module.exports = (notifyStore, requestOptions) => {
  return retrieveToken(requestOptions.meta.headers)
    .then(token => retrieveUser(token, requestOptions))
    .then(user => verify(user, requestOptions))
    .catch(err => {
      switch (err.type) {
        case errors.BAD_REQUEST: {
          throw badRequestError(notifyStore.fortune, err)
        }
        case errors.NOT_FOUND: {
          throw notFoundError(notifyStore.fortune, err)
        }
        case errors.UN_AUTHORIZED: {
          throw unAuthorizedError(notifyStore.fortune, err)
        }
        case errors.METHOD_NOT_ALLOWED: {
          throw methodNotAllowedError(notifyStore.fortune, err)
        }
        default: {
          if (typeof err === 'string') err = new Error(err)
          throw err
        }
      }
    })

  /**
   * retrieveToken retrieves the access token of the consumer.
   * @param  {Object} headers HTTP Headers.
   * @return {Promise}        Resolved if the otken is retrieved, rejected
   *                          otherwise.
   */
  function retrieveToken (headers) {
    return utils.getTokenFromRequest(headers, config.session)
      .catch(() => Promise.reject({
        type: errors.UN_AUTHORIZED,
        message: 'No token found'
      }))
  }

  /**
   * retrieveUser retrieves the user info of the consumer from the Database.
   * @param  {String} token          The Access Token ID to be used to retrieve
   *                                 the user info.
   * @param  {Object} requestOptions Info about the request done by the user.
   * @return {Promise}               Resolved if a user is found to be linked
   *                                 with the token provided. Rejected
   *                                 otherwise.
   */
  function retrieveUser (token, requestOptions) {
    // Retrieve whether user doing the request is a bot or not.
    const isBotRequest = requestOptions.meta.headers[config.session.header]
      !== undefined

    const opts = {
      notifyStore,
      origin: requestOptions.meta.headers.origin,
      // Access Tokens of bots do not expire.
      maxAge: (isBotRequest) ? undefined : config.session.maxAge
    }

    return utils.getUserByToken(token, opts)
      .then(({payload}) => {
        // Store owner of token.
        const user = payload.records[0]

        // If the request has been a bot request and the owner of the token is
        // not a bot, disallow access.
        if (isBotRequest && user.bot === false) {
          return Promise.reject({
            type: errors.UN_AUTHORIZED,
            message: 'Bot Request with a non-bot User'
          })
        }

        // If the request has been a user request and the owner of the token is
        // a bot, disallow access.
        if (!isBotRequest && user.bot === true) {
          return Promise.reject({
            type: errors.UN_AUTHORIZED,
            message: 'User Request with a Bot user'
          })
        }

        // Else continue.
        return user
      })
  }

  /**
   * verify verfies whether the user has access to the data the consumer is
   * trying to access/modify.
   * @param  {Object} user           Info about the consumer
   * @param  {Object} requestOptions Info about the request done by the user.
   * @return {Promise}               Resolved if the user has access to the data.
   *                                 Rejected otherwise.
   */
  function verify (user, requestOptions) {
    const {type} = requestOptions
    if (type in endpoints) {
      return endpoints[type](requestOptions, user, notifyStore)
    }
  }
}
