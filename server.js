'use strict'

const http = require('http')
const Path = require('path')
const fs = require('fs')
const region = require('./reader')
const regionList = require('./regionlist')
const config = require('./config')
const Watcher = require('./watcher')

const regionBasePath = config.regionPath || __dirname+'/world'
const staticBasePath = Path.join(__dirname, 'public')

const watcher = new Watcher(regionBasePath)
// watcher.start()

const staticRx = /\.(js|html|png)/i
const regionRx = /^\/regions\/(-?\d+)\/(-?\d+)$/i

const server = http.createServer((req, res) => {
  if (staticRx.test(req.url) || req.url === '/') {
    return serveStatic(req, res)
  }

  if (regionRx.test(req.url)) {
    return serveRegion(req, res)
  }

  if (req.url == '/regions') {
    return serveRegionList(req, res)
  }

  if (req.url == '/info') {
    return serveInfo(req, res)
  }

  res.write(req.url)
  res.end()
})

server.listen(8000, () => {
  console.log('Listening on http://localhost:8000/')
})


function serveRegionList(req, res) {
  regionList(regionBasePath, (err, regions) => {
    res.write(JSON.stringify(regions))
    res.end()
  })
}


function serveRegion(req, res) {
  let [_, x, z] = req.url.match(regionRx)
  console.log('region ', x, z)

  let path = Path.join(__dirname, 'cache', 'r.'+x+'.'+z+'.json.gz')
  fs.createReadStream(path).pipe(res)
  res.setHeader('content-encoding', 'gzip')
  res.setHeader('content-type', 'application/json')
}


function serveStatic(req, res) {
  let path = req.url.replace(/\//g, '')
  if (path == '') path = 'index.html'
  let rs = fs.createReadStream(Path.join(staticBasePath, path))
  rs.pipe(res)
}

function serveInfo(req, res) {
  let { blocks:blocks, biomes:biomes } = require('./blocks')
  res.write(JSON.stringify({ blocks, biomes }))
  res.end()
}
