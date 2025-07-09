import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { getSocketUrl } from '../utils/constants';

const useSocket = (streamId) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const connectSocket = useCallback(() => {
    if (!streamId) return;

    const newSocket = io(getSocketUrl(), {
      query: { streamId },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      setError('Socket connection error: ' + err.message);
      setIsConnected(false);
    });

    newSocket.on('error', (err) => {
      setError('Socket error: ' + err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [streamId]);

  useEffect(() => {
    const cleanup = connectSocket();

    return () => {
      if (cleanup) cleanup();
    };
  }, [connectSocket]);

  const emitEvent = useCallback((event, data, callback) => {
    if (socket && isConnected) {
      socket.emit(event, data, callback);
    } else {
      setError('Cannot emit event - socket not connected');
    }
  }, [socket, isConnected]);

  return { 
    socket, 
    isConnected, 
    error, 
    emitEvent,
    reconnect: connectSocket 
  };
};

export default useSocket;