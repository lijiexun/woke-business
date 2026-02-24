import { describe, expect, it } from "vitest";
import { movingAverage } from "../lib/aggregate";

describe("movingAverage", () => {
  it("returns original values for window 1", () => {
    expect(movingAverage([1, 2, 3], 1)).toEqual([1, 2, 3]);
  });

  it("computes centered moving average", () => {
    const out = movingAverage([1, 2, 3, 4, 5], 3);
    expect(out.map((n) => Number(n.toFixed(4)))).toEqual([1.5, 2, 3, 4, 4.5]);
  });
});
