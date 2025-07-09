import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import LiveStream from './components/LiveStream';
import Chat from './components/Chat';

const App = () => (
  <Router>
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/stream" element={<LiveStream />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  </Router>
);

export default App;