var region = require('./reader')
var toPng = require('./to-png')
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
      async.eachLimit(regions, 4, cacheRegion, function() {
        console.log('All Regions Processed')
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

      modifiedTimes[x+'-'+z] = mtime

      region(path, function(err, data) {
        async.eachSeries(['topo', 'elevation', 'biome'], function(mode, callback) {
          var dest = Path.join(__dirname, 'cache', 'r.'+x+'.'+z+'-'+mode+'.png')
          toPng(data, dest, mode, callback)
        }, callback)
      })
    })
  }

  function removeExistingCache() {
    var files = glob.sync(Path.join('cache', '*.png'))
    files.forEach(function(file) {
      fs.unlinkSync(Path.join(__dirname, file))
    })
  }

  removeExistingCache()


  return {
    start: function() {
      processRegions()
    },
    stop: function() {
      clearTimeout(timer)
    }
  }
}
