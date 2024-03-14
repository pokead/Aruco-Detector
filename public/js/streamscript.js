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
    console.log(encodedStreamUrl)
    document.getElementById('input').src = stream
    //console.log('/api/streaming?stream=' + encodedStreamUrl)
    
    let { data } = fetch('/api/streaming?stream=' + encodedStreamUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      })
  console.log(data)
  document.getElementById('result').src = "/api/streaming?stream=" + stream
  

})