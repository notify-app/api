'use strict'

const {accessControl} = require('../../config')

module.exports = (req, res, next) => {
  // Since all requests are expected to be made with 'WithCredentials' flag set
  // to 'true', we need to pass the following headers on each request.
  res.setHeader('Access-Control-Allow-Origin', accessControl.origins)
  res.setHeader('Access-Control-Allow-Credentials', accessControl.credentials)

  if (req.method !== 'OPTIONS') return next()

  // Only when the request is preflighted, we provide info about supported
  // METHODS and HEADERS.
  res.setHeader('Access-Control-Allow-Methods', accessControl.methods.join(','))
  res.setHeader('Access-Control-Allow-Headers', accessControl.headers.join(','))
  res.setHeader('Access-Control-Max-Age', accessControl.maxAge)
  
  res.end()
}
