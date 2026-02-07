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
  IonModal,
} from '@ionic/react';
import { micOutline, stopOutline } from 'ionicons/icons';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import apiService from '../services/apiService';
import type { Message } from '../types';
import { parseProducts, type Product } from '../utils/parseProduct';

const VoiceAssistantPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  //const [recordingDuration, setRecordingDuration] = useState(0);
  const [language] = useState<'en' | 'bn'>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const continuedTextRef = useRef<string>('');
  const [interimText, setIntrimText] = useState('');
  const [continuedText, setContinuedText] = useState('');
  const [totalPrice, setTotalPrice] = useState('Total');
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    requestSpeechPermissions();
    setupSpeechListeners();

    return () => {
      SpeechRecognition.removeAllListeners();
      if (isRecording) {
        SpeechRecognition.stop();
      }
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (contentRef.current) {
      contentRef.current.scrollToBottom(300);
    }
  }, [messages]);

  const requestSpeechPermissions = async () => {
    try {
      const { speechRecognition } = await SpeechRecognition.requestPermissions();
      if (speechRecognition !== 'granted') {
        setToastMessage('Microphone permission is required');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Permission error:', error);
      setToastMessage('Failed to request microphone permission');
      setShowToast(true);
    }
  };

  const setupSpeechListeners = () => {
    // Listen for partial results (interim)
    SpeechRecognition.addListener('partialResults', (data: any) => {
      if (data.matches && data.matches.length > 0) {
        const text = data.matches[0];
        // Partial results contain the full text for the current session
        setIntrimText(text);
      }
    });

    // Listen for listening state changes
    SpeechRecognition.addListener('listeningState', (data: any) => {
      if (data.status === 'stopped') {
        setIsRecording(false);
      }
    });
  };

  const startRecording = async () => {
    try {
      // Check if available
      const { available } = await SpeechRecognition.available();
      if (!available) {
        setToastMessage('Speech recognition not available');
        setShowToast(true);
        return;
      }

      // Reset interim text if not continuing
      if (!continuedText) {
        setIntrimText('');
      }

      // Start recognition
      await SpeechRecognition.start({
        language: language === 'en' ? 'en-US' : 'bn-BD',
        maxResults: 1,
        partialResults: true,
        popup: false,
      });

      setIsRecording(true);
    } catch (error: any) {
      console.error('Start recording error:', error);
      setToastMessage('Failed to start recording: ' + error.message);
      setShowToast(true);
    }
  };

  const stopRecording = async () => {
    try {
      if (isRecording) {
        await SpeechRecognition.stop();
      }
      setIsRecording(false);

      // Process the text
      const text = continuedText ? continuedText + ' ' + interimText : interimText.trim();
      if (text) {
        await processText(text);
      } else {
        setToastMessage('No speech detected. Please try again.');
        setShowToast(true);
      }
    } catch (error: any) {
      console.error('Stop recording error:', error);
      setIsRecording(false);
      setToastMessage('Failed to stop recording: ' + error.message);
      setShowToast(true);
    }
  };

  const processText = async (text: string) => {
    setIsProcessing(true);
    setIntrimText('');
    setTotalPrice('Total');
    setProducts([]);
    try {
      //text = continuedText ? continuedText + ' ' + text : text;
      setContinuedText('');
      continuedTextRef.current = '';
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
      await apiService.processText(text, mobileNumber);
      setMobileNumber('');
      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: 'Saved successfully. Total price is ' + parseProducts(text).reduce((sum, product) => sum + product.quantity * product.unitPrice, 0).toFixed(2) + ' taka.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
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
    const lastText = lastMessage ? lastMessage.text : '';
    setContinuedText(lastText);
    continuedTextRef.current = lastText;
    console.log('Continuing with last message text');
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
    const parsedProducts = parseProducts(text);
    setProducts(parsedProducts);
    setShowProductModal(true);
    console.log('Parsed Products:', parsedProducts, text);
  };
  const accumulateText = () => {
    // Accumulate the text: combine continuedText with current interimText
    const currentText = interimText.trim();
    const accumulated = continuedText
      ? (currentText ? continuedText + ' ' + currentText : continuedText)
      : currentText;
    setContinuedText(accumulated);
    continuedTextRef.current = accumulated;
  }
  const onStartStop = async () => {
    accumulateText();
    if (isRecording) {
      try {
        await SpeechRecognition.stop();
        setIsRecording(false);
        // Clear interim text for next session
        setIntrimText('');
      } catch (error: any) {
        console.error('Stop recording error:', error);
        setIsRecording(false);
        setToastMessage('Failed to stop recording');
        setShowToast(true);
      }
    } else {
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
    setShowProductModal(false);
    // Recalculate total when editing is done
    let total = 0;
    const text: string[] = [];
    products.forEach(product => {
      total += product.unitPrice * product.quantity;
      const typeText = product.type ? ` type ${product.type}` : '';
      text.push(`${product.productName}${typeText} quantity ${product.quantity} unit price ${product.unitPrice}`);
    });
    setTotalPrice(`Total: ${total.toFixed(2)} taka`);
    const updatedText = text.join(' ');
    setIntrimText(updatedText);
    setContinuedText('');
    continuedTextRef.current = '';
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
    const updatedText = text.join(' ');
    setIntrimText(updatedText);
    setContinuedText('');
    continuedTextRef.current = '';
  };
  const onSave = () => {
    stopRecording();
  }
  const onCancel = async () => {
    try {
      if (isRecording) {
        await SpeechRecognition.stop();
      }
      setIsRecording(false);
      setIntrimText('');
      setContinuedText('');
      continuedTextRef.current = '';
    } catch (error: any) {
      console.error('Stop recording error:', error);
      setIsRecording(false);
      setToastMessage('Failed to stop recording');
      setShowToast(true);
    }
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
                Napa type tablet quantity 10 unit price 1.7 Minaril quantity 5 unit price 2.5
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
                      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {message.text}
                      </div>
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
                        type="tel"
                        label="Mobile Number"
                        labelPlacement="floating"
                        placeholder="Enter Mobile Number"
                        value={mobileNumber}
                        onIonInput={(e) => setMobileNumber(e.detail.value || '')}
                      />
                    </IonItem>
                  </div>
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
                      "{continuedText && interimText ? continuedText + ' ' + interimText : (continuedText || interimText)}"
                    </p>
                  </IonText>
                </div>

              </IonCardContent>
              <IonButton onClick={onStartStop} fill="clear">{isRecording ? 'Stop' : 'Start'}</IonButton>
              <IonButton onClick={onCalculateTotal} fill="clear">{totalPrice}</IonButton>
              <IonButton onClick={onProductEdit} fill="clear">Edit</IonButton>
              <IonButton onClick={onSave} fill="clear">Save</IonButton>
              <IonButton onClick={onCancel} fill="clear">Cancel</IonButton>
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

        <IonModal isOpen={showProductModal} onDidDismiss={() => setShowProductModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Products</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowProductModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {products.length > 0 ? (
              <div>
                {products.map((product, index) => (
                  <div key={index} style={{ marginBottom: '1rem' }}>
                    {editingProductIndex === index ? (
                      <IonCard style={{ backgroundColor: 'var(--ion-color-light-shade)' }}>
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
                            style={{ marginTop: '0.5rem', marginLeft: '0.5rem' }}
                          >
                            Delete
                          </IonButton>
                        </IonCardContent>
                      </IonCard>
                    ) : (
                      <IonCard
                        style={{ cursor: 'pointer' }}
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
            ) : (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <IonText color="medium">
                  <p>No products to edit</p>
                </IonText>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default VoiceAssistantPage;
