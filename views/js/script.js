//axios.default.timeout = 10000;
document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.sidenav');
    M.Sidenav.init(elems);
  });


const chooseFile = document.getElementById("file");
const imgPreview = document.getElementById("img-preview");
const uploadBtn = document.getElementById("uploadbtn");

chooseFile.addEventListener("change", function () {
  getImgData();
});

uploadBtn.addEventListener("click", function () {
  uploadFile();
});

function getImgData() {
  const files = chooseFile.files[0];
  if (files) {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(files);
    fileReader.addEventListener("load", function () {
      imgPreview.style.display = "block";
      imgPreview.innerHTML = '<img style="width: 100%" src="' + this.result + '" />';
    });    
  }
}


function uploadFile() {
  const files = chooseFile.files[0];
  const formData = new FormData();
  formData.append("file", files);
  axios.post('/uploadimage', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  .then(res => {
    console.log(res.data)
    document.getElementById("result").src = res.data;
  })
  .catch(err => {
    console.log(err);
  })
}

