export interface VoiceOption {
  id: string;
  title: string;
  description: string;
  previewUrl?: string;
  provider: 'openai';
  voice: string;
  model?: string;
}

const VOICES: VoiceOption[] = [
  {
    id: 'aurora',
    title: 'Aurora · Warm narrator',
    description: 'Balanced delivery suited for explainers and educational content.',
    previewUrl: 'https://cdn.clipvox.app/demos/aurora.mp3',
    provider: 'openai',
    voice: 'alloy',
    model: 'gpt-4o-mini-tts'
  },
  {
    id: 'atlas',
    title: 'Atlas · Documentary',
    description: 'Deep, cinematic tone that works well for documentaries and trailers.',
    previewUrl: 'https://cdn.clipvox.app/demos/atlas.mp3',
    provider: 'openai',
    voice: 'verse',
    model: 'gpt-4o-mini-tts'
  },
  {
    id: 'ember',
    title: 'Ember · Bedtime',
    description: 'Soft and soothing — ideal for bedtime stories or meditations.',
    previewUrl: 'https://cdn.clipvox.app/demos/ember.mp3',
    provider: 'openai',
    voice: 'lily',
    model: 'gpt-4o-mini-tts'
  }
];

export function listVoices() {
  return VOICES;
}

export function getVoiceById(id: string) {
  return VOICES.find((voice) => voice.id === id);
}
