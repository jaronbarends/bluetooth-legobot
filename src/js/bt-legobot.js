/*
*/
(() => {

	const body = document.body;
	const tweetBox = document.getElementById(`tweet-box`);
	let mySBrick;
	let busy = false;
	const actionQueue = [];

	const lightsOnData = {
		portId: 0,
		power: 100,
		direction: 0
	};

	const lightsOffData = {
		portId: 0,
		power: 0,
		direction: 0
	};

	/**
	* parse the tweet
	* @returns {undefined}
	*/
	const parseTweet = function(tweet) {
		console.log(tweet);
	};


	/**
	* queue an action
	* @returns {undefined}
	*/
	const execute = function(func) {
		isBusy = true;
		func.call();
	};


	/**
	* execute the next action
	* @returns {undefined}
	*/
	const executeNext = function() {
		isBusy = false;	
	};
	

	/**
	* do blink
	* @returns {undefined}
	*/
	const blink = function(counter = 0) {
		const totalBlinks = 10;
		const dur = 150;
		if (counter < totalBlinks) {
			counter++;
			mySBrick.setLights(lightsOnData);
			setTimeout(() => {
				mySBrick.setLights(lightsOffData);
				setTimeout(() => {
					blink(counter);
				}, dur);
			}, dur);
		} else {
			executeNext();
		}
	};
	
	


	/**
	* 
	* @returns {undefined}
	*/
	const tweetHandler = function(tweet) {
		const div = document.createElement(`div`);
		div.textContent = tweet;
		tweetBox.appendChild(div);
		if (tweet.indexOf('blink')) {
			execute(blink);
		}
	};
	
	

	/**
	* initialize all functionality
	* @param {string} varname - Description
	* @returns {undefined}
	*/
	const init = function() {
		window.mySBrick = window.mySBrick || new JSBrick();
		mySBrick = window.mySBrick;

		document.getElementById(`testcall`).addEventListener('click', (e) => {
			e.preventDefault();
			execute(blink);
		});

		const socket = io.connect('http://localhost:3000');
		socket.on('stream', tweetHandler);
	};

	// kick of the script when all dom content has loaded
	document.addEventListener('DOMContentLoaded', init);

})();
