import {
  Horizon,
  Networks,
  Contract,
  TransactionBuilder,
  xdr,
  BASE_FEE
} from '@stellar/stellar-sdk';

import {
  signTransaction,
  getAddress,
  isConnected,
  connect,
  setAllowed
} from '@stellar/freighter-api';

// 🛰️ Stellar Testnet setup
const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;

// ✅ Your deployed contract ID (ensure Testnet-deployed)
const contractId = 'CDLD6VYB2EA3GHD6P66EQUBAH4HKL5VM6B2PENHWASYXM6RJEVFSMMAZ';
const contract = new Contract(contractId);

/**
 * Connect to Freighter + get public key
 */
async function getUserPublicKey() {
  let connected = await isConnected();
  if (!connected) {
    await setAllowed();
    await connect();
    connected = await isConnected();
  }
  if (!connected) throw new Error("Freighter wallet not connected");

  const addressObj = await getAddress();
  console.log("⚡ Freighter raw response:", addressObj);

  const address = typeof addressObj === 'string' ? addressObj : addressObj?.address;
  console.log("✅ Parsed address:", address);

  if (!address || !address.startsWith('G') || address.length !== 56) {
    throw new Error("Invalid Freighter address");
  }
  return address;
}

/**
 * Call Soroban smart contract
 */
async function invokeContract(method, args = []) {
  const publicKey = await getUserPublicKey();
  const account = await server.loadAccount(publicKey);

  const txBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase
  });

  const contractCall = contract.call(method, ...args);
  const tx = txBuilder.addOperation(contractCall).setTimeout(30).build();

  const txXdr = tx.toXDR();
  console.log("📦 Transaction XDR:", txXdr);
  console.log("Network Passphrase:", networkPassphrase);

  try {
    const signedXdr = await signTransaction(txXdr, { network: 'TESTNET', networkPassphrase: Networks.TESTNET });
    console.log("Signed XDR:", signedXdr);
    const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
    const result = await server.submitTransaction(signedTx);
    console.log("✅ Transaction submitted:", result);
    return result;
  } catch (error) {
    console.error("❌ Transaction signing/submission failed:", error);
    throw new Error("Transaction failed: " + error.message);
  }
}

// 🔧 Smart contract method wrappers
export async function createPolicy(title, description, premium, payout, durationDays) {
  const args = [
    xdr.ScVal.scvString(title),
    xdr.ScVal.scvString(description),
    xdr.ScVal.scvI128(new xdr.Int128Parts({ hi: xdr.Int64.fromString("0"), lo: xdr.Uint64.fromString(premium.toString()) })),
    xdr.ScVal.scvI128(new xdr.Int128Parts({ hi: xdr.Int64.fromString("0"), lo: xdr.Uint64.fromString(payout.toString()) })),
    xdr.ScVal.scvU64(xdr.Uint64.fromString(durationDays.toString())),
  ];
  return await invokeContract('create_policy', args);
}

export async function purchasePolicy(policyId) {
  const args = [xdr.ScVal.scvU64(xdr.Uint64.fromString(policyId.toString()))];
  return await invokeContract('purchase_policy', args);
}

export async function fileClaim(policyId) {
  const args = [xdr.ScVal.scvU64(xdr.Uint64.fromString(policyId.toString()))];
  return await invokeContract('file_claim', args);
}

export async function viewInsuranceStats() {
  return await invokeContract('view_insurance_stats');
}

export async function viewPolicyById(policyId) {
  const args = [xdr.ScVal.scvU64(xdr.Uint64.fromString(policyId.toString()))];
  return await invokeContract('view_policy_by_id', args);
}

export { getUserPublicKey as getPublicKey };