import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';

export type Ledger = {};

export type DivisionPrivateState = {};

export const createInitialPrivateState = (): DivisionPrivateState => ({});

export const witnesses = {
  wit_div: (
    { privateState }: WitnessContext<Ledger, DivisionPrivateState>,
    dividend: bigint,
    divisor: bigint,
  ): [DivisionPrivateState, [bigint, bigint]] => {
    if (divisor === 0n) throw new Error('divisor must not be zero');
    return [privateState, [dividend / divisor, dividend % divisor]];
  },
};
