import React, { useState } from 'react';

const CharityLoginButton = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Hardcoded credentials
    if (username === 'charity123' && password === 'password123') {
      onLoginSuccess();
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="charity-login" style={{ margin: '20px' }}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ marginRight: '10px', padding: '8px' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ marginRight: '10px', padding: '8px' }}
      />
      <button
        onClick={handleLogin}
        style={{
          padding: '12px 24px',
          backgroundColor: '#34c759',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Login as Charity
      </button>
    </div>
  );
};

export default CharityLoginButton;