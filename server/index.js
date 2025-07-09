const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mediasoup = require('mediasoup');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Đảm bảo khớp với URL client
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Kết nối MongoDB
mongoose.connect('mongodb://localhost/livestream-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use('/api/auth', authRoutes);

// Cấu hình mediasoup
let worker;
let router;
let producerTransport;
let consumerTransport;
let producer;
let consumer;

const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000
    }
  }
];

async function startMediaServer() {
  worker = await mediasoup.createWorker({
    logLevel: 'debug',
    rtcMinPort: 10000,
    rtcMaxPort: 10100
  });

  worker.on('died', () => {
    console.error('mediasoup Worker died, exiting in 2 seconds...');
    setTimeout(() => process.exit(1), 2000);
  });

  router = await worker.createRouter({ mediaCodecs });
  console.log('Mediasoup router created');
}

async function createWebRtcTransport() {
  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true
  });

  transport.on('dtlsstatechange', dtlsState => {
    if (dtlsState === 'closed') {
      transport.close();
    }
  });

  return {
    transport,
    params: {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters
    }
  };
}

io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('createProducerTransport', async ({}, callback) => {
    try {
      const { transport, params } = await createWebRtcTransport();
      producerTransport = transport;
      callback(params);
    } catch (err) {
      console.error('Error creating producer transport:', err);
      callback({ error: err.message });
    }
  });

  socket.on('createConsumerTransport', async ({}, callback) => {
    try {
      const { transport, params } = await createWebRtcTransport();
      consumerTransport = transport;
      callback(params);
    } catch (err) {
      console.error('Error creating consumer transport:', err);
      callback({ error: err.message });
    }
  });

  socket.on('connectTransport', async ({ transportId, dtlsParameters }, callback) => {
    try {
      if (transportId === producerTransport?.id) {
        await producerTransport.connect({ dtlsParameters });
      } else if (transportId === consumerTransport?.id) {
        await consumerTransport.connect({ dtlsParameters });
      }
      callback();
    } catch (err) {
      console.error('Error connecting transport:', err);
      callback({ error: err.message });
    }
  });

  socket.on('produce', async ({ kind, rtpParameters }, callback) => {
    try {
      producer = await producerTransport.produce({ kind, rtpParameters });
      console.log('Producer created:', producer.id);
      callback({ id: producer.id });
    } catch (err) {
      console.error('Error creating producer:', err);
      callback({ error: err.message });
    }
  });

  socket.on('consume', async ({ rtpCapabilities }, callback) => {
    try {
      if (!producer || !router.canConsume({ producerId: producer.id, rtpCapabilities })) {
        return callback({ error: 'Cannot consume' });
      }

      consumer = await consumerTransport.consume({
        producerId: producer.id,
        rtpCapabilities,
        paused: true
      });

      console.log('Consumer created:', consumer.id);
      callback({
        producerId: producer.id,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused
      });
    } catch (err) {
      console.error('Error creating consumer:', err);
      callback({ error: err.message });
    }
  });

  socket.on('resume', async ({}, callback) => {
    try {
      await consumer.resume();
      callback();
    } catch (err) {
      console.error('Error resuming consumer:', err);
      callback({ error: err.message });
    }
  });

  socket.on('chatMessage', (msg) => {
    console.log('Chat message received:', msg);
    io.emit('chatMessage', msg); // Gửi đến tất cả client
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

startMediaServer();
server.listen(5000, () => console.log('Server running on port 5000'));