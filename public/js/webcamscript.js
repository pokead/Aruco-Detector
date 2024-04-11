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
            setInterval(function() {
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
                fetch('http://127.0.0.1:8000/image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({image: canvas.toDataURL('image/jpeg')}),
                }).then(function (response) {
                    return response.json()
                }).then(function (data) {
                    console.log(data)
                    if (data.markers) {
                        // Do something with the markers
                    }
                })
            }, 24)

        }
    })
    .catch(function (err) {
        console.log(err.name + ": " + err.message)
    })
    

    
}