let pcCount = 0; // Debug counter (remove in prod)

export const createPeerConnection = (socket, isCaller, targetIdOrCallerId) => {
  if (pcCount > 400) console.warn('High PC count:', pcCount);
  pcCount++;
  console.log(`Created PC #${pcCount} (isCaller: ${isCaller})`);

  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }, // Primary STUN
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' } // Free TURN for NAT
    ]
  });

  let localStream = null;
  const candidateQueue = []; // Queue for pending remote ICE candidates

  // Drain the queue after setRemoteDescription succeeds
  const drainQueue = () => {
    console.log('Draining ICE queue (length:', candidateQueue.length, ')');
    while (candidateQueue.length > 0) {
      const candidateDict = candidateQueue.shift();
      pc.addIceCandidate(new RTCIceCandidate(candidateDict))
        .then(() => console.log('Queued ICE candidate added'))
        .catch(err => console.error('Queued ICE add error:', err));
    }
  };

  // Monkey-patch setRemoteDescription to auto-drain queue
  const originalSetRemoteDescription = pc.setRemoteDescription.bind(pc);
  pc.setRemoteDescription = async (description) => {
    const result = await originalSetRemoteDescription(description);
    console.log('setRemoteDescription succeeded - remote desc set');
    drainQueue(); // Drain queued candidates now
    return result;
  };

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      console.log('Local stream ready:', stream);
      localStream = stream;
      if (pc.signalingState === 'closed') {
        stream.getTracks().forEach(track => track.stop());
        console.log('Stream stopped due to closed PC');
        return;
      }
      stream.getTracks().forEach((track, i) => {
        console.log(`Adding track ${i}:`, track);
        pc.addTrack(track, stream);
      });
    })
    .catch(err => {
      console.error('Media error (mic/perms?):', err);
    });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidateDict = event.candidate.toJSON();
      const emitData = { 
        targetId: targetIdOrCallerId, 
        candidate: candidateDict
      };
      console.log('Emitting ICE candidate dict:', emitData);
      socket.emit('ice-candidate', emitData);
    } else {
      console.log('End of ICE candidates (null event)');
    }
  };

pc.ontrack = (event) => {
  const remoteStream = event.streams[0];
  console.log('🎧 Remote track received:', event.track, 'Stream:', remoteStream);
  
  const remoteAudio = new Audio();
  remoteAudio.srcObject = remoteStream;
  remoteAudio.autoplay = true;
  remoteAudio.muted = false;

  const playWithGesture = () => {
    remoteAudio.play().catch(err => console.error('🔇 Play error (autoplay?):', err));
  };

  window.callPlayRef = playWithGesture;

  setTimeout(() => {
    if (remoteStream.active) playWithGesture();
  }, 2000);
};


  pc.onconnectionstatechange = () => {
    console.log('PC state:', pc.connectionState);
    if (pc.connectionState === 'connected') console.log('P2P connected!');
    if (pc.connectionState === 'failed') console.error('P2P failed - check ICE');
    if (pc.connectionState === 'closed') {
      pcCount--;
      console.log('PC closed, count:', pcCount);
    }
  };

  // Exposed function to safely add remote ICE candidates (queues if needed)
  const safeAddIceCandidate = (candidateDict) => {
    if (!pc.remoteDescription) {
      console.log('Remote desc null - queuing ICE candidate');
      candidateQueue.push(candidateDict);
      return;
    }
    // Already set - add directly
    console.log('Adding ICE candidate directly');
    pc.addIceCandidate(new RTCIceCandidate(candidateDict))
      .then(() => console.log('Direct ICE candidate added'))
      .catch(err => console.error('Direct ICE add error:', err));
  };

  return { 
    pc, 
    localStream, 
    playRemote: () => window.callPlayRef?.(),
    safeAddIceCandidate  // Use this in handlers for remote candidates
  };
};

export const createOffer = async (pc, targetId, socket) => {
  if (pc.signalingState === 'closed') throw new Error('Closed PC');
  console.log('Creating offer...');
  const offer = await pc.createOffer({ offerToReceiveAudio: true }); // Explicit audio
  await pc.setLocalDescription(offer);
  console.log('Offer SDP:', offer.sdp); // Log SDP for debug
  socket.emit('offer', { targetId, offer });
};