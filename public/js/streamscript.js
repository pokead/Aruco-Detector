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
    document.getElementById('input').src = stream

    
    fetch('/api/streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: stream
        })
      })
    console.log(stream)

})