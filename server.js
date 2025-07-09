const WebSocket = require('ws');
const http = require('http');

// Render.com에서는 환경변수 PORT를 사용
const port = process.env.PORT || 3000;
const server = http.createServer();

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('새로운 클라이언트 연결됨');
  
  ws.on('message', msg => {
    console.log('메시지 수신:', msg.toString());
    // 모든 클라이언트에게 메시지 중계
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });
  
  ws.on('close', () => {
    console.log('클라이언트 연결 해제');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket 에러:', error);
  });
});

server.listen(port, () => {
  console.log(`Signaling server running on port ${port}`);
}); 
