let video = document.querySelector('video')
let canvas = document.querySelector('canvas')

if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    console.log("Let's get this party started")
    navigator.mediaDevices.getUserMedia({video: true})
    .then(function (stream) {
        video.srcObject = stream
        video.onloadedmetadata = function(e) {
            video.play()
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            setInterval(async function() {
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
                //console.log(canvas.toDataURL('image/jpeg'))
                //fetch(
                //    "http://127.0.0.1:8000/image/?image="+(canvas.toDataURL('image/jpeg')),
                //    {
                //        method: "GET"
                //    }
                //).then(function (res) { console.log(res)})
                //console.log("http://127.0.0.1:8000/image/?image="+encodeURI(canvas.toDataURL('image/jpeg')))
                canvas.getContext('2d').drawImage(
                    video, 0, 0, canvas.width, canvas.height)
                fetch('http://127.0.0.1:8000/image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        //'Access-Control-Allow-Origin': "*"
                    },
                    //mode: "no-cors",
                    body: JSON.stringify({image: canvas.toDataURL('image/jpeg')}),
                }).then(response => {
                    return response.json();
                  }).then(jsonResponse => {
                    console.log(jsonResponse.buffer);
                    const image = new Image();
                    image.src = jsonResponse.buffer;
                    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
                    
                  }).catch (error => {
                    console.log(error)
                  })
                //console.log(await response.json())
            }, 240)

        }
    })
    .catch(function (err) {
        console.log(err.name + ": " + err.message)
    })
    

    
}