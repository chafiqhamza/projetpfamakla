import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiService, ChatMessage } from '../../services/ai.service';
import { GoalsSyncService, NutritionGoals } from '../../services/goals-sync.service';
import { MealService } from '../../services/meal.service';
import { WaterService } from '../../services/water.service';
import { FoodService } from '../../services/food.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Chat Button with Alert Badge -->
    <button *ngIf="!isOpen" class="chat-button" (click)="toggleChat()" title="AI Nutrition Agent">
      🤖
      <span *ngIf="pendingAlerts > 0" class="alert-badge">{{ pendingAlerts }}</span>
    </button>

    <!-- Agent Window -->
    <div *ngIf="isOpen" class="chat-window" [class.agent-mode]="agentMode" [class.expanded]="expandedView">
      <div class="chat-header">
        <div class="header-info">
          <h3>🤖 Makla AI Assistant</h3>
          <small *ngIf="agentMode" class="agent-status">
            <span class="pulse"></span> 
            {{ isDiabetic ? '🩺 Diabetic Mode' : 'Agent Active' }}
          </small>
        </div>
        <div class="header-actions">
          <button class="expand-btn" (click)="toggleExpand()" title="Expand">
            {{ expandedView ? '🗗' : '⬜' }}
          </button>
          <button class="mode-toggle" (click)="toggleAgentMode()" [class.active]="agentMode" title="Toggle Agent Mode">
            {{ agentMode ? '🧠 Agent' : '💬 Basic' }}
          </button>
          <button class="minimize-btn" (click)="toggleChat()">✕</button>
        </div>
      </div>

      <!-- Agent Dashboard Panel -->
      <div *ngIf="agentMode && showDashboard" class="agent-dashboard">
        <div class="dashboard-row">
          <div class="health-score" *ngIf="healthScore !== null">
            <div class="score-circle" [style.background]="getScoreColor(healthScore)">
              <span class="score-value">{{ healthScore }}</span>
              <span class="score-label">Health</span>
            </div>
          </div>
          
          <div class="quick-stats">
            <div class="stat-item">
              <span class="stat-icon">🍽️</span>
              <span class="stat-value">{{ displayMealsCount() }}</span>
              <span class="stat-label">Meals</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">💧</span>
              <span class="stat-value">{{ waterTotal }}ml</span>
              <span class="stat-label">Water</span>
            </div>
            <div class="stat-item" *ngIf="isDiabetic">
              <span class="stat-icon">🍞</span>
              <span class="stat-value">{{ displayTotalCarbs() }}g</span>
              <span class="stat-label">Carbs</span>
            </div>
            <div class="stat-item" *ngIf="!isDiabetic">
              <span class="stat-icon">🔥</span>
              <span class="stat-value">{{ displayTotalCalories() }}</span>
              <span class="stat-label">Calories</span>
            </div>
          </div>
        </div>

        <!-- Diabetic Carb Progress Bar -->
        <div *ngIf="isDiabetic" class="carb-progress">
          <div class="progress-label">
            <span>Daily Carbs: {{ totalCarbs }}g / 130g</span>
            <span [class.warning]="totalCarbs > 100">{{ getCarbsPercent() }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="getCarbsPercent()" 
                 [class.warning]="totalCarbs > 100" [class.danger]="totalCarbs > 130"></div>
          </div>
        </div>

        <!-- Active Alerts -->
        <div *ngIf="alerts.length > 0" class="alerts-panel">
          <div *ngFor="let alert of alerts" class="alert-item" [class]="alert.type">
            <span class="alert-icon">{{ getAlertIcon(alert.type) }}</span>
            <div class="alert-content">
              <strong>{{ alert.title }}</strong>
              <p>{{ alert.message }}</p>
            </div>
            <button class="alert-dismiss" (click)="dismissAlert(alert)">✕</button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button (click)="quickAction('suggest-meal')" title="Get diabetic-friendly meals">
            🍽️ {{ isDiabetic ? 'Low-Carb Meals' : 'Suggest Meal' }}
          </button>
          <button (click)="quickAction('log-water')" title="Quick add water">💧 +Water</button>
          <button (click)="addUserProvidedMenu()" title="Importer le menu utilisateur">➕ Import Menu</button>
          <button (click)="quickAction('analyze')" title="Full analysis">📊 Analyze</button>
          <button (click)="analyzeProfileForGoals()" title="AI analyze profile for personalized goals" [disabled]="isAnalyzingProfile">
            🎯 {{ isAnalyzingProfile ? 'Analysing...' : 'Objectifs' }}
          </button>
          <button (click)="clearDashboard()" title="Clear all dashboard data">🗑️ Clear Dashboard</button>
          <button (click)="syncLocal()" title="Sync locally saved meals to backend">🔁 Sync Local</button>
        </div>

        <button class="toggle-dashboard" (click)="showDashboard = false">Hide Dashboard ▲</button>
      </div>
      <button *ngIf="agentMode && !showDashboard" class="toggle-dashboard show" (click)="showDashboard = true">
        Show Dashboard ▼
      </button>

      <!-- AI Goals Suggestion Panel -->
      <div *ngIf="showGoalsSuggestion && suggestedGoals" class="goals-suggestion-panel">
        <h4>🎯 Objectifs Personnalisés Recommandés</h4>
        <div class="confidence-badge">Confiance: {{ goalsConfidence }}%</div>
        
        <div class="goals-comparison">
          <div class="goals-column">
            <h5>Actuels</h5>
            <div class="goal-item" *ngIf="currentGoals">
              <span>🔥 Calories:</span>
              <strong>{{ currentGoals.calories }}</strong>
            </div>
            <div class="goal-item" *ngIf="currentGoals">
              <span>💧 Eau:</span>
              <strong>{{ currentGoals.water }}ml</strong>
            </div>
            <div class="goal-item" *ngIf="currentGoals">
              <span>🍞 Glucides:</span>
              <strong>{{ currentGoals.carbs }}g</strong>
            </div>
          </div>
          
          <div class="arrow">→</div>
          
          <div class="goals-column suggested">
            <h5>Suggérés</h5>
            <div class="goal-item">
              <span>🔥 Calories:</span>
              <strong>{{ suggestedGoals.calories }}</strong>
            </div>
            <div class="goal-item">
              <span>💧 Eau:</span>
              <strong>{{ suggestedGoals.water }}ml</strong>
            </div>
            <div class="goal-item">
              <span>🍞 Glucides:</span>
              <strong>{{ suggestedGoals.carbs }}g</strong>
            </div>
          </div>
        </div>
        
        <div class="goals-explanation">
          <p>{{ goalsExplanation }}</p>
        </div>
        
        <div class="goals-actions">
          <button class="accept-btn" (click)="acceptSuggestedGoals()">
            ✅ Accepter les changements
          </button>
          <button class="reject-btn" (click)="rejectSuggestedGoals()">
            ❌ Garder mes objectifs actuels
          </button>
        </div>
      </div>

      <!-- User Profile Setup -->
      <div *ngIf="showProfileSetup" class="profile-setup">
        <h4>🎯 Personalize Your Experience</h4>
        <p>Tell me about yourself for better recommendations:</p>
        
        <div class="profile-field">
          <label>Health Conditions:</label>
          <div class="chip-select">
            <button *ngFor="let condition of healthConditionOptions" 
                    [class.selected]="selectedConditions.includes(condition)"
                    (click)="toggleCondition(condition)">
              {{ condition }}
            </button>
          </div>
        </div>

        <div class="profile-field">
          <label>Dietary Preferences:</label>
          <div class="chip-select">
            <button *ngFor="let diet of dietOptions" 
                    [class.selected]="selectedDiets.includes(diet)"
                    (click)="toggleDiet(diet)">
              {{ diet }}
            </button>
          </div>
        </div>

        <div class="profile-field">
          <label>Goals:</label>
          <div class="chip-select">
            <button *ngFor="let goal of goalOptions" 
                    [class.selected]="selectedGoals.includes(goal)"
                    (click)="toggleGoal(goal)">
              {{ goal }}
            </button>
          </div>
        </div>

        <div class="profile-actions">
          <button class="save-profile" (click)="saveProfile()">Save & Start Agent</button>
          <button class="skip-profile" (click)="skipProfile()">Skip for now</button>
        </div>
      </div>

      <!-- Chat Messages -->
      <div class="chat-messages" #messagesContainer>
        <div *ngFor="let msg of messages" [class]="'message ' + msg.role">
          <div class="message-content">
            <strong>{{ msg.role === 'user' ? 'You' : (msg.role === 'system' ? '⚡ Agent' : '🤖 AI') }}:</strong>
            <div [innerHTML]="formatMessage(msg.content)"></div>
            
            <!-- Action Buttons -->
            <div *ngIf="msg.actions && msg.actions.length > 0" class="message-actions">
              <button *ngFor="let action of msg.actions" 
                      (click)="executeAction(action)"
                      [disabled]="action.status === 'executing'"
                      [class]="'action-btn ' + action.status">
                {{ getActionLabel(action) }}
                <span *ngIf="action.status === 'completed'">✓</span>
                <span *ngIf="action.status === 'executing'" class="spinner"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Meal Suggestions Display -->
        <div *ngIf="mealSuggestions.length > 0" class="meal-suggestions">
          <h4>🍽️ Recommandations de Repas</h4>
          <div class="suggestion-card" *ngFor="let suggestion of mealSuggestions; trackBy: trackBySuggestion">
            <div class="suggestion-header">
              <h5>{{ suggestion.name }}</h5>
              <div class="meal-stats">
                <span class="calories">{{ suggestion.totalCalories || suggestion.calories || 0 }} kcal</span>
                <span class="time">{{ suggestion.prepTime || '25 minutes' }}</span>
              </div>
            </div>

            <div class="nutrition-preview">
              <div class="nutrient">
                <span class="label">Protéines:</span>
                <span class="value">{{ suggestion.totalProtein || suggestion.protein || 0 }}g</span>
              </div>
              <div class="nutrient">
                <span class="label">Glucides:</span>
                <span class="value" [class.low-carb]="(suggestion.totalCarbs || suggestion.carbs || 0) <= 15">{{ suggestion.totalCarbs || suggestion.carbs || 0 }}g</span>
              </div>
              <div class="nutrient">
                <span class="label">Lipides:</span>
                <span class="value">{{ suggestion.totalFat || suggestion.fats || 0 }}g</span>
              </div>
              <div class="nutrient">
                <span class="label">Calories:</span>
                <span class="value">{{ suggestion.totalCalories || suggestion.calories || 0 }}</span>
              </div>
            </div>

            <div class="foods-list">
              <h6>Aliments suggérés:</h6>
              <ul>
                <li *ngFor="let food of suggestion.foods">
                  {{ food.name }} - {{ food.portion || food.quantity || 'N/A' }}{{ food.unit || '' }}
                  <small>({{ food.calories }}kcal)</small>
                </li>
              </ul>
            </div>

            <div class="suggestion-actions">
              <button class="btn-log-meal" (click)="logMealFromSuggestion(suggestion)">
                📝 Enregistrer ce Repas
              </button>
              <button class="btn-add-foods" (click)="navigateToMeals(suggestion)">
                ➕ Ajouter aux Aliments
              </button>
            </div>
          </div>
        </div>

        <!-- Expanded Meal Detail -->
        <div *ngIf="selectedMeal" class="meal-detail-panel">
          <div class="meal-detail-header">
            <h4>{{ selectedMeal?.name }}</h4>
            <button class="close-detail" (click)="selectedMeal = null">✕</button>
          </div>
          
          <div class="meal-detail-content" *ngIf="selectedMeal">
            <div class="nutrition-summary">
              <div class="nutrition-item">
                <span class="label">Calories</span>
                <span class="value">{{ selectedMeal?.totalCalories || selectedMeal?.calories || 0 }}</span>
              </div>
              <div class="nutrition-item">
                <span class="label">Carbs</span>
                <span class="value" [class.highlight]="isDiabetic">{{ selectedMeal?.totalCarbs || selectedMeal?.carbs || 0 }}g</span>
              </div>
              <div class="nutrition-item">
                <span class="label">Protein</span>
                <span class="value">{{ selectedMeal?.totalProtein || selectedMeal?.protein || 0 }}g</span>
              </div>
              <div class="nutrition-item">
                <span class="label">Fat</span>
                <span class="value">{{ selectedMeal?.totalFat || selectedMeal?.fat || 0 }}g</span>
              </div>
            </div>

            <div class="ingredients-list">
              <h5>🥘 Ingredients:</h5>
              <ul>
                <li *ngFor="let food of selectedMeal?.foods || []">
                  {{ food.name }} ({{ food.portion }}) - {{ food.calories }} cal, {{ food.carbs }}g carbs
                </li>
              </ul>
            </div>

            <div class="recipe-content" [innerHTML]="formatMessage(selectedMeal?.recipe || selectedMeal?.text || '')"></div>

            <div *ngIf="selectedMeal?.tips" class="meal-tips">
              {{ selectedMeal?.tips }}
            </div>

            <div class="meal-actions">
              <button class="btn-log-meal" (click)="selectedMeal && logMealFromSuggestion(selectedMeal)">
                ✅ Log This Meal
              </button>
              <button class="btn-add-foods" (click)="selectedMeal && navigateToMeals(selectedMeal)">
                ➕ Add to Meal Plan
              </button>
            </div>
          </div>
        </div>
        
        <div *ngIf="isLoading" class="message assistant">
          <div class="message-content">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <div *ngIf="agentMode" class="context-bar">
          <small>
            {{ isDiabetic ? ('🩺 Diabetic Mode | Carbs: ' + displayTotalCarbs() + 'g/130g') : ('📊 Monitoring ' + displayMealsCount() + ' meals') }}
          </small>
          <span *ngIf="userProfileSet" class="profile-badge" title="Profile active">👤</span>
        </div>
        <div class="input-row">
          <input 
            [(ngModel)]="currentMessage" 
            (keyup.enter)="sendMessage()" 
            [placeholder]="getPlaceholder()"
            [disabled]="isLoading"
            class="chat-input"
          />
          <button (click)="sendMessage()" [disabled]="!currentMessage.trim() || isLoading" class="send-btn">
            {{ isLoading ? '⏳' : '📤' }}
          </button>
        </div>
        <div *ngIf="agentMode" class="command-hints">
          <small>{{ isDiabetic ? 'Try: "Low carb dinner" • "What can I eat?" • "Log my salad"' : 'Try: "I ate..." • "Add water" • "Suggest meal"' }}</small>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    /* ... existing styles ... */
    .chat-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
      transition: transform 0.3s, box-shadow 0.3s;
      z-index: 1000;
    }

    .chat-button:hover { transform: scale(1.1); }

    .alert-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ff4444;
      color: white;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse-badge 2s infinite;
    }

    .chat-window {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 420px;
      height: 650px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
      z-index: 1000;
      animation: slideUp 0.3s ease-out;
      transition: all 0.3s ease;
    }

    .chat-window.expanded {
      width: 600px;
      height: 80vh;
      max-height: 800px;
    }

    .chat-window.agent-mode {
      border: 2px solid #4CAF50;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .chat-header {
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 13px 13px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .agent-mode .chat-header {
      background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
    }

    .header-info h3 { margin: 0; font-size: 1.1rem; }
    
    .agent-status {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.75rem;
    }

    .pulse {
      width: 8px;
      height: 8px;
      background: #81C784;
      border-radius: 50%;
      animation: pulse-dot 1.5s infinite;
    }

    .header-actions { display: flex; gap: 0.5rem; }

    .expand-btn, .mode-toggle, .minimize-btn {
      padding: 0.4rem 0.6rem;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      border-radius: 5px;
      cursor: pointer;
      font-size: 0.8rem;
    }

    .mode-toggle.active {
      background: rgba(255,255,255,0.3);
    }

    /* Agent Dashboard */
    .agent-dashboard {
      background: linear-gradient(to bottom, #f8f9fa, #fff);
      padding: 0.8rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .dashboard-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .health-score .score-circle {
      width: 55px;
      height: 55px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.15);
    }

    .score-value { font-size: 1.2rem; font-weight: bold; }
    .score-label { font-size: 0.6rem; }

    .quick-stats {
      display: flex;
      flex: 1;
      justify-content: space-around;
    }

    .stat-item { text-align: center; }
    .stat-icon { font-size: 1rem; display: block; }
    .stat-value { font-weight: bold; font-size: 0.9rem; color: #333; }
    .stat-label { font-size: 0.65rem; color: #666; }

    /* Carb Progress (Diabetic) */
    .carb-progress {
      margin: 0.5rem 0;
      padding: 0.5rem;
      background: #fff3e0;
      border-radius: 8px;
      border-left: 3px solid #ff9800;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      margin-bottom: 0.3rem;
    }

    .progress-label .warning { color: #f44336; font-weight: bold; }

    .progress-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #4CAF50;
      transition: width 0.3s;
    }

    .progress-fill.warning { background: #ff9800; }
    .progress-fill.danger { background: #f44336; }

    .alerts-panel {
      max-height: 80px;
      overflow-y: auto;
      margin: 0.5rem 0;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem;
      border-radius: 6px;
      margin-bottom: 0.3rem;
      font-size: 0.8rem;
    }

    .alert-item.warning { background: #fff3cd; border-left: 3px solid #ffc107; }
    .alert-item.info { background: #d1ecf1; border-left: 3px solid #17a2b8; }
    .alert-item.error { background: #f8d7da; border-left: 3px solid #dc3545; }

    .quick-actions {
      display: flex;
      gap: 0.3rem;
      flex-wrap: wrap;
    }

    .quick-actions button {
      flex: 1;
      min-width: 80px;
      padding: 0.4rem;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.7rem;
      transition: all 0.2s;
    }

    .quick-actions button:hover {
      background: #4CAF50;
      color: white;
      border-color: #4CAF50;
    }

    .toggle-dashboard {
      width: 100%;
      padding: 0.5rem;
      background: #f8f9fa;
      border: none;
      border-top: 1px solid #e0e0e0;
      cursor: pointer;
      font-size: 0.75rem;
      color: #777;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.2s;
      border-radius: 0 0 5px 5px;
    }

    .toggle-dashboard:hover {
      background: #e9ecef;
      color: #333;
    }

    .toggle-dashboard.show {
      border-top: none;
      border-bottom: 1px solid #e0e0e0;
      background: white;
      color: #4CAF50;
      margin-bottom: 0.5rem;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }

    /* AI Goals Suggestion Panel */
    .goals-suggestion-panel {
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
      border: 2px solid #4CAF50;
      border-radius: 12px;
      padding: 1rem;
      margin: 0.5rem;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
    }

    .goals-suggestion-panel h4 {
      margin: 0 0 0.5rem 0;
      color: #2E7D32;
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .confidence-badge {
      display: inline-block;
      background: #4CAF50;
      color: white;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: bold;
      margin-bottom: 0.8rem;
    }

    .goals-comparison {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1rem 0;
      padding: 0.8rem;
      background: white;
      border-radius: 8px;
    }

    .goals-column {
      flex: 1;
    }

    .goals-column h5 {
      margin: 0 0 0.5rem 0;
      font-size: 0.8rem;
      color: #666;
      text-transform: uppercase;
    }

    .goals-column.suggested h5 {
      color: #4CAF50;
    }

    .goal-item {
      display: flex;
      justify-content: space-between;
      padding: 0.3rem 0;
      font-size: 0.85rem;
    }

    .goal-item span {
      color: #666;
    }

    .goal-item strong {
      color: #333;
      font-weight: bold;
    }

    .arrow {
      font-size: 1.5rem;
      color: #4CAF50;
      font-weight: bold;
    }

    .goals-explanation {
      background: white;
      padding: 0.8rem;
      border-radius: 8px;
      margin: 0.8rem 0;
      border-left: 3px solid #4CAF50;
    }

    .goals-explanation p {
      margin: 0;
      font-size: 0.85rem;
      line-height: 1.4;
      color: #333;
    }

    .goals-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .accept-btn, .reject-btn {
      flex: 1;
      padding: 0.6rem;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }

    .accept-btn {
      background: linear-gradient(135deg, #4CAF50, #66BB6A);
      color: white;
    }

    .accept-btn:hover {
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
      transform: translateY(-2px);
    }

    .reject-btn {
      background: #f5f5f5;
      color: #666;
      border: 1px solid #ddd;
    }

    .reject-btn:hover {
      background: #e0e0e0;
    }

    /* Profile Setup */
    .profile-setup {
      padding: 1rem;
      background: #f8f9fa;
      max-height: 220px;
      overflow-y: auto;
    }

    .profile-setup h4 { margin: 0 0 0.5rem 0; }
    .profile-setup p { margin: 0 0 0.8rem 0; font-size: 0.8rem; color: #666; }

    .profile-field { margin-bottom: 0.6rem; }
    .profile-field label { display: block; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.2rem; }

    .chip-select { display: flex; flex-wrap: wrap; gap: 0.25rem; }

    .chip-select button {
      padding: 0.25rem 0.5rem;
      background: white;
      border: 1px solid #ddd;
      border-radius: 12px;
      cursor: pointer;
      font-size: 0.7rem;
    }

    .chip-select button.selected {
      background: #4CAF50;
      color: white;
      border-color: #4CAF50;
    }

    .profile-actions { display: flex; gap: 0.5rem; margin-top: 0.8rem; }

    .save-profile {
      flex: 1;
      padding: 0.5rem;
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }

    .skip-profile {
      padding: 0.5rem;
      background: #f0f0f0;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    /* Chat Messages */
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: #f5f5f5;
    }

    .message { margin-bottom: 0.8rem; }

    .message.user .message-content {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      margin-left: auto;
      max-width: 80%;
    }

    .message.assistant .message-content {
      background: white;
      color: #333;
      max-width: 85%;
    }

    .message.system .message-content {
      background: linear-gradient(135deg, #4CAF50, #81C784);
      color: white;
      max-width: 90%;
      border-left: 3px solid #2E7D32;
    }

    .message-content {
      padding: 0.7rem;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .message-content strong { display: block; font-size: 0.75rem; margin-bottom: 0.2rem; opacity: 0.9; }

    /* Meal Suggestions Panel */
    .meal-suggestions-panel {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      margin: 0.5rem 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .meal-suggestions-panel h4 {
      margin: 0 0 0.8rem 0;
      color: #2E7D32;
      font-size: 1rem;
    }

    .meal-cards {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }

    .meal-card {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      padding: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .meal-card:hover {
      border-color: #4CAF50;
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
    }

    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .meal-header h5 { margin: 0; font-size: 0.9rem; color: #333; }
    .meal-time { font-size: 0.7rem; color: #666; }

    .meal-macros {
      display: flex;
      gap: 0.8rem;
      margin-bottom: 0.5rem;
    }

    .macro {
      font-size: 0.75rem;
      padding: 0.2rem 0.4rem;
      background: #e8e8e8;
      border-radius: 4px;
    }

    .macro.carbs.low { background: #c8e6c9; color: #2E7D32; }

    .meal-badges {
      display: flex;
      gap: 0.4rem;
      margin-bottom: 0.5rem;
    }

    .badge {
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      border-radius: 10px;
    }

    .badge.diabetic { background: #c8e6c9; color: #1B5E20; }
    .badge.gi-low { background: #bbdefb; color: #1565C0; }

    .view-recipe-btn {
      width: 100%;
      padding: 0.5rem;
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
    }

    /* Meal Detail Panel */
    .meal-detail-panel {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      margin: 0.5rem 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 2px solid #4CAF50;
    }

    .meal-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .meal-detail-header h4 { margin: 0; color: #2E7D32; }

    .close-detail {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #666;
    }

    .nutrition-summary {
      display: flex;
      justify-content: space-around;
      background: #f5f5f5;
      padding: 0.8rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .nutrition-item {
      text-align: center;
    }

    .nutrition-item .label { display: block; font-size: 0.7rem; color: #666; }
    .nutrition-item .value { font-size: 1.1rem; font-weight: bold; color: #333; }
    .nutrition-item .value.highlight { color: #4CAF50; }

    .ingredients-list {
      margin-bottom: 1rem;
    }

    .ingredients-list h5 { margin: 0 0 0.5rem 0; font-size: 0.85rem; }
    .ingredients-list ul { margin: 0; padding-left: 1.2rem; font-size: 0.8rem; }
    .ingredients-list li { margin-bottom: 0.3rem; }

    .recipe-content {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }

    .meal-tips {
      background: #fff3e0;
      padding: 0.8rem;
      border-radius: 8px;
      font-size: 0.8rem;
      border-left: 3px solid #ff9800;
      margin-bottom: 1rem;
    }

    .meal-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-log-meal, .btn-add-foods {
      flex: 1;
      padding: 0.7rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-log-meal {
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
      color: white;
    }

    .btn-log-meal:hover {
      background: linear-gradient(135deg, #2E7D32, #1B5E20);
      transform: translateY(-1px);
    }

    .btn-add-foods {
      background: #f0f0f0;
      color: #333;
      border: 1px solid #ddd;
    }

    .btn-add-foods:hover {
      background: #e0e0e0;
      border-color: #ccc;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #667eea;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out;
    }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* Input Area */
    .chat-input-area {
      padding: 0.7rem;
      border-top: 1px solid #ddd;
      background: white;
      border-radius: 0 0 13px 13px;
    }

    .context-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
      padding: 0.3rem 0.5rem;
      background: #e8f5e9;
      border-radius: 5px;
    }

    .context-bar small { color: #2e7d32; font-size: 0.7rem; }

    .input-row { display: flex; gap: 0.5rem; }

    .chat-input {
      flex: 1;
      padding: 0.7rem;
      border: 2px solid #ddd;
      border-radius: 20px;
      font-size: 0.85rem;
      outline: none;
    }

    .chat-input:focus { border-color: #4CAF50; }

    .send-btn {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
      color: white;
      border: none;
      cursor: pointer;
      font-size: 1rem;
    }

    .send-btn:disabled { opacity: 0.5; }

    .command-hints { margin-top: 0.3rem; text-align: center; }
    .command-hints small { color: #888; font-size: 0.65rem; }

    @keyframes pulse-badge {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .message-actions { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.3rem; }

    .action-btn {
      padding: 0.3rem 0.6rem;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: inherit;
      border-radius: 12px;
      cursor: pointer;
      font-size: 0.75rem;
    }

    .action-btn.completed { background: rgba(76, 175, 80, 0.3); }
    .action-btn.failed { background: rgba(244, 67, 54, 0.3); }

    .spinner {
      display: inline-block;
      width: 10px;
      height: 10px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Nutrient Highlight Badges */
    .nutrient-highlight {
      display: flex;
      gap: 0.5rem;
      margin: 0.5rem 0;
      flex-wrap: wrap;
    }

    .nutrient-badge {
      padding: 0.3rem 0.6rem;
      border-radius: 15px;
      font-size: 0.7rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .nutrient-badge.iron {
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
    }

    .nutrient-badge.vitamin-d {
      background: linear-gradient(135deg, #feca57, #ff9ff3);
      color: white;
    }

    .nutrient-badge.protein {
      background: linear-gradient(135deg, #48dbfb, #0abde3);
      color: white;
    }

    /* Enhanced Meal Suggestions */
    .meal-suggestions {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      margin: 0.5rem 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 2px solid #4CAF50;
    }

    .meal-suggestions h4 {
      margin: 0 0 1rem 0;
      color: #2E7D32;
      font-size: 1.1rem;
      text-align: center;
    }

    .suggestion-card {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1rem;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .suggestion-card:hover {
      border-color: #4CAF50;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
      transform: translateY(-2px);
    }

    .suggestion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.8rem;
    }

    .suggestion-header h5 {
      margin: 0;
      font-size: 1rem;
      color: #333;
      font-weight: 600;
    }

    .meal-stats {
      display: flex;
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    .meal-stats .calories {
      background: #4CAF50;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 8px;
    }

    .meal-stats .time {
      background: #ff9800;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 8px;
    }

    .nutrition-preview {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin-bottom: 0.8rem;
    }

    .nutrition-preview .nutrient {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
    }

    .nutrition-preview .label {
      color: #666;
      font-weight: 500;
    }

    .nutrition-preview .value {
      font-weight: 600;
      color: #333;
    }

    .nutrition-preview .value.low-carb {
      color: #4CAF50;
      font-weight: 700;
    }

    .foods-list h6 {
      margin: 0 0 0.5rem 0;
      font-size: 0.85rem;
      color: #555;
    }

    .foods-list ul {
      margin: 0;
      padding-left: 1rem;
      font-size: 0.8rem;
    }

    .foods-list li {
      margin-bottom: 0.3rem;
      color: #444;
    }

    .foods-list small {
      color: #888;
      font-style: italic;
    }

    .suggestion-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .btn-log-meal, .btn-add-foods {
      flex: 1;
      padding: 0.7rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-log-meal {
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
      color: white;
    }

    .btn-log-meal:hover {
      background: linear-gradient(135deg, #2E7D32, #1B5E20);
      transform: translateY(-1px);
    }

    .btn-add-foods {
      background: #f0f0f0;
      color: #333;
      border: 1px solid #ddd;
    }

    .btn-add-foods:hover {
      background: #e0e0e0;
      border-color: #ccc;
    }

    /* Message List Styles */
    .chat-ul {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
      list-style-type: none;
    }

    .chat-li {
      position: relative;
      margin-bottom: 0.4rem;
      line-height: 1.4;
    }

    .chat-li::before {
      content: "•";
      color: #764ba2;
      font-weight: bold;
      position: absolute;
      left: -1rem;
    }

    .agent-mode .chat-li::before {
      color: #4CAF50;
    }
  `]
})
export class AiChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  // UI state
  isOpen = false;
  expandedView = false;
  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;

  // Agent mode
  agentMode = false;
  showDashboard = true;
  showProfileSetup = false;
  userProfileSet = false;
  isDiabetic = false;

  // Data counters
  mealsCount = 0;
  waterTotal = 0;
  totalCalories = 0;
  totalCarbs = 0;
  healthScore: number | null = null;

  // helper: retourne une couleur pour healthScore (utilisé dans le template)
  getScoreColor = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return '#9e9e9e';
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#f44336';
  };
  alerts: any[] = [];
  pendingAlerts = 0;

  // Collections
  userMeals: any[] = [];
  userWater: any[] = [];
  userFoods: any[] = [];

  // Suggestions
  mealSuggestions: any[] = [];
  selectedMeal: any | null = null;
  // Suggested totals (from agent suggestions) shown in dashboard when user data is empty
  suggestedMealsCount = 0;
  suggestedCalories = 0;
  suggestedCarbs = 0;

  // Profile options
  healthConditionOptions = ['Diabetic', 'Hypertension', 'Heart Disease', 'Allergies', 'None'];
  dietOptions = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Keto', 'Halal', 'None'];
  goalOptions = ['Weight Loss', 'Weight Gain', 'Muscle Building', 'Maintain Health', 'Better Energy'];

  selectedConditions: string[] = [];
  selectedDiets: string[] = [];
  selectedGoals: string[] = [];

  // Internal
  private subscriptions: Subscription[] = [];
  private monitoringInterval: any;
  isLoggingMeal = false;
  private mealLoggingTimeout: any;

  // Goals
  showGoalsSuggestion = false;
  suggestedGoals: NutritionGoals | null = null;
  currentGoals: NutritionGoals | null = null;
  goalsExplanation = '';
  goalsConfidence = 0;
  isAnalyzingProfile = false;

  constructor(
    private aiService: AiService,
    private goalsSyncService: GoalsSyncService,
    private mealService: MealService,
    private waterService: WaterService,
    private foodService: FoodService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.messages.push({ role: 'assistant', content: '👋 Hello! I am your Makla AI Nutrition Agent.' });

    // Set up reactive subscriptions for real-time data sync across the app
    this.setupSubscriptions();

    // Initial Data Fetch
    this.loadAllUserData();

    // Try to push any locally saved meals to backend on startup
    try { this.mealService.syncLocalMeals().subscribe({ next: (s) => { if (s && s.length) this.messages.push({ role: 'assistant', content: `✅ Synced ${s.length} locally saved meal(s) to server.` }); }, error: () => { /* ignore */ } }); } catch (e) { }
  }

  setupSubscriptions(): void {
    // Alerts
    this.subscriptions.push(this.aiService.alerts$.subscribe(alerts => {
      this.alerts = alerts || [];
      this.pendingAlerts = this.alerts.filter(a => a.priority === 'high').length;
    }));

    // Goals
    this.subscriptions.push(this.goalsSyncService.goals$.subscribe(goals => {
      this.currentGoals = goals;
    }));

    // Dashboard updates emitted by AI service (populate dashboard with suggestions, handle add meal, update goals)
    this.subscriptions.push((this.aiService.dashboardUpdate as any).subscribe((update: any) => {
      try {
        if (!update || !update.type) return;
        switch (update.type) {
          case 'SHOW_MEAL_PREVIEW':
            // update.data may be an array of suggestions or a single suggestion
            if (Array.isArray(update.data)) {
              this.mealSuggestions = update.data;
            } else if (update.data) {
              // wrap single suggestion into array
              this.mealSuggestions = [update.data];
            }
            this.selectedMeal = this.mealSuggestions && this.mealSuggestions.length ? this.mealSuggestions[0] : null;
            this.computeSuggestedTotals();
            // show dashboard to user so they see the planning
            this.showDashboard = true;
            this.agentMode = true; // ensure agent mode active if suggestions arrive
            break;
          case 'ADD_MEAL':
            // Avoid auto-logging here to prevent loops. Show notification and refresh.
            if (update.data && update.data.name) {
              this.messages.push({ role: 'assistant', content: `✅ AI recorded suggestion: ${update.data.name}. Use the UI to confirm logging.` });
            } else {
              this.messages.push({ role: 'assistant', content: '✅ AI provided a meal update.' });
            }
            // Refresh user-visible data
            this.loadAllUserData();
            break;
          case 'UPDATE_GOALS':
            if (update.data) {
              this.currentGoals = update.data;
            }
            break;
          default:
            // other dashboard updates can be handled here
            break;
        }
      } catch (e) {
        console.warn('Error handling dashboard update', e);
      }
    }));

    // Meals (Real-time sync)
    this.subscriptions.push(this.mealService.meals$.subscribe(meals => {
      this.userMeals = meals || [];
      this.mealsCount = this.userMeals.length;
      this.totalCalories = this.userMeals.reduce((s, m) => s + (m.calories || m.totalCalories || 0), 0);
      this.totalCarbs = this.userMeals.reduce((s, m) => s + (m.carbs || m.totalCarbs || 0), 0);
    }));

    // Water (Real-time sync)
    this.subscriptions.push(this.waterService.waterIntakes$.subscribe(water => {
      this.userWater = water || [];
      this.waterTotal = this.userWater.reduce((s, w) => s + (w.amount || 0), 0);
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    if (this.monitoringInterval) clearInterval(this.monitoringInterval);
  }

  toggleChat() { this.isOpen = !this.isOpen; if (this.isOpen) { this.pendingAlerts = 0; setTimeout(() => this.scrollToBottom(), 100); } }
  toggleExpand() { this.expandedView = !this.expandedView; }

  toggleAgentMode() {
    this.agentMode = !this.agentMode;
    if (this.agentMode) {
      this.aiService.activateAgent();
      const profile = (this.aiService.getUserProfile && this.aiService.getUserProfile()) || {};
      if (!profile.healthConditions?.length) {
        this.showProfileSetup = true;
      } else {
        this.userProfileSet = true;
        this.isDiabetic = profile.healthConditions?.includes('Diabetic') || false;
        this.startAgentMode();
      }
    } else {
      this.aiService.deactivateAgent && this.aiService.deactivateAgent();
      this.stopMonitoring();
      this.mealSuggestions = [];
      this.selectedMeal = null;
    }
  }

  startMonitoring(){
    this.monitoringInterval = setInterval(()=>{ this.agentMode && this.checkHealthStatus(); }, 300 * 1000);
  }

  stopMonitoring(){
    this.monitoringInterval && clearInterval(this.monitoringInterval);
  }

  loadAllUserData() {
    this.mealService.getAllMeals().subscribe(); // Triggers behavior subject update
    this.waterService.getAllWaterIntakes().subscribe(); // Triggers behavior subject update
    this.foodService.getAllFoods().subscribe({ next: (foods) => { this.userFoods = foods || []; }, error: (e) => console.warn(e) });
  }



  // Méthodes ajoutées : helpers et handlers référencés par le template
  analyzeProfileForGoals(): void {
    // Déclenche l'analyse, wrapper pour compatibilité template
    if (this.isAnalyzingProfile) return;
    this.isAnalyzingProfile = true;
    this.messages.push({ role: 'assistant', content: '🕵️ Analyse du profil en cours...' });
    this.scrollToBottom();

    setTimeout(() => {
      try {
        const suggested = this.goalsSyncService.calculateGoalsFromProfile ? this.goalsSyncService.calculateGoalsFromProfile({
          healthConditions: this.selectedConditions,
          diet: this.selectedDiets[0],
          goals: this.selectedGoals[0],
          age: 30, weight: 70, height: 175, gender: 'MALE', activityLevel: 'MODERATE'
        }) : null;

        if (suggested) this.suggestedGoals = suggested;
        this.currentGoals = this.goalsSyncService.getCurrentGoals ? this.goalsSyncService.getCurrentGoals() : this.currentGoals;
        this.goalsConfidence = 80;
        this.goalsExplanation = `Suggested based on provided profile.`;
        this.showGoalsSuggestion = true;
      } catch (e) {
        console.warn('Goal analysis failed', e);
        this.messages.push({ role: 'assistant', content: '❌ Impossible d\'analyser votre profil pour le moment.' });
      } finally {
        this.isAnalyzingProfile = false;
        this.scrollToBottom();
      }
    }, 1000);
  }

  acceptSuggestedGoals(): void {
    if (!this.suggestedGoals) return;
    try {
      this.goalsSyncService.updateGoals && this.goalsSyncService.updateGoals(this.suggestedGoals, 'Accepted from AI chat');
      this.showGoalsSuggestion = false;
      this.messages.push({ role: 'assistant', content: '✅ Objectifs appliqués.' });
      this.scrollToBottom();
    } catch (e) {
      console.warn('Failed to accept goals', e);
      this.messages.push({ role: 'assistant', content: '❌ Impossible d\'appliquer les objectifs.' });
      this.scrollToBottom();
    }
  }

  rejectSuggestedGoals(): void {
    this.showGoalsSuggestion = false;
    this.messages.push({ role: 'assistant', content: '👌 Objectifs actuels conservés.' });
    this.scrollToBottom();
  }

  handleNutrientDeficiency(nutrient: string, _originalCommand?: string): void {
    const title = nutrient.replace(/-/g, ' ');
    const content = `⚠️ Possible ${title} imbalance detected. I can suggest foods and meals rich in ${title}.`;
    this.messages.push({ role: 'assistant', content, actions: [{ type: 'navigate', label: 'Voir suggestions', data: { path: '/meals' }, parameters: { path: '/meals' }, status: 'pending' }] });
    this.scrollToBottom();
  }

  handleMealPrepRequest(_command: string): void {
    this.messages.push({ role: 'assistant', content: '🧑‍🍳 Voulez-vous des idées rapides de meal-prep ou un plan détaillé ?', actions: [{ type: 'navigate', label: 'Ouvrir Meal Prep Planner', data: { path: '/meal-prep-planner' }, parameters: { path: '/meal-prep-planner' }, status: 'pending' }] });
    this.scrollToBottom();
  }

  checkHealthStatus() { this.aiService.checkHealthAlerts && this.aiService.checkHealthAlerts({ meals: this.userMeals.slice(-10), water: this.userWater.slice(-10), todayCalories: this.getTodayCalories(), todayWater: this.getTodayWater(), todayCarbs: this.totalCarbs }).subscribe(); }

  getTodayCalories(): number { const today = new Date().toDateString(); return this.userMeals.filter(m => new Date(m.date).toDateString() === today).reduce((s, m) => s + (m.calories || 0), 0); }
  getTodayWater(): number { const today = new Date().toDateString(); return this.userWater.filter(w => new Date(w.date).toDateString() === today).reduce((s, w) => s + (w.amount || 0), 0); }
  getCarbsPercent(): number { const carbs = this.displayTotalCarbs(); return Math.min(100, Math.round((carbs / 130) * 100)); }

  // Display helpers: prefer real user data, fallback to suggested totals from agent
  displayMealsCount(): number { return (this.mealsCount || 0) + ((this.suggestedMealsCount && this.mealsCount === 0) ? this.suggestedMealsCount : 0); }
  displayTotalCalories(): number { return this.totalCalories || this.suggestedCalories || 0; }
  displayTotalCarbs(): number { return this.totalCarbs || this.suggestedCarbs || 0; }
  getPlaceholder(): string { if (this.isDiabetic) return 'Ask about low-carb meals, log food...'; return this.agentMode ? 'Ask anything or give commands...' : 'Ask about nutrition...'; }

  sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading) return;

    const userMessage = this.currentMessage.trim();
    this.messages.push({ role: 'user', content: userMessage });
    this.currentMessage = '';
    this.isLoading = true;
    this.scrollToBottom();

    // Clear previous suggestions when new message
    this.mealSuggestions = [];
    this.selectedMeal = null;

    // Always process food/water commands automatically, regardless of agent mode
    const lowerMessage = userMessage.toLowerCase();

    // Auto-detect meal logging
    if (this.detectFoodMention(lowerMessage)) {
      this.handleSmartMealLogging(userMessage);
      return;
    }

    // Auto-detect water logging
    if (this.detectWaterMention(lowerMessage)) {
      this.handleSmartWaterLogging(userMessage);
      return;
    }

    // Auto-detect meal suggestions/recommendations
    if (this.detectRecommendationRequest(lowerMessage)) {
      this.processAgentCommand(userMessage);
      return;
    }

    if (this.agentMode) {
      this.processAgentCommand(userMessage);
    } else {
      // Basic AI chat
      this.aiService.smartChatWithPhi3(userMessage, this.aiService.getUserProfile()).subscribe({
        next: (response) => {
          this.messages.push(response.response);
          this.isLoading = false;
          this.scrollToBottom();

          // If in agent mode or specific intent detected, process actions
          if (response.actions && response.actions.length > 0) {
            // In basic mode, we show actions as buttons
            // But we can ALSO look for structured menu in text
            if (response.response.content.includes('###')) {
              this.addMealSuggestionsFromText(response.response.content);
            }
          }
        },
        error: () => {
          this.messages.push({ role: 'assistant', content: 'Sorry, I encountered an error.' });
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Detect if message is asking for recommendations
   */
  private detectRecommendationRequest(message: string): boolean {
    const keywords = [
      'suggest', 'recommend', 'what should i eat', 'what to eat',
      'give me a meal', 'meal plan', 'dinner', 'lunch', 'breakfast',
      'low sugar', 'low carb', 'healthy option'
    ];
    return keywords.some(k => message.includes(k));
  }

  /**
   * Detect if message mentions food consumption
   */
  private detectFoodMention(message: string): boolean {
    const foodKeywords = [
      'ate', 'eaten', 'had', 'just had', 'just ate',
      'eating', 'consumed', 'finished',
      'for breakfast', 'for lunch', 'for dinner', 'for snack',
      'log meal', 'add meal', 'record meal',
      'i had a', 'i ate a', 'i had some', 'i ate some'
    ];

    return foodKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Detect if message mentions water consumption
   */
  private detectWaterMention(message: string): boolean {
    const waterKeywords = [
      'water', 'drank', 'drink', 'hydrate', 'hydration',
      'glass of', 'glasses of', 'ml', 'liter', 'litre',
      'cup of water', 'cups of water', 'bottle'
    ];

    return waterKeywords.some(keyword => message.includes(keyword));
  }

  processAgentCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    // Check for direct calorie logging
    const calorieMatch = lowerCommand.match(/(?:add|log|record)\s+(\d+)\s*(?:cal|calories|kcal)/i);
    if (calorieMatch) {
      const amount = parseInt(calorieMatch[1], 10);
      this.handleDirectCalorieLog(amount);
      return;
    }

    // Enhanced nutrient deficiency detection
    if (lowerCommand.includes('iron') && (lowerCommand.includes('deficit') || lowerCommand.includes('deficient') || lowerCommand.includes('low') || lowerCommand.includes('need'))) {
      this.handleNutrientDeficiency('iron', command);
      return;
    }

    // Other nutrient deficiencies
    if ((lowerCommand.includes('vitamin d') || lowerCommand.includes('vitamin-d')) && (lowerCommand.includes('deficit') || lowerCommand.includes('low'))) {
      this.handleNutrientDeficiency('vitamin-d', command);
      return;
    }

    if (lowerCommand.includes('calcium') && (lowerCommand.includes('deficit') || lowerCommand.includes('low') || lowerCommand.includes('need'))) {
      this.handleNutrientDeficiency('calcium', command);
      return;
    }

    if (lowerCommand.includes('protein') && (lowerCommand.includes('deficit') || lowerCommand.includes('low') || lowerCommand.includes('need'))) {
      this.handleNutrientDeficiency('protein', command);
      return;
    }

    // Meal prep time requests
    if (lowerCommand.includes('prep time') || lowerCommand.includes('meal prep')) {
      this.handleMealPrepRequest(command);
      return;
    }

    // Check for meal suggestion requests - ENHANCED detection
    const mealRequestKeywords = [
      'dinner', 'lunch', 'breakfast', 'eat', 'meal',
      'suggest', 'recommend', 'what should', 'help me',
      'give me', 'show me', 'find me', 'need',
      'calories', 'calorie', 'sugar', 'carb', 'carbs',
      'low sugar', 'low carb', 'healthy', 'nutritious',
      'protein', 'diet', 'food'
    ];

    const isMealRequest = mealRequestKeywords.some(keyword => lowerCommand.includes(keyword));

    if (isMealRequest) {
      // Determine meal type from context
      const mealType = lowerCommand.includes('breakfast') ? 'breakfast' :
        lowerCommand.includes('lunch') ? 'lunch' : 'dinner';

      // Special handling for low sugar/carb requests
      const isLowSugar = lowerCommand.includes('low sugar') || lowerCommand.includes('low carb');

      this.messages.push({
        role: 'assistant',
        content: isLowSugar
          ? `🍽️ **Parfait !** Je vais vous suggérer des repas **faibles en sucre et glucides** avec toutes les informations nutritionnelles détaillées.`
          : (this.isDiabetic
            ? `🍽️ Je vais vous trouver des **options ${mealType} adaptées aux diabétiques** avec faibles glucides et recettes complètes !`
            : `🍽️ Laissez-moi vous suggérer d'excellentes **options ${mealType}** pour vous !`)
      });

      this.getMealSuggestions(mealType);
      return;
    }

    // Log meal requests - check if user describes what they ate
    if (lowerCommand.includes('ate') || lowerCommand.includes('had') || lowerCommand.includes('eaten') ||
      (lowerCommand.includes('log') && (lowerCommand.includes('meal') || lowerCommand.includes('food')))) {
      this.handleSmartMealLogging(command);
      return;
    }

    // Water tracking - check if user mentions adding water
    if (lowerCommand.includes('water') || lowerCommand.includes('drink') || lowerCommand.includes('hydrat') ||
      lowerCommand.includes('glass') || lowerCommand.includes('ml')) {
      this.handleSmartWaterLogging(command);
      return;
    }

    // General health analysis
    if (lowerCommand.includes('analysis') || lowerCommand.includes('how am i') || lowerCommand.includes('health')) {
      this.runAgentAnalysis();
      return;
    }

    // Use the smart chat service for intent detection
    this.aiService.smartChatWithPhi3(command, this.aiService.getUserProfile()).subscribe({
      next: (result) => {
        const response = result.response;
        const actions = result.actions;

        this.messages.push(response);
        this.isLoading = false;
        this.scrollToBottom();

        // If AI detected nutritional data, show it on the dashboard immediately
        if (result.actionData) {
          const data = result.actionData;
          if (data.calories || data.waterAmount || data.glasses) {
            this.aiService.dashboardUpdate.emit({
              type: 'SHOW_MEAL_PREVIEW',
              data: {
                name: data.mealName || command,
                calories: data.calories || 0,
                carbs: data.carbs || 0,
                protein: data.protein || 0,
                fats: data.fats || 0,
                water: data.waterAmount || (data.glasses * 250) || 0
              }
            });
          }
        }

        // AUTOMATIC AGENT EXECUTION: If agentMode is active and intent is clear, execute automatically
        if (this.agentMode && actions && actions.length > 0) {
          this.messages.push({ role: 'system', content: '⚡ Agent: Automatic action in progress...' });

          actions.forEach(action => {
            // Automatically execute certain actions
            if (action.type === 'ADD_MEAL' && action.parameters) {
              this.handleSmartMealLogging(action.parameters.name || command, action.parameters);
            } else if (action.type === 'ADD_WATER' && action.parameters) {
              const amount = action.parameters.amount || action.parameters.glasses * 250 || 250;
              this.handleSmartWaterLogging(`Log ${amount}ml`);
            } else {
              // For others, just keep them as suggests if not safe
              this.executeAction(action);
            }
          });
        }

        // Also check if text contains menu for parsing suggestions
        if (response.content.includes('###') || response.content.includes('Suggest')) {
          this.addMealSuggestionsFromText(response.content);
        }
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: 'Sorry, I encountered an error with the smart agent.' });
        this.isLoading = false;
      }
    });
  }

  /**
   * Scroll to bottom of chat
   */
  scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }, 100);
    } catch (err) { }
  }

  handleDirectCalorieLog(amount: number): void {
    const meal = {
      name: `Quick Add (${amount} kcal)`,
      mealTime: this.determineMealTime(),
      foods: [{ name: 'Quick Calories', portion: '1 serving', calories: amount }],
      calories: amount,
      protein: 0,
      carbs: 0,
      fats: 0,
      recipe: 'Quick added calories manually.',
      tips: '',
      date: new Date().toISOString(),
      uniqueId: `quick-cal-${Date.now()}`,
      aiGenerated: false
    };

    this.isLoggingMeal = true;
    this.isLoading = true;
    this.saveMealAndUpdateStats(meal);
  }

  handleSmartWaterLogging(command: string): void {
    const amountMatch = command.match(/(\d+)\s*(?:ml|l|glass|cup)/i);
    let amount = 250; // default 250ml (1 glass)
    if (amountMatch) {
      let val = parseInt(amountMatch[1], 10);
      if (command.toLowerCase().includes('l') && !command.toLowerCase().includes('ml')) val *= 1000;
      amount = val;
    }

    this.waterService.addWaterIntake({ amount, date: new Date().toISOString() }).subscribe({
      next: () => {
        this.messages.push({ role: 'assistant', content: `💧 Added **${amount}ml** of water.\nYour dashboard has been updated!` });
        this.isLoading = false;
        this.loadAllUserData();
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: '❌ Failed to log water.' });
        this.isLoading = false;
        this.scrollToBottom();
      }
    });
  }

  extractFoodDescription(command: string): string {
    return command.replace(/^(I |he |she |we )?(ate|had|consumed|logged|log) /i, '').trim();
  }

  determineMealTime(): string {
    const hour = new Date().getHours();
    if (hour < 11) return 'Breakfast';
    if (hour < 16) return 'Lunch';
    return 'Dinner';
  }

  getCompleteNutritionEstimate(desc: string): any {
    // Mock estimation for immediate feedback
    return { calories: 300, protein: 15, carbs: 30, fat: 10, fiber: 5 };
  }

  saveLocalMeal(meal: any): void {
    const local = JSON.parse(localStorage.getItem('local_meals') || '[]');
    local.push(meal);
    localStorage.setItem('local_meals', JSON.stringify(local));
  }

  runQuickAnalysis(): void {
    this.runAgentAnalysis();
  }

  runAgentAnalysis(): void {
    this.isLoading = true;
    this.messages.push({ role: 'assistant', content: '📊 Running complete health analysis...' });
    this.scrollToBottom();

    // Gather data
    const totalWater = this.userWater.reduce((s, w) => s + (w.amount || 0), 0);
    const userData = JSON.stringify({
      calories: this.totalCalories,
      carbs: this.totalCarbs,
      protein: this.userMeals.reduce((s, m) => s + (m.totalProtein || m.protein || 0), 0),
      water: totalWater,
      meals: this.userMeals.length
    });

    this.aiService.quickAnalyzeWithPhi3(userData, this.isDiabetic).subscribe({
      next: (result: any) => {
        let msg = `### 🩺 Health Analysis\n\n**Health Score:** ${result.healthScore}/100\n\n**⚠️ Insight:** ${result.topAlert}\n\n**💡 Quick Tip:** ${result.quickTip}`;

        if (result.recommendations && result.recommendations.length) {
          msg += `\n\n**Recommendations:**\n` + result.recommendations.map((r: string) => `• ${r}`).join('\n');
        }

        if (result.waterDeficit > 0) {
          msg += `\n\n💧 **Hydration Alert:** You are ${result.waterDeficit}ml short of your goal.`;
        }

        this.messages.push({ role: 'assistant', content: msg });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Agent analysis failed', err);
        this.messages.push({ role: 'assistant', content: '❌ Analysis temporarily unavailable.' });
        this.isLoading = false;
        this.scrollToBottom();
      }
    });
  }

  startAgentMode(){
    this.showProfileSetup = false;
    this.startMonitoring();
    this.runAgentAnalysis();
    if (this.isDiabetic) {
      setTimeout(() => this.getMealSuggestions('dinner'), 800);
    }

    // Request automatic actions from backend when agent starts
    try {
      const userData = {
        calories: this.totalCalories || 0,
        carbs: this.totalCarbs || 0,
        protein: this.userMeals?.reduce((s: number, m: any) => s + ((m.totalProtein || m.protein) || 0), 0) || 0,
        water: this.waterTotal || 0,
        meals: this.mealsCount || 0
      };

      const sub = this.aiService.autoAct(userData, this.isDiabetic).subscribe({
        next: (actions: any) => {
          if (actions) {
            this.processAutoActions(actions);
          }
        },
        error: (err: any) => {
          console.warn('autoAct failed', err);
        }
      });

      this.subscriptions.push(sub);
    } catch (e) {
      console.warn('autoAct call failed', e);
    }
  }

  // Process actions returned by backend autoAct
  processAutoActions(actions: any): void {
    try {
      // Hydration reminder
      if (actions.water) {
        const w = actions.water;
        const amount = w.amount_ml || w.amount || 250;
        const msg = w.message || `Time to hydrate — suggested ${amount}ml.`;
        this.messages.push({ role: 'assistant', content: `💧 ${msg}` });
        this.updateAnalyticsAfterAutoAction({ type: 'water', amount });
      }

      // Carb-related suggestions (diabetic)
      if (actions.carbs) {
        const c = actions.carbs;
        const suggestions = Array.isArray(c.suggestions) ? c.suggestions : (c.meals || []);
        if (suggestions.length) {
          this.mealSuggestions = suggestions.map((m: any) => ({
            name: m.name || m.title || 'Suggestion',
            foods: m.foods || m.ingredients || [],
            totalCalories: m.totalCalories || m.calories || 0,
            totalCarbs: m.totalCarbs || m.carbs || 0,
            totalProtein: m.totalProtein || m.protein || 0,
            totalFat: m.totalFat || m.fats || 0,
            recipe: m.recipe || m.instructions || '',
            tips: m.tips || m.notes || ''
          }));

          if (this.mealSuggestions.length) {
            this.selectedMeal = this.mealSuggestions[0];
            this.messages.push({ role: 'assistant', content: `🍽️ I suggested ${this.mealSuggestions.length} low-carb options for you. Click one to log it.` });
            this.computeSuggestedTotals();
          }
        } else if (c.message) {
          this.messages.push({ role: 'assistant', content: `🍽️ ${c.message}` });
        }
      }

      // Protein tip
      if (actions.protein) {
        const p = actions.protein;
        this.messages.push({ role: 'assistant', content: `🍗 ${p.message || 'Consider a protein-rich snack.'}` });
      }

      // Generic success flag
      if (actions.success === false) {
        // Backend indicated failure or no-op; don't escalate
      }

      this.scrollToBottom();
    } catch (e) {
      console.warn('processAutoActions error', e);
    }
  }

  // Lightweight helper to update analytics after an automated action (e.g., log water locally)
  private updateAnalyticsAfterAutoAction(action: any): void {
    if (!action) return;
    if (action.type === 'water' || action.amount) {
      const amount = action.amount || action.amount_ml || 0;
      if (amount > 0) {
        // Emit dashboard event so other components can react
        this.aiService.updateDashboard('ADD_WATER', { amount, date: new Date().toISOString() });
        // update local counters for immediate UI feedback
        this.userWater = this.userWater || [];
        this.userWater.push({ amount, date: new Date().toISOString(), aiGenerated: true });
        this.waterTotal = (this.waterTotal || 0) + amount;
        this.messages.push({ role: 'assistant', content: `✅ Logged ${amount}ml water (auto-action).` });
      }
    }
  }

  // Enhanced extraction for commands containing quantities like '2 eggs, 150g chicken'
  private extractFoodsWithQuantities(text: string): Array<{ name: string; qty?: string }> {
    if (!text) return [];
    const items: Array<{ name: string; qty?: string }> = [];
    const parts = text.split(/[,;]|\band\b|\bwith\b/i).map(p => p.trim()).filter(Boolean);
    for (let part of parts) {
      const qtyMatch = part.match(/(\d+\s*(?:g|grams|kg|ml|l|cup|cups|glass|slice|slices|tbsp|tsp|tablespoon|teaspoon))\s+(.+)/i);
      if (qtyMatch) {
        items.push({ name: qtyMatch[2].trim(), qty: qtyMatch[1].trim() });
        continue;
      }
      const leadingNum = part.match(/^\s*(\d+)\s+(.+)$/);
      if (leadingNum) {
        items.push({ name: leadingNum[2].trim(), qty: leadingNum[1].trim() });
        continue;
      }
      items.push({ name: part });
    }
    return items;
  }

  // --- Missing helper methods added to satisfy template and agent interactions ---

  getAlertIcon(type: string): string {
    switch ((type || '').toLowerCase()) {
      case 'danger': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  }

  dismissAlert(alert: any): void {
    this.alerts = this.alerts.filter(a => a !== alert);
  }

  quickAction(action: string): void {
    switch (action) {
      case 'suggest-meal': this.currentMessage = 'Suggest a healthy meal'; this.sendMessage(); break;
      case 'log-water': this.currentMessage = 'Log 250ml water'; this.sendMessage(); break;
      case 'analyze': this.runAgentAnalysis(); break;
      default: console.warn('Unknown quick action', action);
    }
  }

  addUserProvidedMenu(): void {
    this.messages.push({ role: 'assistant', content: '🗂️ Feature not implemented: import menu. You can paste a menu and I will analyze it.' });
    this.scrollToBottom();
  }

  clearDashboard(): void { /* already present earlier but keep safe */ }
  syncLocal(): void { /* already present earlier but kept as safe no-op */ }

  toggleCondition(cond: string): void { const idx = this.selectedConditions.indexOf(cond); idx >= 0 ? this.selectedConditions.splice(idx,1) : this.selectedConditions.push(cond); }
  toggleDiet(diet: string): void { const idx = this.selectedDiets.indexOf(diet); idx >= 0 ? this.selectedDiets.splice(idx,1) : this.selectedDiets.push(diet); }
  toggleGoal(goal: string): void { const idx = this.selectedGoals.indexOf(goal); idx >= 0 ? this.selectedGoals.splice(idx,1) : this.selectedGoals = [goal]; }

  saveProfile(): void { this.aiService.updateUserProfile && this.aiService.updateUserProfile({ healthConditions: this.selectedConditions, dietaryRestrictions: this.selectedDiets, goals: this.selectedGoals }); this.userProfileSet = true; this.showProfileSetup = false; this.startAgentMode(); }
  skipProfile(): void { this.showProfileSetup = false; this.userProfileSet = false; this.startAgentMode(); }

  formatMessage(content: string | undefined | null): string {
    if (!content) return '';
    // simple markdown-ish to HTML: replace new lines and asterisks
    return (content + '').replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  executeAction(action: any): void {
    if (!action) return;
    action.status = 'executing';
    try {
      if (action.type === 'ADD_WATER') {
        const amount = action.parameters?.amount || 250;
        this.waterService.addWaterIntake({ amount, date: new Date().toISOString() }).subscribe({ next: () => { action.status = 'completed'; this.aiService.dashboardUpdate.emit({ type: 'ADD_WATER', data: { amount, date: new Date().toISOString() } }); this.loadAllUserData(); }, error: () => { action.status = 'failed'; } });
      } else if (action.type === 'ADD_MEAL') {
        const meal = action.parameters || { name: 'AI Meal', calories: 300 };
        this.saveMealAndUpdateStats({ name: meal.name || 'AI Meal', calories: meal.calories || 300, carbs: meal.carbs || 0, protein: meal.protein || 0, fats: meal.fats || 0, foods: meal.foods || [], date: new Date().toISOString() });
        action.status = 'completed';
      } else if (action.type === 'GET_SUGGESTIONS') {
        this.getMealSuggestions(action.parameters?.mealType || 'dinner'); action.status = 'completed';
      } else {
        console.warn('Unhandled action executeAction:', action.type);
        action.status = 'failed';
      }
    } catch (e) { action.status = 'failed'; }
  }

  getActionLabel(action: any): string {
    return action?.label || (action?.type || 'ACTION');
  }

  trackBySuggestion(index: number, item: any): any { return item?.name || index; }

  logMealFromSuggestion(suggestion: any): void {
    if (!suggestion) return;
    const meal = {
      name: suggestion.name || 'Suggested Meal',
      calories: suggestion.totalCalories || suggestion.calories || 300,
      carbs: suggestion.totalCarbs || suggestion.carbs || 0,
      protein: suggestion.totalProtein || suggestion.protein || 0,
      fats: suggestion.totalFat || suggestion.fats || 0,
      foods: suggestion.foods || [],
      date: new Date().toISOString()
    };
    this.saveMealAndUpdateStats(meal);
  }

  navigateToMeals(suggestion?: any): void {
    // emit dashboard update for other components to handle
    this.aiService.updateDashboard('SHOW_MEAL_PREVIEW', suggestion || {});
    // optionally navigate
    try { this.router.navigate(['/meals']); } catch (e) { /* ignore if router not available */ }
  }

  // Basic meal logging handler (used in several places)
  handleSmartMealLogging(command: string, parameters?: any): void {
    const desc = parameters?.name || this.extractFoodDescription(command) || command;
    // Try to parse quantities
    const foods = this.extractFoodsWithQuantities(desc);

    const estimate = this.getCompleteNutritionEstimate(desc);
    const meal = {
      name: parameters?.name || desc,
      calories: parameters?.calories || estimate.calories || 300,
      carbs: parameters?.carbs || estimate.carbs || 30,
      protein: parameters?.protein || estimate.protein || 15,
      fats: parameters?.fats || estimate.fat || 10,
      foods: foods.length ? foods.map(f => ({ name: f.name, portion: f.qty || '1 serving' })) : [{ name: desc, portion: '1 serving' }],
      date: new Date().toISOString()
    };

    this.messages.push({ role: 'assistant', content: `🍽️ Logging your meal: ${meal.name} — estimated ${meal.calories} kcal` });
    this.saveMealAndUpdateStats(meal);
  }

  addMealSuggestionsFromText(text: string): void {
    if (!text) return;
    // Very simple parser: split by lines and look for lines that look like '- Item (calories)'
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const suggestions: any[] = [];
    for (const line of lines) {
      if (/^-\s*/.test(line) || /\d+\s*kcal/i.test(line) || /calories/i.test(line)) {
        const name = line.replace(/^-\s*/,'').replace(/\(.*?\)/,'').trim();
        suggestions.push({ name, totalCalories: (line.match(/(\d+)\s*kcal/i)?.[1] ? parseInt(line.match(/(\d+)\s*kcal/i)![1],10) : 300), foods: [] });
      }
    }
    if (suggestions.length) {
      this.mealSuggestions = suggestions;
      this.selectedMeal = suggestions[0];
      this.computeSuggestedTotals();
    }
  }

  getMealSuggestions(mealType: string): void {
    // Prefer backend enhanced diabetic plan if available
    try {
      this.aiService.generateDiabeticMealPlan(mealType).subscribe({ next: (sugs: any[]) => { if (sugs && sugs.length) { this.mealSuggestions = sugs; this.selectedMeal = sugs[0]; this.computeSuggestedTotals(); this.messages.push({ role: 'assistant', content: `🍽️ I found ${sugs.length} suggested ${mealType} options.` }); this.scrollToBottom();
            // emit dashboard update so the agent can populate the dashboard automatically
            try { this.aiService.updateDashboard('SHOW_MEAL_PREVIEW', sugs); } catch (e) { /* ignore */ }
       } }, error: (e) => { console.warn('getMealSuggestions failed', e); } });
    } catch (e) { console.warn('getMealSuggestions error', e); }
  }

  computeSuggestedTotals(): void {
    if (!this.mealSuggestions || !this.mealSuggestions.length) { this.suggestedMealsCount = 0; this.suggestedCalories = 0; this.suggestedCarbs = 0; return; }
    this.suggestedMealsCount = this.mealSuggestions.length;
    this.suggestedCalories = this.mealSuggestions.reduce((s, m) => s + (m.totalCalories || m.calories || 0), 0);
    this.suggestedCarbs = this.mealSuggestions.reduce((s, m) => s + (m.totalCarbs || m.carbs || 0), 0);
  }

  saveMealAndUpdateStats(meal: any): void {
    try {
      if (this.mealService && typeof this.mealService.createMeal === 'function') {
        this.mealService.createMeal(meal).subscribe({ next: (res: any) => { this.messages.push({ role: 'assistant', content: '✅ Meal saved.' }); this.loadAllUserData(); this.scrollToBottom(); }, error: (err: any) => { console.warn('createMeal failed', err); this.saveLocalMeal(meal); this.loadAllUserData(); this.messages.push({ role: 'assistant', content: '⚠️ Meal saved locally (offline).' }); this.scrollToBottom(); } });
      } else {
        this.saveLocalMeal(meal);
        this.messages.push({ role: 'assistant', content: '✅ Meal saved locally.' });
        this.loadAllUserData();
        this.scrollToBottom();
      }
    } catch (e) {
      console.warn('saveMealAndUpdateStats error', e);
      this.saveLocalMeal(meal);
      this.messages.push({ role: 'assistant', content: '⚠️ Meal saved locally (error path).' });
      this.loadAllUserData();
      this.scrollToBottom();
    }
  }

}

