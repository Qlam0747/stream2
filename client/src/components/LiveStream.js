import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import adapter from 'webrtc-adapter';

const socket = io('http://localhost:5000');

const LiveStream = () => {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const peerConnectionRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let transport;

    const startStream = async () => {
      try {
        // Lấy luồng từ webcam/microphone
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        setIsStreaming(true);

        // Tạo WebRTC Peer Connection
        peerConnectionRef.current = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' } // STUN server
          ]
        });

        // Thêm luồng vào peer connection
        stream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        // Xử lý ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('iceCandidate', { candidate: event.candidate });
          }
        };

        // Yêu cầu tạo producer transport từ server
        socket.emit('createProducerTransport', {}, async (transportParams) => {
          if (transportParams.error) {
            console.error('Error creating producer transport:', transportParams.error);
            return;
          }

          // Thiết lập transport trên client
          transport = {
            id: transportParams.id,
            iceParameters: transportParams.iceParameters,
            iceCandidates: transportParams.iceCandidates,
            dtlsParameters: transportParams.dtlsParameters
          };

          // Thêm ICE candidates từ server
          transport.iceCandidates.forEach(candidate => {
            peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          });

          // Tạo offer SDP
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);

          // Gửi offer và kết nối transport
          socket.emit('connectTransport', {
            transportId: transport.id,
            dtlsParameters: peerConnectionRef.current.localDescription
          }, async () => {
            // Khi transport được kết nối, tạo producer
            const tracks = stream.getTracks();
            const videoTrack = tracks.find(track => track.kind === 'video');
            if (videoTrack) {
              socket.emit('produce', {
                kind: videoTrack.kind,
                rtpParameters: peerConnectionRef.current.localDescription
              }, ({ id, error }) => {
                if (error) {
                  console.error('Error producing:', error);
                  return;
                }
                console.log('Producer created with ID:', id);
              });
            }
          });
        });

        // Xử lý ICE candidates từ server
        socket.on('iceCandidate', async ({ candidate }) => {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        });

      } catch (err) {
        console.error('Error starting stream:', err);
        setIsStreaming(false);
      }
    };

    // Bắt đầu stream khi component được mount
    startStream();

    // Cleanup khi component unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      socket.off('iceCandidate');
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h2>Live Stream</h2>
      <video ref={videoRef} autoPlay muted className="w-full" />
      <p>{isStreaming ? 'Streaming...' : 'Not streaming'}</p>
      <button
        onClick={() => {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            setIsStreaming(false);
          }
        }}
        className="mt-4 p-2 bg-red-500 text-white"
        disabled={!isStreaming}
      >
        Stop Stream
      </button>
    </div>
  );
};

export default LiveStream;