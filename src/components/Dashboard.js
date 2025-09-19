/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { SocketProvider } from "../context/SocketContext";
import IncomingCallScreen from "./IncomingCallScreens";
import CallScreen from "./CallScreen";


function Dashboard() {
  const myVideoRef = useRef();
  const peerVideoRef = useRef();
  const connectionRef = useRef();

  const [myStream, setMyStream] = useState(null);
  const [myUserId, setMyUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [isCallAccepted, setIsCallAccepted] = useState(false);
  const [incomingCallInfo, setIncomingCallInfo] = useState({});

  // Grab ?user=user1 or user2 from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const user = params.get("user");
    if (user === "user1" || user === "user2") {
      setMyUserId(user);
      setTargetUserId(user === "user1" ? "user2" : "user1");
    } else {
      alert("Please specify a valid user ID in URL (?user=user1 or ?user=user2)");
    }
  }, []);

  // Set up media + socket listeners
  useEffect(() => {
    if (!myUserId) return;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((mediaStream) => {
        setMyStream(mediaStream);
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = mediaStream;
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
        alert("Mic access denied or unavailable.");
      });

    SocketProvider.on("connect", () => {
      SocketProvider.emit("register", myUserId);
    });

    SocketProvider.on("incomingCall", handleIncomingCall);
    SocketProvider.on("callEnded", handleCallEnded);
    SocketProvider.on("error", (data) => alert(data.message));

    return () => {
      SocketProvider.off("incomingCall", handleIncomingCall);
      SocketProvider.off("callEnded", handleCallEnded);
      SocketProvider.off("error");
    };
  }, [myUserId]);

  // Memoized handler
  const handleIncomingCall = useCallback(({ from, signalData }) => {
    setIncomingCallInfo({ isSomeoneCalling: true, from, signalData });
  }, []);

  const handleCallEnded = useCallback(() => {
    if (connectionRef.current) connectionRef.current.destroy();
    setIsCallAccepted(false);
    setIncomingCallInfo({});
    connectionRef.current = null;
  }, []);

  const endCall = () => {
    SocketProvider.emit("endCall", { to: incomingCallInfo.from || targetUserId });
    handleCallEnded();
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-center text-xl font-bold">🎧 Audio Calling App</h2>

      <section className="my-2 text-sm text-gray-600">
        My ID: <u><i>{myUserId || "Not set"}</i></u>
      </section>

      <div className="flex gap-6 my-4">
        <div>
          <h3 className="text-center text-sm font-semibold">My Audio</h3>
          <video
            ref={myVideoRef}
            autoPlay
            playsInline
            muted
            className="w-40 h-28 rounded-md border border-gray-300"
          />
        </div>

        {isCallAccepted && (
          <div>
            <h3 className="text-center text-sm font-semibold">Peer Audio</h3>
            <video
              ref={peerVideoRef}
              autoPlay
              playsInline
              className="w-40 h-28 rounded-md border border-gray-300"
            />
          </div>
        )}
      </div>

      {isCallAccepted ? (
        <button onClick={endCall} className="bg-red-500 text-white px-4 py-2 rounded">
          End Call
        </button>
      ) : incomingCallInfo?.isSomeoneCalling ? (
        <IncomingCallScreen
          incomingCallInfo={incomingCallInfo}
          stream={myStream}
          peerVideoRef={peerVideoRef}
          setIsCallAccepted={setIsCallAccepted}
          connectionRef={connectionRef}
        />
      ) : (
        <CallScreen
          stream={myStream}
          myUserId={myUserId}
          targetUserId={targetUserId}
          setIsCallAccepted={setIsCallAccepted}
          peerVideoRef={peerVideoRef}
          connectionRef={connectionRef}
        />
      )}
    </div>
  );
}

export default Dashboard;
