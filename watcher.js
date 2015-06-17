var region = require('./reader')
var regionList = require('./regionlist')
var async = require('async')
var Path = require('path')
var glob = require('glob')
var fs = require('fs')
var zlib = require('zlib')

module.exports = function(regionPath) {

  var timer
  var modifiedTimes = {}

  function processRegions() {
    regionList(regionPath, function(err, regions) {
      async.eachLimit(regions, 2, cacheRegion, function() {
        timer = setTimeout(processRegions, 5*60*1000)
      })
    })
  }

  function cacheRegion(coords, callback) {
    console.log('cache region', coords)
    var x = coords.x
    var z = coords.z
    var path = Path.join(regionPath, 'r.'+x+'.'+z+'.mca')
    fs.stat(path, function(err, stats) {
      var mtime = modifiedTimes[x+'-'+z]
      if (mtime && stats.mtime <= mtime) {
        return callback()
      }

      region(path, function(err, data) {
        var payload = JSON.stringify(data)
        var cachePath = Path.join(__dirname, 'cache', 'r.'+x+'.'+z+'.json.gz')
        var gz = zlib.createGzip()
        var ws = fs.createWriteStream(cachePath, {encoding:'binary'})
        console.log('Writing to', cachePath)
        gz.pipe(ws)
        gz.write(payload, 'utf8')
        gz.end(function() {
          modifiedTimes[x+'-'+z] = stats.mtime
          callback()
        })
      })
    })
  }

  function removeExistingCache() {
    var files = glob.sync(Path.join('cache', '*.json.gz'))
    files.forEach(function(file) {
      fs.unlinkSync(Path.join(__dirname, file))
    })
  }

  // removeExistingCache()


  return {
    start: function() {
      processRegions()
    },
    stop: function() {
      clearTimeout(timer)
    }
  }
}
