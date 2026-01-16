import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Mic, MicOff, Loader2, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SpeechToText = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('bn');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userText, setUserText] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [error, setError] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000';

  // Language configuration
  const languages = {
    'en': { name: 'English', flag: '🇺🇸', code: 'en-US' },
    'bn': { name: 'বাংলা (Bengali)', flag: '🇧🇩', code: 'bn-BD' }
  };

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
    }

    // Cleanup on unmount
    return () => {
      stopSpeech();
    };
  }, []);

  const startRecording = async () => {
    try {
      setError('');
      setInterimText('');

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = languages[selectedLanguage].code;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          setInterimText(interim);
        }
        if (final) {
          setInterimText('');
          // Stop recording before processing text
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          processText(final);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
        setInterimText('');
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('Error starting speech recognition: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const speakBengali = (text) => {
    try {
      setIsSpeaking(true);
      // Encode text for URL
      const encodedText = encodeURIComponent(text);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=bn&client=tw-ob&q=${encodedText}`;

      // Create audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadstart = () => {
        console.log('Loading Bengali audio...');
      };

      audio.onplay = () => {
        console.log('Speaking Bengali...');
      };

      audio.onended = () => {
        console.log('Finished speaking Bengali');
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.onerror = (err) => {
        console.error('Error playing Bengali audio:', err);
        setError('Could not play Bengali audio. Check internet connection.');
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.play().catch((err) => {
        console.error('Audio play error:', err);
        setError('Could not play audio');
        setIsSpeaking(false);
        audioRef.current = null;
      });
    } catch (err) {
      console.error('Error in speakBengali:', err);
      setError('Error playing Bengali audio: ' + err.message);
      setIsSpeaking(false);
    }
  };

  const speakEnglish = (text) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) {
        setError('Speech synthesis not supported in this browser');
        return;
      }

      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        console.log('Speaking English...');
      };

      utterance.onend = () => {
        console.log('Finished speaking English');
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setError(`Error speaking: ${event.error}`);
        setIsSpeaking(false);
      };

      synth.speak(utterance);
    } catch (err) {
      console.error('Error in speakEnglish:', err);
      setError('Error speaking English: ' + err.message);
      setIsSpeaking(false);
    }
  };

  const speakResponse = (text, language) => {
    // Stop any ongoing speech
    stopSpeech();

    if (language === 'bn') {
      speakBengali(text);
    } else {
      speakEnglish(text);
    }
  };

  const stopSpeech = () => {
    // Stop audio element if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Stop speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
  };

  const processText = async (text) => {
    try {
      setIsProcessing(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated. Please log in.');
        setIsProcessing(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/process-text`,
        { 'user-text': text },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const { user_text, llm_response } = response.data;

      setUserText(user_text);
      setLlmResponse(llm_response);

      // Add to conversation history
      setConversationHistory(prev => [...prev, {
        id: Date.now(),
        userText: user_text,
        llmResponse: llm_response,
        timestamp: new Date().toLocaleTimeString()
      }]);

      // Auto-play the response
      speakResponse(llm_response, selectedLanguage);

    } catch (err) {
      setError('Error processing text: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const clearConversation = () => {
    stopSpeech();
    setConversationHistory([]);
    setUserText('');
    setLlmResponse('');
    setError('');
    setInterimText('');
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
        <div className="flex flex-col items-center space-y-4">
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
                <span>Processing your text...</span>
              </div>
            )}
          </div>

          {/* Show interim transcription */}
          {interimText && (
            <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 text-gray-600 italic">
              <span className="text-sm">Listening: {interimText}</span>
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
                      <div className="mt-1"><ReactMarkdown>{llmResponse}</ReactMarkdown></div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!isSpeaking ? (
                        <Button
                          onClick={() => speakResponse(llmResponse, selectedLanguage)}
                          variant="outline"
                          size="sm"
                        >
                          <Volume2 className="w-4 h-4 mr-1" />
                          Play
                        </Button>
                      ) : (
                        <Button
                          onClick={stopSpeech}
                          variant="outline"
                          size="sm"
                        >
                          <VolumeX className="w-4 h-4 mr-1" />
                          Stop
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
