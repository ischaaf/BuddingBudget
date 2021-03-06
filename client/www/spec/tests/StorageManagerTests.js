describe("StorageManager", function() {

    var storageManager, mockData, mockNetwork, success, failure, readyCB;

    beforeEach(function() {
        PERSIST_DATA = true;
        spyOn(localforage, "ready").and.callFake(function(cb) {
            if(typeof(cb) === 'function') {
                cb();
            }
        });
        spyOn(localforage, 'getItem');
        spyOn(localforage, 'setItem');
        spyOn(localforage, 'removeItem');
    	mockData = {
            getData: jasmine.createSpy('getData'),
            setData: jasmine.createSpy('setData'),
    		registerListener: jasmine.createSpy('registerListener'),
    	    getKeySet: function() {
                return Object.keys(simpleSampleData);
            }
        };
        mockNetwork = {
            registerListener : jasmine.createSpy('registerListener'),
            fetchInitialData: jasmine.createSpy('fetchInitialData'),
            updateAssets : jasmine.createSpy('updateAssets'),
            setEndDate : jasmine.createSpy('setEndDate'),
            trackSpending : jasmine.createSpy('trackSpending'),
            setOption : jasmine.createSpy('setOption'),
            addEntry : jasmine.createSpy('addEntry'),
            changeEntry : jasmine.createSpy('changeEntry'),
            removeEntry : jasmine.createSpy('removeEntry'),
            setRollover : jasmine.createSpy('setRollover')
        }
        var MockRecurring = function() {
            this.setIncome = function() {};
            this.setCharges = function() {};
            this.newDay = function() {};
        };
        RecurringManager = MockRecurring;
        mockData.setData.and.returnValue(true);
        success = jasmine.createSpy('success');
        failure = jasmine.createSpy('failure');
    	readyCB = jasmine.createSpy('readyCB');
        storageManager = new StorageManager(mockData, mockNetwork, readyCB);
    });

    function succeedNotFail() {
        it("should succeed", function() {
            expect(success).toHaveBeenCalled();
        });
        
        it("should not fail", function() {
            expect(failure).not.toHaveBeenCalled();
        });
    }

    function failNotSucceed() {
        it("should fail", function() {
            expect(failure).toHaveBeenCalled();
        });
        
        it("should not succeed", function() {
            expect(success).not.toHaveBeenCalled();
        });
    }

    describe("updateAssets function", function() {

        beforeEach(function() {
            storageManager.updateAssets(0, false, success, failure);
        });

        it("should update data cache", function() {
            expect(mockData.setData).toHaveBeenCalledWith("assets", 0, false);
        });

        it("should update localforage", function() {
            expect(localforage.setItem).toHaveBeenCalledWith("assets", 0);
        });

        it("should update networkManager", function() {
            expect(mockNetwork.updateAssets).toHaveBeenCalledWith(0);
        });

        succeedNotFail();

    });

    describe("trackSpending function", function() {

        describe("given valid data", function() {

            var entry;

            beforeEach(function() {
                entry = new TrackEntry(3, 2, new Date().getTime());
                mockData.getData.and.callFake(function(category) {
                    if(category === 'savings') {
                        return [{}];
                    } else if(category === 'assets') {
                        return 5;
                    } else if(category === 'trackedEntry') {
                        return {};
                    }
                });
            });

            function forAll() {
                succeedNotFail();

                it("should update trackedEntry", function() {
                    expect(mockData.setData).toHaveBeenCalledWith('trackedEntry', entry, undefined);
                });

                it("should update localforage", function() {
                    expect(localforage.setItem).toHaveBeenCalledWith('trackedEntry', entry);
                });

                it("should update networkManager", function() {
                    expect(mockNetwork.trackSpending).toHaveBeenCalledWith(entry);
                });
            }

            describe("with distribute", function() {

                beforeEach(function() {
                    storageManager.trackSpending(entry, 'distribute', success, failure);
                });

                it("should update assets", function() {
                    expect(mockData.setData).toHaveBeenCalledWith('assets', 2, true);
                });

                forAll();

            });

            // describe("with savings", function() {

            //     beforeEach(function() {
            //         storageManager.trackSpending(entry, 'savings', success, failure);
            //     });

            //     it("should update assets", function() {
            //         expect(mockData.setData).toHaveBeenCalledWith('assets', 3, true);
            //     });


            //     it("should update savings", function() {
            //         expect(mockData.setData).toHaveBeenCalledWith('savings', jasmine.any(Object))
            //     });

            //     forAll();

            // });

            describe("with rollover", function() {

                beforeEach(function() {
                    storageManager.trackSpending(entry, 'rollover', success, failure);
                });

                forAll();

            });

        });

        describe("given invalid extraOption", function() {

            beforeEach(function() {
                entry = new TrackEntry(3, 2, new Date().getTime());
                mockData.getData.and.callFake(function(category) {
                    if(category === 'savings') {
                        return [{}];
                    } else if(category === 'assets') {
                        return 5;
                    } else if(category === 'trackedEntry') {
                        return {};
                    }
                });
            });

            it("should fail", function() {
                storageManager.trackSpending(entry, "potato", success, failure);
                expect(failure).toHaveBeenCalled();
                expect(success).not.toHaveBeenCalled();
            });

        });

    });

    describe("setOption function", function() {
        
        beforeEach(function() {
            mockData.getData.and.returnValue({});
            storageManager.setOption("selection", "value", success, failure);
        });

        it("should call setData", function() {
            expect(mockData.setData).toHaveBeenCalledWith('options', {"selection": "value"}, undefined);
        });

        it("should call localforage", function() {
            expect(localforage.setItem).toHaveBeenCalledWith('options', {"selection": "value"});
        });

        it("should call networkStorage", function() {
            expect(mockNetwork.setOption).toHaveBeenCalledWith('selection', 'value');
        })

        succeedNotFail();

    });

    describe("functions to modify arrays of entries", function() {

        beforeEach(function() {
            mockData.getData.and.returnValue([{name: "nameVal1"}]);
        });

        describe("containing SavingsEntry", function() {
            forAll("savings");
        });

        describe("containing ChargeEntry", function() {
            forAll("charges");
        });

        describe("containing IncomeEntry", function() {
            forAll("income");
        });

        function forAll(category) {
            describe("using addEntry function", function() {

                describe("with valid data", function() {

                    beforeEach(function() {
                        storageManager.addEntry(category, {name: "nameVal2"}, success, failure);
                    });

                    succeedNotFail();

                    it("should set new data", function() {
                        expect(mockData.setData).toHaveBeenCalledWith(category, [{name: "nameVal1"}, {name: "nameVal2"}], undefined);
                    });

                    it("should set localforage", function() {
                        expect(localforage.setItem).toHaveBeenCalledWith(category, [{name: "nameVal1"}, {name: "nameVal2"}]);
                    });

                    it("should update networkStorage", function() {
                        expect(mockNetwork.addEntry).toHaveBeenCalledWith(category, {name: "nameVal2"});
                    })

                });

                describe("with invalid data", function() {

                    beforeEach(function() {
                        storageManager.addEntry(category, {name: "nameVal1"}, success, failure);
                    });

                    failNotSucceed();

                    it("should not set new data", function() {
                        expect(mockData.setData).not.toHaveBeenCalled();
                    })

                    it("should not set localforage", function() {
                        expect(localforage.setItem).not.toHaveBeenCalled();
                    })

                    it("should not set networkManager", function() {
                        expect(mockNetwork.addEntry).not.toHaveBeenCalled();
                    })

                });

            });

            describe("using changeEntry function", function() {

                describe("with valid data", function() {

                    beforeEach(function() {
                        storageManager.changeEntry(category, "nameVal1", {name: "nameVal2"}, success, failure);
                    });

                    succeedNotFail();

                    it("should set changed data", function() {
                        expect(mockData.setData).toHaveBeenCalledWith(category, [{name: "nameVal2"}], undefined);
                    });

                    it("should update localforage", function() {
                        expect(localforage.setItem).toHaveBeenCalledWith(category, [{name: "nameVal2"}]);
                    });

                    it("should update NetworkManager", function() {
                        expect(mockNetwork.changeEntry).toHaveBeenCalledWith(category, "nameVal1", {name: "nameVal2"});
                    })

                });

                describe("with invalid data", function() {

                    beforeEach(function() {
                        storageManager.changeEntry(category, "nameVal2", {name: "nameVal3"}, success, failure);
                    });

                    failNotSucceed();

                    it("should not set changed data", function() {
                        expect(mockData.setData).not.toHaveBeenCalled();
                    });

                    it("should not update localforage", function() {
                        expect(localforage.setItem).not.toHaveBeenCalled();
                    });

                    it("should not set networkManager", function() {
                        expect(mockNetwork.changeEntry).not.toHaveBeenCalled();
                    })

                });

            });

            describe("using removeEntry function", function() {

                describe("with valid data", function() {

                    beforeEach(function() {
                        storageManager.removeEntry(category, "nameVal1", success, failure);
                    });

                    succeedNotFail();

                    it("should set deleted data", function() {
                        expect(mockData.setData).toHaveBeenCalledWith(category, [], undefined);
                    });

                    it("should update localforage", function() {
                        expect(localforage.setItem).toHaveBeenCalledWith(category, []);
                    });

                    it("should update networkManager", function() {
                        expect(mockNetwork.removeEntry).toHaveBeenCalledWith(category, "nameVal1");
                    });

                });

                describe("with invalid data", function() {

                    beforeEach(function() {
                        storageManager.removeEntry(category, "nameVal2", success, failure);
                    });

                    failNotSucceed();

                    it("should not set deleted data", function() {
                        expect(mockData.setData).not.toHaveBeenCalled();
                    });

                    it("should not update localforage", function() {
                        expect(localforage.setItem).not.toHaveBeenCalled();
                    });

                    it("should not set networkManager", function() {
                        expect(mockNetwork.removeEntry).not.toHaveBeenCalled();
                    })

                });

            });
        }

    });

    it('should call its ready CB', function() {
        localforage.getItem.and.callFake(function(a, cb) {
            callFunc(cb);
        });
        localforage.removeItem.and.callFake(function(a, cb) {
            callFunc(cb);
        })
        storageManager = new StorageManager(mockData, mockNetwork, readyCB);
    	expect(readyCB).toHaveBeenCalled();
    });

});