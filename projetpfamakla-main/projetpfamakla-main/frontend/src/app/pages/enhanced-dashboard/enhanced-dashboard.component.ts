import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EnhancedAiService, QuickAnalysis, DiabeticAlert } from '../../services/enhanced-ai.service';
import { MealService } from '../../services/meal.service';
import { WaterService } from '../../services/water.service';
import { AuthService } from '../../services/auth.service';
import { GoalsSyncService } from '../../services/goals-sync.service';
import { Subscription } from 'rxjs';

import { AiService } from '../../services/ai.service';

@Component({
  selector: 'app-enhanced-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './enhanced-dashboard.component.html',
  styleUrls: ['./enhanced-dashboard.component.css']
})
export class EnhancedDashboardComponent implements OnInit, OnDestroy {
  // User settings
  isDiabetic = false;
  username = '';
  currentDate = new Date();

  // Real-time stats
  healthScore = 70;
  todayCalories = 0;
  todayCarbs = 0;
  todayProtein = 0;
  todayWater = 0;
  mealsCount = 0;
  todayMeals: any[] = [];

  // Goals
  caloriesGoal = 2000;
  carbsGoal = 130; // Standard for diabetics
  waterGoal = 2500;
  proteinGoal = 50;

  // AI Insights
  quickInsight: QuickAnalysis | null = null;
  alerts: DiabeticAlert[] = [];
  aiLoading = false;

  // UI State
  showQuickAddMeal = false;
  quickMealInput = '';
  quickMealProcessing = false;

  // Subscriptions
  private subscriptions: Subscription[] = [];
  private autoRefreshInterval: any;

  constructor(
    private enhancedAi: EnhancedAiService,
    private mealService: MealService,
    private waterService: WaterService,
    private authService: AuthService,
    private goalsSyncService: GoalsSyncService,
    private aiService: AiService,
    private router: Router // Inject Router
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadTodayData();
    this.startAutoRefresh();

    // Subscribe to Goals Sync
    this.subscriptions.push(
      this.goalsSyncService.goals$.subscribe(goals => {
        if (goals) {
          this.caloriesGoal = goals.calories;
          this.carbsGoal = goals.carbs;
          this.waterGoal = goals.water;
          this.proteinGoal = goals.protein;
        }
      })
    );

    // Subscribe to AI alerts
    this.subscriptions.push(
      this.enhancedAi.alerts$.subscribe(alerts => { // check
        this.alerts = alerts;
      })
    );

    // Subscribe to health score updates
    this.subscriptions.push(
      this.enhancedAi.healthScore$.subscribe(score => {
        this.healthScore = score;
      })
    );

    // Subscribe to direct AI Dashboard Events (from Chat)
    this.subscriptions.push(
      this.aiService.dashboardUpdate.subscribe(event => {
        console.log('Dashboard received AI event:', event);
        switch (event.type) {
          case 'ADD_MEAL':
            // Directly add the meal to the frontend meals list
            if (event.data) {
              this.mealService.createMeal(event.data).subscribe(
                () => {
                  this.showNotification(`🤖 AI added meal: ${event.data.name}`, 'success');
                  this.loadTodayData(); // Refresh to update totals
                  this.router.navigate(['/meals']); // Navigate to meals page
                },
                (error) => {
                  console.error('Failed to add meal from AI:', error);
                  this.showNotification('❌ Failed to add meal from AI', 'error');
                }
              );
            }
            break;
          case 'ADD_WATER':
            this.showNotification(`🤖 AI added water`, 'success');
            this.loadTodayData();
            break;
          case 'UPDATE_GOALS':
            this.showNotification('🤖 Goals updated by AI', 'success');
            // GoalsSyncService should handle the actual data update via its own subscription
            break;
          case 'REFRESH_DATA':
            this.loadTodayData();
            break;
          case 'SHOW_MEAL_PREVIEW':
            // Do NOT auto-log the meal here to avoid loops. Instead, show a quick-add preview
            // so the user can confirm logging. Populate quick input with suggested meal name.
            try {
              const meal = event.data;
              if (meal && meal.name) {
                this.quickMealInput = meal.name + (meal.calories ? ` (${meal.calories} cal)` : '');
                this.showQuickAddMeal = true;
                this.showNotification(`🤖 AI suggests: ${meal.name}. Confirm to log it.`);
              } else {
                this.showNotification('🤖 AI provided a meal preview.', 'info');
              }
            } catch (e) {
              console.warn('Error handling SHOW_MEAL_PREVIEW', e);
            }
            break;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }

  loadUserProfile(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.username = user.username || 'User';
        // Load user preferences from localStorage
        const prefs = localStorage.getItem('userPreferences');
        if (prefs) {
          const data = JSON.parse(prefs);
          this.isDiabetic = data.isDiabetic || false;
          this.caloriesGoal = data.caloriesGoal || 2000;
          this.carbsGoal = data.carbsGoal || 130;
          this.waterGoal = data.waterGoal || 2500;
        }
      }
    });
  }

  loadTodayData(): void {
    const today = new Date().toISOString().split('T')[0];

    // Subscribe to Meals (Reactive)
    this.mealService.getTodayMeals().subscribe(); // Initial fetch to populate subject
    this.subscriptions.push(
      this.mealService.meals$.subscribe(meals => {
        const todayMeals = meals.filter(m =>
          m.date?.startsWith(today) || (m as any).dateConsumed?.startsWith(today)
        );

        this.mealsCount = todayMeals.length;
        this.todayCalories = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
        this.todayCarbs = todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0);
        this.todayProtein = todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
        this.todayMeals = todayMeals;

        // Get AI insights dynamically when data changes
        if (this.mealsCount > 0) {
          this.getQuickAiInsights();
        }

        if (this.isDiabetic) {
          this.monitorDiabeticStatus();
        }
      })
    );

    // Subscribe to Water (Reactive)
    this.waterService.getTodayIntake().subscribe(); // Initial fetch
    this.subscriptions.push(
      this.waterService.waterIntakes$.subscribe(logs => {
        const todayLogs = logs.filter(l => l.date?.startsWith(today));
        this.todayWater = todayLogs.reduce((sum, l) => sum + (l.amount || 0), 0);
      })
    );
  }

  getQuickAiInsights(): void {
    this.aiLoading = true;

    const userData = {
      calories: this.todayCalories,
      carbs: this.todayCarbs,
      protein: this.todayProtein,
      water: this.todayWater,
      meals: this.mealsCount
    };

    this.enhancedAi.quickAnalyze(userData, this.isDiabetic).subscribe(
      result => {
        this.quickInsight = result;
        this.aiLoading = false;
      },
      error => {
        console.error('Quick AI analysis failed:', error);
        this.aiLoading = false;
      }
    );
  }

  monitorDiabeticStatus(): void {
    const todayData = {
      carbs: this.todayCarbs,
      meals: this.mealsCount
    };

    this.enhancedAi.diabeticMonitor(todayData, this.todayCarbs, 0).subscribe(
      result => {
        // Alerts are automatically updated via subscription
        console.log('Diabetic monitoring active:', result);
      }
    );
  }

  startAutoRefresh(): void {
    // Refresh data every 30 seconds
    this.autoRefreshInterval = setInterval(() => {
      this.loadTodayData();
    }, 30000);
  }

  // Quick Actions
  quickAddWater(): void {
    this.waterService.addWaterIntake({ amount: 250, date: new Date().toISOString() }).subscribe(
      () => {
        this.todayWater += 250;
        this.showNotification('💧 Added 250ml water!');
      },
      (_error: any) => {
        this.showNotification('❌ Failed to add water', 'error');
      }
    );
  }

  toggleQuickAddMeal(): void {
    this.showQuickAddMeal = !this.showQuickAddMeal;
  }

  quickAddMeal(): void {
    if (!this.quickMealInput.trim()) return;

    this.quickMealProcessing = true;

    this.enhancedAi.smartMealLog(this.quickMealInput, this.isDiabetic).subscribe(
      result => {
        // Add the meal with AI-estimated nutrition
        const mealData: any = {
          name: result.name,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fats: result.fats,
          date: new Date().toISOString()
        };

        this.mealService.createMeal(mealData).subscribe(
          () => {
            this.showNotification(`✅ Logged: ${result.name} (${result.calories} cal)`);
            this.quickMealInput = '';
            this.showQuickAddMeal = false;
            this.loadTodayData(); // Refresh

            // Navigate to meals page
            this.router.navigate(['/meals']);

            // Show warning for diabetics if needed
            if (this.isDiabetic && result.diabeticWarning) {
              this.showNotification(`⚠️ ${result.diabeticWarning}`, 'warning');
            }
          },
          (_error: any) => {
            this.showNotification('❌ Failed to log meal', 'error');
          }
        ).add(() => {
          this.quickMealProcessing = false;
        });
      },
      (_error: any) => {
        this.quickMealProcessing = false;
        this.showNotification('❌ AI meal analysis failed', 'error');
      }
    );
  }

  dismissAlert(alert: DiabeticAlert): void {
    this.enhancedAi.dismissAlert(alert);
  }

  getDiabeticMeals(): void {
    const remaining = Math.max(0, this.carbsGoal - this.todayCarbs);
    this.enhancedAi.getDiabeticMeals(remaining).subscribe(
      result => {
        console.log('Diabetic meal suggestions:', result);
        // You can show these in a modal or navigate to meal suggestions page
      }
    );
  }

  // Utility methods
  getProgressPercent(current: number, goal: number): number {
    return Math.min(100, Math.round((current / goal) * 100));
  }

  getProgressColor(percent: number): string {
    if (percent < 50) return '#ff6b6b';
    if (percent < 80) return '#ffd93d';
    return '#6bcf7f';
  }

  getCarbsStatus(): string {
    const percent = (this.todayCarbs / this.carbsGoal) * 100;
    if (percent > 100) return 'danger';
    if (percent > 80) return 'warning';
    return 'good';
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  showNotification(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success'): void {
    // Simple notification - you can enhance this with a proper notification service
    console.log(`[${type.toUpperCase()}] ${message}`);
    // TODO: Implement toast notification UI
  }

  logout(): void {
    this.authService.logout();
  }
}
