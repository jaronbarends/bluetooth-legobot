/*
 * Copyright (c) 2017 Jarón Barends
 *
 * @author Jarón Barends
 * @website jaron.nl
 *
 * Child-class of sbrick.js with some additional functionality
 *
 * Requires sbrick.js, bluetooth.js and promise-queue library
 * https://github.com/360fun/sbrick.js
 * https://github.com/360fun/bluetooth.js
 * https://github.com/azproduction/promise-queue
 *
 * This code is compatible with SBrick Protocol 4.17
 * https://social.sbrick.com/wiki/view/pageId/11/slug/the-sbrick-ble-protocol
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let SBrickExtended = (function() {
	'use strict';

	// Start general stuff that's equal for all instances, and that doesn't need to be exposed to outside world

		/**
		* servo motor only supports 7 angles per 90 degrees
		* and these angles do not correspond linearly with power values
		* for every supported angle:
		*	angle: the angle in degrees
		*	powerMin: the minimum power value that rotates the servo motor to this angle
		*	powerMax: the maximum power value that rotates the servo motor to this angle
		*	power: a value somewhere between min and max, so we're sure we're in the right range
		*/
		const powerAngles = [
			{ angle: 0, power: 0, powerMin: 0, powerMax: 0},
			{ angle: 13, power: 10, powerMin: 1, powerMax: 19},
			{ angle: 26, power: 40, powerMin: 20, powerMax: 52},
			{ angle: 39, power: 70, powerMin: 53, powerMax: 83},
			{ angle: 52, power: 100, powerMin: 84, powerMax: 116},
			{ angle: 65, power: 130, powerMin: 117, powerMax: 145},
			{ angle: 78, power: 160, powerMin: 146, powerMax: 179},
			{ angle: 90, power: 200, powerMin: 180, powerMax: 255}
		];

		const sensorTypes = [
			{ type: 'tilt',		min: 48,	max: 52},
			{ type: 'motion',	min: 105,	max: 110}
		];

		const tiltStates = [
			{ type: 'up',		min: 14,	max: 18 },
			{ type: 'right', 	min: 51,	max: 55 },
			{ type: 'flat', 	min: 95,	max: 100 },
			{ type: 'down', 	min: 143,	max: 148 },
			{ type: 'left', 	min: 191,	max: 196 }
		];

		const motionStates = [
			{ type: 'close',				max: 60 },// no min for close
			{ type: 'midrange',	min: 61,	max: 109 },
			{ type: 'clear', 	min: 110 }// no max for clear
		];

		const MAX = 255;// copy of sbrick.js MAX value - we need this in general helper functions
		const MAX_QD = 127;// copy of sbrick.js MAX_QD value - we need this in general helper functions
		const MIN_VALUE_BELOW_WHICH_MOTOR_DOES_NOT_WORK = 98;// somehow, motor does not seem to work for power values < 98



		/**
		* get a type depending on which range a value is within
		* @param {number} value - The value to check
		* @param {array} types - An array of type-objects: { type: string, [min: number,] [max: number]}
		* @returns {string} type - The found type | 'unknown'
		*/
		const _rangeValueToType = function(value, types) {
			let type = 'unkown';

			types.forEach((option) => {
				const {min, max} = option;
				if ( (typeof min === 'undefined' || value >= min) && (typeof max === 'undefined' || value <= max) ) {
					type = option.type;
				}
			});

			return type;
		};

	//-- End general stuff that's equal for all instances,




	//-- Start SBrickExtended class definition

		class SBrickExtended extends JSBrick {

			// CONSTRUCTOR

			/**
			* Create a new instance of the SBrickExtended class (and accordingly also WebBluetooth)
			* @param {string} sbrick_name - The name of the sbrick
			*/
			constructor( sbrick_name ) {
				super( sbrick_name);

				// vars for sensor timeouts
				this.sensorTimer = null;
				this.sensorTimeoutIsCancelled = false;
				this.sensors = [];// will contain object for each sensor port with timer: {lastValue, lastState, timer, keepAlive}
			};


			// PUBLIC FUNCTIONS

			/**
			* update a set of lights
			* @param {object} data - New settings for this port {portId, power (0-100), direction}
			* @returns {promise returning object} - { Returned object: portId, direction, power (0-255!), mode}
			*/
			setLights(data) {
				data.power = Math.round(this.MAX * data.power/100);
				return this.drive(data);
			};



			/**
			* update a drive motor
			* @param {object} data - New settings for this port {portId, power (0-100), direction}
			* @returns {promise returning object} - { Returned object: portId, direction, power (0-255!), mode}
			*/
			setDrive(data) {
				data.power = this.drivePercentageToPower(data.power);
				return this.drive(data);
			};



			/**
			* update a servo motor
			* @param {object} data - New settings for this port {portId, angle (0-90), direction}
			* @returns {promise returning object} - { Returned object: portId, direction, power (0-255!), mode}
			*/
			setServo(data) {
				data.power = this.servoAngleToPower(data.angle);
				return this.drive(data);
			};



			/**
			* start stream of sensor measurements and send a sensorstart.sbrick event
			* @param {number} portId - The id of the port to read sensor data from
			* @returns {promise returning undefined} - The promise returned by sbrick.getSensor, but somehow that promise's data isn't returned
			*/
			startSensor(portId) {
				const sensorObj = this._getSensorObj(portId);
				sensorObj.keepAlive = true;

				const data = {portId},
					event = new CustomEvent('sensorstart.sbrick', {detail: data});
				document.body.dispatchEvent(event);

				return this._getNextSensorData(portId);
			}


			/**
			* stop stream of sensor measurements and send a sensorstop.sbrick event
			* @returns {undefined}
			*/
			stopSensor(portId) {
				// sensorData timeout is only set when the promise resolves
				// but in the time the promise is pending, there is no timeout to cancel
				// so let's manipulate a property that has to be checked before calling a new setTimeout
				const sensorObj = this._getSensorObj(portId);
				sensorObj.keepAlive = false;
				const data = {portId};

				const event = new CustomEvent('sensorstop.sbrick', {detail: data});
				document.body.dispatchEvent(event);
			};


			/**
			* translate servo's angle to corresponding power-value
			* @param {number} angle - The angle of the servo motor
			* @returns {number} The corresponding power value (0-255)
			*/
			servoAngleToPower(angle) {
				// servo motor only supports 7 angles per 90 degrees, i.e. increments of 13 degrees
				angle = parseInt(angle, 10);
				const idx = Math.round(angle/13);
				let power = powerAngles[idx].power;

				return power;
			};



			/**
			* translate servo's power to corresponding angle-value
			* @param {number} power - The current power (0-255) of the servo motor
			* @returns {number} The corresponding angle value
			*/
			servoPowerToAngle(power) {
				let angle = 0;
				power = parseInt(power, 10);
				for (let i=0, len=powerAngles.length; i<len; i++) {
					const obj = powerAngles[i];
					if (power === obj.power) {
						angle = obj.angle;
						break;
					}
				}

				return angle;
			};



			/**
			* drive motor does not seem to work below certain power threshold value
			* translate the requested percentage to the actual working power range
			* @param {number} powerPerc - The requested power as percentage
			* @returns {number}	- A value within the acutal power range
			*/
			drivePercentageToPower(powerPerc) {
				let power = 0;
				if (powerPerc !== 0) {
					// define the power range within which the drive does work
					const powerRange = MAX - MIN_VALUE_BELOW_WHICH_MOTOR_DOES_NOT_WORK;
					power = Math.round(powerRange * powerPerc/100 + MIN_VALUE_BELOW_WHICH_MOTOR_DOES_NOT_WORK);
				}

				return power;
			};



			/**
			* drive motor does not seem to work below certain power threshold value
			* translate the actual power in the percentage within the actual working power range
			* @returns {number} - The percentage within the actual power range
			*/
			drivePowerToPercentage(power) {
				// define the power range within which the drive does work
				let powerPerc = 0;
				if (power !== 0) {
					const powerRange = MAX - MIN_VALUE_BELOW_WHICH_MOTOR_DOES_NOT_WORK,
						relativePower = power - MIN_VALUE_BELOW_WHICH_MOTOR_DOES_NOT_WORK;
					powerPerc = Math.round(100 * relativePower / powerRange);
				}

				return powerPerc;
			};



			/**
			* get the type of sensor (tilt, motion) by channel value
			* @param {number} ch0Value - The value of the sensor's channel 0
			* @returns {string} - The type: unknown (default) | tilt | motion
			*/
			getSensorType(ch0Value) {
				return _rangeValueToType(ch0Value, sensorTypes);
			};



			/**
			* determine the state for a sensor value, depending on the kind of sensor
			* @returns {string} state: unknown (default) or [close | midrange | clear] (motion) or [flat | left | right | up | down] (tilt)
			*/
			getSensorState(value, sensorType) {
				let state = 'unknown';

				if (sensorType === 'motion') {
					state = _rangeValueToType(value, motionStates);
				} else if (sensorType === 'tilt') {
					state = _rangeValueToType(value, tiltStates);
				}

				return state;
			};


			// PRIVATE FUNCTIONS



			/**
			* get a new reading of sensor data; send event and set timeout to call this function again
			* @param {number} portId - The id of the port to read sensor data from
			* @param {string} sensorSeries - not implemented yet - in the future it will manage different sensor series (wedo (default), EV3, NXT, ...)
			* @returns {undefined}
			*/
			_getNextSensorData(portId, sensorSeries = 'wedo') {
				let sensorObj = this._getSensorObj(portId);
				return this.getSensor(portId, sensorSeries)
					.then((sensorData) => {
						// sensorData looks like this: { type, voltage, ch0_raw, ch1_raw, value }

						const state = this.getSensorState(sensorData.value, sensorData.type),
							{value, type} = sensorData;

						// add state to sensorData obj
						sensorData.state = state;

						// send event if the raw value of the sensor has changed
						if (value !== sensorObj.lastValue) {
							sensorObj.lastValue = value;
							const changeValueEvent = new CustomEvent('sensorvaluechange.sbrick', {detail: sensorData});
							document.body.dispatchEvent(changeValueEvent);
						}

						// send event if the state of the sensor has changed
						if (state !== sensorObj.lastState) {
							sensorObj.lastState = state;
							const event = new CustomEvent('sensorchange.sbrick', {detail: sensorData});
							document.body.dispatchEvent(event);
							
						}

						// other functions may want to cancel the sensorData timeout, but they can't use clearTimeout
						// because that might be called when the promise is pending (when there is no current timeout),
						// and new timeout would be set in the then-clause when the promise resolves.
						// so they can set the keepAlive property and we'll check that before setting a new timeout
						if (sensorObj.keepAlive) {
							clearTimeout(sensorObj.timer);// when startSensor is called multiple times before stopping, they'll always clear any existing timeout before starting a new one, so we won't get multiple streams running
							sensorObj.timer = setTimeout(() => {
								this._getNextSensorData(portId);
							}, 200);
						}
					});
			}


			/**
			* get a ports object with sensor properties (lastValue etc)
			* @param {number} portId - The id of the port we want to read the sensor from
			* @returns {object} - object with sensor properties ({lastValue, lastState, timer, keepAlive})
			*/
			_getSensorObj(portId) {
				let sensorObj = this.sensors[portId];
				if (typeof sensorObj === 'undefined') {
					sensorObj = {
						lastValue: null,
						lastState: null,
						timer: null,
						keepAlive: true
					};
					this.sensors[portId] = sensorObj;
				}
				return sensorObj;
			};
			




		}

	//-- End SBrickExtended class definition

	return SBrickExtended;

})();
