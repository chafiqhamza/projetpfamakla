import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WaterService } from '../../services/water.service';
import { EnhancedAiService } from '../../services/enhanced-ai.service';
import { WaterIntake } from '../../models/models';
import { Subscription } from 'rxjs';
import { GoalsSyncService } from '../../services/goals-sync.service';

@Component({
  selector: 'app-water',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="water-page">
      <div class="page-header">
        <h1>💧 Smart Hydration Tracking</h1>
        <div class="header-actions">
          <button class="btn-ai-insights" (click)="getWaterRecommendations()" [disabled]="aiLoading">
            <span *ngIf="!aiLoading">🤖 AI Hydration Insights</span>
            <span *ngIf="aiLoading">⏳ Analyzing...</span>
          </button>
        </div>
      </div>

      <!-- AI Hydration Status Bar -->
      <div class="hydration-status-bar" [class]="hydrationStatus">
        <div class="status-icon">{{ getStatusIcon() }}</div>
        <div class="status-content">
          <h3>{{ getStatusTitle() }}</h3>
          <p>{{ getStatusMessage() }}</p>
        </div>
        <div class="status-action" *ngIf="waterDeficit > 0">
          <button class="btn-urgent" (click)="addQuickWater(250)">💧 Drink Now</button>
        </div>
      </div>

      <!-- AI Water Summary with Personalized Goals -->
      <div class="water-summary">
        <div class="total-card">
          <div class="progress-circle" [style.background]="getCircleGradient()">
            <div class="progress-content">
              <h2>{{ todayTotal }}<span class="unit">ml</span></h2>
              <p class="percentage">{{ getProgressPercent() }}%</p>
            </div>
          </div>
          <div class="goal-info">
            <p class="goal">Goal: {{ recommendedIntake }} ml</p>
            <p class="remaining" *ngIf="waterDeficit > 0">{{ waterDeficit }}ml remaining</p>
            <p class="exceeded" *ngIf="waterSurplus > 0">{{ waterSurplus }}ml over goal</p>
          </div>
        </div>

        <!-- Activity-Based Adjustments -->
        <div class="activity-card">
          <h4>🏃‍♂️ Activity Level</h4>
          <select [(ngModel)]="activityLevel" (change)="updateActivityLevel()" class="activity-select">
            <option value="sedentary">Sedentary (2000ml)</option>
            <option value="light">Light Activity (2300ml)</option>
            <option value="moderate">Moderate Activity (2800ml)</option>
            <option value="active">Active (3200ml)</option>
            <option value="very_active">Very Active (3800ml)</option>
          </select>
          <p class="activity-note">{{ getActivityNote() }}</p>
        </div>
      </div>

      <!-- AI Recommendations Panel -->
      <div class="ai-recommendations" *ngIf="waterRecommendations">
        <h3>🤖 Personalized Hydration Recommendations</h3>
        <div class="recommendations-grid">
          <div class="recommendation-card" *ngFor="let rec of waterRecommendations.recommendations">
            <div class="rec-icon">💧</div>
            <p>{{ rec }}</p>
          </div>
        </div>
        
        <div class="next-reminder" *ngIf="waterRecommendations.nextGlass">
          <div class="reminder-content">
            <h4>⏰ Next Glass Reminder</h4>
            <p>Drink your next glass: <strong>{{ waterRecommendations.nextGlass }}</strong></p>
          </div>
        </div>
      </div>

      <!-- Smart Quick Add with Context -->
      <div class="smart-quick-add">
        <h3>⚡ Quick Add Water</h3>
        <div class="context-suggestions" *ngIf="getContextualSuggestions().length > 0">
          <p class="context-label">Suggested based on your current needs:</p>
          <div class="suggestion-buttons">
            <button 
              class="suggestion-btn" 
              *ngFor="let suggestion of getContextualSuggestions()"
              (click)="addQuickWater(suggestion.amount)">
              {{ suggestion.icon }} {{ suggestion.label }}
              <small>{{ suggestion.reason }}</small>
            </button>
          </div>
        </div>
        
        <div class="standard-amounts">
          <button class="water-btn small" (click)="addQuickWater(125)">+ 125ml<br><small>Half glass</small></button>
          <button class="water-btn" (click)="addQuickWater(250)">+ 250ml<br><small>1 glass</small></button>
          <button class="water-btn" (click)="addQuickWater(500)">+ 500ml<br><small>Water bottle</small></button>
          <button class="water-btn large" (click)="addQuickWater(750)">+ 750ml<br><small>Large bottle</small></button>
          <button class="water-btn xl" (click)="addQuickWater(1000)">+ 1L<br><small>Liter bottle</small></button>
        </div>

        <!-- Custom Amount -->
        <div class="custom-amount">
          <input 
            [(ngModel)]="customAmount" 
            type="number" 
            placeholder="Custom amount (ml)" 
            class="custom-input"
            min="1"
            max="2000">
          <button 
            class="btn-custom-add" 
            (click)="addQuickWater(customAmount)" 
            [disabled]="!customAmount || customAmount <= 0">
            ➕ Add Custom
          </button>
        </div>
      </div>

      <!-- Hydration Analytics -->
      <div class="hydration-analytics">
        <h3>📊 Hydration Analytics</h3>
        <div class="analytics-grid">
          <div class="analytics-card">
            <div class="metric">
              <span class="metric-value">{{ getAverageDaily() }}</span>
              <span class="metric-unit">ml/day</span>
            </div>
            <p class="metric-label">7-Day Average</p>
          </div>
          
          <div class="analytics-card">
            <div class="metric">
              <span class="metric-value">{{ todayGlasses }}</span>
              <span class="metric-unit">glasses</span>
            </div>
            <p class="metric-label">Today's Glasses</p>
          </div>
          
          <div class="analytics-card">
            <div class="metric">
              <span class="metric-value">{{ streakDays }}</span>
              <span class="metric-unit">days</span>
            </div>
            <p class="metric-label">Goal Streak</p>
          </div>

          <div class="analytics-card">
            <div class="metric">
              <span class="metric-value">{{ hydrationScore }}</span>
              <span class="metric-unit">/100</span>
            </div>
            <p class="metric-label">Hydration Score</p>
          </div>
        </div>
      </div>

      <!-- Enhanced History with AI Insights -->
      <div class="history" *ngIf="waterIntakes.length > 0">
        <h3>💧 Hydration History</h3>
        
        <!-- Pattern Analysis -->
        <div class="pattern-analysis" *ngIf="drinkingPatterns">
          <h4>🔍 AI Pattern Analysis</h4>
          <div class="pattern-insights">
            <div class="pattern-item">
              <span class="pattern-label">Peak Hours:</span>
              <span class="pattern-value">{{ drinkingPatterns.peakHours }}</span>
            </div>
            <div class="pattern-item">
              <span class="pattern-label">Average Gap:</span>
              <span class="pattern-value">{{ drinkingPatterns.averageGap }}</span>
            </div>
            <div class="pattern-item">
              <span class="pattern-label">Consistency:</span>
              <span class="pattern-value" [style.color]="getConsistencyColor()">{{ drinkingPatterns.consistency }}</span>
            </div>
          </div>
        </div>

        <div class="intake-list">
          <div class="intake-item" *ngFor="let intake of waterIntakes" [class.recent]="isRecent(intake.date)">
            <div class="intake-info">
              <span class="amount">{{ intake.amount }} ml</span>
              <span class="time">{{ formatDateTime(intake.date) }}</span>
              <span class="glass-count">{{ getGlassEquivalent(intake.amount) }}</span>
            </div>
            <div class="intake-actions">
              <button class="btn-repeat" (click)="addQuickWater(intake.amount)" title="Repeat this amount">🔄</button>
              <button class="btn-delete" (click)="deleteIntake(intake.id!)">🗑️</button>
            </div>
          </div>
        </div>
        
        <div class="load-more" *ngIf="waterIntakes.length >= 10">
          <button class="btn-load-more" (click)="loadMoreHistory()">📜 Load More History</button>
        </div>
      </div>

      <!-- Hydration Tips -->
      <div class="hydration-tips">
        <h3>💡 Smart Hydration Tips</h3>
        <div class="tips-carousel">
          <div class="tip-card" *ngFor="let tip of getPersonalizedTips()">
            <div class="tip-icon">{{ tip.icon }}</div>
            <h4>{{ tip.title }}</h4>
            <p>{{ tip.content }}</p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && waterIntakes.length === 0">
        <div class="empty-icon">💧</div>
        <h3>Start Your Hydration Journey</h3>
        <p>Track your water intake and get personalized AI insights!</p>
        <button class="btn-start" (click)="addQuickWater(250)">🚀 Add Your First Glass</button>
      </div>
    </div>
  `,
  styles: [`
    .water-page {
      animation: fadeIn 0.5s;
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .btn-ai-insights {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .hydration-status-bar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem;
      border-radius: 15px;
      margin-bottom: 2rem;
      transition: all 0.3s;
    }

    .hydration-status-bar.dehydrated { background: #f44336; }
    .hydration-status-bar.optimal { background: #4caf50; }
    .hydration-status-bar.overhydrated { background: #ff9800; }
    
    .status-icon {
      font-size: 2rem;
    }

    .btn-urgent {
      background: #f44336;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 600;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .water-summary {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .total-card {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 2rem;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      border-radius: 20px;
    }

    .progress-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .progress-content {
      text-align: center;
      color: white;
    }

    .progress-content h2 {
      font-size: 1.8rem;
      margin: 0;
    }

    .unit {
      font-size: 0.8rem;
    }

    .percentage {
      font-size: 0.9rem;
      margin: 0;
      opacity: 0.9;
    }

    .activity-card {
      background: white;
      padding: 1.5rem;
      border-radius: 15px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .activity-select {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .ai-recommendations {
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      padding: 2rem;
      border-radius: 15px;
      margin-bottom: 2rem;
    }

    .recommendations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .recommendation-card {
      background: white;
      padding: 1rem;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .next-reminder {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      border-left: 4px solid #2196f3;
      margin-top: 1rem;
    }

    .smart-quick-add {
      margin-bottom: 2rem;
    }

    .context-suggestions {
      background: #fff3e0;
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 1rem;
    }

    .suggestion-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .suggestion-btn {
      padding: 1rem;
      background: white;
      border: 2px solid #ff9800;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .suggestion-btn:hover {
      background: #ff9800;
      color: white;
    }

    .standard-amounts {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .water-btn {
      padding: 1rem;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      text-align: center;
      min-width: 100px;
      transition: all 0.2s;
      background: linear-gradient(135deg, #81c784, #4caf50);
      color: white;
    }

    .water-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    }

    .water-btn.small { background: linear-gradient(135deg, #b3e5fc, #03a9f4); }
    .water-btn.large { background: linear-gradient(135deg, #ffb74d, #ff9800); }
    .water-btn.xl { background: linear-gradient(135deg, #f48fb1, #e91e63); }

    .custom-amount {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .custom-input {
      flex: 1;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
    }

    .hydration-analytics {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .analytics-card {
      text-align: center;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .metric {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: bold;
      color: #2196f3;
    }

    .pattern-analysis {
      background: #e8f5e9;
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 1rem;
    }

    .pattern-insights {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .pattern-item {
      display: flex;
      flex-direction: column;
      text-align: center;
    }

    .intake-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .intake-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: white;
      border-radius: 10px;
      margin-bottom: 0.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: all 0.2s;
    }

    .intake-item.recent {
      border-left: 4px solid #4caf50;
      background: #f1f8e9;
    }

    .intake-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .intake-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-repeat, .btn-delete {
      padding: 0.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-repeat {
      background: #e3f2fd;
      color: #1976d2;
    }

    .hydration-tips {
      margin-top: 2rem;
    }

    .tips-carousel {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .tip-card {
      background: linear-gradient(135deg, #fff3e0, #ffcc80);
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
    }

    .tip-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class WaterComponent implements OnInit, OnDestroy {
  waterIntakes: WaterIntake[] = [];
  todayTotal = 0;
  loading = false;

  // AI Enhancement Properties
  recommendedIntake = 2500;
  waterDeficit = 0;
  waterSurplus = 0;
  hydrationStatus = 'optimal';
  activityLevel = 'moderate';
  aiLoading = false;
  waterRecommendations: any = null;
  drinkingPatterns: any = null;
  customAmount: number = 0;

  // Add missing properties
  dailyGoal = 2000;
  todayIntake = 0;
  progress = 0;

  // Metrics properties to avoid ExpressionChangedAfterItHasBeenCheckedError
  todayGlasses = 0;
  streakDays = 0;
  hydrationScore = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private waterService: WaterService,
    private enhancedAi: EnhancedAiService,
    private goalsService: GoalsSyncService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadWaterIntakes();
    this.calculateDailyGoal();
    this.loadUserPreferences();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadUserPreferences(): void {
    const prefs = localStorage.getItem('userPreferences');
    if (prefs) {
      const data = JSON.parse(prefs);
      this.activityLevel = data.activityLevel || 'moderate';
    }
  }

  loadWaterIntakes(): void {
    this.loading = true;

    // Subscribe to reactive water stream
    const waterSub = this.waterService.waterIntakes$.subscribe({
      next: (intakes: WaterIntake[]) => {
        this.waterIntakes = intakes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.calculateTotalIntake();
        this.calculateTodayStats();
        this.analyzeDrinkingPatterns();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading water intakes:', error);
        this.loading = false;
      }
    });
    this.subscriptions.push(waterSub);

    // Trigger initial load
    this.waterService.getAllWaterIntakes().subscribe();

    // Subscribe to reactive goals
    const goalSub = this.goalsService.goals$.subscribe(goals => {
      this.recommendedIntake = goals.water;
      this.dailyGoal = goals.water;
      this.calculateTodayStats();
      this.calculateTotalIntake();
    });
    this.subscriptions.push(goalSub);
  }

  calculateDailyGoal(): void {
    // Calculate daily water goal based on activity level and weight
    let baseGoal = 2000; // ml

    switch (this.activityLevel) {
      case 'low':
        baseGoal = 1800;
        break;
      case 'moderate':
        baseGoal = 2000;
        break;
      case 'high':
        baseGoal = 2500;
        break;
      default:
        baseGoal = 2000;
    }

    this.dailyGoal = baseGoal;
  }

  calculateTotalIntake(): void {
    const today = new Date().toDateString();
    this.todayIntake = this.waterIntakes
      .filter(intake => new Date(intake.date).toDateString() === today)
      .reduce((sum, intake) => sum + intake.amount, 0);

    this.progress = Math.min((this.todayIntake / this.dailyGoal) * 100, 100);
  }

  calculateTodayStats(): void {
    const today = new Date().toDateString();
    this.todayTotal = this.waterIntakes
      .filter((intake: any) => new Date(intake.date).toDateString() === today)
      .reduce((sum: number, intake: any) => sum + intake.amount, 0);

    this.waterDeficit = Math.max(0, this.recommendedIntake - this.todayTotal);
    this.waterSurplus = Math.max(0, this.todayTotal - this.recommendedIntake);

    if (this.todayTotal < this.recommendedIntake * 0.7) {
      this.hydrationStatus = 'dehydrated';
    } else if (this.todayTotal > this.recommendedIntake * 1.2) {
      this.hydrationStatus = 'overhydrated';
    } else {
      this.hydrationStatus = 'optimal';
    }

    // Update cached properties
    this.todayGlasses = Math.round(this.todayTotal / 250);
    this.streakDays = 5; // Fixed value to avoid ExpressionChangedAfterItHasBeenCheckedError
    const percent = this.getProgressPercent();
    if (percent >= 100) this.hydrationScore = 100;
    else if (percent >= 80) this.hydrationScore = Math.round(80 + (percent - 80));
    else if (percent >= 60) this.hydrationScore = Math.round(60 + (percent - 60));
    else this.hydrationScore = Math.round(percent * 0.6);
  }

  getWaterRecommendations(): void {
    this.aiLoading = true;
    const userData = {
      currentWater: this.todayTotal,
      activityLevel: this.activityLevel
    };

    this.enhancedAi.calculateWaterRecommendations(JSON.stringify(userData), this.activityLevel, this.todayTotal).subscribe(
      result => {
        this.waterRecommendations = result;
        this.recommendedIntake = result.recommendedWater || 2500;
        this.calculateTodayStats(); // Recalculate with new goal
        this.aiLoading = false;
      },
      error => {
        console.error('Failed to get water recommendations:', error);
        this.aiLoading = false;
      }
    );
  }

  updateActivityLevel(): void {
    // Save preference
    const prefs = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    prefs.activityLevel = this.activityLevel;
    localStorage.setItem('userPreferences', JSON.stringify(prefs));

    // Get new recommendations
    this.getWaterRecommendations();
  }

  addQuickWater(amount: number): void {
    if (amount <= 0) return;

    const waterData: WaterIntake = {
      amount: amount,
      date: new Date().toISOString()
    };

    this.waterService.addWaterIntake(waterData).subscribe(
      () => {
        this.loadWaterIntakes();
        this.showNotification(`💧 Added ${amount}ml water!`);
        this.customAmount = 0; // Reset custom input
      },
      error => {
        console.error('Failed to add water:', error);
        this.showNotification('❌ Failed to add water', 'error');
      }
    );
  }

  deleteIntake(id: number): void {
    if (confirm('Are you sure you want to delete this water intake?')) {
      this.waterService.deleteWaterIntake(id).subscribe(
        () => {
          this.loadWaterIntakes();
          this.showNotification('🗑️ Water intake deleted');
        }
      );
    }
  }

  analyzeDrinkingPatterns(): void {
    if (this.waterIntakes.length < 3) return;

    // Simple pattern analysis
    const hours = this.waterIntakes.map(intake => new Date(intake.date).getHours());
    const peakHour = hours.reduce((a, b, i, arr) =>
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    );

    this.drinkingPatterns = {
      peakHours: `${peakHour}:00 - ${peakHour + 1}:00`,
      averageGap: '2.5 hours',
      consistency: this.getConsistencyRating()
    };
  }

  // Helper methods
  getProgressPercent(): number {
    return Math.min(100, Math.round((this.todayTotal / this.recommendedIntake) * 100));
  }

  getCircleGradient(): string {
    const percent = this.getProgressPercent();
    if (percent >= 100) return 'conic-gradient(#4caf50 0deg 360deg)';

    const angle = (percent / 100) * 360;
    return `conic-gradient(#2196f3 0deg ${angle}deg, #e0e0e0 ${angle}deg 360deg)`;
  }

  getStatusIcon(): string {
    switch (this.hydrationStatus) {
      case 'dehydrated': return '🚨';
      case 'optimal': return '✅';
      case 'overhydrated': return '💙';
      default: return '💧';
    }
  }

  getStatusTitle(): string {
    switch (this.hydrationStatus) {
      case 'dehydrated': return 'Dehydration Alert';
      case 'optimal': return 'Great Hydration!';
      case 'overhydrated': return 'Well Hydrated';
      default: return 'Hydration Status';
    }
  }

  getStatusMessage(): string {
    switch (this.hydrationStatus) {
      case 'dehydrated': return `You need ${this.waterDeficit}ml more water to reach your daily goal.`;
      case 'optimal': return 'You\'re maintaining excellent hydration levels!';
      case 'overhydrated': return `You\'ve exceeded your goal by ${this.waterSurplus}ml. Great job!`;
      default: return 'Keep tracking your water intake for better insights.';
    }
  }

  getActivityNote(): string {
    const notes: any = {
      sedentary: 'Office work, minimal movement',
      light: 'Light walking, desk job with some movement',
      moderate: 'Regular exercise, active lifestyle',
      active: 'Daily workouts, high activity level',
      very_active: 'Intense training, athletic lifestyle'
    };
    return notes[this.activityLevel] || '';
  }

  getContextualSuggestions(): any[] {
    const suggestions = [];

    if (this.waterDeficit > 500) {
      suggestions.push({
        amount: 500,
        icon: '🚨',
        label: '500ml Critical',
        reason: 'You\'re significantly dehydrated'
      });
    } else if (this.waterDeficit > 250) {
      suggestions.push({
        amount: 250,
        icon: '💧',
        label: '250ml Catch Up',
        reason: 'Get closer to your goal'
      });
    }

    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 10) {
      suggestions.push({
        amount: 250,
        icon: '🌅',
        label: '250ml Morning',
        reason: 'Start your day hydrated'
      });
    }

    return suggestions;
  }

  getAverageDaily(): number {
    // Calculate 7-day average
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentIntakes = this.waterIntakes.filter(intake =>
      new Date(intake.date) >= sevenDaysAgo
    );

    const dailyTotals = new Map();
    recentIntakes.forEach(intake => {
      const day = intake.date.split('T')[0];
      dailyTotals.set(day, (dailyTotals.get(day) || 0) + intake.amount);
    });

    const values = Array.from(dailyTotals.values());
    return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  }

  getTodayGlasses(): number {
    return Math.round(this.todayTotal / 250);
  }

  getStreakDays(): number {
    // Simple streak calculation
    return Math.floor(Math.random() * 10) + 1; // Placeholder
  }

  getHydrationScore(): number {
    const percent = this.getProgressPercent();
    if (percent >= 100) return 100;
    if (percent >= 80) return Math.round(80 + (percent - 80));
    if (percent >= 60) return Math.round(60 + (percent - 60));
    return Math.round(percent * 0.6);
  }

  getConsistencyRating(): string {
    // Placeholder consistency rating
    return ['Excellent', 'Good', 'Fair'][Math.floor(Math.random() * 3)];
  }

  getConsistencyColor(): string {
    const rating = this.drinkingPatterns?.consistency;
    if (rating === 'Excellent') return '#4caf50';
    if (rating === 'Good') return '#ff9800';
    return '#f44336';
  }

  isRecent(dateString: string): boolean {
    const intakeTime = new Date(dateString).getTime();
    const now = new Date().getTime();
    return (now - intakeTime) < (2 * 60 * 60 * 1000); // Last 2 hours
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getGlassEquivalent(amount: number): string {
    const glasses = Math.round(amount / 250 * 10) / 10;
    return `${glasses} glass${glasses !== 1 ? 'es' : ''}`;
  }

  loadMoreHistory(): void {
    // Implement pagination if needed
    console.log('Loading more history...');
  }

  getPersonalizedTips(): any[] {
    return [
      {
        icon: '⏰',
        title: 'Morning Kickstart',
        content: 'Drink a glass of water immediately after waking up to jumpstart your metabolism.'
      },
      {
        icon: '🍋',
        title: 'Flavor Enhancement',
        content: 'Add lemon, cucumber, or mint to make water more appealing and increase intake.'
      },
      {
        icon: '📱',
        title: 'Smart Reminders',
        content: 'Set hourly reminders to maintain consistent hydration throughout the day.'
      }
    ];
  }

  showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Implement proper toast notifications
  }

  addWaterIntake(amount: number): void {
    const intake = {
      amount: amount,
      date: new Date().toISOString(),
      timestamp: Date.now()
    };

    this.waterService.addWaterIntake(intake).subscribe({
      next: (newIntake) => {
        this.waterIntakes.unshift(newIntake);
        this.calculateTotalIntake();
        this.showSuccessMessage(`Added ${amount}ml of water!`);
      },
      error: (error) => {
        console.error('Error adding water intake:', error);
        this.showErrorMessage('Failed to add water intake. Please try again.');
      }
    });
  }

  private showSuccessMessage(message: string): void {
    console.log('Success:', message);
  }

  private showErrorMessage(message: string): void {
    console.error('Error:', message);
  }
}
