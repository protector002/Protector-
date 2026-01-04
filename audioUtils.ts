import { Blob } from "@google/genai";

/**
 * Encodes a Float32Array (from WebAudio API) into a base64 string representing 16-bit PCM.
 * This is required for the Gemini Live API input.
 */
export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp values to [-1, 1] before scaling
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8 = new Uint8Array(int16.buffer);
  
  // Optimization: Use spread syntax or apply for faster string construction
  // instead of loop concatenation which causes GC pressure and latency.
  // 4096 bytes is well within stack limits for spread/apply.
  // @ts-ignore - TS might complain about spread on typed array in older configs but it works
  const binary = String.fromCharCode.apply(null, uint8 as unknown as number[]);
  
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

/**
 * Decodes a base64 string (raw PCM) into an AudioBuffer.
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  base64Data: string,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const data = decode(base64Data);
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}