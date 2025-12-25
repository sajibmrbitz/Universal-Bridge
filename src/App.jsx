import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// ⚠️ তোমার API KEY ঠিক আছে তো? ডাবল চেক করো।
const API_KEY = "EIKHANE_TOMAR_API_KEY_BOSHAO"; 

const genAI = new GoogleGenerativeAI(API_KEY);

function App() {
  const webcamRef = useRef(null);
  const [handLandmarker, setHandLandmarker] = useState(null);
  const [gesture, setGesture] = useState("Waiting for hands...");
  const [aiResponse, setAiResponse] = useState("...");
  const [mode, setMode] = useState("home"); 
  const [modelLoading, setModelLoading] = useState(true);

  // ১. মিডিয়াপাইপ লোড করা (ফিক্সড ভার্সন)
  useEffect(() => {
    const loadLandmarker = async () => {
      try {
        console.log("Loading AI Model...");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "CPU" // GPU চেঞ্জ করে CPU দিলাম (সেফ অপশন)
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setHandLandmarker(landmarker);
        setModelLoading(false);
        console.log("AI Model Loaded Successfully!");
      } catch (error) {
        console.error("Model Loading Failed:", error);
        alert("Error loading AI Model. Check Console for details.");
      }
    };
    loadLandmarker();
  }, []);

  // ২. লুপ ফাংশন
  const startDetection = () => {
    setMode('start');
    detectHands();
  };

  const detectHands = () => {
    if (webcamRef.current && webcamRef.current.video && handLandmarker) {
      const video = webcamRef.current.video;
      // ভিডিও রেডি আছে কি না চেক করা
      if (video.readyState >= 2) {
        const results = handLandmarker.detectForVideo(video, performance.now());
        
        if (results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          identifyGesture(landmarks);
        } else {
          setGesture("No Hand Detected");
        }
      }
    }
    requestAnimationFrame(detectHands);
  };

  // ৩. জেশ্চার লজিক
  const identifyGesture = (lm) => {
    const thumbTip = lm[4].y;   const thumbBase = lm[2].y;
    const indexTip = lm[8].y;   const indexBase = lm[5].y;
    const middleTip = lm[12].y; const middleBase = lm[9].y;
    const ringTip = lm[16].y;   const ringBase = lm[13].y;
    const pinkyTip = lm[20].y;  const pinkyBase = lm[17].y;

    const isThumbUp = thumbTip < thumbBase - 0.05;
    const isIndexOpen = indexTip < indexBase;
    const isMiddleOpen = middleTip < middleBase;
    const isRingOpen = ringTip < ringBase;
    const isPinkyOpen = pinkyTip < pinkyBase;

    let detected = "Unknown";

    // 👋 Hello (Open Hand)
    if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) {
      detected = "Hello / Hi 👋";
    }
    // 👍 Yes (Thumb Up)
    else if (isThumbUp && !isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
      detected = "Yes / Agree 👍";
    }
    // ✊ No (Fist)
    else if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
      detected = "No / Stop ✊";
    }
    // 👆 Question (Index Finger)
    else if (isIndexOpen && !isMiddleOpen && !isRingOpen) {
      detected = "I have a Question 👆";
    }
    // 🤟 Love (Index + Pinky)
    else if (isIndexOpen && !isMiddleOpen && isPinkyOpen) {
      detected = "Thank You 🤟";
    }

    if (detected !== gesture) {
      setGesture(detected);
      if (detected !== "Unknown" && detected !== "No Hand Detected") {
        askGemini(detected);
      }
    }
  };

  const askGemini = async (sign) => {
    try {
      if (!genAI) return;
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `A mute person just signed: "${sign}". Generate a polite, short 1-sentence spoken response.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setAiResponse(text);
      speak(text);
    } catch (error) {
      console.log("AI Busy or API Error");
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-5 font-sans">
      <h1 className="text-3xl font-bold mb-5 text-blue-400">Universal Bridge 🌉</h1>
      
      {mode === 'home' ? (
        <div className="text-center">
          {modelLoading ? (
            <p className="text-yellow-400 text-xl animate-pulse">⏳ Loading AI Model... Please wait...</p>
          ) : (
            <button 
              onClick={startDetection} 
              className="bg-green-600 px-8 py-4 rounded-xl text-xl font-bold hover:bg-green-700 shadow-lg transform hover:scale-105 transition">
               ✅ Start Sign Detection
            </button>
          )}
          <p className="mt-4 text-gray-400 text-sm">Make sure you are in a bright room.</p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="relative border-4 border-gray-700 rounded-2xl overflow-hidden shadow-2xl bg-black">
            <Webcam 
              ref={webcamRef} 
              className="w-full" 
              mirrored={true} 
              videoConstraints={{ width: 640, height: 480 }}
            />
            <div className="absolute bottom-0 bg-black/80 w-full p-3 text-center">
              <p className="text-yellow-300 font-mono text-xl font-bold tracking-wider">{gesture}</p>
            </div>
          </div>

          <div className="mt-5 bg-gray-800 p-5 rounded-xl border border-gray-600 shadow-lg">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">AI Assistant</p>
            <p className="text-xl text-green-400 font-bold">"{aiResponse}"</p>
          </div>
          
          <button onClick={() => window.location.reload()} className="mt-5 text-red-400 underline">Stop / Reset</button>
        </div>
      )}
    </div>
  );
}

export default App;