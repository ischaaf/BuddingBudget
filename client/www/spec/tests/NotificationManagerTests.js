describe("NotificationManager", function() {

    var mock, notificationManager, callback;

    beforeEach(function() {
        mock = {
            getData : jasmine.createSpy('getData').and.callFake(function(category) {
                if(category === 'options') {
                    return {
                        isNotifyMorning : "On",
                        isNotifyNight : "On",
                        isNotifyAssets : "On"
                    };
                } else {
                    return 5;
                }
            }),
            setDataListener : jasmine.createSpy('setDataListener').and.callFake(function(events, cb) {
                callback = cb;
            })
        };

        spyOn(cordova.plugins.notification.local, "cancelAll").and.callFake(function(cb) {
            cb();
        });

        spyOn(cordova.plugins.notification.local, "schedule").and.callThrough();

        notificationManager = new NotificationManager(mock.getData, mock.setDataListener);
    
        callback();
    });

    it('should set listener for ready / budget / options', function() {
        expect(mock.setDataListener).toHaveBeenCalledWith(["ready", "tomorrowBudget", "options"], jasmine.any(Function));
    });

    it('should schedule a notification', function() {
        expect(cordova.plugins.notification.local.schedule).toHaveBeenCalled();
    });

});