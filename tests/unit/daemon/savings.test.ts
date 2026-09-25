import { describe, expect, it } from 'effect-rstest';

import { calculateServedSavings, riddenFromMs } from '../../../src/internal/daemon/reporting/savings.js';

describe('riddenFromMs', () => {
  it('starts the solo counterfactual at the later of rider creation and leader start', () => {
    expect(riddenFromMs(1_000, null)).toBe(1_000);
    expect(riddenFromMs(1_000, 500)).toBe(1_000);
    expect(riddenFromMs(1_000, 1_500)).toBe(1_500);
  });
});

describe('calculateServedSavings', () => {
  it('does not charge a rider for waiting behind a leader that had not started', () => {
    // Created at 1s, the leader only started at 61s (a minute of lane queue),
    // settled at 71s; the rider's own run was estimated at 10s.
    expect(calculateServedSavings('identity', 10_000, 1_000, 71_000, 10_000, 61_000)).toEqual({
      savedComputeMs: 10_000,
      savedComputeSource: 'exact',
      savedLatencyMs: 0,
    });
  });

  it('credits a rider that joins a running leader with the run time it skipped', () => {
    // Leader started at 0, rider created at 6s, settled at 10s, solo run 10s.
    expect(
      calculateServedSavings('identity', 10_000, 6_000, 10_000, 10_000, 0).savedLatencyMs,
    ).toBe(6_000);
  });

  it('still reports a regression when the leader ran longer than the rider alone would have', () => {
    // Rider created at 1s, leader started at 5s and ran a minute; solo run 10s.
    expect(calculateServedSavings('coverage', 10_000, 1_000, 65_000, 60_000, 5_000)).toEqual({
      savedComputeMs: 10_000,
      savedComputeSource: 'estimate',
      savedLatencyMs: -50_000,
    });
  });

  it('measures from the rider creation when the leader never started', () => {
    expect(calculateServedSavings('batch', 10_000, 1_000, 4_000, null, null)).toEqual({
      savedComputeMs: 0,
      savedComputeSource: 'estimate',
      savedLatencyMs: 7_000,
    });
    // The pre-existing five-argument form keeps that meaning.
    expect(calculateServedSavings('identity', 10_000, 1_000, 4_000, null).savedLatencyMs).toBe(
      7_000,
    );
  });

  it('keeps the per-mode compute credit rules', () => {
    expect(calculateServedSavings('identity', 10_000, 0, 5_000, null, 0)).toMatchObject({
      savedComputeMs: 10_000,
      savedComputeSource: 'estimate',
    });
    expect(calculateServedSavings('identity', 10_000, 0, 5_000, 4_000, 0)).toMatchObject({
      savedComputeMs: 4_000,
      savedComputeSource: 'exact',
    });
    expect(calculateServedSavings('coverage', 10_000, 0, 5_000, 4_000, 0)).toMatchObject({
      savedComputeMs: 4_000,
      savedComputeSource: 'exact',
    });
    expect(calculateServedSavings('coverage', 3_000, 0, 5_000, 4_000, 0)).toMatchObject({
      savedComputeMs: 3_000,
      savedComputeSource: 'estimate',
    });
    expect(calculateServedSavings('batch', 3_000, 0, 5_000, 4_000, 0)).toMatchObject({
      savedComputeMs: 0,
      savedComputeSource: 'estimate',
    });
  });

  it('credits a batch rider no compute and measures its latency from behind the leader', () => {
    // Folded at the leader's start (0s): the leader alone compiles in ~60s,
    // the rider alone ~40s, the combined run took 80s. Alone, the rider would
    // have finished at 100s.
    expect(calculateServedSavings('batch', 40_000, 0, 80_000, 80_000, 0, 60_000)).toEqual({
      savedComputeMs: 0,
      savedComputeSource: 'estimate',
      savedLatencyMs: 20_000,
    });
    // A combined run longer than both runs back to back is a real regression.
    expect(calculateServedSavings('batch', 40_000, 0, 110_000, 110_000, 0, 60_000).savedLatencyMs).toBe(
      -10_000,
    );
  });

  it('sanitizes negative inputs and a settlement that precedes the origin', () => {
    expect(calculateServedSavings('identity', -5, 1_000, 900, -3, 1_200)).toEqual({
      savedComputeMs: 0,
      savedComputeSource: 'exact',
      savedLatencyMs: 0,
    });
  });
});
