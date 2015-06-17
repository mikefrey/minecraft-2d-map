var glob = require('glob')

module.exports = function(regionBasePath, callback) {

  glob('*.mca', { cwd:regionBasePath }, function(err, files) {
    var mcaRx = /(-?\d+)\.(-?\d+)/
    var regions = files.map(function(file) {
      var matches = file.match(mcaRx)
      return {
        x: parseInt(matches[1], 10),
        z: parseInt(matches[2], 10)
      }
    })
    callback(err, regions)
  })
}
