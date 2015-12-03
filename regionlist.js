'use strict'

const glob = require('glob')
const mcaRx = /(-?\d+)\.(-?\d+)/

module.exports = function(regionBasePath, callback) {

  glob('*.mca', { cwd:regionBasePath }, (err, files) => {
    callback(err, files.map((file) => {
      let [_, x, z] = file.match(mcaRx)
      return { x: parseInt(x, 10), z: parseInt(z, 10) }
    }))
  })
}
