'use strict'

const errors = require('../errors')

module.exports = (requestOptions, user) => {
  switch (requestOptions.method) {
    // ROOMS can only be read by USERS who are within the ROOM.
    case 'find': return authFind(requestOptions, user)

    // ROOMS can be created.
    case 'create': return Promise.resolve()

    // ROOMS can only be UPDATED by USERS who are within the ROOM.
    case 'update': return authUpdate(requestOptions, user)

    // ROOMS cannot be DELETED.
    case 'delete': return authDelete()
  }
}

/**
 * authFind verifies that the rooms which are returned are all rooms which the
 * consumer is a member of.
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
 * authUpdate verifies that the user is a member of the room (is authorized) he
 * is trying to update.
 * @param  {Object} requestOptions Info about HTTP Request.
 * @param  {Object} user           Info about user.
 * @return {Promise}               Resolved when the consumer is updating his
 *                                 own details. Rejected otherwise.
 */
function authUpdate (requestOptions, user) {
  if (user.rooms.indexOf(requestOptions.ids[0]) === -1) {
    return Promise.reject({ type: errors.NOT_FOUND })
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
