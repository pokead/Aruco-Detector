//const { createCanvas, loadImage } = require('@napi-rs/canvas')
const {Canvas, loadImage} = require('skia-canvas')
const fs = require("fs")
const sharp = require("sharp")


async function modifyImage(width, height, markers, buffer) {
  const canvas = new Canvas(width, height),
    
    ctx = canvas.getContext('2d');
  const img = await loadImage(buffer)
  
  ctx.drawImage(img, 0, 0)
  ctx.strokeStyle = 'blue'
  ctx.lineWidth = 5
  ctx.beginPath()

  for (const marker of markers) {
    const imgOptions = { 
      height: marker.corners[2].y - marker.corners[0].y,
      width: marker.corners[1].x - marker.corners[0].x
    }

    const img = await sharp(fs.readFileSync('./examples/gato.jpeg')).resize(imgOptions).toBuffer()
    const image = await loadImage(img)
    const quad = [
      marker.corners[0].x, marker.corners[0].y,
      marker.corners[1].x, marker.corners[1].y,
      marker.corners[2].x, marker.corners[2].y,
      marker.corners[3].x, marker.corners[3].y
    ]

    ctx.moveTo(marker.corners[0].x, marker.corners[0].y)
    marker.corners.forEach(corner => ctx.lineTo(corner.x, corner.y))
    ctx.lineTo(marker.corners[0].x, marker.corners[0].y)
    const matrix = ctx.createProjection(quad)
    ctx.setTransform(matrix)
    ctx.drawImage(image, marker.corners[0].x, marker.corners[0].y)
  }

  ctx.stroke()
  const result = await canvas.png;
  return result.toString('base64')//canvas.toBuffer('image/png').toString('base64')
}






function createProjection2(quad){
  console.log([quad].flat())
  let [a, b, c, d, e, f, p0, p1, p2] = quad
  const matrix = new DOMMatrix(
    [
      a, d, 0, p0,
      b, e, 0, p1,
      0, 0, 1, 0,
      c, f, 0, p2
    ]

  )
  return matrix
}




module.exports = modifyImage