#![allow(non_snake_case)]
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, log, Env, Symbol, String, symbol_short, Address, Vec};

// Structure to track overall insurance stats
#[contracttype]
#[derive(Clone, Debug)]
pub struct InsuranceStats {
    pub active_policies: u64,  // Count of active insurance policies
    pub claimed_policies: u64, // Count of policies with successful claims
    pub total_policies: u64,   // Total policies ever created
}

// Structure for individual insurance policy details
#[contracttype]
#[derive(Clone, Debug)]
pub struct Policy {
    pub policy_id: u64,        // Unique ID for the policy
    pub title: String,         // Policy title (e.g., "Crop Insurance")
    pub description: String,   // Policy description
    pub insurer: Address,      // Insurer (policy creator)
    pub insured: Option<Address>, // Insured user (policyholder), None until purchased
    pub premium: i128,         // Premium in stroops (not XLM directly)
    pub payout: i128,          // Payout amount in stroops
    pub start_time: u64,       // Policy start timestamp
    pub end_time: u64,         // Policy end timestamp
    pub is_active: bool,       // Whether the policy is active
    pub is_claimed: bool,      // Whether a claim has been made
}

// Enum for storing policies in storage
#[contracttype]
pub enum PolicyBook {
    Policy(u64),
}

// Constants for storage keys
const INSUR_STATS: Symbol = symbol_short!("I_STATS");
const COUNT_POLICY: Symbol = symbol_short!("C_POLICY");

#[contract]
pub struct InsurancePolicyContract;

#[contractimpl]
impl InsurancePolicyContract {
    /// Create a new insurance policy
    pub fn create_policy(
        env: Env,
        insurer: Address,
        title: String,
        description: String,
        premium: i128,
        payout: i128,
        duration_days: u64,
    ) -> u64 {
        insurer.require_auth(); // Ensure insurer authorizes this

        // Validate inputs
        assert!(premium > 0, "Premium must be positive");
        assert!(payout > 0, "Payout must be positive");
        assert!(duration_days > 0, "Duration must be positive");

        let mut count_policy: u64 = env.storage().instance().get(&COUNT_POLICY).unwrap_or(0);
        count_policy = count_policy.checked_add(1).expect("Policy count overflow");

        let time = env.ledger().timestamp();
        let end_time = time.checked_add(duration_days.checked_mul(86_400).expect("Duration overflow")).expect("End time overflow");

        let policy = Policy {
            policy_id: count_policy,
            title,
            description,
            insurer,
            insured: None, // No insured yet; set when purchased
            premium,
            payout,
            start_time: 0, // Set when purchased
            end_time,
            is_active: false,
            is_claimed: false,
        };

        let mut stats: InsuranceStats = Self::view_insurance_stats(env.clone());
        stats.total_policies = stats.total_policies.checked_add(1).expect("Total policies overflow");

        env.storage().instance().set(&PolicyBook::Policy(count_policy), &policy);
        env.storage().instance().set(&INSUR_STATS, &stats);
        env.storage().instance().set(&COUNT_POLICY, &count_policy);
        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Policy created with ID: {}", count_policy);
        count_policy
    }

    /// Purchase an insurance policy by paying the premium
    pub fn purchase_policy(env: Env, insured: Address, policy_id: u64) {
        insured.require_auth(); // Ensure insured authorizes this

        let mut policy = Self::view_policy_by_id(env.clone(), policy_id);
        if policy.is_active {
            panic!("Policy is already active!");
        }
        if policy.insured.is_some() {
            panic!("Policy already has an insured!");
        }

        let time = env.ledger().timestamp();
        if time >= policy.end_time {
            panic!("Policy has expired!");
        }

        // Simulate XLM transfer for premium (in practice, use env.transfer())
        log!(&env, "Insured {} pays {} stroops to insurer {}", insured, policy.premium, policy.insurer);

        policy.insured = Some(insured.clone());
        policy.start_time = time;
        policy.is_active = true;

        let mut stats = Self::view_insurance_stats(env.clone());
        stats.active_policies = stats.active_policies.checked_add(1).expect("Active policies overflow");

        env.storage().instance().set(&PolicyBook::Policy(policy_id), &policy);
        env.storage().instance().set(&INSUR_STATS, &stats);
        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Policy-ID: {} purchased by {}", policy_id, insured);
    }

    /// File a claim (simplified: assumes admin/oracle triggers payout)
    pub fn file_claim(env: Env, policy_id: u64, admin: Address) {
        let mut policy = Self::view_policy_by_id(env.clone(), policy_id);
        if !policy.is_active || policy.is_claimed {
            panic!("Policy is inactive or already claimed!");
        }

        let time = env.ledger().timestamp();
        if time >= policy.end_time {
            panic!("Policy has expired!");
        }

        admin.require_auth(); // Only admin (or oracle) can trigger claims

        policy.is_active = false;
        policy.is_claimed = true;

        // Simulate XLM payout (in practice, use env.transfer())
        if let Some(insured) = &policy.insured {
            log!(&env, "Payout of {} stroops sent to insured {}", policy.payout, insured);
        }

        let mut stats = Self::view_insurance_stats(env.clone());
        stats.active_policies = stats.active_policies.checked_sub(1).expect("Active policies underflow");
        stats.claimed_policies = stats.claimed_policies.checked_add(1).expect("Claimed policies overflow");

        env.storage().instance().set(&PolicyBook::Policy(policy_id), &policy);
        env.storage().instance().set(&INSUR_STATS, &stats);
        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Claim processed for Policy-ID: {}", policy_id);
    }

    /// View insurance stats
    pub fn view_insurance_stats(env: Env) -> InsuranceStats {
        env.storage().instance().get(&INSUR_STATS).unwrap_or(InsuranceStats {
            active_policies: 0,
            claimed_policies: 0,
            total_policies: 0,
        })
    }

    /// View policy details by ID
    pub fn view_policy_by_id(env: Env, policy_id: u64) -> Policy {
        let key = PolicyBook::Policy(policy_id);
        env.storage().instance().get(&key).unwrap_or_else(|| {
            panic!("Policy with ID {} not found", policy_id);
        })
    }
}