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
  return parseCookie(requestOptions.meta.headers.cookie)
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
          throw new Error(err)
        }
      }
    })

  /**
   * parseCookie parses the HTTP Request header to retrieve the Access Token of
   * the logged in user.
   * @param  {String} cookieHeader String listing all the available cookies.
   * @return {Promise}             Resolved when the user is logged in and the
   *                               Access Token is retrieved. Rejected otherwise.
   */
  function parseCookie (cookieHeader) {
    return utils.getCookieValue(cookieHeader, config.session.cookie)
      .catch(() => {
        return Promise.reject({ type: errors.UN_AUTHORIZED })
      })
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
    const opts = {
      notifyStore,
      maxAge: config.session.maxAge,
      origin: requestOptions.meta.headers.origin
    }

    return utils.getUserByToken(token, opts)
      .then(({payload}) => payload.records[0])
      .catch(() => Promise.reject({ type: errors.UN_AUTHORIZED }))
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
