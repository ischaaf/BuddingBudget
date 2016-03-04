// This is by far the most poorly defined of the classes, because
// I'm not 100% sure how it interfaces or what it needs to do.

var NetworkManager = function(getData, dataKeys, readyCallback) {

	var credentials = {};
	var host = "http://bbapi.ischaaf.com:8081/";

	// possible callbacks:
	// loginFailure, loggedIn, networkError, dataConflict, etc

	// This is just how I think you could potentially inform
	// the rest of the app of what's going on with asynchronous
	// network goings-ons. If you guys can think of a better way
	// to do this, feel free to replace anything and everything
	// you want.
	var callbacks = {};

	this.registerListener = function(event, callback) {
		console.log("Regestering listener for event: " + event);
		callbacks[event] = callbacks[event] || [];
		callbacks[event].push(callback);
	};

	function notifyListeners(event, args) {
		var callbackArr = callbacks[event] || [];
		for(var i = 0; i < callbackArr.length; i++) {
			callbackArr[i].apply(window, args);
		}
	}

	function saveData(key, value) {
		notifyListeners('saveData', [key, value, false]);
	}
	
	var lastModified = "";
	localforage.ready(function() {
		localforage.getItem('lastModified', function(err, val) {
			lastModified = val;
		});

		localforage.getItem('username', function(err, val) {
			if(val) {
				credentials.user = val;
			}
		});

		localforage.getItem('password', function(err, val) {
			if(val) {
				credentials.password = val;
			}

			readyCallback();
			
		});
	});

	function updateLastModified(newDate){
		lastModified = newDate;
		localforage.setItem('lastModified', newDate);
	}

	function getLastModified() {
		return lastModified;
		// return localforage.getItem('lastModified');
	}

	this.addUser = function(user, pass, name, success, failure) {
		console.log("Creating user");
		enqueueSend("POST", {username: user, password: pass, name: name, token: "pmlWoKIm2XSes7jBHdPtl8UtGgiSnn1PW8xMFPQ1N2X5c1uY9fa3Zu3QYNODkpuy"}, "user", success, failure);
	};


	this.login = function(user, pass, success, failure) {
		enqueueSend("POST", {username: user, password: pass}, "login", function() {
			localforage.setItem('username', user);
			localforage.setItem('password', pass);
			console.log("setting credentials to: (" + user + ", " + pass + ")");
			credentials.user = user;
			credentials.password = pass;
			updateData();
			success.apply(window, arguments);
		}, failure);
	};

	this.fetchInitialData = function(success, failure) {
		enqueueSend("GET", {}, "user?mode=full", function(data) {
			console.log(data);
			//lastModified = data.lastModified;
			updateLastModified(data.lastModified);
			console.log("updated lastModified");
			success(data.data);
		}, failure);
	};

	// Update assets
	this.updateAssets = function(newVal) {
		enqueueSend("PUT", {assets: newVal}, "data", defaultSuccess, defaultFail);
	};

	this.setEndDate = function(endDate) {
		enqueueSend("PUT", {endDate: endDate}, "data", defaultSuccess, defaultFail);
	};

	// Create and add new spending entry
	this.trackSpending = function(trackedEntry) {
		enqueueSend("POST", trackedEntry, "entry", defaultSuccess, defaultFail);
	};

	// Set the specified option to a new value
	this.setOption = function(selection, value) {
		var obj = {};
		obj[selection] = value;
		enqueueSend("PUT", obj, "options", defaultSuccess, defaultFail);
	};

	// Add a new entry to savings or recurring charges / income
	this.addEntry = function(category, val) {
		enqueueSend("POST", val, category, defaultSuccess, defaultFail);
	};

	// Change an entry to savings or recurring charges / income
	this.changeEntry = function(category, name, newVal) {
		if (newVal.constructor === Array && newVal[0]) {
			newVal = newVal[0];
		}
		console.log(JSON.stringify(newVal));
		enqueueSend("PUT", newVal, category, defaultSuccess, defaultFail);
	};

	// Remove an entry from savings or recurring charges / income
	this.removeEntry = function(category, name) {
		enqueueSend("DELETE", {name: name}, category, defaultSuccess, defaultFail);
	};

	this.setRollover = function(rollover) {
		enqueueSend("PUT", {rollover: rollover}, "data", defaultSuccess, defaultFail);
	};

	this.setTomorrowRollover = function(tomorrowRollover) {
		enqueueSend("PUT", {tomorrowRollover: tomorrowRollover}, "data", defaultSuccess, defaultFail);
	};

	var sendQueue = [];
	var sendInProgress = false;

	function enqueueSend(method, data, page, success, fail) {
		if (page != 'login') {
			if (!credentials || !credentials.user || !credentials.password) {
				console.log("No credentials available - request not sending");
				console.log(credentials);
				return;
			}
		}
		if (method != 'GET' && page != 'login') {
			var lm = getLastModified();
			data.lastModified = lm;
			console.log("Injecting lastModified '" + lm + "' into request");
		}
		sendQueue.push({
			method: method, 
			data: data, 
			page: page,
			success: success,
			fail: fail
		});
		checkSend();
	}

	function checkSend() {
		var log = 'checking send queue - ';
		if (!sendInProgress && sendQueue[0] && NETWORK_ENABLED) {
			console.log("Locking Ajax send queue");
			sendInProgress = true;
			var next = sendQueue[0];
			sendQueue.splice(0, 1);
			sendAjax(next.method, next.data, next.page, next.success, next.fail);
		}
	}

	function sendAjax(method, sendData, page, success, fail) {
		if(NETWORK_ENABLED) {
			console.log("sending request: " + method + " - " + page + " with data: " + JSON.stringify(sendData));
			$.ajax({
				method: method,
				url: 'http://bbapi.ischaaf.com:8081/' + page,
				data: sendData,
				timeout: 6000
			}).done(function(data) {
				console.log("SUCCESS - request: " + method + " - " + page + " with data: " + JSON.stringify(data));
				sendInProgress = false;
				if (data.lastModified) {
					console.log("Updating lastModified time to: " + data.lastModified);
					updateLastModified(data.lastModified);
				} else {
					console.log("Request returned no lastModified time");
				}
				success(data);
			}).fail(function(data) {
				console.log("FAILURE - request: " + method + " - " + page + " (" + data.status + ") with data: " + JSON.stringify(data));
				sendInProgress = false;
				// check for fail conditions
				if (data.status == 409) {
					// conflict, we need to get the latest data
					console.log("Conflict, updating data...");
					updateData();
					enqueueSend(method, sendData, page, success, fail);
				} else if (data.status == 401) {
					if (page != 'login') {
						if (silentLogin()) {
							enqueueSend(method, sendData, page, success, fail);
						}
					}
				}
				fail(data);
			}).always(function() { 
				sendInProgress = false; 
				checkSend(); 
			});	
		}
	}

	function silentLogin() {
		if (credentials && credentials.user && credentials.password) {
			enqueueSend("POST", {username: credentials.user, password: credentials.password}, "login", defaultSuccess, defaultFail);
			return true;
		}
		return false;
	}

	function updateData() {
		enqueueSend("GET", {}, "user?mode=full", function(data) {
			console.log("UPDATING DATA to timestamp: " + data.lastModified);
			updateLastModified(data.lastModified);
			console.log("updated lastModified");
			for(var key in data.data) {
				console.log("Setting local data ('" + key + "', '" + JSON.stringify(data.data[key]) + "')");
				saveData(key, data.data[key]);
			}
		}, function() { });
	}

	function defaultFail(data) { }

	function defaultSuccess(data) { }
};
