import io from 'socket.io-client';
import { getSocketUrl } from '../utils/constants';

let socketInstance = null;

export const initSocket = (streamId, options = {}) => {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  const socketOptions = {
    query: { streamId },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket'],
    ...options,
  };

  socketInstance = io(getSocketUrl(), socketOptions);

  return socketInstance;
};

export const getSocket = () => {
  if (!socketInstance) {
    throw new Error('Socket not initialized. Call initSocket first.');
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export const joinStreamRoom = (streamId) => {
  const socket = getSocket();
  socket.emit('joinStream', { streamId });
};

export const leaveStreamRoom = (streamId) => {
  const socket = getSocket();
  socket.emit('leaveStream', { streamId });
};

export const sendChatMessage = (message) => {
  const socket = getSocket();
  socket.emit('chatMessage', message);
};

export const notifyTyping = (streamId, isTyping) => {
  const socket = getSocket();
  socket.emit('typing', { streamId, isTyping });
};

export const subscribeToChatMessages = (callback) => {
  const socket = getSocket();
  socket.on('chatMessage', callback);
  return () => socket.off('chatMessage', callback);
};

export const subscribeToViewerCount = (callback) => {
  const socket = getSocket();
  socket.on('viewerCount', callback);
  return () => socket.off('viewerCount', callback);
};

export const subscribeToStreamEvents = (callback) => {
  const socket = getSocket();
  socket.on('streamEvent', callback);
  return () => socket.off('streamEvent', callback);
};

export const subscribeToSocketStatus = (callback) => {
  const socket = getSocket();
  
  const statusHandler = (status) => {
    callback(status);
  };
  
  socket.on('connect', () => statusHandler('connected'));
  socket.on('disconnect', () => statusHandler('disconnected'));
  socket.on('connect_error', () => statusHandler('error'));
  
  return () => {
    socket.off('connect', statusHandler);
    socket.off('disconnect', statusHandler);
    socket.off('connect_error', statusHandler);
  };
};