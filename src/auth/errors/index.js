'use strict'

module.exports = {
  /**
   * User is authenticated.
   * HTTP Status 401.
   * @type {Number}
   */
  UN_AUTHORIZED: 0,

  /**
   * Invalid HTTP request.
   * HTTP Status 400.
   * @type {Number}
   */
  BAD_REQUEST: 1,

  /**
   * No resource found.
   * HTTP Status 404.
   * @type {Number}
   */
  NOT_FOUND: 2,

  /**
   * HTTP Method used is not supported.
   * HTTP Status 405.
   * @type {Number}
   */
  METHOD_NOT_ALLOWED: 3
}
