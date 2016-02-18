// THIS FILE SHOULD BE THE ONLY PLACE THE DOM IS MANIPULATED
// Handles sending new data and commands out from the DOM, and
// putting new updated data into the DOM.

var UIView = function(getData, setDataListener) {

	// events: updateAssets, trackSpending, setOption, 
	//		   addEntry, changeEntry, removeEntry
	var callbacks = {};

	this.registerCallback = function(event, callback) {
		callbacks[event] = callbacks[event] || [];
		callbacks[event].push(callback);
	};

	function notifyListeners(event, args) {
		var callbackArr = callbacks[event] || [];
		for(var i = 0; i < callbackArr.length; i++) {
			callbackArr[i].apply(window, args);
		}
	}
	
	setDataListener('ready', function() {
		//if PERSIST_DATA in utility.js is set to false temp data will be set here
		if(!PERSIST_DATA) {
			setTempData();
		}

		$("#budget").html("$" + getData("budget"));
		$("#prevAssets").html("$" + getData("assets"));
		
		var arr = getData("savings");
		arr.forEach(function(ctx) {
			//Todo: replace with makeTemplate based on object
			appendSavingsList(ctx);
		});
		
		var arr = getData("options");
		//TODO: replace with saved options
		$("#trackTime").datebox('disable');
		$("#budgetTime").datebox('disable');

		var arr = getData("charges");
		arr.forEach(function(ctx) {
			$("#chargesList").append('<div><li id =ch"'+ ctx.name + '"><h3>' + "ch" + ctx.name + '</h3><h3 id="prevCh' + ctx.name + '">$' + ctx.amount +'</h3><input id="chargeInput' + ctx.name + '" data-controller="input-value" type="number" min = "0"><button class="ui-btn ui-btn-inline" id="buttonCh' + ctx.name + '">Update</button><p id="charge' + ctx.name +'"></p></li></div>');
			
			$("#chargesList #buttonCh" + ctx.name).click(function() { changeChargeEntry(ctx.name, ctx.isDefault); });
		});
	});
	
	//append to savings entry list
	function appendSavingsList(ctx) {
		$("#savingsList").append('<div><li id ="'+ ctx.name + '"><h3>' + ctx.name + '</h3><h3 id="prev' + ctx.name + '">$' + ctx.amount +'</h3><input id="text' + ctx.name + '" data-controller="input-value" type="number" min = "0"><button class="ui-btn ui-btn-inline" id="button' + ctx.name + '" >Update</button><p id="save' + ctx.name +'"></p></li></div>');
			
		$("#button" + ctx.name).click(function() { changeSavingEntry(ctx.name, ctx.isDefault); });
	}
	
	//-----------------LISTENERS----------------------
	// update budget when budget changes
	setDataListener("budget", function() {
		$("#budget").html("$" + getData("budget"));
	});
	
	setDataListener("assets", function() {
		$("#prevAssets").html("$" + getData("assets"));
	});
	
	// setup savings and update when there are changes
	// warning: currently dependant on SavingsEntry internals
	setDataListener("savings", function() {
		var arr = getData("savings");
		arr.forEach(function(ctx) {
			$("#prev" + ctx.name).html("$" + ctx.amount);
		});
	});

	setDataListener("charges", function() {
		var arr = getData("charges");
		arr.forEach(function(ctx) {
			$("#prevCh" + ctx.name).html("$" + ctx.amount);
		});
	});
	
	setDataListener("options", function() {
		var value = getData("options");
		
		$("#minBudget").html("$" + value.minDailyBudget);
	});
	
	//make new element
	function makeTemplate(catName, val, updateFn, listId, isRecurring) {
		var uuid = guid();
		var li = document.createElement('li');
		li.id = uuid;
		var h3 = document.createElement('h3');
		h3.innerHTML = catName;
		var h32 = document.createElement('h2');
		h32.innerHTML = "$" + val;
		var input = document.createElement('input');
		input.class = "updateVal";
		input.type="number";
		var p = document.createElement('p');

		var button = document.createElement('button');
		button.classList.add("ui-btn", "ui-btn-inline");
		button.innerHTML = "Update";
		button.onclick = (function() {
			updateFn(uuid, catName);
		}); 

		li.appendChild(h3);
		li.appendChild(h32);
		li.appendChild(input);

		if(isRecurring) {
			var select = document.createElement('select');
			//TODO add options dynamically
			var o1 = document.createElement('option');
			o1.value = "monthly";
			o1.innerHTML = "monthly";
			select.appendChild(o1);
			li.appendChild(select);
		}

		li.appendChild(button);
		li.appendChild(p);
		$(listId).append(li);

		return uuid;
	}
	//add new savings entry - popup with textbox to ask for entry name
	$("#addSavings").click(function() {
		//Todo: generalize this to makeTemplate(params)
		var catName = document.getElementById("catNameDialog").value;

		document.getElementById("catNameDialog").value = "";

		if(catName == null || catName == "") {
			return;
		}

		var uuid = makeTemplate(catName, 0, updateSavingsEntry, "#savingsList", false);

		//generalize this? SavingsEntry
		//add element to "savings" array
		var save = new SavingsEntry(catName, 0, true);
		notifyListeners("addEntry", ["savings",
			save,
			catName,
			function() {
				document.getElementById(uuid).getElementsByTagName('p')[0].innerHTML = "ADD SAVINGS SUCCESS";
			}, 
			function(message) {
				document.getElementById(uuid).getElementsByTagName('p')[0].innerHTML = "FAILED: " + message;
		}]);
		console.log(getData("savings"));
	});

	function updateSavingsEntry(uuid, catName) {
		var li = document.getElementById(uuid);
		var val = li.getElementsByTagName('input')[0].value;
		li.getElementsByTagName('h2')[0].innerHTML = "$" +  val;
		li.getElementsByTagName('input')[0].value = "";
		
		//What does isDefault do?! Set to false here
		var save = new SavingsEntry(catName, parseInt(val), false);
		notifyListeners("changeEntry", ["savings",
			catName,
			save,
			function() {
			document.getElementById(uuid).getElementsByTagName('p')[0].innerHTML = "CHANGED SAVINGS SUCCESS";
			}, 
			function(message) {
			document.getElementById(uuid).getElementsByTagName('p')[0].innerHTML = "FAILED: " + message;
		}]);
	}

	function updateChargesEntry(uuid, catName) {
		var li = document.getElementById(uuid);
		var val = li.getElementsByTagName('input')[0].value;
		li.getElementsByTagName('h2')[0].innerHTML = "$" +  val;
		li.getElementsByTagName('input')[0].value = "";
		var select = li.getElementsByTagName('select')[0];
		var frequency = select.options[select.selectedIndex].value;
		
		//What does isDefault do?! Set to false here
		var save = new ChargeEntry(catName, val, frequency, 5, false);
		notifyListeners("changeEntry", ["charges",
			catName,
			save,
			function() {
			document.getElementById(uuid).getElementsByTagName('p')[0].innerHTML = "CHANGED CHARGES SUCCESS";
			}, 
			function(message) {
			document.getElementById(uuid).getElementsByTagName('p')[0].innerHTML = "FAILED: " + message;
		}]);
	}

        
	$("#addCharge").click(function() {
		var catName = document.getElementById("catNameDialog").value;
		document.getElementById("catNameDialog").value = "";
		console.log(catName);
		if(catName == null || catName == "") {
			return;
		}

		var uuid = makeTemplate(catName, 0, updateChargesEntry, "#chargesList", true);

		//generalize this? SavingsEntry
		//add element to "savings" array
		var save = new ChargeEntry(catName, 0, 'monthly', 5, true);
		notifyListeners("addEntry", ["charges",
			save,
			catName,
			function() {
				document.getElementById(uuid).getElementsByTagName('p')[0].innerHTML = "ADD CHARGE SUCCESS";
			}, 
			function(message) {
				document.getElementById(uuid).getElementsByTagName('p')[0].innerHTML = "FAILED: " + message;
		}]);
		console.log(getData("charges"));
	});
	
	//update assets
	$("#buttonAssets").click(function() {
		notifyListeners("updateAssets", [parseInt($("#setAssets").val()), function() {
			document.querySelector('#assetsSuccess');
            assetsSuccess.textContent = 'CHANGED ASSETS SUCCESS';
            assetsSuccess.classList.remove("animatePopupMessage");
            assetsSuccess.classList.add("animatePopupMessage");
		}, function(message) {
			document.querySelector('#assetsSuccess');
            assetsSuccess.textContent = 'FAILED: ' + message;
            assetsSuccess.classList.remove("animatePopupMessage");
            assetsSuccess.classList.add("animatePopupMessage");
		}]);
	});
	
	$("#buttonMinDaily").click(function() {
		notifyListeners("setOption", ["minDailyBudget", parseInt($("#setMinBudget").val()), function() {
			//success
		}, function(message) {
			//failure
		}]);
	});
	
	//attached to buttons defined in .ready()
	function changeSavingEntry(name, isDefault) {
		var save = new SavingsEntry(name, parseInt($("#text" + name).val()), isDefault);
		notifyListeners("changeEntry", ["savings", name, save, function() {
			$("#save" + name).html("CHANGED SAVINGS SUCCESS");
		}, function(message) {
			$("#save" + name).html("FAILED: " + message);
		}]);
	}

	function changeChargeEntry(name, isDefault) {
		var save = new ChargeEntry(name, parseInt($("#chargeInput" + name).val()), 1, new Date().toLocaleString(), isDefault);
		notifyListeners("changeEntry", ["charges", name, save, function() {
			$("#charge" + name).html("CHANGED CHARGES SUCCESS");
		}, function(message) {
			$("#charge" + name).html("FAILED: " + message);
		}]);
	}
	
	$("#habitTrack").change(function() {
		var label = $("#habitTrack").prop("checked") ? "On" : "Off";
		//selection not yet defined in UIController
		//TODO: Rewrite when defined
		notifyListeners("options", ["budgetNotify", label, function() {
			//success
		}, function(message) {
			//failure
		}]);
	});
	
	$("#assetNotice").change(function() {
		var label = $("#assetNotice").prop("checked") ? "On" : "Off";
		//selection not yet defined in UIController
		//TODO: Rewrite when defined
		notifyListeners("options", ["assetNotice", label, function() {
			//success
		}, function(message) {
			//failure
		}]);
	});
	
	$("#nightNotice").change(function() {
		var label = $("#nightNotice").prop("checked") ? "On" : "Off";
		if(label == 'On') {
			$("#trackTime").datebox('enable');
		} else {
			$("#trackTime").datebox('disable');
		}
		
		//selection not yet defined in UIController
		//TODO: Rewrite when defined
		notifyListeners("options", ["nightNotice", label, function() {
			//success
		}, function(message) {
			//failure
		}]);
	});
	
	$("#morningNotice").change(function() {
		var label = $("#morningNotice").prop("checked") ? "On" : "Off";
		if(label == 'On') {
			$("#budgetTime").datebox('enable');
		} else {
			$("#budgetTime").datebox('disable');
		}
		
		//selection not yet defined in UIController
		//TODO: Rewrite when defined
		notifyListeners("options", ["morningNotice", label, function() {
			//success
		}, function(message) {
			//failure
		}]);
	});
	
	//----------------------------------------------//
	// This is just an animation for popup callback, 
    // Not part of popup functionality.
    $("#popupMessageTarget").on("webkitAnimationEnd", function() {
		this.className = "";
		this.textContent = "";
    });
	
	$("#assetsSuccess").on("webkitAnimationEnd", function() {
		this.className = "";
		this.textContent = "";
    });
	//----------------------------------------------//

	//generates random uuid for html elements
	function guid() {
	  function s4() {
	    return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	  }
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	    s4() + '-' + s4() + s4() + s4();
	}
};