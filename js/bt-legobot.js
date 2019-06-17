/*
*/
(() => {

	const body = document.body;
	const tweetBox = document.getElementById(`tweet-box`);
	let mySBrick;
	const actionQueue = [];
	let isBusy = false;
	let lastTweetText = '';

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

	const lookData = {
		portId: 2,
		angle: 65,
		direction: 0
	};

	const lookNeutralData = {
		portId: 2,
		angle: 0,
		direction: 0
	}

	const freshAirData = {
		portId: 1,
		power: 100,
		direction: 0
	};

	const stopFreshAirData = {
		portId: 1,
		power: 0,
		direction: 0
	};


	/**
	* if not busy, execute; otherwise put into queue
	* @returns {undefined}
	*/
	const executeOrQueue = function(func) {
		if (isBusy) {
			actionQueue.push(func);
		} else {
			execute(func);
		}
	};


	/**
	* execute a function
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
		if (actionQueue.length) {
			const func = actionQueue.shift();
			execute(func);
		}
	};
	

	/**
	* do blink
	* @returns {undefined}
	*/
	const blink = function(counter = 0) {
		const totalBlinks = 5;
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
	const freshAir = function() {
		const dur = 2500;
		mySBrick.setDrive(freshAirData);
		setTimeout(() => {
			mySBrick.setDrive(stopFreshAirData);
			executeNext();
		}, dur);
	};
	
	
	/**
	* 
	* @returns {undefined}
	*/
	const look = function() {
		const dur = 1000;
		mySBrick.setServo(lookData);
		setTimeout(() => {
			mySBrick.setServo(lookNeutralData);
			lookData.direction = (lookData.direction === 1) ? 0 : 1;
			executeNext();
		}, dur);
	};
	


	/**
	* 
	* @returns {undefined}
	*/
	const tweetHandler = function(tweet) {
		const div = document.createElement(`div`);
		div.textContent = tweet;
		const text = tweet.toLowerCase();

		// somehow, we get tweets twice?!
		if (text !== lastTweetText) {
			lastTweetText = text;
			tweetBox.appendChild(div);
			if (text.indexOf('blink') > -1) {
				executeOrQueue(blink);
			}
			if (text.indexOf('fresh air') > -1) {
				executeOrQueue(freshAir);
			}
			if (text.indexOf('look') > -1) {
				executeOrQueue(look);
			}
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

		document.getElementById(`blink`).addEventListener('click', (e) => {
			e.preventDefault();
			executeOrQueue(blink);
		});

		document.getElementById(`fresh-air`).addEventListener('click', (e) => {
			e.preventDefault();
			executeOrQueue(freshAir);
		});

		document.getElementById(`look`).addEventListener('click', (e) => {
			e.preventDefault();
			console.log('go look');
			executeOrQueue(look);
		});

		const socket = io.connect('http://localhost:3000');
		socket.on('stream', tweetHandler);
	};

	// kick of the script when all dom content has loaded
	document.addEventListener('DOMContentLoaded', init);

})();
