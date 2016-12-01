'use strict'

module.exports = (fortune, err) => {
  const output = new fortune.errors.MethodError('Method Not Allowed')

  if ('allowed' in err) {
    output.meta = {
      headers: {
        'Allow': err.allowed
      }
    }
  }

  return output
}
