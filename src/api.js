const { Router } = require('express')
const router = Router()

const multer = require('multer')
const upload = multer({ limits: 4 * 1024 * 1024 })

const getImageInfos = require('./utils/markers')
const modifyImage = require('./utils/modifier')

router.post('/image', upload.single('file'), async (req, res) => {
  try {
    const { markers, width, height } = await getImageInfos(req.file)
    const modifiedImage = await modifyImage(width, height, markers, req.file.buffer)

    res.send('data:image/png;base64,' + modifiedImage)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error })
  }
})

router.post('/markers', upload.single('file'), async (req, res) => {
  try {
    const { markers } = await getImageInfos(req.file)
    res.json({ markers })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error })
  }
})

module.exports = router