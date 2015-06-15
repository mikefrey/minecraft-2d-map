var fs = require('fs')
var readMCA = require('minecraft-mca')
var mcRegion = require('minecraft-region')

var path = '/Users/mikefrey/Library/Application Support/minecraft/saves/SomeWorld/region/r.0.0.mca'

var binaryRegionData = fs.readFileSync(path)
var region = mcRegion(binaryRegionData)

var tops = []

var opts = {
  ymin: 0,
  onVoxel: function(x, y, z, type, offsetX, offsetZ) {
    if (!tops[x]) tops[x] = []
    if (!tops[x][z]) tops[x][z] = {}
    var vox = tops[x][z]
    if (!vox.y || vox.y < y) {
      vox.type = type
    }
  }
}

var mca = readMCA(region, opts)
mca.loadNearby(0, 0, 1)

console.log(top)