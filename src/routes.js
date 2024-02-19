function renderPage(req, res) {
  const dir = __dirname.slice(0, -4)
  const page = formatURL(req.path)

  // Sends the corresponding HTML file for the requested page
  res.sendFile(dir + page, err => {
    if (err) {
      res.status(404)
      res.redirect('/error')
    }
  })
}

// Function that formats the requested URL
function formatURL(requestURL) {
  if (requestURL == '/') 
    requestURL += 'index'

  return `/public${requestURL}.html`
}

module.exports = renderPage