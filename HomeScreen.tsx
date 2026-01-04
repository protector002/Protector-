import React, { useEffect, useState } from 'react';
import ShieldLogo from '../components/ShieldLogo';
import Particles from '../components/Particles';
import { soundEffects } from '../utils/soundEffects';

interface Props {
  onStartVoice: () => void;
  onStartText: () => void;
  onStartVideo: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const HomeScreen: React.FC<Props> = ({ onStartVoice, onStartText, onStartVideo, isSoundEnabled, toggleSound }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const handleStartVoice = () => {
    soundEffects.playStartSound();
    onStartVoice();
  };

  const handleStartText = () => {
    soundEffects.playStartSound();
    onStartText();
  };

  const handleStartVideo = () => {
    soundEffects.playStartSound();
    onStartVideo();
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-radial-black overflow-y-auto overflow-x-hidden">
      <Particles />
      
      {/* Background Gradient Spot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Top Bar */}
      <div className="w-full p-6 flex justify-between items-start z-20">
         <div className="flex flex-col">
            <span className="text-xs text-yellow-700 font-mono tracking-widest">LOCATION: SECURE</span>
            <span className="text-xl text-yellow-500 font-bold font-mono">{time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
         </div>
         <button 
          onClick={toggleSound}
          className="p-3 rounded-full border border-yellow-800/30 text-yellow-600 hover:text-yellow-300 hover:border-yellow-500 hover:bg-yellow-900/20 transition-all"
        >
          {isSoundEnabled ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-lg mx-auto px-4 pb-12 gap-8">
        
        {/* Main Identity */}
        <div className="flex flex-col items-center text-center space-y-4 animate-fade-in-up">
            <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-1000 ease-out"></div>
                <ShieldLogo size={120} className="drop-shadow-2xl" />
            </div>
            <div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-widest text-gold-3d uppercase font-cinzel">
                    Protector AI
                </h1>
                <p className="text-yellow-100/60 font-mono tracking-[0.3em] text-xs mt-2">
                    SYSTEM ONLINE // READY
                </p>
            </div>
        </div>

        {/* SitRep Dashboard Widget */}
        <div className="w-full bg-black/40 backdrop-blur-md border border-yellow-900/30 rounded-lg p-4 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center border-r border-yellow-900/30">
                <span className="text-[10px] text-yellow-700 font-mono mb-1">SYS INTEGRITY</span>
                <span className="text-lg text-green-500 font-bold font-mono">100%</span>
            </div>
            <div className="flex flex-col items-center border-r border-yellow-900/30">
                <span className="text-[10px] text-yellow-700 font-mono mb-1">THREAT LVL</span>
                <span className="text-lg text-yellow-500 font-bold font-mono">LOW</span>
            </div>
            <div className="flex flex-col items-center">
                 <span className="text-[10px] text-yellow-700 font-mono mb-1">LOCAL WX</span>
                 <span className="text-lg text-cyan-500 font-bold font-mono">72°F</span>
            </div>
        </div>

        {/* Actions Container */}
        <div className="w-full flex flex-col gap-4">
            
            {/* Voice Chat Button */}
            <button
              onClick={handleStartVoice}
              className="group relative w-full py-4 bg-transparent overflow-hidden rounded-sm transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 border border-yellow-600/50 group-hover:border-yellow-400 transition-colors duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-900/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              
              <div className="relative z-10 flex items-center justify-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                  <span className="text-lg font-mono text-yellow-400 font-bold tracking-widest uppercase group-hover:text-yellow-200 transition-colors drop-shadow-md">
                    Voice Protocol
                  </span>
              </div>
            </button>

            {/* Video Chat Button */}
            <button
              onClick={handleStartVideo}
              className="group relative w-full py-4 bg-transparent overflow-hidden rounded-sm transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 border border-yellow-700/40 group-hover:border-yellow-500 transition-colors duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-800/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 delay-100"></div>
              
              <div className="relative z-10 flex items-center justify-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                  <span className="text-lg font-mono text-yellow-500 font-bold tracking-widest uppercase group-hover:text-yellow-300 transition-colors drop-shadow-md">
                    Visual Uplink
                  </span>
              </div>
            </button>

            {/* Text Chat Button */}
            <button
              onClick={handleStartText}
              className="group relative w-full py-4 bg-transparent overflow-hidden rounded-sm transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 border border-yellow-800/30 group-hover:border-yellow-600/50 transition-colors duration-300"></div>
              <div className="absolute inset-0 bg-yellow-900/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
              
              <div className="relative z-10 flex items-center justify-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600/70 group-hover:text-yellow-500"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                  <span className="text-lg font-mono text-yellow-600/70 font-bold tracking-widest uppercase group-hover:text-yellow-400 transition-colors drop-shadow-md">
                    Text Terminal
                  </span>
              </div>
            </button>
        </div>
      </div>

      <style>{`
        .bg-radial-black {
          background: radial-gradient(circle at center, #1a1a1a 0%, #000000 100%);
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HomeScreen;