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
import { set } from 'date-fns';

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const VoiceAssistantPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  //const [recordingDuration, setRecordingDuration] = useState(0);
  const [language] = useState<'en' | 'bn'>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const [interimText, setIntrimText] = useState('');
  const [continuedText, setContinuedText] = useState('');

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
        //setRecordingDuration(0);
        if (!isContinued) {
          transcriptRef.current = ''; // Reset transcript
        }
        // Start duration counter
        // recordingIntervalRef.current = setInterval(() => {
        //   setRecordingDuration((prev) => prev + 1);
        // }, 1000);
      };

      recognition.onresult = (event: any) => {

        let interim = '';
        // Accumulate all final results
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += text + ' ';
          } else {
            interim += text + ' ';
          }
        }
        if (finalTranscript) {
          transcriptRef.current = finalTranscript.trim();
        }
        let text = '';
        if (transcriptRef.current) {
          text += transcriptRef.current;
        }
        if (interim) {
          text += interim;
        }
        setIntrimText(text.trim());
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
    setIntrimText('');
    try {
      text = continuedText ? continuedText + ' ' + text : text;
      setContinuedText('');
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        text: text,
        timestamp: new Date(),
        continued: false,
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

      // Extract error message from response
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to process text';

      setToastMessage(errorMessage);
      setShowToast(true);
      setMessages((prev) => [...prev.slice(0, -1), {
        ...prev[prev.length - 1],
        continued: true,
      }]);
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

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  const handleToggleRecordingContinued = () => {
    startRecording();
    const lastMessage = messages[messages.length - 1];
    setContinuedText(lastMessage ? lastMessage.text : '');
    console.log('Continuing with transcript:', transcriptRef.current);
    // Remove continued flag from last message
    setMessages((prev) => prev.map(msg =>
      msg.continued ? { ...msg, continued: false } : msg
    ));
  }

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
              <p>2. Speak product name and quantity</p>
              <p>3. Speak total price/cost</p>
              <p>4. Press the stop button when done</p>
              <p style={{ fontSize: '0.875rem', marginTop: '1rem', color: 'var(--ion-color-primary)' }}>
                Napa tablet quantity 10 Minaril tablet quantity 5 Total price 120 taka
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
                      <p>{message.text}
                        {message.continued ? (<IonFab slot="fixed">
                          <IonFabButton
                            onClick={handleToggleRecordingContinued}
                            color='danger'
                          >
                            <IonIcon icon={micOutline} />
                          </IonFabButton>
                        </IonFab>) : ''}
                      </p>
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

        {interimText && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 999,
              maxWidth: '85%',
              width: '100%',
            }}
          >
            <IonCard
              style={{
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                border: '2px solid var(--ion-color-primary)',
              }}
            >
              <IonCardContent>
                <IonText color="primary">
                  <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    🎙️ Recognizing...
                  </h2>
                </IonText>
                <div
                  style={{
                    backgroundColor: 'var(--ion-color-light)',
                    padding: '1rem',
                    borderRadius: '8px',
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IonText>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontStyle: 'italic',
                        color: 'var(--ion-color-dark)',
                        lineHeight: '1.5',
                      }}
                    >
                      "{continuedText ? continuedText + ' ' + interimText : interimText}"
                    </p>
                  </IonText>
                </div>
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
