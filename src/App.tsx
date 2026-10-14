import { useState, useEffect } from 'react';
import { Clock, Terminal, User, Sparkles, Code2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import AudioTimebox from './components/AudioTimebox';
import GeminiBrainstorm from './components/GeminiBrainstorm';
import NotesSection from './components/NotesSection';

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [injectedPrompt, setInjectedPrompt] = useState<string>('');

  // Clock updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSendToCopilot = (promptText: string) => {
    setInjectedPrompt(promptText);
    
    // Provide visually smooth micro transition to focus attention
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearInjection = () => {
    setInjectedPrompt('');
  };

  const formatUtcTime = (date: Date) => {
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  };

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900 font-sans antialiased pb-12 selection:bg-zinc-950 selection:text-white">
      {/* Top Header Segment */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand block */}
          <div className="flex items-center space-x-3">
            <div className="bg-zinc-950 p-2.5 rounded-2xl text-white shadow-xs">
              <Code2 size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-base text-zinc-900 tracking-tight leading-none flex items-center">
                Creative Developer Hub
              </h1>
              <span className="text-[10px] font-mono font-medium text-emerald-600 block mt-1 tracking-wider uppercase">
                Node.js + React Standard Workstation
              </span>
            </div>
          </div>

          {/* Real-time UTC clock & user badge */}
          <div className="flex items-center space-x-6">
            
            {/* Clock element */}
            <div className="hidden sm:flex items-center space-x-2.5 bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-xl text-zinc-650">
              <Clock size={14} className="text-zinc-400 animate-pulse" />
              <span className="font-mono text-[11px] font-semibold text-zinc-700 select-all">
                {formatUtcTime(currentTime)}
              </span>
            </div>

            {/* User credentials */}
            <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-1.5 hover:border-zinc-200 transition-colors">
              <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                M
              </div>
              <div className="hidden md:block text-left leading-none">
                <span className="text-[10px] font-semibold tracking-wide block text-zinc-800">
                  matthieu.octave@gmail.com
                </span>
                <span className="text-[8px] font-mono text-zinc-400 tracking-normal block mt-0.5">
                  DEVELOPER ACCOUNT
                </span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main Panel grid container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Intro greeting bar */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-xs border border-zinc-800">
          <div className="absolute right-0 top-0 transform translate-x-12 -translate-y-12 opacity-10 pointer-events-none select-none">
            <Terminal size={320} />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold tracking-wider uppercase text-zinc-200 mb-4">
              <Sparkles size={11} className="text-amber-300 animate-spin" />
              <span>Express + Vite Active Environments</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2 leading-tight">
              A Unified Workbench for Creative Engineers
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans font-normal">
              Organize code snippets, set precise deep work focus loops with browser-synthesized audio, and collaborate securely with backend-proxied Gemini API utilities. Use the cards below to operate your workflow.
            </p>
          </div>
        </div>

        {/* Dynamic Multi-Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Wing Sidebar: Pomodoro audio timebox (takes 4 columns on desktop) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <AudioTimebox />
          </div>

          {/* Central Workspace: Brainstorm Sandbox & Scratchpad Panel (takes 8 columns on desktop) */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            
            {/* Chat module anchor */}
            <div id="anchor-copilot">
              <GeminiBrainstorm 
                injectedPrompt={injectedPrompt} 
                onClearInjection={clearInjection} 
              />
            </div>

            {/* Note scratchpad panel */}
            <div>
              <NotesSection onSendToCopilot={handleSendToCopilot} />
            </div>

          </div>

        </div>

      </main>

      {/* Decorative clean footer */}
      <footer className="mt-16 text-center select-none">
        <p className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">
          Interactive Developer Sandbox &bull; Created with Google AI Studio Build
        </p>
      </footer>
    </div>
  );
}
