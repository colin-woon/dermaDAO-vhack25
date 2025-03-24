import { contracts } from '@/services/blockchain';

export default function BlockchainTest() {
  const testConnection = async () => {
    try {
      // Test provider
      const network = await contracts.provider.getNetwork();
      console.log('Connected to network:', {
        name: network.name,
        chainId: network.chainId
      });

      // Test DermaCoin contract
      const name = await contracts.dermaCoin.name();
      const symbol = await contracts.dermaCoin.symbol();
      console.log('DermaCoin contract:', { name, symbol });

      // Test CharityPlatform contract
      const currentRound = await contracts.charityPlatform.getCurrentRoundId();
      console.log('Current round ID:', currentRound.toString());

      alert('Blockchain connection successful! Check console for details.');
    } catch (error) {
      console.error('Blockchain connection test failed:', error);
      alert('Blockchain connection failed. Check console for details.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Blockchain Connection Test</h2>
      <button
        onClick={testConnection}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Test Blockchain Connection
      </button>
    </div>
  );
}