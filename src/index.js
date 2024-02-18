const express = require("express");
const app = express();

const multer = require("multer");
const upload = multer({ limits: 4 * 1024 * 1024 });

const AR = require("../arucojs/src/aruco").AR;
const sharp = require("sharp");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

app.use(express.static("views"));
app.use(express.urlencoded());
app.set("view engine", "ejs");


const detector = new AR.Detector({
  dictionaryName: "ARUCO_MIP_36h12",
  maxHammingDistance: 5,
});

app.get("/", (_, res) => {
  res.render("index.html");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  let decoded = await sharp(req.file.buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = decoded.info;

  if (channels === 3) {
    decoded = await sharp(decoded.data, { raw: { width, height, channels } })
      .joinChannel(Buffer.alloc(width * height, 255), {
        raw: { width, height, channels: 1 },
      })
      .toBuffer({ resolveWithObject: true });
  }

  const uint8Array = new Uint8ClampedArray(decoded.data);

  let markers = res
    .status(200)
    .json({ markers: detector.detectImage(width, height, uint8Array) });

  return markers;
});

app.post("/uploadimage", upload.single("file"), async (req, res) => {
  try {
    let decoded = await sharp(req.file.buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width, height, channels } = decoded.info;

    if (channels === 3) {
      decoded = await sharp(decoded.data, { raw: { width, height, channels } })
        .joinChannel(Buffer.alloc(width * height, 255), {
          raw: { width, height, channels: 1 },
        })
        .toBuffer({ resolveWithObject: true });
    }

    const uint8Array = new Uint8ClampedArray(decoded.data);
    let markers = detector.detectImage(width, height, uint8Array);
    // console.log(markers);
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const img = await loadImage(req.file.buffer);
    ctx.drawImage(img, 0, 0);
    for (marker of markers) {
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(marker.corners[0].x, marker.corners[0].y);
      ctx.lineTo(marker.corners[1].x, marker.corners[1].y);
      ctx.lineTo(marker.corners[2].x, marker.corners[2].y);
      ctx.lineTo(marker.corners[3].x, marker.corners[3].y);
      ctx.lineTo(marker.corners[0].x, marker.corners[0].y);
      ctx.stroke();
      
    }
    const buffer = canvas.toBuffer("image/png");
    const base64img = "data:image/png;base64," + buffer.toString("base64");
    res.send(base64img);
    
  } catch (error) {
    console.log(error);
  }
});

app.listen(3000);
