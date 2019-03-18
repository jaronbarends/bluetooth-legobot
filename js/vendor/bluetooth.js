/*
 * Copyright (c) 2016-17 Francesco Marino
 *
 * @author Francesco Marino <francesco@360fun.net>
 * @website www.360fun.net
 *
 * This is just a basic Class to start playing with the new Web Bluetooth API,
 * specifications can change at any time so keep in mind that all of this is
 * mostly experimental! ;)
 *
 * Check your browser and platform implementation status first
 * https://github.com/WebBluetoothCG/web-bluetooth/blob/gh-pages/implementation-status.md
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let WebBluetooth = (function() {
	'use strict';

	class WebBluetooth {

		constructor() {
			this.device           = null;
			this.server           = null;
			this._characteristics = new Map();
			this._debug           = true;
			this._allCharacteristicsFound       = false;
		}

		isConnected() {
			return this.device && this.device.gatt.connected && this._allCharacteristicsFound;
		}

		/**
		* connect to bluetooth device
		* @returns {Promise}
		* @param {object} options - Optional options to be passed to bluetooth.requestDevice (filters, BluetoothServiceUUIDs, optionalSercives, acceptAllDevices)
		* @param {Object} services - Object with property for every service. Each of those properties looks like
			{
				serviceUUID: {
					name: 'ServiceName', 
					characteristics: {
						characteristicUUID: { name: 'Characteristic Name' },
						characteristicUUID: { name: 'Characteristic Name' }
					}
				},
				serviceUUID: {...}
			}

			TODO: simplify code by restructuring services object to array like this:
			[
				{
					uuid: serviceUUID,
					name: 'ServiceName', 
					characteristics: {
						characteristicUUID: { name: 'Characteristic Name' },
						characteristicUUID: { name: 'Characteristic Name' }
					}
				},
				{ ... }
			]
		*/
		connect(options,services) {
			// break up promise-returning functions to make code more readable
			
			return navigator.bluetooth.requestDevice(options)
			.then(device => {
				this.device = device;
				this._log('Connected to device named "' + device.name + '" with ID "' + device.id + '"');
				return device.gatt.connect();
			})
			.then(server => {
				return this._getAllCharacteristics(server, services);
			})
			.catch((error) => {
				this._warn('Error connecting:', error);
				throw error;
			});
		}

		disconnect() {
			return this._isConnectedPromise()
			.then( ()=> {
				this._log('Device disconnected');
				this._allCharacteristicsFound = false;
				this.device.gatt.disconnect();
			})
			.catch( e => { this._error(e) } );
		}

		readCharacteristicValue(characteristicUuid) {
			return this._isConnectedPromise()
			.then( ()=> {
				let characteristic = this._characteristics.get(characteristicUuid);
				return characteristic.readValue()
				.then(value => {
					// In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
					value = value.buffer ? value : new DataView(value);
					// this._log('READ', characteristic.uuid, value);
					return value;
				});
			})
			.catch( e => { this._error(e) } );
		}

		writeCharacteristicValue(characteristicUuid, value) {
			return this._isConnectedPromise()
			.then( ()=> {
				let characteristic = this._characteristics.get(characteristicUuid);
				// this._log('WRITE', characteristic.uuid, value);
				return characteristic.writeValue(value);
			})
			.catch( e => { this._error(e) } );
		}

		//-- Start private functions -----------------------------------

		_isConnectedPromise() {
			return new Promise((resolve, reject) => {
				if (this.isConnected()) {
					resolve();
				} else {
					reject('Device not connected');
				}
			});
		}

		_getAllCharacteristics(server, services) {
			this.server = server;
			console.log('found server:', server);
			const serviceUUIDArray = Object.keys(services);
			// create array of services's properties and loop over them
			// .map returns an array of promises that's passed in to Promise.all
			console.log(serviceUUIDArray);
			const servicePromiseArray = serviceUUIDArray.map( serviceId => {
				console.log('go get service', serviceId);
				return server.getPrimaryService(serviceId)
				.then(service => {
					const characteristicUUIDArray = Object.keys(services[serviceId].characteristics);
					// create array of promises for getting each characteristic
					const characteristicPromiseArray = characteristicUUIDArray.map( characteristicId => {
						return this._cacheCharacteristic(service, characteristicId)
						.then(() => {})
						.catch((error) => {
							this._warn('Error creating Promise for ', error);
							throw error;
						});
					});

					return Promise.all(characteristicPromiseArray)
					.then( () => {
						this._allCharacteristicsFound = true
					})
					.catch((error) => {
						this._warn('Error in Promise all for characteristics:', error);
						throw error;
					});
				})
				.then( () => { this._log('Found service "' + serviceId + '"'); })
				.catch( (error) => {
					this._error('Service "' + serviceId + '"');
					throw error;
				} );
			});
			return Promise.all(servicePromiseArray);
		}

		_cacheCharacteristic(service, characteristicUuid) {
			return service.getCharacteristic(characteristicUuid)
			.then(characteristic => {
				this._characteristics.set(characteristicUuid, characteristic);
				this._log(`got characteristic ${characteristicUuid}`);
			})
			.catch((error) => {
				this._warn(`error getting characteristic ${characteristicUuid}:`, error);
				throw error;
			});
		}

		//-- Start helper functions
		
		_error(msg) {
			if(this._debug) {
				console.debug(msg);
			} else {
				throw msg;
			}
		}

		_log(...allArgs) {
			if(this._debug) {
				console.log(...allArgs);
			}
		}

		_warn(...allArgs) {
			if(this._debug) {
				console.warn(...allArgs);
			}
		}

	}

	return WebBluetooth;

})();
