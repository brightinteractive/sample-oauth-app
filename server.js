var express = require("express");
var cookieParser = require("cookie-parser");

var users = require("./users.json")
var clientCredentials = require("./client-credentials.json")

var app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"))

app.get("/hello", function(req, res) {
  res.status(200).send("Hello");
});

app.post("/login", function(req, res) {
  for (var user of users) {
    if (user.username == req.body.username) {
      res.cookie('user', JSON.stringify(user), { httpOnly: true });
    }
  }
  console.log("Username : "+ req.body.username)
  res.redirect('/')
});

app.post("/logout", function(req, res) {
  res.clearCookie('user');
  res.redirect('/')
})

var server = app.listen(3000, function () {
    console.log("app running on port", server.address().port)
})
