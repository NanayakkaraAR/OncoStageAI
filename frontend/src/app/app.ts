import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AiChatbotComponent } from './components/ai-chatbot/ai-chatbot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AiChatbotComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('onco-stage-ai');
}
