import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService } from '../../services/ai-chat.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

interface Message {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  audioUrl?: string;
}

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chatbot.component.html',
  styleUrls: ['./ai-chatbot.component.css']
})
export class AiChatbotComponent implements OnInit, OnDestroy {
  isOpen = false;
  userInput = '';
  messages: Message[] = [];
  isLoading = false;
  isListening = false;
  private userSub: Subscription | null = null;
  isPatient = false;
  playingAudioIndex: number | null = null;
  
  // Voice recognition
  private recognition: any;
  private isSpeechRecognitionSupported: boolean = false;
  
  // Audio playback
  private audioContext: AudioContext | null = null;

  constructor(
    private aiChatService: AiChatService,
    private authService: AuthService
  ) {
    this.initializeSpeechRecognition();
  }

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.isPatient = user?.role === 'PATIENT';
    });

    // Add a welcome message
    this.messages.push({
      text: "Hello! I'm your OncoStage AI assistant. How can I help you today with questions about lung cancer or other types of cancers?",
      sender: 'ai',
      timestamp: new Date()
    });
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  private initializeSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.isSpeechRecognitionSupported = true;
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.language = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript_part = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            transcript += transcript_part;
            isFinal = true;
          } else {
            transcript += transcript_part;
          }
        }
        
        if (transcript.trim()) {
          this.userInput = transcript.trim();
        }
        
        // Stop listening after final result
        if (isFinal) {
          this.stopListening();
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
      };
    }
  }

  startListening() {
    if (this.isSpeechRecognitionSupported && !this.isListening) {
      this.recognition.start();
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  playVoice(messageIndex: number) {
    const message = this.messages[messageIndex];
    if (!message || !message.text) {
      console.error('Message not found or text is empty');
      return;
    }

    // Set loading state
    this.playingAudioIndex = messageIndex;

    this.aiChatService.textToSpeech(message.text, 'en-US').subscribe({
      next: (res) => {
        this.playingAudioIndex = null;
        
        if (res && res.audioContent) {
          try {
            const audio = new Audio(`data:audio/mp3;base64,${res.audioContent}`);
            audio.volume = 1.0;
            audio.onerror = () => {
              console.error('Audio element error');
              alert('Failed to play audio. Browser may not support this audio format.');
            };
            
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('Audio playback started');
                  message.audioUrl = `data:audio/mp3;base64,${res.audioContent}`;
                })
                .catch(err => {
                  console.error('Audio playback error:', err);
                  alert('Failed to play audio: ' + err.message);
                });
            }
          } catch (error) {
            console.error('Error creating audio element:', error);
            alert('Error creating audio player: ' + (error as Error).message);
          }
        } else {
          console.error('No audio content in response:', res);
          alert('No audio content received from server.');
        }
      },
      error: (err) => {
        this.playingAudioIndex = null;
        console.error('TTS Error:', err);
        const errorMsg = err.error?.error || err.message || 'Unknown error';
        alert('TTS Error: ' + errorMsg);
      }
    });
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userMessage = this.userInput.trim();
    this.messages.push({
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    });

    this.userInput = '';
    this.isLoading = true;

    // Prepare history for Groq
    let history = this.messages
      .filter(msg => !msg.text.includes("I'm sorry, I'm having trouble connecting"))
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        parts: [{ text: msg.text }]
      }))
      .slice(0, -1);

    // Filter history to ensure it starts with a 'user' message
    const firstUserIndex = history.findIndex(h => h.role === 'user');
    if (firstUserIndex !== -1) {
      history = history.slice(firstUserIndex);
    } else {
      history = [];
    }

    this.aiChatService.sendMessage(userMessage, history).subscribe({
      next: (res) => {
        this.messages.push({
          text: res.response,
          sender: 'ai',
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Chat error:', err);
        const errorMsg = err.error?.error || err.message || "Unknown error";
        this.messages.push({
          text: `I'm sorry, I'm having trouble connecting (Error: ${errorMsg}). Please try again later.`,
          sender: 'ai',
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
      }
    });

    this.scrollToBottom();
  }

  private scrollToBottom() {
    setTimeout(() => {
      const chatMessages = document.querySelector('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
        // Fallback for some browsers
        setTimeout(() => {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
      }
    }, 200);
  }
}