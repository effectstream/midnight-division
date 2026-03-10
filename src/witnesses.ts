import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';

export type Ledger = {
  readonly last_quotient: bigint;
  readonly last_remainder: bigint;
};

export type DivisionPrivateState = {
  quotient: bigint;
  remainder: bigint;
};

export const createInitialPrivateState = (): DivisionPrivateState => ({
  quotient: 0n,
  remainder: 0n,
});

export const prepareDivision = (
  state: DivisionPrivateState,
  dividend: bigint,
  divisor: bigint,
): DivisionPrivateState => {
  if (divisor === 0n) throw new Error('divisor must not be zero');
  return {
    ...state,
    quotient: dividend / divisor,
    remainder: dividend % divisor,
  };
};

export const witnesses = {
  wit_div: (
    { privateState }: WitnessContext<Ledger, DivisionPrivateState>,
  ): [DivisionPrivateState, [bigint, bigint]] => [
    privateState,
    [privateState.quotient, privateState.remainder],
  ],
};
