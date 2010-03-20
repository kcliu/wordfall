vocab = {
    onCommand: function (event) {
		var selection = document.commandDispatcher.focusedWindow.getSelection().toString();
		alert(selection);		
		//creatDB();
		//insert(selection);
	}
};

