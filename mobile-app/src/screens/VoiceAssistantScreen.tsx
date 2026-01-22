import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  IOSOutputFormat,
  AudioQuality
} from 'expo-audio';
import type { RecordingOptions } from 'expo-audio';
import * as Speech from 'expo-speech';
import Markdown from 'react-native-markdown-display';
import { apiService } from '../services/apiService';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/colors';
import { stripMarkdown } from '../utils/stripMarkdown';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

// Custom recording options optimized for speech recognition
// Using M4A/AAC for better compatibility across platforms
const SPEECH_RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 44100, // Higher quality for better recognition
  numberOfChannels: 1, // Mono for speech
  bitRate: 128000,
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4', // AAC in MPEG4 container
    audioEncoder: 'aac',
  },
  ios: {
    extension: '.m4a',
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MAX, // Maximum quality
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export const VoiceAssistantScreen = () => {
  const audioRecorder = useAudioRecorder(SPEECH_RECORDING_OPTIONS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [processing, setProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request permission if not granted
      const permissionStatus = await getRecordingPermissionsAsync();
      if (permissionStatus.status !== 'granted') {
        const permission = await requestRecordingPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Microphone permission is required to use voice assistant.'
          );
          return;
        }
      }

      // Prepare and start recording
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      // Start duration counter
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!audioRecorder.isRecording) return;

    try {
      // Clear the duration counter
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      console.log('Recording stopped');
      console.log('Duration:', recordingDuration, 'seconds');
      console.log('URI:', uri);

      // Check minimum duration
      if (recordingDuration < 1) {
        Alert.alert(
          'Recording Too Short',
          'Please record for at least 1 second. Tap and hold the microphone button while speaking.'
        );
        setRecordingDuration(0);
        return;
      }

      if (uri) {
        await processAudio(uri);
      }

      setRecordingDuration(0);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
      console.error('Failed to stop recording:', error);
      setRecordingDuration(0);
    }
  };

  const processAudio = async (audioUri: string) => {
    setProcessing(true);

    try {
      console.log('Processing audio URI:', audioUri);
      console.log('Language:', language);

      const response = await apiService.processAudio(audioUri, language);
      console.log('API response:', response);

      if (response.error) {
        Alert.alert('Error', response.error);
        return;
      }
      // Add user message (transcription)
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        text: response.user_text,
        timestamp: new Date(),
      };

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: response.llm_response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      // Play audio response
      playAudioResponse(response.llm_response);
    } catch (error: any) {
      console.error('Failed to process audio:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);

      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          'Failed to process audio. Please check your connection and try again.';

      Alert.alert('Error', errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const playAudioResponse = async (responseText: string) => {
    try {
      // For text-to-speech, use expo-speech
      responseText = stripMarkdown(responseText);
      Speech.speak(responseText, {
        language: language === 'en' ? 'en-US' : 'bn-IN',
      });

    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const clearConversation = () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to clear the conversation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setMessages([]),
        },
      ]
    );
  };

  const handleRecordPress = () => {
    if (audioRecorder.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title={`Language: ${language === 'en' ? 'English' : 'বাংলা'}`}
          onPress={toggleLanguage}
          variant="outline"
          style={styles.languageButton}
        />
        {messages.length > 0 && (
          <Button
            title="Clear"
            onPress={clearConversation}
            variant="destructive"
            style={styles.clearButton}
          />
        )}
      </View>

      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Voice Assistant</Text>
            <Text style={styles.emptyText}>
              Tap the microphone button to start a conversation with the voice
              assistant. You can book appointments using voice commands!
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageCard,
                message.type === 'user'
                  ? styles.userMessage
                  : styles.assistantMessage,
              ]}
            >
              {message.type === 'user' ? (
                <Text
                  style={[
                    styles.messageText,
                    styles.userMessageText,
                  ]}
                >
                  {message.text}
                </Text>
              ) : (
                <Markdown
                  style={{
                    body: styles.assistantMessageText,
                    paragraph: {
                      marginTop: 0,
                      marginBottom: 8,
                    },
                    bullet_list: {
                      marginBottom: 8,
                    },
                    ordered_list: {
                      marginBottom: 8,
                    },
                    code_inline: {
                      backgroundColor: Colors.background,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      borderRadius: 4,
                    },
                    code_block: {
                      backgroundColor: Colors.background,
                      padding: 8,
                      borderRadius: 8,
                      marginBottom: 8,
                    },
                    fence: {
                      backgroundColor: Colors.background,
                      padding: 8,
                      borderRadius: 8,
                      marginBottom: 8,
                    },
                  }}
                >
                  {message.text}
                </Markdown>
              )}
              <Text
                style={[
                  styles.messageTime,
                  message.type === 'user'
                    ? styles.userMessageTime
                    : styles.assistantMessageTime,
                ]}
              >
                {formatTime(message.timestamp)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            audioRecorder.isRecording && styles.recordButtonActive,
            processing && styles.recordButtonDisabled,
          ]}
          onPress={handleRecordPress}
          disabled={processing}
          activeOpacity={0.7}
        >
          <Text style={styles.recordButtonText}>
            {processing
              ? '⏳'
              : audioRecorder.isRecording
                ? '⏹'
                : '🎤'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>
          {processing
            ? 'Processing...'
            : audioRecorder.isRecording
              ? `Recording... ${recordingDuration}s (Tap to stop)`
              : 'Tap to start recording'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  languageButton: {
    flex: 1,
  },
  clearButton: {
    paddingHorizontal: Spacing.lg,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  messageCard: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.backgroundSecondary,
  },
  messageText: {
    fontSize: FontSizes.md,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  userMessageText: {
    color: Colors.white,
  },
  assistantMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: FontSizes.xs,
  },
  userMessageTime: {
    color: Colors.white,
    opacity: 0.8,
  },
  assistantMessageTime: {
    color: Colors.textSecondary,
  },
  footer: {
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: Colors.error,
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
  recordButtonText: {
    fontSize: 40,
  },
  footerText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});
