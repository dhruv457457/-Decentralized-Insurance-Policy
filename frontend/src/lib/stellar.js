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
  connect
} from '@stellar/freighter-api';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;
const contractId = 'CDLD6VYB2EA3GHD6P66EQUBAH4HKL5VM6B2PENHWASYXM6RJEVFSMMAZ';
const contract = new Contract(contractId);

/**
 * Get the connected user's public key from Freighter
 */
async function getUserPublicKey() {
  let connected = await isConnected();
  if (!connected) {
    await connect(); // 🔁 Prompt user to connect their wallet
    connected = await isConnected();
  }

  if (!connected) throw new Error("Freighter is not connected");

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
 * Invoke a contract function with arguments
 */
async function invokeContract(method, args = []) {
  const publicKey = await getUserPublicKey();
  const account = await server.loadAccount(publicKey);

  const txBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase
  });

  const contractCall = contract.call(method, ...args);

  const tx = txBuilder
    .addOperation(contractCall)
    .setTimeout(30)
    .build();

  const txXdr = tx.toXDR();
  console.log("📦 Transaction XDR:", txXdr);

  try {
    const signedXdr = await signTransaction(txXdr, { network: 'TESTNET' });
    const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
    const result = await server.submitTransaction(signedTx);
    console.log("✅ Transaction submitted:", result);
    return result;
  } catch (error) {
    console.error("❌ Transaction signing/submission failed:", error);
    throw new Error("Failed to sign/submit transaction: " + error.message);
  }
}

// Smart contract methods

export async function createPolicy(title, description, premium, payout, durationDays) {
  const args = [
    xdr.ScVal.scvString(title),
    xdr.ScVal.scvString(description),
    xdr.ScVal.scvI128({ hi: 0, lo: premium }),
    xdr.ScVal.scvI128({ hi: 0, lo: payout }),
    xdr.ScVal.scvU64(durationDays),
  ];
  return await invokeContract('create_policy', args);
}

export async function purchasePolicy(policyId) {
  const args = [xdr.ScVal.scvU64(policyId)];
  return await invokeContract('purchase_policy', args);
}

export async function fileClaim(policyId) {
  const args = [xdr.ScVal.scvU64(policyId)];
  return await invokeContract('file_claim', args);
}

export async function viewInsuranceStats() {
  return await invokeContract('view_insurance_stats');
}

export async function viewPolicyById(policyId) {
  const args = [xdr.ScVal.scvU64(policyId)];
  return await invokeContract('view_policy_by_id', args);
}

// Export wallet helper
export { getUserPublicKey as getPublicKey };
