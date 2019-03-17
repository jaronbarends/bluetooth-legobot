var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  ,Twit = require('twit');
//   , io = require('socket.io').listen(server);

// server.listen(8080);

// // routing
// app.get('/', function (req, res) {
// res.sendfile(__dirname + '/index.html');
// });


		//set port that we'll use
		port = process.env.PORT || 3000;// This is needed if the app is run on heroku and other cloud providers:

		// Initialize a new socket.io object. It is bound to 
		// the express app, which allows them to coexist.
		io = require('socket.io').listen(app.listen(port));

		// Make the files in the public folder available to the world
		// app.use(express.static(__dirname + '/public'));
		app.use(express.static(__dirname));



var watchList = ['ajax'];
var T = new Twit({
    consumer_key:         'oQoLcduD8tWK3F0D1XKHpF1Sg'
  , consumer_secret:      'TZMJUcboKLDabUgFtI15LHgJU1UdM1an8IEA5Jft03advvERHO'
  , access_token:         '5957202-ekV38dPB6mrUDTfIseMK6oaZ0L6Z6AfUEPFKBGhewg'
  , access_token_secret:  'ULmQW5qrjgEJB00NyWDZCpWZ3aJc7fsLQgPL0RrSHBLcQ'
});


io.sockets.on('connection', function (socket) {
  console.log('Connected');


 var stream = T.stream('statuses/filter', { track: watchList })

  stream.on('tweet', function (tweet) {

    io.sockets.emit('stream',tweet.text);

  });
});