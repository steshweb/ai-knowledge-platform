import { sanitizeText, splitTextIntoChunks } from './chunking';

describe('document chunking', () => {
  it('sanitizes formatting noise without changing meaningful punctuation', () => {
    expect(sanitizeText('  JWT\u00A0access-token:\u200B valid!\r\n\r\n\r\nSecond  ')).toBe(
      'JWT access-token: valid!\n\nSecond',
    );
  });

  it('removes control characters but preserves tabs as spacing', () => {
    expect(sanitizeText('First\u0000\u0007\tSecond')).toBe('First Second');
  });

  it('creates overlapping chunks', () => {
    const chunks = splitTextIntoChunks('abcdefghij', 6, 2);
    expect(chunks).toEqual(['abcdef', 'efghij']);
  });

  it('returns no chunks for empty text', () => {
    expect(splitTextIntoChunks('   ', 100, 10)).toEqual([]);
  });
});
