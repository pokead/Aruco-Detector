let video = document.querySelector('video')
let canvas = document.querySelector('canvas')
let image = document.querySelector('img')

if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({video: true})
    .then(function (stream) {
        console.log(stream)
        video.srcObject = stream
        video.onloadedmetadata = function(e) {
            video.play()
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            canvas.getContext('2d').drawImage(
                video, 0, 0, canvas.width, canvas.height)
            setInterval(async function() {
                canvas.getContext('2d').drawImage(
                    video, 0, 0, canvas.width, canvas.height)
                fetch('http://127.0.0.1:8000/exallievi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        //'Access-Control-Allow-Origin': "*"
                    },
                    //mode: "no-cors",
                    body: JSON.stringify(
                        {
                            image: canvas.toDataURL('image/jpeg'),
                        }),
                }).then(response => {
                    return response.json();
                    }).then(jsonResponse => {
                    image.src = jsonResponse.buffer;
                    }).catch (error => {
                    console.log(error)
                    })
            }, 41)//41)

        }
    })
    .catch(function (err) {
        console.log(err.name + ": " + err.message)
    })
    

    
}


