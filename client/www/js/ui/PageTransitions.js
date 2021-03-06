//----------------------------------------------//
// Handles page transitions
//----------------------------------------------//

var PageTransitions = function() {

	var self = this;

	// A mapping of each page to the user-facing
	// name of the page
	var pages = {
		"page-main" : "Daily Budget",
		"page-assets" : "Assets",
		"page-savings" : "Savings",
		"page-charges" : "Recurring Charges",
		"page-income" : "Recurring Income",
		"page-tracking" : "Track Spending",
		"page-options" : "Options",
		"page-tutorial" : "Tutorial",
		"page-login" :"Login"
	};

	// The page currently being displayed
	var activePage;

	this.switchPage = function(pageID, callback) {

		var switchToPage = function() {
			activePage = pageID;
			$("#titleText").text(pages[pageID]);
			$("#" + pageID).fadeIn("fast");
			callFunc(callback);
		};

		if(activePage) {
			if(activePage !== pageID) {
				$("#" + activePage).fadeOut("fast", switchToPage);
			}
		} else {
			switchToPage();
		}

	};

	// Set the onclick for a pageID's button to fade to
	// the given page.
	function setUpPageSwitch(pageID) {
		//var pageIDs = Object.keys(pages);
		$("#" + pageID + "-button").click(function() {
			self.switchPage(pageID, null);
		});
	}

	// Set up page switches, and set starting page
	// to the main budget page
    function initialSetup() {
    	var pageIDs = Object.keys(pages);
    	for(var i = 0; i < pageIDs.length; i++) {
    		setUpPageSwitch(pageIDs[i]);
    		$("#" + pageIDs[i]).hide();
    	}
    	// $("#page-main").show();
    	// $("#titleText").text(pages["page-main"]);
    	// activePage = "page-main";
    }
	
	initialSetup();
	
};