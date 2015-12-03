'use strict'

const fs = require('fs')
const zlib = require('zlib')
const NBTReader = require('minecraft-nbt').NBTReader
const blockDefs = require('./blocks').blocks
const biomeDefs = require('./blocks').biomes

module.exports = function(path, callback) {

  fs.readFile(path, (err, file) => {

    let locs = locations(file)
    let timeInflate = totalTime()
    let timeNbt = totalTime()
    let timeSections = totalTime()

    let data = locs.map((loc) => {

      let pos = loc.offset * 4096
      let lenData = file.slice(pos, pos+5)
      let len = lenData.readIntBE(0, 4)
      let compType = lenData.readIntBE(4, 1)
      let chunkData = file.slice(pos+5, pos+5+len)

      timeInflate.start()
      let chunkBinary = zlib.inflateSync(chunkData)
      timeInflate.end()

      timeNbt.start()
      let chunk = new NBTReader(chunkBinary).read()
      timeNbt.end()

      let tops = makeTops()
      let count = 16 * 16

      timeSections.start()
      for (let s = chunk.root.Level.Sections.length-1; s > -1; s-=1) {
        let section = chunk.root.Level.Sections[s]
        let blocks = section.Blocks
        let blockArray = Object.keys(blocks)

        for (let b = blockArray.length-1; b > -1; b-=1) {
          let key = blockArray[b]
          let val = parseInt(blocks[key], 10)
          let i = parseInt(key, 10)
          let y = (i / 256) | 0
          let z = ((i-(y*256))/16) | 0
          let x = i % 16
          let blk = tops[z][x]

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

      let payload = {
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
  let locData = file.slice(0, 4096)

  let locs = []
  for (let i = 0; i < 4096-4; i+=4) {
    let offset = locData.readIntBE(i, 3)
    let sectorCount = locData.readIntBE(i+3, 1)
    if (offset > 0)
      locs.push({ offset: offset, sectorCount: sectorCount })
  }

  locs.sort((a, b) => a.offset - b.offset)

  return locs
}

function makeTops() {
  let tops = []
  for (let z = 0; z < 16; z++) {
    tops[z] = []
    for (let x = 0; x < 16; x++) {
      tops[z][x] = { y:-1, type:0, color:0xFF00FF, biome:-1 }
    }
  }
  return tops
}


function totalTime() {
  let total = 0
  let start
  return {
    start: () => start = process.hrtime(),
    end: () => {
      let diff = process.hrtime(start)
      total += diff[0] * 1e9 + diff[1]
      start = null
    },
    total: () => total
  }
}
