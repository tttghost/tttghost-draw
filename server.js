const WebSocket = require('ws');
const http = require('http');
const port = process.env.PORT || 3000;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', ws => {
  if (clients.length >= 2) {
    ws.send(JSON.stringify({ type: 'full' }));
    ws.close();
    return;
  }
  clients.push(ws);

  ws.on('message', msg => {
    // 상대방에게만 메시지 전달
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
  });
});

server.listen(port, () => {
  console.log(`Signaling server running on port ${port}`);
}); 
