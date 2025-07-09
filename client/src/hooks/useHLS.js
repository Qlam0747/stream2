import { useEffect, useState, useRef } from 'react';
import Hls from 'hls.js';

const useHLS = (videoRef, streamId, shouldPlay) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const hlsRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current || !streamId || !Hls.isSupported()) {
      setError(Hls.isSupported() ? null : 'HLS is not supported in this browser');
      setIsLoading(false);
      return;
    }

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };

    const initHLS = () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          lowLatencyMode: true,
          enableWorker: true,
        });

        hlsRef.current = hls;

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(`/hls/${streamId}/index.m3u8`);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (shouldPlay) {
            videoRef.current.play().catch(e => {
              setError('Failed to play video: ' + e.message);
            });
          }
          setIsLoading(false);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError('Fatal HLS error: ' + data.details);
                cleanup();
                break;
            }
          }
        });

        hls.attachMedia(videoRef.current);
      } catch (err) {
        setError('HLS initialization error: ' + err.message);
        setIsLoading(false);
      }
    };

    initHLS();

    return cleanup;
  }, [streamId, videoRef]);

  useEffect(() => {
    if (!videoRef.current || !hlsRef.current) return;

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

export default useHLS;