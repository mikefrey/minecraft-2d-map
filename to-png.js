var region = require('./reader')
var fs = require('fs')
var PNG = require('pngjs').PNG
var blockTypes = require('./blocks').blocks
var biomeTypes = require('./blocks').biomes

var path = __dirname + '/world/r.0.0.mca'
var dest = __dirname + '/cache/r.0.0.png'
region(path, function(err, chunks) {
  render(chunks, dest, 'elevation')
})


function render(chunks, dest, mode) {

  var getColor = colorModeFuncs[mode]

  fs.createReadStream(__dirname+'/start.png')
    .pipe(new PNG({ filterType: 4 }))
    .on('parsed', function() {
      var png = this.data

      chunks.forEach(function(chunk) {

        var startX = chunk.x % 512
        var startZ = chunk.z % 512

        for (var z = 0; z < 16; z++) {
          for (var x = 0; x < 16; x++) {
            var block = chunk.tops[z][x]
            var sx = startX + x
            var sz = startZ + z
            var color = getColor(block)

            var i = (512 * sz + sx) << 2
            png[i] = (color >> 16) & 255
            png[i+1] = (color >> 8) & 255
            png[i+2] = color & 255
            png[i+3] = 255
          }
        }

      })

      this.pack().pipe(fs.createWriteStream(dest))

    })
}



var colorModeFuncs = {

  elevation: function(block) {
    var c = hsvToRgb(1-(block.y/255), 1, 1)
    return (c[0]<<16) + (c[1]<<8) + c[2]
  },

  elevation2: function(block) {
    var y = ((block.y - 50)/50)*255
    return (y<<16) + (y<<8) + y
  },

  topo: function(block) {
    return blockTypes[block.type].color
  },

  biome: function(block) {
    return biomeTypes[block.biome].color
  }
}

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
function hsvToRgb(h, s, v){
  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch(i % 6){
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return [r * 255, g * 255, b * 255];
}
