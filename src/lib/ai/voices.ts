export interface VoiceOption {
  id: string;
  title: string;
  demoUrl: string;
}

const VOICES: VoiceOption[] = [
  {
    id: 'aurora',
    title: 'Aurora (Warm Narrator)',
    demoUrl: 'https://cdn.clipvox.app/demos/aurora.mp3'
  },
  {
    id: 'atlas',
    title: 'Atlas (Documentary)',
    demoUrl: 'https://cdn.clipvox.app/demos/atlas.mp3'
  },
  {
    id: 'ember',
    title: 'Ember (Bedtime)',
    demoUrl: 'https://cdn.clipvox.app/demos/ember.mp3'
  }
];

export function listVoices() {
  return VOICES;
}
