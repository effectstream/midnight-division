# Midnight Compact Division Demo

- The **circuit** (on-chain) verifies correctness using ZK constraints.
- The **witness** (off-chain) computes the quotient and remainder in TypeScript.

## How It Works

Division cannot be expressed as a single arithmetic constraint in a ZK circuit. Instead, the prover computes the result off-chain and the circuit verifies it:

1. Caller provides `dividend` and `divisor` as public inputs.
2. `wit_div()` computes `q = dividend / divisor` and `r = dividend % divisor` off-chain.
3. The circuit asserts:
   - `q * divisor + r == dividend`
   - `r < divisor`
4. On success it returns `quotient` and `remainder` to the caller.

## Prerequisites

- Node.js 20+
- `compact 0.29.0` CLI available in `PATH` (Midnight Network compiler)

## Commands

```bash
npm install

# Compile the Compact circuit → src/managed/division/
npm run compact

# Run tests
npm test
```

> `npm run compact` uses `compact compile +0.29.0`. The `compact` binary must be installed separately — it is not an npm dependency.


### Tests
```
 ✓ test/division.test.ts (11)
   ✓ div circuit — on-chain execution (11)
     ✓ exact: 10 / 2 → [q=5, r=0]
     ✓ approx: 9 / 2 → [q=4, r=1],  4×2+1=9
     ✓ rejects wrong quotient
     ✓ rejects remainder >= divisor
     ✓ rejects division by zero
     ✓ zero dividend: 0 / 5 → [q=0, r=0]
     ✓ dividend equals divisor: 7 / 7 → [q=1, r=0]
     ✓ dividend smaller than divisor: 3 / 5 → [q=0, r=3]
     ✓ large: MAX_U64 / 1 → [q=MAX_U64, r=0]
     ✓ large: MAX_U64 / 2 → correct q and r=1
     ✓ rejects overflow attack: q×divisor wraps mod 2^64 to match dividend# midnight-division
```
