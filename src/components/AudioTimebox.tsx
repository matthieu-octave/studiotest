import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, CloudRain, ShieldCheck, Keyboard, VolumeX, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FocusPreset, FocusSound } from '../types';

const PRESETS: FocusPreset[] = [
  { id: 'pomodoro', name: 'Deep Focus', duration: 25, description: 'Sustained cognitive attention block', soundEffect: 'drone' },
  { id: 'short', name: 'Short Break', duration: 5, description: 'Stretch and rest your eyes', soundEffect: 'rain' },
  { id: 'long', name: 'Strategic Break', duration: 15, description: 'Walk around, grab water, fully disengage', soundEffect: 'none' },
];

export default function AudioTimebox() {
  const [selectedPreset, setSelectedPreset] = useState<FocusPreset>(PRESETS[0]);
  const [timeLeft, setTimeLeft] = useState(selectedPreset.duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeSound, setActiveSound] = useState<FocusSound>('none');
  const [volume, setVolume] = useState(0.4);

  // Audio nodes and context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rainNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const droneOscsRef = useRef<OscillatorNode[]>([]);
  const tapIntervalRef = useRef<any>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Sync with preset change
  useEffect(() => {
    setTimeLeft(selectedPreset.duration * 60);
    setIsRunning(false);
  }, [selectedPreset]);

  // Handle countdown logic
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      playAlertBeep();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAllSounds();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Update volume when state changes
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(volume, audioCtxRef.current.currentTime + 0.1);
    }
  }, [volume]);

  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    if (!gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = volume;
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
  };

  const playAlertBeep = () => {
    try {
      initAudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const beepGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
      
      beepGain.gain.setValueAtTime(0.3, ctx.currentTime);
      beepGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.connect(beepGain);
      beepGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Web Audio Warning:', e);
    }
  };

  const stopAllSounds = () => {
    // 1. Stop rain
    if (rainNodeRef.current) {
      try {
        rainNodeRef.current.stop();
      } catch (e) {}
      rainNodeRef.current.disconnect();
      rainNodeRef.current = null;
    }

    // 2. Stop drone
    droneOscsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {}
      osc.disconnect();
    });
    droneOscsRef.current = [];

    // 3. Stop mechanical clicks
    if (tapIntervalRef.current) {
      clearInterval(tapIntervalRef.current);
      tapIntervalRef.current = null;
    }

    setActiveSound('none');
  };

  const startRainSynth = () => {
    initAudioCtx();
    const ctx = audioCtxRef.current;
    const gNode = gainNodeRef.current;
    if (!ctx || !gNode) return;

    // Generate white noise buffer
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter white noise to sound like soft rainfall (low-pass + bandpass)
    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(800, ctx.currentTime);

    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'bandpass';
    bpFilter.frequency.setValueAtTime(400, ctx.currentTime);
    bpFilter.Q.setValueAtTime(1, ctx.currentTime);

    whiteNoise.connect(lpFilter);
    lpFilter.connect(bpFilter);
    bpFilter.connect(gNode);

    whiteNoise.start();
    rainNodeRef.current = whiteNoise;
  };

  const startDroneSynth = () => {
    initAudioCtx();
    const ctx = audioCtxRef.current;
    const gNode = gainNodeRef.current;
    if (!ctx || !gNode) return;

    // Deep meditation drone
    const freq1 = 65.41; // C2
    const freq2 = 130.81; // C3
    const freq3 = 196.00; // G3

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc3.type = 'sine';

    osc1.frequency.setValueAtTime(freq1, ctx.currentTime);
    osc2.frequency.setValueAtTime(freq2, ctx.currentTime);
    osc3.frequency.setValueAtTime(freq3, ctx.currentTime);

    // Filter to warm it up
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, ctx.currentTime);

    const warmGain = ctx.createGain();
    warmGain.gain.setValueAtTime(0.15, ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);

    filter.connect(warmGain);
    warmGain.connect(gNode);

    osc1.start();
    osc2.start();
    osc3.start();

    droneOscsRef.current = [osc1, osc2, osc3];
  };

  const startTapSynth = () => {
    initAudioCtx();
    const ctx = audioCtxRef.current;
    const gNode = gainNodeRef.current;
    if (!ctx || !gNode) return;

    const playClick = () => {
      if (!ctx || !gNode) return;
      
      const bufferSize = ctx.sampleRate * 0.05; // 50ms pulse
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const clickSource = ctx.createBufferSource();
      clickSource.buffer = noiseBuffer;

      // Filter to mimic mechanical switch/clock ticks
      const hpFilter = ctx.createBiquadFilter();
      hpFilter.type = 'bandpass';
      hpFilter.frequency.setValueAtTime(2500, ctx.currentTime);
      hpFilter.Q.setValueAtTime(8, ctx.currentTime);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.04, ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      clickSource.connect(hpFilter);
      hpFilter.connect(clickGain);
      clickGain.connect(gNode);

      clickSource.start();
    };

    // Periodic schedule (resembling soft keyboard typing or metronome pendulum ticks)
    tapIntervalRef.current = setInterval(() => {
      playClick();
      // Introduce slight mechanical random delay variations (humanistic click rhythm)
      if (Math.random() > 0.4) {
        setTimeout(playClick, 180 + Math.random() * 150);
      }
    }, 1200);
  };

  const toggleSound = (sound: FocusSound) => {
    if (activeSound === sound) {
      stopAllSounds();
    } else {
      stopAllSounds();
      setActiveSound(sound);
      if (sound === 'rain') startRainSynth();
      if (sound === 'drone') startDroneSynth();
      if (sound === 'keyboard') startTapSynth();
    }
  };

  const toggleTimer = () => {
    initAudioCtx();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedPreset.duration * 60);
  };

  // Human descriptive text
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = selectedPreset.duration * 60;
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-zinc-100 flex flex-col justify-between h-full shadow-xs">
      {/* Timebox Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="font-sans font-medium text-xs tracking-wider text-zinc-400 uppercase">
            Productivity Timebox
          </span>
          <div className="flex space-x-1.5 bg-zinc-50 rounded-lg p-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                id={`btn-preset-${preset.id}`}
                onClick={() => setSelectedPreset(preset)}
                className={`text-xs px-2.5 py-1 rounded-md transition-all font-sans font-medium focus:outline-hidden ${
                  selectedPreset.id === preset.id
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {preset.name.split(' ')[0]} {/* shortened versions */}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Description */}
        <p className="font-sans text-xs text-zinc-500 mb-6 font-normal min-h-[32px]">
          {selectedPreset.description}
        </p>
      </div>

      {/* Main Clock Segment */}
      <div className="flex flex-col items-center justify-center my-4 py-4 relative">
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Circular progress container */}
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="84"
              className="stroke-zinc-50"
              strokeWidth="5"
              fill="transparent"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="84"
              className="stroke-zinc-950"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 84}
              animate={{ strokeDashoffset: (2 * Math.PI * 84) * (1 - getProgress() / 100) }}
              transition={{ ease: "linear", duration: 0.5 }}
            />
          </svg>

          {/* Core countdown stats */}
          <div className="flex flex-col items-center justify-center z-10 select-none">
            <span className="font-mono text-4xl font-bold tracking-tight text-zinc-900">
              {formatTime(timeLeft)}
            </span>
            <span className="font-sans text-[10px] tracking-widest text-zinc-400 uppercase mt-1">
              {isRunning ? 'active' : 'paused'}
            </span>
          </div>
        </div>

        {/* Clock Manipulation */}
        <div className="flex items-center space-x-4 mt-6">
          <button
            id="btn-timer-reset"
            onClick={resetTimer}
            className="p-2.5 rounded-full border border-zinc-100 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900 transition-colors focus:outline-hidden"
            title="Reset Clock"
          >
            <RotateCcw size={16} />
          </button>

          <button
            id="btn-timer-toggle"
            onClick={toggleTimer}
            className="w-14 h-14 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer focus:outline-hidden"
          >
            {isRunning ? <Pause size={20} fill="white" /> : <Play size={20} className="ml-1" fill="white" />}
          </button>

          <div className="relative group">
            <button
              id="btn-timer-volume-toggle"
              className="p-2.5 rounded-full border border-zinc-100 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900 transition-colors focus:outline-hidden"
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 hidden group-hover:flex bg-zinc-950 px-2 py-3 rounded-lg flex-col items-center shadow-xl">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-zinc-800 accent-zinc-150 rounded-lg appearance-none cursor-pointer transform -rotate-90 origin-bottom"
                style={{ marginBottom: '16px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Synthesized Ambient Sound Controller */}
      <div className="mt-4 pt-4 border-t border-zinc-50">
        <div className="text-[10px] font-sans font-semibold tracking-wider text-zinc-400 uppercase mb-3 text-center">
          Synthesized Ambient Space
        </div>
        <div className="grid grid-cols-3 gap-2">
          {/* Rain toggle option */}
          <button
            id="btn-ambient-rain"
            onClick={() => toggleSound('rain')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-sans font-medium focus:outline-hidden cursor-pointer ${
              activeSound === 'rain'
                ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs'
                : 'border-zinc-100 bg-white hover:bg-zinc-50 text-zinc-700'
            }`}
          >
            <CloudRain size={16} className="mb-1" />
            <span>Pure Rain</span>
          </button>

          {/* Cosmic Drone toggle option */}
          <button
            id="btn-ambient-drone"
            onClick={() => toggleSound('drone')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-sans font-medium focus:outline-hidden cursor-pointer ${
              activeSound === 'drone'
                ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs'
                : 'border-zinc-100 bg-white hover:bg-zinc-50 text-zinc-700'
            }`}
          >
            <Eye size={16} className="mb-1" />
            <span>Meditation</span>
          </button>

          {/* Typist Tap toggle option */}
          <button
            id="btn-ambient-clicks"
            onClick={() => toggleSound('keyboard')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-sans font-medium focus:outline-hidden cursor-pointer ${
              activeSound === 'keyboard'
                ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs'
                : 'border-zinc-100 bg-white hover:bg-zinc-50 text-zinc-700'
            }`}
          >
            <Keyboard size={16} className="mb-1" />
            <span>Ticking</span>
          </button>
        </div>
        <div className="text-[9px] text-zinc-400 mt-2 text-center font-sans tracking-wide">
          *Real-time browser logic. No static audio files.
        </div>
      </div>
    </div>
  );
}
