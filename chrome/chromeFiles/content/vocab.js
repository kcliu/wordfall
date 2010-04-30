var vocab = function ( ) {
	var DBConn;
	return {
		onCommand: function () {
			var selection = document.commandDispatcher.focusedWindow.getSelection().toString();
			var stmt;
			alert(selection);		
			alert(this);		
			this.createDB();
			//todo "!query"
	//		if () {
				this.insertDB(selection);
	//		} else {
				//todo "update"
	//		}
			
		},
		insertDB: function (word) {
			var statement = DBConn.createStatement("INSERT INTO 'vocab' VALUES(?1,1);");  
			statement.bindStringParameter(0,word);
			//statement.params.row_id = word;  
			statement.executeStep();
		},
		updateDB: function() {
		
		},
		removeDB: function() {

		},
		createDB: function() {
			var file = Components.classes["@mozilla.org/file/directory_service;1"]  
					   .getService(Components.interfaces.nsIProperties)  
					   .get("ProfD", Components.interfaces.nsIFile);  
			file.append("vocab.sqlite");  
			var storageService = Components.classes["@mozilla.org/storage/service;1"]  
								 .getService(Components.interfaces.mozIStorageService);  
			if ( !file.exists() ) {
				DBConn = storageService.openDatabase(file); // Will also create the file if it does not exist  
				DBConn.executeSimpleSQL("CREATE TABLE vocab (words TEXT,count INTEGER);"); 
			} else {
				DBConn = storageService.openDatabase(file); // Will also create the file if it does not exist  
			}
		},
		checkDB: function() { 
		}
	}
}();  //kcliu study:: (); means return an object literal

