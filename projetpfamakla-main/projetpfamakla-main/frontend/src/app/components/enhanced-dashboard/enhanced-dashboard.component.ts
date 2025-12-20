import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AiService, DashboardUpdate } from '../../services/ai.service';
import { MealService } from '../../services/meal.service';
import { WaterService } from '../../services/water.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-enhanced-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="enhanced-dashboard">
      <!-- Main Stats Display -->
      <div class="stats-grid">
        <div class="stat-card calories" [class.updated]="recentlyUpdated.calories">
          <div class="stat-icon">🔥</div>
          <div class="stat-content">
            <div class="stat-value">{{ totalCalories }}</div>
            <div class="stat-label">calories</div>
          </div>
        </div>

        <div class="stat-card carbs" [class.updated]="recentlyUpdated.carbs">
          <div class="stat-icon">🍞</div>
          <div class="stat-content">
            <div class="stat-value">{{ totalCarbs }}</div>
            <div class="stat-label">carbs</div>
          </div>
        </div>

        <div class="stat-card protein" [class.updated]="recentlyUpdated.protein">
          <div class="stat-icon">💪</div>
          <div class="stat-content">
            <div class="stat-value">{{ totalProtein }}</div>
            <div class="stat-label">protein</div>
          </div>
        </div>

        <div class="stat-card water" [class.updated]="recentlyUpdated.water">
          <div class="stat-icon">💧</div>
          <div class="stat-content">
            <div class="stat-value">{{ totalWater }}</div>
            <div class="stat-label">ml</div>
          </div>
        </div>
      </div>

      <!-- Health Score Display -->
      <div class="health-score-section" *ngIf="healthScore !== null">
        <div class="score-circle" [ngClass]="getScoreClass(healthScore)">
          <div class="score-value">{{ healthScore }}</div>
          <div class="score-label">Health Score</div>
        </div>
      </div>

      <!-- AI Insights Panel -->
      <div class="ai-insights" *ngIf="aiInsights.length > 0">
        <h3>🤖 AI Insights</h3>
        <div class="insights-list">
          <div class="insight-item" *ngFor="let insight of aiInsights" 
               @slideIn>
            {{ insight }}
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity" *ngIf="recentActivity.length > 0">
        <h3>📈 Recent Activity</h3>
        <div class="activity-list">
          <div class="activity-item" *ngFor="let activity of recentActivity" 
               @slideIn>
            <div class="activity-icon">{{ activity.icon }}</div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-time">{{ activity.time }}</div>
            </div>
            <div class="activity-value">{{ activity.value }}</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="action-btn log-meal" (click)="showMealLogger()">
          🍽️ Log Meal
        </button>
        <button class="action-btn add-water" (click)="addWater()">
          💧 Add Water
        </button>
        <button class="action-btn get-report" (click)="generateReport()">
          📊 Get Report
        </button>
        <button class="action-btn meal-plan" (click)="showMealPlan()">
          🎯 Meal Plan
        </button>
        <button class="action-btn health-check" (click)="runHealthCheck()">
          🩺 Health Check
        </button>
      </div>
    </div>
  `,
  styles: [`
    .enhanced-dashboard {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .stat-card.updated {
      transform: scale(1.05);
      box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
      border: 2px solid #4CAF50;
    }

    .stat-card.updated::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #4CAF50, #81C784);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .stat-icon {
      font-size: 2rem;
      opacity: 0.8;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: bold;
      color: #2c3e50;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #7f8c8d;
      margin-top: 0.25rem;
    }

    .calories { border-left: 4px solid #ff6b35; }
    .carbs { border-left: 4px solid #f7931e; }
    .protein { border-left: 4px solid #4ecdc4; }
    .water { border-left: 4px solid #45b7d1; }

    .health-score-section {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    }

    .score-circle.excellent { background: linear-gradient(135deg, #4CAF50, #81C784); }
    .score-circle.good { background: linear-gradient(135deg, #FF9800, #FFB74D); }
    .score-circle.fair { background: linear-gradient(135deg, #FF5722, #FF8A65); }
    .score-circle.poor { background: linear-gradient(135deg, #F44336, #EF5350); }

    .score-value {
      font-size: 2rem;
      line-height: 1;
    }

    .score-label {
      font-size: 0.8rem;
      opacity: 0.9;
      margin-top: 0.25rem;
    }

    .ai-insights, .recent-activity {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .ai-insights h3, .recent-activity h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-size: 1.2rem;
    }

    .insights-list, .activity-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .insight-item, .activity-item {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      border-left: 3px solid #4CAF50;
      animation: slideIn 0.3s ease-out;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      border-left-color: #2196F3;
    }

    .activity-icon {
      font-size: 1.5rem;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      font-weight: 600;
      color: #2c3e50;
    }

    .activity-time {
      font-size: 0.85rem;
      color: #7f8c8d;
    }

    .activity-value {
      font-weight: bold;
      color: #2196F3;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 1rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .action-btn.log-meal { border-color: #4CAF50; color: #4CAF50; }
    .action-btn.log-meal:hover { background: #4CAF50; color: white; }

    .action-btn.add-water { border-color: #2196F3; color: #2196F3; }
    .action-btn.add-water:hover { background: #2196F3; color: white; }

    .action-btn.get-report { border-color: #FF9800; color: #FF9800; }
    .action-btn.get-report:hover { background: #FF9800; color: white; }

    .action-btn.meal-plan { border-color: #9C27B0; color: #9C27B0; }
    .action-btn.meal-plan:hover { background: #9C27B0; color: white; }

    .action-btn.health-check { border-color: #F44336; color: #F44336; }
    .action-btn.health-check:hover { background: #F44336; color: white; }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .quick-actions {
        grid-template-columns: 1fr;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class EnhancedDashboardComponent implements OnInit, OnDestroy {
  // Dashboard data
  totalCalories = 0;
  totalCarbs = 0;
  totalProtein = 0;
  totalWater = 0;
  healthScore: number | null = null;

  // AI insights and activity
  aiInsights: string[] = [];
  recentActivity: any[] = [];

  // Animation states
  recentlyUpdated = {
    calories: false,
    carbs: false,
    protein: false,
    water: false
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private aiService: AiService,
    private mealService: MealService,
    private waterService: WaterService
  ) {}

  ngOnInit() {
    this.loadInitialData();
    this.subscribeToAiUpdates();
    this.subscribeToAnalysis();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadInitialData() {
    // Load meals data
    this.mealService.getAllMeals().subscribe({
      next: (meals) => {
        this.totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
        this.totalCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
        this.totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
      },
      error: (err) => console.warn('Could not load meals:', err)
    });

    // Load water data
    this.waterService.getAllWaterIntakes().subscribe({
      next: (water) => {
        this.totalWater = water.reduce((sum, w) => sum + (w.amount || 0), 0);
      },
      error: (err) => console.warn('Could not load water:', err)
    });
  }

  private subscribeToAiUpdates() {
    // Subscribe to AI service dashboard updates
    this.subscriptions.push(
      this.aiService.dashboardUpdate.subscribe((update: DashboardUpdate) => {
        this.handleDashboardUpdate(update);
      })
    );
  }

  private subscribeToAnalysis() {
    // Subscribe to AI analysis updates
    this.subscriptions.push(
      this.aiService.analysis$.subscribe(analysis => {
        if (analysis) {
          this.healthScore = analysis.healthScore || null;
          if (analysis.insights) {
            this.aiInsights = analysis.insights;
          }
        }
      })
    );
  }

  private handleDashboardUpdate(update: DashboardUpdate) {
    switch (update.type) {
      case 'ADD_MEAL':
        this.handleMealUpdate(update.data);
        break;
      case 'ADD_WATER':
        this.handleWaterUpdate(update.data);
        break;
      case 'UPDATE_INSIGHTS':
        this.handleInsightsUpdate(update.data);
        break;
      case 'REFRESH_DATA':
        this.loadInitialData();
        break;
      default:
        console.log('Unknown dashboard update:', update);
    }
  }

  private handleMealUpdate(mealData: any) {
    // Update totals with animation
    this.totalCalories += mealData.calories || 0;
    this.totalCarbs += mealData.carbs || 0;
    this.totalProtein += mealData.protein || 0;

    // Trigger animations
    if (mealData.calories) this.animateUpdate('calories');
    if (mealData.carbs) this.animateUpdate('carbs');
    if (mealData.protein) this.animateUpdate('protein');

    // Add to recent activity
    this.addActivity({
      icon: '🍽️',
      title: `Added: ${mealData.name}`,
      time: this.formatTime(new Date()),
      value: `${mealData.calories || 0} cal`
    });

    console.log('Dashboard updated with meal:', mealData);
  }

  private handleWaterUpdate(waterData: any) {
    // Update water total with animation
    this.totalWater += waterData.amount || 0;
    this.animateUpdate('water');

    // Add to recent activity
    this.addActivity({
      icon: '💧',
      title: 'Added water',
      time: this.formatTime(new Date()),
      value: `${waterData.amount || 0} ml`
    });

    console.log('Dashboard updated with water:', waterData);
  }

  private handleInsightsUpdate(data: any) {
    if (data.insights) {
      this.aiInsights = [...data.insights];
      console.log('AI insights updated:', this.aiInsights);
    }
  }

  private animateUpdate(type: keyof typeof this.recentlyUpdated) {
    this.recentlyUpdated[type] = true;

    // Reset animation after 3 seconds
    setTimeout(() => {
      this.recentlyUpdated[type] = false;
    }, 3000);
  }

  private addActivity(activity: any) {
    this.recentActivity.unshift(activity);

    // Keep only last 5 activities
    if (this.recentActivity.length > 5) {
      this.recentActivity = this.recentActivity.slice(0, 5);
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  // Quick action methods
  showMealLogger() {
    console.log('Navigate to meal logger');
    // Navigation logic here
  }

  addWater() {
    // Quick add 250ml water
    this.waterService.addWaterIntake({
      amount: 250,
      date: new Date().toISOString()
    }).subscribe({
      next: () => {
        this.handleWaterUpdate({ amount: 250 });
      },
      error: (err) => console.error('Failed to add water:', err)
    });
  }

  generateReport() {
    // Trigger AI report generation
    const userData = {
      totalCalories: this.totalCalories,
      totalCarbs: this.totalCarbs,
      totalProtein: this.totalProtein,
      totalWater: this.totalWater
    };

    this.aiService.generateDiagnostic(userData).subscribe({
      next: (report: any) => {
        console.log('Generated AI report:', report);
        // Handle report display
        if (report.insights) {
          this.aiInsights = [...report.insights];
        }
        if (report.healthScore) {
          this.healthScore = report.healthScore;
        }
      },
      error: (err: any) => console.error('Failed to generate report:', err)
    });
  }

  showMealPlan() {
    console.log('Navigate to meal plan');
    // Navigation logic here
  }

  runHealthCheck() {
    // Trigger AI health analysis
    const userData = {
      meals: [],
      water: [],
      totalCalories: this.totalCalories,
      totalCarbs: this.totalCarbs,
      totalProtein: this.totalProtein,
      totalWater: this.totalWater
    };

    this.aiService.analyzeAndAct(userData).subscribe({
      next: (analysis: any) => {
        console.log('Health check completed:', analysis);
        if (analysis.healthScore !== undefined) {
          this.healthScore = analysis.healthScore;
        }
        if (analysis.insights) {
          this.aiInsights = [...analysis.insights];
        }
      },
      error: (err: any) => console.error('Health check failed:', err)
    });
  }
}
