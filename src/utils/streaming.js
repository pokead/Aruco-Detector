const express = require('express');
const MjpegCamera = require('mjpeg-camera');
const WriteStream = require('stream').Writable;
const unpipe = require('unpipe');
var fs = require('fs');
const axios = require("axios");
const sharp = require('sharp');
const { Blob } = require('buffer')



async function modifyStream(frame) {
    
}