const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', ws => {
  ws.on('message', msg => {
    // 모든 클라이언트에게 메시지 중계
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });
});

console.log('Signaling server running on ws://localhost:3000'); 