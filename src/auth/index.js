'use strict'

const qs = require('querystring')

const config = require('../../config')
const errors = require('./errors')
const endpoints = require('./endpoints')

const badRequestError = require('./errors/bad-request')
const notFoundError = require('./errors/not-found')
const unAuthorizedError = require('./errors/un-authorized')
const methodNotAllowedError = require('./errors/method-not-allowed')

let notifyStore = null

module.exports = (notifyStoreInst, requestOptions) => {
  notifyStore = notifyStoreInst

  return parseCookie(requestOptions.meta.headers.cookie)
    .then(retrieveToken)
    .then(retrieveUser)
    .then(verify.bind(null, requestOptions))
    .catch(err => {
      switch (err.type) {
        case errors.BAD_REQUEST: {
          throw badRequestError(err)
        }
        case errors.NOT_FOUND: {
          throw notFoundError(err)
        }
        case errors.UN_AUTHORIZED: {
          throw unAuthorizedError(err)
        }
        case errors.METHOD_NOT_ALLOWED: {
          throw methodNotAllowedError(err)
        }
        default: {
          throw new Error(err)
        }
      }
    })
}

/**
 * parseCookie parses the HTTP Request header to retrieve the Access Token of
 * the logged in user.
 * @param  {Object} cookieHeader Object listing all the available cookies.
 * @return {Promise}             Resolved when the user is logged in and the
 *                               Access Token is retrieved. Rejected otherwise.
 */
function parseCookie (cookieHeader) {
  const cookies = qs.parse(cookieHeader, '; ', '=')
  const token = cookies[config.session.name]
  if (token === undefined) return Promise.reject({ type: errors.UN_AUTHORIZED })
  return Promise.resolve(token)
}

/**
 * retrieveToken retrieves the Access Token info, linked with the user consuming
 * the api, from the Database.
 * @param  {String} token The Access Token retrieved from the HTTP Request
 *                        Headers.
 * @return {Promise}      Resolved if cookie is found and still valid. Rejected
 *                        otherwise.
 */
function retrieveToken (token) {
  return notifyStore.store.find(notifyStore.types.TOKENS, undefined, {
    match: {
      token: token
    }
  }).then(({payload}) => {
    if (payload.count > 0) return Promise.resolve(payload.records[0])
    return Promise.reject({ type: errors.UN_AUTHORIZED })
  })
}

/**
 * retrieveUser retrieves the user info of the consumer from the Database.
 * @param  {String} token The Access Token ID to be used to retrieve the user
 *                        info.
 * @return {Promise}      Resolved if a user is found to be linked with the
 *                        token provided. Rejected otherwise.
 */
function retrieveUser (token) {
  return notifyStore.store.find(notifyStore.types.USERS, undefined, {
    match: {
      token: token.id
    }
  }).then(({payload}) => {
    if (payload.count > 0) return Promise.resolve(payload.records[0])
    return Promise.reject({ type: errors.UN_AUTHORIZED })
  })
}

/**
 * verify verfies whether the user has access to the data the consumer is trying
 * to access/modify.
 * @param  {Object} requestOptions Info about the request done by the user.
 * @param  {Object} user           Info about the consumer
 * @return {Promise}               Resolved if the user has access to the data.
 *                                 Rejected otherwise.
 */
function verify (requestOptions, user) {
  const {type} = requestOptions
  if (type in endpoints) {
    return endpoints[type](requestOptions, user, notifyStore)
  }
}
