import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AiService } from '../../services/ai.service';
import { MealService } from '../../services/meal.service';
import { WaterService } from '../../services/water.service';
import { EnhancedDashboardComponent } from '../../components/enhanced-dashboard/enhanced-dashboard.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, EnhancedDashboardComponent],
  template: `
    <div class="home">
      <div class="auth-bar">
        <div *ngIf="!isAuthenticated">
          <a routerLink="/login" class="auth-link">Se connecter</a>
          <a routerLink="/register" class="auth-link register">S'inscrire</a>
        </div>
        <div *ngIf="isAuthenticated" class="user-info">
          <span>Bonjour, {{ username }}</span>
          <button (click)="logout()" class="logout-btn">Déconnexion</button>
        </div>
      </div>

      <div class="hero">
        <h1>🤖 AI Nutrition Assistant</h1>
        <p class="subtitle">Real-time nutrition tracking with Phi3 AI integration</p>
        <div class="ai-status">
          <span class="status-indicator" [class.online]="aiOnline">
            {{ aiOnline ? 'AI Online' : 'AI Offline' }}
          </span>
          <button class="clear-btn" (click)="clearData()">🗑️ Clear</button>
          <button class="refresh-btn" (click)="checkAIStatus()">🔄 Refresh</button>
        </div>
      </div>

      <!-- Enhanced Dashboard with real-time AI updates -->
      <app-enhanced-dashboard></app-enhanced-dashboard>

      <!-- AI Integration Status -->
      <div class="integration-info">
        <div class="info-card">
          <h3>🤖 How to use AI Integration</h3>
          <ul>
            <li><strong>Say:</strong> "I ate chicken salad" → Automatically logs meal with nutrition</li>
            <li><strong>Say:</strong> "I drank 2 glasses of water" → Updates water tracking</li>
            <li><strong>Say:</strong> "How am I doing today?" → Gets AI health analysis</li>
            <li><strong>Say:</strong> "Suggest a healthy dinner" → Get Phi3-powered meal recommendations</li>
          </ul>
        </div>

        <div class="info-card">
          <h3>📊 Real-time Dashboard</h3>
          <p>The dashboard above updates instantly when you chat with the AI:</p>
          <ul>
            <li>🔥 Calories counter animates when meals are logged</li>
            <li>💧 Water intake updates in real-time</li>
            <li>📈 Health score recalculates automatically</li>
            <li>🤖 AI insights appear from Phi3 responses</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home {
      animation: fadeIn 0.5s;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .auth-bar {
      display: flex;
      justify-content: flex-end;
      padding: 1rem 2rem;
      background: white;
      border-radius: 10px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .auth-link {
      padding: 0.5rem 1rem;
      color: #667eea;
      text-decoration: none;
      border-radius: 5px;
      transition: all 0.3s;
      margin-left: 1rem;
    }

    .auth-link:hover {
      background: #f0f0f0;
    }

    .auth-link.register {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .auth-link.register:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info span {
      color: #2c3e50;
      font-weight: 600;
    }

    .logout-btn {
      padding: 0.5rem 1rem;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .logout-btn:hover {
      background: #c0392b;
      transform: translateY(-2px);
    }

    .hero {
      text-align: center;
      padding: 3rem 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 15px;
      margin-bottom: 3rem;
    }

    .hero h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .subtitle {
      font-size: 1.3rem;
      opacity: 0.9;
      margin-bottom: 1.5rem;
    }

    .ai-status {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
    }

    .integration-info {
      background: #f9f9f9;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-top: 2rem;
    }

    .info-card {
      margin-bottom: 1.5rem;
    }

    .info-card h3 {
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .info-card ul {
      list-style: disc;
      padding-left: 1.5rem;
      color: #34495e;
    }

    .info-card ul li {
      margin-bottom: 0.5rem;
    }

    .status-indicator {
      display: inline-block;
      padding: 0.4rem 0.8rem;
      border-radius: 12px;
      font-weight: bold;
      transition: background 0.3s, color 0.3s;
    }

    .status-indicator.online {
      background: #28a745;
      color: white;
    }

    .status-indicator:not(.online) {
      background: #dc3545;
      color: white;
    }

    .clear-btn, .refresh-btn {
      padding: 0.4rem 0.8rem;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.3s;
    }

    .clear-btn {
      background: #007bff;
      color: white;
    }

    .clear-btn:hover {
      background: #0056b3;
    }

    .refresh-btn {
      background: #28a745;
      color: white;
    }

    .refresh-btn:hover {
      background: #1e7e34;
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }
      
      .ai-status {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  isAuthenticated = false;
  username = '';
  aiOnline = false;

  constructor(
    private authService: AuthService,
    private aiService: AiService,
    private mealService: MealService,
    private waterService: WaterService
  ) { }

  ngOnInit(): void {
    // Check if user is authenticated
    this.authService.currentUser.subscribe({
      next: (user) => {
        this.isAuthenticated = !!user;
        this.username = user?.username || '';
      },
      error: (err) => {
        console.warn('Auth service not available:', err);
        this.isAuthenticated = false;
      }
    });

    this.checkAIStatus();
  }

  checkAIStatus(): void {
    // Check AI service status - try to test if AI service is available
    try {
      // Test if the AI service has the expected methods
      if (typeof this.aiService.chat === 'function') {
        // Try a simple health check - some AI services expect just a string message
        this.aiService.chat('ping').subscribe({
          next: () => {
            this.aiOnline = true;
            console.log('AI service is online');
          },
          error: (err) => {
            this.aiOnline = false;
            console.warn('AI service is offline:', err);
          }
        });
      } else {
        // If chat method doesn't exist as expected, assume offline
        this.aiOnline = false;
        console.warn('AI service chat method not available');
      }
    } catch (err) {
      this.aiOnline = false;
      console.warn('Error checking AI status:', err);
    }
  }

  clearData(): void {
    try {
      // Trigger dashboard refresh to update all data
      this.aiService.refreshDashboardData();
      console.log('Dashboard data refreshed');

      // Show success message
      alert('Dashboard data has been refreshed!');
    } catch (err) {
      console.warn('Could not refresh dashboard data:', err);
      alert('Unable to refresh data. Please try again.');
    }
  }

  logout(): void {
    try {
      this.authService.logout();
    } catch (err) {
      console.warn('Logout failed:', err);
      // Manual logout fallback
      this.isAuthenticated = false;
      this.username = '';
    }
  }
}
