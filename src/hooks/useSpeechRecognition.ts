import { useEffect, useRef, useState, useCallback } from 'react';
import type { RoomSocket } from '../lib/socket';
import type {
  Caption,
  ISpeechRecognition,
  SpeechRecognitionConstructor,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from '../lib/types';

export interface UseSpeechRecognitionOptions {
  socket: RoomSocket | null;
  isRecording: boolean;
  speakerName: string;
  onError?: (errorMsg: string) => void;
  onCaptionSent?: (caption: Caption) => void;
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isRecognizing: boolean;
  start: () => void;
  stop: () => void;
}

const getSpeechRecognitionClass = (): SpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export function useSpeechRecognition({
  socket,
  isRecording,
  speakerName,
  onError,
  onCaptionSent,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isRecordingRef = useRef<boolean>(isRecording);
  const isRecognizingRef = useRef<boolean>(false);
  const speakerNameRef = useRef<string>(speakerName);
  const onErrorRef = useRef(onError);
  const onCaptionSentRef = useRef(onCaptionSent);
  const socketRef = useRef(socket);

  // Sync references
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    speakerNameRef.current = speakerName;
  }, [speakerName]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onCaptionSentRef.current = onCaptionSent;
  }, [onCaptionSent]);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    setIsSupported(Boolean(SpeechRecognitionClass));
  }, []);

  // Stop recognition session safely
  const stop = useCallback(() => {
    if (recognitionRef.current && isRecognizingRef.current) {
      try {
        isRecognizingRef.current = false;
        setIsRecognizing(false);
        recognitionRef.current.stop();
        console.log('[SpeechRecognition] Stopped continuous speech recognition');
      } catch (err: any) {
        console.warn('[SpeechRecognition] Stop error:', err?.message || err);
      }
    }
  }, []);

  // Start recognition session safely
  const start = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) {
      console.warn('[SpeechRecognition] SpeechRecognition is not supported in this browser.');
      onErrorRef.current?.('Web Speech API is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecognizingRef.current) {
      return;
    }

    try {
      if (!recognitionRef.current) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        // Process final speech results
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            if (result.isFinal && result[0]) {
              finalTranscript += result[0].transcript;
            }
          }

          const trimmed = finalTranscript.trim();
          if (trimmed) {
            console.log(`[SpeechRecognition] Captured final transcript: "${trimmed}"`);
            const socketInstance = socketRef.current;
            const caption: Caption = {
              id: `${socketInstance?.id || 'client'}-${Date.now()}`,
              speakerId: socketInstance?.id || 'me',
              speakerName: speakerNameRef.current || 'Live Participant',
              text: trimmed,
              timestamp: Date.now(),
              status: 'confirmed',
              confidence: 0.98,
            };

            // Emit using the team repository contract
            if (socketInstance) {
              socketInstance.emit('caption:send', caption);
            }
            onCaptionSentRef.current?.(caption);
          }
        };

        // Handle error events
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn(`[SpeechRecognition] Error: ${event.error}`);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            onErrorRef.current?.('Microphone permission for Speech Recognition was denied.');
          }
        };

        // Auto-restart loop when recording is active
        recognition.onend = () => {
          isRecognizingRef.current = false;
          setIsRecognizing(false);

          if (isRecordingRef.current) {
            try {
              recognition.start();
              isRecognizingRef.current = true;
              setIsRecognizing(true);
              console.log('[SpeechRecognition] Auto-restarted continuous speech recognition');
            } catch (err: any) {
              console.warn('[SpeechRecognition] Restart attempt error:', err?.message || err);
            }
          }
        };

        recognitionRef.current = recognition;
      }

      recognitionRef.current.start();
      isRecognizingRef.current = true;
      setIsRecognizing(true);
      console.log('[SpeechRecognition] Started continuous speech recognition');
    } catch (err: any) {
      console.warn('[SpeechRecognition] Start error:', err?.message || err);
    }
  }, []);

  // React to isRecording changes
  useEffect(() => {
    if (isRecording) {
      start();
    } else {
      stop();
    }
  }, [isRecording, start, stop]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      isRecognizingRef.current = false;
    };
  }, []);

  return {
    isSupported,
    isRecognizing,
    start,
    stop,
  };
}
