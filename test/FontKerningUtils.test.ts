import { compressKerningPairs } from "../src/utils/FontKerningUtils";
import { KerningPair } from "../src/kerning/KerningPair";

describe("FontKerningUtils", () => {
  describe("compressKerningPairs", () => {
    it("should return empty array when input is empty", () => {
      const result = compressKerningPairs([]);
      expect(result).toEqual([]);
    });

    it("should return the same array when there is only one pair", () => {
      const pairs: KerningPair[] = [{ code: 65, adjustment: 10 }];
      const result = compressKerningPairs(pairs);
      expect(result).toEqual(pairs);
      // For efficiency, we return the original array for 0 or 1 elements
      expect(result).toBe(pairs);
    });

    it("should not compress pairs when all adjustments are non-zero", () => {
      const pairs: KerningPair[] = [
        { code: 65, adjustment: 10 },
        { code: 66, adjustment: 20 },
        { code: 67, adjustment: 30 },
      ];
      const result = compressKerningPairs(pairs);
      expect(result).toEqual([
        { code: 65, adjustment: 10 },
        { code: 66, adjustment: 20 },
        { code: 67, adjustment: 30 },
      ]);
    });

    it("should compress pairs with zero adjustment", () => {
      const pairs: KerningPair[] = [
        { code: 65, adjustment: 10 },
        { code: 66, adjustment: 0 },
        { code: 67, adjustment: 30 },
      ];
      const result = compressKerningPairs(pairs);
      expect(result).toEqual([
        { code: [65, 66], adjustment: 10 },
        { code: 67, adjustment: 30 },
      ]);
    });

    it("should compress multiple consecutive pairs with zero adjustment", () => {
      const pairs: KerningPair[] = [
        { code: 65, adjustment: 10 },
        { code: 66, adjustment: 0 },
        { code: 67, adjustment: 0 },
        { code: 68, adjustment: 30 },
      ];
      const result = compressKerningPairs(pairs);
      expect(result).toEqual([
        { code: [65, 66, 67], adjustment: 10 },
        { code: 68, adjustment: 30 },
      ]);
    });

    it("should handle arrays of codes correctly", () => {
      const pairs: KerningPair[] = [
        { code: [65, 66], adjustment: 10 },
        { code: 67, adjustment: 0 },
        { code: [68, 69], adjustment: 0 },
        { code: 70, adjustment: 30 },
      ];
      const result = compressKerningPairs(pairs);
      expect(result).toEqual([
        { code: [65, 66, 67, 68, 69], adjustment: 10 },
        { code: 70, adjustment: 30 },
      ]);
    });

    it("should handle all zero adjustments except the first", () => {
      const pairs: KerningPair[] = [
        { code: 65, adjustment: 10 },
        { code: 66, adjustment: 0 },
        { code: 67, adjustment: 0 },
        { code: 68, adjustment: 0 },
      ];
      const result = compressKerningPairs(pairs);
      expect(result).toEqual([{ code: [65, 66, 67, 68], adjustment: 10 }]);
    });

    it("should handle first pair with zero adjustment", () => {
      const pairs: KerningPair[] = [
        { code: 65, adjustment: 0 },
        { code: 66, adjustment: 10 },
        { code: 67, adjustment: 20 },
      ];
      const result = compressKerningPairs(pairs);
      expect(result).toEqual([
        { code: 65, adjustment: 0 },
        { code: 66, adjustment: 10 },
        { code: 67, adjustment: 20 },
      ]);
    });
  });
});
