import { GoogleGenAI, LiveServerMessage } from "@google/genai";
import { createBlob, decodeAudioData } from "../utils/audioUtils";

interface ServiceCallbacks {
  onStatusChange: (isConnected: boolean) => void;
  onAudioData: (buffer: AudioBuffer) => void;
  onError: (error: string) => void;
  onClose: () => void;
  onInterrupted: () => void;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private session: any = null; // Direct reference for speed
  private inputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  public async connect(callbacks: ServiceCallbacks, outputCtx: AudioContext): Promise<void> {
    try {
      // 1. Setup Audio Input
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      // Crucial: Resume context if suspended (common browser behavior)
      if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
      }

      this.inputSource = this.inputAudioContext.createMediaStreamSource(this.stream);
      
      // Super Low Latency: 1024 samples @ 16kHz = ~64ms latency.
      // Combined with optimized createBlob, this provides near real-time feel.
      this.scriptProcessor = this.inputAudioContext.createScriptProcessor(1024, 1, 1);

      // 2. Initialize Gemini Live Connection
      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          // Use string literal 'AUDIO' to avoid Enum import issues in shimmed environments
          responseModalities: ['AUDIO'], 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: "You are Protector AI. If asked 'what is your name', say 'I am Protector AI'. If asked 'who created you', say 'By Protector Software'. Be concise.",
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            callbacks.onStatusChange(true);
            this.startAudioStreaming();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               try {
                 const buffer = await decodeAudioData(base64Audio, outputCtx, 24000, 1);
                 callbacks.onAudioData(buffer);
               } catch (e) {
                 console.error("Error decoding audio", e);
               }
            }
            
            // Handle Interruption
            if (message.serverContent?.interrupted) {
                callbacks.onInterrupted();
            }
          },
          onerror: (e) => {
            console.error("Gemini Live Error:", e);
            callbacks.onError("Connection error. Please retry.");
          },
          onclose: () => {
            console.log("Gemini Live Closed");
            callbacks.onStatusChange(false);
            callbacks.onClose();
          },
        },
      });

      // Await and store direct session reference for performance
      this.session = await this.sessionPromise;

    } catch (error: any) {
      console.error(error);
      callbacks.onError(error.message || "Failed to initialize audio.");
    }
  }

  private startAudioStreaming() {
    if (!this.scriptProcessor || !this.inputSource || !this.inputAudioContext) return;

    this.scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const blob = createBlob(inputData);
      
      // Optimization: Use direct session reference to avoid Promise creation/microtask scheduling on every audio frame
      if (this.session) {
        try {
          this.session.sendRealtimeInput({ media: blob });
        } catch (err) {
          console.warn("Failed to send audio chunk", err);
        }
      }
    };

    this.inputSource.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioContext.destination);
  }

  public async sendImageFrame(base64Data: string) {
    // Optimization: Use direct session reference
    if (this.session) {
      try {
        this.session.sendRealtimeInput({
            media: { 
                mimeType: 'image/jpeg',
                data: base64Data
            }
        });
      } catch (e) {
        // Silent fail
      }
    }
  }

  public async disconnect() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.inputAudioContext) {
      try {
        await this.inputAudioContext.close();
      } catch (e) {}
      this.inputAudioContext = null;
    }

    if (this.session) {
       try {
           // @ts-ignore
           if (typeof this.session.close === 'function') {
             // @ts-ignore
             this.session.close();
           }
       } catch (e) {}
       this.session = null;
       this.sessionPromise = null;
    }
  }
}