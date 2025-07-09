import React, { useEffect, useRef, useState } from 'react';
import useHLS from '../hooks/useHLS';
import useWebRTC from '../hooks/useWebRTC';
import { VIDEO_TYPES } from '../utils/constants';
import StreamControls from './StreamControls';

const LiveStreamPlayer = ({ streamId, streamType = VIDEO_TYPES.HLS }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  
  // Sử dụng custom hooks tùy thuộc vào loại stream
  const { error: hlsError } = useHLS(videoRef, streamId, isPlaying);
  const { error: webrtcError } = useWebRTC(videoRef, streamId, isPlaying);
  
  const error = streamType === VIDEO_TYPES.HLS ? hlsError : webrtcError;

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    }
  };

  return (
    <div className="stream-player-container">
      {error && <div className="stream-error">{error}</div>}
      
      <video
        ref={videoRef}
        className="stream-video"
        controls={false}
        autoPlay
        playsInline
      />
      
      <StreamControls
        isPlaying={isPlaying}
        isMuted={isMuted}
        volume={volume}
        onPlayToggle={togglePlay}
        onMuteToggle={toggleMute}
        onVolumeChange={handleVolumeChange}
      />
    </div>
  );
};

export default LiveStreamPlayer;