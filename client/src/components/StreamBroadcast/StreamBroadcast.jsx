// Component cho streamer để bắt đầu phát sóng
import React, { useState, useRef, useEffect } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useStream } from '../../hooks/useStream';
import './StreamBroadcast.css';

const StreamBroadcast = () => {
  // WebRTC logic và UI controls
    const { startStream, stopStream, isStreaming, videoRef } = useWebRTC();
    const { stream, error } = useStream();
    const [isError, setIsError] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    
    const startBroadcast = async () => {
        try {
            await startStream();
            setIsBroadcasting(true);
        } catch (err) {
            console.error('Error starting broadcast:', err);
            setIsError(true);
        }
    }
    const stopBroadcast = () => {
        stopStream();
        setIsBroadcasting(false);
    };
    useEffect(() => {
        if (error) {
            console.error('Stream error:', error);
            setIsError(true);
        }
    }, [error]);
    return (
        <div className="stream-broadcast">
            <h1>Stream Broadcast</h1>
            {isError && <div className="error">An error occurred while accessing the stream.</div>}
            <video ref={videoRef} autoPlay playsInline className="video-stream" />
            <div className="controls">
                {!isBroadcasting ? (
                    <button onClick={startBroadcast} className="btn start">Start Broadcast</button>
                ) : (
                    <button onClick={stopBroadcast} className="btn stop">Stop Broadcast</button>
                )}
            </div>
        </div>
    );
};

export default StreamBroadcast;