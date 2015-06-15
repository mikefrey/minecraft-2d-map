var http = require('http')
var Path = require('path')
var region = require('./reader')

var staticRx = /\.(js|html|png)/i
var regionRx = /^\/region\/(\d+)\/(\d+)$/i

var server = http.createServer(function(req, res) {
  if (staticRx.test(req.url) || req.url === '/') {
    return serveStatic(req, res)
  }

  if (regionRx.test(req.url)) {
    return serveRegion(req, res)
  }

  res.write(req.url)
  res.end()
})

server.listen(8000, function() {
  console.log('Listening on http://localhost:8000/')
})

var regionBasePath = '/Users/mikefrey/Library/Application Support/minecraft/saves/SomeWorld/region/' //r.0.0.mca'
function serveRegion(req, res) {
  var matches = req.url.match(regionRx)
  var z = matches[1]
  var x = matches[2]

  var path = Path.join(regionBasePath, 'r.'+z+'.'+x+'.mca')
  var data = region(path)
  var payload = JSON.stringify(data)
  res.write(payload)
  res.end()
}

var staticBasePath = Path.join(__dirname, 'public')
function serveStatic(req, res) {
  var path = req.url.replace(/\//g, '')
  if (path == '') path = 'index.html'
  var rs = require('fs').createReadStream(Path.join(staticBasePath, path))
  rs.pipe(res)
}