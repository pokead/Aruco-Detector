//const { createCanvas, loadImage } = require('@napi-rs/canvas')
const {Canvas, loadImage} = require('skia-canvas')
const fs = require("fs")
const sharp = require("sharp")


async function modifyImage(width, height, markers, buffer, replacebuffer) {
  const canvas = new Canvas(width, height),
    ctx = canvas.getContext('2d');
  const img = await loadImage(buffer)
  
  ctx.drawImage(img, 0, 0)
  ctx.strokeStyle = 'blue'
  ctx.lineWidth = 5
  ctx.beginPath()

  for (const marker of markers) {
    //const img = await sharp(fs.readFileSync('./examples/gato.jpeg')).toBuffer() //resize(imgOptions)
    const image = await loadImage(replacebuffer)
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
    ctx.drawImage(image, 0, 0)
    ctx.resetTransform()
  }

  ctx.stroke()
  const result = await canvas.png;
  return result.toString('base64')//canvas.toBuffer('image/png').toString('base64')
}


module.exports = modifyImage