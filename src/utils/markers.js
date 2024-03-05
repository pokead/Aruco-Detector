const AR = require('../../arucojs/src/aruco').AR
const detector = new AR.Detector({ dictionaryName: 'ARUCO_MIP_36h12', maxHammingDistance: 5 })

const sharp = require('sharp')

async function getImageInfos(file) {
  const { buffer } = file
  let { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  if (channels === 3) {
    ({ data } = await sharp(data, { raw: { width, height, channels } })
      .joinChannel(Buffer.alloc(width * height, 255), { raw: { width, height, channels: 1 } })
      .toBuffer({ resolveWithObject: true }))
  }

  const uint8Array = new Uint8ClampedArray(data)
  const markers = detector.detectImage(width, height, uint8Array)
  console.log(markers);
  return { markers, width, height }
}

module.exports = getImageInfos