const WebSocket = require('ws');
const http = require('http');
const port = process.env.PORT || 3000;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rooms = {}; // roomId → [client1, client2]

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    let parsed;
    try {
      parsed = JSON.parse(msg);
    } catch (e) {
      console.log('⚠️ JSON 파싱 실패:', msg);
      return;
    }

    const { type, roomId, userId } = parsed;

    if (type === 'join') {
      if (!roomId) {
        ws.send(JSON.stringify({ type: 'error', message: 'roomId 누락' }));
        return;
      }

      rooms[roomId] = rooms[roomId] || [];

      if (rooms[roomId].length >= 2) {
        ws.send(JSON.stringify({ type: 'full' }));
        ws.close();
        return;
      }

      ws.roomId = roomId;
      ws.userId = userId;
      rooms[roomId].push(ws);
      console.log(`✅ ${userId} 가 방 "${roomId}"에 접속 (총 ${rooms[roomId].length}명)`);

      // 기존 참가자에게 offer 시작하라고 알림
      if (rooms[roomId].length === 2) {
        const [first, second] = rooms[roomId];
        const sender = first === ws ? second : first;
        if (sender && sender.readyState === WebSocket.OPEN) {
          sender.send(JSON.stringify({ type: 'init-offer', userId }));
          console.log(`🔔 offer 시작 요청 전송 (to ${sender.userId})`);
        }
      }

      return;
    }

    // 메시지 relay (같은 방의 다른 유저에게)
    if (ws.roomId && rooms[ws.roomId]) {
      rooms[ws.roomId].forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    }
  });

  ws.on('close', () => {
    const roomId = ws.roomId;
    if (roomId && rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter(client => client !== ws);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
      console.log(`❌ 연결 종료 → 방 "${roomId}" 인원: ${rooms[roomId]?.length || 0}`);
    }
  });
});

server.listen(port, () => {
  console.log(`🚀 Signaling server running on port ${port}`);
});
