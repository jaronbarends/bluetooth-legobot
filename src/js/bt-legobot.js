/*
*/
(() => {

	const body = document.body;
	const tweetBox = document.getElementById(`tweet-box`);

	

	/**
	* initialize all functionality
	* @param {string} varname - Description
	* @returns {undefined}
	*/
	const init = function() {
		const socket = io.connect('http://localhost:3000');
		socket.on('stream', function(tweet){
			const div = document.createElement(`div`);
			div.textContent = tweet;
			tweetBox.appendChild(div);
		});
	};

	// kick of the script when all dom content has loaded
	document.addEventListener('DOMContentLoaded', init);

})();
