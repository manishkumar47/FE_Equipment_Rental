import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import en from '../../locales/en.json';
import inLocale from '../../locales/in.json';
import jp from '../../locales/jp.json';
import { SUPPORTED_LOCALES } from '../i18n/locales';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(__dirname, '..');

const LOCALE_FILES: Record<string, Record<string, string>> = { en, in: inLocale, jp };

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

/** Every SCREAMING_SNAKE_CASE key passed to a `t(...)` call anywhere in src/. */
function findUsedKeys(): Set<string> {
  const used = new Set<string>();
  const keyPattern = /\bt\(\s*['"]([A-Z][A-Z0-9_]*)['"]/g;
  for (const file of walk(SRC_ROOT)) {
    const content = fs.readFileSync(file, 'utf8');
    let match: RegExpExecArray | null;
    while ((match = keyPattern.exec(content))) {
      used.add(match[1]);
    }
  }
  return used;
}

describe('i18n locale key parity', () => {
  it('declares every configured locale as a locale file', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_FILES[locale], `locales/${locale}.json is missing`).toBeDefined();
    }
  });

  it('keeps every locale file in sync with en.json (same key set)', () => {
    const referenceKeys = Object.keys(en).sort();
    for (const [locale, messages] of Object.entries(LOCALE_FILES)) {
      if (locale === 'en') continue;
      expect(Object.keys(messages).sort(), `locales/${locale}.json key set`).toEqual(referenceKeys);
    }
  });

  it('never leaves a translated value identical to its own key (an un-translated echo)', () => {
    for (const [locale, messages] of Object.entries(LOCALE_FILES)) {
      for (const [key, value] of Object.entries(messages)) {
        expect(value, `locales/${locale}.json["${key}"] looks untranslated`).not.toBe(key);
      }
    }
  });

  it('has every t(...) call in src/ backed by a key in every locale file', () => {
    const used = findUsedKeys();
    expect(used.size, 'expected to find at least one t(...) call in src/').toBeGreaterThan(0);

    for (const [locale, messages] of Object.entries(LOCALE_FILES)) {
      const missing = [...used].filter((key) => !(key in messages));
      expect(missing, `keys used in code but missing from locales/${locale}.json`).toEqual([]);
    }
  });

  it('has no locale key that is unused anywhere in src/', () => {
    const used = findUsedKeys();
    const unused = Object.keys(en).filter((key) => !used.has(key));
    expect(unused, 'keys defined in locales/en.json but never referenced via t(...)').toEqual([]);
  });
});
