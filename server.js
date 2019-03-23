const apikeys = require('./apikeys.js');
var express = require('express'),
  app = express(),
  http = require('http'),
  server = http.createServer(app),
  Twit = require('twit');


	//set port that we'll use
	port = process.env.PORT || 3000;// This is needed if the app is run on heroku and other cloud providers:

	// Initialize a new socket.io object. It is bound to 
	// the express app, which allows them to coexist.
	io = require('socket.io').listen(app.listen(port));

	// Make the files in the public folder available to the world
	// app.use(express.static(__dirname + '/public'));
	app.use(express.static(__dirname));

	console.log('server running on port', port);



var watchList = ['@btlegobot'];

var T = new Twit(apikeys);

io.sockets.on('connection', function (socket) {

 var stream = T.stream('statuses/filter', { track: watchList })

  stream.on('tweet', function (tweet) {

    io.sockets.emit('stream', tweet.text);

  });
});