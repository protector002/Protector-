import React, { useEffect, useRef, useState } from 'react';
import ShieldLogo from '../components/ShieldLogo';
import Particles from '../components/Particles';
import { GeminiLiveService } from '../services/geminiLiveService';
import { soundEffects } from '../utils/soundEffects';

interface Props {
  onBack: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const ChatScreen: React.FC<Props> = ({ onBack, isSoundEnabled, toggleSound }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Audio Refs
  const outputCtxRef = useRef<AudioContext | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const liveClientRef = useRef<GeminiLiveService | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialization
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        if (!process.env.API_KEY) {
            throw new Error("API Key missing");
        }

        // Initialize Audio Output Context
        outputCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Ensure context is running
        if (outputCtxRef.current.state === 'suspended') {
            await outputCtxRef.current.resume();
        }

        outputGainRef.current = outputCtxRef.current.createGain();
        analyserRef.current = outputCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 64; // Smaller for punchy circle viz
        
        outputGainRef.current.connect(analyserRef.current);
        analyserRef.current.connect(outputCtxRef.current.destination);

        // Initialize Service
        const service = new GeminiLiveService(process.env.API_KEY);
        liveClientRef.current = service;

        await service.connect({
          onStatusChange: (connected) => {
            if (!isMounted) return;
            const newStatus = connected ? 'connected' : 'disconnected';
            setStatus(newStatus);
            if (newStatus === 'connected') {
                soundEffects.playListeningSound();
                startVisualizer();
            }
          },
          onAudioData: (buffer) => {
            if (!isMounted || !outputCtxRef.current || !outputGainRef.current) return;
            playAudioChunk(buffer);
          },
          onError: (err) => {
            if (!isMounted) return;
            setStatus('error');
            setErrorMessage(err);
          },
          onClose: () => {
            if (!isMounted) return;
            setStatus('disconnected');
          },
          onInterrupted: () => {
            stopAllAudio();
          }
        }, outputCtxRef.current);

      } catch (e: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(e.message);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      stopAllAudio();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      liveClientRef.current?.disconnect();
      outputCtxRef.current?.close();
    };
  }, []);

  const startVisualizer = () => {
    const render = () => {
        if (!canvasRef.current || !analyserRef.current) {
            animationFrameRef.current = requestAnimationFrame(render);
            return;
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize
        if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average energy
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const pulse = 1 + (average / 255) * 0.5;

        ctx.clearRect(0, 0, width, height);
        
        // --- ARC REACTOR VISUALIZER ---

        // 1. Outer Glow Ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * pulse, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(234, 179, 8, ${0.1 + (average/255)*0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. Inner Rotating Segments
        const segments = 12;
        const angleStep = (Math.PI * 2) / segments;
        const rotation = Date.now() / 1000; // Rotating

        for(let i=0; i<segments; i++) {
            const angle = i * angleStep + rotation;
            const barHeight = (dataArray[i % bufferLength] / 255) * 50;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            
            // Draw bar extending outward
            ctx.fillStyle = `rgba(234, 179, 8, ${0.5 + (average/255)*0.5})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#eab308';
            
            ctx.beginPath();
            // Trapezoid shape for reactor feel
            ctx.moveTo(radius * 0.8, -2);
            ctx.lineTo(radius * 0.8 + 20 + barHeight, -5);
            ctx.lineTo(radius * 0.8 + 20 + barHeight, 5);
            ctx.lineTo(radius * 0.8, 2);
            ctx.fill();

            ctx.restore();
        }

        // 3. Core
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Core text/icon
        if (average > 20) {
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.3 * (average/255), 0, 2 * Math.PI);
            ctx.fill();
        }

        animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
  };

  const playAudioChunk = (buffer: AudioBuffer) => {
    if (!outputCtxRef.current || !outputGainRef.current) return;

    if (scheduledSourcesRef.current.size === 0) {
        soundEffects.playResponseSound();
    }

    const ctx = outputCtxRef.current;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(outputGainRef.current);

    const currentTime = ctx.currentTime;
    
    // Low Latency Scheduling:
    // Tightened to 20ms safety buffer
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime + 0.02;
    }

    source.start(nextStartTimeRef.current);
    scheduledSourcesRef.current.add(source);

    setIsAiSpeaking(true);

    source.onended = () => {
      scheduledSourcesRef.current.delete(source);
      if (scheduledSourcesRef.current.size === 0) {
        setIsAiSpeaking(false);
      }
    };

    nextStartTimeRef.current += buffer.duration;
  };

  const stopAllAudio = () => {
    scheduledSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    scheduledSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsAiSpeaking(false);
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 overflow-hidden">
      <Particles />

      {/* Header */}
      <div className="z-10 w-full flex flex-col items-center pt-8 md:pt-12 space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-gold-3d tracking-wider uppercase">
            Protector AI
        </h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
        
        {/* Status Text */}
        <div className="h-12 flex items-center justify-center mb-8">
           {status === 'connecting' && (
             <p className="text-yellow-200/50 animate-pulse text-lg tracking-widest font-serif">INITIALIZING SECURE LINK...</p>
           )}
           {status === 'error' && (
             <p className="text-red-500 text-lg tracking-widest font-serif font-bold">CONNECTION ERROR</p>
           )}
           {status === 'connected' && (
              <p className="text-gold animate-pulse text-xl md:text-2xl font-serif tracking-widest italic drop-shadow-lg">
                Listening for your request...
              </p>
           )}
        </div>

        {/* ARC REACTOR Visualizer */}
        <div className="relative w-80 h-80 flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full absolute inset-0" />
            
            {/* Center Logo Static if needed, but drawing on canvas is better for reactor effect */}
            <div className={`pointer-events-none transition-opacity duration-500 ${isAiSpeaking ? 'opacity-0' : 'opacity-100'}`}>
                <ShieldLogo size={80} />
            </div>
        </div>

        {errorMessage && (
             <p className="mt-8 text-red-400 text-sm max-w-md text-center px-4">{errorMessage}</p>
        )}
      </div>

      {/* Footer Controls */}
      <div className="z-20 w-full p-8 flex justify-between items-end">
         {/* Cancel Button */}
         <button 
            onClick={handleBack}
            className="w-14 h-14 border border-yellow-700/50 rounded-xl flex items-center justify-center text-yellow-600 hover:text-yellow-300 hover:border-yellow-400 hover:bg-yellow-900/20 transition-all duration-300 group"
            aria-label="Cancel"
         >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
         </button>

         {/* Sound Toggle Button */}
         <button 
            onClick={toggleSound}
            className={`w-14 h-14 border rounded-xl flex items-center justify-center transition-all duration-300 ${isSoundEnabled ? 'border-yellow-700/50 text-yellow-500 hover:bg-yellow-900/20' : 'border-neutral-700 text-neutral-500 hover:text-neutral-300'}`}
            aria-label="Toggle Sound"
         >
             {isSoundEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
             )}
         </button>
      </div>
    </div>
  );
};

export default ChatScreen;