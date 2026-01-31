import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonFab,
  IonFabButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonToast,
  IonText,
  IonButtons,
  IonMenuButton,
} from '@ionic/react';
import { micOutline, stopOutline } from 'ionicons/icons';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import apiService from '../services/apiService';
import type { Message } from '../types';
import { stripMarkdown } from '../utils/markdown';

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const VoiceAssistantPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const textCaptured = useRef<boolean>(false);

  useEffect(() => {
    initializeSpeechRecognition();
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (contentRef.current) {
      contentRef.current.scrollToBottom(300);
    }
  }, [messages]);

  const initializeSpeechRecognition = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setToastMessage('Speech recognition is not supported in your browser');
        setShowToast(true);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening until manually stopped
      recognition.interimResults = true; // Get interim results

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingDuration(0);
        transcriptRef.current = ''; // Reset transcript
        // Start duration counter
        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        textCaptured.current = false;
        // Accumulate all final results
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          transcriptRef.current = finalTranscript.trim();
          textCaptured.current = true;
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);

        // Don't reset on 'no-speech' error in continuous mode
        if (event.error === 'no-speech') {
          return; // Keep listening
        }

        setIsRecording(false);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

        if (event.error === 'not-allowed') {
          setToastMessage('Microphone permission is required');
          setShowToast(true);
        } else if (event.error !== 'aborted') {
          setToastMessage('Speech recognition error: ' + event.error);
          setShowToast(true);
        }
      };

      recognition.onend = () => {
        // Only set to false if we're not intentionally recording
        // This prevents auto-restart when speech pauses
        if (!isRecording) {
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (error) {
      console.error('Speech recognition initialization error:', error);
      setToastMessage('Failed to initialize speech recognition');
      setShowToast(true);
    }
  };

  const startRecording = async () => {
    try {
      if (!recognitionRef.current) {
        setToastMessage('Speech recognition not available');
        setShowToast(true);
        return;
      }

      // Set language for speech recognition
      recognitionRef.current.lang = language === 'en' ? 'en-US' : 'bn-BD';
      recognitionRef.current.start();
    } catch (error: any) {
      console.error('Start recording error:', error);
      setToastMessage('Failed to start recording');
      setShowToast(true);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (!textCaptured.current) {
      await new Promise(resolve => setTimeout(resolve, 2500));
    }
    try {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }


      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      // Process the accumulated transcript
      const text = transcriptRef.current.trim();
      if (text) {
        await processText(text);
      } else {
        setToastMessage('No speech detected. Please try again.');
        setShowToast(true);
      }
    } catch (error: any) {
      console.error('Stop recording error:', error);
      setToastMessage('Failed to stop recording');
      setShowToast(true);
    }
  };

  const processText = async (text: string) => {
    setIsProcessing(true);
    try {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        text: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send text to backend
      const response = await apiService.processText(text, language);

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: response.llm_response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Play TTS
      await playTTS(response.llm_response);
    } catch (error: any) {
      console.error('Process text error:', error);
      setToastMessage(error.response?.data?.message || 'Failed to process text');
      setShowToast(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const playTTS = async (text: string) => {
    try {
      // Strip markdown for TTS
      const plainText = stripMarkdown(text);

      await TextToSpeech.speak({
        text: plainText,
        lang: language === 'en' ? 'en-US' : 'bn-BD',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });

    } catch (error) {
      console.error('TTS error:', error);
      // Don't show error to user, just log it
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Voice Assistant</IonTitle>
        </IonToolbar>
        {/* <IonToolbar>
          <IonSegment value={language} onIonChange={(e) => setLanguage(e.detail.value as 'en' | 'bn')}>
            <IonSegmentButton value="en">
              <IonLabel>English</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="bn">
              <IonLabel>Bengali</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar> */}
      </IonHeader>
      <IonContent ref={contentRef} className="ion-padding">
        {!messages || messages.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <IonText color="medium">
              <h3>Welcome to Voice Assistant</h3>
              <p>1. Press the microphone button to start</p>
              <p>2. Speak your question</p>
              <p>3. Press the stop button when done</p>
              <p style={{ fontSize: '0.875rem', marginTop: '1rem', color: 'var(--ion-color-primary)' }}>
                Napa table quantity 10 Total cost 20 taka
              </p>
            </IonText>
          </div>
        ) : (
          <div style={{ paddingBottom: '80px' }}>
            {messages.map((message) => (
              <IonCard
                key={message.id}
                style={{
                  marginLeft: message.type === 'user' ? 'auto' : '0',
                  marginRight: message.type === 'user' ? '0' : 'auto',
                  maxWidth: '85%',
                  backgroundColor:
                    message.type === 'user'
                      ? 'var(--ion-color-primary)'
                      : 'var(--ion-color-light)',
                }}
              >
                <IonCardContent>
                  <div
                    style={{
                      color: message.type === 'user' ? 'white' : 'var(--ion-color-dark)',
                    }}
                  >
                    {message.type === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.text}
                      </ReactMarkdown>
                    ) : (
                      <p>{message.text}</p>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      marginTop: '0.5rem',
                      color: message.type === 'user' ? 'rgba(255,255,255,0.8)' : 'var(--ion-color-medium)',
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}

        {isProcessing && (
          <div style={{ textAlign: 'center', margin: '1rem' }}>
            <IonText color="medium">
              <p>Getting AI response...</p>
            </IonText>
          </div>
        )}

        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton
            onClick={handleToggleRecording}
            color={isRecording ? 'danger' : 'primary'}
            disabled={isProcessing}
          >
            <IonIcon icon={isRecording ? stopOutline : micOutline} />
          </IonFabButton>
        </IonFab>

        {isRecording && (
          <div
            style={{
              position: 'fixed',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              zIndex: 1000,
              maxWidth: '90%',
            }}
          >
            <IonCard>
              <IonCardContent>
                <IonText color="danger">
                  <h3>🎤 Listening...</h3>
                  <p style={{ margin: '0.5rem 0' }}>Speak your question</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                    Click stop when you're done
                  </p>
                  <p style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    {formatDuration(recordingDuration)}
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default VoiceAssistantPage;
