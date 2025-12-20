import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MealService } from '../../services/meal.service';
import { WaterService } from '../../services/water.service';
import { FoodService } from '../../services/food.service';
import { AiService } from '../../services/ai.service';
import { GoalsSyncService } from '../../services/goals-sync.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- Smart Header with AI Status -->
      <header class="smart-header">
        <div class="header-left">
          <h1>🍎 Makla</h1>
          <span class="ai-status" [class.active]="aiActive">
            <span class="status-dot"></span>
            {{ aiActive ? 'AI Active' : 'AI Ready' }}
          </span>
        </div>
        <div class="header-center">
          <p class="greeting">{{ getGreeting() }}, <strong>{{ currentUser?.username || 'User' }}</strong>!</p>
          <p class="date">{{ todayDate }}</p>
        </div>
        <div class="header-right">
          <button class="btn-icon" (click)="toggleNotifications()" title="Notifications">
            🔔
            <span *ngIf="notifications.length > 0" class="notif-badge">{{ notifications.length }}</span>
          </button>
          <button class="btn-logout" (click)="logout()">Déconnexion</button>
        </div>
      </header>

      <!-- AI Insight Banner -->
      <div class="ai-insight-banner" *ngIf="aiInsight" (click)="openAiChat()">
        <span class="insight-icon">💡</span>
        <p class="insight-text">{{ aiInsight }}</p>
        <button class="insight-action">Ask AI →</button>
      </div>

      <!-- Main Stats Row -->
      <div class="stats-row">
        <!-- Calories Ring -->
        <div class="stat-card main-stat">
          <div class="ring-container">
            <svg class="progress-ring" viewBox="0 0 120 120">
              <circle class="ring-bg" cx="60" cy="60" r="52"/>
              <circle class="ring-progress calories-ring" cx="60" cy="60" r="52" 
                      [style.strokeDasharray]="getCircleProgress(todayCalories + previewCalories, caloriesGoal)"/>
            </svg>
            <div class="ring-content">
              <span class="ring-icon">🔥</span>
              <span class="ring-value">{{ todayCalories + previewCalories }}</span>
              <span class="ring-label">/ {{ caloriesGoal }} cal</span>
            </div>
          </div>
          <h3>Calories</h3>
          <div class="stat-trend" [class.positive]="caloriesTrend >= 0">
            {{ caloriesTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(caloriesTrend) }}% vs hier
          </div>
        </div>

        <!-- Water Ring -->
        <div class="stat-card main-stat">
          <div class="ring-container">
            <svg class="progress-ring" viewBox="0 0 120 120">
              <circle class="ring-bg" cx="60" cy="60" r="52"/>
              <circle class="ring-progress water-ring" cx="60" cy="60" r="52"
                      [style.strokeDasharray]="getCircleProgress(todayWater + previewWater, waterGoal)"/>
            </svg>
            <div class="ring-content">
              <span class="ring-icon">💧</span>
              <span class="ring-value">{{ todayWater + previewWater }}</span>
              <span class="ring-label">/ {{ waterGoal }} ml</span>
            </div>
          </div>
          <h3>Hydratation</h3>
          <button class="quick-add-btn" (click)="quickAddWater()">+ 250ml</button>
        </div>

        <!-- Meals Today -->
        <div class="stat-card main-stat">
          <div class="meals-visual">
            <div class="meal-slot" [class.filled]="todayMeals >= 1" title="Petit-déjeuner">🌅</div>
            <div class="meal-slot" [class.filled]="todayMeals >= 2" title="Déjeuner">☀️</div>
            <div class="meal-slot" [class.filled]="todayMeals >= 3" title="Dîner">🌙</div>
          </div>
          <div class="meals-count">
            <span class="big-number">{{ todayMeals + previewMeals }}</span>
            <span class="label">repas</span>
          </div>
          <h3>Repas du Jour</h3>
          <button class="quick-add-btn" routerLink="/meals">+ Ajouter</button>
        </div>
      </div>

      <!-- Chosen Meal Detail Display (NEW) -->
      <div class="chosen-meal-detail" *ngIf="selectedMealDetail" [@slideIn]>
        <div class="detail-header">
          <div class="detail-title">
            <span class="detail-icon">🍽️</span>
            <div>
              <h3>Détails du repas choisi</h3>
              <p>{{ selectedMealDetail.name }}</p>
            </div>
          </div>
          <button class="close-detail" (click)="selectedMealDetail = null">✕</button>
        </div>
        <div class="detail-stats-grid">
          <div class="detail-stat-item">
            <span class="stat-label">🔥 Calories</span>
            <span class="stat-value">{{ selectedMealDetail.calories || 0 }} kcal</span>
          </div>
          <div class="detail-stat-item">
            <span class="stat-label">💧 Eau</span>
            <span class="stat-value">{{ selectedMealDetail.water || 0 }} ml</span>
          </div>
          <div class="detail-stat-item">
            <span class="stat-label">🍞 Glucides</span>
            <span class="stat-value">{{ selectedMealDetail.carbs || 0 }} g</span>
          </div>
          <div class="detail-stat-item">
            <span class="stat-label">🥩 Protéines</span>
            <span class="stat-value">{{ selectedMealDetail.protein || 0 }} g</span>
          </div>
        </div>
        <div class="detail-actions" *ngIf="!selectedMealDetail.saved">
          <p>L'IA a sélectionné ce repas pour vous. Il a été ajouté à votre journal.</p>
        </div>
      </div>

      <!-- Macros Section -->
      <div class="macros-section">
        <h2>📊 Macronutriments</h2>
        <div class="macros-grid">
          <div class="macro-card protein">
            <div class="macro-header">
              <span class="macro-icon">🥩</span>
              <span class="macro-name">Protéines</span>
            </div>
            <div class="macro-value">{{ todayProtein + previewProtein }}g</div>
            <div class="macro-bar">
              <div class="macro-fill" [style.width.%]="getPercent(todayProtein + previewProtein, proteinGoal)"></div>
            </div>
            <span class="macro-goal">Objectif: {{ proteinGoal }}g</span>
          </div>

          <div class="macro-card carbs">
            <div class="macro-header">
              <span class="macro-icon">🍞</span>
              <span class="macro-name">Glucides</span>
            </div>
            <div class="macro-value" [class.warning]="isDiabetic && (todayCarbs + previewCarbs) > 100">{{ todayCarbs + previewCarbs }}g</div>
            <div class="macro-bar">
              <div class="macro-fill" [style.width.%]="getPercent(todayCarbs + previewCarbs, carbsGoal)" 
                   [class.warning]="isDiabetic && (todayCarbs + previewCarbs) > 100"></div>
            </div>
            <span class="macro-goal">{{ isDiabetic ? 'Limite: ' + carbsGoal + 'g' : 'Objectif: ' + carbsGoal + 'g' }}</span>
          </div>

          <div class="macro-card fats">
            <div class="macro-header">
              <span class="macro-icon">🥑</span>
              <span class="macro-name">Lipides</span>
            </div>
            <div class="macro-value">{{ todayFats + previewFats }}g</div>
            <div class="macro-bar">
              <div class="macro-fill" [style.width.%]="getPercent(todayFats + previewFats, fatsGoal)"></div>
            </div>
            <span class="macro-goal">Objectif: {{ fatsGoal }}g</span>
          </div>

          <div class="macro-card fiber">
            <div class="macro-header">
              <span class="macro-icon">🌾</span>
              <span class="macro-name">Fibres</span>
            </div>
            <div class="macro-value">{{ todayFiber }}g</div>
            <div class="macro-bar">
              <div class="macro-fill" [style.width.%]="getPercent(todayFiber, 25)"></div>
            </div>
            <span class="macro-goal">Objectif: 25g</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions-section">
        <h2>⚡ Actions Rapides</h2>
        <div class="actions-row">
          <button class="action-chip" (click)="quickLog('breakfast')">
            🌅 Petit-déj
          </button>
          <button class="action-chip" (click)="quickLog('lunch')">
            ☀️ Déjeuner
          </button>
          <button class="action-chip" (click)="quickLog('dinner')">
            🌙 Dîner
          </button>
          <button class="action-chip" (click)="quickLog('snack')">
            🍎 Snack
          </button>
          <button class="action-chip water" (click)="quickAddWater()">
            💧 +Eau
          </button>
          <button class="action-chip ai" (click)="openAiChat()">
            🤖 Ask AI
          </button>
        </div>
      </div>

      <!-- Today's Meals Timeline -->
      <div class="timeline-section" *ngIf="recentMeals.length > 0">
        <h2>🍽️ Repas d'Aujourd'hui</h2>
        <div class="meals-timeline">
          <div *ngFor="let meal of recentMeals" class="timeline-item">
            <div class="timeline-icon">{{ getMealIcon(meal.mealTime) }}</div>
            <div class="timeline-content">
              <h4>{{ meal.name }}</h4>
              <div class="timeline-macros">
                <span>🔥 {{ meal.calories || 0 }} cal</span>
                <span>🥩 {{ meal.protein || 0 }}g</span>
                <span>🍞 {{ meal.carbs || 0 }}g</span>
              </div>
            </div>
            <div class="timeline-time">{{ formatTime(meal.date) }}</div>
          </div>
        </div>
      </div>

      <!-- AI Suggestions Panel -->
      <div class="ai-suggestions" *ngIf="aiSuggestions.length > 0">
        <h2>🤖 Suggestions IA</h2>
        <div class="suggestions-scroll">
          <div *ngFor="let suggestion of aiSuggestions" class="suggestion-card" (click)="applySuggestion(suggestion)">
            <span class="suggestion-icon">{{ suggestion.icon }}</span>
            <div class="suggestion-content">
              <h4>{{ suggestion.title }}</h4>
              <p>{{ suggestion.description }}</p>
            </div>
            <span class="suggestion-arrow">→</span>
          </div>
        </div>
      </div>

      <!-- Weekly Chart -->
      <div class="chart-section">
        <div class="chart-header">
          <h2>📈 Cette Semaine</h2>
          <div class="chart-tabs">
            <button [class.active]="chartType === 'calories'" (click)="chartType = 'calories'">Calories</button>
            <button [class.active]="chartType === 'water'" (click)="chartType = 'water'">Eau</button>
            <button [class.active]="chartType === 'protein'" (click)="chartType = 'protein'">Protéines</button>
          </div>
        </div>
        <div class="chart-container">
          <div class="chart-bars">
            <div *ngFor="let day of weekData; let i = index" class="chart-bar-wrapper">
              <div class="chart-bar" 
                   [style.height.%]="getBarHeight(day[chartType])"
                   [class.today]="i === todayIndex"
                   [title]="day[chartType] + (chartType === 'water' ? 'ml' : chartType === 'calories' ? ' cal' : 'g')">
                <span class="bar-tooltip">{{ day[chartType] }}</span>
              </div>
              <span class="bar-day" [class.today]="i === todayIndex">{{ day.day }}</span>
            </div>
          </div>
          <div class="chart-goal-line" [style.bottom.%]="getGoalLinePosition()">
            <span class="goal-label">Objectif</span>
          </div>
        </div>
      </div>

      <!-- Health Score -->
      <div class="health-score-section">
        <div class="score-card">
          <h3>🏆 Score Santé</h3>
          <div class="score-ring">
            <svg viewBox="0 0 100 100">
              <circle class="score-bg" cx="50" cy="50" r="45"/>
              <circle class="score-fill" cx="50" cy="50" r="45" 
                      [style.strokeDasharray]="getScoreProgress(healthScore)"/>
            </svg>
            <span class="score-value">{{ healthScore }}</span>
          </div>
          <p class="score-message">{{ getScoreMessage() }}</p>
        </div>
        <div class="score-breakdown">
          <div class="score-item">
            <span class="item-label">Nutrition</span>
            <div class="item-bar"><div [style.width.%]="nutritionScore"></div></div>
            <span class="item-value">{{ nutritionScore }}%</span>
          </div>
          <div class="score-item">
            <span class="item-label">Hydratation</span>
            <div class="item-bar"><div [style.width.%]="hydrationScore"></div></div>
            <span class="item-value">{{ hydrationScore }}%</span>
          </div>
          <div class="score-item">
            <span class="item-label">Équilibre</span>
            <div class="item-bar"><div [style.width.%]="balanceScore"></div></div>
            <span class="item-value">{{ balanceScore }}%</span>
          </div>
        </div>
      </div>

      <!-- Notifications Panel -->
      <div class="notifications-panel" *ngIf="showNotifications">
        <div class="panel-header">
          <h3>🔔 Notifications</h3>
          <button (click)="showNotifications = false">✕</button>
        </div>
        <div class="notif-list">
          <div *ngFor="let notif of notifications" class="notif-item" [class]="notif.type">
            <span class="notif-icon">{{ notif.icon }}</span>
            <div class="notif-content">
              <strong>{{ notif.title }}</strong>
              <p>{{ notif.message }}</p>
            </div>
          </div>
          <p *ngIf="notifications.length === 0" class="no-notifs">Aucune notification</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 20px;
      color: white;
    }

    /* Smart Header */
    .smart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 25px;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      margin-bottom: 20px;
    }

    .header-left h1 {
      margin: 0;
      font-size: 1.8rem;
      background: linear-gradient(90deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .ai-status {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.75rem;
      color: #888;
      margin-top: 5px;
    }

    .ai-status.active { color: #4CAF50; }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #888;
    }

    .ai-status.active .status-dot {
      background: #4CAF50;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .header-center {
      text-align: center;
    }

    .greeting {
      margin: 0;
      font-size: 1.1rem;
      color: #fff;
    }

    .date {
      margin: 5px 0 0;
      font-size: 0.85rem;
      color: #aaa;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .btn-icon {
      position: relative;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 8px;
    }

    .notif-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #e74c3c;
      color: white;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 10px;
    }

    .btn-logout {
      padding: 10px 20px;
      background: rgba(231, 76, 60, 0.8);
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-logout:hover {
      background: #e74c3c;
      transform: scale(1.05);
    }

    /* AI Insight Banner */
    .ai-insight-banner {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px 20px;
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
      border: 1px solid rgba(102, 126, 234, 0.5);
      border-radius: 15px;
      margin-bottom: 20px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .ai-insight-banner:hover {
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5));
      transform: translateY(-2px);
    }

    .insight-icon { font-size: 1.5rem; }
    .insight-text { flex: 1; margin: 0; font-size: 0.95rem; }
    .insight-action {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 8px 15px;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 600;
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 25px;
    }

    .stat-card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 25px;
      text-align: center;
      transition: all 0.3s;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      background: rgba(255,255,255,0.15);
    }

    .stat-card h3 {
      margin: 15px 0 10px;
      font-size: 1rem;
      color: #ddd;
    }

    /* Progress Rings */
    .ring-container {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto;
    }

    .progress-ring {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .ring-bg {
      fill: none;
      stroke: rgba(255,255,255,0.1);
      stroke-width: 8;
    }

    .ring-progress {
      fill: none;
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dasharray 0.5s ease;
    }

    .calories-ring { stroke: url(#caloriesGradient); stroke: #ff6b6b; }
    .water-ring { stroke: #4dabf7; }

    .ring-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .ring-icon { font-size: 1.2rem; display: block; }
    .ring-value { font-size: 1.5rem; font-weight: bold; display: block; }
    .ring-label { font-size: 0.7rem; color: #aaa; }

    .stat-trend {
      font-size: 0.8rem;
      color: #aaa;
      margin-top: 5px;
    }

    .stat-trend.positive { color: #4CAF50; }

    .quick-add-btn {
      margin-top: 10px;
      padding: 8px 20px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .quick-add-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    /* Meals Visual */
    .meals-visual {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-bottom: 10px;
    }

    .meal-slot {
      font-size: 2rem;
      opacity: 0.3;
      transition: all 0.3s;
    }

    .meal-slot.filled {
      opacity: 1;
      transform: scale(1.1);
    }

    .meals-count {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 5px;
    }

    .big-number {
      font-size: 2.5rem;
      font-weight: bold;
      background: linear-gradient(90deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* Macros Section */
    .macros-section {
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      padding: 25px;
      margin-bottom: 25px;
    }

    .macros-section h2 {
      margin: 0 0 20px;
      font-size: 1.2rem;
    }

    .macros-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
    }

    .macro-card {
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 15px;
    }

    .macro-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .macro-icon { font-size: 1.2rem; }
    .macro-name { font-size: 0.85rem; color: #aaa; }

    .macro-value {
      font-size: 1.8rem;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .macro-value.warning { color: #ff9800; }

    .macro-bar {
      height: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .macro-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s;
    }

    .protein .macro-fill { background: #e74c3c; }
    .carbs .macro-fill { background: #f39c12; }
    .carbs .macro-fill.warning { background: #ff5722; }
    .fats .macro-fill { background: #27ae60; }
    .fiber .macro-fill { background: #9b59b6; }

    .macro-goal {
      font-size: 0.75rem;
      color: #888;
    }

    /* Quick Actions */
    .quick-actions-section {
      margin-bottom: 25px;
    }

    .quick-actions-section h2 {
      margin: 0 0 15px;
      font-size: 1.2rem;
    }

    .actions-row {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 5px 0;
    }

    .action-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 25px;
      color: white;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.3s;
      font-size: 0.9rem;
    }

    .action-chip:hover {
      background: rgba(255,255,255,0.2);
      transform: scale(1.05);
    }

    .action-chip.water { border-color: #4dabf7; }
    .action-chip.ai { 
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
      border-color: #667eea;
    }

    /* Timeline */
    .timeline-section {
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      padding: 25px;
      margin-bottom: 25px;
    }

    .timeline-section h2 {
      margin: 0 0 20px;
      font-size: 1.2rem;
    }

    .meals-timeline {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .timeline-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      transition: all 0.3s;
    }

    .timeline-item:hover {
      background: rgba(255,255,255,0.1);
      transform: translateX(5px);
    }

    .timeline-icon {
      font-size: 1.5rem;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
    }

    .timeline-content {
      flex: 1;
    }

    .timeline-content h4 {
      margin: 0 0 5px;
      font-size: 1rem;
    }

    .timeline-macros {
      display: flex;
      gap: 15px;
      font-size: 0.8rem;
      color: #aaa;
    }

    .timeline-time {
      font-size: 0.85rem;
      color: #888;
    }

    /* AI Suggestions */
    .ai-suggestions {
      margin-bottom: 25px;
    }

    .ai-suggestions h2 {
      margin: 0 0 15px;
      font-size: 1.2rem;
    }

    .suggestions-scroll {
      display: flex;
      gap: 15px;
      overflow-x: auto;
      padding: 5px 0;
    }

    .suggestion-card {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 280px;
      padding: 15px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 15px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .suggestion-card:hover {
      transform: scale(1.02);
      border-color: #667eea;
    }

    .suggestion-icon { font-size: 2rem; }

    .suggestion-content {
      flex: 1;
    }

    .suggestion-content h4 {
      margin: 0 0 5px;
      font-size: 0.95rem;
    }

    .suggestion-content p {
      color: #aaa;
      font-size: 0.8rem;
    }

    /* Chosen Meal Detail */
    .chosen-meal-detail {
        background: linear-gradient(135deg, #2c3e50, #000000);
        border: 2px solid #667eea;
        border-radius: 20px;
        padding: 20px;
        margin-bottom: 25px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        animation: slideIn 0.4s ease-out;
    }

    .chosen-meal-detail .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
    }

    .detail-title {
        display: flex;
        gap: 15px;
        align-items: center;
    }

    .detail-icon {
        font-size: 2.5rem;
        background: rgba(255,255,255,0.1);
        padding: 10px;
        border-radius: 15px;
    }

    .detail-title h3 { margin: 0; font-size: 1.2rem; color: #667eea; }
    .detail-title p { margin: 5px 0 0; font-size: 1.4rem; font-weight: bold; }

    .close-detail {
        background: none;
        border: none;
        color: #888;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 5px;
    }

    .detail-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 20px;
    }

    .detail-stat-item {
        background: rgba(255,255,255,0.05);
        padding: 15px;
        border-radius: 12px;
        text-align: center;
        border: 1px solid rgba(255,255,255,0.1);
    }

    .detail-stat-item .stat-label {
        display: block;
        font-size: 0.8rem;
        color: #aaa;
        margin-bottom: 5px;
    }

    .detail-stat-item .stat-value {
        font-size: 1.2rem;
        font-weight: bold;
    }

    .detail-actions {
        font-size: 0.9rem;
        color: #4CAF50;
        text-align: center;
        font-style: italic;
    }

    @keyframes slideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    .suggestion-arrow {
      font-size: 1.2rem;
      color: #667eea;
    }

    /* Chart Section */
    .chart-section {
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      padding: 25px;
      margin-bottom: 25px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .chart-header h2 {
      margin: 0;
      font-size: 1.2rem;
    }

    .chart-tabs {
      display: flex;
      gap: 5px;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 4px;
    }

    .chart-tabs button {
      padding: 8px 15px;
      background: none;
      border: none;
      color: #aaa;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .chart-tabs button.active {
      background: linear-gradient(90deg, #667eea, #764ba2);
      color: white;
    }

    .chart-container {
      position: relative;
      height: 200px;
    }

    .chart-bars {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 100%;
      padding: 20px 0;
    }

    .chart-bar-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }

    .chart-bar {
      width: 40px;
      background: linear-gradient(to top, #667eea, #764ba2);
      border-radius: 8px 8px 0 0;
      position: relative;
      transition: all 0.3s;
      min-height: 10px;
    }

    .chart-bar.today {
      background: linear-gradient(to top, #4CAF50, #81C784);
    }

    .chart-bar:hover {
      opacity: 0.8;
    }

    .bar-tooltip {
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 0.75rem;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .chart-bar:hover .bar-tooltip {
      opacity: 1;
    }

    .bar-day {
      margin-top: 10px;
      font-size: 0.8rem;
      color: #888;
    }

    .bar-day.today {
      color: #4CAF50;
      font-weight: bold;
    }

    .chart-goal-line {
      position: absolute;
      left: 0;
      right: 0;
      border-top: 2px dashed rgba(255,255,255,0.3);
    }

    .goal-label {
      position: absolute;
      right: 0;
      top: -20px;
      font-size: 0.7rem;
      color: #888;
    }

    /* Health Score */
    .health-score-section {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 30px;
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      padding: 25px;
      margin-bottom: 25px;
    }

    .score-card {
      text-align: center;
    }

    .score-card h3 {
      margin: 0 0 15px;
      font-size: 1rem;
    }

    .score-ring {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 15px;
    }

    .score-ring svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .score-bg {
      fill: none;
      stroke: rgba(255,255,255,0.1);
      stroke-width: 8;
    }

    .score-fill {
      fill: none;
      stroke: #4CAF50;
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dasharray 0.5s;
    }

    .score-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 2rem;
      font-weight: bold;
    }

    .score-message {
      margin: 0;
      font-size: 0.9rem;
      color: #aaa;
    }

    .score-breakdown {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 20px;
    }

    .score-item {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .item-label {
      width: 100px;
      font-size: 0.9rem;
      color: #aaa;
    }

    .item-bar {
      flex: 1;
      height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .item-bar div {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 4px;
      transition: width 0.5s;
    }

    .item-value {
      width: 50px;
      text-align: right;
      font-weight: bold;
    }

    /* Notifications Panel */
    .notifications-panel {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 320px;
      background: rgba(30, 30, 50, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 100;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .panel-header h3 { margin: 0; font-size: 1rem; }
    .panel-header button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 1.2rem;
    }

    .notif-list {
      max-height: 300px;
      overflow-y: auto;
      padding: 10px;
    }

    .notif-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 10px;
      margin-bottom: 8px;
      background: rgba(255,255,255,0.05);
    }

    .notif-item.warning { border-left: 3px solid #ff9800; }
    .notif-item.success { border-left: 3px solid #4CAF50; }
    .notif-item.info { border-left: 3px solid #2196F3; }

    .notif-icon { font-size: 1.2rem; }

    .notif-content strong { display: block; margin-bottom: 3px; font-size: 0.9rem; }
    .notif-content p { margin: 0; font-size: 0.8rem; color: #aaa; }

    .no-notifs {
      text-align: center;
      color: #888;
      padding: 20px;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .stats-row { grid-template-columns: 1fr; }
      .macros-grid { grid-template-columns: repeat(2, 1fr); }
      .health-score-section { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .smart-header { flex-direction: column; gap: 15px; text-align: center; }
      .macros-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  Math = Math;
  currentUser: any = null;
  aiActive = false;
  showNotifications = false;
  selectedMealDetail: any = null;

  // Stats
  todayCalories = 0;
  caloriesGoal = 2000;
  todayMeals = 0;
  todayWater = 0;
  waterGoal = 2500;
  todayProtein = 0;
  proteinGoal = 60;
  todayCarbs = 0;
  carbsGoal = 250;
  todayFats = 0;
  fatsGoal = 65;
  todayFiber = 0;

  caloriesTrend = 5;
  isDiabetic = false;

  // Health Score
  healthScore = 75;
  nutritionScore = 70;
  hydrationScore = 80;
  balanceScore = 75;

  // Chart
  chartType: 'calories' | 'water' | 'protein' = 'calories';
  todayIndex = new Date().getDay();
  weekData = [
    { day: 'Lun', calories: 1800, water: 2200, protein: 55 },
    { day: 'Mar', calories: 2100, water: 2400, protein: 62 },
    { day: 'Mer', calories: 1950, water: 2100, protein: 58 },
    { day: 'Jeu', calories: 2200, water: 2600, protein: 65 },
    { day: 'Ven', calories: 1850, water: 2300, protein: 52 },
    { day: 'Sam', calories: 2050, water: 2500, protein: 60 },
    { day: 'Dim', calories: 1900, water: 2000, protein: 48 }
  ];

  recentMeals: any[] = [];

  // Preview Stats (from AI Chat)
  previewCalories = 0;
  previewWater = 0;
  previewProtein = 0;
  previewCarbs = 0;
  previewFats = 0;
  previewMeals = 0;

  // AI
  aiInsight = '';
  aiSuggestions: any[] = [];
  notifications: any[] = [];

  todayDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private mealService: MealService,
    private waterService: WaterService,
    private foodService: FoodService,
    private aiService: AiService,
    private goalsService: GoalsSyncService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.setupSubscriptions();
    this.setupAI();
    this.generateInsights();
  }

  private setupSubscriptions() {
    // 1. Subscribe to Meals for real-time dashboard updates
    this.subscriptions.push(
      this.mealService.meals$.subscribe(meals => {
        console.log('🔄 Dashboard: Recieved meals update from service', meals.length);
        const today = new Date().toDateString();
        const todayMealsArray = (meals || []).filter(m => {
          const mDate = m.date;
          return mDate && new Date(mDate).toDateString() === today;
        });

        this.recentMeals = todayMealsArray.slice(0, 5);
        this.todayMeals = todayMealsArray.length;
        this.todayCalories = todayMealsArray.reduce((sum, m) => sum + (m.totalCalories || m.calories || 0), 0);
        this.todayProtein = todayMealsArray.reduce((sum, m) => sum + (m.protein || 0), 0);
        this.todayCarbs = todayMealsArray.reduce((sum, m) => sum + (m.carbs || 0), 0);
        this.todayFats = todayMealsArray.reduce((sum, m) => sum + (m.fats || 0), 0);

        // Reset previews when real data arrives
        this.previewCalories = 0;
        this.previewProtein = 0;
        this.previewCarbs = 0;
        this.previewFats = 0;
        this.previewMeals = 0;

        this.updateHealthScore();
        this.generateSuggestions();
      })
    );

    // 2. Subscribe to Water for real-time dashboard updates
    this.subscriptions.push(
      this.waterService.waterIntakes$.subscribe(intakes => {
        console.log('💧 Dashboard: Recieved water update from service', intakes.length);
        const today = new Date().toDateString();
        const todayIntakes = (intakes || []).filter(i => {
          const iDate = i.date || i.time;
          return iDate && new Date(iDate).toDateString() === today;
        });

        this.todayWater = todayIntakes.reduce((sum, i) => sum + (i.amount || 0), 0);
        this.updateHealthScore();
        this.generateSuggestions();
      })
    );

    // 3. Subscribe to Goals for synchronization
    this.subscriptions.push(
      this.goalsService.goals$.subscribe(goals => {
        if (goals) {
          console.log('🎯 Dashboard: Received goals update:', goals);
          this.caloriesGoal = goals.calories;
          this.waterGoal = goals.water;
          this.proteinGoal = goals.protein;
          this.carbsGoal = goals.carbs;
          this.fatsGoal = goals.fat;
          // Note: fiber goal could also be synchronized if needed
          this.updateHealthScore();
        }
      })
    );

    // 4. Trigger initial load
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  loadDashboardData() {
    this.mealService.refreshTodayMeals();
    this.waterService.getTodayIntake().subscribe();
  }

  setupAI() {
    const profile = this.aiService.getUserProfile();
    this.isDiabetic = profile.healthConditions?.includes('Diabetic') || false;

    if (this.isDiabetic) {
      this.carbsGoal = 130;
    }

    this.subscriptions.push(
      this.aiService.agentActive$.subscribe(active => this.aiActive = active)
    );

    // Subscribe to AI dashboard updates (when AI agent adds meals or water)
    this.subscriptions.push(
      this.aiService.dashboardUpdate.subscribe(update => {
        this.handleDashboardUpdate(update);
      })
    );
  }

  /**
   * Handle updates from AI agent
   */
  handleDashboardUpdate(update: any) {
    console.log('📊 Dashboard: Received update:', update);

    switch (update.type) {
      case 'ADD_MEAL':
        if (update.data) {
          console.log('✅ Dashboard: AI Added meal notification received');
          // No need to update stats here as the subscription to mealService.meals$ will handle it
          // when the service emits the new list after creation

          this.notifications.unshift({
            type: 'success',
            icon: '🍽️',
            title: 'Repas ajouté par AI',
            message: `${update.data.name}: ${update.data.calories || update.data.totalCalories} kcal`
          });
          this.selectedMealDetail = { ...update.data, saved: true };
        }
        break;

      case 'ADD_WATER':
        if (update.data) {
          // No need to update stats here as the subscription to waterService.waterIntakes$ will handle it

          this.notifications.unshift({
            type: 'success',
            icon: '💧',
            title: 'Eau ajoutée par AI',
            message: `+${update.data.amount}ml enregistrés`
          });
        }
        break;

      case 'REFRESH_DATA':
        this.loadDashboardData();
        break;

      case 'UPDATE_GOALS':
        if (update.data) {
          if (update.data.calories) this.caloriesGoal = update.data.calories;
          if (update.data.water) this.waterGoal = update.data.water;
          if (update.data.carbs) this.carbsGoal = update.data.carbs;
          this.updateHealthScore();
        }
        break;

      case 'UPDATE_INSIGHTS':
        if (update.data?.insights?.length > 0) {
          this.aiInsight = update.data.insights[0];
        }
        break;

      case 'SHOW_MEAL_PREVIEW':
        if (update.data) {
          // 🎯 PREVIEW MODE: Display meal info WITHOUT saving permanently
          // This shows the nutritional info on the dashboard in real-time

          // Update preview stats instead of adding to totals directly
          this.previewCalories = update.data.calories || 0;
          this.previewProtein = update.data.protein || 0;
          this.previewCarbs = update.data.carbs || 0;
          this.previewFats = update.data.fats || 0;
          this.previewWater = update.data.water || 0;
          this.previewMeals = 1;

          // Update health score with totals + previews
          this.updateHealthScore();

          // Show AI insight about the suggested meal
          this.aiInsight = `🤖 Analyse IA: ${update.data.name} (+${update.data.calories} kcal détectés)`;

          // Show notification
          if (!this.notifications.some(n => n.message.includes(update.data.name))) {
            this.notifications.unshift({
              type: 'info',
              icon: '🤖',
              title: 'Analyse IA en temps réel',
              message: `${update.data.name}: ${update.data.calories} kcal (Détecté dans le chat)`
            });
          }

          // Set as selected detail for display
          this.selectedMealDetail = update.data;
        }
        break;

      case 'CLEAR_PREVIEW':
        this.selectedMealDetail = null;
        break;
    }

    // Regenerate suggestions after any update
    this.generateSuggestions();
  }

  generateInsights() {
    // Generate smart insight based on current data
    setTimeout(() => {
      if (this.todayWater < 1000) {
        this.aiInsight = "💧 Vous n'avez bu que " + this.todayWater + "ml d'eau. Pensez à vous hydrater!";
      } else if (this.todayMeals === 0) {
        this.aiInsight = "🍳 Vous n'avez pas encore enregistré de repas aujourd'hui. Commencez par le petit-déjeuner!";
      } else if (this.isDiabetic && this.todayCarbs > 100) {
        this.aiInsight = "⚠️ Attention: " + this.todayCarbs + "g de glucides consommés. Limite recommandée: 130g";
      } else {
        this.aiInsight = "👍 Vous êtes sur la bonne voie! Continuez comme ça.";
      }

      this.generateSuggestions();
    }, 500);
  }

  generateSuggestions() {
    this.aiSuggestions = [];

    if (this.todayMeals < 3) {
      this.aiSuggestions.push({
        icon: '🍽️',
        title: 'Ajouter un repas',
        description: this.getNextMealSuggestion()
      });
    }

    if (this.todayWater < 2000) {
      this.aiSuggestions.push({
        icon: '💧',
        title: 'Boire de l\'eau',
        description: `Il vous reste ${2000 - this.todayWater}ml pour atteindre votre objectif`
      });
    }

    if (this.isDiabetic) {
      this.aiSuggestions.push({
        icon: '🥗',
        title: 'Repas faibles en glucides',
        description: 'Découvrez des recettes adaptées aux diabétiques'
      });
    }

    this.aiSuggestions.push({
      icon: '📊',
      title: 'Voir le diagnostic',
      description: 'Analysez vos habitudes alimentaires'
    });
  }

  getNextMealSuggestion(): string {
    const hour = new Date().getHours();
    if (hour < 10) return 'C\'est l\'heure du petit-déjeuner!';
    if (hour < 14) return 'C\'est l\'heure du déjeuner!';
    if (hour < 19) return 'Un petit snack?';
    return 'C\'est l\'heure du dîner!';
  }

  updateHealthScore() {
    this.nutritionScore = Math.min(100, Math.round(((this.todayCalories + this.previewCalories) / this.caloriesGoal) * 100));
    this.hydrationScore = Math.min(100, Math.round(((this.todayWater + this.previewWater) / this.waterGoal) * 100));
    this.balanceScore = this.calculateBalanceScore();
    this.healthScore = Math.round((this.nutritionScore + this.hydrationScore + this.balanceScore) / 3);
  }

  calculateBalanceScore(): number {
    const proteinRatio = Math.min(1, (this.todayProtein + this.previewProtein) / this.proteinGoal);
    const carbsRatio = this.isDiabetic
      ? Math.max(0, 1 - ((this.todayCarbs + this.previewCarbs) - this.carbsGoal) / this.carbsGoal)
      : Math.min(1, (this.todayCarbs + this.previewCarbs) / this.carbsGoal);
    const fatsRatio = Math.min(1, (this.todayFats + this.previewFats) / this.fatsGoal);
    return Math.round(((proteinRatio + carbsRatio + fatsRatio) / 3) * 100);
  }

  // UI Helpers
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  getCircleProgress(value: number, goal: number): string {
    const percent = Math.min(value / goal, 1);
    const circumference = 2 * Math.PI * 52;
    return `${circumference * percent} ${circumference}`;
  }

  getPercent(value: number, goal: number): number {
    return Math.min(100, Math.round((value / goal) * 100));
  }

  getBarHeight(value: number): number {
    const maxValues = {
      calories: 2500,
      water: 3000,
      protein: 100
    };
    return (value / maxValues[this.chartType]) * 100;
  }

  getGoalLinePosition(): number {
    const goals = { calories: 2000, water: 2500, protein: 60 };
    const maxValues = { calories: 2500, water: 3000, protein: 100 };
    return (goals[this.chartType] / maxValues[this.chartType]) * 100;
  }

  getScoreProgress(score: number): string {
    const circumference = 2 * Math.PI * 45;
    return `${(circumference * score) / 100} ${circumference}`;
  }

  getScoreMessage(): string {
    if (this.healthScore >= 80) return 'Excellent! 🌟';
    if (this.healthScore >= 60) return 'Bon travail! 👍';
    if (this.healthScore >= 40) return 'Peut mieux faire 💪';
    return 'Continuez vos efforts! 🎯';
  }

  getMealIcon(mealTime: string): string {
    const icons: any = {
      'BREAKFAST': '🌅',
      'LUNCH': '☀️',
      'DINNER': '🌙',
      'SNACK': '🍎'
    };
    return icons[mealTime] || '🍽️';
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  // Actions
  quickAddWater() {
    this.waterService.addWaterIntake({ amount: 250, date: new Date().toISOString() } as any).subscribe({
      next: () => {
        this.todayWater += 250;
        this.updateHealthScore();
        this.notifications.unshift({
          type: 'success',
          icon: '💧',
          title: 'Eau ajoutée',
          message: '+250ml enregistrés'
        });
      }
    });
  }

  quickLog(mealType: string) {
    // Navigate to meals with meal type
    window.location.href = `/meals?type=${mealType}`;
  }

  openAiChat() {
    // Trigger AI chat opening
    const event = new CustomEvent('openAiChat');
    window.dispatchEvent(event);
  }

  applySuggestion(suggestion: any) {
    if (suggestion.title.includes('repas')) {
      window.location.href = '/meals';
    } else if (suggestion.title.includes('eau')) {
      this.quickAddWater();
    } else if (suggestion.title.includes('glucides')) {
      this.openAiChat();
    } else if (suggestion.title.includes('diagnostic')) {
      window.location.href = '/diagnostic';
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  logout() {
    this.authService.logout();
  }
}
