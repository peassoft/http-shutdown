import { createServer } from 'node:https';
import { readFileSync } from 'node:fs';

const options = {
  key: readFileSync('private-key.pem'),
  cert: readFileSync('certificate.pem'),
};

const server = createServer(options, (req, res) => {
  res.setHeader('connection', 'close');
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8000);

server.addListener('secureConnection', (socket) => {
  console.log('secureConnection event');

  socket.once('close', () => {
    console.log('close event from secureConnection');
  });
});

server.addListener('connection', (socket) => {
  console.log('connection event');
  // console.log(socket)

  socket.once('close', () => {
    console.log('close event from connection');
  });
});
