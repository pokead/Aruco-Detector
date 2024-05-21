let video = document.querySelector('video')
let canvas = document.getElementsByClassName('real')[0]
let fake = document.getElementsByClassName('fake')[0]
let fake2 = document.getElementsByClassName('fake2')[0]
const webcamBtn = document.getElementById('webcambtn') 
const chooseStreaming = document.getElementById("streaming")
const arucoSlider = document.getElementById("ArucoSlider")

webcamBtn.addEventListener('click', async () => {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        console.log("Let's get this party started")
        navigator.mediaDevices.getUserMedia({video: true})
        .then(function (stream) {
            let user_stream = chooseStreaming.value
            let encodedStreamUrl = encodeURIComponent(stream);
            fake2.src = 'http://127.0.0.1:8000/startstream/?link=' + user_stream
            /* fetch('http://127.0.0.1:8000/startstream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    //'Access-Control-Allow-Origin': "*"
                },
                //mode: "no-cors",
                body: JSON.stringify(
                    {
                        link: user_stream
                    }),
            }) */

            //let encodedStreamUrl = encodeURIComponent(stream);
            video.srcObject = stream
            video.onloadedmetadata = function(e) {
                video.play()
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                canvas.getContext('2d').drawImage(
                    video, 0, 0, canvas.width, canvas.height)
                fake.width = video.videoWidth
                fake.height = video.videoHeight
                fake.getContext('2d').drawImage(
                    video, 0, 0, fake.width, fake.height)
                setInterval(async function() {
                    //console.log(canvas.toDataURL('image/jpeg'))
                    fake.getContext('2d').drawImage(
                        video, 0, 0, fake.width, fake.height)
                    //canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
                    //console.log(canvas.toDataURL('image/jpeg'))
                    //fetch(
                    //    "http://127.0.0.1:8000/image/?image="+(canvas.toDataURL('image/jpeg')),
                    //    {
                    //        method: "GET"
                    //    }
                    //).then(function (res) { console.log(res)})
                    //console.log("http://127.0.0.1:8000/image/?image="+encodeURI(canvas.toDataURL('image/jpeg')))
                    const size = arucoSlider.value
                    console.log(size)
                    fetch('http://127.0.0.1:8000/image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            //'Access-Control-Allow-Origin': "*"
                        },
                        //mode: "no-cors",
                        body: JSON.stringify(
                            {
                                image: fake.toDataURL('image/jpeg'),
                                replace: user_stream,
                                replace_type: "stream",
                                size: size
                            }),
                    }).then(response => {
                        return response.json();
                      }).then(jsonResponse => {
                        //console.log(jsonResponse.buffer);
                        const image = new Image();
                        image.src = jsonResponse.buffer;
                        image.onload = function() {
                            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
                        }
    
                      }).catch (error => {
                        console.log(error)
                      })
                    //console.log(await response.json())
                }, 60)//41)
    
            }
        })
        .catch(function (err) {
            console.log(err.name + ": " + err.message)
        })
        
    
        
    }
})

