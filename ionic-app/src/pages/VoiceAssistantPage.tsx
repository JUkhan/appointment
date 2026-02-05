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
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
} from '@ionic/react';
import { micOutline, stopOutline } from 'ionicons/icons';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import apiService from '../services/apiService';
import type { Message } from '../types';
import { stripMarkdown } from '../utils/markdown';
import { parseProducts, type Product } from '../utils/parseProduct';

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
  //const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const [interimText, setIntrimText] = useState('');
  const [continuedText, setContinuedText] = useState('');
  const [totalPrice, setTotalPrice] = useState('Total');
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');

  useEffect(() => {
    initializeSpeechRecognition();
    return () => {
      // if (recordingIntervalRef.current) {
      //   clearInterval(recordingIntervalRef.current);
      // }
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
        // if (!isContinued) {
        //   transcriptRef.current = ''; // Reset transcript
        // }
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
        // if (recordingIntervalRef.current) {
        //   clearInterval(recordingIntervalRef.current);
        //   recordingIntervalRef.current = null;
        // }

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
        // if (!isRecording) {
        //   if (recordingIntervalRef.current) {
        //     clearInterval(recordingIntervalRef.current);
        //     recordingIntervalRef.current = null;
        //   }
        // }
        setIsRecording(false);
        console.log('------Speech recognition ended');
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


      // if (recordingIntervalRef.current) {
      //   clearInterval(recordingIntervalRef.current);
      //   recordingIntervalRef.current = null;
      // }

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
    setTotalPrice('Total');
    setProducts([]);
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
      const response = await apiService.processText(text, mobileNumber);
      setMobileNumber('');
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

  const onCalculateTotal = () => {
    const text = continuedText ? continuedText + ' ' + interimText : interimText;
    const parsedProducts = parseProducts(text);
    let total = 0;
    parsedProducts.forEach(product => {
      total += product.unitPrice * product.quantity;
    });
    setTotalPrice(`Total: ${total.toFixed(2)} taka`);
  }
  const onProductEdit = () => {
    const text = continuedText ? continuedText + ' ' + interimText : interimText;
    const parsedProducts = parseProducts(text).filter(it => it.quantity > 0);
    setProducts(parsedProducts);
    console.log('Parsed Products:', parsedProducts, text);
  };
  const onStartStop = () => {
    if (isRecording) {
      setIsRecording(false);
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } catch (error: any) {
        console.error('Stop recording error:', error);
        setToastMessage('Failed to stop recording');
        setShowToast(true);
      }
    } else {
      if (!continuedText)
        setContinuedText(transcriptRef.current.trim());
      startRecording();
    }
  };

  const handleProductClick = (index: number) => {
    setEditingProductIndex(index);
  };

  const handleProductFieldChange = (index: number, field: keyof Product, value: string | number) => {
    const updatedProducts = [...products];
    if (field === 'quantity' || field === 'unitPrice') {
      updatedProducts[index] = { ...updatedProducts[index], [field]: Number(value) };
    } else {
      updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    }
    setProducts(updatedProducts);
  };

  const handleProductEditDone = () => {
    setEditingProductIndex(null);
    // Recalculate total when editing is done
    let total = 0;
    const text: string[] = [];
    products.forEach(product => {
      total += product.unitPrice * product.quantity;
      const typeText = product.type ? ` type ${product.type}` : '';
      text.push(`${product.productName}${typeText} quantity ${product.quantity} unit price ${product.unitPrice}`);
    });
    setTotalPrice(`Total: ${total.toFixed(2)} taka`);
    transcriptRef.current = text.join(' ');
    setIntrimText(transcriptRef.current);
    setContinuedText('');
  };
  const handleProductDelete = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    // Recalculate total when a product is deleted
    let total = 0;
    const text: string[] = [];
    updatedProducts.forEach(product => {
      total += product.unitPrice * product.quantity;
      const typeText = product.type ? ` type ${product.type}` : '';
      text.push(`${product.productName}${typeText} quantity ${product.quantity} unit price ${product.unitPrice}`);
    });
    setTotalPrice(`Total: ${total.toFixed(2)} taka`);
    transcriptRef.current = text.join(' ');
    setIntrimText(transcriptRef.current);
    setContinuedText('');
  };
  const onSave = () => {
    stopRecording();
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

        {(continuedText || interimText) && (
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
                  <div>
                    🎙️ Recognizing...
                    <IonItem>
                      <IonInput
                        type="text"
                        label="Mobile Number"
                        labelPlacement="floating"
                        placeholder="Enter Mobile Number"
                        value={mobileNumber}
                        onIonInput={(e) => setMobileNumber(e.detail.value || '')}
                      />
                    </IonItem>
                  </div>
                </IonText>
                {/**make product list editable */}
                {products.length > 0 && (
                  <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                    <IonText>
                      <h3 style={{ marginBottom: '0.5rem' }}>Products (click to edit):
                        <IonButton
                          onClick={() => setProducts([])}
                          fill="solid"
                          size="small"
                          color="danger"
                          style={{ marginTop: '0.5rem' }}
                        >
                          Hide
                        </IonButton>
                      </h3>
                    </IonText>
                    {products.map((product, index) => (
                      <div key={index} style={{ marginBottom: '0.5rem' }}>
                        {editingProductIndex === index ? (
                          <IonCard style={{ margin: '0.5rem 0', backgroundColor: 'var(--ion-color-light-shade)' }}>
                            <IonCardContent>
                              <IonItem>
                                <IonLabel position="stacked">Product Name</IonLabel>
                                <IonInput
                                  value={product.productName}
                                  onIonInput={(e) => handleProductFieldChange(index, 'productName', e.detail.value!)}
                                />
                              </IonItem>
                              <IonItem>
                                <IonLabel position="stacked">Type</IonLabel>
                                <IonInput
                                  value={product.type || ''}
                                  onIonInput={(e) => handleProductFieldChange(index, 'type', e.detail.value!)}
                                />
                              </IonItem>
                              <IonItem>
                                <IonLabel position="stacked">Quantity</IonLabel>
                                <IonInput
                                  type="number"
                                  value={product.quantity}
                                  onIonInput={(e) => handleProductFieldChange(index, 'quantity', e.detail.value!)}
                                />
                              </IonItem>
                              <IonItem>
                                <IonLabel position="stacked">Unit Price</IonLabel>
                                <IonInput
                                  type="number"
                                  value={product.unitPrice}
                                  onIonInput={(e) => handleProductFieldChange(index, 'unitPrice', e.detail.value!)}
                                />
                              </IonItem>
                              <IonButton
                                onClick={handleProductEditDone}
                                fill="solid"
                                size="small"
                                style={{ marginTop: '0.5rem' }}
                              >
                                Done
                              </IonButton>
                              <IonButton
                                onClick={() => handleProductDelete(index)}
                                fill="solid"
                                size="small"
                                color="danger"
                                style={{ marginTop: '0.5rem' }}
                              >
                                Delete
                              </IonButton>
                            </IonCardContent>
                          </IonCard>
                        ) : (
                          <IonCard
                            style={{ margin: '0.5rem 0', cursor: 'pointer' }}
                            onClick={() => handleProductClick(index)}
                          >
                            <IonCardContent>
                              <IonText>
                                <p style={{ margin: 0 }}>
                                  <strong>{product.productName}</strong>
                                  {product.type && ` (${product.type})`}
                                  <br />
                                  Quantity: {product.quantity} | Unit Price: {product.unitPrice} |
                                  Subtotal: {(product.quantity * product.unitPrice).toFixed(2)}
                                </p>
                              </IonText>
                            </IonCardContent>
                          </IonCard>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
              <IonButton onClick={onStartStop} fill="clear">{isRecording ? 'Stop' : 'Start'}</IonButton>
              <IonButton onClick={onCalculateTotal} fill="clear">{totalPrice}</IonButton>
              <IonButton onClick={onProductEdit} fill="clear">Edit</IonButton>
              <IonButton onClick={onSave} fill="clear">Save</IonButton>
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
