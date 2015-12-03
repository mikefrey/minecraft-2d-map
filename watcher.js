'use strict'

const region = require('./reader')
const regionList = require('./regionlist')
const async = require('async')
const Path = require('path')
const glob = require('glob')
const fs = require('fs')
const zlib = require('zlib')

module.exports = function(regionPath) {

  let timer
  let modifiedTimes = {}

  function processRegions() {
    regionList(regionPath, (err, regions) => {
      async.eachLimit(regions, 2, cacheRegion, () => {
        timer = setTimeout(processRegions, 5*60*1000)
      })
    })
  }

  function cacheRegion(coords, callback) {
    console.log('cache region', coords)
    let { x: x, z: z } = coords
    let path = Path.join(regionPath, 'r.'+x+'.'+z+'.mca')
    fs.stat(path, (err, stats) => {
      let mtime = modifiedTimes[x+'-'+z]
      if (mtime && stats.mtime <= mtime) {
        return callback()
      }

      region(path, (err, data) => {
        let payload = JSON.stringify(data)
        let cachePath = Path.join(__dirname, 'cache', 'r.'+x+'.'+z+'.json.gz')
        let gz = zlib.createGzip()
        let ws = fs.createWriteStream(cachePath, {encoding:'binary'})
        console.log('Writing to', cachePath)
        gz.pipe(ws)
        gz.write(payload, 'utf8')
        gz.end(() => {
          modifiedTimes[x+'-'+z] = stats.mtime
          callback()
        })
      })
    })
  }

  function removeExistingCache() {
    let files = glob.sync(Path.join('cache', '*.json.gz'))
    files.forEach((file) => fs.unlinkSync(Path.join(__dirname, file)))
  }

  // removeExistingCache()


  return {
    start: () => processRegions(),
    stop: () => clearTimeout(timer)
  }
}
