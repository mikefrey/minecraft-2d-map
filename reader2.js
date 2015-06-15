var fs = require('fs')
var zlib = require('zlib')
var NBTReader = require('minecraft-nbt').NBTReader
var blockDefs = require('./blocks').blocks
var biomeDefs = require('./blocks').biomes

var path = '/Users/mikefrey/Library/Application Support/minecraft/saves/SomeWorld/region/r.0.0.mca'

var locData = new Buffer(4096)
var file = fs.readFileSync(path)
console.log('File size:', file.length)
// var size = fs.fstatSync(fd).size - 8192

var locData = file.slice(0, 4096)

var locs = []
for (var i = 0; i < 4096-4; i+=4) {
  var offset = locData.readIntBE(i, 3)
  var sectorCount = locData.readIntBE(i+3, 1)
  if (offset > 0)
    locs.push({ offset: offset, sectorCount: sectorCount })
}

locs.sort(function(a, b) { return a.offset - b.offset })

locs.forEach(function(loc) {
  if (loc.offset > 2) return
  var pos = loc.offset*4096
  console.log('\nOffset', loc.offset)
  console.log('Slice:', pos)

  var lenData = file.slice(pos, pos+5)
  var len = lenData.readIntBE(0, 4)
  var compType = lenData.readIntBE(4, 1)

  // console.log('Chunk Length:', len)
  // console.log('Compression Type:', compType)

  var chunkData = file.slice(pos+5, pos+5+len)
  var chunkBinary = zlib.inflateSync(chunkData)
  var chunk = new NBTReader(chunkBinary).read()

  console.log('X', chunk.root.Level.xPos * 16)
  console.log('Z', chunk.root.Level.zPos * 16)
  console.log('Section Count:', chunk.root.Level.Sections.length)
  // console.log(chunk.root.Level.HeightMap[0])
  // console.log(chunk.root.Level.Sections[0].Blocks)
  // console.log('Biomes', chunk.root.Level.Biomes)

  var tops = makeTops()

  chunk.root.Level.Sections.forEach(function(section) {

    var blocks = section.Blocks

    Object.keys(blocks).forEach(function(key) {
      var val = blocks[key]
      var i = parseInt(key, 10)
      var y = Math.floor(i / 256)
      var z = Math.floor((i-(y*256))/16)
      var x = i % 16

      if (val != 0) {
        var blk = tops[z][x]
        blk.y = y + (parseInt(section.Y, 10) * 16)
        blk.type = val
        blk.color = blockDefs[val].color
        blk.biome = chunk.root.Level.Biomes[z*16+x]
      }

    })
  })

  var payload = {
    x: chunk.root.Level.xPos * 16,
    z: chunk.root.Level.zPos * 16,
    tops: tops
  }
  console.log(tops)
})


function makeTops() {
  var tops = []
  for (var z = 0; z < 16; z++) {
    tops[z] = []
    for (var x = 0; x < 16; x++) {
      tops[z][x] = { y:-1, type:0, color:0xFF00FF, biome:-1 }
    }
  }
  return tops
}