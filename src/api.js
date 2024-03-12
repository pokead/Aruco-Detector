const { Router } = require('express')
const express = require('express')
const MjpegCamera = require('mjpeg-camera');
const sharp = require('sharp');
const fs = require('fs')
const router = Router()
const WriteStream = require('stream').Writable;
const unpipe = require('unpipe');

const multer = require('multer')
const upload = multer({ limits: 4 * 1024 * 1024 })

const getImageInfos = require('./utils/markers')
const modifyImage = require('./utils/modifier')
const modifyStream = require('./utils/streaming')

router.use(express.json())  

const boundary = '--boundandrebound'
const gato = fs.readFileSync("examples/gato.jpeg")



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


router.get('/streaming', async (req, res) => {
  try {
    let link = decodeURIComponent(req.query.stream);
    console.log(link)
    var camera = new MjpegCamera({
      user: '',
      password: '',
      url: link, //http://127.0.0.1:8000/
      name: link
  })

    camera.start()

    res.writeHead(200, { 'Content-Type': 'multipart/x-mixed-replace; boundary=' + boundary });
    console.log("test2")
    let ws = new WriteStream({ objectMode: true });
    ws._write = async function (chunk, enc, next) {
      var jpeg = chunk.data;
      var blob = new Blob([jpeg])
      const form = new FormData();
      form.append("file", blob, "file");

      /* const response = axios.post("http://127.0.0.1:3000/api/markers", form, {
      headers: {
          "Content-Type": "multipart/form-data",
      },
      }); */

      try {
          //console.log(jpeg)
          const { markers, width, height } = await getImageInfos(jpeg)
          const modifiedImage = await modifyImage(width, height, markers, jpeg, gato)
          //console.log(modifiedImage)
          const imageBuffer = Buffer.from(modifiedImage, 'base64')
          console.log(imageBuffer)
          const overlayedImage = await sharp(imageBuffer)
                .composite([])
                .toFormat("jpeg", { mozjpeg: true })
                .toBuffer();
          res.write(boundary + '\nContent-Type: image/jpeg\nContent-Length: ' + overlayedImage.length + '\n\n')
          res.write(imageBuffer);
          fs.writeFileSync('test.jpeg', overlayedImage)
          console.log(overlayedImage)
          //return overlayedImage
          
      } catch (err) {

        console.log(err)
          //console.error('Errore durante la manipolazione del frame:', err.message)
      }

      next();
      //camera.pipe(ws)
  };
      camera.pipe(ws)
  } catch (error) {
    console.log(error)
  }
  
})



module.exports = router