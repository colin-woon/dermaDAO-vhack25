import { useState } from 'react';
import WorldcoinLogin from '../components/WorldCoinLogin';
import CharityAdminDashboard from '../components/CharityAdminDashboard';
import DonorDashboard from '../components/DonorDashboard';
import CharityLoginButton from '../components/CharityLoginButton';

export default function Home() {
  const [isCharityAuthenticated, setIsCharityAuthenticated] = useState(false);
  const [isDonorAuthenticated, setIsDonorAuthenticated] = useState(false);

  const handleCharityLogin = () => {
    setIsCharityAuthenticated(true);
  };

  const handleDonorLogin = () => {
    setIsDonorAuthenticated(true);
  };

  return (
    <div style={{ padding: '20px' }}>
      {!isCharityAuthenticated && !isDonorAuthenticated && (
        <div>
          <h1>Choose Login Method</h1>
          <WorldcoinLogin onLoginSuccess={handleDonorLogin} />
          <CharityLoginButton onLoginSuccess={handleCharityLogin} />
        </div>
      )}

      {isCharityAuthenticated && <CharityAdminDashboard />}
      {isDonorAuthenticated && <DonorDashboard />}
    </div>
  );
}