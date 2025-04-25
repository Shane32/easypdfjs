import { createCode128 } from "../src/Barcode";

describe("BarcodeUtils", () => {
  describe("createCode128", () => {
    // Test case 1: Numeric sequences
    test("encodes numeric sequence 00-09", () => {
      const input = "00010203040506070809";
      const result = createCode128(input);
      expect(result).toEqual(
        "1101001110011011001100110011011001100110011010010011000100100011001000100110010011001000100110001001000110010011001001000111011011101100011101011"
      );
    });

    test("encodes numeric sequence 10-19", () => {
      const input = "10111213141516171819";
      const result = createCode128(input);
      expect(result).toEqual(
        "1101001110011001000100110001001001011001110010011011100100110011101011100110010011101100100111001101100111001011001011100111011000101100011101011"
      );
    });

    test("encodes numeric sequence 20-29", () => {
      const input = "20212223242526272829";
      const result = createCode128(input);
      expect(result).toEqual(
        "1101001110011001001110110111001001100111010011101101110111010011001110010110011100100110111011001001110011010011100110010101000111101100011101011"
      );
    });

    test("encodes numeric sequence 30-39", () => {
      const input = "30313233343536373839";
      const result = createCode128(input);
      expect(result).toEqual(
        "1101001110011011011000110110001101100011011010100011000100010110001000100011010110001000100011010001000110001011010001000111001011001100011101011"
      );
    });

    test("encodes numeric sequence 40-49", () => {
      const input = "40414243444546474849";
      const result = createCode128(input);
      expect(result).toEqual(
        "1101001110011000101000110001000101011011100010110001110100011011101011101100010111000110100011101101110111011011010001110111011110101100011101011"
      );
    });

    test("encodes numeric sequence 50-59", () => {
      const input = "50515253545556575859";
      const result = createCode128(input);
      expect(result).toEqual(
        "1101001110011000101110110111010001101110001011011101110111010110001110100011011100010110111011010001110110001011100011010101111010001100011101011"
      );
    });

    test("encodes numeric sequence 60-69", () => {
      const input = "60616263646566676869";
      const result = createCode128(input);
      expect(result).toEqual(
        "1101001110011101111010110010000101111000101010100110000101000011001001011000010010000110100001011001000010011010110010000111011001001100011101011"
      );
    });

    test("encodes numeric sequence 70-79", () => {
      const input = "70717273747576777879";
      const result = createCode128(input);
      expect(result).toEqual(
        "1101001110010110000100100110100001001100001010000110100100001100101100001001011001010000111101110101100001010010001111010111100010101100011101011"
      );
    });

    test("encodes numeric sequence 80-89", () => {
      const input = "80818283848586878889";
      const result = createCode128(input);
      expect(result).toEqual(
        "1101001110010100111100100101111001001001111010111100100100111101001001111001011110100100111100101001111001001011011011110111101010001100011101011"
      );
    });

    test("encodes numeric sequence 90-99", () => {
      const input = "90919293949596979899";
      const result = createCode128(input);
      expect(result).toEqual(
        "1101001110011011110110111101101101010111100010100011110100010111101011110100010111100010111101010001111010001010111011110111001100101100011101011"
      );
    });

    // Test case 2: Tab character followed by uppercase letters
    test("encodes tab character followed by uppercase letters", () => {
      // ensures that a pattern starting with code A can be encoded
      const input = "\tABC";
      const result = createCode128(input);
      expect(result).toEqual("1101000010010000110100101000110001000101100010001000110100110000101100011101011");
    });

    // Test case 3: Mixed case letters
    test("encodes mixed case letters", () => {
      // ensures that a pattern starting with code B can be encoded
      const input = "ABCdef";
      const result = createCode128(input);
      expect(result).toEqual("11010010000101000110001000101100010001000110100001001101011001000010110000100100011001001100011101011");
    });

    // Test cases 4-7: Different length numeric strings
    test("encodes two-digit number", () => {
      // ensures that a 2-digit number is encoded in Code B
      const input = "12";
      const result = createCode128(input);
      expect(result).toEqual("110100100001001110011011001110010111010110001100011101011");
    });

    test("encodes three-digit number", () => {
      // ensures that a 3-digit number is encoded in Code B
      const input = "123";
      const result = createCode128(input);
      expect(result).toEqual("11010010000100111001101100111001011001011100100011001001100011101011");
    });

    test("encodes four-digit number", () => {
      // ensures that a 4-digit number is encoded in Code C
      const input = "1234";
      const result = createCode128(input);
      expect(result).toEqual("110100111001011001110010001011000100100111101100011101011");
    });

    test("encodes five-digit number", () => {
      // ensures that after 4 digits of code C, it switches to Code B
      const input = "12345";
      const result = createCode128(input);
      expect(result).toEqual("1101001110010110011100100010110001011110111011011100100111010110001100011101011");
    });

    // Test case 8: Lowercase letters followed by tab
    test("encodes lowercase letters followed by tab", () => {
      // ensures that a pattern starting with code B and switching to code A can be encoded
      const input = "abc\t";
      const result = createCode128(input);
      expect(result).toEqual("110100100001001011000010010000110100001011001110101111010000110100100010001101100011101011");
    });

    // Test case 9: Tab followed by mixed case letters
    test("encodes tab followed by mixed case letters", () => {
      // ensures that a pattern starting with code A and switching to code B can be encoded
      const input = "\tABCdef";
      const result = createCode128(input);
      expect(result).toEqual(
        "110100001001000011010010100011000100010110001000100011010111101110100001001101011001000010110000100100100001101100011101011"
      );
    });

    // Test case 10: Invalid character
    test("throws error for invalid character", () => {
      expect(() => createCode128("ABC€def")).toThrow("Input contains characters that cannot be encoded with Code 128");
    });

    // Test case 11: Empty string
    test("throws error for empty string", () => {
      expect(() => createCode128("")).toThrow("Input cannot be empty");
    });

    // Additional test: Verify code switching behavior
    test("handles code switching correctly", () => {
      const input = "12AB\t34";
      const result = createCode128(input);
      expect(result).toEqual(
        "110100100001001110011011001110010101000110001000101100011101011110100001101001100101110011001001110101111001001100011101011"
      );
    });

    // Additional test: Verify consistent output for the same input
    test("produces consistent output for the same input", () => {
      const input = "Test123";
      const result1 = createCode128(input);
      const result2 = createCode128(input);
      expect(result1).toEqual(result2);
    });

    // Additional test: Verify different outputs for different inputs
    test("produces different outputs for different inputs", () => {
      const result1 = createCode128("Test123");
      const result2 = createCode128("Test124");
      expect(result1).not.toEqual(result2);
    });
  });
});
