const { createCanvas, loadImage } = require('@napi-rs/canvas')
const fs = require("fs")
const sharp = require("sharp")


async function modifyImage(width, height, markers, buffer) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
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

    ctx.moveTo(marker.corners[0].x, marker.corners[0].y)
    marker.corners.forEach(corner => ctx.lineTo(corner.x, corner.y))
    ctx.lineTo(marker.corners[0].x, marker.corners[0].y)
    ctx.drawImage(image, marker.corners[0].x, marker.corners[0].y)
  }

  ctx.stroke()
  return canvas.toBuffer('image/png').toString('base64')
}

module.exports = modifyImage