const express = require('express');
const MjpegCamera = require('mjpeg-camera');
const WriteStream = require('stream').Writable;
const unpipe = require('unpipe');
var fs = require('fs');
const axios = require("axios");
const sharp = require('sharp');
const {Blob} = require('buffer')




var cameras = JSON.parse(fs.readFileSync('cameras.json', 'utf8'));
var args = process.argv.slice(2);

// Create a new MjpegCamera object
var camera = new MjpegCamera({
    user: '',
    password: '',
    url: "http://127.0.0.1:8000/", //http://127.0.0.1:8000/
    name: "Proxy"
});
for(const cam in cameras){
    if(cameras[cam]["Name"] == args[0]){
        camera.url = cameras[cam]["Stream"]
        camera.name = cameras[cam]["Name"]
    }
}

camera.start();

const boundary = '--boundandrebound'; // boundary per il multipart, ci serve per separare i frame jpeg

const app = express();
app.set('view engine', 'ejs');

app.use('/static',express.static('public'));
app.use('/arucojs',express.static('arucojs'));
app.set('view engine', 'ejs');// Imposta il motore di template EJS



let frames = 0;
let fps = 0
let t1 = 0

const Timer = (m) => {
    fps = frames
    frames = 0
  };
setInterval(Timer, 1000);

app.get('/stream', (req, res) => {
    
    res.writeHead(200, { 'Content-Type': 'multipart/x-mixed-replace; boundary=' + boundary });
    let ws = new WriteStream({ objectMode: true });

    ws._write = async function (chunk, enc, next) {
        var jpeg = chunk.data;
        var blob = new Blob([jpeg])

        const form = new FormData();
        form.append("file", blob, "file");

        const response = axios.post("http://127.0.0.1:3000/api/markers", form, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        });


        try {
            t1 = Date.now()
            const { width, height } = await sharp(jpeg).metadata();

            const svg_text1 = `
            <svg width="${width}" height="${height}">
            <style>
            .title { fill: #fff; font-size: 24px; font-weight: bold; font-family: Courier New;}
            </style>
            <text x="50%" y="50%" text-anchor="middle" class="title">FPS: ${fps}</text>
            </svg>
            `;

            const overlayedImage = await sharp(jpeg)
                .composite([])
                .toFormat("jpeg", { mozjpeg: true })
                .toBuffer();

            res.write(boundary + '\nContent-Type: image/jpeg\nContent-Length: ' + overlayedImage.length + '\n\n')
            res.write(overlayedImage);
            frames++
            console.log(frames)
            
        } catch (err) {
            //console.error('Errore durante la manipolazione del frame:', err.message)
        }

        next();
    };
    
    camera.pipe(ws)

    res.on('close', () => {
        unpipe(camera)
    })
})



app.get('/aruco', (req, res) => {
    
    //res.writeHead(200, { 'Content-Type': 'multipart/x-mixed-replace; boundary=' + boundary });
    let ws = new WriteStream({ objectMode: true });
    var canvas, context, imageData, pixels, detector;
    var debugImage, warpImage, homographyImage, frame;
    ws._write = async function (chunk, enc, next) {
        var jpeg = chunk.data;

        try {

            const frame = await sharp(jpeg)
                .toFormat("jpeg", { mozjpeg: true })
                .toBuffer();
            framewidth = 640;
            frameheight = 480;

            //res.write(boundary + '\nContent-Type: image/jpeg\nContent-Length: ' + frame.length + '\n\n')
            //res.write(frame);
            
        } catch (err) {
            //console.error('Errore durante la manipolazione del frame:', err.message)
        }

        next();
    };
    
    //camera.pipe(ws)
    res.render('aruco', { camera: frame });
    res.on('close', () => {
        unpipe(camera)
    })
}
);


const port = 58000;
app.listen(port, '0.0.0.0', () => {
    console.log(`running. in port 58000`);
});
