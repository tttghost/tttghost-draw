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

  ws.on('message', msg => {
    console.log('📩 메시지 수신:', msg);

    let parsed;
    try {
      parsed = JSON.parse(msg);
    } catch (e) {
      console.log('⚠️ JSON 파싱 실패');
      return;
    }

    // ✅ join 메시지 수신 처리
    if (parsed.type === 'join') {
      console.log(`✅ ${parsed.userId} 가 join 요청함`);

      if (clients.length === 2) {
        console.log('🔔 두 명 연결됨 → 첫 번째 사용자에게 init-offer 전송');
        clients[0].send(JSON.stringify({ type: 'init-offer' }));
      }
      return; // join 메시지는 브로드캐스트하지 않음
    }

    // 일반 메시지 (offer, answer, ice-candidate 등) → 상대방에게만 전달
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
