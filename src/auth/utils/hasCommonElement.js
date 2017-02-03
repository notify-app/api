'use strict'

module.exports = (arrayOne, arrayTwo) => {
  for (let index = 0; index < arrayOne.length; index++) {
    if (arrayTwo.indexOf(arrayOne[index]) !== -1) return true
  }

  return false
}
