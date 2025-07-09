import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000'); // Replace with your server URL if different

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.on('chatMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => socket.off('chatMessage');
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
      socket.emit('chatMessage', { text: message, user: 'User' });
      setMessage('');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2>Live Chat</h2>
      <div className="h-64 overflow-y-auto border p-4">
        {messages.map((msg, index) => (
          <p key={index}>{msg.user}: {msg.text}</p>
        ))}
      </div>
      <form onSubmit={sendMessage} className="mt-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border"
        />
        <button type="submit" className="w-full p-2 bg-blue-500 text-white">Send</button>
      </form>
    </div>
  );
};

export default Chat;