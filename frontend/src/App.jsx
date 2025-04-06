import React, { useState, useEffect } from 'react';
import {
  createPolicy,
  purchasePolicy,
  fileClaim,
  viewInsuranceStats,
  viewPolicyById,
  getPublicKey
} from './lib/stellar';
import PolicyCard from './components/PolicyCard';

function App() {
  const [status, setStatus] = useState('');
  const [walletAddress, setWalletAddress] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [stats, setStats] = useState(null);

  const connectWallet = async () => {
    try {
      const address = await getPublicKey();
      setWalletAddress(address);
      setStatus(`✅ Connected wallet: ${address}`);
      fetchStats();
    } catch (err) {
      console.error('❌ Wallet connection error:', err);
      setWalletAddress(null);
      setStatus(`❌ Wallet connection failed: ${err.message}`);
    }
  };
  

  const fetchStats = async () => {
    try {
      const result = await viewInsuranceStats();
      setStats(result);
      setStatus('Fetched insurance stats');
    } catch (error) {
      console.error(error);
      setStatus(`Failed to fetch stats: ${error.message}`);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      const result = await createPolicy(
        'Crop Insurance',
        'Protection against crop failure',
        10000000,
        500000000,
        30
      );
      setStatus(`Policy created: ${result.hash}`);
      fetchPolicies(1);
    } catch (error) {
      console.error(error);
      setStatus(`Failed to create policy: ${error.message}`);
    }
  };

  const handlePurchasePolicy = async (policyId) => {
    try {
      const result = await purchasePolicy(policyId);
      setStatus(`Policy ${policyId} purchased: ${result.hash}`);
      fetchPolicies(policyId);
    } catch (error) {
      console.error(error);
      setStatus(`Failed to purchase policy: ${error.message}`);
    }
  };

  const handleFileClaim = async (policyId) => {
    try {
      const result = await fileClaim(policyId);
      setStatus(`Claim filed for policy ${policyId}: ${result.hash}`);
      fetchPolicies(policyId);
    } catch (error) {
      console.error(error);
      setStatus(`Failed to file claim: ${error.message}`);
    }
  };

  const fetchPolicies = async (policyId) => {
    try {
      const policy = await viewPolicyById(policyId);
      const parsedPolicy = {
        policyId,
        title: 'Crop Insurance',
        description: 'Protection against crop failure',
        premium: 10000000,
        payout: 500000000,
        isActive: true,
        isClaimed: false,
      };
      setPolicies([parsedPolicy]);
    } catch (error) {
      console.error(error);
      setStatus(`Failed to fetch policy: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Decentralized Insurance</h1>
      <div className="max-w-2xl mx-auto space-y-4">
        {!walletAddress && (
          <button
            onClick={connectWallet}
            className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
          >
            Connect Wallet
          </button>
        )}
        {walletAddress && (
          <>
            <p className="text-sm text-gray-600">Wallet: {walletAddress}</p>
            <button
              onClick={handleCreatePolicy}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Create Policy
            </button>
          </>
        )}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Policies</h2>
          {policies.map((policy) => (
            <PolicyCard
              key={policy.policyId}
              policy={policy}
              onPurchase={handlePurchasePolicy}
              onClaim={handleFileClaim}
            />
          ))}
        </div>
        <p className="text-center text-gray-700">Status: {status}</p>
        {stats && <p>Stats: {JSON.stringify(stats)}</p>}
      </div>
    </div>
  );
}

export default App;
