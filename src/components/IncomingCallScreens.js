import React from "react";
import SimplePeer from "simple-peer";
import {SocketProvider} from "../context/SocketContext";

const IncomingCallScreen = ({
  incomingCallInfo,
  setIsCallAccepted,
  stream,
  peerVideoRef,
  connectionRef,
}) => {
  const answerCall = () => {
    setIsCallAccepted(true);

    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (data) => {
      SocketProvider.emit("answerCall", {
        signal: data,
        to: incomingCallInfo.from,
      });
    });

    peer.on("stream", (currentStream) => {
      peerVideoRef.current.srcObject = currentStream;
    });

    peer.signal(incomingCallInfo.signalData);

    connectionRef.current = peer;
  };

  return (
    <div className="flex flex-col items-center">
      <p>
        <u>{incomingCallInfo.from}</u> is calling...
      </p>
      <button onClick={answerCall} className="input bg-green">
        Answer Call
      </button>
    </div>
  );
};

export default IncomingCallScreen;
