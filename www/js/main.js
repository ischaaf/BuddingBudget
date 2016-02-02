(function() {

	var storageManager = new StorageManager();
	var notificationManager = new NotificationManager();

	angular.module('budgetData')
		.controller('uiController', ['$scope', 'data', itemsControl]);

	function itemsControl($scope, data) {
		this.getData = data.getData;
		this.setData = data.setData;
	}

})();

// listens for getFunc called with args to change, calls callback as
// callback(newValues, oldValues, info)
// A more convenient interface to set our data watchers
function setWatch($scope, getFunc, args, info, callback) {
	args = (typeof args == 'object') ? args : [args];
	$scope.$watch(function() {
		return getFunc.apply(window, args)
	}, function(nv, ov, scp) {
		if(nv != ov) {
			callback(nv, ov, info);
		}
	});
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};