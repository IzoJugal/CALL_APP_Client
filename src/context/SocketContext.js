// src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ user, children }) => {
  const [socket, setSocket] = useState(null); // ✅ Define socket here (don't destructure from context)
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:4000', {
      transports: ['websocket'],
    });

    newSocket.emit('join', user.id);

    newSocket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('incoming-call', (data) => {
      setIncomingCall(data);
      console.log('Incoming call from', data.callerId);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, incomingCall }}>
      {children}
    </SocketContext.Provider>
  );
};
