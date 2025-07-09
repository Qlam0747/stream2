import { getWebRTCConfig } from '../utils/constants';

export const setupWebRTC = async (streamId, callbacks = {}) => {
  const { onStream, onError, onDisconnect } = callbacks;
  const config = getWebRTCConfig();
  
  let peerConnection;
  let dataChannel;
  let isConnected = false;

  const connect = async () => {
    try {
      // Create peer connection
      peerConnection = new RTCPeerConnection(config);

      // Set up event handlers
      peerConnection.onicecandidate = handleICECandidate;
      peerConnection.onconnectionstatechange = handleConnectionStateChange;
      peerConnection.ontrack = handleTrackEvent;
      peerConnection.ondatachannel = handleDataChannel;

      // Create data channel (for chat or other metadata)
      dataChannel = peerConnection.createDataChannel('livestreamData');
      setupDataChannel(dataChannel);

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to signaling server (simplified example)
      const response = await fetch(`/api/streams/${streamId}/webrtc-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer }),
      });

      if (!response.ok) {
        throw new Error('Failed to send WebRTC offer');
      }

      const { answer } = await response.json();
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

      isConnected = true;
      return { peerConnection, dataChannel };
    } catch (error) {
      disconnect();
      throw error;
    }
  };

  const handleICECandidate = (event) => {
    if (event.candidate) {
      // Send ICE candidate to signaling server
      fetch(`/api/streams/${streamId}/ice-candidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate: event.candidate }),
      }).catch(err => {
        console.error('Failed to send ICE candidate:', err);
      });
    }
  };

  const handleConnectionStateChange = () => {
    if (!peerConnection) return;
    
    switch (peerConnection.connectionState) {
      case 'connected':
        isConnected = true;
        break;
      case 'disconnected':
      case 'failed':
      case 'closed':
        isConnected = false;
        if (onDisconnect) onDisconnect();
        break;
    }
  };

  const handleTrackEvent = (event) => {
    if (event.streams && event.streams.length > 0 && onStream) {
      onStream(event.streams[0]);
    }
  };

  const handleDataChannel = (event) => {
    if (event.channel) {
      setupDataChannel(event.channel);
    }
  };

  const setupDataChannel = (channel) => {
    channel.onopen = () => {
      console.log('Data channel opened');
    };
    
    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Handle different message types
        if (message.type === 'chat') {
          if (callbacks.onChatMessage) {
            callbacks.onChatMessage(message.data);
          }
        }
        // Add other message types as needed
      } catch (err) {
        console.error('Failed to parse data channel message:', err);
      }
    };
    
    channel.onclose = () => {
      console.log('Data channel closed');
    };
  };

  const disconnect = () => {
    if (dataChannel) {
      dataChannel.close();
    }
    
    if (peerConnection) {
      peerConnection.close();
    }
    
    isConnected = false;
    peerConnection = null;
    dataChannel = null;
  };

  const sendData = (data) => {
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify(data));
    }
  };

  return {
    connect,
    disconnect,
    sendData,
    isConnected: () => isConnected,
  };
};

export const getDisplayMedia = async (constraints = { video: true, audio: true }) => {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      return await navigator.mediaDevices.getDisplayMedia(constraints);
    }
    throw new Error('Screen sharing not supported');
  } catch (error) {
    console.error('Error getting display media:', error);
    throw error;
  }
};

export const getUserMedia = async (constraints = { video: true, audio: true }) => {
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error('Error getting user media:', error);
    throw error;
  }
};