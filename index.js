/* express app as a webtask */

const sslRedirect = require('heroku-ssl-redirect')
const Express = require('express')
const app = Express()
const admin = require('firebase-admin')

app.use(sslRedirect());

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
      <style>
        %STYLE%
      </style>
      <script>
        %SCRIPT%
      </script>
    </body>
  </html>
  `

app.use(require('body-parser').json())

app.get('/:id', function (req, res) {
  let ref
  try {
    ref = admin.database().ref(req.params.id)
  } catch (e) {
    console.error('an invalid id attempted to be accessed')
    res.status(400).end()
    return
  }
  ref.once('value', function (snapshot) {
    let json = snapshot.val()
    if (!json || (json.html === undefined || json.html === null)) {
      res.status(400).end()
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
})

// expose this express app as a webtask-compatible function
app.listen(process.env.PORT || 8000, e => console.log('Running'))
