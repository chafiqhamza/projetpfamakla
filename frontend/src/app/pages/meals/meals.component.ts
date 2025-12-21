import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MealService } from '../../services/meal.service';
import { EnhancedAiService, DiabeticAlert } from '../../services/enhanced-ai.service';
import { AuthService } from '../../services/auth.service';
import { Meal } from '../../models/models';
import { Subscription } from 'rxjs';
import { GoalsSyncService } from '../../services/goals-sync.service';

interface WeeklyStats {
  avgCalories: number;
  mealsLogged: number;
}

interface Achievement {
  icon: string;
  text: string;
}

@Component({
  selector: 'app-meals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="meals-page">
      <div class="page-header">
        <h1>🍽️ Smart Meal Management</h1>
        <div class="header-actions">
          <button class="btn-ai-suggestions" (click)="getAiMealSuggestions()" [disabled]="aiLoading">
            <span *ngIf="!aiLoading">🤖 AI Meal Planner</span>
            <span *ngIf="aiLoading">⏳ AI Planning...</span>
          </button>
          <button class="btn-add-meal" (click)="showAddMeal = true">➕ Add Meal</button>
          <button class="btn-meal-analysis" (click)="toggleMealAnalytics()">📊 Analytics</button>
        </div>
      </div>

      <!-- AI Context Dashboard -->
      <div class="ai-context-dashboard">
        <div class="context-card calories">
          <div class="context-icon">🔥</div>
          <div class="context-data">
            <h4>Daily Calories</h4>
            <div class="progress-bar">
              <div class="progress-fill" [style.width]="getCaloriesPercent() + '%'"></div>
            </div>
            <span class="context-value">{{ todayCalories }} / {{ caloriesGoal }}</span>
          </div>
        </div>

        <div class="context-card protein">
          <div class="context-icon">💪</div>
          <div class="context-data">
            <h4>Protein</h4>
            <div class="progress-bar">
              <div class="progress-fill" [style.width]="getProteinPercent() + '%'"></div>
            </div>
            <span class="context-value">{{ todayProtein }}g / {{ proteinGoal }}g</span>
          </div>
        </div>

        <div class="context-card carbs" *ngIf="isDiabetic">
          <div class="context-icon">🌾</div>
          <div class="context-data">
            <h4>Net Carbs</h4>
            <div class="progress-bar" [class.warning]="getCarbsPercent() > 80" [class.danger]="getCarbsPercent() > 100">
              <div class="progress-fill" [style.width]="getCarbsPercent() + '%'"></div>
            </div>
            <span class="context-value">{{ todayNetCarbs }}g / {{ carbsGoal }}g</span>
          </div>
        </div>

        <div class="context-card health-score">
          <div class="context-icon">🎯</div>
          <div class="context-data">
            <h4>Health Score</h4>
            <div class="health-score-circle" [style.background]="getHealthScoreGradient()">
              <span class="score-value">{{ healthScore }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Active AI Alerts -->
      <div class="ai-alerts-section" *ngIf="alerts.length > 0">
        <h3>🚨 Smart Health Alerts</h3>
        <div class="alerts-grid">
          <div class="alert-card" *ngFor="let alert of alerts" [class]="alert.type">
            <div class="alert-header">
              <span class="alert-icon">{{ getAlertIcon(alert.type) }}</span>
              <strong>{{ alert.title }}</strong>
              <button class="alert-dismiss" (click)="dismissAlert(alert)">✕</button>
            </div>
            <p class="alert-message">{{ alert.message }}</p>
            <button class="alert-action" (click)="handleAlertAction(alert)" *ngIf="alert.action">
              {{ getAlertActionText(alert.action) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Smart Meal Entry Panel -->
      <div class="smart-meal-panel" *ngIf="showAddMeal">
        <div class="panel-header">
          <h3>🤖 AI-Powered Meal Logger</h3>
          <button class="close-btn" (click)="closeAddMeal()">✕</button>
        </div>

        <!-- Manual Entry Form -->
        <div class="manual-entry-form" *ngIf="showManualEntry">
          <h4>📝 Manual Meal Entry</h4>
          <form (ngSubmit)="saveMeal()">
            <div class="form-row">
              <div class="form-group">
                <label>Meal Name *</label>
                <input type="text" [(ngModel)]="currentMeal.name" name="name" required 
                       placeholder="e.g., Grilled Salmon with Quinoa">
              </div>
              <div class="form-group">
                <label>Meal Type</label>
                <select [(ngModel)]="currentMeal.type" name="type">
                  <option value="breakfast">🌅 Breakfast</option>
                  <option value="lunch">☀️ Lunch</option>
                  <option value="dinner">🌙 Dinner</option>
                  <option value="snack">🥨 Snack</option>
                </select>
              </div>
            </div>

            <div class="nutrition-inputs">
              <div class="input-group">
                <label>Calories *</label>
                <input type="number" [(ngModel)]="currentMeal.calories" name="calories" required min="0">
              </div>
              <div class="input-group">
                <label>Protein (g) *</label>
                <input type="number" [(ngModel)]="currentMeal.protein" name="protein" required min="0" step="0.1">
              </div>
              <div class="input-group">
                <label>Carbs (g) *</label>
                <input type="number" [(ngModel)]="currentMeal.carbohydrates" name="carbs" required min="0" step="0.1">
              </div>
              <div class="input-group">
                <label>Fats (g) *</label>
                <input type="number" [(ngModel)]="currentMeal.fats" name="fats" required min="0" step="0.1">
              </div>
              <div class="input-group">
                <label>Fiber (g)</label>
                <input type="number" [(ngModel)]="currentMeal.fiber" name="fiber" min="0" step="0.1">
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-save">💾 Save Meal</button>
              <button type="button" class="btn-cancel" (click)="cancelManualEntry()">❌ Cancel</button>
            </div>
          </form>
        </div>

        <div class="input-actions" *ngIf="!showManualEntry">
          <button class="btn-manual-entry" (click)="toggleManualEntry()">📝 Manual Entry</button>
        </div>
      </div>

      <!-- Today's Meals List -->
      <div class="todays-meals" *ngIf="!showAddMeal">
        <div class="meals-header">
          <h3>📅 Today's Meals</h3>
          <div class="meal-summary">
            <span class="summary-item">{{ todayMeals.length }} meals</span>
            <span class="summary-item">{{ todayCalories }} calories</span>
            <span class="summary-item" *ngIf="isDiabetic">{{ todayNetCarbs }}g net carbs</span>
          </div>
        </div>

        <div class="meals-timeline" *ngIf="todayMeals.length > 0">
          <div class="meal-item" *ngFor="let meal of todayMeals; trackBy: trackMeal" 
               [class]="getMealClass(meal)">
            
            <div class="meal-time">
              <span class="time">{{ formatMealTime(meal.createdAt || '') }}</span>
              <span class="meal-type">{{ getMealTypeIcon(meal.type || '') }} {{ meal.type || 'General' }}</span>
            </div>

            <div class="meal-content">
              <h4 class="meal-name">{{ meal.name }}</h4>
              
              <div class="meal-nutrition">
                <div class="nutrition-badges">
                  <span class="nutrition-badge calories">🔥 {{ meal.calories }}kcal</span>
                  <span class="nutrition-badge protein">💪 {{ meal.protein }}g</span>
                  <span class="nutrition-badge carbs" [class.highlighted]="isDiabetic">
                    🌾 {{ meal.carbohydrates }}g{{ meal.fiber ? ' (' + ((meal.carbohydrates || 0) - (meal.fiber || 0)) + 'g net)' : '' }}
                  </span>
                  <span class="nutrition-badge fats">🥑 {{ meal.fats }}g</span>
                </div>
              </div>

              <div class="meal-actions">
                <button class="action-btn edit" (click)="editMeal(meal)" title="Edit meal">
                  ✏️
                </button>
                <button class="action-btn duplicate" (click)="duplicateMeal(meal)" title="Duplicate meal">
                  📋
                </button>
                <button class="action-btn delete" (click)="deleteMeal(meal.id!)" title="Delete meal">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="no-meals" *ngIf="todayMeals.length === 0">
          <div class="empty-state">
            <span class="empty-icon">🍽️</span>
            <h3>No meals logged today</h3>
            <p>Start tracking your nutrition by adding your first meal!</p>
            <button class="btn-add-first-meal" (click)="showAddMeal = true">
              ➕ Add Your First Meal
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .meals-page {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .page-header h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 2.5rem;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .header-actions button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-ai-suggestions {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-add-meal {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .btn-meal-analysis {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      color: white;
    }

    .ai-context-dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .context-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .context-icon {
      font-size: 2rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(0, 123, 255, 0.1);
    }

    .context-data h4 {
      margin: 0 0 10px 0;
      color: #2c3e50;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
      margin: 8px 0;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-bar.warning .progress-fill {
      background: linear-gradient(90deg, #ffa726 0%, #ff9800 100%);
    }

    .progress-bar.danger .progress-fill {
      background: linear-gradient(90deg, #ef5350 0%, #f44336 100%);
    }

    .context-value {
      font-weight: 600;
      color: #2c3e50;
    }

    .health-score-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }

    .ai-alerts-section {
      margin-bottom: 30px;
    }

    .alerts-grid {
      display: grid;
      gap: 15px;
    }

    .alert-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #ffa726;
    }

    .alert-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .alert-dismiss {
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
      font-size: 1.2rem;
    }

    .smart-meal-panel {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.5rem;
      color: #999;
    }

    .manual-entry-form {
      max-width: 800px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      margin-bottom: 5px;
      font-weight: 600;
      color: #2c3e50;
    }

    .form-group input,
    .form-group select {
      padding: 12px;
      border: 2px solid #ecf0f1;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #4facfe;
    }

    .nutrition-inputs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 25px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
    }

    .input-group label {
      margin-bottom: 5px;
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.9rem;
    }

    .input-group input {
      padding: 10px;
      border: 2px solid #ecf0f1;
      border-radius: 6px;
      font-size: 0.95rem;
    }

    .form-actions {
      display: flex;
      gap: 15px;
      justify-content: flex-end;
    }

    .btn-save {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-cancel {
      background: #ecf0f1;
      color: #2c3e50;
      border: none;
      padding: 12px 30px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .input-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      padding: 20px;
    }

    .btn-manual-entry {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .todays-meals {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .meals-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .meal-summary {
      display: flex;
      gap: 20px;
      font-weight: 600;
      color: #666;
    }

    .meals-timeline {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .meal-item {
      border: 2px solid #ecf0f1;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.3s ease;
    }

    .meal-item:hover {
      border-color: #4facfe;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(79, 172, 254, 0.15);
    }

    .meal-time {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      color: #666;
      font-size: 0.9rem;
    }

    .meal-content h4 {
      margin: 0 0 15px 0;
      color: #2c3e50;
      font-size: 1.3rem;
    }

    .nutrition-badges {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 15px;
    }

    .nutrition-badge {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 20px;
      padding: 5px 12px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .nutrition-badge.highlighted {
      background: #fff3cd;
      border-color: #ffc107;
      color: #856404;
    }

    .meal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .action-btn {
      background: none;
      border: 2px solid #ecf0f1;
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      border-color: #4facfe;
      background: rgba(79, 172, 254, 0.1);
    }

    .no-meals {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-state {
      max-width: 400px;
      margin: 0 auto;
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 25px;
    }

    .btn-add-first-meal {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1.1rem;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: center;
      }

      .ai-context-dashboard {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .nutrition-inputs {
        grid-template-columns: repeat(2, 1fr);
      }

      .meal-summary {
        flex-direction: column;
        gap: 5px;
      }
    }
  `]
})
export class MealsComponent implements OnInit, OnDestroy {
  // Component state
  showAddMeal = false;
  showManualEntry = false;
  showAnalytics = false;
  aiLoading = false;
  isDiabetic = false;
  // Prevent duplicate/subsequent save calls (guard against infinite logging loops)
  saving = false;

  // Current meal being edited
  currentMeal: Partial<Meal> = {
    name: '',
    type: 'lunch',
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fats: 0,
    fiber: 0
  };

  // Meal data
  meals: Meal[] = [];
  todayMeals: Meal[] = [];

  // AI and analytics data
  alerts: DiabeticAlert[] = [];

  // Goals and tracking
  caloriesGoal = 2000;
  proteinGoal = 150;
  carbsGoal = 50;
  todayCalories = 0;
  todayProtein = 0;
  todayNetCarbs = 0;
  healthScore = 85;

  // Analytics data
  weeklyStats: WeeklyStats = { avgCalories: 0, mealsLogged: 0 };
  recentAchievements: Achievement[] = [];

  // UI state
  activeTab = 'overview';
  suggestionFilter = 'all';

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private mealService: MealService,
    private aiService: EnhancedAiService,
    private authService: AuthService,
    private goalsService: GoalsSyncService
  ) { }

  ngOnInit(): void {
    this.loadMeals();
    this.loadUserPreferences();
    this.initializeAnalytics();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Lifecycle methods
  private loadMeals(): void {
    // Subscribe to reactive meals stream
    const mealSub = this.mealService.meals$.subscribe({
      next: (meals: Meal[]) => {
        this.meals = meals;
        this.updateTodayMeals();
        this.calculateDailyTotals();
      }
    });
    this.subscriptions.push(mealSub);

    // Initial load - prefer today's meals for faster load, or all if needed
    this.mealService.refreshTodayMeals();

    // Subscribe to reactive goals
    const goalSub = this.goalsService.goals$.subscribe(goals => {
      this.caloriesGoal = goals.calories;
      this.proteinGoal = goals.protein;
      this.carbsGoal = goals.carbs;
      // Recalculate stats with new goals is automatic via UI binding, but if derived data exists:
      this.calculateDailyTotals();
    });
    this.subscriptions.push(goalSub);

    // Subscribe to health score
    const healthSub = this.aiService.healthScore$.subscribe(score => {
      if (score) this.healthScore = score;
    });
    this.subscriptions.push(healthSub);
  }

  private loadUserPreferences(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      // Load user-specific settings
      this.isDiabetic = false; // Set based on user profile
    }
  }

  private initializeAnalytics(): void {
    this.generateMockAnalytics();
  }

  // Main functionality methods
  saveMeal(): void {
    // Prevent re-entrancy: if a save is already in progress, ignore subsequent clicks
    if (this.saving) return;

    this.saving = true;

    if (!this.currentMeal.name?.trim()) {
      this.showErrorMessage('Please provide a meal name.');
      this.saving = false;
      return;
    }

    const meal: Meal = {
      id: this.currentMeal.id,
      name: this.currentMeal.name,
      type: this.currentMeal.type || 'lunch',
      calories: this.currentMeal.calories || 0,
      protein: this.currentMeal.protein || 0,
      carbohydrates: this.currentMeal.carbohydrates || 0,
      fats: this.currentMeal.fats || 0,
      fiber: this.currentMeal.fiber || 0,
      createdAt: new Date().toISOString(),
      description: '',
      mealTime: this.currentMeal.type || 'lunch',
      foods: [],
      totalCalories: this.currentMeal.calories || 0,
      carbs: this.currentMeal.carbohydrates || 0,
      date: new Date().toISOString().split('T')[0]
    };

    const sub = this.mealService.createMeal(meal).subscribe({
      next: (savedMeal) => {
        // Ensure we don't trigger duplicate local insert if reactive stream already emits
        try {
          // If backend returns the saved meal with an id, insert it locally only if not present
          if (savedMeal && (savedMeal as any).id) {
            const exists = this.meals.some(m => m.id === (savedMeal as any).id);
            if (!exists) {
              // add saved meal to local collection to reflect immediately in UI
              this.meals = [savedMeal as Meal, ...this.meals];
            }
          }
        } catch (e) {
          // ignore insertion errors — reactive stream should keep the UI consistent
          console.warn('Could not upsert saved meal locally:', e);
        }

        // Recalculate derived values and reset UI
        this.updateTodayMeals();
        this.calculateDailyTotals();
        this.resetMealForm();
        this.closeAddMeal();
        this.showSuccessMessage(`✅ Meal saved: ${meal.name}`);
        this.saving = false;
      },
      error: (error) => {
        console.error('Error saving meal:', error);
        this.showErrorMessage('❌ Failed to save meal');
        this.saving = false;
      }
    });
    this.subscriptions.push(sub);
  }

  deleteMeal(mealId: number): void {
    if (confirm('Are you sure you want to delete this meal?')) {
      const sub = this.mealService.deleteMeal(mealId).subscribe({
        next: () => {
          this.meals = this.meals.filter(m => m.id !== mealId);
          this.updateTodayMeals();
          this.calculateDailyTotals();
          this.showSuccessMessage('Meal deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting meal:', error);
          this.showErrorMessage('Failed to delete meal. Please try again.');
        }
      });
      this.subscriptions.push(sub);
    }
  }

  // UI event handlers
  closeAddMeal(): void {
    this.showAddMeal = false;
    this.showManualEntry = false;
    this.resetMealForm();
  }

  toggleManualEntry(): void {
    this.showManualEntry = !this.showManualEntry;
  }

  cancelManualEntry(): void {
    this.showManualEntry = false;
    this.resetMealForm();
  }

  toggleMealAnalytics(): void {
    this.showAnalytics = !this.showAnalytics;
  }

  // Calculation methods
  getCaloriesPercent(): number {
    return Math.min((this.todayCalories / this.caloriesGoal) * 100, 100);
  }

  getProteinPercent(): number {
    return Math.min((this.todayProtein / this.proteinGoal) * 100, 100);
  }

  getCarbsPercent(): number {
    return Math.min((this.todayNetCarbs / this.carbsGoal) * 100, 100);
  }

  getHealthScoreGradient(): string {
    if (this.healthScore >= 80) return 'linear-gradient(135deg, #4caf50, #45a049)';
    if (this.healthScore >= 60) return 'linear-gradient(135deg, #ff9800, #f57c00)';
    return 'linear-gradient(135deg, #f44336, #d32f2f)';
  }

  // Utility methods
  trackMeal(index: number, meal: Meal): number {
    // If meal has an id, use it; otherwise fall back to the index to avoid ngFor tracking issues
    return meal.id ?? index;
  }

  getMealClass(meal: Meal): string {
    const classes = [];
    if (this.isDiabetic && (meal.carbohydrates || 0) > 30) {
      classes.push('high-carb');
    }
    return classes.join(' ');
  }

  formatMealTime(createdAt: string): string {
    if (!createdAt) return '';
    // createdAt may be a full ISO datetime or a date-only string (YYYY-MM-DD).
    // new Date(...) handles both, but for date-only it will result in 00:00 time; still return a readable string.
    try {
      const d = new Date(createdAt);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  getMealTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🥨'
    };
    return icons[type] || '🍽️';
  }

  getAlertIcon(type: string): string {
    const icons: { [key: string]: string } = {
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅',
      error: '❌'
    };
    return icons[type] || 'ℹ️';
  }

  getAlertActionText(action: string): string {
    return action || 'Take Action';
  }

  // Missing methods that are referenced in the template
  getAiMealSuggestions(): void {
    this.aiLoading = true;
    // Call the AI service to get an estimated meal from a description / context
    const description = 'Suggested meal based on recent activity';
    const sub = this.aiService.smartMealLog(description, this.isDiabetic).subscribe({
      next: (estimate) => {
        this.aiLoading = false;
        // Map SmartMealLog to frontend Meal and persist it
        const meal: Meal = {
          name: estimate.name || description,
          description: '',
          mealTime: 'lunch',
          type: 'lunch',
          foods: [],
          calories: estimate.calories || 0,
          totalCalories: estimate.calories || 0,
          protein: estimate.protein || 0,
          carbohydrates: estimate.carbs || 0,
          carbs: estimate.carbs || 0,
          fats: estimate.fats || 0,
          fiber: estimate.fiber || 0,
          createdAt: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          aiGenerated: true
        } as Meal;

        const createSub = this.mealService.createMeal(meal).subscribe({
          next: () => {
            this.showSuccessMessage('AI suggested meal added');
          },
          error: () => {
            this.showErrorMessage('Failed to add AI suggested meal');
          }
        });
        this.subscriptions.push(createSub);
      },
      error: () => {
        this.aiLoading = false;
        this.showErrorMessage('AI suggestions failed');
      }
    });
    this.subscriptions.push(sub);
  }

  dismissAlert(alert: DiabeticAlert): void {
    this.alerts = this.alerts.filter(a => a !== alert);
  }

  handleAlertAction(alert: DiabeticAlert): void {
    // Handle alert-specific actions
    console.log('Handling alert action:', alert);
  }

  editMeal(meal: Meal): void {
    this.currentMeal = { ...meal };
    this.showAddMeal = true;
    this.showManualEntry = true;
  }

  duplicateMeal(meal: Meal): void {
    this.currentMeal = {
      ...meal,
      id: undefined,
      name: `${meal.name} (Copy)`,
      createdAt: new Date().toISOString()
    };
    this.showAddMeal = true;
    this.showManualEntry = true;
  }

  // Private helper methods
  private updateTodayMeals(): void {
    const today = new Date().toDateString();
    this.todayMeals = this.meals.filter(meal => {
      // Backend or local saved meals may provide either `createdAt` (ISO datetime)
      // or `date` (YYYY-MM-DD). Normalize both to a Date and compare day.
      const dateSource = (meal as any).createdAt || (meal as any).date || '';
      if (!dateSource) return false;
      try {
        return new Date(dateSource).toDateString() === today;
      } catch (e) {
        return false;
      }
    });
  }

  private calculateDailyTotals(): void {
    this.todayCalories = this.todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    this.todayProtein = this.todayMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    this.todayNetCarbs = this.todayMeals.reduce((sum, meal) =>
      sum + ((meal.carbohydrates || 0) - (meal.fiber || 0)), 0
    );
  }

  private resetMealForm(): void {
    this.currentMeal = {
      name: '',
      type: 'lunch',
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fats: 0,
      fiber: 0
    };
  }

  private generateMockAnalytics(): void {
    // Generate mock analytics data
    this.weeklyStats = {
      avgCalories: 1850,
      mealsLogged: 21
    };

    this.recentAchievements = [
      { icon: '🎯', text: 'Met protein goal 5 days in a row!' },
      { icon: '📊', text: 'Logged 20+ meals this week' }
    ];
  }

  private showSuccessMessage(message: string): void {
    // Implement notification system
    console.log('Success:', message);
  }

  private showErrorMessage(message: string): void {
    // Implement notification system
    console.error('Error:', message);
  }
}
