import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import ShieldLogo from '../components/ShieldLogo';
import Particles from '../components/Particles';
import { soundEffects } from '../utils/soundEffects';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

interface Props {
  onBack: () => void;
}

const TextChatScreen: React.FC<Props> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize Chat Session
    if (process.env.API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Switched to 'gemini-2.5-flash' for significantly faster latency compared to gemini-3-flash-preview
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          // Removed thinkingConfig to reduce overhead and improve response speed
          // Updated systemInstruction with specific identity rules
          systemInstruction: "You are Protector AI. If asked 'what is your name', say 'I am Protector AI'. If asked 'who created you', say 'By Protector Software'. Be concise, helpful, and protective.",
        }
      });
      
      // Initial greeting
      setMessages([{
        id: 'init',
        role: 'model',
        text: "Secure terminal established. Protector AI online. How may I assist you today?"
      }]);
      soundEffects.playListeningSound();
    }
  }, []);

  useEffect(() => {
    // Auto scroll
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatSessionRef.current || isLoading) return;

    const userMsgText = inputText.trim();
    setInputText('');
    
    // Reset textarea height
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    const newMessageId = Date.now().toString();
    const responseId = (Date.now() + 1).toString();
    
    // Add User Message AND Placeholder Model Message immediately to reduce perceived latency
    setMessages(prev => [
        ...prev, 
        {
            id: newMessageId,
            role: 'user',
            text: userMsgText
        },
        {
            id: responseId,
            role: 'model',
            text: "",
            isStreaming: true
        }
    ]);

    setIsLoading(true);
    soundEffects.playStartSound(); // Subtle click effect

    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: userMsgText });
      
      let fullResponseText = "";
      let hasPlayedResponseSound = false;

      for await (const chunk of result) {
         const c = chunk as GenerateContentResponse;
         const text = c.text || "";
         fullResponseText += text;
         
         if (!hasPlayedResponseSound && fullResponseText.length > 0) {
            soundEffects.playResponseSound();
            hasPlayedResponseSound = true;
         }

         setMessages(prev => prev.map(msg => 
            msg.id === responseId 
                ? { ...msg, text: fullResponseText } 
                : msg
         ));
      }

      setMessages(prev => prev.map(msg => 
            msg.id === responseId 
                ? { ...msg, isStreaming: false } 
                : msg
      ));

    } catch (error) {
        console.error("Chat error", error);
        setMessages(prev => prev.map(msg => 
            msg.id === responseId 
                ? { ...msg, text: "Error: Secure connection interrupted. Please retry.", isStreaming: false } 
                : msg
        ));
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto-grow textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 overflow-hidden">
      <Particles />

      {/* Header */}
      <div className="z-10 w-full flex items-center justify-between p-4 border-b border-yellow-900/30 bg-neutral-900/80 backdrop-blur-md">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10">
                <ShieldLogo size={32} />
            </div>
            <h2 className="text-xl font-bold text-gold-3d tracking-wider uppercase hidden md:block">
                Protector AI <span className="text-xs text-yellow-600 ml-2 font-mono tracking-normal">TERMINAL_V1.0</span>
            </h2>
         </div>
         <button 
            onClick={onBack}
            className="p-2 text-yellow-600 hover:text-yellow-400 hover:bg-yellow-900/20 rounded-lg transition-colors"
         >
            <span className="sr-only">Exit</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
         </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 z-10 scrollbar-thin scrollbar-thumb-yellow-900/50 scrollbar-track-transparent">
         {messages.map((msg) => (
             <div 
                key={msg.id} 
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
             >
                 <div className={`max-w-[85%] md:max-w-[70%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Icon Avatar */}
                    <div className="flex-shrink-0 mt-1">
                        {msg.role === 'model' ? (
                            <div className="w-8 h-8 rounded-full bg-yellow-900/20 border border-yellow-700/50 flex items-center justify-center">
                                <ShieldLogo size={16} />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                        )}
                    </div>

                    {/* Bubble */}
                    <div className={`
                        relative px-5 py-3 text-sm md:text-base leading-relaxed
                        ${msg.role === 'user' 
                            ? 'bg-gradient-to-br from-yellow-900/40 to-neutral-900 border border-yellow-700/30 text-yellow-100 rounded-2xl rounded-tr-sm' 
                            : 'bg-neutral-900/80 border border-neutral-800 text-yellow-500/90 rounded-2xl rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                        }
                    `}>
                        {msg.isStreaming && <span className="animate-pulse inline-block w-2 h-4 bg-yellow-500 mr-1 align-middle"></span>}
                        <span className="whitespace-pre-wrap">{msg.text}</span>
                    </div>

                 </div>
             </div>
         ))}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="z-20 w-full p-4 md:p-6 bg-black/80 backdrop-blur-xl border-t border-yellow-900/30">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 p-2 rounded-xl bg-neutral-900 border border-yellow-900/20 focus-within:border-yellow-600/50 focus-within:bg-neutral-900/50 focus-within:shadow-[0_0_15px_rgba(234,179,8,0.1)] transition-all duration-300">
            
            <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Enter command..."
                rows={1}
                className="flex-1 bg-transparent text-yellow-100 placeholder-yellow-800/50 px-3 py-2 focus:outline-none resize-none max-h-32 scrollbar-none font-mono"
            />
            
            <button
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className={`
                    p-3 rounded-lg flex items-center justify-center transition-all duration-300
                    ${!inputText.trim() || isLoading
                        ? 'text-neutral-600 bg-neutral-800 cursor-not-allowed'
                        : 'text-black bg-yellow-500 hover:bg-yellow-400 shadow-lg shadow-yellow-500/20'
                    }
                `}
            >
                {isLoading ? (
                     <div className="w-5 h-5 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                )}
            </button>
        </div>
        <div className="text-center mt-2">
            <span className="text-[10px] text-yellow-900/60 uppercase tracking-widest">Protector AI Secure Channel</span>
        </div>
      </div>
    </div>
  );
};

export default TextChatScreen;