const express = require('express');
const fs = require('fs');
const multer = require('multer')
const upload = multer({
  limits: 4 * 1024 * 1024
}) 
const AR = require('./arucojs/src/aruco').AR;
var pjson = require('./package.json');
const sharp = require('sharp')
const app = express();
const port = 3000;



app.use('views', express.static('public'));
app.use(express.urlencoded());
app.set('view engine', 'ejs');

var detector = new AR.Detector({
  dictionaryName: 'ARUCO_MIP_36h12',
  maxHammingDistance: 5
});


app.get('/', (req, res) => {
  res.render('index');
})



let decode = async (sourceImg, res) => {
  let decoded = await sharp(sourceImg).raw().toBuffer({ resolveWithObject: true});
  const { width, height, channels } = decoded.info;
  
  if (channels === 3) {
    decoded = await sharp(decoded.data, { raw: { width, height, channels }})
    .joinChannel(Buffer.alloc(width * height, 255), { raw: { width, height, channels: 1}})
    .toBuffer( { resolveWithObject: true })
  }

  const uint8Array = new Uint8ClampedArray(decoded.data);
  console.log(uint8Array)
  var markers = detector.detectImage(width, height, uint8Array)
  res.status(200).json({"markers" : markers});
  return markers;
}

app.post('/upload', upload.single('file'), (req, res, next) => {
  decode(req.file.buffer, res)
})

/*app.post('/upload', (req, res) => {
  var image = fs.readFileSync("G:/Progetti/node/RestAPI2/aruco.jpeg")

  /* async function imageToUint8Array(image, context) {
    context.width = image.width;
    context.height = image.height;
    context.drawImage(image, 0, 0);
    const blob = await context.canvas.toBlob(
      callback,
      "image/jpeg", // the MIME type of the image format
      1 // quality (in the range 0..1)
    );
    return new Uint8Array(await blob.arrayBuffer());
  }

  let imagearr = imageToUint8Array("/home/leo/Documents/scula/sitlab/RestAPI/gato.jpeg", ) */
  /*bufferedimage = Buffer.from(image).toString('base64');

  const withPrefix = 'data:image/jpeg;base64,' + bufferedimage;
  function base64ToArrayBuffer(base64) {
    var binaryString = atob(base64);
    var bytes = new Uint8ClampedArray(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    console.log(bytes)
    //return bytes.buffer;
    return bytes
  
}
  
  imagearr = base64ToArrayBuffer(withPrefix)
  //console.log(imagearr)
  var markers = detector.detectImage(650, 558, imagearr)
  console.log(markers)
  
})*/

/* app.post('/upload', (req, res) => {

  const image = new Image(640, 480);
  image.src = "/home/leo/Documents/scula/sitlab/RestAPI/gato.jpeg";
  image.onload = () => {
    ctx.drawImage(image, 0, 0);
    imageData = ctx.getImageData(0, 0, 300, 311);
    console.log(imageData);
    var markers = detector.detect(imageData);
  }
  
}) */

/* app.post('/upload', (req, res) => {
    console.log(req.params);
    var image = fs.readFileSync("C:/Users/lazzari.21129/Pictures/Screenshots/aruco.png")
    //var bitmap = fs.readFileSync(`uploads/${req.file.filename}`);
    //const file = Buffer(bitmap).toString('base64');
    var file = JSON.stringify(image)
    file = Buffer.from(file)
    var markers = detector.detectStreamInit(640, 480, file)
    console.log(markers)
    //console.log(markers)
    /*fs.writeFile(`${req.file.originalname}`, req.file.filename, err => {
      if (err) {
        console.error(err);
      }
    });  */
    /*var file = JSON.stringify(req.files[0].filename)
    file = Buffer.from(file)
    console.log(file)
    var markers = detector.detectImage(640, 480, file)
    //var markers = detector.detect(640, 480, file);
    console.log(markers)*/
    //detector.detectStreamInit(640, 480, onMarkerDetectionHandler);
//}) 


app.listen(port, () => {
  console.log(`La restapi sta venendo eseguita sulla porta ${port}`);
})