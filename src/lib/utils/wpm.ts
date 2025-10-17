const toneMap: Record<string, number> = {
  bedtime: 125,
  documentary: 150,
  educational: 150,
  conversational: 170,
  dramatic: 140,
  custom: 160
};

export function wpmForTone(tone: string, style?: string) {
  let wpm = toneMap[tone] ?? 160;
  const lowerStyle = style?.toLowerCase() ?? '';

  if (lowerStyle.includes('slow')) {
    wpm -= 10;
  }
  if (lowerStyle.includes('fast')) {
    wpm += 10;
  }

  return Math.max(100, Math.min(220, wpm));
}

export function targetWords(lengthMinutes: number, tone: string, style?: string) {
  return Math.round(lengthMinutes * wpmForTone(tone, style));
}

export function countWords(input: string) {
  if (!input) {
    return 0;
  }
  return input.trim().match(/\b\w+\b/g)?.length ?? 0;
}
