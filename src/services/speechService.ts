// Speech-to-Text (STT) and Text-to-Speech (TTS) Browser Service Layer

export interface SpeechRecognitionResultPayload {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export interface SpeechServiceOptions {
  onTranscript?: (result: SpeechRecognitionResultPayload) => void;
  onError?: (error: string) => void;
  onSilenceTimeout?: () => void;
  silenceTimeoutMs?: number;
  continuous?: boolean;
  lang?: string;
}

export interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

export interface SpeechRecognitionErrorEventLike {
  error: string;
}

export interface SpeechRecognitionInstanceLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

// Window interface augmentation for browser speech recognition
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstanceLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstanceLike;
  }
}

export class SpeechService {
  private recognition: SpeechRecognitionInstanceLike | null = null;
  private isListening = false;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private silenceTimeoutMs = 4000;
  private currentTranscript = '';
  private onTranscriptCallback?: (result: SpeechRecognitionResultPayload) => void;
  private onErrorCallback?: (error: string) => void;
  private onSilenceTimeoutCallback?: () => void;

  constructor() {
    this.initRecognition();
  }

  public static isSTTSupported(): boolean {
    return typeof window !== 'undefined' && (
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    );
  }

  public static isTTSSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private initRecognition() {
    if (!SpeechService.isSTTSupported()) return;

    try {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionConstructor) return;

      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const combined = (this.currentTranscript + ' ' + finalTranscript + ' ' + interimTranscript).trim();

        if (finalTranscript) {
          this.currentTranscript = (this.currentTranscript + ' ' + finalTranscript).trim();
        }

        // Reset silence timer whenever user speaks
        this.resetSilenceTimer();

        if (this.onTranscriptCallback) {
          this.onTranscriptCallback({
            transcript: combined,
            isFinal: !!finalTranscript,
            confidence: event.results[0]?.[0]?.confidence || 0.9,
          });
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        // Ignore normal aborts
        if (event.error === 'aborted') return;
        
        let message = 'Speech recognition error';
        switch (event.error) {
          case 'not-allowed':
            message = 'Microphone access was denied. Please allow microphone permissions in browser settings.';
            break;
          case 'no-speech':
            // No speech detected, not fatal
            return;
          case 'audio-capture':
            message = 'No microphone was found or audio capture failed.';
            break;
          case 'network':
            message = 'Speech recognition network error. Switched to keyboard input fallback.';
            break;
          default:
            message = `Speech recognition error: ${event.error}`;
        }

        if (this.onErrorCallback) {
          this.onErrorCallback(message);
        }
      };

      this.recognition.onend = () => {
        // If listening was still expected, keep alive unless intentionally stopped
        if (this.isListening) {
          try {
            this.recognition?.start();
          } catch {
            this.isListening = false;
          }
        }
      };
    } catch (e) {
      console.warn('SpeechRecognition failed to initialize:', e);
    }
  }

  public startListening(options: SpeechServiceOptions) {
    if (!SpeechService.isSTTSupported()) {
      options.onError?.('Speech recognition is not supported in this browser. Please use keyboard fallback.');
      return;
    }

    this.onTranscriptCallback = options.onTranscript;
    this.onErrorCallback = options.onError;
    this.onSilenceTimeoutCallback = options.onSilenceTimeout;
    this.silenceTimeoutMs = options.silenceTimeoutMs || 4000;
    this.currentTranscript = '';

    if (!this.recognition) {
      this.initRecognition();
    }

    try {
      this.isListening = true;
      this.recognition?.start();
      this.resetSilenceTimer();
    } catch (err: unknown) {
      const errorObj = err as Error;
      if (errorObj?.name !== 'InvalidStateError') {
        this.onErrorCallback?.('Failed to start speech recognition: ' + (errorObj?.message || 'Unknown error'));
      }
    }
  }

  public stopListening(): string {
    this.isListening = false;
    this.clearSilenceTimer();

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Safe to ignore
      }
    }

    const transcript = this.currentTranscript;
    this.currentTranscript = '';
    return transcript;
  }

  public resetTranscript() {
    this.currentTranscript = '';
    this.resetSilenceTimer();
  }

  private resetSilenceTimer() {
    this.clearSilenceTimer();
    if (this.onSilenceTimeoutCallback && this.isListening) {
      this.silenceTimer = setTimeout(() => {
        if (this.isListening && this.currentTranscript.trim().length > 0) {
          this.onSilenceTimeoutCallback?.();
        }
      }, this.silenceTimeoutMs);
    }
  }

  private clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  // ================= TEXT-TO-SPEECH (TTS) =================

  public static speakText(
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
      voiceName?: string;
      rate?: number;
      pitch?: number;
    }
  ): SpeechSynthesisUtterance | null {
    if (!SpeechService.isTTSSupported()) {
      options?.onError?.(new Error('TTS not supported'));
      return null;
    }

    window.speechSynthesis.cancel(); // Cancel any lingering utterances

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 0.95;
    utterance.pitch = options?.pitch ?? 1.0;

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const preferred = voices.find(
        (v) => (v.lang.startsWith('en-IN') || v.lang.startsWith('en-US') || v.lang.startsWith('en-GB')) && !v.name.includes('Google')
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferred) {
        utterance.voice = preferred;
      }
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      // Chrome triggers error 'interrupted' when canceled, which is harmless
      if (e.error === 'interrupted' || e.error === 'canceled') {
        options?.onEnd?.();
        return;
      }
      options?.onError?.(e);
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      options?.onError?.(e);
    }

    return utterance;
  }

  public static stopSpeaking() {
    if (SpeechService.isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}
