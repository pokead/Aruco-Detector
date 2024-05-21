//axios.default.timeout = 10000
document.addEventListener('DOMContentLoaded', () => {
let elems = document.querySelectorAll('.sidenav')
M.Sidenav.init(elems)
})

const chooseStreaming = document.getElementById("streaming")
const chooseReplace = document.getElementById("replace")
const streamBtn = document.getElementById("streambtn")
const imgPreview = document.getElementById("img-preview")
const arucoSlider = document.getElementById("ArucoSlider")

streamBtn.addEventListener('click', async () => {

  const stream = chooseStreaming.value
  const replace = chooseReplace.value
  const size = arucoSlider.value
  let encodedStreamUrl = encodeURIComponent(stream);
  console.log("http://127.0.0.1:8000/stream/?link=" + encodedStreamUrl + "&" + "replace=" +  encodeURIComponent(replace) + "&" + "size=" + size) 
  //document.getElementById('input').src = stream
  //console.log('/api/streaming?stream=' + encodedStreamUrl)
  //console.log(data)
  document.getElementById('result').src = "http://127.0.0.1:8000/stream/?link=" + encodedStreamUrl + "&" + "replace=" +  encodeURIComponent(replace) + "&" + "size=" + size
  document.getElementById('fake').src = 'http://127.0.0.1:8000/startstream/?link=' + replace
  /* fetch('http://127.0.0.1:8000/startstream/?link=' + replace, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        //'Access-Control-Allow-Origin': "*"
    },
    //mode: "no-cors",
    /* body: JSON.stringify(
        {
            link: replace
        }), 
  }) */
  

})