var cvs = document.getElementById('cvs')

var zoom = 1
var offsetX = 0
var offsetZ = 0
var blockData = {}
var blockTypes = []
var biomeTypes = []
var images = []

var elX = document.getElementById('xPos')
// var elY = document.getElementById('yPos')
var elZ = document.getElementById('zPos')
// var elBiome = document.getElementById('biomeType')
// var elBlock = document.getElementById('blockType')


function debounce(func, wait) {
  var timeout
  return function() {
    var context = this, args = arguments
    var later = function() {
      timeout = null
      func.apply(context, args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

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
  http('/regions', callback)
}

function requestData(x, z, callback) {
  http('/regions/'+x+'/'+z, callback)
}

function requestInfo(callback) {
  http('/info', callback)
}

function requestLocations(callback) {
  http('/locations.json', callback)
}

function prepare(chunks) {
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

        var sx = startX + x
        var sz = startZ + z

        blockData[sx+'-'+sz] = {
          x:sx,
          z:sz,
          y:block.y,
          type:block.type,
          biome:block.biome
        }
      }
    }
  })
}


var elemX = window.innerWidth/2
var elemY = window.innerHeight/2
function setupDragging() {
  var el = cvs.parentNode
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

    } else {

      var x = Math.floor((ev.clientX - elemX - offsetX) / zoom)
      var z = Math.floor((ev.clientY - elemY - offsetZ) / zoom)

      // var block = blockData[x+'-'+z]

      // if (block) {
         elX.innerText = x //block.x
      //   elY.innerText = block.y
         elZ.innerText = z //block.z
      //   elBiome.innerText = biomeTypes[block.biome] && biomeTypes[block.biome].name || block.biome
      //   elBlock.innerText = blockTypes[block.type] && blockTypes[block.type].name || block.type
      // } else {
      //   elX.innerText = '-'
      //   elY.innerText = '-'
      //   elZ.innerText = '-'
      //   elBiome.innerText = '-'
      //   elBlock.innerText = '-'
      // }
    }
  })

  el.addEventListener('wheel', function(ev) {
    if (ev.deltaY > 0) {
      zoom = Math.min(zoom * 2, 8)
    }
    else if (ev.deltaY < 0) {
      zoom = Math.max(zoom / 2, 0.25)
    }
    console.log(zoom)
    zoomMap()
  })
}


var zoomMap = debounce(function() {
  console.log('zoom map')

}, 300)


function setupLocations() {
  requestLocations(function(data) {
    var html = ''
    for (var cat in data) {
      html += '<div><h4>'+cat+'</h4><ul>'
      for (var loc in data[cat]) {
        var coords = JSON.stringify(data[cat][loc])
        html += '<li><a href="#" data-loc="'+coords+'">'+loc+'</a></li>'
      }
      html += '</ul></div>'
    }

    var el = document.getElementById('locations')
    el.innerHTML = html

    el.addEventListener('click', function(ev) {
      ev.preventDefault && ev.preventDefault()
      var a = ev.target
      if (a.nodeName !== 'A') return

      var coords = JSON.parse(a.dataset.loc)
      gotoCoords(coords)
    })
  })
}

function gotoCoords(coords) {
  var h = cvs.parentNode.clientHeight
  var w = cvs.parentNode.clientWidth
  elemX = coords[0] * -1 * zoom + (w/2)
  elemY = coords[2] * -1 * zoom + (h/2)

  cvs.style.left = elemX + 'px'
  cvs.style.top = elemY + 'px'
}

var slice = Array.prototype.slice
function setupModes() {
  var nodes = document.querySelectorAll('input[name="map-mode"]')
  var elems = slice.call(nodes)

  elems.forEach(function(el) {
    el.addEventListener('click', function(ev) {
      var input = ev.toElement
      if (input.checked) {
        images.forEach(function(img) {
          img.src = img.src.substring(0, img.src.lastIndexOf('-')) + '-' + input.value + '.png'
        })
      }
    })
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

  // cvs.style.top = (((deltaZ * 512 * zoom) / 2) + (window.innerHeight/2)) + 'px'
  // cvs.style.left = (((deltaX * 512 * zoom) / 2) + (window.innerHeight/2)) + 'px'

  cvs.style.top = cvs.parentNode.clientHeight/2 + 'px'
  cvs.style.left = cvs.parentNode.clientWidth/2 + 'px'

}

function addImg(file) {
  var img = document.createElement('img')
  img.src = '/cache/r.' + file.x + '.' + file.z + '-topo.png'
  img.style.top = (file.z * 512 * zoom) + 'px'
  img.style.left = (file.x * 512 * zoom) + 'px'
  img.draggable = false
  cvs.appendChild(img)
  return img
}

setupDragging()
setupModes()

requestInfo(function(data) {
  window.blockTypes = data.blocks
  window.biomeTypes = data.biomes

  requestFileList(function(data) {
    setupCanvas(data)
    images = data.map(addImg)
    setupLocations()
  })
})
