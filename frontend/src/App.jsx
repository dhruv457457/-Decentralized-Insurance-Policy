import React, { useState } from 'react';
import {
  getPublicKey,
  createPolicy,
  purchasePolicy,
  fileClaim,
  viewInsuranceStats
} from './lib/stellar';

import ConnectButton from './components/ConnectButton';

function App() {
  const [wallet, setWallet] = useState(null);
  const [status, setStatus] = useState('');
  const [stats, setStats] = useState(null);

  const connectWallet = async () => {
    try {
      const pub = await getPublicKey();
      setWallet(pub);
      setStatus(`✅ Connected wallet: ${pub}`);
    } catch (e) {
      console.error(e);
      setStatus(`❌ Connection error: ${e.message}`);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      const res = await createPolicy(
        "Crop Insurance",
        "Covers financial loss due to crop failure",
        10000000,    // Premium in stroops (1 XLM)
        500000000,   // Payout in stroops (50 XLM)
        30           // Duration in days
      );
      setStatus(`✅ Policy created: ${res.hash}`);
    } catch (e) {
      console.error(e);
      setStatus(`❌ Create failed: ${e.message}`);
    }
  };

  const handleViewStats = async () => {
    try {
      const result = await viewInsuranceStats();
      setStats(result);
      setStatus('✅ Fetched insurance stats');
    } catch (e) {
      console.error(e);
      setStatus(`❌ Stats fetch failed: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <h1 className="text-3xl font-bold text-center text-purple-700 mb-8">🌾 Soroban Insurance dApp</h1>

      <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow space-y-4">
        {!wallet && (
          <>
            <ConnectButton label="Authorize Freighter Access" isHigher />
            <button
              onClick={connectWallet}
              className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
            >
              Connect Wallet
            </button>
          </>
        )}

        {wallet && (
          <>
            <div className="text-center text-sm text-gray-600">
              Connected as <span className="font-mono text-gray-800">{wallet}</span>
            </div>

            <button
              onClick={handleCreatePolicy}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              ➕ Create Insurance Policy
            </button>

            <button
              onClick={handleViewStats}
              className="w-full bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600"
            >
              📊 View Insurance Stats
            </button>
          </>
        )}

        <div className="text-center text-sm text-gray-700">
          {status && <p>Status: {status}</p>}
          {stats && (
            <div className="mt-2 text-xs text-left bg-gray-100 p-2 rounded">
              <strong>Insurance Stats:</strong>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(stats, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
