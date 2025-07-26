import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userText, setUserText] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000';

  // Language configuration
  const languages = {
    'en': { name: 'English', flag: '🇺🇸' },
    'bn': { name: 'বাংলা (Bengali)', flag: '🇧🇩' }
  };

  useEffect(() => {
    // Clean up audio URL when component unmounts
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      // Try different audio formats for better compatibility
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'audio/webm;codecs=opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'audio/ogg;codecs=opus' };
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'audio/wav' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
              options = {}; // Use default
            }
          }
        }
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];
      
      console.log('Using MediaRecorder with:', options.mimeType || 'default format');

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudio(audioBlob);
        
        // Stop all tracks to free up the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Error accessing microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('language', selectedLanguage);

      const response = await axios.post(`${API_BASE_URL}/process-audio`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const { user_text, llm_response, audio_id } = response.data;
      
      setUserText(user_text);
      setLlmResponse(llm_response);
      
      // Add to conversation history
      setConversationHistory(prev => [...prev, {
        id: Date.now(),
        userText: user_text,
        llmResponse: llm_response,
        timestamp: new Date().toLocaleTimeString()
      }]);

      // Get audio response
      const audioResponse = await axios.get(`${API_BASE_URL}/get-audio/${audio_id}`, {
        responseType: 'blob'
      });

      const audioUrl = URL.createObjectURL(audioResponse.data);
      setAudioUrl(audioUrl);

      // Auto-play the response
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }

      // Clean up the temporary file on the server
      setTimeout(() => {
        axios.delete(`${API_BASE_URL}/cleanup/${audio_id}`).catch(console.error);
      }, 30000); // Clean up after 30 seconds

    } catch (err) {
      setError('Error processing audio: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const playResponse = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
    }
  };

  const clearConversation = () => {
    setConversationHistory([]);
    setUserText('');
    setLlmResponse('');
    setError('');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl('');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎙️ Speech-to-Text AI Assistant</h1>
        <p>Click the button to start recording, speak your message, then click stop to get a response!</p>
      </header>

      <main className="App-main">
        {/* Language Selector */}
        <div className="language-selector">
          <label htmlFor="language-select">🌐 Language:</label>
          <select 
            id="language-select"
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="language-dropdown"
          >
            {Object.keys(languages).map(lang => (
              <option key={lang} value={lang}>
                {languages[lang].flag} {languages[lang].name}
              </option>
            ))}
          </select>
        </div>
        {/* Recording Controls */}
        <div className="recording-controls">
          {!isRecording && !isProcessing && (
            <button 
              className="record-button start" 
              onClick={startRecording}
              title="Start Recording"
            >
              🎤 Start Recording
            </button>
          )}
          
          {isRecording && (
            <button 
              className="record-button stop" 
              onClick={stopRecording}
              title="Stop Recording"
            >
              ⏹️ Stop Recording
            </button>
          )}

          {isProcessing && (
            <div className="processing">
              <div className="spinner"></div>
              <p>Processing your audio...</p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {/* Current Response */}
        {(userText || llmResponse) && (
          <div className="current-response">
            <h3>Latest Interaction</h3>
            {userText && (
              <div className="user-text">
                <strong>You said:</strong> {userText}
              </div>
            )}
            {llmResponse && (
              <div className="llm-response">
                <strong>AI Response:</strong> {llmResponse}
                {audioUrl && (
                  <button className="play-button" onClick={playResponse}>
                    🔊 Play Response
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Audio Player (hidden) */}
        <audio ref={audioRef} style={{ display: 'none' }} />

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="conversation-history">
            <div className="history-header">
              <h3>Conversation History</h3>
              <button className="clear-button" onClick={clearConversation}>
                🗑️ Clear History
              </button>
            </div>
            <div className="history-list">
              {conversationHistory.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="timestamp">⏰ {item.timestamp}</div>
                  <div className="history-user">
                    <strong>You:</strong> {item.userText}
                  </div>
                  <div className="history-ai">
                    <strong>AI:</strong> {item.llmResponse}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
