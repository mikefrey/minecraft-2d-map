var http = require('http')
var Path = require('path')
var fs = require('fs')
var region = require('./reader')
var regionList = require('./regionlist')
var config = require('./config')
var Watcher = require('./watcher')

var regionBasePath = config.regionPath || __dirname+'/world'
var staticBasePath = Path.join(__dirname, 'public')

var watcher = new Watcher(regionBasePath)
// watcher.start()

var staticRx = /\.(js|html|png|json)/i
var regionRx = /^\/regions\/(-?\d+)\/(-?\d+)$/i
var regionImgRx = /^\/cache\/(r\.-?\d+\.-?\d+-\w+\.png)$/i

var server = http.createServer(function(req, res) {

  if (regionImgRx.test(req.url)) {
    return serveRegionImg(req, res)
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

  if (staticRx.test(req.url) || req.url === '/') {
    return serveStatic(req, res)
  }

  res.write(req.url)
  res.end()
})

server.listen(8000, function() {
  console.log('Listening on http://localhost:8000/')
})


function serveRegionList(req, res) {
  regionList(regionBasePath, function(err, regions) {
    res.write(JSON.stringify(regions))
    res.end()
  })
}


function serveRegionImg(req, res) {
  var matches = req.url.match(regionImgRx)
  var img = matches[1]

  var path = Path.join(__dirname, 'cache', img)
  fs.createReadStream(path).pipe(res)
  res.setHeader('content-type', 'image/png')
}


function serveRegion(req, res) {
  var matches = req.url.match(regionRx)
  var x = matches[1]
  var z = matches[2]

  var path = Path.join(__dirname, 'cache', 'r.'+x+'.'+z+'.json.gz')
  fs.createReadStream(path).pipe(res)
  res.setHeader('content-encoding', 'gzip')
  res.setHeader('content-type', 'application/json')
}


function serveStatic(req, res) {
  var path = req.url.replace(/\//g, '')
  if (path == '') path = 'index.html'
  fs.createReadStream(Path.join(staticBasePath, path)).pipe(res)
}

function serveInfo(req, res) {
  var info = require('./blocks')
  res.write(JSON.stringify({
    blocks: info.blocks,
    biomes: info.biomes
  }))
  res.end()
}
