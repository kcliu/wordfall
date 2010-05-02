var vocab = function ( ) {
	var DBConn;
	var selection;
	return {
		onCommand: function () {
			var match;
			selection = document.commandDispatcher.focusedWindow.getSelection().toString();
			alert(selection);		
			this.createDB();
			match = this.checkExist();
			alert(match);
			if ( match === undefined ) {  //new word
				this.insertDB();
			} else {
				this.updateDB(match);     //count++
			}
			
		},
		checkExist: function () {
			var DBstmt;
			var query;
			DBstmt = DBConn.createStatement("SELECT counts from vocab where words=:word");
			DBstmt.params.word = selection;  
			while ( DBstmt.executeStep() ) {
				query = DBstmt.row.counts;
			}
			return query;
		},
		insertDB: function () {
			var DBstmt;
			//DBstmt = DBConn.createStatement("INSERT INTO 'vocab' VALUES(?1,1);");  
			//DBstmt.bindStringParameter(0,selection);
			DBstmt = DBConn.createStatement("INSERT INTO 'vocab' VALUES(:word,1);");  
			DBstmt.params.word = selection;  
			DBstmt.executeStep();
		},
		updateDB: function(value) {
			var DBstmt;
			value++;
			DBstmt = DBConn.createStatement("UPDATE vocab SET counts =:count WHERE words=:word;");
			DBstmt.params.word = selection;  
			DBstmt.params.count = value;  
			DBstmt.executeStep();
		},
		removeDB: function() {
			var DBstmt;
			DBstmt = DBConn.createStatement("DELETE FROM vocab WHERE words=:word");
			DBstmt.params.word = selection;  
			DBstmt.executeStep();
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
				DBConn.createTable("vocab", "words TEXT,counts INTEGER"); 
			} else {
				DBConn = storageService.openDatabase(file); // Will also create the file if it does not exist  
			}
		},
	}
}();  //kcliu study:: (); means return an object literal

