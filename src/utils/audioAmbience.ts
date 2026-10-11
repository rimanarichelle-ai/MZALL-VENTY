// High-fidelity Web Audio API Artisanal Cafe Ambience Synthesizer
// Procedurally creates authentic cafe acoustic environments:
// - Quiet espresso machine extraction & periodic milk frother steam hisses
// - Low cafe room chatter and acoustic speech murmur
// - Warm vinyl crackle and soothing room resonance

export type SoundProfile =
  | 'espresso-steam'
  | 'cafe-chatter'
  | 'vinyl-warmth'
  | 'full-blend';

export interface SoundProfileMeta {
  id: SoundProfile;
  name: string;
  tagline: string;
  icon: string;
  description: string;
}

export const SOUND_PROFILES: SoundProfileMeta[] = [
  {
    id: 'espresso-steam',
    name: 'Espresso Bar & Steam',
    tagline: 'Quiet steam hisses & warm extraction',
    icon: '☕',
    description: 'Subtle grinder whirrs, portafilter acoustics, and soft periodic milk wand steam hisses.',
  },
  {
    id: 'cafe-chatter',
    name: 'Miliana Café Chatter',
    tagline: 'Low murmur & welcoming room tone',
    icon: '🗣️',
    description: 'Gentle, unintelligible acoustic conversation warmth and distant porcelain cups.',
  },
  {
    id: 'vinyl-warmth',
    name: 'Cozy Vinyl & Acoustic',
    tagline: 'Warm analog crackle & lo-fi tone',
    icon: '📻',
    description: 'Comforting vinyl surface warmth, mellow room acoustic reflections, and deep presence.',
  },
  {
    id: 'full-blend',
    name: 'Full Café Symphony',
    tagline: 'The complete Venty café atmosphere',
    icon: '🌟',
    description: 'Immersive blend of gentle room conversation, artisan espresso steam, and warm vinyl.',
  },
];

type AudioStateListener = (state: {
  isPlaying: boolean;
  profile: SoundProfile;
  volume: number;
}) => void;

class CafeSoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentProfile: SoundProfile = 'espresso-steam';
  private volume = 0.35; // default comfortable subtle level (0 to 1)

  // Master Gain & Output
  private masterGain: GainNode | null = null;

  // Active Nodes & Timers
  private roomToneSource: AudioBufferSourceNode | null = null;
  private roomToneGain: GainNode | null = null;
  private chatterGain: GainNode | null = null;
  private chatterFilter1: BiquadFilterNode | null = null;
  private chatterFilter2: BiquadFilterNode | null = null;
  private vinylGain: GainNode | null = null;
  private steamTimer: number | null = null;
  private chatterLfoTimer: number | null = null;
  private ceramicTimer: number | null = null;

  private listeners: Set<AudioStateListener> = new Set();

  constructor() {
    // Restore saved volume and profile if available
    try {
      const savedVol = localStorage.getItem('venty_sound_volume');
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) this.volume = v;
      }
      const savedProfile = localStorage.getItem('venty_sound_profile') as SoundProfile;
      if (savedProfile && SOUND_PROFILES.some((p) => p.id === savedProfile)) {
        this.currentProfile = savedProfile;
      }
    } catch {
      // storage unavailable
    }
  }

  public subscribe(fn: AudioStateListener): () => void {
    this.listeners.add(fn);
    fn(this.getState());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((fn) => fn(s));
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      profile: this.currentProfile,
      volume: this.volume,
    };
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public setVolume(newVolume: number) {
    this.volume = Math.max(0, Math.min(1, newVolume));
    try {
      localStorage.setItem('venty_sound_volume', this.volume.toString());
    } catch {
      // ignore
    }
    if (this.masterGain && this.ctx) {
      const targetGain = this.volume * 0.18; // scaled for pleasant background levels
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    }
    this.notify();
  }

  public setProfile(profile: SoundProfile) {
    this.currentProfile = profile;
    try {
      localStorage.setItem('venty_sound_profile', profile);
    } catch {
      // ignore
    }
    if (this.isPlaying) {
      // Crossfade / update layer gains
      this.updateLayerGains();
    }
    this.notify();
  }

  public triggerSteamEffect() {
    if (!this.ctx || !this.isPlaying) {
      // If stopped, briefly start audio context to play one steam sound
      this.playOneShotSteam();
      return;
    }
    this.playSteamSound();
  }

  private initContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public start() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Master Gain setup
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, now);
      this.masterGain.gain.exponentialRampToValueAtTime(this.volume * 0.18, now + 0.8);
      this.masterGain.connect(this.ctx.destination);

      // 1. Build Base Pink Noise Cafe Room Tone Buffer (4 seconds loop)
      const bufferSize = this.ctx.sampleRate * 4;
      const roomBuffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = roomBuffer.getChannelData(ch);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.025;
          b6 = white * 0.115926;
        }
      }

      this.roomToneSource = this.ctx.createBufferSource();
      this.roomToneSource.buffer = roomBuffer;
      this.roomToneSource.loop = true;

      // Warm Room Tone Filter (mellow low pass)
      const roomFilter = this.ctx.createBiquadFilter();
      roomFilter.type = 'lowpass';
      roomFilter.frequency.setValueAtTime(450, now);

      this.roomToneGain = this.ctx.createGain();
      this.roomToneGain.gain.setValueAtTime(0.5, now);

      this.roomToneSource.connect(roomFilter);
      roomFilter.connect(this.roomToneGain);
      this.roomToneGain.connect(this.masterGain);
      this.roomToneSource.start(0);

      // 2. Build Chatter Murmur Layer (multi-band vocal formant resonance)
      this.setupChatterLayer();

      // 3. Build Vinyl / Air Texture Layer
      this.setupVinylLayer();

      // 4. Update Layer Gains based on selected profile
      this.updateLayerGains();

      // 5. Schedule periodic natural espresso steam bursts (every 14-22 seconds)
      this.schedulePeriodicSteam();

      // 6. Schedule subtle occasional porcelain cup clinks (every 16-28 seconds)
      this.schedulePeriodicCeramics();

      this.isPlaying = true;
      this.notify();
    } catch {
      this.isPlaying = false;
      this.notify();
    }
  }

  private setupChatterLayer() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Dual Formant Filter setup mimicking low cafe chatter murmur
    this.chatterGain = this.ctx.createGain();
    this.chatterGain.gain.setValueAtTime(0.01, now);

    this.chatterFilter1 = this.ctx.createBiquadFilter();
    this.chatterFilter1.type = 'bandpass';
    this.chatterFilter1.frequency.setValueAtTime(620, now); // speech low formant
    this.chatterFilter1.Q.setValueAtTime(2.2, now);

    this.chatterFilter2 = this.ctx.createBiquadFilter();
    this.chatterFilter2.type = 'bandpass';
    this.chatterFilter2.frequency.setValueAtTime(1150, now); // speech mid formant
    this.chatterFilter2.Q.setValueAtTime(2.8, now);

    if (this.roomToneSource) {
      this.roomToneSource.connect(this.chatterFilter1);
      this.chatterFilter1.connect(this.chatterGain);

      this.roomToneSource.connect(this.chatterFilter2);
      this.chatterFilter2.connect(this.chatterGain);

      this.chatterGain.connect(this.masterGain);
    }

    // Gentle speech LFO wandering timer (subtle waxing and waning)
    if (this.chatterLfoTimer) {
      window.clearInterval(this.chatterLfoTimer);
      this.chatterLfoTimer = null;
    }
    this.chatterLfoTimer = window.setInterval(() => {
      if (!this.ctx || !this.chatterGain) return;
      const targetChatter =
        this.currentProfile === 'cafe-chatter' || this.currentProfile === 'full-blend'
          ? 0.35 + (Math.random() * 0.2 - 0.1)
          : 0.05;
      this.chatterGain.gain.setTargetAtTime(targetChatter, this.ctx.currentTime, 1.8);
    }, 2400);
  }

  private setupVinylLayer() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    this.vinylGain = this.ctx.createGain();
    this.vinylGain.gain.setValueAtTime(0.01, now);

    // Warm high-shelf acoustic air filter
    const highFilter = this.ctx.createBiquadFilter();
    highFilter.type = 'highpass';
    highFilter.frequency.setValueAtTime(1800, now);

    if (this.roomToneSource) {
      this.roomToneSource.connect(highFilter);
      highFilter.connect(this.vinylGain);
      this.vinylGain.connect(this.masterGain);
    }
  }

  private updateLayerGains() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const p = this.currentProfile;

    if (this.roomToneGain) {
      const roomTarget = p === 'vinyl-warmth' ? 0.35 : 0.5;
      this.roomToneGain.gain.setTargetAtTime(roomTarget, now, 0.4);
    }

    if (this.chatterGain) {
      const chatterTarget = p === 'cafe-chatter' ? 0.45 : p === 'full-blend' ? 0.32 : 0.04;
      this.chatterGain.gain.setTargetAtTime(chatterTarget, now, 0.4);
    }

    if (this.vinylGain) {
      const vinylTarget = p === 'vinyl-warmth' ? 0.4 : p === 'full-blend' ? 0.25 : 0.08;
      this.vinylGain.gain.setTargetAtTime(vinylTarget, now, 0.4);
    }
  }

  // Realistic procedural milk steam wand burst
  private playSteamSound() {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;

      // 1.5 - 2.8 second steam duration
      const steamDuration = 1.8 + Math.random() * 0.9;
      const bufferSize = Math.floor(this.ctx.sampleRate * steamDuration);
      const steamBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = steamBuffer.getChannelData(0);

      // High frequency textured hiss
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }

      const steamSource = this.ctx.createBufferSource();
      steamSource.buffer = steamBuffer;

      // Steam bandpass: centered on 2.6kHz with resonant froth
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(2400 + (Math.random() * 400 - 200), now);
      bandpass.Q.setValueAtTime(1.8, now);

      // Steam gain envelope: quick breath-in attack, frothing sustain, smooth release
      const steamGain = this.ctx.createGain();
      const attackTime = 0.25;
      const releaseTime = 0.8;

      steamGain.gain.setValueAtTime(0.001, now);
      steamGain.gain.linearRampToValueAtTime(0.35, now + attackTime);
      steamGain.gain.exponentialRampToValueAtTime(
        0.001,
        now + steamDuration - releaseTime + releaseTime,
      );

      steamSource.connect(bandpass);
      bandpass.connect(steamGain);
      steamGain.connect(this.masterGain);

      steamSource.start(now);
      steamSource.stop(now + steamDuration + 0.1);
    } catch {
      // ignore
    }
  }

  // Play a single standalone steam sound even if main loop is paused
  private playOneShotSteam() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = 2.0;
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2500, now);
      bp.Q.setValueAtTime(2.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.25, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      src.connect(bp);
      bp.connect(gain);
      gain.connect(this.ctx.destination);

      src.start(now);
      src.stop(now + duration + 0.1);
    } catch {
      // ignore
    }
  }

  // Subtle porcelain cup chime / barista bar clink
  private playCeramicClink() {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Soft high metallic / ceramic bell frequency
      const freq = 2100 + (Math.random() * 600 - 300);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // ignore
    }
  }

  private schedulePeriodicSteam() {
    if (this.steamTimer) window.clearTimeout(this.steamTimer);
    const nextInterval = 12000 + Math.random() * 12000; // 12 to 24s
    this.steamTimer = window.setTimeout(() => {
      if (this.isPlaying) {
        if (this.currentProfile === 'espresso-steam' || this.currentProfile === 'full-blend') {
          this.playSteamSound();
        }
        this.schedulePeriodicSteam();
      }
    }, nextInterval);
  }

  private schedulePeriodicCeramics() {
    if (this.ceramicTimer) window.clearTimeout(this.ceramicTimer);
    const nextInterval = 18000 + Math.random() * 16000; // 18 to 34s
    this.ceramicTimer = window.setTimeout(() => {
      if (this.isPlaying) {
        if (Math.random() > 0.3) {
          this.playCeramicClink();
        }
        this.schedulePeriodicCeramics();
      }
    }, nextInterval);
  }

  public stop() {
    try {
      if (this.steamTimer) {
        window.clearTimeout(this.steamTimer);
        this.steamTimer = null;
      }
      if (this.ceramicTimer) {
        window.clearTimeout(this.ceramicTimer);
        this.ceramicTimer = null;
      }
      if (this.chatterLfoTimer) {
        window.clearInterval(this.chatterLfoTimer);
        this.chatterLfoTimer = null;
      }

      if (this.masterGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        setTimeout(() => {
          try {
            if (this.roomToneSource) {
              this.roomToneSource.stop();
              this.roomToneSource.disconnect();
              this.roomToneSource = null;
            }
            if (this.ctx && this.ctx.state !== 'closed') {
              this.ctx.close();
              this.ctx = null;
            }
          } catch {
            // ignore cleanup errors
          }
          this.isPlaying = false;
          this.notify();
        }, 380);
      } else {
        this.isPlaying = false;
        this.notify();
      }
    } catch {
      this.isPlaying = false;
      this.notify();
    }
  }
}

export const cafeAudio = new CafeSoundSynthesizer();
