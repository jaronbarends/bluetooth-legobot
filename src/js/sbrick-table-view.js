(() => {

	// (optional) tell jshint about globals (they should remain commented out)
	/* globals SBrick */ //Tell jshint someGlobalVar exists as global var

	let body = document.body,
		tableView,
		elms = [],
		checkTimer,
		defaultInterval = 10000,
		intervalBeforeConnection = 1000,
		mySbrick;



	/**
	* check and display current battery status
	* @returns {undefined}
	*/
	var checkBatteryAndTemperature = function() {
		let interval = intervalBeforeConnection;
		if (mySBrick.getBattery && mySBrick.isConnected()) {// before connection is made, func won't be present

			// check battery
			mySBrick.getBattery()
				.then( (value) => {
					document.getElementById('table-view__value--battery').textContent = value + '%';
				});

			// check temperature
			mySBrick.getTemp()
				.then( (value) => {
					value = Math.round(10*value)/10;
					document.getElementById('table-view__value--temperature').textContent = value + '°C';
				});

			// change interval to longer
			interval = defaultInterval;
		}
		// set timer again
		checkTimer = setTimeout(checkBatteryAndTemperature, interval);
	};



	/**
	* check and display SBrick's temperature
	* @returns {undefined}
	*/
	var checkTemperature = function() {
		mySBrick.getTemp()
			.then( (value) => {
				value = Math.round(10*value)/10;
				window.util.log('Temperature: ' + value + '°C');
			});
	};



	/**
	* show a ports state
	* @param {object} portObj - The port's current settings {portId, power, direction}
	* @returns {undefined}
	*/
	const showState = function(portObj) {
		tds = elms[portObj.portId];
		tds.power.textContent = portObj.power;
		if (tds.direction) {
			let dir = '';
			if (portObj.power !== 0) {
				dir = (portObj.direction === 0 ? 'cw' : 'ccw');
			}
			tds.direction.textContent = dir;
		}
	};
	


	/**
	* handle change of port power
	* @param {event} e - portchange.jsbrick event with detail: portObjs {portId, power, direction}
	* @returns {undefined}
	*/
	// TODO: sbrick.js does seem to send consecutive portchange events for quickDrive, instead of just 1
	// so change that in sbrick.js
	const portchangeHandler = function(e) {
		let portObjs = e.detail;
		if (!Array.isArray(portObjs)) {
			portObjs = [portObjs];
		}

		portObjs.forEach((portObj) => {
			showState(portObj);
		});

	};


	/**
	* handle change of sensor value
	* @param {event} e - sensorchange.jsbrick event; At this time sent by button-controller.js; should me moved to sbrick.js
	* @returns {undefined}
	*/
	const sensorchangeHandler = function(e) {
		const sensorData = e.detail;
		const sensorType = sensorData.type;// tilt | motion
		const sensorInterpration = mySBrick.getSensorState(sensorData.value, sensorType);

		document.getElementById('table-view__port-3-function').textContent = window.util.capitalize(sensorType);
		document.getElementById('table-view__power--port-3').textContent = window.util.capitalize(sensorInterpration);
	};
	
	

	/**
	* add listeners for changed ports
	* @returns {undefined}
	*/
	const addEventListeners = function() {
		body.addEventListener('portchange.jsbrick', portchangeHandler);
		body.addEventListener('sensorchange.jsbrick', sensorchangeHandler);
	};



	/**
	* initialize all functionality
	* @param {string} varname - Description
	* @returns {undefined}
	*/
	const init = function() {
		window.mySBrick = window.mySBrick || new JSBrick();
		mySBrick = window.mySBrick;
		
		tableView = document.getElementById('table-view');

		for (let i=0; i<4; i++) {
			const power = document.getElementById('table-view__power--port-'+i);
			const direction = document.getElementById('table-view__direction--port-'+i);
			elms.push( {
				power,
				direction
			});
		}
		addEventListeners();
		checkBatteryAndTemperature();
	};



	// kick of the script when all dom content has loaded
	document.addEventListener('DOMContentLoaded', init);

})();
