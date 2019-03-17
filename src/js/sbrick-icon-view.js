(() => {

	// tell jshint about globals (they should remain commented out)
	/* globals SBrick */ //Tell jshint SBrick exists as global var

	let mySBrick,
		view,
		portElms = [],
		activeClass = 'sbrick-icon__port--is-active';


	/**
	* 
	* @returns {undefined}
	*/
	const defineElms = function() {
		view = document.getElementById('sbrick-icon-view');
		const topLeftElm = view.querySelector('.sbrick-icon__port--top-left');
		const bottomLeftElm = view.querySelector('.sbrick-icon__port--bottom-left');
		const topRightElm = view.querySelector('.sbrick-icon__port--top-right');
		const bottomRightElm = view.querySelector('.sbrick-icon__port--bottom-right');

		portElms = [topLeftElm, bottomLeftElm, topRightElm, bottomRightElm];
	};


	/**
	* handle port change
	* @returns {undefined}
	*/
	const portchangeHandler = function(e) {
		const data = e.detail;
		const portElm = portElms[data.portId];

		if (data.power === 0) {
			portElm.classList.remove(activeClass);
		} else {
			portElm.classList.add(activeClass);
		}

	};


	/**
	* handle start of sensor
	* @returns {undefined}
	*/
	const sensorstartHandler = function(e) {
		const data = e.detail;
		const portElm = portElms[data.portId];

		portElm.classList.add(activeClass);
	};


	/**
	* handle stop of sensor
	* @returns {undefined}
	*/
	const sensorstopHandler = function(e) {
		const data = e.detail;
		const portElm = portElms[data.portId];

		portElm.classList.remove(activeClass);
	};
	

	/**
	* add event listeners for this view
	* @returns {undefined}
	*/
	const addEventListeners = function() {
		document.body.addEventListener('portchange.jsbrick', portchangeHandler);
		document.body.addEventListener('sensorstart.jsbrick', sensorstartHandler);
		document.body.addEventListener('sensorstop.jsbrick', sensorstopHandler);
	};
	


	/**
	* initialize all functionality
	* @param {string} varname - Description
	* @returns {undefined}
	*/
	const init = function() {
		window.mySBrick = window.mySBrick || new JSBrick();
		mySBrick = window.mySBrick;

		defineElms();
		addEventListeners();
	};

	// kick of the script when all dom content has loaded
	document.addEventListener('DOMContentLoaded', init);

})();
