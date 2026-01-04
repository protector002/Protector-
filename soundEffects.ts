/**
 * Sound Effects Utility using Web Audio API
 * Generates synthesized UI sounds to match the Protector AI aesthetic.
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Lazy load context to avoid autoplay restrictions until user interaction
    if (typeof window !== 'undefined') {
      // Setup handled on first play
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public getEnabled() {
    return this.enabled;
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  /**
   * Futuristic mechanical "Start" sound
   */
  public playStartSound() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Frequency sweep (High to Low - "Lock in" sound)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);

    // Envelope
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  /**
   * Subtle high-pitched chime indicating the system is listening
   */
  public playListeningSound() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    // A soft major 3rd interval
    osc.frequency.setValueAtTime(880, t); // A5
    osc.frequency.setValueAtTime(1108, t + 0.15); // C#6

    // Soft attack and release
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  /**
   * Digital data chirp indicating response received
   */
  public playResponseSound() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    // Quick trill
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.setValueAtTime(600, t + 0.05);
    osc.frequency.setValueAtTime(400, t + 0.1);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.start(t);
    osc.stop(t + 0.3);
  }
}

export const soundEffects = new SoundEffectsManager();