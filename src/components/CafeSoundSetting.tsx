import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Volume1,
  Sliders,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Play,
  Square,
  Coffee,
  Wind,
} from 'lucide-react';
import {
  cafeAudio,
  SOUND_PROFILES,
  SoundProfile,
} from '../utils/audioAmbience';

interface CafeSoundSettingProps {
  className?: string;
  defaultExpanded?: boolean;
}

export const CafeSoundSetting: React.FC<CafeSoundSettingProps> = ({
  className = '',
  defaultExpanded = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [profile, setProfile] = useState<SoundProfile>('espresso-steam');
  const [volume, setVolume] = useState(0.35);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [steamPlayingNotice, setSteamPlayingNotice] = useState(false);

  // Subscribe to global sound engine state changes
  useEffect(() => {
    const unsubscribe = cafeAudio.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setProfile(state.profile);
      setVolume(state.volume);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggle = () => {
    cafeAudio.toggle();
  };

  const handleProfileSelect = (newProfile: SoundProfile) => {
    cafeAudio.setProfile(newProfile);
    if (!isPlaying) {
      cafeAudio.start();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    cafeAudio.setVolume(val);
  };

  const handleTriggerSteam = () => {
    cafeAudio.triggerSteamEffect();
    setSteamPlayingNotice(true);
    window.setTimeout(() => setSteamPlayingNotice(false), 2200);
  };

  const currentProfileMeta =
    SOUND_PROFILES.find((p) => p.id === profile) || SOUND_PROFILES[0];

  return (
    <div
      className={`rounded-2xl border border-[#482819] bg-gradient-to-br from-[#291309] to-[#1c0c05] text-[#faf6ee] p-4 sm:p-5 shadow-[0_12px_36px_-12px_rgba(0,0,0,0.6)] ${className}`}
    >
      {/* 1. Primary Compact Sound Controller Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Animated Equalizer or Vinyl Icon Button */}
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isPlaying ? 'Pause café ambience sound' : 'Start café ambience sound'}
            title={isPlaying ? 'Pause café sound' : 'Play subtle café ambience sound'}
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 cursor-pointer shadow-sm ${
              isPlaying
                ? 'bg-gradient-to-br from-[#c9833a] to-[#a86522] border-[#f4d19b]/50 text-[#1a0c06] shadow-[0_0_20px_rgba(201,131,58,0.35)]'
                : 'bg-white/5 border-white/10 hover:border-[#c9833a]/50 text-[#df9e59] hover:bg-white/10'
            }`}
          >
            {isPlaying ? (
              <div className="flex items-end justify-center gap-[3px] h-4 w-4">
                <span className="w-1 bg-[#1a0c06] rounded-full animate-[soundWave_0.8s_ease-in-out_infinite]" />
                <span className="w-1 bg-[#1a0c06] rounded-full animate-[soundWave_1.1s_ease-in-out_infinite_0.2s]" />
                <span className="w-1 bg-[#1a0c06] rounded-full animate-[soundWave_0.9s_ease-in-out_infinite_0.4s]" />
              </div>
            ) : (
              <VolumeX className="w-5 h-5 text-[#8a7b70]" />
            )}
          </button>

          {/* Ambience Status & Profile Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#c9833a]">
                GLOBAL CAFÉ AMBIENCE
              </span>
              {isPlaying && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#2e7d32]/25 border border-[#2e7d32]/40 text-[#81c784] text-[9px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#81c784] animate-ping" />
                  Live Playing
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-serif font-medium text-sm sm:text-base text-white truncate">
                {currentProfileMeta.icon} {currentProfileMeta.name}
              </span>
              <span className="text-xs text-[#d8cbb8]/60 hidden xs:inline">
                · {isPlaying ? `${Math.round(volume * 100)}% Volume` : 'Muted'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls: Volume Slider & Sound Options Accordion */}
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-white/5">
          {/* Quick Volume Slider */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => cafeAudio.setVolume(volume === 0 ? 0.35 : 0)}
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
              className="text-[#df9e59] hover:text-white transition-colors cursor-pointer p-1"
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#8a7b70]" />
              ) : volume < 0.4 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Cafe ambience volume"
              className="w-20 sm:w-24 h-1.5 rounded-lg bg-[#3d2013] accent-[#c9833a] cursor-pointer"
            />
            <span className="font-mono text-[10.5px] text-[#c9833a] w-7 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Expand Settings Drawer */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-label="Toggle cafe sound settings profiles and steam test"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#df9e59] hover:text-white border border-[#482819] transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#c9833a]" />
            <span className="hidden sm:inline">Sound Profiles</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Expandable Acoustic Control Center */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-[#3d2013] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-serif font-bold text-base text-[#f4d19b] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#c9833a]" />
                    Artisanal Sound Profiles
                  </h4>
                  <p className="font-sans text-xs text-[#a89587]">
                    Procedurally synthesized Web Audio layers to accompany your coffee ordering.
                  </p>
                </div>

                {/* Steam Wand Test Button */}
                <button
                  type="button"
                  onClick={handleTriggerSteam}
                  disabled={steamPlayingNotice}
                  title="Simulate milk frother steam wand hiss"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    steamPlayingNotice
                      ? 'bg-[#c9833a] text-[#1a0c06] border-[#f4d19b]'
                      : 'bg-[#35170d] hover:bg-[#452013] text-[#df9e59] border-[#552918]'
                  }`}
                >
                  <Wind
                    className={`w-3.5 h-3.5 ${
                      steamPlayingNotice ? 'animate-spin text-[#1a0c06]' : 'text-[#c9833a]'
                    }`}
                  />
                  <span>{steamPlayingNotice ? 'Frothing Steam...' : 'Test Steam Wand Hiss'}</span>
                </button>
              </div>

              {/* Profile Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {SOUND_PROFILES.map((p) => {
                  const isSelected = profile === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProfileSelect(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                        isSelected
                          ? 'bg-[#c9833a]/20 border-[#c9833a] shadow-[0_0_15px_rgba(201,131,58,0.2)]'
                          : 'bg-black/20 hover:bg-black/35 border-[#3c1e12] hover:border-[#63351f]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-base">{p.icon}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#c9833a] text-[#1a0c06] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div className="font-serif font-bold text-xs sm:text-sm text-white group-hover:text-[#f4d19b] transition-colors">
                        {p.name}
                      </div>
                      <p className="font-sans text-[11px] text-[#a89587] mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Explanatory Footer Note */}
              <div className="flex items-center justify-between text-[11px] text-[#8a7b70] pt-1">
                <span>
                  💡 Works seamlessly across mobile & desktop. Audio runs locally in your browser.
                </span>
                <span className="font-mono text-[10px] text-[#c9833a]">
                  Venty Sound Synthesizer v2.0
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
