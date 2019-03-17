/*
* Dummy implementation for WebBluetooth API
*
* This makes it possible to develop without having a real connection
*
*/





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



/*
 * This cleant up version is Jaron Barends' attempt to explain stuff for himself
 */


let WebBluetoothDummy = (function() {
	'use strict';

	// UTF-8
	let encoder = new TextEncoder('utf-8');
	let decoder = new TextDecoder('utf-8');

	class WebBluetoothDummy {

		constructor() {
			this.device					 = null;
			this.server					 = null;
			this._debug					 = false;
			this._characteristics = new Map();
		}


		/**
		* check if a device is connected
		* @returns {boolean}
		*/
		isConnected() {
			return this.device && this.device.gatt.connected;
		}



		/**
		* mimic connecting to a device
		* @returns {undefined}
		*/
		connect(options,services) {
			return new Promise((resolve, reject) => {
				// give this.device the stuff it needs
				// do with small timeout to briefly mimic waiting effect
				setTimeout(() => {
					this.device = {
						id: 'some-dummy-id',
						name: 'SBrick',
						gatt: {
							// device: [object BluetoothDevice],
							connected: true,
							// connect: function,
							// disconnect: function,
							// getPrimaryService: function,
							// getPrimaryServices: function
						}
					};
					resolve();
				}, 200);
			});
		}


		/**
		* mimic disconnecting
		* @returns {undefined}
		*/
		disconnect() {
			return new Promise( (resolve, reject) =>	{
					if( this.isConnected() ) {
						this.device.gatt.connected = false;
						resolve();
					} else {
						reject('Device not connected');
					}
				}
			).catch( e => { this._error(e) } );
		}


		/**
		* mimic reading a value
		* @returns {promise returning datavies}
		*/
		readCharacteristicValue(characteristicUuid) {
			// console.log(characteristicUuid);
			return new Promise( (resolve, reject) => {
				var buffer = new ArrayBuffer(16);
				var dataview = new DataView(buffer, 0);
				resolve(dataview);
			});
		}


		/**
		* mimic writing a value
		* @returns {undefined}
		*/
		writeCharacteristicValue(characteristicUuid, value) {
			return new Promise( (resolve, reject) =>	{
					if( this.isConnected() ) {
						resolve();
					} else {
						reject('Device not connected');
					}
				}
			).then( () => {
			}).catch( e => { this._error(e) } );
		}


		_error(msg) {
			if(this._debug) {
				console.debug(msg);
			} else {
				throw msg;
			}
		}

		_log(msg) {
			if(this._debug) {
				console.log(msg);
			}
		}

		_cacheCharacteristic(service, characteristicUuid) {
			return service.getCharacteristic(characteristicUuid)
			.then(characteristic => {
				this._characteristics.set(characteristicUuid, characteristic);
			});
		}

		_decodeString(data) {
			return decoder.decode(data);
		}

		_encodeString(data) {
			return encoder.encode(data);
		}
	}

	// window.WebBluetoothDummy = new WebBluetoothDummy();
	return WebBluetoothDummy;

})();
