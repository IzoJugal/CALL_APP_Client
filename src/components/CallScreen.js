/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef } from "react";
import SimplePeer from "simple-peer";
import  { SocketProvider } from "../context/SocketContext";

const CallScreen = ({
  stream,
  myUserId,
  targetUserId,
  setIsCallAccepted,
  peerVideoRef,
  connectionRef,
}) => {
  const initiateCall = () => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signalData) => {
      SocketProvider.emit("initiateCall", {
        userId: targetUserId,
        signalData,
        myId: myUserId,
      });
    });

    peer.on("stream", (remoteStream) => {
      peerVideoRef.current.srcObject = remoteStream;
    });

    SocketProvider.on("callAccepted", (signal) => {
      setIsCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  useEffect(() => {
    if (stream && myUserId && targetUserId) {
      initiateCall();
    }
  }, [stream, myUserId, targetUserId]);

  return <h3 className="text-center">Calling {targetUserId}...</h3>;
};

export default CallScreen;
