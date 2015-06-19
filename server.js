var http = require('http')
var Path = require('path')
var region = require('./reader')
var regionList = require('./regionlist')
var config = require('./config')
var Watcher = require('./watcher')

var regionBasePath = config.regionPath || __dirname+'/world'
var staticBasePath = Path.join(__dirname, 'public')

var watcher = new Watcher(regionBasePath)
watcher.start()

var staticRx = /\.(js|html|png)/i
var regionRx = /^\/regions\/(-?\d+)\/(-?\d+)$/i

var server = http.createServer(function(req, res) {
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

server.listen(8000, function() {
  console.log('Listening on http://localhost:8000/')
})


function serveRegionList(req, res) {
  regionList(regionBasePath, function(err, regions) {
    res.write(JSON.stringify(regions))
    res.end()
  })
}


function serveRegion(req, res) {
  var fs = require('fs')
  var matches = req.url.match(regionRx)
  var x = matches[1]
  var z = matches[2]

  console.log('region ', x, z)

  var path = Path.join(__dirname, 'cache', 'r.'+x+'.'+z+'.json.gz')
  fs.createReadStream(path).pipe(res)
  res.setHeader('content-encoding', 'gzip')
  res.setHeader('content-type', 'application/json')
}


function serveStatic(req, res) {
  var path = req.url.replace(/\//g, '')
  if (path == '') path = 'index.html'
  var rs = require('fs').createReadStream(Path.join(staticBasePath, path))
  rs.pipe(res)
}

function serveInfo(req, res) {
  var info = require('./blocks')
  res.write(JSON.stringify({
    blocks: info.blocks,
    biomes: info.biomes
  }))
  res.end()
}
