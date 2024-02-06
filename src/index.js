const express = require('express')
const app = express()

const multer = require('multer')
const upload = multer({ limits: 4 * 1024 * 1024 })

const AR = require('../arucojs/src/aruco').AR
const sharp = require('sharp')

app.use('views', express.static('public'))
app.use(express.urlencoded())
app.set('view engine', 'ejs')

const detector = new AR.Detector({
  dictionaryName: 'ARUCO_MIP_36h12',
  maxHammingDistance: 5
})

app.get('/', (_, res) => {
  res.render('index')
})

app.post('/upload', upload.single('file'), async (req, res) => {
  let decoded = await sharp(req.file.buffer).raw().toBuffer({ resolveWithObject: true})
  const { width, height, channels } = decoded.info
  
  if (channels === 3) {
    decoded = await sharp(decoded.data, { raw: { width, height, channels }})
      .joinChannel(Buffer.alloc(width * height, 255), { raw: { width, height, channels: 1}})
      .toBuffer( { resolveWithObject: true })
  }

  const uint8Array = new Uint8ClampedArray(decoded.data)

  res.status(200).json({ markers: detector.detectImage(width, height, uint8Array) })

  return markers
})

app.listen(3000)