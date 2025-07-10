const WebSocket = require('ws');
const http = require('http');
const port = process.env.PORT || 3000;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

let rooms = {}; // { roomId: [ws1, ws2] }

wss.on('connection', ws => {
  ws.on('message', msg => {
    let parsed;
    try {
      parsed = JSON.parse(msg);
    } catch (e) {
      console.log('⚠️ JSON 파싱 실패');
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
      rooms[roomId].push(ws);
      console.log(`✅ ${userId} 가 방 "${roomId}"에 접속 (총 ${rooms[roomId].length}명)`);

      if (rooms[roomId].length === 2) {
        console.log(`🔔 "${roomId}" 방 인원 2명 도달 → offer 요청`);
        rooms[roomId][0].send(JSON.stringify({ type: 'init-offer' }));
      }
      return;
    }

    // 메시지 브로드캐스트 (같은 방 내 상대방에게만)
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
        delete rooms[roomId]; // 아무도 없으면 방 제거
      }
      console.log(`❌ 클라이언트 연결 종료 → "${roomId}" 방 인원: ${rooms[roomId]?.length || 0}`);
    }
  });
});

server.listen(port, () => {
  console.log(`🚀 Signaling server running on port ${port}`);
});
