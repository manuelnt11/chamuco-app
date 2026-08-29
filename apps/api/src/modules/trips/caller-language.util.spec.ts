import { resolveCallerLanguage } from './caller-language.util';

describe('resolveCallerLanguage', () => {
  it('returns the caller language preference in lowercase', async () => {
    const mockFindFirst = jest.fn().mockResolvedValue({ language: 'ES' });
    const db = { query: { userPreferences: { findFirst: mockFindFirst } } } as never;

    const lang = await resolveCallerLanguage(db, 'user-uuid');

    expect(lang).toBe('es');
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ columns: { language: true } }),
    );
  });

  it('defaults to "en" when the caller has no preferences row', async () => {
    const mockFindFirst = jest.fn().mockResolvedValue(null);
    const db = { query: { userPreferences: { findFirst: mockFindFirst } } } as never;

    const lang = await resolveCallerLanguage(db, 'user-uuid');

    expect(lang).toBe('en');
  });

  it('defaults to "en" when the preferences row has no language set', async () => {
    const mockFindFirst = jest.fn().mockResolvedValue({ language: null });
    const db = { query: { userPreferences: { findFirst: mockFindFirst } } } as never;

    const lang = await resolveCallerLanguage(db, 'user-uuid');

    expect(lang).toBe('en');
  });
});
