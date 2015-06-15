var cvs = document.getElementById('cvs')
var ctx = cvs.getContext('2d')

var zoom = 1
var offsetX = 0
var offsetY = 0

function requestData(x, z) {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', '/region/'+z+'/'+x, true)
  xhr.send()
  xhr.onreadystatechange = function() {
    var status = xhr.status
    var text = xhr.responseText
    var data = JSON.parse(text)

    if (data) {
      render(data)
    }
  }
}

function render(chunks) {
  if (!Array.isArray(chunks)) {
    chunks = [chunks]
  }

  chunks.forEach(function(chunk) {
    if (!chunk) return
    var startX = chunk.x
    var startZ = chunk.z

    for (var z = 0; z < 16; z++) {
      for (var x = 0; x < 16; x++) {
        var block = chunk.tops[z][x]

        var cx = offsetX + ((startX + x) * zoom)
        var cy = offsetY + ((startZ + z) * zoom)
        var cw = zoom
        var ch = zoom

        ctx.fillStyle = '#'+block.color.toString(16)
        ctx.fillRect(cx, cy, cw, ch)
        // ctx.fill()
      }
    }
  })
}

requestData(0, 0)