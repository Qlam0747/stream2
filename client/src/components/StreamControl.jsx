import React from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const StreamControls = ({
  isPlaying,
  isMuted,
  volume,
  onPlayToggle,
  onMuteToggle,
  onVolumeChange,
}) => {
  return (
    <div className="stream-controls">
      <button onClick={onPlayToggle} className="control-button">
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      
      <div className="volume-controls">
        <button onClick={onMuteToggle} className="control-button">
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={onVolumeChange}
          className="volume-slider"
        />
      </div>
    </div>
  );
};

export default StreamControls;