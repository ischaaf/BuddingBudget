describe('DataManager', function() {

    var dataManager;

    beforeEach(function() {
        dataManager = new DataManager();
    });

    it('should set and get data', function() {
        dataManager.setData("assets", 5);
        expect(dataManager.getData("assets")).toEqual(5);
    });

    it('can\'t set invalid data type', function() {
        dataManager.setData("potato", 3);
        expect(dataManager.getData("potato")).toEqual(undefined);
    });

    it('fires ready event', function() {
        var readyCalled = false;
        dataManager.registerListener('ready', function() {
            readyCalled = true;
        });
        dataManager.start();
        expect(readyCalled).toEqual(true);
    });

    it('fires single change callback', function() {
        var savingsCalled = false;
        dataManager.registerListener('savings', function() {
            savingsCalled = true;
        });
        dataManager.setData("savings", [1]);
        expect(savingsCalled).toEqual(true);
    });

    it('allows registering multiple callbacks', function() {
        var savingsCalled = false;
        var chargesCalled = false;
        dataManager.registerListener(['savings', 'charges'], function(type) {
            if(type === 'savings') {
                savingsCalled = true;
            } else if(type === 'charges') {
                chargesCalled = true;
            }
        });
        // Neither should be called
        expect(savingsCalled || chargesCalled).toEqual(false);
        dataManager.setData("savings", [1]);
        // ONLY savings should be called
        expect(savingsCalled && !chargesCalled).toEqual(true);
        dataManager.setData("charges", [1]);
        // Both should be called
        expect(savingsCalled && chargesCalled).toEqual(true);
    });
});