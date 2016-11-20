'use strict'

const errors = require('../errors')

module.exports = (requestOptions, user, notifyStore) => {
  switch (requestOptions.method) {
    case 'find': return authFind(requestOptions, user, notifyStore)
    case 'create': return authCreate(requestOptions, user, notifyStore)
    case 'update': return authUpdate(requestOptions, user, notifyStore)
    case 'delete': return authDelete()
  }
}

/**
 * authFind verifies that:
 *   1. The messages the user is trying to access are messages that belong to
 *      rooms he is a member of.
 *   2. Messages are retrieved either by:
 *      2.1. Their ID
 *      2.2. By room ID containing pagination info.
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about user.
 * @return {Promise}               Resolved when the consumer is updating his
 *                                 own details. Rejected otherwise.
 */
function authFind (requestOptions, user, notifyStore) {
  // If the consumer would like to view all records, he must provide info about
  // the room ID and pagination.
  if (requestOptions.ids === null) {
    const query = requestOptions.uriObject.query || {}
    const roomFilter = 'filter[room]' in query
    const limitFilter = 'page[limit]' in query
    const offsetFilter = 'page[offset]' in query

    if (!roomFilter || !limitFilter || !offsetFilter) {
      return Promise.reject({
        type: errors.BAD_REQUEST,
        message: 'Provide info about Room ID and pagination.'
      })
    }

    return Promise.resolve()
  }
  
  // If the consumer is searching the message ID verify whether the ID he is
  // trying to access is within a room he is a member of.
  return notifyStore.store.find(notifyStore.types.MESSAGES, requestOptions.ids)
    .then(({payload}) => {
      if (payload.count === 0) return Promise.resolve()

      requestOptions.ids = payload.records.filter(message => {
        return user.rooms.indexOf(message.room) !== -1
      }).map(message => message.id)
    })
}

/**
 * authCreate verifies that:
 *   1. The author of the message is the consumer 
 *   2. The room where the message is created is a room which the user has
 *      access to.
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about user.
 * @return {Promise}               Resolved when the consumer is updating his
 *                                 own details. Rejected otherwise.
 */
function authCreate (requestOptions, user) {
  const userValid = requestOptions.payload[0].user === user.id
  const roomValid = user.rooms.indexOf(requestOptions.payload[0].room) !== -1

  if (userValid && roomValid) return Promise.resolve()

  return Promise.reject({
    type: errors.NOT_FOUND
  })    
}

/**
 * authUpdate verifies that the user trying to modify a message is actually its
 * author.
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about user.
 * @return {Promise}               Resolved when the consumer is updating his
 *                                 own details. Rejected otherwise.
 */
function authUpdate (requestOptions, user) {
  if (user.messages.indexOf(requestOptions.ids[0]) === -1) {
    return Promise.reject({ type: errors.NOT_FOUND })
  }
}

/**
 * authDelete disable the delete functionality, since messages cannot be
 * deleted.
 * @return {Promise} Rejected promise containing details about available
 * functionality
 */
function authDelete () {
  return Promise.reject({
    type: errors.METHOD_NOT_ALLOWED,
    allowed: 'GET, POST, PATCH'
  })
}
