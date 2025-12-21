import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AiChatComponent } from './components/ai-chat/ai-chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, AiChatComponent],
  template: `
    <div class="app-container">
      <header class="header">
        <div class="header-content">
          <h1 class="logo">🍎 MAKLA</h1>
          <nav class="nav">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
              <span class="icon">🏠</span> Dashboard
            </a>
            <a routerLink="/ai-assistant" routerLinkActive="active">
              <span class="icon">🤖</span> AI Assistant
            </a>
            <a routerLink="/foods" routerLinkActive="active">
              <span class="icon">🍎</span> Aliments
            </a>
            <a routerLink="/meals" routerLinkActive="active">
              <span class="icon">🍽️</span> Repas
            </a>
            <a routerLink="/water" routerLinkActive="active">
              <span class="icon">💧</span> Hydratation
            </a>
            <a routerLink="/diagnostic" routerLinkActive="active">
              <span class="icon">🔍</span> Diagnostic
            </a>
            <a routerLink="/settings" routerLinkActive="active">
              <span class="icon">⚙️</span> Settings
            </a>
          </nav>
        </div>
      </header>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      
      <!-- AI Chat Assistant (globally available) -->
      <app-ai-chat></app-ai-chat>
      
      <footer class="footer">
        <p>© 2025 Makla - Application de Nutrition</p>
      </footer>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: 2rem;
      font-weight: bold;
    }
    
    .nav {
      display: flex;
      gap: 1rem;
    }
    
    .nav a {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .nav a:hover {
      background: rgba(255,255,255,0.2);
    }
    
    .nav a.active {
      background: rgba(255,255,255,0.3);
      font-weight: bold;
    }
    
    .icon {
      font-size: 1.2rem;
    }
    
    .main-content {
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .footer {
      background: #2c3e50;
      color: white;
      text-align: center;
      padding: 1rem;
    }
  `]
})
export class AppComponent {
  title = 'Makla';
}
