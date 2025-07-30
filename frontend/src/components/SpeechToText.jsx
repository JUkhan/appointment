import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SpeechToText = () => {
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
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mic className="w-5 h-5" />
          <span>Voice Assistant</span>
        </CardTitle>
        <CardDescription>
          Click the button to start recording, speak your message, then click stop to get a response!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selector */}
        <div className="flex items-center space-x-4">
          <label htmlFor="language-select" className="text-sm font-medium">
            🌐 Language:
          </label>
          <select 
            id="language-select"
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {Object.keys(languages).map(lang => (
              <option key={lang} value={lang}>
                {languages[lang].flag} {languages[lang].name}
              </option>
            ))}
          </select>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center">
          {!isRecording && !isProcessing && (
            <Button 
              onClick={startRecording}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          )}
          
          {isRecording && (
            <Button 
              onClick={stopRecording}
              size="lg"
              variant="destructive"
            >
              <MicOff className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          )}

          {isProcessing && (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing your audio...</span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            ❌ {error}
          </div>
        )}

        {/* Current Response */}
        {(userText || llmResponse) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Latest Interaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userText && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <strong className="text-blue-800">You said:</strong>
                  <p className="mt-1">{userText}</p>
                </div>
              )}
              {llmResponse && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <strong className="text-green-800">AI Response:</strong>
                      <p className="mt-1"><ReactMarkdown>{llmResponse}</ReactMarkdown></p>
                    </div>
                    {audioUrl && (
                      <Button
                        onClick={playResponse}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                      >
                        <Volume2 className="w-4 h-4 mr-1" />
                        Play
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Audio Player (hidden) */}
        <audio ref={audioRef} style={{ display: 'none' }} />

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Conversation History</CardTitle>
                <Button onClick={clearConversation} variant="outline" size="sm">
                  🗑️ Clear History
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {conversationHistory.map((item) => (
                  <div key={item.id} className="border-l-4 border-blue-200 pl-4">
                    <div className="text-xs text-gray-500 mb-2">⏰ {item.timestamp}</div>
                    <div className="mb-2">
                      <strong>You:</strong> {item.userText}
                    </div>
                    <div>
                      <strong>AI:</strong> <ReactMarkdown>{item.llmResponse}</ReactMarkdown> 
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default SpeechToText;
