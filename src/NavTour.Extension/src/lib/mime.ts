/**
 * MIME type detection from byte patterns — mirrors Navattic's sniffing logic
 */

interface MimePattern {
  pattern: number[];
  mask?: number[];
  mimeType: string;
}

interface CompiledPattern extends MimePattern {
  mask: number[];
}

function compile(patterns: MimePattern[]): CompiledPattern[] {
  return patterns.map((p) => ({
    ...p,
    mask: p.mask ?? p.pattern.map((b) => (b ? 255 : 0)),
  }));
}

const AUDIO_PATTERNS: MimePattern[] = [
  { pattern: [70, 79, 82, 77, 0, 0, 0, 0, 65, 73, 70, 70], mimeType: 'audio/aiff' },
  { pattern: [73, 68, 51], mimeType: 'audio/mpeg' },
  { pattern: [79, 103, 103, 83, 0], mimeType: 'application/ogg' },
  { pattern: [79, 84, 104, 100, 0, 0, 0, 6], mask: [255, 255, 255, 255, 255, 255, 255, 255], mimeType: 'audio/midi' },
  { pattern: [0, 0, 0, 0, 102, 116, 121, 112, 77, 52, 65], mask: [0, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255], mimeType: 'audio/m4a' },
  { pattern: [77, 52, 65, 32], mimeType: 'audio/m4a' },
  { pattern: [82, 73, 70, 70, 0, 0, 0, 0, 87, 65, 86, 69], mimeType: 'audio/wave' },
];

const IMAGE_PATTERNS: MimePattern[] = [
  { pattern: [0, 0, 1, 0], mimeType: 'image/x-icon' },
  { pattern: [0, 0, 2, 0], mimeType: 'image/x-icon' },
  { pattern: [66, 77], mimeType: 'image/bmp' },
  { pattern: [71, 73, 70, 56, 55, 97], mimeType: 'image/gif' },
  { pattern: [71, 73, 70, 56, 57, 97], mimeType: 'image/gif' },
  { pattern: [137, 80, 78, 71, 13, 10, 26, 10], mimeType: 'image/png' },
  { pattern: [255, 216, 255], mimeType: 'image/jpeg' },
  { pattern: [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80, 86, 80], mimeType: 'image/webp', mask: [255, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 255, 255, 255] },
];

const PDF_PATTERNS: MimePattern[] = [
  { pattern: [37, 80, 68, 70, 45], mimeType: 'application/pdf' },
  { pattern: [162, 85, 68, 70, 45], mimeType: 'application/pdf' },
  { pattern: [239, 187, 102, 37, 80, 68, 70, 45], mimeType: 'application/pdf' },
  { pattern: [37, 70, 68, 70, 45], mimeType: 'application/pdf' },
];

const ZERO_PAD = new Array(34).fill(0);

const FONT_PATTERNS: MimePattern[] = [
  { pattern: [119, 79, 70, 70], mimeType: 'font/woff' },
  { pattern: [119, 79, 70, 50], mimeType: 'font/woff2' },
  { pattern: [0, 1, 0, 0], mimeType: 'font/ttf' },
  { pattern: [79, 84, 84, 79], mimeType: 'font/otf' },
  { pattern: [116, 116, 99, 102], mimeType: 'font/collection' },
  { pattern: [...ZERO_PAD, 76, 80], mimeType: 'application/vnd.ms-fontobject', mask: [...ZERO_PAD, 255, 255] },
];

const compiledAudio = compile(AUDIO_PATTERNS);
const compiledImage = compile(IMAGE_PATTERNS);
const compiledPdf = compile(PDF_PATTERNS);
const compiledFont = compile(FONT_PATTERNS);

function maxPatternLength(patterns: CompiledPattern[]): number {
  return patterns.reduce((max, p) => Math.max(max, p.pattern.length), 0);
}

export const IMAGE_SNIFF_LENGTH = maxPatternLength(compiledImage);
export const PDF_SNIFF_LENGTH = maxPatternLength(compiledPdf);
export const FONT_SNIFF_LENGTH = maxPatternLength(compiledFont);

function matchBytes(bytes: Uint8Array, patterns: CompiledPattern[]): string | null {
  for (const { pattern, mask, mimeType } of patterns) {
    if (bytes.length < pattern.length) continue;
    let match = true;
    for (let i = 0; i < pattern.length; i++) {
      if ((bytes[i] & mask[i]) !== (pattern[i] & mask[i])) {
        match = false;
        break;
      }
    }
    if (match) return mimeType;
  }
  return null;
}

export function sniffMimeType(bytes: Uint8Array): string | null {
  return (
    matchBytes(bytes, compiledImage) ??
    matchBytes(bytes, compiledAudio) ??
    matchBytes(bytes, compiledPdf) ??
    matchBytes(bytes, compiledFont)
  );
}
