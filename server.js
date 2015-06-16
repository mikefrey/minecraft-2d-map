var http = require('http')
var Path = require('path')
var region = require('./reader')
var config = require('./config')

var regionBasePath = config.regionPath || __dirname+'/world'
var staticBasePath = Path.join(__dirname, 'public')

var staticRx = /\.(js|html|png)/i
var regionRx = /^\/region\/(-?\d+)\/(-?\d+)$/i

var server = http.createServer(function(req, res) {
  if (staticRx.test(req.url) || req.url === '/') {
    return serveStatic(req, res)
  }

  if (regionRx.test(req.url)) {
    return serveRegion(req, res)
  }

  if (req.url == '/filelist') {
    return serveFileList(req, res)
  }

  res.write(req.url)
  res.end()
})

server.listen(8000, function() {
  console.log('Listening on http://localhost:8000/')
})


function serveFileList(req, res) {
  var glob = require('glob')
  glob('*.mca', { cwd:regionBasePath }, function(err, files) {
    var mcaRx = /(-?\d+)\.(-?\d+)/
    var regions = files.map(function(file) {
      var matches = file.match(mcaRx)
      return {
        x: parseInt(matches[1], 10),
        z: parseInt(matches[2], 10)
      }
    })
    res.write(JSON.stringify(regions))
    res.end()
  })
}


function serveRegion(req, res) {
  var matches = req.url.match(regionRx)
  var x = matches[1]
  var z = matches[2]


  console.log('region ', x, z)

  var path = Path.join(regionBasePath, 'r.'+x+'.'+z+'.mca')
  var data = region(path)
  var payload = JSON.stringify(data)
  res.write(payload)
  res.end()
}


function serveStatic(req, res) {
  var path = req.url.replace(/\//g, '')
  if (path == '') path = 'index.html'
  var rs = require('fs').createReadStream(Path.join(staticBasePath, path))
  rs.pipe(res)
}
