import React, { useState } from 'react';
import { Screen } from './types';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import TextChatScreen from './screens/TextChatScreen';
import VideoChatScreen from './screens/VideoChatScreen';
import LockScreen from './screens/LockScreen';
import { soundEffects } from './utils/soundEffects';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOCK);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const toggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    soundEffects.setEnabled(newState);
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden selection:bg-yellow-500/30 selection:text-yellow-200 font-sans">
      {currentScreen === Screen.LOCK && (
        <LockScreen 
          onAuthenticated={() => {
            soundEffects.playStartSound();
            setCurrentScreen(Screen.HOME);
          }} 
        />
      )}
      {currentScreen === Screen.HOME && (
        <HomeScreen 
          onStartVoice={() => setCurrentScreen(Screen.CHAT)} 
          onStartText={() => setCurrentScreen(Screen.TEXT_CHAT)}
          onStartVideo={() => setCurrentScreen(Screen.VIDEO_CHAT)}
          isSoundEnabled={isSoundEnabled}
          toggleSound={toggleSound}
        />
      )}
      {currentScreen === Screen.CHAT && (
        <ChatScreen 
          onBack={() => setCurrentScreen(Screen.HOME)}
          isSoundEnabled={isSoundEnabled}
          toggleSound={toggleSound}
        />
      )}
      {currentScreen === Screen.TEXT_CHAT && (
        <TextChatScreen 
          onBack={() => setCurrentScreen(Screen.HOME)}
        />
      )}
      {currentScreen === Screen.VIDEO_CHAT && (
        <VideoChatScreen
          onBack={() => setCurrentScreen(Screen.HOME)}
          isSoundEnabled={isSoundEnabled}
          toggleSound={toggleSound}
        />
      )}
    </div>
  );
};

export default App;