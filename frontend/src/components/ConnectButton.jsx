import React from 'react';
import { setAllowed } from '@stellar/freighter-api';
// We'll define simple styling here

const ConnectButton = ({ label = "Connect Wallet", isHigher = false }) => {
  return (
    <button
      className="freighter-connect-button"
      style={{ height: isHigher ? 50 : 38 }}
      onClick={setAllowed}
    >
      {label}
    </button>
  );
};

export default ConnectButton;
