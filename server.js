// signaling-server.js
const WebSocket = require('ws');
const http = require('http');
const port = process.env.PORT || 3000;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rooms = {}; // { roomId: [ws1, ws2] }

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('⚠️ JSON 파싱 실패:', message);
      return;
    }

    const { type, roomId, userId } = data;
    if (!type || !roomId || !userId) {
      console.warn('❌ 누락된 필드:', data);
      return;
    }

    if (type === 'join') {
      if (!rooms[roomId]) rooms[roomId] = [];

      if (rooms[roomId].length >= 2) {
        ws.send(JSON.stringify({ type: 'full' }));
        ws.close();
        return;
      }

      ws.roomId = roomId;
      ws.userId = userId;
      rooms[roomId].push(ws);
      console.log(`✅ ${userId} joined room "${roomId}" (${rooms[roomId].length}/2)`);

      if (rooms[roomId].length === 2) {
        const initiator = rooms[roomId][0];
        if (initiator.readyState === WebSocket.OPEN) {
          console.log(`🔔 Room "${roomId}" is full. Sending init-offer to ${initiator.userId}`);
          initiator.send(JSON.stringify({ type: 'init-offer' }));
        }
      }
      return;
    }

    // relay to others in room
    const clients = rooms[ws.roomId] || [];
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    const roomId = ws.roomId;
    if (roomId && rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter(client => client !== ws);
      console.log(`❌ ${ws.userId || 'unknown'} disconnected from room "${roomId}"`);

      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
        console.log(`🧹 Room "${roomId}" deleted`);
      }
    }
  });
});

server.listen(port, () => {
  console.log(`🚀 Signaling server running on port ${port}`);
});
