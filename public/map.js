var cvs = document.getElementById('cvs')
var ctx //= cvs.getContext('2d')

var zoom = 1
var offsetX = 0
var offsetZ = 0

function http(url, callback) {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', url, true)
  xhr.send()

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      var text = xhr.responseText
      var data = JSON.parse(text)
      callback(data)
    }
  }
}

function requestFileList(callback) {
  http('/filelist', callback)
}

function requestData(x, z, callback) {
  http('/region/'+x+'/'+z, callback)
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
        var cy = offsetZ + ((startZ + z) * zoom)
        var cw = zoom
        var ch = zoom

        if (block.color == 0xFF00FF)
          console.log(block.type)

        ctx.fillStyle = getColor(block.color)
        ctx.fillRect(cx, cy, cw, ch)
        // ctx.fill()
      }
    }
  })
}

function getColor(num) {
  var color = num.toString(16)
  var length = color.length
  return '#' + ('000000'+color).substring(length, length+6)
}


function setupDragging() {
  var el = cvs.parentNode
  var elemX = 0
  var elemY = 0
  var startX = 0
  var startY = 0
  var dragging = false

  el.addEventListener('mousedown', function(ev) {
    dragging = true
    startX = ev.clientX
    startY = ev.clientY
  })

  el.addEventListener('mouseup', function(ev) {
    dragging = false
    elemX += ev.clientX - startX
    elemY += ev.clientY - startY
  })

  el.addEventListener('mousemove', function(ev) {
    if (dragging) {

      cvs.style.left = (elemX + (ev.clientX - startX)) + 'px'
      cvs.style.top = (elemY + (ev.clientY - startY)) + 'px'

    }
  })

  el.addEventListener('mousemove', function(ev) {
    var x = ((ev.clientX - elemX - offsetX) / zoom)
    var z = ((ev.clientY - elemY - offsetZ) / zoom)

    console.log(ev.clientX, ev.clientY, x, z)
  })
}


function setupCanvas(data) {
  var rangeX = {min:0, max:0}
  var rangeZ = {min:0, max:0}

  data.forEach(function(file) {
    rangeX.min = Math.min(rangeX.min, file.x)
    rangeX.max = Math.max(rangeX.max, file.x)
    rangeZ.min = Math.min(rangeZ.min, file.z)
    rangeZ.max = Math.max(rangeZ.max, file.z)
  })

  var deltaX = rangeX.min*-1 + rangeX.max + 1
  var deltaZ = rangeZ.min*-1 + rangeZ.max + 1

  cvs.width = deltaX * 512 * zoom
  cvs.height = deltaZ * 512 * zoom

  offsetX = rangeX.min * -512 * zoom
  offsetZ = rangeZ.min * -512 * zoom

  ctx = cvs.getContext('2d')

  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
  for (var x = 0; x < cvs.width; x += 512*zoom) {
    console.count('x')
    ctx.fillRect(x*zoom, 0, 256*zoom, cvs.height)
  }
  for (var z = 0; z < cvs.height; z += 512*zoom) {
    console.count('z')
    ctx.fillRect(0, z*zoom, cvs.width, 256*zoom)
  }

}

setupDragging()

requestFileList(function(data) {
  setupCanvas(data)
  data.forEach(function(file) {
    requestData(file.x, file.z, render)
  })
})
