// src/services/voiceService.js
// Centralized TTS (Text-to-Speech) service for multilingual voice output

const LANG_MAP = {
  mr: 'mr-IN',
  hi: 'hi-IN',
  en: 'en-IN'
};

class VoiceService {
  constructor() {
    this.isPlaying = false;
    this.currentUtterance = null;
    this.onStartCallbacks = [];
    this.onEndCallbacks = [];
  }

  get isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text, language = 'mr') {
    if (!this.isSupported || !text) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[language] || 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isPlaying = true;
      this.onStartCallbacks.forEach(cb => cb());
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.currentUtterance = null;
      this.onEndCallbacks.forEach(cb => cb());
    };

    utterance.onerror = () => {
      this.isPlaying = false;
      this.currentUtterance = null;
      this.onEndCallbacks.forEach(cb => cb());
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    this.currentUtterance = null;
  }

  pause() {
    if (this.isSupported) {
      window.speechSynthesis.pause();
    }
  }

  resume() {
    if (this.isSupported) {
      window.speechSynthesis.resume();
    }
  }

  onStart(callback) {
    this.onStartCallbacks.push(callback);
  }

  onEnd(callback) {
    this.onEndCallbacks.push(callback);
  }
}

// Singleton
const voiceService = new VoiceService();
export default voiceService;
