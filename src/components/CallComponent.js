/* eslint-disable no-unused-vars */
import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

const CallComponent = () => {
  const { socket, onlineUsers, incomingCall } = useSocket();

  useEffect(() => {
    if (incomingCall) {
      // show modal or redirect to IncomingCallScreen
      console.log('Someone is calling:', incomingCall);
    }
  }, [incomingCall]);

  return (
    <div>
      <h3>Online Users</h3>
      <ul>
        {onlineUsers.map((u) => (
          <li key={u.id}>{u.username}</li>
        ))}
      </ul>
    </div>
  );
};

export default CallComponent;