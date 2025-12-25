import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';

// 🗣️ Voice to Text & Text to Voice Helpers
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US'; // Change to 'bn-BD' for Bangla

function App() {
  const [mode, setMode] = useState("HOME"); // HOME, BLIND, MUTE
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  
  const webcamRef = useRef(null);

  // 🎤 Speech to Text Logic (Blind User speaks)
  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);
    };
  }, []);

  // 🔊 Text to Speech Logic (App speaks for Mute User)
  const speakText = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // --- UI COMPONENTS ---

  // 1. Home Screen (Select User Type)
  if (mode === "HOME") {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <h1 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Universal Bridge 🌉
        </h1>
        <p className="text-gray-400 mb-10">Connecting Voice, Text & Sign</p>

        <div className="grid gap-6 w-full max-w-md">
          <button 
            onClick={() => setMode("BLIND")}
            className="p-8 bg-blue-600 rounded-2xl shadow-lg hover:bg-blue-500 transition text-2xl font-bold flex items-center justify-center gap-3"
          >
            👁️‍🗨️ I am Blind <span className="text-sm font-normal block">(Voice Mode)</span>
          </button>

          <button 
            onClick={() => setMode("MUTE")}
            className="p-8 bg-purple-600 rounded-2xl shadow-lg hover:bg-purple-500 transition text-2xl font-bold flex items-center justify-center gap-3"
          >
            👋 I am Mute <span className="text-sm font-normal block">(Sign Mode)</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Blind Mode (Voice Input -> Shows Text)
  if (mode === "BLIND") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col p-4">
        <button onClick={() => setMode("HOME")} className="text-left text-gray-400 mb-4">⬅ Back</button>
        
        <h2 className="text-3xl font-bold text-blue-400 mb-6">Listening Mode 👂</h2>
        
        {/* Output Display (Big Text for Mute person to see) */}
        <div className="flex-grow border-2 border-gray-700 rounded-xl p-6 flex items-center justify-center bg-gray-900">
          <p className="text-4xl text-center font-mono text-yellow-300">
            {transcript || "Tap Mic & Speak..."}
          </p>
        </div>

        {/* Mic Control */}
        <div className="mt-8 flex justify-center">
          <button 
            onClick={toggleListening}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-2xl transition ${
              isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-600'
            }`}
          >
            {isListening ? '🛑' : '🎤'}
          </button>
        </div>
        <p className="text-center mt-4 text-gray-500">{isListening ? "Listening..." : "Tap to Speak"}</p>
      </div>
    );
  }

  // 3. Mute Mode (Camera/Text Input -> Speaks Audio)
  if (mode === "MUTE") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col p-4">
        <button onClick={() => setMode("HOME")} className="text-left text-gray-400 mb-4">⬅ Back</button>
        
        <h2 className="text-3xl font-bold text-purple-400 mb-4">Sign/Text Mode 👋</h2>

        {/* Camera Feed (Future: Sign Language Detection) */}
        <div className="relative w-full h-64 bg-gray-800 rounded-xl overflow-hidden mb-4 border border-purple-500">
          <Webcam
            ref={webcamRef}
            className="w-full h-full object-cover opacity-80"
            mirror={true}
          />
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 rounded text-xs">
            🤖 AI Gesture: Waiting...
          </div>
        </div>

        {/* Quick Text Input (Alternative Bridge) */}
        <div className="flex flex-col gap-3">
          <textarea 
            className="w-full p-4 bg-gray-800 rounded-lg text-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows="3"
            placeholder="Type or use gestures..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <button 
            onClick={() => speakText(inputText)}
            className="w-full py-4 bg-green-600 rounded-xl text-xl font-bold hover:bg-green-500 transition shadow-lg"
          >
            🔊 Speak to Blind User
          </button>
        </div>

        {/* Quick Responses */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={() => speakText("Yes")} className="bg-gray-700 p-3 rounded">✅ Yes</button>
          <button onClick={() => speakText("No")} className="bg-gray-700 p-3 rounded">❌ No</button>
          <button onClick={() => speakText("Hello")} className="bg-gray-700 p-3 rounded">👋 Hello</button>
          <button onClick={() => speakText("Thank You")} className="bg-gray-700 p-3 rounded">🙏 Thanks</button>
        </div>
      </div>
    );
  }
}

export default App;