//axios.default.timeout = 10000
document.addEventListener('DOMContentLoaded', () => {
let elems = document.querySelectorAll('.sidenav')
M.Sidenav.init(elems)
})

const chooseStreaming = document.getElementById("streaming")
const streamBtn = document.getElementById("streambtn")
const imgPreview = document.getElementById("img-preview")


streamBtn.addEventListener('click', async () => {

  const stream = chooseStreaming.value
  let encodedStreamUrl = encodeURIComponent(stream);
  console.log("http://0.0.0.0:8000/stream/?link=" + encodedStreamUrl)
  document.getElementById('input').src = stream
  //console.log('/api/streaming?stream=' + encodedStreamUrl)
  //console.log(data)
  document.getElementById('result').src = "http://0.0.0.0:8000/stream/?link=" + encodedStreamUrl
  

})