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
 * @param  {Object} notifyStore    Notify store instance.
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
 * authCreate verifies that the message is being created inside a room which the
 * consumer is a member of and also include unread info in the newly created
 * message.
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about user.
 * @param  {Object} notifyStore    Notify store instance.
 * @return {Promise}               Resolved when the consumer is updating his
 *                                 own details. Rejected otherwise.
 */
function authCreate (requestOptions, user, notifyStore) {
  /**
   * roomID in which the message will be written in.
   * @type {String}
   */
  const roomID = requestOptions.payload[0].room 

  // Check that the message is going to be written in a room which the consumer
  // is a member of, if not stop creation request.
  if (user.rooms.indexOf(roomID) === -1) {
    return Promise.reject({
      type: errors.UN_AUTHORIZED,
      message: 'Attempted to create a message in a room you are not a member of'
    })
  }

  // Default restricted fields.
  requestOptions.payload[0].user = user.id
  requestOptions.payload[0].created = new Date()
  requestOptions.payload[0].deleted = false
  requestOptions.payload[0].unread = []

  // Before creating the message, we need to populate the 'unread' attribute
  // with non-bot users who aren't the consumer.
  return notifyStore.store.find(notifyStore.types.ROOMS, roomID)
    .then(({payload}) => {
      const promises = []

      payload.records[0].users.forEach(userID => {
        const promise = notifyStore.store.find(notifyStore.types.USERS, userID)
          .then(({payload}) => payload.records[0])

        promises.push(promise)
      })

      return Promise.all(promises)
    }).then(members => {
      members.forEach(member => {
        if (member.bot === true || member.id === user.id) return
        requestOptions.payload[0].unread.push(member.id)
      })
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
  // Remove modifications to restricted fields.
  delete requestOptions.payload[0].replace.created
  delete requestOptions.payload[0].replace.user
  delete requestOptions.payload[0].replace.room

  if (user.messages.indexOf(requestOptions.ids[0]) === -1) {
    return Promise.reject({
      type: errors.UN_AUTHORIZED,
      message: 'Attempted to modify a message you are not the owner of'
    })
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
