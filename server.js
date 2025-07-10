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
  console.log(`👤 클라이언트 연결됨 (현재 ${clients.length}명)`);

  // 두 명이 모두 연결되었을 때, 첫 번째 사용자에게만 offer 시작 지시
  if (clients.length === 2) {
    console.log('🔔 두 명 연결됨 → 첫 번째 사용자에게 offer 요청');
    clients[0].send(JSON.stringify({ type: 'init-offer' }));
  }

  ws.on('message', msg => {
    console.log('📩 메시지 수신:', msg);
    // 나 아닌 상대방에게만 메시지 전달
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log('📤 메시지 전달 중');
        client.send(msg);
      }
    });
  });

  ws.on('close', () => {
    console.log('❌ 클라이언트 연결 종료');
    clients = clients.filter(client => client !== ws);
  });
});

server.listen(port, () => {
  console.log(`🚀 Signaling server running on port ${port}`);
});
