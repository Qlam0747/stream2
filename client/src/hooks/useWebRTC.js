import { useEffect, useState } from 'react';
import { setupWebRTC } from '../services/webrtc';

const useWebRTC = (videoRef, streamId, shouldPlay) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!videoRef.current || !streamId) return;

    let webrtcConnection;
    const cleanup = () => {
      if (webrtcConnection) {
        webrtcConnection.disconnect();
      }
    };

    const initWebRTC = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        webrtcConnection = await setupWebRTC(streamId, {
          onStream: (stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              if (shouldPlay) {
                videoRef.current.play().catch(e => {
                  setError('Failed to play video: ' + e.message);
                });
              }
            }
          },
          onError: (err) => {
            setError('WebRTC error: ' + err.message);
          },
          onDisconnect: () => {
            setError('WebRTC connection disconnected');
          }
        });

        setIsLoading(false);
      } catch (err) {
        setError('Failed to setup WebRTC: ' + err.message);
        setIsLoading(false);
      }
    };

    initWebRTC();

    return cleanup;
  }, [streamId, shouldPlay, videoRef]);

  useEffect(() => {
    if (!videoRef.current) return;

    if (shouldPlay) {
      videoRef.current.play().catch(e => {
        setError('Failed to play video: ' + e.message);
      });
    } else {
      videoRef.current.pause();
    }
  }, [shouldPlay, videoRef]);

  return { error, isLoading };
};

export default useWebRTC;