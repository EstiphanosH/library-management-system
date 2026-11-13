import { slugify } from './slugify.js';

describe('slugify', () => {
  it('creates lowercase URL-friendly slugs', () => {
    expect(slugify('Science Fiction')).toBe('science-fiction');
    expect(slugify('  Café & Fantasy  ')).toBe('cafe-fantasy');
  });

  it('returns an empty slug for names without ASCII letters or numbers', () => {
    expect(slugify('🎭')).toBe('');
  });
});
