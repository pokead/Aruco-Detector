//axios.default.timeout = 10000
document.addEventListener('DOMContentLoaded', () => {
  let elems = document.querySelectorAll('.sidenav')
  M.Sidenav.init(elems)
})

const chooseFile = document.getElementById("file")
const imgPreview = document.getElementById("img-preview")
const uploadBtn = document.getElementById("uploadbtn")

chooseFile.addEventListener('change', event => {
  const file = event.target.files[0]

  if (file) {
    const reader = new FileReader()

    reader.addEventListener('load', e => {
      const image = document.createElement('img')
      image.src = e.target.result
      image.style.width = '100%'
      imgPreview.append(image)

      imgPreview.style.display = 'block'
    })

    reader.readAsDataURL(file)
  }
})

uploadBtn.addEventListener('click', async () => {
  const files = chooseFile.files[0]

  const formData = new FormData()
  formData.append('file', files)

  try {
    const { data } = await axios.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    console.log(data)
    document.getElementById('result').src = data
  } catch (error) {
    console.error(error)
  }
})