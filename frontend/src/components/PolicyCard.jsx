const PolicyCard = ({ policy, onPurchase, onClaim }) => {
    if (!policy || !policy.policyId) {
      return (
        <div className="p-4 bg-white rounded shadow">
          <p>Loading policy details...</p>
        </div>
      );
    }
  
    const {
      title = 'Untitled Policy',
      description = 'No description available',
      premium = 0,
      payout = 0,
      isActive = false,
      isClaimed = false,
      policyId,
    } = policy;
  
    return (
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p>{description}</p>
        <p>Premium: {(premium / 10000000).toFixed(7)} XLM</p>
        <p>Payout: {(payout / 10000000).toFixed(7)} XLM</p>
        <p>Status: {isActive ? 'Active' : 'Inactive'} {isClaimed ? '(Claimed)' : ''}</p>
        {!isActive && !isClaimed && (
          <button
            onClick={() => onPurchase(policyId)}
            className="mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Purchase
          </button>
        )}
        {isActive && !isClaimed && (
          <button
            onClick={() => onClaim(policyId)}
            className="mt-2 bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
          >
            File Claim
          </button>
        )}
      </div>
    );
  };
  
  export default PolicyCard;