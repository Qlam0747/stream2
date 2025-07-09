import React, { useState, useEffect, useRef } from 'react';
import LiveStreamPlayer from './LiveStreamPlayer';
import ChatBox from './ChatBox';
import { getStreamStats } from '../services/streamingApi';
import { useUser } from '../hooks/useUser';

const StreamDashboard = ({ streamId }) => {
  const [streamInfo, setStreamInfo] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stats, setStats] = useState(null);
  const { user } = useUser();
  const statsInterval = useRef(null);

  useEffect(() => {
    const fetchStreamInfo = async () => {
      try {
        const response = await getStreamStats(streamId);
        setStreamInfo(response.data);
        setIsLive(response.data.isLive);
        setViewerCount(response.data.viewerCount);
      } catch (error) {
        console.error('Failed to fetch stream info:', error);
      }
    };

    fetchStreamInfo();
    
    // Poll for stats every 5 seconds
    statsInterval.current = setInterval(fetchStreamInfo, 5000);

    return () => {
      if (statsInterval.current) {
        clearInterval(statsInterval.current);
      }
    };
  }, [streamId]);

  const startStreaming = async () => {
    try {
      // Logic to start streaming would go here
      setIsStreaming(true);
    } catch (error) {
      console.error('Failed to start stream:', error);
    }
  };

  const stopStreaming = async () => {
    try {
      // Logic to stop streaming would go here
      setIsStreaming(false);
    } catch (error) {
      console.error('Failed to stop stream:', error);
    }
  };

  return (
    <div className="stream-dashboard">
      <div className="stream-content">
        <div className="video-container">
          {isLive ? (
            <LiveStreamPlayer streamId={streamId} />
          ) : (
            <div className="offline-placeholder">
              <h3>Stream is currently offline</h3>
            </div>
          )}
          
          {user?.isStreamer && (
            <div className="streamer-controls">
              {!isStreaming ? (
                <button onClick={startStreaming} className="start-stream-btn">
                  Start Streaming
                </button>
              ) : (
                <button onClick={stopStreaming} className="stop-stream-btn">
                  Stop Streaming
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="stream-stats">
          <div className="stat-item">
            <span className="stat-label">Viewers:</span>
            <span className="stat-value">{viewerCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Status:</span>
            <span className={`stat-value ${isLive ? 'live' : 'offline'}`}>
              {isLive ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="chat-container">
        <ChatBox streamId={streamId} userId={user?.id || 'anonymous'} />
      </div>
    </div>
  );
};

export default StreamDashboard;