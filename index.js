//special thanks to stancheta (https://github.com/stancheta), from whom I got how to use Google API search and format it's data

var express = require("express");
var app = express();
var request = require('request')
var PORT = process.env.PORT || 3000;
var gse = process.env.GSE || '006956163551300822724:7tlwdzcxawu';
var gKey = process.env.GKEY || 'AIzaSyB0SkmAu0lHGno1YQOp2oitG0h-bmGmZ84';
var baseRequestURL = 'https://www.googleapis.com/customsearch/v1?';
var mongoClient = require("mongodb").MongoClient;
var mongoUrl = "mongodb://anyone:1111@ds059471.mlab.com:59471/latestqueries";
var dateFormat = require('dateformat');

function formatJSON(data) {
	var response = [];
	for (var i = 0; i < data.items.length; i++) {
		response.push('<p>');
		response.push({
			url: data.items[i].link +'</br>',
			snippet: data.items[i].snippet + '</br>',
			thumbnail: data.items[i].image.thumbnailLink+ '</br>',
			context: data.items[i].image.contextLink});
		response.push('</p>');
				}
	return response;
}


/*app.get("/restart", function(req, res){
	mongoClient.connect(mongoUrl, function(err, db){
		if(err) return res.status(400).send();
		db.collection("latestqueries").drop(function(err,result){
			res.send("everything's deleted");
			db.close();  
		});
	});
});*/


app.get("/", function(req, res){
	res.send(
		"to see history, add to the url '/latest';"+'</br>'+
		"to limit history list, add number after '/latest', e.g. /latest/2 will show 2 latest queries"+ '</br>'+
		"to search, add to the url /imagesearch/ plus search term, e.g. /imagesearch/puppies will search for puppies images"+'<br/>'+
		"in search url, change offset in the url if you want to see results from other pages"
	)
});


app.get("/imagesearch/:term", function(reg, res){
    var count = 10;
  	var offset = reg.query.offset||0;
  	offset++;
  	var requestPath = baseRequestURL + 'q=' + reg.params.term + '&cx=' + gse + '&num=' + count + '&searchType=image&start=' + offset + '&key=' + gKey;
   	request(requestPath, function(err,resp,body){
   		if(err) return res.status(400).send();
		mongoClient.connect(mongoUrl, function(err, db){
		if(err) return res.status(400).send();				
			db.collection("latestqueries").insertOne({query: String(reg.params.term), date: dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT")}, function(err, results){
				if(err) return res.status(400).send();
				db.close();
				res.send(JSON.stringify(formatJSON(JSON.parse(body))));
			})
		})   			
   	})     
});


app.get("/latest/?*", function(request, response){
	var limitNumber = Number(request.params[0])||10;
    mongoClient.connect(mongoUrl, function(err, db){
      	if(err) return res.status(400).send();
	    db.collection("latestqueries").find({}, {_id:0, query:1,date:1}).sort({date: -1}).limit(limitNumber).toArray(function(err,users){
		response.send(users);
		db.close();
		});
    })
});


app.listen(PORT, function() {
  console.log('listening on port', PORT);
});