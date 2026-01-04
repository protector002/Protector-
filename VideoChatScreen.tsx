import React, { useEffect, useRef, useState } from 'react';
import ShieldLogo from '../components/ShieldLogo';
import HudOverlay from '../components/HudOverlay';
import { GeminiLiveService } from '../services/geminiLiveService';
import { soundEffects } from '../utils/soundEffects';

interface Props {
  onBack: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const VideoChatScreen: React.FC<Props> = ({ onBack, isSoundEnabled, toggleSound }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [callDuration, setCallDuration] = useState(0);
  const [confidence, setConfidence] = useState(100);
  
  // Hardware Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For frame processing
  const visualizerRef = useRef<HTMLCanvasElement>(null); // For AI animation
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio/AI Refs
  const outputCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const liveClientRef = useRef<GeminiLiveService | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Call Timer
  useEffect(() => {
    let interval: any;
    if (status === 'connected') {
        interval = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Confidence Simulation
  useEffect(() => {
    if (status !== 'connected') {
        setConfidence(0);
        return;
    }
    const interval = setInterval(() => {
        // Simulate confidence fluctuation
        const target = isAiSpeaking ? 99.5 : 95.0;
        const fluctuation = (Math.random() - 0.5) * (isAiSpeaking ? 1.0 : 4.0);
        
        setConfidence(prev => {
            const newValue = target + fluctuation;
            // Smooth lerp
            return prev + (newValue - prev) * 0.2;
        });
    }, 500);
    return () => clearInterval(interval);
  }, [status, isAiSpeaking]);


  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialization
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        if (!process.env.API_KEY) {
            throw new Error("API Key missing");
        }

        // 1. Setup Video Camera (User Feed)
        const videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "user"
            },
            audio: false // Audio handled by service
        });
        
        streamRef.current = videoStream;
        if (videoRef.current) {
            videoRef.current.srcObject = videoStream;
            videoRef.current.play();
        }

        // 2. Setup Audio Output & Analyser
        outputCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Ensure context is running
        if (outputCtxRef.current.state === 'suspended') {
            await outputCtxRef.current.resume();
        }

        // Create Analyser for visualization
        analyserRef.current = outputCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 256; // Smaller FFT for smoother wave
        analyserRef.current.smoothingTimeConstant = 0.5;

        outputGainRef.current = outputCtxRef.current.createGain();
        
        // Connect Analyser to Gain, then Gain to Destination
        analyserRef.current.connect(outputGainRef.current);
        outputGainRef.current.connect(outputCtxRef.current.destination);

        // 3. Initialize Service
        const service = new GeminiLiveService(process.env.API_KEY);
        liveClientRef.current = service;

        await service.connect({
          onStatusChange: (connected) => {
            if (!isMounted) return;
            const newStatus = connected ? 'connected' : 'disconnected';
            setStatus(newStatus);
            if (newStatus === 'connected') {
                soundEffects.playListeningSound();
                startFrameStream();
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
          setErrorMessage(e.message || "Failed to access camera or microphone.");
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      stopFrameStream();
      stopAllAudio();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      
      // Stop Camera
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
      }
      
      liveClientRef.current?.disconnect();
      outputCtxRef.current?.close();
    };
  }, []);

  const startVisualizer = () => {
    const render = () => {
        if (!visualizerRef.current || !analyserRef.current) {
            animationFrameRef.current = requestAnimationFrame(render);
            return;
        }

        const canvas = visualizerRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas if needed
        if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        const width = canvas.width;
        const height = canvas.height;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, width, height);

        // Draw Waveform Visualizer (Simulating Voice)
        if (isAiSpeaking) {
            const barWidth = (width / bufferLength) * 2.5;
            let x = 0;
            
            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#eab308';
            ctx.fillStyle = 'rgba(234, 179, 8, 0.8)';

            // Center the wave
            const centerY = height * 0.8; 

            for(let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * height * 0.3;
                
                // Draw mirrored bars from center
                ctx.fillRect(width/2 + x, centerY - barHeight/2, barWidth, barHeight);
                ctx.fillRect(width/2 - x, centerY - barHeight/2, barWidth, barHeight);

                x += barWidth + 1;
                if (x > width/2) break;
            }
        }

        animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
  };

  const startFrameStream = () => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    
    // Increased Frame Rate: Send frames every 150ms (~7 FPS)
    // 250ms was decent, but 150ms gives faster visual reaction time without overwhelming bandwidth
    frameIntervalRef.current = window.setInterval(() => {
        if (!videoRef.current || !canvasRef.current || !liveClientRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw video frame to canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 jpeg
        const base64Data = canvas.toDataURL('image/jpeg', 0.5); 
        const cleanBase64 = base64Data.split(',')[1];
        
        liveClientRef.current.sendImageFrame(cleanBase64);

    }, 150); 
  };

  const stopFrameStream = () => {
    if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
    }
  };

  const playAudioChunk = (buffer: AudioBuffer) => {
    if (!outputCtxRef.current || !outputGainRef.current || !analyserRef.current) return;

    if (scheduledSourcesRef.current.size === 0) {
        soundEffects.playResponseSound();
    }

    const ctx = outputCtxRef.current;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    // Connect Source -> Analyser -> Gain -> Destination
    source.connect(analyserRef.current);

    const currentTime = ctx.currentTime;
    
    // Low Latency Scheduling:
    // Tightened to 20ms safety buffer (down from 50ms) for quicker start
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

  return (
    <div className="relative w-full h-full bg-neutral-900 overflow-hidden flex flex-col">
      
      {/* 1. Main Background Layer - The Logo Avatar */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-0 bg-neutral-900">
         
         {/* The Logo */}
         <div className={`relative flex items-center justify-center transition-all duration-300 ease-out ${isAiSpeaking ? 'scale-110' : 'scale-100'}`}>
            {/* Dynamic Glow Behind Logo */}
            <div className={`absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full transition-opacity duration-300 ${isAiSpeaking ? 'opacity-100' : 'opacity-20'}`}></div>
            <ShieldLogo size={300} />
         </div>

         {/* Scanline / Digital Texture Overlay */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,11,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] pointer-events-none"></div>
         
         {/* Vignette */}
         <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/90"></div>

         {/* Voice Waveform Overlay (Simulating Talking) */}
         <canvas 
            ref={visualizerRef} 
            className="absolute bottom-32 left-0 right-0 w-full h-32 pointer-events-none mix-blend-screen opacity-80"
         />
      </div>

      {/* 2. HUD Overlay (New) */}
      <HudOverlay />

      {/* 3. Picture-in-Picture (User Video Feed) */}
      <div className="absolute top-24 left-4 w-32 md:w-40 aspect-[3/4] rounded-lg overflow-hidden border border-yellow-700/50 bg-black z-20 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
         <video 
            ref={videoRef}
            className="w-full h-full object-cover transform scale-x-[-1] opacity-90"
            playsInline
            muted 
         />
         {/* PIP Overlay */}
         <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-yellow-500/50 animate-[scan_3s_linear_infinite]"></div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm py-0.5 border-t border-yellow-900/30">
               <p className="text-[8px] text-center text-yellow-500 font-mono tracking-widest">USER_UPLINK</p>
            </div>
         </div>
      </div>

      {/* Hidden Canvas for Frame Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 4. Interface Overlays */}
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 z-30 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
          {/* Identity */}
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border border-yellow-600/50 bg-yellow-900/20 flex items-center justify-center backdrop-blur-sm">
                <ShieldLogo size={24} />
             </div>
             <div>
                 <h3 className="text-gold-3d font-bold tracking-widest text-sm">PROTECTOR AI</h3>
                 <p className="text-[10px] text-yellow-500/60 font-mono">SECURE VIDEO CHANNEL</p>
             </div>
          </div>

          {/* Call Timer */}
          <div className="flex flex-col items-end">
              <span className="text-2xl font-mono text-white/90 font-light tracking-wider drop-shadow-md">{formatTime(callDuration)}</span>
              <div className="flex gap-1 items-end h-4 mt-1 opacity-70">
                  <div className="w-0.5 h-1.5 bg-green-500"></div>
                  <div className="w-0.5 h-2.5 bg-green-500"></div>
                  <div className="w-0.5 h-3.5 bg-green-500"></div>
                  <div className="w-0.5 h-2 bg-green-500/30"></div>
              </div>
          </div>
      </div>

      {/* Status Text (Lower Center) */}
      <div className="absolute bottom-40 left-0 right-0 flex justify-center z-20 pointer-events-none">
         <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-yellow-900/50">
            <span className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-yellow-400 animate-pulse' : 'bg-yellow-900'}`}></span>
            <p className="text-yellow-500 font-mono text-xs tracking-[0.2em] uppercase">
                {status === 'connected' ? (isAiSpeaking ? 'INCOMING TRANSMISSION' : 'AGENT LISTENING') : 'ESTABLISHING LINK...'}
            </p>
         </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-30 flex justify-center items-end bg-gradient-to-t from-black via-black/80 to-transparent h-48">
         <div className="flex items-center gap-8 pointer-events-auto mb-4">
             
             {/* Sound Toggle */}
             <button 
                onClick={toggleSound}
                className={`p-4 rounded-full backdrop-blur-md border transition-all duration-300 hover:scale-110 ${isSoundEnabled ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-transparent text-white/50'}`}
             >
                 {isSoundEnabled ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                 ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                 )}
             </button>

             {/* End Call Button */}
             <button 
                onClick={onBack}
                className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_25px_rgba(220,38,38,0.5)] hover:bg-red-500 hover:scale-105 transition-all duration-300 transform rotate-135"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
             </button>

             {/* Mic Toggle (Placeholder) */}
             <button className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
             </button>

         </div>
      </div>
      
      {/* Error Toast */}
      {errorMessage && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 border border-red-500 text-red-500 px-6 py-4 rounded-xl z-50 text-center shadow-2xl">
             <p className="font-bold mb-1">SIGNAL LOST</p>
             <p className="text-sm text-white/70">{errorMessage}</p>
         </div>
      )}

      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>

    </div>
  );
};

export default VideoChatScreen;