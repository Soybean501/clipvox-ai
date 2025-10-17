import { describe, expect, it } from 'vitest';

import { targetWords, wpmForTone } from '@/lib/utils/wpm';

describe('WPM utilities', () => {
  it('bedtime is slower than conversational', () => {
    expect(wpmForTone('bedtime')).toBeLessThan(wpmForTone('conversational'));
  });

  it('target words scales with minutes', () => {
    expect(targetWords(10, 'educational')).toBeGreaterThan(targetWords(5, 'educational'));
  });

  it('style modifiers adjust wpm', () => {
    expect(wpmForTone('educational', 'fast pace')).toBeGreaterThan(wpmForTone('educational'));
    expect(wpmForTone('educational', 'slow pace')).toBeLessThan(wpmForTone('educational'));
  });
});
