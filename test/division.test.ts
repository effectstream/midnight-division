import { describe, expect, it, beforeEach } from 'vitest';
import {
  type CircuitContext,
  CostModel,
  createConstructorContext,
  QueryContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';
import { Contract } from '../src/managed/division/contract/index.js';
import {
  createInitialPrivateState,
  prepareDivision,
  type DivisionPrivateState,
  witnesses,
} from '../src/witnesses.js';

const MAX_U64 = (1n << 64n) - 1n; // 18446744073709551615

describe('div circuit — on-chain execution', () => {
  let contract: Contract<DivisionPrivateState>;
  let ctx: CircuitContext<DivisionPrivateState>;

  beforeEach(() => {
    contract = new Contract(witnesses);
    const { currentPrivateState, currentContractState, currentZswapLocalState } =
      contract.initialState(createConstructorContext(createInitialPrivateState(), '0'.repeat(64)));

    ctx = {
      currentPrivateState,
      currentZswapLocalState,
      currentQueryContext: new QueryContext(currentContractState.data, sampleContractAddress()),
      costModel: CostModel.initialCostModel(),
    };
  });

  function runDiv(dividend: bigint, divisor: bigint): [bigint, bigint] {
    const ps = prepareDivision(ctx.currentPrivateState, dividend, divisor);
    const result = contract.circuits.div({ ...ctx, currentPrivateState: ps }, dividend, divisor);
    ctx = result.context;
    return result.result;
  }

  it('exact: 10 / 2 → [q=5, r=0]', () => {
    const [q, r] = runDiv(10n, 2n);
    expect(q).toBe(5n);
    expect(r).toBe(0n);
  });

  it('approx: 9 / 2 → [q=4, r=1],  4×2+1=9', () => {
    const [q, r] = runDiv(9n, 2n);
    expect(q).toBe(4n);
    expect(r).toBe(1n);
    expect(q * 2n + r).toBe(9n);
  });

  it('rejects wrong quotient', () => {
    const ps: DivisionPrivateState = { quotient: 5n, remainder: 1n }; // 5×2+1=11 ≠ 9
    expect(() => contract.circuits.div({ ...ctx, currentPrivateState: ps }, 9n, 2n)).toThrow();
  });

  it('rejects remainder >= divisor', () => {
    const ps: DivisionPrivateState = { quotient: 3n, remainder: 3n }; // 3×2+3=9 but r(3) >= p(2)
    expect(() => contract.circuits.div({ ...ctx, currentPrivateState: ps }, 9n, 2n)).toThrow();
  });

  it('rejects division by zero', () => {
    expect(() => prepareDivision(ctx.currentPrivateState, 9n, 0n)).toThrow(
      'divisor must not be zero',
    );
  });

  // --- border cases ---

  it('zero dividend: 0 / 5 → [q=0, r=0]', () => {
    const [q, r] = runDiv(0n, 5n);
    expect(q).toBe(0n);
    expect(r).toBe(0n);
  });

  it('dividend equals divisor: 7 / 7 → [q=1, r=0]', () => {
    const [q, r] = runDiv(7n, 7n);
    expect(q).toBe(1n);
    expect(r).toBe(0n);
  });

  it('dividend smaller than divisor: 3 / 5 → [q=0, r=3]', () => {
    const [q, r] = runDiv(3n, 5n);
    expect(q).toBe(0n);
    expect(r).toBe(3n);
  });

  it('large: MAX_U64 / 1 → [q=MAX_U64, r=0]', () => {
    const [q, r] = runDiv(MAX_U64, 1n);
    expect(q).toBe(MAX_U64);
    expect(r).toBe(0n);
  });

  it('large: MAX_U64 / 2 → correct q and r=1', () => {
    const [q, r] = runDiv(MAX_U64, 2n);
    expect(q).toBe(MAX_U64 / 2n); // 9223372036854775807n
    expect(r).toBe(1n);
    expect(q * 2n + r).toBe(MAX_U64);
  });

  it('rejects overflow attack: q×divisor wraps mod 2^64 to match dividend', () => {
    // For dividend=5, divisor=3: honest answer is q=1, r=2.
    // Malicious q where q*3 ≡ 5 (mod 2^64): q=6148914691236517207n.
    // The circuit uses bigint (no wrapping), so q*3+0 = 18446744073709551621 ≠ 5 → rejected.
    const ps: DivisionPrivateState = { quotient: 6148914691236517207n, remainder: 0n };
    expect(() => contract.circuits.div({ ...ctx, currentPrivateState: ps }, 5n, 3n)).toThrow();
  });
});
