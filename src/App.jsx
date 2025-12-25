import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ তোমার Google API Key এখানে বসাও (ডাবল কোটেশনের ভিতরে)
const API_KEY = "AIzaSyDqS4t7SrjZf8BRW2eMf3eL2GoELWg6APg"; 

const genAI = new GoogleGenerativeAI(API_KEY);

function App() {
  const webcamRef = useRef(null);
  const [status, setStatus] = useState("Ready to Guide");
  const [aiResponse, setAiResponse] = useState("Path is clear");
  const [isGuiding, setIsGuiding] = useState(false);

  // অটো-গাইড লজিক (এখন প্রতি ২.৫ সেকেন্ড পর পর চেক করবে - Fast Mode)
  useEffect(() => {
    let intervalId;
    if (isGuiding) {
      intervalId = setInterval(() => {
        captureAndAnalyze();
      }, 2500); // 2.5 Seconds Loop
    }
    return () => clearInterval(intervalId);
  }, [isGuiding]);

  const captureAndAnalyze = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setStatus("Scanning...");
        await askGemini(imageSrc);
      }
    }
  };

  const askGemini = async (base64Image) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // 🔥 আপডেটেড কড়া প্রম্পট (Strict Mode)
      const prompt = `
        Analyze this image strictly for a blind person's navigation. 
        Focus ONLY on the immediate path (ground level) in front.
        
        1. If the path ahead is clear and safe to walk, output ONLY: "CLEAR".
        2. If there is ANY obstacle (chair, table, wall, stairs, person, door) blocking the way, output: "STOP: [Name of Obstacle]".
        
        Do not describe background items. Be paranoid about safety. Keep it extremely short (max 3 words).
      `;

      const imagePart = {
        inlineData: {
          data: base64Image.split(",")[1],
          mimeType: "image/jpeg",
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();
      
      // টেক্সট ক্লিন করা
      const cleanText = text.replace(/\*/g, '').trim();

      setAiResponse(cleanText);
      setStatus("Guiding...");
      speak(cleanText);

    } catch (error) {
      console.log("Error analyzing path", error);
      setStatus("Retrying...");
    }
  };

  const speak = (text) => {
    window.speechSynthesis.cancel(); // আগের কথা থামিয়ে নতুন কথা বলবে
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.3; // একটু দ্রুত বলবে
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans">
      <h1 className="text-4xl font-bold mb-2 text-yellow-400">Vision Guide 🦮</h1>
      <p className="text-gray-400 mb-6">Blind Assist Navigation</p>
      
      <div className="relative border-4 border-gray-700 rounded-2xl overflow-hidden shadow-2xl w-full max-w-md bg-gray-900">
        {/* ক্যামেরা */}
        <Webcam 
          ref={webcamRef} 
          screenshotFormat="image/jpeg"
          className="w-full opacity-90"
          videoConstraints={{ facingMode: "environment" }} 
        />
        
        {/* স্ট্যাটাস বার (উপরে) */}
        <div className="absolute top-0 w-full bg-black/60 p-2 text-center">
           <p className="text-yellow-300 font-mono animate-pulse text-sm">{status}</p>
        </div>

        {/* রেজাল্ট বার (নিচে) */}
        <div className="absolute bottom-0 w-full bg-blue-900/95 p-4 text-center min-h-[80px] flex items-center justify-center border-t-2 border-blue-500">
          <p className="text-2xl font-bold text-white uppercase tracking-wider">{aiResponse}</p>
        </div>
      </div>

      {/* স্টার্ট/স্টপ বাটন */}
      <button 
        onClick={() => setIsGuiding(!isGuiding)}
        className={`mt-8 px-10 py-5 rounded-full text-2xl font-bold shadow-lg transition transform active:scale-95 ${
          isGuiding ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {isGuiding ? "🛑 STOP GUIDING" : "🚶 START WALKING"}
      </button>

      <p className="mt-5 text-gray-500 text-xs text-center px-5 max-w-xs">
        Tip: Point camera forward. AI scans for obstacles every 2.5 seconds.
      </p>
    </div>
  );
}

export default App;