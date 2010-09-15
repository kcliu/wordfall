var vocab = function ( ) {
	var DBConn;
	var sentence;
	var selection;
	var origin_selection;
	var selectionObj;
	var query;
	var db_ans;
	return {
		onCommand: function () {
			var match;

			selectionObj = document.commandDispatcher.focusedWindow.getSelection();
			origin_selection = selectionObj.toString();
			String.prototype.trim = function (){return this.replace(/(^\s*)|(\s*$)/g,'');}
			origin_selection = origin_selection.trim(origin_selection);
			sentence = this.getSentence(selectionObj);
			selection = this.checkGoogleDict();
			if ( selection === "" ) {
				return;	
			}
			//alert("selection:"+selection);
			this.showFeedback(selection);
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
			DBstmt = DBConn.createStatement("SELECT words FROM vocab ORDER BY counts desc LIMIT 5");
			while ( DBstmt.executeStep() ) {
				query.push( DBstmt.row.words );
			}
			//for (var i=0;i<5;i++)
			//	dump(query[i]+",");
			//dump("\n");
			//return query;
			DBstmt.reset();
		},
		getSentenceFromDB: function (index) {
			var DBstmt;
			var query_word = new Array();
			var query_sentence = new Array();
			//FIXME : how to choose only one entry from query result?
			this.createDB();
			DBstmt = DBConn.createStatement("SELECT * FROM vocab ORDER BY counts desc LIMIT 20");
			while ( DBstmt.executeStep() ) {
				query_word.push( DBstmt.row.tense );
				query_sentence.push( DBstmt.row.sentences );
			}
			/*for(var i = 0;i < 5;i++) {
				dump("word:"+query_word[i]+"\n");
				dump("sentence:"+query_sentence[i]+"\n");
			}*/
			var result = [query_word[index],query_sentence[index]];
			DBstmt.reset();
			return result;
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
		getQuizByDB: function () {
			var DBstmt;
			var query = [];
			var target;
			var db_quiz;
			//random get an entry from top 20
 			var randomnumber=Math.floor(Math.random()*20);
			query = this.getSentenceFromDB(randomnumber);
			db_quiz = this.makeQuiz(query[0],query[1]);
			this.showSentence(db_quiz);
		},
		insertDB: function () {
			var DBstmt;
			//dump("insertDB:"+selection+"\n");
			//DBstmt = DBConn.createStatement("INSERT INTO 'vocab' VALUES(?1,1);");  
			//DBstmt.bindStringParameter(0,selection);
			if( selection !== undefined ){
				DBstmt = DBConn.createStatement("INSERT INTO 'vocab' VALUES(:word,:tense,1,:quiz)");  
				DBstmt.params.word = selection;  
				DBstmt.params.tense = origin_selection;  
				DBstmt.params.quiz = sentence;  
				DBstmt.executeStep();
				//dump(    -"DBstmt="+DBstmt+"\n");
			} else {
				//dump("   -null string");
			}
		},
		updateDB: function(value) {
			var DBstmt;
			//dump("updateDB\n");
			value++;
			//dump("word count="+value+"\n");
			DBstmt = DBConn.createStatement("UPDATE vocab SET counts =:count WHERE words=:word");
			DBstmt.params.word = selection;  
			DBstmt.params.count = value;  
			DBstmt.executeStep();
			DBstmt = DBConn.createStatement("UPDATE vocab SET sentences =:quiz WHERE words=:word");
			DBstmt.params.quiz = sentence;  
			DBstmt.params.word = selection;  
			DBstmt.executeStep();
			DBstmt = DBConn.createStatement("UPDATE vocab SET tense =:tense WHERE words=:word");
			DBstmt.params.tense = origin_selection;  
			DBstmt.params.word = selection;  
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
				DBConn.createTable("vocab", "words TEXT,tense TEXT,counts INTEGER, sentences TEXT"); 
				//dump("    createTable:vocab\n");
			} else {
				DBConn = storageService.openDatabase(file); // Will also create the file if it does not exist  
			}
		},
		checkGoogleDict: function() {
     		var httpRequest = null;
     		var fullUrl = "http://www.google.com/dictionary?aq=f&langpair=en|en&q=_WORD_&hl=en";
			fullUrl = fullUrl.replace("_WORD_",origin_selection);
			//alert("fullUrl:"+fullUrl);
     		httpRequest = new XMLHttpRequest();
     		httpRequest.open("GET", fullUrl, false);
     		httpRequest.send("");
	     	var output = httpRequest.responseText;
		    //dump(output);
			output = output.match(/meta name="description" content="(.*?):/);
			output = RegExp.$1;
			output = output.replace(/·/g,"");
			dump("get word from google:"+output+"\n");
			return output;
  		},
		showFeedback: function(word) {
			var getbar;
            getbar = document.getElementById('vocabStatusBar');
			getbar.setAttribute("label",word);
		},
		showSentence: function(db_quiz) {
			var quiz;
			//get quiz from DB
			
			quiz = document.getElementById('quiz');
			quiz.setAttribute("value",db_quiz);
		},
		getSentence: function(select) {
			var tip = select.focusNode.parentNode;
			var children = tip.childNodes;
			var offset = 0;
			for (var i = 0; i < children.length ; i++) {
				if (children[i] == select.focusNode) {
					break;
				} else {
					 dump("textContent length:"+children[i].textContent.length);
					 offset += children[i].textContent.length;
				}
			}
			offset += select.focusOffset;	
			//dump(select.focusNode.textContent);
			//dump("focusoffset:"+select.focusOffset+"\n");
	        return this.parse(tip.textContent, offset);
		},
		parse: function (paragraph, offset) {
			var s;
			var start = 0;
			var end = paragraph.length;
			function getStart(ch, ret, StartOffset) {
				StartOffset--;
				s = paragraph.lastIndexOf(ch, StartOffset);
				if (!ret) s += ch.length;
//			if (!ret) alert(ch+"true1");
//			if (s >= ch.length) alert(ch+"true2");
//			if (paragraph.charAt(s) !== " ") {
//				alert(ch+"true3");
//			} else {
//				alert(paragraph.charAt(s));
//			}
				//while(!ret && s >= ch.length && paragraph.charAt(s) !== " "){
				//	s = paragraph.lastIndexOf(ch, s-ch.length-1) + ch.length;
				//}
				if (s > start) {
					start = s;
				}
			}
			function getEnd(ch, ret, EndOffset){
				EndOffset--;
				s = paragraph.indexOf(ch, EndOffset);
				if (!ret) s += ch.length;
				//while(!ret && s < paragraph.length && s >= ch.length && paragraph.charAt(s) != " "){
				//	s = paragraph.indexOf(ch, s+1) + ch.length;
				//}
				if (s < end && s >= ch.length) {
					end = s;
				}
			}
			getStart(".",false, offset);
			getStart("?",false, offset);
			getStart("!",false, offset);
			getStart("\n", true, offset);
			getEnd(".",false, offset);
			getEnd("?",false, offset);
			getEnd("!",false, offset);
			getEnd("\n", true, offset);
			//dump("\nstart="+start+"\nend=" +end+"\n"); //get the sentence
			//dump(paragraph.substring(start,end));
			return paragraph.substring(start, end);
		},
		makeQuiz: function(word, db_quiz){
			//alert(word.length+"\n");
			var start = word[0];
			for(var i = 0; i < (word.length - 1) ; i++ ){
				start += '_ ';
			}
			db_quiz = db_quiz.replace(word, start);
			db_ans = word;
			return db_quiz;
		},
		checkQuiz: function(){
			var answer = document.getElementById('quiz-text').value;
			if ( answer === db_ans ) {
				alert("correct !!  go to next one!!");
	    		this.getQuizByDB();
	     	    document.getElementById('quiz-text').value = '';
			} else {
			    alert("wrong, ans="+db_ans);
			}
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

