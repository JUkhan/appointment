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
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { apiService } from '../services/apiService';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/colors';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export const VoiceAssistantScreen = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [processing, setProcessing] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  useEffect(() => {
    // Request audio permission on mount
    if (Platform.OS !== 'web') {
      setupAudio();
    }
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Failed to setup audio:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Request permission if not granted
      if (permissionResponse && permissionResponse.status !== 'granted') {
        const permission = await requestPermission();
        if (permission.status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Microphone permission is required to use voice assistant.'
          );
          return;
        }
      }

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      if (uri) {
        await processAudio(uri);
      }

      setRecording(null);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
      console.error('Failed to stop recording:', error);
    }
  };

  const processAudio = async (audioUri: string) => {
    setProcessing(true);

    try {
      const response = await apiService.processAudio(audioUri, language);

      // Add user message (transcription)
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        text: response.transcription,
        timestamp: new Date(),
      };

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      // Play audio response if available
      if (response.audio_id) {
        playAudioResponse(response.audio_id);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        'Failed to process audio. Please check your connection and try again.'
      );
      console.error('Failed to process audio:', error);
    } finally {
      setProcessing(false);
    }
  };

  const playAudioResponse = async (audioId: string) => {
    try {
      // For text-to-speech, use expo-speech
      const assistantMessage = messages[messages.length - 1];
      if (assistantMessage && assistantMessage.type === 'assistant') {
        Speech.speak(assistantMessage.text, {
          language: language === 'en' ? 'en-US' : 'bn-IN',
        });
      }

      // Clean up audio on server
      setTimeout(() => {
        apiService.cleanupAudio(audioId).catch(console.error);
      }, 5000);
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
    if (isRecording) {
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
              <Text
                style={[
                  styles.messageText,
                  message.type === 'user'
                    ? styles.userMessageText
                    : styles.assistantMessageText,
                ]}
              >
                {message.text}
              </Text>
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
            isRecording && styles.recordButtonActive,
            processing && styles.recordButtonDisabled,
          ]}
          onPress={handleRecordPress}
          disabled={processing}
          activeOpacity={0.7}
        >
          <Text style={styles.recordButtonText}>
            {processing
              ? '⏳'
              : isRecording
              ? '⏹'
              : '🎤'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>
          {processing
            ? 'Processing...'
            : isRecording
            ? 'Recording... (Tap to stop)'
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
