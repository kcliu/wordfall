var vocab = function ( ) {
	var DBConn;
	var selection;
	var query;
	return {
		onCommand: function () {
			var match;
			var getbar;
			selection = document.commandDispatcher.focusedWindow.getSelection().toString();
			selection = this.refreshInformation();
		
			getbar = document.getElementById('vocabStatusBar');
			getbar.setAttribute("label",selection);
			//dump("onCommand:"+selection+"\n");
			this.createDB();
			match = this.checkExist();
			if ( match === undefined ) {  //new word
				//dump("    -insert new word\n");
				this.insertDB();
			} else {
				this.updateDB(match);     //count++
			}
		},
        showResult: function () {
			var newpara;
			var item_word;
			//dump("showResult\n");
			this.createDB();
			this.queryDB();
			//this.test();
			rankT = document.getElementById('rankingTable');
			for (var i=rankT.childNodes.length - 1; i >= 0; i--) {  //remove previous nodes
        		rankT.removeChild(rankT.childNodes.item(i));
   		    }

			for ( i = 0; i < 5 ; i++ ) {
				newpara = document.createElement('menuitem');
				newpara.setAttribute("label",query[i]);
				//newpara.setAttribute("type","checkbox");
				item_word = "vocab.removeDB(\""+query[i]+"\");";
				newpara.setAttribute("oncommand",item_word);
				rankT.appendChild(newpara);
			}
	    },
		queryDB: function () { //XXX: should modified to argument the SQL
			var DBstmt;
			//dump("queryDB:\n    -");
			query = new Array();   //寫法可以討論
			//DBstmt = DBConn.createStatement("SELECT words FROM vocab WHERE counts = (select max(counts) from vocab)");
			DBstmt = DBConn.createStatement("SELECT words FROM ( SELECT * FROM vocab ORDER BY counts desc LIMIT 5)");
			while ( DBstmt.executeStep() ) {
				query.push( DBstmt.row.words );
			}
			//for (var i=0;i<5;i++)
			//	dump(query[i]+",");
			//dump("\n");
			//return query;
			DBstmt.reset();
		},

		checkExist: function () {
			var DBstmt;
			var query;
			//dump("checkExist:"+selection+"\n");
			DBstmt = DBConn.createStatement("SELECT counts from vocab where words=:word");
			DBstmt.params.word = selection;  
			while ( DBstmt.executeStep() ) {
				query = DBstmt.row.counts;
			}
			//dump("    -match_word="+query+"\n");
			return query;
		},
		insertDB: function () {
			var DBstmt;
			//dump("insertDB:"+selection+"\n");
			//DBstmt = DBConn.createStatement("INSERT INTO 'vocab' VALUES(?1,1);");  
			//DBstmt.bindStringParameter(0,selection);
			if( selection !== undefined ){
				DBstmt = DBConn.createStatement("INSERT INTO 'vocab' VALUES(:word,1)");  
				DBstmt.params.word = selection;  
				DBstmt.executeStep();
				//dump(    -"DBstmt="+DBstmt+"\n");
			} else {
				//dump("   -null string");
			}
		},
		updateDB: function(value) {
			var DBstmt;
			value++;
			DBstmt = DBConn.createStatement("UPDATE vocab SET counts =:count WHERE words=:word");
			DBstmt.params.word = selection;  
			DBstmt.params.count = value;  
			DBstmt.executeStep();
		},
		removeDB: function(word) {
			var DBstmt;
			//dump("entering removeDB\n");
			DBstmt = DBConn.createStatement("DELETE FROM vocab WHERE words=:word");
			DBstmt.params.word = word;  
			DBstmt.executeStep();
		},
		createDB: function() {
			//dump("entering createDB()\n");
			var file = Components.classes["@mozilla.org/file/directory_service;1"]  
					   .getService(Components.interfaces.nsIProperties)  
					   .get("ProfD", Components.interfaces.nsIFile);  
			file.append("vocab.sqlite");  
			var storageService = Components.classes["@mozilla.org/storage/service;1"]  
								 .getService(Components.interfaces.mozIStorageService);  
			if ( !file.exists() ) {
				DBConn = storageService.openDatabase(file); // Will also create the file if it does not exist  
				DBConn.createTable("vocab", "words TEXT,counts INTEGER"); 
				//dump("    createTable:vocab\n");
			} else {
				DBConn = storageService.openDatabase(file); // Will also create the file if it does not exist  
			}
		},
		refreshInformation: function() {
     		var httpRequest = null;
     		var fullUrl = "http://www.google.com/dictionary?aq=f&langpair=en|en&q=_WORD_&hl=en";
			fullUrl = fullUrl.replace("_WORD_",selection);

     		httpRequest = new XMLHttpRequest();
     		httpRequest.open("GET", fullUrl, false);
     		httpRequest.send("");
	     	var output = httpRequest.responseText;
			output = output.match(/meta name="description" content="(\w+)/);
			//dump("refreshInformation:get word from google:"+RegExp.$1+"\n");
			return RegExp.$1;
  		},
		test: function() {
		    var httpRequest = null;
			var fullUrl = "http://www.google.com.tw/dictionary/wordlist";
			httpRequest = new XMLHttpRequest();
     		httpRequest.open("GET", fullUrl, false);
     		httpRequest.send("");
	     	var output = httpRequest.responseText;
			dump("request output:\n");
			dump(output);
			dump("\n");
		}

	}
}();  //kcliu study:: (); means return an object literal

