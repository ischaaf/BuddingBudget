function LoginUI(login, createUser, logout, getLoggedInUser, switchPage) {
	
	var loggedUser = getLoggedInUser();
	if(loggedUser.username) {
		//already logged in
		$("#titleText").notify("Logged in as " + loggedUser.username, {position:"bottom center", className:"success", autoHideDelay:1500, arrowShow:false});
		$("#user").html(loggedUser.name);
		$("#logout").show();
		$("#page-login-button").css('visibility','hidden');	
	} else {
		$("#logout").css('visibility','hidden');
		$("#user").html("Not logged in");	
		$("#page-login-button").show();	
	}

	$("#logout").click(function() {
		logout();
		$("#logout").css('visibility','hidden');
		$("#user").html("Not logged in");	
		$("#page-login-button").show();
		switchPage("page-login");
		$("#menuBar").click();
		$("#titleText").notify("Successfully logged out.", {position:"bottom center", className:"success", autoHideDelay:1500, arrowShow:false});
	});

	$("#login").click(function() {
		var un = $("#username").val();
		var pw = $("#password").val();

		login(un, pw, function() {
			$("#titleText").notify("Successfully logged in.", {position:"bottom center", className:"success", autoHideDelay:1500, arrowShow:false});
			document.getElementById("username").value = "";
			document.getElementById("password").value = "";

			$("#page-login-button").css('visibility','hidden');
			$("#logout").css('visibility','visible');
			var u = getLoggedInUser();
			$("#user").html(u.name);

			switchPage("page-main");
			$("#page-login-tutorial").html("NEXT");
	    }, function(response) {
			var json = response.responseJSON;
			if(response.status == 422 || response.status == 401 || response.status == 500) {
				$("#titleText").notify(json.message, {position:"bottom center", autoHideDelay:1500, arrowShow:false});
			} else {
				$("#titleText").notify("ERROR", {position:"bottom center", autoHideDelay:1500, arrowShow:false});
			}
		});

	});

	$("#addUser").click(function() {
		var name = $("#newName").val();
		if(name.length < 2) {
			$("#titleText").notify("Invalid name (too short)", {position:"bottom center", autoHideDelay:1500, arrowShow:false});
			return;
		} else if(name.length > 20) {
			$("#titleText").notify("Invalid name (too long)", {position:"bottom center", autoHideDelay:1500, arrowShow:false});
			return;
		}

		var un = $("#newUsername").val();
		if(un.length < 5) {
			$("#titleText").notify("Invalid username (too short)", {position:"bottom center", autoHideDelay:1500, arrowShow:false});
			return;
		} else if(un.length > 20) {
			$("#titleText").notify("Invalid username (too long)", {position:"bottom center", autoHideDelay:1500, arrowShow:false});
			return;
		}

		var pw = $("#newPassword").val();
		if(pw.length < 5) {
			$("#titleText").notify("Invalid password (too short)", {position:"bottom center", autoHideDelay:1500, arrowShow:false});
			return;
		} else if(pw.length > 20) {
			$("#titleText").notify("Invalid password (too long)", {position:"bottom center", autoHideDelay:1500, arrowShow:false});
			return;
		}

		var pwv = $("#newPasswordVerify").val();

		if(pw == pwv) {
			createUser(un, pw, name, 
			function() {
				$("#titleText").notify("CREATE USER SUCCESS", {position:"bottom center", className:"success", autoHideDelay:1500, arrowShow:false});
				$("#newName").val("");
				$("#newUsername").val("");
				$("#newPassword").val("");
				$("#newPasswordVerify").val("");
				$("#page-login-button").css('visibility','hidden');
				$("#logout").show();
				var u = getLoggedInUser();
				$("#user").html(u.name);
				$("#user").show();
			}, function(response) {
				console.log(response);
				var json = response.responseJSON;
				for(var property in json) {
					if(response.status == 422 || response.status == 401) {
						$("#titleText").notify("Invalid " + property, {position:"bottom center", autoHideDelay:1500, arrowShow:false});
					} else if(response.status == 500) {
						$("#titleText").notify("Username taken", {position:"bottom center", autoHideDelay:1500, arrowShow:false});
					} else {
						$("#titleText").notify("ERROR", {position:"bottom center", autoHideDelay:1500, arrowShow:false});
					}
					break;
				}
			}); 
		} else {
			$("#titleText").notify("Passwords do not match.", {position:"bottom center", autoHideDelay:1500, arrowShow:false});
		}

		$("#page-login-tutorial").html("NEXT");
	});

	//focus on password on enter
	$("#username").keyup(function(event) {
		if(event.keyCode == 13) {
			$("#password").focus();
		}
	});

	//login on enter
	$("#password").keyup(function(event) {
		if(event.keyCode == 13) {
			$("#login").click();
		}
	});

	//focus on new username on enter
	$("#newName").keyup(function(event) {
		if(event.keyCode == 13) {
			$("#newUsername").focus();
		}
	});

	//focus on new password on enter
	$("#newUsername").keyup(function(event) {
		if(event.keyCode == 13) {
			$("#newPassword").focus();
		}
	});

	//focus on verify password on enter
	$("#newPassword").keyup(function(event) {
		if(event.keyCode == 13) {
			$("#newPasswordVerify").focus();
		}
	});

	//login on enter
	$("#newPasswordVerify").keyup(function(event) {
		if(event.keyCode == 13) {
			$("#addUser").click();
		}
	});

}