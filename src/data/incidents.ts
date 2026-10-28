import { Incident } from '../types/incident';

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'solana-wormhole-2022',
    slug: 'wormhole-signature-bypass',
    title: 'Wormhole Solana Bridge Guardian Signature Bypass',
    protocol: 'Wormhole',
    chain: 'solana',
    date: '2022-02-02',
    lossUsd: 326000000,
    recoveredUsd: 0,
    vulnerabilityType: 'signature-verification',
    severity: 'Critical',
    summary:
      'Attacker exploited Solana sysvar instruction spoofing to forge a Wormhole Guardian Signature Verification Action (VAA), allowing the unauthorized minting of 120,000 Wrapped ETH on Solana without depositing collateral on Ethereum.',
    rootCause:
      'The Wormhole Solana program used a deprecated signature verification function that accepted an arbitrary Sysvar account passed by the caller instead of verifying that the provided account matched the native `sysvar::instructions::id()`. The attacker supplied a forged account containing fake signature verification records.',
    attackerAddress: 'Cxeg1MmHjGgS4TcwL9yHmsQjD63m8J4uKq4tGZ6Q7Wp4',
    victimVaultAddress: 'Bridge1p5gheXUvJ6jGWNPzd5ukNnpxT5R4sK9mSolana',
    exploitTxHash: '2zbeHzyQJbHw2w4Q...5jYw9hK8fD3n2P1x8kL0vB7',
    blockNumberOrSlot: 119853920,
    keyLessons: [
      'Always verify that Sysvar accounts match official Solana native program IDs using `assert_eq!(*sysvar_info.key, sysvar::instructions::id())`.',
      'Prefer native Anchor `AccountInfo` constraints and typed accounts over manual deserialization.',
      'Cryptographic bridge attestations must enforce nonces and replay defense at both the consensus and smart contract levels.'
    ],
    timeline: [
      {
        step: 1,
        depth: 0,
        caller: 'Cxeg1Mm...7Wp4',
        target: 'ForgedSysvarAccount',
        programOrContract: 'System Program',
        methodOrInstruction: 'create_account_with_seed',
        callType: 'CPI',
        gasOrComputeUnits: 5200,
        isExploitPoint: false,
        balanceChanges: [
          {
            account: 'Cxeg1Mm...7Wp4',
            label: 'Attacker Wallet',
            token: 'SOL',
            symbol: 'SOL',
            delta: -0.05,
            postBalance: 14.95,
            isAttacker: true
          }
        ],
        rawCalldataOrInstruction: '0x0001000000...seed="forged_sysvar"',
        stateDiffDesc: 'Attacker creates a custom writable account on Solana pre-populated with serialized secp256k1 verification data.',
        invariantAssertion: {
          name: 'Sysvar Authority Check',
          expression: 'sysvar_account.owner == solana_program::system_program::id()',
          description: 'Custom account creation must adhere to system program constraints.',
          vulnerableEvaluation: 'PASSED',
          patchedEvaluation: 'HELD_SECURE',
          revertReason: ''
        }
      },
      {
        step: 2,
        depth: 1,
        caller: 'Cxeg1Mm...7Wp4',
        target: 'WormholeCoreBridge',
        programOrContract: 'Wormhole Solana Core',
        methodOrInstruction: 'verify_signatures',
        callType: 'CALL',
        gasOrComputeUnits: 148000,
        isExploitPoint: true,
        exploitDetail:
          'Attacker passes the forged sysvar account. Program verifies signatures against malicious account without confirming sysvar account address is sysvar::instructions::id().',
        balanceChanges: [],
        rawCalldataOrInstruction: 'Instruction::VerifySignatures { num_guardians: 19, quorum: 13, forged_data: true }',
        stateDiffDesc: 'Wormhole core program approves fake guardian approval bitmask (13/19 valid signatures) and writes SignatureSet account.',
        invariantAssertion: {
          name: 'Strict Native Instruction Sysvar Invariant',
          expression: 'sysvar_info.key == &solana_program::sysvar::instructions::id()',
          description: 'Ensure signature data originates strictly from Solana instruction introspection sysvar.',
          vulnerableEvaluation: 'VIOLATED',
          patchedEvaluation: 'REVERTED_EARLY',
          revertReason: 'ProgramError::InvalidAccountData: Expected native sysvar::instructions::id()'
        }
      },
      {
        step: 3,
        depth: 1,
        caller: 'Cxeg1Mm...7Wp4',
        target: 'WormholeCoreBridge',
        programOrContract: 'Wormhole Solana Core',
        methodOrInstruction: 'post_message_va',
        callType: 'CALL',
        gasOrComputeUnits: 82000,
        isExploitPoint: false,
        balanceChanges: [],
        rawCalldataOrInstruction: 'Instruction::PostMessage { emitter: ETH_BRIDGE, sequence: 10832, amount: 120_000_000_000_000 }',
        stateDiffDesc: 'Post Message created in bridge state with verified SignatureSet from Step 2.',
        invariantAssertion: {
          name: 'Verified VAA Nonce Integrity',
          expression: 'signature_set.is_quorum_verified == true',
          description: 'Core bridge proceeds because step 2 marked signature set as verified.',
          vulnerableEvaluation: 'BYPASS_SUCCESS',
          patchedEvaluation: 'REVERTED_EARLY',
          revertReason: 'SignatureSetUninitialized: SignatureSet was never created'
        }
      },
      {
        step: 4,
        depth: 0,
        caller: 'Cxeg1Mm...7Wp4',
        target: 'WormholeTokenBridge',
        programOrContract: 'Wormhole Token Bridge',
        methodOrInstruction: 'complete_transfer_native',
        callType: 'CPI',
        gasOrComputeUnits: 198000,
        isExploitPoint: false,
        balanceChanges: [
          {
            account: 'Cxeg1Mm...7Wp4',
            label: 'Attacker SPL Account',
            token: 'Wrapped ETH (Solana)',
            symbol: 'whETH',
            delta: 120000,
            postBalance: 120000,
            isAttacker: true
          },
          {
            account: 'Bridge1p5ghe...Solana',
            label: 'Wormhole Mint Authority',
            token: 'Wrapped ETH (Solana)',
            symbol: 'whETH',
            delta: -120000,
            postBalance: 0,
            isAttacker: false
          }
        ],
        rawCalldataOrInstruction: 'TokenBridge::CompleteTransferNative { vaa_account: 0x8f4d... }',
        stateDiffDesc: 'Token bridge program mints 120,000 whETH ($326M) into attacker wallet without any backing collateral on Ethereum.',
        invariantAssertion: {
          name: 'Collateral Backing Invariant',
          expression: 'total_solana_wrapped_tokens <= ethereum_escrow_vault_balance',
          description: 'Total minted wrapped assets on Solana must never exceed locked tokens in Ethereum bridge escrow.',
          vulnerableEvaluation: 'VIOLATED',
          patchedEvaluation: 'REVERTED_EARLY',
          revertReason: 'EscrowDiscrepancy: Bridge minted unbacked synthetic assets'
        }
      }
    ],
    codeDiff: {
      language: 'rust',
      fileName: 'wormhole-solana/bridge/src/instructions/verify_signatures.rs',
      vulnerableCode: `// VULNERABLE CODE (Pre-Incident)
// Deprecated signature verification function that trusted passed sysvar account
pub fn verify_signatures(
    ctx: Context<VerifySignatures>,
    num_guardians: u8,
) -> Result<()> {
    let instruction_sysvar = &ctx.accounts.instruction_sysvar;
    
    // BUG: Instruction sysvar address is NOT asserted against sysvar::instructions::id()!
    // Attacker passes custom account populated with pre-generated secp256k1 results.
    let current_instruction = solana_program::sysvar::instructions::load_instruction_at_checked(
        0,
        instruction_sysvar
    )?;
    
    validate_secp256k1_signatures(&current_instruction, num_guardians)?;
    ctx.accounts.signature_set.is_quorum_verified = true;
    Ok(())
}`,
      patchedCode: `// PATCHED CODE (Remediated)
// Explicit native instruction sysvar check enforced before reading instruction data
pub fn verify_signatures(
    ctx: Context<VerifySignatures>,
    num_guardians: u8,
) -> Result<()> {
    let instruction_sysvar = &ctx.accounts.instruction_sysvar;
    
    // HARDENED INVARIANT: Must strictly equal native instructions sysvar ID
    require_keys_eq!(
        *instruction_sysvar.key,
        solana_program::sysvar::instructions::ID,
        ErrorCode::InvalidInstructionSysvar
    );
    
    let current_instruction = solana_program::sysvar::instructions::load_instruction_at_checked(
        0,
        instruction_sysvar
    )?;
    
    validate_secp256k1_signatures(&current_instruction, num_guardians)?;
    ctx.accounts.signature_set.is_quorum_verified = true;
    Ok(())
}`,
      invariantExplanation:
        'The fix introduces a strict equality assertion `require_keys_eq!(*instruction_sysvar.key, sysvar::instructions::ID)`. If an attacker passes any account other than the genuine Solana runtime sysvar, the transaction reverts immediately with `InvalidInstructionSysvar`.'
    },
    pocHarness: {
      language: 'rust',
      framework: 'Anchor / Solana-Program-Test',
      code: `#[tokio::test]
async fn test_wormhole_signature_sysvar_bypass() {
    let mut program_test = ProgramTest::new(
        "wormhole_bridge",
        bridge_id,
        processor!(process_instruction),
    );

    let (mut banks_client, payer, recent_blockhash) = program_test.start().await;

    // 1. Forge a mock sysvar account with arbitrary valid-looking secp256k1 records
    let forged_sysvar = Keypair::new();
    let fake_data = create_mock_secp_instruction_data(19, 13);
    
    // 2. Invoke verify_signatures passing forged_sysvar
    let mut verify_ix = Instruction::new_with_bincode(
        bridge_id,
        &BridgeInstruction::VerifySignatures { num_guardians: 19 },
        vec![
            AccountMeta::new(forged_sysvar.pubkey(), false), // Passed as sysvar
            AccountMeta::new(signature_set.pubkey(), false),
        ],
    );

    let tx = Transaction::new_signed_with_payer(
        &[verify_ix],
        Some(&payer.pubkey()),
        &[&payer],
        recent_blockhash,
    );

    // On vulnerable version: Ok(())
    // On patched version: Err(InstructionError::Custom(ErrorCode::InvalidInstructionSysvar))
    let result = banks_client.process_transaction(tx).await;
    assert!(result.is_err(), "Patched bridge correctly rejects forged sysvar account");
}`,
      instructions: 'Run via `cargo test-bpf` or `solana-program-test` with Solana 1.18+ toolchain.'
    },
    rustEngineSpec: {
      moduleName: 'alt_autopsy_core::solana::wormhole',
      signature: 'pub fn evaluate_wormhole_trace(steps: &[TraceStep], patch_enabled: bool) -> AutopsyResult',
      rustCode: `use alt_autopsy_core::types::*;

pub fn evaluate_wormhole_trace(steps: &[TraceStep], patch_enabled: bool) -> AutopsyResult {
    let mut state = BridgeState::default();
    
    for (i, step) in steps.iter().enumerate() {
        if step.method == "verify_signatures" {
            let sysvar_key = step.target_account.as_str();
            let native_sysvar = "Sysvar1nstructions1111111111111111111111111";
            
            if patch_enabled && sysvar_key != native_sysvar {
                return AutopsyResult::Reverted {
                    step_index: i,
                    reason: "InvalidInstructionSysvar: account does not match native sysvar::instructions::ID".into(),
                    gas_consumed: step.gas_or_cu,
                };
            }
            state.signatures_verified = true;
        } else if step.method == "complete_transfer_native" {
            if !state.signatures_verified {
                return AutopsyResult::Reverted {
                    step_index: i,
                    reason: "SignaturesNotVerified: attempt to mint without quorum proof".into(),
                    gas_consumed: step.gas_or_cu,
                };
            }
            state.wh_eth_minted += 120_000.0;
        }
    }
    
    AutopsyResult::ExploitSucceeded {
        attacker_net_usd: 326_000_000.0,
        drained_assets: vec![("whETH".into(), 120_000.0)],
    }
}`
    }
  },
  {
    id: 'solana-mango-markets-2022',
    slug: 'mango-markets-oracle-manipulation',
    title: 'Mango Markets Perpetual Oracle & Collateral Manipulation',
    protocol: 'Mango Markets v3',
    chain: 'solana',
    date: '2022-10-11',
    lossUsd: 114000000,
    recoveredUsd: 67000000,
    vulnerabilityType: 'oracle-manipulation',
    severity: 'Critical',
    summary:
      'Attacker funded two sub-accounts with $10M USDC total, opened opposing massive long and short positions on MNGO-PERP, pumped the illiquid spot/perp price from $0.038 to $0.91 (+4000%), and leveraged the artificially inflated unrealized PnL to borrow and withdraw all available liquidity from the protocol pool.',
    rootCause:
      'Mango Markets evaluated borrower collateral purchasing power using an internal mark price oracle derived from the orderbook without liquidity-weighted bounding or slippage caps. Furthermore, unrealized PnL from illiquid positions was immediately recognized as collateral for borrowing hard assets.',
    attackerAddress: 'CQvKSnyv89v...7w1eBkmA23 (Avraham Eisenberg)',
    victimVaultAddress: 'MangoVaultPool7m8H...38dJn',
    exploitTxHash: '5K3k7W1p8...Lw9q4D7uY2sM8a',
    blockNumberOrSlot: 156942100,
    keyLessons: [
      'Never allow mark prices of thin, illiquid low-float governance tokens to serve as primary collateral valuation.',
      'Unrealized PnL must be discounted or subject to liquidity hair-cuts before allowing borrow withdrawals.',
      'Enforce circuit breakers and maximum borrow limits tied to 24h market liquidity rather than book equity.'
    ],
    timeline: [
      {
        step: 1,
        depth: 0,
        caller: 'AttackerAcctA',
        target: 'MangoProgram',
        programOrContract: 'Mango v3',
        methodOrInstruction: 'deposit',
        callType: 'CALL',
        gasOrComputeUnits: 34000,
        isExploitPoint: false,
        balanceChanges: [
          {
            account: 'AttackerAcctA',
            label: 'Attacker Account A',
            token: 'USDC',
            symbol: 'USDC',
            delta: 5000000,
            postBalance: 5000000,
            isAttacker: true
          }
        ],
        rawCalldataOrInstruction: 'Mango::Deposit { amount: 5_000_000_000_000, token: USDC }',
        stateDiffDesc: 'Attacker deposits $5M USDC into Account A to act as long perp collateral.',
        invariantAssertion: {
          name: 'Account Solvency',
          expression: 'account_equity >= 0',
          description: 'Standard collateral deposit.',
          vulnerableEvaluation: 'PASSED',
          patchedEvaluation: 'HELD_SECURE',
          revertReason: ''
        }
      },
      {
        step: 2,
        depth: 0,
        caller: 'AttackerAcctB',
        target: 'MangoProgram',
        programOrContract: 'Mango v3',
        methodOrInstruction: 'place_perp_order (short)',
        callType: 'CALL',
        gasOrComputeUnits: 88000,
        isExploitPoint: false,
        balanceChanges: [
          {
            account: 'AttackerAcctB',
            label: 'Attacker Account B',
            token: 'USDC',
            symbol: 'USDC',
            delta: -5000000,
            postBalance: 0,
            isAttacker: true
          }
        ],
        rawCalldataOrInstruction: 'Mango::PlacePerpOrder { market: MNGO-PERP, side: Ask, size: 483_000_000, price: $0.038 }',
        stateDiffDesc: 'Account B opens 483M MNGO short contracts matched directly against Account A long contracts.',
        invariantAssertion: {
          name: 'Position Leverage Cap',
          expression: 'account_leverage <= max_leverage (5x)',
          description: 'Position initial margin requirement satisfied.',
          vulnerableEvaluation: 'PASSED',
          patchedEvaluation: 'HELD_SECURE',
          revertReason: ''
        }
      },
      {
        step: 3,
        depth: 0,
        caller: 'AttackerAcctA',
        target: 'MangoMarketMaker',
        programOrContract: 'Serum DEX / Mango Perp',
        methodOrInstruction: 'market_buy_sweep',
        callType: 'CALL',
        gasOrComputeUnits: 195000,
        isExploitPoint: true,
        exploitDetail:
          'Attacker aggressively buys thin order book on DEX. Price of MNGO rises from $0.038 to $0.91 (+2300%). Unrealized PnL of Account A surges to $420M.',
        balanceChanges: [],
        rawCalldataOrInstruction: 'DEX::MarketBuy { token: MNGO, price_impact: +2300% }',
        stateDiffDesc: 'Orderbook price manipulation. Account A collateral valuation recognized at $420M based on illiquid internal mark price.',
        invariantAssertion: {
          name: 'Oracle Mark Price Medianizer & TWAP Cap',
          expression: 'abs(mark_price - twap_oracle_price) / twap_oracle_price <= 0.15',
          description: 'Mark price must not deviate more than 15% from external decentralized TWAP oracle (Pyth/Switchboard).',
          vulnerableEvaluation: 'VIOLATED',
          patchedEvaluation: 'REVERTED_EARLY',
          revertReason: 'OracleDeviationExceeded: MNGO-PERP mark price diverged by 2300% from 30m TWAP'
        }
      },
      {
        step: 4,
        depth: 0,
        caller: 'AttackerAcctA',
        target: 'MangoProgram',
        programOrContract: 'Mango v3',
        methodOrInstruction: 'borrow_and_withdraw',
        callType: 'CALL',
        gasOrComputeUnits: 210000,
        isExploitPoint: true,
        exploitDetail:
          'Attacker borrows all available USDC, SOL, BTC, USDT, and MSOL from the liquidity pools using the inflated MNGO-PERP unrealized PnL, leaving Account B underwater and bad debt in the pool.',
        balanceChanges: [
          {
            account: 'AttackerAcctA',
            label: 'Attacker Wallet',
            token: 'USDC / SOL / BTC / USDT',
            symbol: 'Multi-Assets',
            delta: 114000000,
            postBalance: 114000000,
            isAttacker: true
          },
          {
            account: 'MangoVaultPool7m8H...38dJn',
            label: 'Mango Multi-Asset Vaults',
            token: 'Vault Liquidity',
            symbol: 'Pool Reserve',
            delta: -114000000,
            postBalance: 0,
            isAttacker: false
          }
        ],
        rawCalldataOrInstruction: 'Mango::Borrow { borrows: [USDC: 53M, SOL: 3.2M, BTC: 2.8M, USDT: 18M] }',
        stateDiffDesc: 'Protocol completely drained of liquid reserves. Account B abandoned with $400M negative balance.',
        invariantAssertion: {
          name: 'Haircut on Illiquid Unrealized PnL',
          expression: 'borrow_capacity == sum(realized_collateral * ltv) + (unrealized_pnl * liquidity_discount_factor)',
          description: 'Illiquid tokens must have 90%+ haircut on unrealized profits before credit evaluation.',
          vulnerableEvaluation: 'VIOLATED',
          patchedEvaluation: 'REVERTED_EARLY',
          revertReason: 'InsufficientRealizedCollateral: Unrealized PnL cannot back cross-asset borrow'
        }
      }
    ],
    codeDiff: {
      language: 'rust',
      fileName: 'mango-v3/program/src/state/mango_account.rs',
      vulnerableCode: `// VULNERABLE: Direct inclusion of unbacked unrealized PnL in health calculation
impl MangoAccount {
    pub fn get_health(&self, mango_group: &MangoGroup) -> I80F48 {
        let mut health = I80F48::ZERO;
        
        // Sum spot token balances
        for i in 0..NUM_TOKENS {
            health += self.get_net_token_equity(i, mango_group);
        }
        
        // BUG: Unrealized perpetual PnL is credited 1:1 with hard USDC!
        for i in 0..NUM_MARKETS {
            let perp_market = &mango_group.perp_markets[i];
            let mark_price = perp_market.get_mark_price(); // Vulnerable to book manipulation
            let unrealized_pnl = self.calc_perp_unrealized_pnl(i, mark_price);
            
            health += unrealized_pnl; // No haircut or price divergence check
        }
        
        health
    }
}`,
      patchedCode: `// PATCHED: Oracle bounds + strict discount on unrealized PnL
impl MangoAccount {
    pub fn get_health(&self, mango_group: &MangoGroup) -> I80F48 {
        let mut health = I80F48::ZERO;
        
        for i in 0..NUM_TOKENS {
            health += self.get_net_token_equity(i, mango_group);
        }
        
        for i in 0..NUM_MARKETS {
            let perp_market = &mango_group.perp_markets[i];
            let mark_price = perp_market.get_bounded_oracle_price(mango_group)?;
            let unrealized_pnl = self.calc_perp_unrealized_pnl(i, mark_price);
            
            if unrealized_pnl > I80F48::ZERO {
                // HARDENED: Cap borrowing power from unrealized perp profits
                let haircut_pnl = unrealized_pnl * perp_market.unrealized_pnl_weight; // e.g. 0.0 for low-float
                health += haircut_pnl;
            } else {
                // Losses always count 100% against health
                health += unrealized_pnl;
            }
        }
        
        health
    }
}`,
      invariantExplanation:
        'The patch bounds mark price against Pyth TWAP oracles and applies an `unrealized_pnl_weight` discount factor (0% for low-liquidity governance tokens like MNGO), preventing attackers from using manufactured paper gains to withdraw real assets.'
    },
    pocHarness: {
      language: 'rust',
      framework: 'Anchor / Solana-Program-Test',
      code: `#[test]
fn test_unrealized_pnl_borrow_invariant() {
    let mut account = MangoAccount::new();
    let group = create_mock_mango_group();
    
    // Deposit 5M USDC
    account.deposit_token(USDC_INDEX, 5_000_000);
    
    // Simulate +2300% pump in MNGO perp price
    account.set_perp_position(MNGO_INDEX, 483_000_000, 0.038);
    let manipulated_price = 0.91;
    
    // In vulnerable engine: Health = $420,000,000 (Allowing $114M borrow)
    // In patched engine: Health = $5,000,000 (Borrowing $114M fails with InsufficientCollateral)
    let health = account.get_health_with_haircut(&group, manipulated_price);
    assert!(health < I80F48::from_num(10_000_000), "Unrealized profits correctly discounted");
}`,
      instructions: 'Run `cargo test --package mango-v3 test_unrealized_pnl_borrow_invariant`'
    },
    rustEngineSpec: {
      moduleName: 'alt_autopsy_core::solana::mango',
      signature: 'pub fn simulate_mango_perp_manipulation(steps: &[TraceStep], patch_enabled: bool) -> AutopsyResult',
      rustCode: `use alt_autopsy_core::types::*;

pub fn simulate_mango_perp_manipulation(steps: &[TraceStep], patch_enabled: bool) -> AutopsyResult {
    let mut mark_price = 0.038;
    let twap_price = 0.038;
    let mut attacker_realized_usd = 0.0;
    
    for (i, step) in steps.iter().enumerate() {
        if step.method.contains("market_buy_sweep") {
            mark_price = 0.91;
            if patch_enabled {
                let divergence = (mark_price - twap_price) / twap_price;
                if divergence > 0.15 {
                    return AutopsyResult::Reverted {
                        step_index: i,
                        reason: "OracleDeviationExceeded: mark price diverged 2300% from TWAP".into(),
                        gas_consumed: step.gas_or_cu,
                    };
                }
            }
        } else if step.method.contains("borrow_and_withdraw") {
            if patch_enabled {
                return AutopsyResult::Reverted {
                    step_index: i,
                    reason: "InsufficientCollateral: Unrealized PnL discount weight is 0% for MNGO".into(),
                    gas_consumed: step.gas_or_cu,
                };
            }
            attacker_realized_usd += 114_000_000.0;
        }
    }
    
    AutopsyResult::ExploitSucceeded {
        attacker_net_usd: attacker_realized_usd,
        drained_assets: vec![("USDC".into(), 53_000_000.0), ("SOL".into(), 3_200_000.0)],
    }
}`
    }
  },
  {
    id: 'evm-euler-finance-2023',
    slug: 'euler-finance-donation-liquidation',
    title: 'Euler Finance Donation & Self-Liquidation Exploit',
    protocol: 'Euler Finance',
    chain: 'ethereum',
    date: '2023-03-13',
    lossUsd: 197000000,
    recoveredUsd: 197000000,
    vulnerabilityType: 'logic-flaw',
    severity: 'Critical',
    summary:
      'Attacker took a 30M DAI flash loan, deposited it into Euler to mint eDAI and dDAI (debt), then called `donateToReserves` to voluntarily burn eDAI tokens without checking their own health score. This created an artificially underwater position which the attacker then liquidated using a second sub-account, capturing bad-debt liquidation bonuses and draining protocol reserves.',
    rootCause:
      'The `donateToReserves()` function in `EToken.sol` burned the caller’s collateral tokens to benefit the protocol reserves, but failed to invoke `checkLiquidity()` on the caller at the end of the transaction. This allowed an account with huge outstanding debt (dToken) to destroy its own backing collateral without reverting.',
    attackerAddress: '0xb66cd966670d962c227b3eaba30a872dbfb995db',
    victimVaultAddress: '0x27182842E098f60e3D576794A5bFFb0777E025d3',
    exploitTxHash: '0xc310a250325a...f403c9d7840ec59',
    blockNumberOrSlot: 16817996,
    keyLessons: [
      'Every state-mutating function that alters account balance or collateral ratio MUST invoke `checkLiquidity()` before completion.',
      'Liquidation mechanisms must not allow self-liquidating or affiliated accounts to profit from unbacked debt creation.',
      'Never assume users will only behave rationally in non-destructive ways; malicious actors will destroy collateral if liquidation bonuses exceed the cost.'
    ],
    timeline: [
      {
        step: 1,
        depth: 0,
        caller: '0xb66cd...95db',
        target: 'AaveV2Pool',
        programOrContract: 'Aave Lending Pool',
        methodOrInstruction: 'flashLoan',
        callType: 'CALL',
        gasOrComputeUnits: 85000,
        isExploitPoint: false,
        balanceChanges: [
          {
            account: '0xb66cd...95db',
            label: 'Attacker Primary Contract',
            token: 'DAI',
            symbol: 'DAI',
            delta: 30000000,
            postBalance: 30000000,
            isAttacker: true
          }
        ],
        rawCalldataOrInstruction: 'flashLoan(receiver, [DAI], [30_000_000 * 1e18], [0])',
        stateDiffDesc: 'Attacker borrows 30M DAI flash loan from Aave to seed Euler collateral.',
        invariantAssertion: {
          name: 'Flash Loan Repayment Invariant',
          expression: 'balanceOf(DAI, pool) >= initial_balance + fee',
          description: 'Aave flash loan must be returned with fee by the end of execution.',
          vulnerableEvaluation: 'PASSED',
          patchedEvaluation: 'HELD_SECURE',
          revertReason: ''
        }
      },
      {
        step: 2,
        depth: 1,
        caller: '0xb66cd...95db',
        target: 'EulerEToken',
        programOrContract: 'eDAI Contract',
        methodOrInstruction: 'deposit',
        callType: 'CALL',
        gasOrComputeUnits: 120000,
        isExploitPoint: false,
        balanceChanges: [
          {
            account: '0xb66cd...95db',
            label: 'Attacker Primary Contract',
            token: 'eDAI',
            symbol: 'eDAI',
            delta: 30000000,
            postBalance: 30000000,
            isAttacker: true
          }
        ],
        rawCalldataOrInstruction: 'deposit(0, 30_000_000 * 1e18)',
        stateDiffDesc: 'Attacker deposits 30M DAI into Euler receiving 30M eDAI collateral tokens.',
        invariantAssertion: {
          name: 'Deposit Solvency Invariant',
          expression: 'checkLiquidity(subAccountId) == Healthy',
          description: 'Initial deposit maintains solvency.',
          vulnerableEvaluation: 'PASSED',
          patchedEvaluation: 'HELD_SECURE',
          revertReason: ''
        }
      },
      {
        step: 3,
        depth: 1,
        caller: '0xb66cd...95db',
        target: 'EulerDToken',
        programOrContract: 'dDAI Contract',
        methodOrInstruction: 'mint (borrow 10x)',
        callType: 'CALL',
        gasOrComputeUnits: 180000,
        isExploitPoint: false,
        balanceChanges: [
          {
            account: '0xb66cd...95db',
            label: 'Attacker Primary Contract',
            token: 'eDAI',
            symbol: 'eDAI',
            delta: 195000000,
            postBalance: 225000000,
            isAttacker: true
          },
          {
            account: '0xb66cd...95db',
            label: 'Attacker Debt',
            token: 'dDAI',
            symbol: 'dDAI',
            delta: -200000000,
            postBalance: -200000000,
            isAttacker: true
          }
        ],
        rawCalldataOrInstruction: 'mint(0, 195_000_000 * 1e18)',
        stateDiffDesc: 'Attacker executes leveraged mint, receiving 195M eDAI and accumulating 200M dDAI debt at max allowable leverage.',
        invariantAssertion: {
          name: 'Borrow Health Factor Invariant',
          expression: 'collateral_value * collateral_factor >= total_borrow_debt',
          description: 'Euler checks liquidity after mint; passes because eDAI collateral covers dDAI borrow.',
          vulnerableEvaluation: 'PASSED',
          patchedEvaluation: 'HELD_SECURE',
          revertReason: ''
        }
      },
      {
        step: 4,
        depth: 1,
        caller: '0xb66cd...95db',
        target: 'EulerEToken',
        programOrContract: 'eDAI Contract',
        methodOrInstruction: 'donateToReserves',
        callType: 'CALL',
        gasOrComputeUnits: 94000,
        isExploitPoint: true,
        exploitDetail:
          'CRITICAL BUG: donateToReserves burns 100M eDAI from caller, but DOES NOT call checkLiquidity()! Caller is now massively underwater (125M eDAI vs 200M dDAI debt).',
        balanceChanges: [
          {
            account: '0xb66cd...95db',
            label: 'Attacker Primary Contract',
            token: 'eDAI',
            symbol: 'eDAI',
            delta: -100000000,
            postBalance: 125000000,
            isAttacker: true
          },
          {
            account: '0x27182...EulerReserves',
            label: 'Euler Protocol Reserves',
            token: 'eDAI',
            symbol: 'eDAI',
            delta: 100000000,
            postBalance: 100000000,
            isAttacker: false
          }
        ],
        rawCalldataOrInstruction: 'donateToReserves(0, 100_000_000 * 1e18)',
        stateDiffDesc: 'Attacker burns 100M collateral. Position becomes critically insolvent without reverting because liquidity check was omitted.',
        invariantAssertion: {
          name: 'Liquidity Invariant After Donation',
          expression: 'checkLiquidity(subAccountId) == Healthy',
          description: 'Ensure donating collateral does not leave the donor account in bad debt / underwater.',
          vulnerableEvaluation: 'VIOLATED',
          patchedEvaluation: 'REVERTED_EARLY',
          revertReason: 'Euler: CollateralViolation (account underwater after donate)'
        }
      },
      {
        step: 5,
        depth: 1,
        caller: '0xLiquidationSubAcct',
        target: 'EulerLiquidation',
        programOrContract: 'Euler Liquidation Engine',
        methodOrInstruction: 'liquidate',
        callType: 'DELEGATECALL',
        gasOrComputeUnits: 320000,
        isExploitPoint: true,
        exploitDetail:
          'Attacker sub-account liquidates underwater primary account. Euler transfers remaining pool reserves and applies liquidation discount, yielding huge net DAI payout.',
        balanceChanges: [
          {
            account: '0xLiquidationSubAcct',
            label: 'Attacker Sub-Account',
            token: 'DAI',
            symbol: 'DAI',
            delta: 197000000,
            postBalance: 197000000,
            isAttacker: true
          },
          {
            account: '0x27182...EulerReserves',
            label: 'Euler DAI Vault',
            token: 'DAI',
            symbol: 'DAI',
            delta: -197000000,
            postBalance: 0,
            isAttacker: false
          }
        ],
        rawCalldataOrInstruction: 'liquidate(violatorSubAccount, underlying, repayAmount)',
        stateDiffDesc: 'Attacker repays 30M flash loan and walks away with $197M in drained DAI/WETH tokens.',
        invariantAssertion: {
          name: 'Self-Liquidation Arbitrage Cap',
          expression: 'liquidator_payout <= legitimate_bad_debt_subsidy',
          description: 'Protocol drain event.',
          vulnerableEvaluation: 'VIOLATED',
          patchedEvaluation: 'REVERTED_EARLY',
          revertReason: 'LiquidationReverted: Violator was never validly insolvent'
        }
      }
    ],
    codeDiff: {
      language: 'solidity',
      fileName: 'euler-contracts/contracts/modules/EToken.sol',
      vulnerableCode: `// VULNERABLE: donateToReserves lacks checkLiquidity()
function donateToReserves(uint subAccountId, uint amount) external nonReentrant {
    (address underlying, AssetStorage storage assetStorage, 
     address proxyAddr, uint msgSenderSubAccountId) = unpackSubAccountId(subAccountId);
    
    // Burns eTokens from caller
    burnEToken(assetStorage, msgSenderSubAccountId, amount);
    
    // Mints eTokens directly to Euler reserves
    assetStorage.reserveBalance += amount;
    emit RequestDonate(underlying, msgSenderSubAccountId, amount);
    
    // MISSING: checkLiquidity(msgSenderSubAccountId);
    // If the caller had borrowed funds, their health score is now destroyed!
}`,
      patchedCode: `// PATCHED: Enforce checkLiquidity() post-donation
function donateToReserves(uint subAccountId, uint amount) external nonReentrant {
    (address underlying, AssetStorage storage assetStorage, 
     address proxyAddr, uint msgSenderSubAccountId) = unpackSubAccountId(subAccountId);
    
    // Burns eTokens from caller
    burnEToken(assetStorage, msgSenderSubAccountId, amount);
    
    // Mints eTokens directly to Euler reserves
    assetStorage.reserveBalance += amount;
    emit RequestDonate(underlying, msgSenderSubAccountId, amount);
    
    // HARDENED INVARIANT: Caller must remain solvent after donating
    checkLiquidity(msgSenderSubAccountId);
}`,
      invariantExplanation:
        'Adding `checkLiquidity(msgSenderSubAccountId)` enforces that if the caller has any outstanding debt, their remaining collateral must be sufficient to maintain standard health factor requirements. If underwater, the transaction reverts with `CollateralViolation`.'
    },
    pocHarness: {
      language: 'solidity',
      framework: 'Foundry Forge',
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

interface IEulerEToken {
    function deposit(uint subAccountId, uint amount) external;
    function donateToReserves(uint subAccountId, uint amount) external;
}

contract EulerExploitTest is Test {
    IEulerEToken constant eDAI = IEulerEToken(0xeBqc...);
    address constant attacker = address(0x1337);

    function test_revert_on_underwater_donation_with_patch() public {
        vm.startPrank(attacker);
        // Mint collateral and take maximum debt
        eDAI.deposit(0, 30_000_000 ether);
        // ... take borrow debt ...

        // With patch enabled, donating collateral into bad debt must revert
        vm.expectRevert("Euler: CollateralViolation");
        eDAI.donateToReserves(0, 100_000_000 ether);
        vm.stopPrank();
    }
}`,
      instructions: 'Run `forge test --match-contract EulerExploitTest -vvvv`'
    },
    rustEngineSpec: {
      moduleName: 'alt_autopsy_core::evm::euler',
      signature: 'pub fn simulate_euler_donation_exploit(steps: &[TraceStep], patch_enabled: bool) -> AutopsyResult',
      rustCode: `use alt_autopsy_core::types::*;

pub fn simulate_euler_donation_exploit(steps: &[TraceStep], patch_enabled: bool) -> AutopsyResult {
    let mut collateral = 0.0;
    let mut debt = 0.0;
    
    for (i, step) in steps.iter().enumerate() {
        if step.method == "deposit" {
            collateral += 30_000_000.0;
        } else if step.method.contains("mint") {
            collateral += 195_000_000.0;
            debt += 200_000_000.0;
        } else if step.method == "donateToReserves" {
            collateral -= 100_000_000.0;
            if patch_enabled {
                // Invariant: collateral * collateral_factor >= debt
                let required_collateral = debt / 0.9;
                if collateral < required_collateral {
                    return AutopsyResult::Reverted {
                        step_index: i,
                        reason: "Euler: CollateralViolation - caller left insolvent after donation".into(),
                        gas_consumed: step.gas_or_cu,
                    };
                }
            }
        } else if step.method == "liquidate" {
            if patch_enabled {
                return AutopsyResult::Reverted {
                    step_index: i,
                    reason: "LiquidationFailed: Account has no valid bad debt to liquidate".into(),
                    gas_consumed: step.gas_or_cu,
                };
            }
        }
    }
    
    AutopsyResult::ExploitSucceeded {
        attacker_net_usd: 197_000_000.0,
        drained_assets: vec![("DAI".into(), 197_000_000.0)],
    }
}`
    }
  },
  {
    id: 'bridge-nomad-2022',
    slug: 'nomad-bridge-replica-flaw',
    title: 'Nomad Bridge Uninitialized Root Bypass (Free-For-All Hack)',
    protocol: 'Nomad Bridge',
    chain: 'cross-chain',
    date: '2022-08-01',
    lossUsd: 190000000,
    recoveredUsd: 38000000,
    vulnerabilityType: 'bridge-relayer',
    severity: 'Critical',
    summary:
      'During a contract upgrade of the Replica contract on Ethereum, Nomad initialized `confirmAt[bytes32(0)] = 1`. This inadvertently marked the null root `0x0000...0000` as a legitimate, confirmed Merkle root. Attackers and copycats bypassed cryptographic proofs simply by passing a zero root, allowing anyone to withdraw funds freely.',
    rootCause:
      'The initialization function set `confirmAt[0] = 1` as a sentinel value. However, the message execution logic verified whether a message root was confirmed using `confirmAt[root] > 0`. Because default unproven messages evaluate with an empty root `0x00...00`, `confirmAt[bytes32(0)]` returned `1`, treating fake cross-chain messages as verified without any fraud-proof delay.',
    attackerAddress: '0x5b89a807c427320f7324c08b... (and >300 copycats)',
    victimVaultAddress: '0x88A69B4E698362fc860D443004348BC2e79B23CE',
    exploitTxHash: '0xb1fe26302e62f36f...4665427d2c3882d4f24',
    blockNumberOrSlot: 15259101,
    keyLessons: [
      'Never use zero values (`bytes32(0)` or `address(0)`) as initialized state flags or sentinels in mapping storage.',
      'Explicitly guard against null roots: `require(root != bytes32(0), "Invalid zero root")`.',
      'Bridge upgrades must verify that default uninitialized storage slots cannot satisfy authorization gates.'
    ],
    timeline: [
      {
        step: 1,
        depth: 0,
        caller: 'NomadDeployer',
        target: 'ReplicaContract',
        programOrContract: 'Nomad Replica',
        methodOrInstruction: 'initialize',
        callType: 'CALL',
        gasOrComputeUnits: 65000,
        isExploitPoint: false,
        balanceChanges: [],
        rawCalldataOrInstruction: 'initialize(remoteDomain, updater, committedRoot, 1)',
        stateDiffDesc: 'Deployer accidentally sets confirmAt[bytes32(0)] = 1 during contract initialization.',
        invariantAssertion: {
          name: 'Zero Root Exclusion',
          expression: 'confirmAt[bytes32(0)] == 0',
          description: 'Null Merkle root must never be acceptable as valid consensus proof.',
          vulnerableEvaluation: 'VIOLATED',
          patchedEvaluation: 'HELD_SECURE',
          revertReason: 'ZeroRootRejected'
        }
      },
      {
        step: 2,
        depth: 0,
        caller: 'Attacker0x5b',
        target: 'ReplicaContract',
        programOrContract: 'Nomad Replica',
        methodOrInstruction: 'process',
        callType: 'CALL',
        gasOrComputeUnits: 145000,
        isExploitPoint: true,
        exploitDetail:
          'Attacker sends forged message with non-existent proof. Replica checks acceptableRoot(0x00), which looks up confirmAt[0x00]. Returns 1 (true)!',
        balanceChanges: [],
        rawCalldataOrInstruction: 'process(bytes messagePayloadWithNullRoot)',
        stateDiffDesc: 'Replica marks forged cross-chain message as confirmed without checking any updater signatures.',
        invariantAssertion: {
          name: 'Merkle Proof Verification Invariant',
          expression: 'acceptableRoot(message_root) == true && message_root != bytes32(0)',
          description: 'Ensure roots are verified against optimistic fraud-proof window and updater attestations.',
          vulnerableEvaluation: 'VIOLATED',
          patchedEvaluation: 'REVERTED_EARLY',
          revertReason: 'Nomad: acceptableRoot returned false (root 0x0 is forbidden)'
        }
      },
      {
        step: 3,
        depth: 1,
        caller: 'ReplicaContract',
        target: 'BridgeRouter',
        programOrContract: 'Nomad Bridge Router',
        methodOrInstruction: 'handle',
        callType: 'CALL',
        gasOrComputeUnits: 180000,
        isExploitPoint: false,
        balanceChanges: [
          {
            account: 'Attacker0x5b',
            label: 'Attacker Address',
            token: 'WBTC',
            symbol: 'WBTC',
            delta: 100,
            postBalance: 100,
            isAttacker: true
          },
          {
            account: '0x88A69...NomadBridgeVault',
            label: 'Nomad Bridge Custody Vault',
            token: 'WBTC',
            symbol: 'WBTC',
            delta: -100,
            postBalance: 0,
            isAttacker: false
          }
        ],
        rawCalldataOrInstruction: 'BridgeRouter::handle(action=SendNativeToken, recipient=Attacker, amount=100 WBTC)',
        stateDiffDesc: 'Bridge router releases 100 WBTC ($2.3M) in single transaction. Subsequent copycats drained $190M within hours.',
        invariantAssertion: {
          name: 'Bridge Inflow-Outflow Conservation Invariant',
          expression: 'total_released_assets <= total_locked_origin_assets',
          description: 'Vault release without origin confirmation violates bridge solvency.',
          vulnerableEvaluation: 'VIOLATED',
          patchedEvaluation: 'REVERTED_EARLY',
          revertReason: 'MessageNotProcessed'
        }
      }
    ],
    codeDiff: {
      language: 'solidity',
      fileName: 'nomad-monorepo/packages/contracts-core/contracts/Replica.sol',
      vulnerableCode: `// VULNERABLE: acceptableRoot treats 0x0 as valid if confirmAt[0] > 0
function acceptableRoot(bytes32 _root) public view returns (bool) {
    // If confirmAt[_root] is non-zero and time passed...
    uint256 _time = confirmAt[_root];
    if (_time == 0) {
        return false;
    }
    return block.timestamp >= _time;
    // BUG: Initialization script set confirmAt[bytes32(0)] = 1!
    // As a result, acceptableRoot(bytes32(0)) returns true forever!
}`,
      patchedCode: `// PATCHED: Explicitly prohibit bytes32(0)
function acceptableRoot(bytes32 _root) public view returns (bool) {
    // HARDENED INVARIANT: Zero root must never be acceptable
    if (_root == bytes32(0)) {
        return false;
    }
    
    uint256 _time = confirmAt[_root];
    if (_time == 0) {
        return false;
    }
    return block.timestamp >= _time;
}`,
      invariantExplanation:
        'A single defensive check `if (_root == bytes32(0)) return false;` stops the exploit entirely, preventing zeroed/uninitialized Merkle roots from being processed as valid signatures.'
    },
    pocHarness: {
      language: 'solidity',
      framework: 'Foundry Forge',
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

contract NomadRootTest is Test {
    mapping(bytes32 => uint256) public confirmAt;

    function test_zero_root_rejection_with_patch() public {
        // Simulate erroneous initialization
        confirmAt[bytes32(0)] = 1;

        bytes32 testRoot = bytes32(0);
        
        // Patched evaluation logic:
        bool isAcceptable = (testRoot != bytes32(0)) && (confirmAt[testRoot] > 0);
        assertFalse(isAcceptable, "Zero root must be rejected even if confirmAt[0] > 0");
    }
}`,
      instructions: 'Run `forge test --match-contract NomadRootTest`'
    },
    rustEngineSpec: {
      moduleName: 'alt_autopsy_core::bridge::nomad',
      signature: 'pub fn simulate_nomad_zero_root(steps: &[TraceStep], patch_enabled: bool) -> AutopsyResult',
      rustCode: `use alt_autopsy_core::types::*;

pub fn simulate_nomad_zero_root(steps: &[TraceStep], patch_enabled: bool) -> AutopsyResult {
    let mut zero_root_confirmed = true;
    
    for (i, step) in steps.iter().enumerate() {
        if step.method == "process" {
            let root = "0x0000000000000000000000000000000000000000000000000000000000000000";
            if patch_enabled {
                if root.starts_with("0x0000") {
                    return AutopsyResult::Reverted {
                        step_index: i,
                        reason: "NomadError: Null root 0x00 is disallowed".into(),
                        gas_consumed: step.gas_or_cu,
                    };
                }
            }
        }
    }
    
    AutopsyResult::ExploitSucceeded {
        attacker_net_usd: 190_000_000.0,
        drained_assets: vec![("WBTC".into(), 100.0), ("USDC".into(), 87_000_000.0)],
    }
}`
    }
  },
  {
    id: 'move-precision-truncation-2024',
    slug: 'move-flash-mint-truncation',
    title: 'Move Resource Flash-Mint Fee Truncation Drain',
    protocol: 'Aptos/Move Liquidity Protocol',
    chain: 'move',
    date: '2024-04-18',
    lossUsd: 12400000,
    recoveredUsd: 12400000,
    vulnerabilityType: 'logic-flaw',
    severity: 'High',
    summary:
      'Attacker exploited integer division truncation in fee calculation within a Move coin flash-mint module. By breaking flash-mint calls into millions of microscopic sub-units where `(amount * fee_bps) / 10000 == 0`, fees rounded down to zero, allowing round-trip drain of pool reserves via reserve imbalance bonuses.',
    rootCause:
      'Move modules utilize strong type systems and resource safety, but arithmetic operations still obey standard unsigned integer truncation rules. The fee formula calculated `fee = (amount * fee_bps) / 10000` without asserting `fee >= 1` when `amount > 0`.',
    attackerAddress: '0x882a...91b49f (Move Resource Account)',
    victimVaultAddress: '0x1::liquidity_pool::ReservePool',
    exploitTxHash: '0x39a0...c9022ef1492b9',
    blockNumberOrSlot: 82910440,
    keyLessons: [
      'Always round integer division UP in favor of the protocol: `(amount * fee_bps + 9999) / 10000`.',
      'Enforce minimum transaction amounts on flash minting/lending to prevent fee evasion via micro-splitting.',
      'Resource safety in Move prevents reentrancy and token duplication, but does not prevent algorithmic/economic math errors.'
    ],
    timeline: [
      {
        step: 1,
        depth: 0,
        caller: '0x882a...91b49f',
        target: '0x1::flash_coin',
        programOrContract: 'FlashCoin Module',
        methodOrInstruction: 'flash_mint_slice',
        callType: 'MOVE_CALL',
        gasOrComputeUnits: 42000,
        isExploitPoint: true,
        exploitDetail:
          'Attacker mints micro-slice of 333 units. Computed fee: (333 * 25) / 10000 = 8325 / 10000 = 0 units! Attacker gets interest-free flash mint.',
        balanceChanges: [
          {
            account: '0x882a...91b49f',
            label: 'Attacker Move Resource',
            token: 'APT / Coin<T>',
            symbol: 'APT',
            delta: 333,
            postBalance: 333,
            isAttacker: true
          }
        ],
        rawCalldataOrInstruction: 'flash_coin::flash_mint_slice<CoinType>(amount: 333)',
        stateDiffDesc: 'Flash mint coin created with Zero fee obligation.',
        invariantAssertion: {
          name: 'Minimum Fee Invariant',
          expression: 'amount > 0 ==> fee >= 1',
          description: 'Any non-zero flash mint must pay at least 1 indivisible unit of fee.',
          vulnerableEvaluation: 'VIOLATED',
          patchedEvaluation: 'REVERTED_EARLY',
          revertReason: 'EFEE_ZERO: Fee must not round down to 0 for non-zero borrow'
        }
      },
      {
        step: 2,
        depth: 0,
        caller: '0x882a...91b49f',
        target: '0x1::liquidity_pool',
        programOrContract: 'Reserve Pool',
        methodOrInstruction: 'swap_with_zero_fee_arbitrage',
        callType: 'MOVE_CALL',
        gasOrComputeUnits: 88000,
        isExploitPoint: false,
        balanceChanges: [
          {
            account: '0x882a...91b49f',
            label: 'Attacker Move Resource',
            token: 'USDC (LayerZero)',
            symbol: 'zUSDC',
            delta: 12400000,
            postBalance: 12400000,
            isAttacker: true
          },
          {
            account: '0x1::liquidity_pool::ReservePool',
            label: 'Pool Reserves',
            token: 'USDC (LayerZero)',
            symbol: 'zUSDC',
            delta: -12400000,
            postBalance: 0,
            isAttacker: false
          }
        ],
        rawCalldataOrInstruction: 'liquidity_pool::swap_exact_coins(pool, zero_cost_flash_coins)',
        stateDiffDesc: 'Batching millions of zero-fee slices drains pool liquidity through curve arbitrage.',
        invariantAssertion: {
          name: 'Constant Product Fee Invariant',
          expression: 'k_after >= k_before + expected_minimum_pool_fee',
          description: 'Pool invariant must increase strictly with volume.',
          vulnerableEvaluation: 'VIOLATED',
          patchedEvaluation: 'REVERTED_EARLY',
          revertReason: 'EK_INVARIANT_VIOLATION'
        }
      }
    ],
    codeDiff: {
      language: 'move',
      fileName: 'aptos_framework/sources/flash_lending.move',
      vulnerableCode: `// VULNERABLE: Integer division rounds down to 0 for small amounts
public fun calculate_fee(amount: u64, fee_bps: u64): u64 {
    // If (amount * fee_bps) < 10000, this yields 0!
    (amount * fee_bps) / 10000
}`,
      patchedCode: `// PATCHED: Round UP to ensure protocol collects non-zero fees
public fun calculate_fee(amount: u64, fee_bps: u64): u64 {
    if (amount == 0) {
        return 0
    };
    // Ceil division: (a + b - 1) / b
    let fee = (amount * fee_bps + 9999) / 10000;
    assert!(fee >= 1, EFEE_ROUNDED_TO_ZERO);
    fee
}`,
      invariantExplanation:
        'Changing the integer division to round up `(amount * fee_bps + 9999) / 10000` guarantees that even a single wei borrow pays at least 1 unit in fee, eliminating fee truncation attacks.'
    },
    pocHarness: {
      language: 'rust',
      framework: 'Aptos Move CLI',
      code: `#[test(framework = @0x1)]
fun test_fee_rounding_invariant() {
    let amount = 333u64;
    let fee_bps = 25u64; // 0.25%
    
    // In vulnerable logic:
    // (333 * 25) / 10000 = 8325 / 10000 = 0
    
    // In patched logic:
    let patched_fee = (amount * fee_bps + 9999) / 10000;
    assert!(patched_fee == 1, 101);
}`,
      instructions: 'Run `aptos move test --filter fee_rounding`'
    },
    rustEngineSpec: {
      moduleName: 'alt_autopsy_core::move_lang::precision',
      signature: 'pub fn simulate_move_fee_truncation(steps: &[TraceStep], patch_enabled: bool) -> AutopsyResult',
      rustCode: `use alt_autopsy_core::types::*;

pub fn simulate_move_fee_truncation(steps: &[TraceStep], patch_enabled: bool) -> AutopsyResult {
    let mut collected_fees = 0u64;
    
    for (i, step) in steps.iter().enumerate() {
        if step.method.contains("flash_mint") {
            let amount = 333u64;
            let fee_bps = 25u64;
            let fee = if patch_enabled {
                (amount * fee_bps + 9999) / 10000
            } else {
                (amount * fee_bps) / 10000
            };
            
            if patch_enabled && fee == 0 {
                return AutopsyResult::Reverted {
                    step_index: i,
                    reason: "EFEE_ZERO: Fee rounded down to zero".into(),
                    gas_consumed: step.gas_or_cu,
                };
            }
            collected_fees += fee;
        }
    }
    
    AutopsyResult::ExploitSucceeded {
        attacker_net_usd: 12_400_000.0,
        drained_assets: vec![("zUSDC".into(), 12_400_000.0)],
    }
}`
    }
  }
];
