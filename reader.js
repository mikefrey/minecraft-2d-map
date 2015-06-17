var fs = require('fs')
var zlib = require('zlib')
var NBTReader = require('minecraft-nbt').NBTReader
var blockDefs = require('./blocks').blocks
var biomeDefs = require('./blocks').biomes

module.exports = function(path, callback) {

  fs.readFile(path, function(err, file) {

    var locs = locations(file)
    var timeInflate = totalTime()
    var timeNbt = totalTime()
    var timeSections = totalTime()

    var data = locs.map(function(loc) {

      var pos = loc.offset*4096
      var lenData = file.slice(pos, pos+5)
      var len = lenData.readIntBE(0, 4)
      var compType = lenData.readIntBE(4, 1)
      var chunkData = file.slice(pos+5, pos+5+len)

      timeInflate.start()
      var chunkBinary = zlib.inflateSync(chunkData)
      timeInflate.end()

      timeNbt.start()
      var chunk = new NBTReader(chunkBinary).read()
      timeNbt.end()

      var tops = makeTops()
      var count = 16 * 16

      timeSections.start()
      for (var s = chunk.root.Level.Sections.length-1; s > -1; s-=1) {
        var section = chunk.root.Level.Sections[s]
        var blocks = section.Blocks
        var blockArray = Object.keys(blocks)

        for (var b = blockArray.length-1; b > -1; b-=1) {
          var key = blockArray[b]
          var val = parseInt(blocks[key], 10)
          var i = parseInt(key, 10)
          var y = (i / 256) | 0
          var z = ((i-(y*256))/16) | 0
          var x = i % 16
          var blk = tops[z][x]

          if (val != 0 && blk.type == 0) {
            blk.y = y + (parseInt(section.Y, 10) * 16)
            blk.type = val
            blk.color = blockDefs[val].color
            blk.biome = chunk.root.Level.Biomes[z*16+x]
            count -= 1
          }

          if (count <= 0) break

        }

        if (count <= 0) break
      }
      timeSections.end()

      var payload = {
        x: chunk.root.Level.xPos * 16,
        z: chunk.root.Level.zPos * 16,
        tops: tops
      }
      // console.log(tops)
      return payload
    })

    console.log('Inflate:', timeInflate.total()/1e6)
    console.log('NBT Read:', timeNbt.total()/1e6)
    console.log('Sections:', timeSections.total()/1e6)

    callback(err, data)

  })

}


function locations(file) {
  var locData = file.slice(0, 4096)

  var locs = []
  for (var i = 0; i < 4096-4; i+=4) {
    var offset = locData.readIntBE(i, 3)
    var sectorCount = locData.readIntBE(i+3, 1)
    if (offset > 0)
      locs.push({ offset: offset, sectorCount: sectorCount })
  }

  locs.sort(function(a, b) { return a.offset - b.offset })

  return locs
}

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


function totalTime() {
  var total = 0
  var start
  return {
    start: function() {
      start = process.hrtime()
    },
    end: function() {
      var diff = process.hrtime(start)
      total += diff[0] * 1e9 + diff[1]
      start = null
    },
    total: function() {
      return total
    }
  }
}
