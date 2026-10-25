import { describe, expect, test } from 'vitest';

import { resolveLocale } from './locale';

describe('resolveLocale', () => {
  test('returns es when the preferred language is spanish', () => {
    expect(resolveLocale('es-AR,es;q=0.9,en;q=0.8')).toBe('es');
  });

  test('returns en when the preferred language is english', () => {
    expect(resolveLocale('en-US,en;q=0.9,es;q=0.8')).toBe('en');
  });

  test('returns the supported language with the highest weight', () => {
    expect(resolveLocale('fr-FR,en;q=0.5,es;q=0.8')).toBe('es');
  });

  test('returns en when the header is missing', () => {
    expect(resolveLocale(null)).toBe('en');
  });

  test('returns en when no language is supported', () => {
    expect(resolveLocale('fr-FR,de;q=0.9')).toBe('en');
  });

  test('does not pick a language with weight zero', () => {
    expect(resolveLocale('es;q=0,fr')).toBe('en');
  });
});
