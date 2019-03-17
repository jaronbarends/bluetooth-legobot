(() => {

	// tell jshint about globals (they should remain commented out)
	/* globals SBrick */ //Tell jshint SBrick exists as global var

	let mySBrick;
	let sensorTimer;
	let sensorTimeoutIsCancelled = false;
	let sensorSwitch;



	/**
	* get the indicator for which lights button is active
	* @param {object} data - The current values of the port ({portId, power, direction})
	* @returns {undefined}
	*/
	const getActiveLightsHrefValue = function(data) {
		let perc = Math.round(100*data.power/255);
		return perc;
	};



	/**
	* get the indicator for which lights button is active
	* @param {object} data - The current values of the port ({portId, power, direction})
	* @returns {undefined}
	*/
	const getActiveDriveHrefValue = function(data) {
		let perc = mySBrick.drivePowerToPercentage(data.power);
		if (data.direction === mySBrick.CCW) {
			perc = -1*perc;
		}
		return perc;
	};



	/**
	* get the indicator for which lights button is active
	* @param {number} data - The current values of the port ({portId, power, direction})
	* @returns {undefined}
	*/
	const getActiveServoHrefValue = function(data) {
		let angle = mySBrick.servoPowerToAngle(data.power);
		if (data.direction === mySBrick.CCW) {
			angle = -1*angle;
		}
		return angle;
	};
	


	/**
	* get the indicator for which button should be active now
	* @param {string} func - The function-type (lights, drive, servo)
	* @param {number} power - The current power value of the port
	* @returns {undefined}
	*/
	const getActiveHrefValue = function(func, data) {
		if (func === 'lights') {
			return getActiveLightsHrefValue(data);
		} else if (func === 'drive') {
			return getActiveDriveHrefValue(data);
		} else if (func === 'servo') {
			return getActiveServoHrefValue(data);
		}
	};
	


	/**
	* update which button is active when port value changes
	* @param {object} data - Changed port's data {portId, direction, power}
	* @returns {undefined}
	*/
	const updateActiveButton = function(data) {
		const portId = data.portId;
		const power = data.power;
		const direction = data.direction;

		let portName;
		let ports = {
				TOPLEFT: mySBrick.TOPLEFT,
				BOTTOMLEFT: mySBrick.BOTTOMLEFT,
				TOPRIGHT: mySBrick.TOPRIGHT,
				BOTTOMRIGHT: mySBrick.BOTTOMRIGHT
			};

		// check which type of function this is
		for (let portNm in ports) {
			if (ports[portNm] === portId) {
				portName = portNm;
			}
		}

		const container = document.querySelector('.btn-list[data-port="'+portName+'"]');
		if (container) {
			const func = container.getAttribute('data-function');
			const links = Array.from(container.querySelectorAll('a'));
			let hrefValue = getActiveHrefValue(func, data);

			hrefValue = ''+hrefValue;// convert to string, for href has type of string

			links.forEach((link) => {
				if (hrefValue !== '' && link.getAttribute('href') === hrefValue) {
					link.classList.add('btn--is-active');
				} else {
					link.classList.remove('btn--is-active');
				}

			});
		}
	};
	



	/**
	* handle when port has changed
	* @param {event} e - portchange.jsbrick event sent by sbrick.js event.detail: {portId, direction, power}
	* @returns {undefined}
	*/
	const portchangeHandler = function(e) {
		let data = e.detail;
		updateActiveButton(data);
	};



	/**
	* handle when sensor has changed
	* @param {event} e - sensorchange.jsbrick event; At this time sent by this very script; should me moved to sbrick.js
	* @returns {undefined}
	*/
	const sensorchangeHandler = function(e) {
		let data = e.detail;
	};

	

	/**
	* read sensor data and send event
	* @param {number} portId - The id of the port to read sensor data from
	* @returns {undefined}
	*/
	// TODO: I think this should be implemented in sbrick.js
	const getSensorData = function(portId) {
		mySBrick.getSensor(portId, 'wedo')
			.then((m) => {
				let sensorData = m;// { type, voltage, ch0_raw, ch1_raw, value }
				const event = new CustomEvent('sensorchange.jsbrick', {detail: sensorData});
				document.body.dispatchEvent(event);

				clearTimeout(sensorTimer);// clear timeout within then-clause so it will always clear right before setting new one
				if (!sensorTimeoutIsCancelled) {
					// other functions may want to cancel the sensorData timeout
					// but they can't call clearTimeout, because that might be called when the promise is pending
					sensorTimer = setTimeout(() => {getSensorData(portId);}, 20);
				}
			});
	}

	

	/**
	* watch tilt sensor
	* @returns {undefined}
	*/
	const toggleSensor = function() {
		let portId = mySBrick.BOTTOMRIGHT;
		if (sensorSwitch.classList.contains('btn--is-active')) {
			mySBrick.stopSensor(portId);
		} else {
			mySBrick.startSensor(portId);
		}
	};


	/**
	* stop the sensor
	* @returns {undefined}
	*/
	const startSensor = function(portId) {
		// sensorTimeoutIsCancelled = false;
		// getSensorData(portId);

		// const event = new CustomEvent('sensorstart.jsbrick', {detail: {portId}});
		// document.body.dispatchEvent(event);
	};


	/**
	* stop the sensor
	* @returns {undefined}
	*/
	const stopSensor = function(portId) {
		// sensorData timeout is only set when the promise resolves
		// but in the time the promise is pending, there is no timeout to cancel
		// so let's set a var that has to be checked before calling a new setTimeout
		// sensorTimeoutIsCancelled = true;

		// const event = new CustomEvent('sensorstop.jsbrick', {detail: {portId}});
		// document.body.dispatchEvent(event);
	};


	/**
	* handle starting of sensor
	* @param {event} e - * @param {event} e - sensorstart.jsbrick event; At this time sent by this very script; should me moved to sbrick.js
	* @returns {undefined}
	*/
	const sensorstartHandler = function(e) {
		sensorSwitch.classList.add('btn--is-active');
	};


	/**
	* handle starting of sensor
	* @param {event} e - * @param {event} e - sensorstop.jsbrick event; At this time sent by this very script; should me moved to sbrick.js
	* @returns {undefined}
	*/
	const sensorstopHandler = function(e) {
		sensorSwitch.classList.remove('btn--is-active');
	};
	
	


	
	/**
	* initialize control buttons for ports
	* @returns {undefined}
	*/
	const initPortControls = function() {
		document.querySelectorAll('.btn-list').forEach((list) => {
			const portName = list.getAttribute('data-port');
			const func = list.getAttribute('data-function');

			list.querySelectorAll('a').forEach((button) => {
				button.addEventListener('click', (e) => {
					e.preventDefault();
					const valueStr = e.target.getAttribute('href');
					const data = {
						portId: mySBrick[portName],
						power: Math.abs(parseInt(valueStr, 10)),
						direction: valueStr.indexOf('-') === 0 ? mySBrick.CCW : mySBrick.CW
					};

					switch (func) {
						case 'lights':
							mySBrick.setLights(data);
							break;
						case 'drive':
							mySBrick.setDrive(data);
							break;
						case 'servo':
							data.angle = data.power;
							delete data.power;
							mySBrick.setServo(data);
							break;
					}

				});// eventListener
			});// forEach(btn)
		});// forEach(list)

		document.getElementById('stop-all').addEventListener('click', () => {
			mySBrick.stopAll();
			// stopSensor(mySBrick.BOTTOMRIGHT);
		});
	};



	/**
	* initialize controlPanel
	* @returns {undefined}
	*/
	const initInfoControls = function() {
		sensorSwitch = document.getElementById('toggle-sensor');
		sensorSwitch.addEventListener('click', toggleSensor);

		// set listeners for sbrick events
		document.body.addEventListener('portchange.jsbrick', portchangeHandler);
		document.body.addEventListener('sensorchange.jsbrick', sensorchangeHandler);
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

		initInfoControls();
		initPortControls();
	};

	// kick of the script when all dom content has loaded
	document.addEventListener('DOMContentLoaded', init);

})();
