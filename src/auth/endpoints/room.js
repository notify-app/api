'use strict'

const errors = require('../errors')

module.exports = (requestOptions, user) => {
  switch (requestOptions.method) {
    // ROOMS can only be read by USERS who are members the ROOM itself.
    case 'find': return authFind(requestOptions, user)

    // ROOMS can be created.
    case 'create': return authFind(requestOptions, user)

    // ROOMS can only be UPDATED by USERS who are members the ROOM itself.
    case 'update': return authUpdate(requestOptions, user)

    // ROOMS cannot be DELETED.
    case 'delete': return authDelete()
  }
}

/**
 * authFind verifies that the returned rooms are all rooms which the user is a
 * member of
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about user.
 * @return {Promise}               Resolved when the consumer is updating his
 *                                 own details. Rejected otherwise.
 */
function authFind (requestOptions, user) {
  // If the user is trying to access rooms by their ID, make sure that he has
  // access.
  if (requestOptions.ids !== null) {
    requestOptions.ids = requestOptions.ids.filter(roomID => {
      return user.rooms.indexOf(roomID) !== -1
    })
    return
  }

  // If the user is trying to view all rooms, display the rooms he has access
  // to.
  requestOptions.ids = user.rooms
}

/**
 * authCreate sets restricted fields.
 * @param  {Object} requestOptions Info about HTTP Request.
 */
function authCreate (requestOptions) {
  // Default restricted fields.
  requestOptions.payload[0].messages = []
}

/**
 * authUpdate verifies that the user is a member of the room (is authorized) he
 * is trying to update.
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about user.
 * @return {Promise}               Resolved when the consumer is updating his
 *                                 own details. Rejected otherwise.
 */
function authUpdate (requestOptions, user) {
  // Remove modifications to restricted fields.
  delete requestOptions.payload[0].replace.private
  delete requestOptions.payload[0].replace.messages

  // Make sure that the user is a member of the room he is updating.
  if (user.rooms.indexOf(requestOptions.ids[0]) === -1) {
    return Promise.reject({
      type: errors.UN_AUTHORIZED,
      message: 'Attempted to change a room you are not a member of'
    })
  }
}

/**
 * authDelete disable the delete functionality, since rooms cannot be deleted
 * from the api. Rooms will be deleted automatically by the server when the last
 * user exists the room.
 * @return {Promise} Rejected promise containing details about available
 * functionality
 */
function authDelete () {
  return Promise.reject({
    type: errors.METHOD_NOT_ALLOWED,
    allowed: 'GET, POST, PATCH'
  })
}
