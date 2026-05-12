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
  private userSub: Subscription | null = null;
  isPatient = false;

  constructor(
    private aiChatService: AiChatService,
    private authService: AuthService
  ) {}

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
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
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

    // Prepare history for Gemini (First content must be 'user')
    // Filter out error messages from history
    let history = this.messages
      .filter(msg => !msg.text.includes("I'm sorry, I'm having trouble connecting"))
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
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
