// At some point, we could make this just a function within
// DataManager, but I wanted to keep it separate for now
// so we definitely wouldn't have any merge conflicts if
// both get changed.
var Calculator = function() {

	var self = this;

	// Calculates and returns the budget for today based upon the
	// passed in data.
	this.calculateBudget = function(data) {
		var entry = data.trackedEntry;
		var assetAdjust = -data.rollover;
		if(entry && !$.isEmptyObject(entry)) {
			assetAdjust += entry.amount;
		}
		return calculate(data, new Date(), assetAdjust, data.rollover, false);
	};

	// Calculates and returns the budget for tomorrow based upon
	// the passed in data
	this.calculateTomorrowBudget = function(data) {
		var entry = data.trackedEntry;
		var assetAdjust = -data.tomorrowRollover;
		if(!entry || $.isEmptyObject(entry)) {
			assetAdjust -= data.budget;
		}
		var tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return calculate(data, tomorrow, assetAdjust, data.tomorrowRollover, true);
	};

	// Calculates a budget based upon the passed in data
	// Assumes that the current day is whatever is contained in "now"
	// Adjusts the assets by assetAdjust before calculating, and the calculated
	// budget by budgetAdjust after the calculation.
	// If considerTodayRecurring is true, considers recurring charges that go through today.
	// This must be false if we're calculating today's budget, since assets will already be modified with the
	// charges / income, and must be true otherwise.
	function calculate(data, now, assetAdjust, budgetAdjust, considerTodayRecurring) {
		// calculate budget by basically dividing the assets by the amount of days left and return that value.
		// Because of possible interleving incomes and charges, the algorithm has to be more sophisticated.

		// make sure dates are have no information about the hour, minute, seconds and milliseconds 
		// var now = new Date();
		var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		var endDate = new Date(data.endDate);
		endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
		if(!isTodayOrLater(endDate)) {
			return 0;
		}

		// calculate the available assets
		var sumOfSavings = 0;
		for(var i = 0; i < data.savings.length; i++) {
			sumOfSavings += data.savings[i].amount;
		}
		var availableAssets = data.assets - sumOfSavings + assetAdjust;

		// calculate all changes that occur due to income and charges and save them in "changes" with the date as the key.
		var changes = {};
		var nextTime;
		var currentDay = new Date(today);
		changes[currentDay.getTime()] = availableAssets;
		for(i = 0; i < data.income.length; i++) {
			currentDay = new Date(today);
			if(considerTodayRecurring) {
				currentDay.setDate(currentDay.getDate() - 1);
			}
			while(findNextTime(data.income[i], currentDay) <= endDate.getTime()) {
				nextTime = findNextTime(data.income[i], currentDay);
				var amountUsable = data.income[i].amount - data.income[i].holdout;
				if(changes[nextTime]) {
					changes[nextTime] += amountUsable;
				} else {
					changes[nextTime] = amountUsable;
				}
				currentDay = new Date(nextTime);
			}
		}
		for(i = 0; i < data.charges.length; i++) {
			currentDay = new Date(today);
			if(considerTodayRecurring) {
				currentDay.setDate(currentDay.getDate() - 1);
			}
			while(findNextTime(data.charges[i], currentDay) <= endDate.getTime()) {
				nextTime = findNextTime(data.charges[i], currentDay);
				if(changes[nextTime]) {
					changes[nextTime] -= data.charges[i].amount;
				} else {
					changes[nextTime] = -data.charges[i].amount;
				}
				currentDay = new Date(nextTime);
			}
		}
		// sort date keys in changes - decreasing
		var dates = [];
		for(var date in changes) {
			dates.push(date);
		}
		dates.sort().reverse();

		// compensate negative income days with earlier positive income to get rid of them
		var compensationAmount = 0;
		for(i = 0; i < dates.length; i++) {
			changes[dates[i]] += compensationAmount;
			compensationAmount = 0;
			if(changes[dates[i]] <= 0) {
				compensationAmount += changes[dates[i]];
				delete changes[dates[i]];
			}
		}

		// sort date keys in changes again after deleting entries, this time increasing
		dates = [];
		for(var dateKey in changes) {
			dates.push(dateKey);
		}
		dates.sort();

		return maxAmountToSpend(changes, endDate) + budgetAdjust;

		// calculates the maximum amount one can spend on the first day to still be able
		// to get to endDate optimally
		function maxAmountToSpend(changes, endDate) {
			// We assume we would have all the income on our begin date and sum up all the incomes.
			var amountAvailable = 0;
			for(var i = 0; i < dates.length; i++) {
				if(dates[i] > endDate.getTime()) {
					break;
				}
				amountAvailable += changes[dates[i]];
			}

			// Check how long one can use the daily amount until one runs out of money. If that is the end date
			// output the daily amount. Else try again with not all the incomes available, but only the ones 
			// until the point we previously had no more money left.
			var differenceMilliseconds = endDate - today;
			var differenceDays = Math.round(differenceMilliseconds / MILLISECONDS_PER_DAY) + 1;
			var dailyAmount = amountAvailable / differenceDays;
			var lastDatePossible = getLastDayPossible(dailyAmount);
			if(isNaN(lastDatePossible.getTime())) {
				console.log("ERROR: last date NaN");
				return 0;
			}
			if(lastDatePossible >= endDate) {
				return Math.floor(dailyAmount);
			} else {
				return maxAmountToSpend(changes, lastDatePossible);
			}

			// simulate how long the dailyAmount will last with the assets as well as all the incomes.
			function getLastDayPossible(dailyAmount) {
				var amountAvailable = 0;
				var lastDate = today;
				for(var i = 0; i < dates.length; i++) {
					var differenceMilliseconds = dates[i] - lastDate.getTime();
					var differenceDays = Math.round(differenceMilliseconds / MILLISECONDS_PER_DAY);
					lastDate = new Date(Number(dates[i]));
					amountAvailable -= dailyAmount * differenceDays;
					if(amountAvailable < 0) {
						lastDate.setDate(lastDate.getDate() - 1);
						return lastDate;
					}
					amountAvailable += changes[dates[i]];
				}
				return endDate;
			}
		}
	}

};