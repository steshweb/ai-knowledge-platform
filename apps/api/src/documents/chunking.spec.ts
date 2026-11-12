import { normalizeText, splitTextIntoChunks } from './chunking';

describe('document chunking', () => {
  it('normalizes whitespace', () => {
    expect(normalizeText('  First\r\n\r\n\r\nSecond  ')).toBe('First\n\nSecond');
  });

  it('creates overlapping chunks', () => {
    const chunks = splitTextIntoChunks('abcdefghij', 6, 2);
    expect(chunks).toEqual(['abcdef', 'efghij']);
  });

  it('returns no chunks for empty text', () => {
    expect(splitTextIntoChunks('   ', 100, 10)).toEqual([]);
  });
});
