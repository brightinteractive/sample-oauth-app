var express = require("express")
var cookieParser = require("cookie-parser")
var querystring = require('querystring')
var http = require('http')

/*
 * Basic data sources
 */
var users = require("./users.json")
var clientCredentials = require("./client-credentials.json")

var app = express()
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))

app.get("/hello", function(req, res) {
  res.status(200).send("Hello")
})

/*
 * Login endpoint to demonstrate basic login
 */
app.post("/login", function(req, res) {
  for (var user of users) {
    if (user.username == req.body.username) {
      res.cookie('user', JSON.stringify(user), {})
    }
  }
  console.log("Username : "+ req.body.username)
  res.redirect('/')
})

app.post("/logout", function(req, res) {
  res.clearCookie('user')
  res.redirect('/')
})

/*
 * Check if the user is logged in
 * Send them AB using OAuth login if not
 */
app.get("/iframe", function(req, res) {
  var user = req.cookies.user

  // This allows users to arrive from different asset bank instances,
  // and get logged in using the correct one.
  // We could  also look at the referrer header
  // If this parameter was not present, we could default to the basic login
  var loginWith = req.query.loginWith

  if (user == undefined) {
    res.redirect(
      loginWith +
      "oauth/authorize" +
      "?" +
      "response_type=code" +
      "&" +
      "client_id=" + clientCredentials.clientId +
      "&" +
      "redirect_uri=http://localhost:3000/code")
  } else {
    res.sendFile(__dirname + "/views/iframe.html")
  }
})

/*
 * This is the endpoint the user hits after authenticating with asset bank
 * We then query the AB API to get user details
 */
app.get("/code", function(req, res) {
  var code = req.query.code
  var expiresIn = req.query.expiresIn
  var post_data = querystring.stringify({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: "http://localhost:3000/code",
    client_id: clientCredentials.clientId,
    client_secret: clientCredentials.clientSecret
  })

  // AB has multiple instances
  // To make sure we query the right one, we might want to store which one was
  // used for login, or make use of the state parameter.
  var request = http.request(
    {
      host: "localhost",
      port: "8080",
      path: "/asset-bank/oauth/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(post_data)
      }
    }, function(tokenRes) {
      tokenRes.setEncoding('utf8')
      tokenRes.on('data', function (chunk) {
          console.log('Token response: ' + chunk)
          var tokenResponse = JSON.parse(chunk)
          var accessToken = tokenResponse.access_token
          var t = new Date()
          var expiresAt = t.setSeconds(t.getSeconds() + tokenResponse.expires_in)
          var userRequest = http.request(
            {
              host: "localhost",
              port: "8080",
              path: "/asset-bank/rest/authenticated-user/",
              method: "GET",
              headers: {
                "Authorization": "Bearer " + accessToken,
                "Accept": "application/json"
              }
            }, function(userRes) {
              userRes.setEncoding('utf8')
              userRes.on('data', function (chunk) {
                console.log('Authorised user response: ' + chunk)
                var userResponse = JSON.parse(chunk)
                // The user details here could be matched to a local set of users
                var user = {
                  username: userResponse.emailAddress,
                  name: userResponse.forename + " " + userResponse.surname
                }
                res.cookie('user', JSON.stringify(user), {expire: expiresAt})
                res.redirect('/iframe')
              })
            })
          userRequest.end()
      })
    })
  request.write(post_data)
  request.end()
})

var server = app.listen(3000, function () {
    console.log("app running on port", server.address().port)
})
