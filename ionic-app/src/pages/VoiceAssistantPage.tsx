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
} from '@ionic/react';
import { micOutline, stopOutline } from 'ionicons/icons';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import apiService from '../services/apiService';
import type { Message } from '../types';
import { stripMarkdown } from '../utils/markdown';

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

  useEffect(() => {
    checkPermissions();
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (contentRef.current) {
      contentRef.current.scrollToBottom(300);
    }
  }, [messages]);

  const checkPermissions = async () => {
    try {
      const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
      if (!hasPermission.value) {
        const permissionResult = await VoiceRecorder.requestAudioRecordingPermission();
        if (!permissionResult.value) {
          setToastMessage('Microphone permission is required for voice recording');
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error('Permission check error:', error);
    }
  };

  const startRecording = async () => {
    try {
      await VoiceRecorder.startRecording();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      console.error('Start recording error:', error);
      setToastMessage('Failed to start recording');
      setShowToast(true);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await VoiceRecorder.stopRecording();

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      setIsRecording(false);
      setRecordingDuration(0);

      if (result.value?.recordDataBase64) {
        await processAudio(result.value.recordDataBase64);
      }
    } catch (error: any) {
      console.error('Stop recording error:', error);
      setToastMessage('Failed to stop recording');
      setShowToast(true);
    }
  };

  const processAudio = async (base64Audio: string) => {
    setIsProcessing(true);
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: 'audio/webm' });

      // Send to backend
      const response = await apiService.processAudio(audioBlob, language);

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        text: response.user_text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

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
      console.error('Process audio error:', error);
      setToastMessage(error.response?.data?.message || 'Failed to process audio');
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
          <IonTitle>Voice Assistant</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={language} onIonChange={(e) => setLanguage(e.detail.value as 'en' | 'bn')}>
            <IonSegmentButton value="en">
              <IonLabel>English</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="bn">
              <IonLabel>Bengali</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent ref={contentRef} className="ion-padding">
        {!messages || messages.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <IonText color="medium">
              <h3>Welcome to Voice Assistant</h3>
              <p>Press the microphone button to start recording</p>
              <p>Ask about doctors, appointments, or medical queries</p>
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
              <p>Processing audio...</p>
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
            }}
          >
            <IonCard>
              <IonCardContent>
                <IonText color="danger">
                  <h3>Recording...</h3>
                  <p>{formatDuration(recordingDuration)}</p>
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
