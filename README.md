Sample OAuth App
================

This is an example application that demonstrates how SSO can work with the current AB OAuth authorization code flow.

You can log in to the app with email and password.
The users are stored in the users.json file.

The users file has this format:
```
[
  {
    "username": "user@example.com",
    "password": "password",
    "name": "User"
  }
]
```


Login with Asset Bank
---------------------

Ensure the Asset Bank has an OAuth client set up, and put the client id/secret into the `client-credentials.json` file.

The url needed to start the flow would be something like:
http://localhost:3000/iframe?loginWith=http://localhost:8080/asset-bank/
where the Asset Bank server is running on localhost 8080, and the third party app on 3000.

The flow for the user is the following:
* User visits application link
* Application checks if user is logged in (user cookie)
* If user is not logged in, they are redirected to Asset Bank as per the loginWith parameter
* The user logs in with Asset Bank (or is already logged in if using an iframe)
* Asset Bank redirects the user to the redirect url with an authorization code
* Application trades the auth code for a token
* Application uses the token to get the current AB user details via the AB API
* Application logs user in (sets user cookie)
