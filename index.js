/* express app as a webtask */

const Express = require('express')
const app = Express()
const admin = require('firebase-admin')

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'upcrash-server',
    clientEmail: process.env.EMAIL,
    privateKey: JSON.parse(process.env.KEY)
  }),
  databaseURL: 'https://upcrash-server.firebaseio.com'
})

const template = `
  <!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  <title>title</title>
  </head>
  <body>
%HTML%
  </body>
  <style>
%STYLE%
  </style>
  <script>
%SCRIPT%
  </script>
  </html>
`

app.use(require('body-parser').json())

app.get('/:id', function (req, res) {
  try {
    let ref = admin.database().ref(req.params.id)
    ref.on('value', function (snapshot) {
      let json = snapshot.val()
      if (!json || !json.html) {
        res.status(404).end()
        return
      }
      let filledInTemplate = template.replace('%HTML%', json.html)
                                     .replace('%STYLE%', json.css)
                                     .replace('%SCRIPT%', json.js)
      res.type('html')
      res.send(filledInTemplate)
    }, function (err) {
      res.status(404).end()
      return
    })
  } catch (e) {
    res.status(404).end()
    return
  }
})

// expose this express app as a webtask-compatible function
app.listen(process.env.PORT || 8000, e => console.log('Running'))
