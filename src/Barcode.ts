// Utility functions for barcode encoding operations.

// Character sets for Code 128A and Code 128B (96 characters each)
const code128A =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F";
const code128B = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7F";
const possibleChars = code128A + code128B;

// Bit patterns for Code 128 (patterns 0-106)
const patterns = [
  "11011001100",
  "11001101100",
  "11001100110",
  "10010011000",
  "10010001100",
  "10001001100",
  "10011001000",
  "10011000100",
  "10001100100",
  "11001001000",
  "11001000100",
  "11000100100",
  "10110011100",
  "10011011100",
  "10011001110",
  "10111001100",
  "10011101100",
  "10011100110",
  "11001110010",
  "11001011100",
  "11001001110",
  "11011100100",
  "11001110100",
  "11101101110",
  "11101001100",
  "11100101100",
  "11100100110",
  "11101100100",
  "11100110100",
  "11100110010",
  "11011011000",
  "11011000110",
  "11000110110",
  "10100011000",
  "10001011000",
  "10001000110",
  "10110001000",
  "10001101000",
  "10001100010",
  "11010001000",
  "11000101000",
  "11000100010",
  "10110111000",
  "10110001110",
  "10001101110",
  "10111011000",
  "10111000110",
  "10001110110",
  "11101110110",
  "11010001110",
  "11000101110",
  "11011101000",
  "11011100010",
  "11011101110",
  "11101011000",
  "11101000110",
  "11100010110",
  "11101101000",
  "11101100010",
  "11100011010",
  "11101111010",
  "11001000010",
  "11110001010",
  "10100110000",
  "10100001100",
  "10010110000",
  "10010000110",
  "10000101100",
  "10000100110",
  "10110010000",
  "10110000100",
  "10011010000",
  "10011000010",
  "10000110100",
  "10000110010",
  "11000010010",
  "11001010000",
  "11110111010",
  "11000010100",
  "10001111010",
  "10100111100",
  "10010111100",
  "10010011110",
  "10111100100",
  "10011110100",
  "10011110010",
  "11110100100",
  "11110010100",
  "11110010010",
  "11011011110",
  "11011110110",
  "11110110110",
  "10101111000",
  "10100011110",
  "10001011110",
  "10111101000",
  "10111100010",
  "11110101000",
  "11110100010",
  "10111011110",
  "10111101110",
  "11101011110",
  "11110101110",
  "11010000100",
  "11010010000",
  "11010011100",
  "1100011101011", // stop code with appended 2-bit pattern
];

/**
 * Encodes a string using Code 128 barcode encoding.
 *
 * @param data The string to encode
 * @returns The encoded barcode pattern as a string of 1s and 0s
 * @throws Error if the input contains characters that cannot be encoded
 */
export function createCode128(data: string): string {
  // Verify that the input is not empty
  if (!data) {
    throw new Error("Input cannot be empty");
  }

  // Verify that all characters can be encoded
  if (!Array.from(data).every((char) => possibleChars.includes(char))) {
    throw new Error("Input contains characters that cannot be encoded with Code 128");
  }

  const codes: number[] = [];

  // Determine the starting code set
  if (data.length >= 4 && /^\d{4,}/.test(data)) {
    // Start with Code C if the first four characters are numeric
    codes.push(105); // Code C start
    encodeWithCodeC(data, codes, 0);
  } else {
    // Start with Code B if the first character is in Code 128B
    const codeSet = code128B.includes(data[0]) ? "B" : "A";
    codes.push(codeSet === "B" ? 104 : 103); // Code B or A start
    encodeWithCode(data, codes, codeSet, 0);
  }

  // Add the checksum and stop code
  codes.push(
    // Calculate the checksum
    codes.reduce((acc, code, index) => acc + code * (index === 0 ? 1 : index), 0) % 103,
    // Stop code
    106
  );

  // Convert pattern indices to bit patterns and join them
  return codes.map((index) => patterns[index]).join("");
}

/**
 * Encodes a string using Code 128A or Code 128B.
 *
 * @param data The string to encode
 * @param codes The array to store pattern indices
 * @param codeSet The code set to use ('A' or 'B')
 * @param i The index to start encoding from
 */
function encodeWithCode(data: string, codes: number[], codeSet: "A" | "B", i: number): void {
  // Determine which character set to use based on codeSet
  const charSet = codeSet === "A" ? code128A : code128B;

  while (i < data.length) {
    const charIndex = charSet.indexOf(data[i]);

    if (charIndex === -1) {
      // Character is not in current code set, switch to the other code set
      codes.push(codeSet === "A" ? 100 : 101); // Switch code for B or A
      encodeWithCode(data, codes, codeSet === "A" ? "B" : "A", i);
      return;
    }
    // Character is in current code set, encode it
    codes.push(charIndex);
    i++;
  }
}

/**
 * Encodes a string using Code 128C.
 *
 * @param data The string to encode
 * @param codes The array to store pattern indices
 * @param i The index to start encoding from
 */
function encodeWithCodeC(data: string, codes: number[], i: number): void {
  // Process pairs of digits as long as possible
  while (i < data.length - 1 && /^\d{2}/.test(data.substring(i, i + 2))) {
    // Convert the pair of digits to a single Code C value
    codes.push(parseInt(data.substring(i, i + 2), 10));
    i += 2;
  }

  // If there's a remaining character or non-numeric characters, switch to Code B or A
  if (i < data.length) {
    // Start with Code B if the next character is in Code 128B
    const codeSet = code128B.includes(data[i]) ? "B" : "A";
    codes.push(codeSet === "B" ? 100 : 101); // Code B or A switch
    encodeWithCode(data, codes, codeSet, i);
  }
}
