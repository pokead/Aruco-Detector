const { Router } = require('express')
const express = require('express')

const router = Router()

const multer = require('multer')
const upload = multer({ limits: 4 * 1024 * 1024 })

const getImageInfos = require('./utils/markers')
const modifyImage = require('./utils/modifier')
router.use(express.json())  

router.post('/image', upload.any(), async (req, res) => {
  try {
    const { markers, width, height } = await getImageInfos(req.files[0])
    const modifiedImage = await modifyImage(width, height, markers, req.files[0].buffer, req.files[1].buffer)

    res.send({
      buffer: 'data:image/png;base64,' + modifiedImage,
      markers: markers
    
    })
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


router.post('/streaming', async (req, res) => {
  try {
    console.log(req.body.text)
    
    
  } catch (error) {
    
  }
})



module.exports = router