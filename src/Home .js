import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [username, setUsername] = useState('');
  const [targetSocketId, setTargetSocketId] = useState('');
  const navigate = useNavigate();

  const handleCall = () => {
    navigate(`/call?target=${targetSocketId}&username=${username}`);
  };

  return (
    <div className="container">
      <h1>Welcome to App-to-App Call</h1>
      <input
        type="text"
        placeholder="Your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="text"
        placeholder="Target Socket ID"
        value={targetSocketId}
        onChange={(e) => setTargetSocketId(e.target.value)}
      />
      <button onClick={handleCall}>Start Call</button>
    </div>
  );
}

export default Home;
