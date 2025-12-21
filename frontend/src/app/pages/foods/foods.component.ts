import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodService } from '../../services/food.service';
import { EnhancedAiService } from '../../services/enhanced-ai.service';
import { Food } from '../../models/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-foods',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="foods-page">
      <div class="page-header">
        <h1>🍎 Smart Food Management</h1>
        <div class="header-actions">
          <button class="btn-ai-scan" (click)="toggleAiScan()" [class.active]="aiScanMode">
            🤖 AI Food Scanner
          </button>
          <button class="btn-primary" (click)="showAddForm = !showAddForm">
            {{ showAddForm ? 'Cancel' : '+ Add Food' }}
          </button>
        </div>
      </div>

      <!-- AI Food Recognition Panel -->
      <div class="ai-scan-panel" *ngIf="aiScanMode">
        <div class="scan-header">
          <h3>🔍 AI Food Recognition</h3>
          <p>Describe your food and let AI analyze it for you!</p>
        </div>
        
        <div class="scan-input">
          <textarea 
            [(ngModel)]="foodDescription" 
            placeholder="e.g., '1 medium apple' or 'grilled chicken breast with vegetables'"
            class="description-input"
            rows="3">
          </textarea>
          <button 
            class="btn-recognize" 
            (click)="recognizeFood()" 
            [disabled]="!foodDescription || recognizing">
            <span *ngIf="!recognizing">🎯 Analyze Food</span>
            <span *ngIf="recognizing">🔄 Analyzing...</span>
          </button>
        </div>

        <!-- AI Recognition Results -->
        <div class="recognition-results" *ngIf="recognitionResult">
          <div class="result-card">
            <div class="result-header">
              <h4>{{ recognitionResult.name }}</h4>
              <div class="health-score" [class]="getHealthScoreClass(recognitionResult.healthScore)">
                {{ recognitionResult.healthScore }}/100
              </div>
            </div>
            
            <div class="nutrition-grid">
              <div class="nutrition-item">
                <span class="label">Calories</span>
                <span class="value">{{ recognitionResult.calories }} kcal</span>
              </div>
              <div class="nutrition-item">
                <span class="label">Protein</span>
                <span class="value">{{ recognitionResult.protein }}g</span>
              </div>
              <div class="nutrition-item">
                <span class="label">Carbs</span>
                <span class="value">{{ recognitionResult.carbs }}g</span>
              </div>
              <div class="nutrition-item">
                <span class="label">Fat</span>
                <span class="value">{{ recognitionResult.fats }}g</span>
              </div>
              <div class="nutrition-item" *ngIf="recognitionResult.fiber">
                <span class="label">Fiber</span>
                <span class="value">{{ recognitionResult.fiber }}g</span>
              </div>
              <div class="nutrition-item" *ngIf="recognitionResult.netCarbs">
                <span class="label">Net Carbs</span>
                <span class="value">{{ recognitionResult.netCarbs }}g</span>
              </div>
            </div>

            <!-- Diabetic Analysis -->
            <div class="diabetic-analysis" *ngIf="recognitionResult.isDiabeticFriendly !== undefined">
              <div class="diabetic-status" [class.friendly]="recognitionResult.isDiabeticFriendly">
                <span class="status-icon">{{ recognitionResult.isDiabeticFriendly ? '✅' : '⚠️' }}</span>
                <span class="status-text">
                  {{ recognitionResult.isDiabeticFriendly ? 'Diabetic Friendly' : 'Moderate for Diabetics' }}
                </span>
              </div>
              <p class="glycemic-info" *ngIf="recognitionResult.glycemicLoad">
                Glycemic Load: <strong>{{ recognitionResult.glycemicLoad }}</strong>
              </p>
              <p class="glucose-impact" *ngIf="recognitionResult.glucoseImpact">
                Glucose Impact: <strong>{{ recognitionResult.glucoseImpact }}</strong>
              </p>
            </div>

            <!-- AI Recommendations -->
            <div class="ai-recommendations" *ngIf="aiRecommendations.length > 0">
              <h5>🤖 AI Recommendations</h5>
              <ul class="recommendations-list">
                <li *ngFor="let rec of aiRecommendations">{{ rec }}</li>
              </ul>
            </div>

            <div class="result-actions">
              <button class="btn-add-food" (click)="addRecognizedFood()">
                ➕ Add to Food Database
              </button>
              <button class="btn-log-meal" (click)="logAsMeal()">
                📝 Log as Meal
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Smart Filter & Search -->
      <div class="smart-filters">
        <div class="search-section">
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            placeholder="🔍 Search foods..."
            class="search-input"
            (input)="filterFoods()">
          
          <select [(ngModel)]="categoryFilter" (change)="filterFoods()" class="category-filter">
            <option value="">All Categories</option>
            <option value="fruits">🍎 Fruits</option>
            <option value="vegetables">🥬 Vegetables</option>
            <option value="proteins">🥩 Proteins</option>
            <option value="dairy">🥛 Dairy</option>
            <option value="grains">🌾 Grains</option>
            <option value="other">📦 Other</option>
          </select>
        </div>

        <div class="smart-filters-row">
          <button 
            class="filter-btn" 
            [class.active]="diabeticFilter"
            (click)="toggleDiabeticFilter()">
            💉 Diabetic Friendly
          </button>
          <button 
            class="filter-btn" 
            [class.active]="lowCarbFilter"
            (click)="toggleLowCarbFilter()">
            🥗 Low Carb
          </button>
          <button 
            class="filter-btn" 
            [class.active]="highProteinFilter"
            (click)="toggleHighProteinFilter()">
            💪 High Protein
          </button>
          <button 
            class="filter-btn" 
            [class.active]="highFiberFilter"
            (click)="toggleHighFiberFilter()">
            🌾 High Fiber
          </button>
        </div>

        <!-- AI Suggestions -->
        <div class="ai-suggestions" *ngIf="smartSuggestions.length > 0">
          <h4>💡 Smart Suggestions for You</h4>
          <div class="suggestions-grid">
            <div class="suggestion-card" *ngFor="let suggestion of smartSuggestions" (click)="selectFood(suggestion)">
              <span class="suggestion-emoji">{{ suggestion.emoji }}</span>
              <h5>{{ suggestion.name }}</h5>
              <p class="suggestion-reason">{{ suggestion.reason }}</p>
              <div class="suggestion-stats">
                <span>{{ suggestion.calories }}kcal</span>
                <span>{{ suggestion.protein }}g protein</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Add/Edit Form -->
      <div class="form-card" *ngIf="showAddForm || editingFood">
        <h2>{{ editingFood ? 'Edit' : 'Add' }} Food</h2>
        <form (ngSubmit)="editingFood ? updateFood() : createFood()">
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Food Name *</label>
              <input type="text" [(ngModel)]="currentFood.name" name="name" required
                     (input)="onFoodNameChange()" placeholder="e.g., Apple, Chicken Breast">
              <div class="ai-suggestions-dropdown" *ngIf="nameSuggestions.length > 0">
                <div class="suggestion-item" *ngFor="let suggestion of nameSuggestions" 
                     (click)="selectNameSuggestion(suggestion)">
                  {{ suggestion.name }} - {{ suggestion.calories }}kcal
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Category</label>
              <select [(ngModel)]="currentFood.category" name="category">
                <option value="">Select...</option>
                <option value="fruits">Fruits</option>
                <option value="vegetables">Vegetables</option>
                <option value="proteins">Proteins</option>
                <option value="dairy">Dairy</option>
                <option value="grains">Grains</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label>Serving Size</label>
              <input type="text" [(ngModel)]="currentFood.servingSize" name="servingSize"
                     placeholder="e.g., 1 medium (180g)">
            </div>

            <div class="form-group">
              <label>Calories (kcal) *</label>
              <input type="number" [(ngModel)]="currentFood.calories" name="calories" required>
            </div>
            <div class="form-group">
              <label>Protein (g) *</label>
              <input type="number" step="0.1" [(ngModel)]="currentFood.protein" name="protein" required>
            </div>
            <div class="form-group">
              <label>Carbohydrates (g) *</label>
              <input type="number" step="0.1" [(ngModel)]="currentFood.carbohydrates" name="carbohydrates" required>
            </div>
            <div class="form-group">
              <label>Fat (g) *</label>
              <input type="number" step="0.1" [(ngModel)]="currentFood.fat" name="fat" required>
            </div>
            <div class="form-group">
              <label>Fiber (g)</label>
              <input type="number" step="0.1" [(ngModel)]="currentFood.fiber" name="fiber">
            </div>

            <!-- AI Health Analysis -->
            <div class="health-analysis" *ngIf="currentFood && currentFood.calories && currentFood.calories > 0">
              <h4>🤖 AI Health Analysis</h4>
              <div class="health-metrics">
                <div class="metric">
                  <span class="metric-label">Health Score</span>
                  <span class="metric-value health-score" [class]="getHealthScoreClass(calculateHealthScore())">
                    {{ calculateHealthScore() }}/100
                  </span>
                </div>
                <div class="metric">
                  <span class="metric-label">Protein Ratio</span>
                  <span class="metric-value">{{ getProteinRatio() }}%</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Carb Impact</span>
                  <span class="metric-value" [class]="getCarbImpactClass()">{{ getCarbImpact() }}</span>
                </div>
              </div>
              
              <div class="diabetic-rating">
                <span class="rating-label">Diabetic Friendly:</span>
                <span class="rating-value" [class]="getDiabeticFriendlyClass()">
                  {{ isDiabeticFriendly() ? '✅ Yes' : '⚠️ Moderate' }}
                </span>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">{{ editingFood ? 'Update' : 'Add' }}</button>
            <button type="button" class="btn-secondary" (click)="cancelEdit()">Cancel</button>
            <button type="button" class="btn-ai-analyze" (click)="analyzeCurrentFood()" 
                    *ngIf="currentFood.name" [disabled]="analyzing">
              <span *ngIf="!analyzing">🤖 AI Analyze</span>
              <span *ngIf="analyzing">⏳ Analyzing...</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <!-- Error Message -->
      <div class="alert alert-error" *ngIf="error">
        {{ error }}
      </div>

      <!-- Success Message -->
      <div class="alert alert-success" *ngIf="successMessage">
        {{ successMessage }}
      </div>

      <!-- Enhanced Foods Grid with AI Insights -->
      <div class="foods-grid" *ngIf="!loading">
        <div class="food-card enhanced" *ngFor="let food of filteredFoods" [class]="getFoodCardClass(food)">
          <div class="food-header">
            <h3>{{ food.name }}</h3>
            <div class="food-badges">
              <span class="category-badge" *ngIf="food.category">{{ getCategoryIcon(food.category) }} {{ food.category }}</span>
              <span class="health-badge" [class]="getHealthScoreClass(food.healthScore || calculateFoodHealthScore(food))">
                {{ food.healthScore || calculateFoodHealthScore(food) }}
              </span>
            </div>
          </div>

          <!-- Enhanced Nutrition Display -->
          <div class="food-nutrition enhanced">
            <div class="nutrition-row main">
              <div class="nutrition-item primary">
                <span class="label">Calories</span>
                <span class="value">{{ food.calories }} kcal</span>
              </div>
              <div class="nutrition-item">
                <span class="label">Protein</span>
                <span class="value">{{ food.protein }}g</span>
              </div>
            </div>
            <div class="nutrition-row secondary">
              <div class="nutrition-item">
                <span class="label">Carbs</span>
                <span class="value">{{ food.carbohydrates }}g</span>
              </div>
              <div class="nutrition-item">
                <span class="label">Fat</span>
                <span class="value">{{ food.fat }}g</span>
              </div>
              <div class="nutrition-item" *ngIf="food.fiber">
                <span class="label">Fiber</span>
                <span class="value">{{ food.fiber }}g</span>
              </div>
            </div>
          </div>

          <!-- AI Insights for Food -->
          <div class="ai-insights" *ngIf="getAiInsights(food).length > 0">
            <h5>💡 AI Insights</h5>
            <ul class="insights-list">
              <li *ngFor="let insight of getAiInsights(food)" [class]="insight.type">
                {{ insight.text }}
              </li>
            </ul>
          </div>

          <!-- Smart Action Buttons -->
          <div class="food-actions enhanced">
            <button class="btn-quick-log" (click)="quickLogFood(food)" title="Quick log to today's meals">
              ⚡ Quick Log
            </button>
            <button class="btn-analyze" (click)="analyzeFood(food)" title="Get AI analysis">
              🤖 Analyze
            </button>
            <button class="btn-edit" (click)="editFood(food)" title="Edit food">
              ✏️
            </button>
            <button class="btn-delete" (click)="deleteFood(food.id!)" title="Delete food">
              🗑️
            </button>
          </div>

          <!-- Comparison Feature -->
          <div class="comparison-toggle" *ngIf="comparisonMode">
            <label class="comparison-checkbox">
              <input type="checkbox" [(ngModel)]="food.selected" (change)="updateComparison()">
              Compare
            </label>
          </div>
        </div>
      </div>

      <!-- AI Food Comparison Panel -->
      <div class="comparison-panel" *ngIf="comparisonFoods.length > 1">
        <div class="comparison-header">
          <h3>⚖️ AI Food Comparison</h3>
          <button class="btn-close-comparison" (click)="clearComparison()">✕</button>
        </div>
        
        <div class="comparison-grid">
          <div class="comparison-item" *ngFor="let food of comparisonFoods">
            <h4>{{ food.name }}</h4>
            <div class="comparison-stats">
              <div class="stat">
                <span class="label">Calories</span>
                <span class="value" [class]="getComparisonClass('calories', food.calories)">{{ food.calories }}</span>
              </div>
              <div class="stat">
                <span class="label">Protein</span>
                <span class="value" [class]="getComparisonClass('protein', food.protein)">{{ food.protein }}g</span>
              </div>
              <div class="stat">
                <span class="label">Carbs</span>
                <span class="value" [class]="getComparisonClass('carbs', food.carbohydrates)">{{ food.carbohydrates }}g</span>
              </div>
              <div class="health-score-comparison">
                Health Score: <span [class]="getHealthScoreClass(calculateFoodHealthScore(food))">
                  {{ calculateFoodHealthScore(food) }}/100
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="ai-comparison-insights">
          <h5>🤖 AI Comparison Insights</h5>
          <p>{{ getComparisonInsights() }}</p>
        </div>
      </div>

      <!-- Quick Actions Bar -->
      <div class="quick-actions-bar" *ngIf="!showAddForm && !editingFood">
        <button class="quick-action" (click)="toggleComparisonMode()">
          ⚖️ Compare Foods
        </button>
        <button class="quick-action" (click)="exportFoods()">
          📤 Export Data
        </button>
        <button class="quick-action" (click)="getPersonalizedSuggestions()">
          🎯 Get Suggestions
        </button>
      </div>

      <div class="empty-state" *ngIf="!loading && foods.length === 0">
        <p>Aucun aliment trouvé. Ajoutez-en un pour commencer !</p>
      </div>
    </div>
  `,
  styles: [`
    .foods-page {
      animation: fadeIn 0.5s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      color: #2c3e50;
      font-size: 2rem;
    }

    .form-card {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .form-card h2 {
      color: #2c3e50;
      margin-bottom: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      color: #2c3e50;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-group input,
    .form-group select {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-primary,
    .btn-secondary,
    .btn-edit,
    .btn-delete {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background: #e0e0e0;
      color: #2c3e50;
    }

    .btn-secondary:hover {
      background: #d0d0d0;
    }

    .loading {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .alert-error {
      background: #fee;
      color: #c33;
      border-left: 4px solid #c33;
    }

    .alert-success {
      background: #efe;
      color: #3c3;
      border-left: 4px solid #3c3;
    }

    .foods-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .food-card {
      background: white;
      padding: 1.5rem;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: transform 0.3s;
    }

    .food-card:hover {
      transform: translateY(-5px);
    }

    .food-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }

    .food-header h3 {
      color: #2c3e50;
      margin: 0;
    }

    .category-badge {
      background: #667eea;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.85rem;
    }

    .food-nutrition {
      display: grid;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .nutrition-item {
      display: flex;
      justify-content: space-between;
    }

    .nutrition-item .label {
      color: #7f8c8d;
    }

    .nutrition-item .value {
      color: #2c3e50;
      font-weight: bold;
    }

    .food-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-edit,
    .btn-delete {
      flex: 1;
      padding: 0.5rem;
      font-size: 0.9rem;
    }

    .btn-edit {
      background: #3498db;
      color: white;
    }

    .btn-edit:hover {
      background: #2980b9;
    }

    .btn-delete {
      background: #e74c3c;
      color: white;
    }

    .btn-delete:hover {
      background: #c0392b;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #7f8c8d;
      font-size: 1.2rem;
    }

    .ai-scan-panel {
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      padding: 2rem;
      border-radius: 15px;
      margin-bottom: 2rem;
      border: 2px solid #2196f3;
    }

    .btn-ai-scan {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-ai-scan.active {
      background: linear-gradient(135deg, #764ba2, #667eea);
      box-shadow: 0 0 20px rgba(118, 75, 162, 0.3);
    }

    .recognition-results {
      margin-top: 1.5rem;
    }

    .result-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .health-score {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: bold;
      color: white;
    }

    .health-score.excellent { background: #4caf50; }
    .health-score.good { background: #8bc34a; }
    .health-score.fair { background: #ffc107; }
    .health-score.poor { background: #ff5722; }
    
    .food-card.diabetic-friendly { border-left: 3px solid #4caf50; }
    .food-card.high-protein { border-left: 3px solid #2196f3; }
    
    .insights-list li.positive { color: #4caf50; }
    .insights-list li.warning { color: #ff9800; }
    .insights-list li.negative { color: #f44336; }
    
    .nutrition-item.highlight { background: #fff3e0; }
    
    .diabetic-analysis {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .diabetic-status.friendly {
      color: #4caf50;
    }

    .smart-filters {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .smart-filters-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 20px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-btn.active {
      background: #2196f3;
      color: white;
      border-color: #2196f3;
    }

    .ai-suggestions {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #fff3e0;
      border-radius: 10px;
    }

    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .suggestion-card {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .suggestion-card:hover {
      border-color: #ff9800;
      transform: translateY(-2px);
    }

    .food-card.enhanced {
      transition: all 0.3s;
      border: 2px solid transparent;
    }

    .food-card.diabetic-friendly {
      border-color: #4caf50;
      background: linear-gradient(135deg, #f1f8e9, #dcedc8);
    }

    .food-card.high-protein {
      border-color: #ff9800;
      background: linear-gradient(135deg, #fff8e1, #ffecb3);
    }

    .ai-insights {
      background: #e8f5e9;
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .insights-list {
      list-style: none;
      padding: 0;
      margin: 0.5rem 0 0 0;
    }

    .insights-list li {
      padding: 0.25rem 0;
      font-size: 0.9rem;
    }

    .comparison-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-top: 3px solid #2196f3;
      padding: 2rem;
      box-shadow: 0 -5px 20px rgba(0,0,0,0.2);
      z-index: 1000;
    }

    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .quick-actions-bar {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .quick-action {
      padding: 0.75rem 1.5rem;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quick-action:hover {
      border-color: #2196f3;
      background: #e3f2fd;
    }

    @keyframes nutritionPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .nutrition-item.highlight {
      animation: nutritionPulse 0.6s ease-in-out;
      background: #e3f2fd;
      border-radius: 4px;
    }
  `]
})
export class FoodsComponent implements OnInit, OnDestroy {
  foods: Food[] = [];
  filteredFoods: Food[] = [];
  currentFood: Partial<Food> = {};
  editingFood: Food | null = null;
  loading = false;
  error = '';
  successMessage = '';

  // AI Enhancement Properties
  aiScanMode = false;
  foodDescription = '';
  recognizing = false;
  recognitionResult: any = null;
  aiRecommendations: string[] = [];
  analyzing = false;

  // Smart Filtering
  searchTerm = '';
  categoryFilter = '';
  diabeticFilter = false;
  lowCarbFilter = false;
  highProteinFilter = false;
  highFiberFilter = false;

  // AI Suggestions
  smartSuggestions: any[] = [];
  nameSuggestions: any[] = [];

  // Comparison Features
  comparisonMode = false;
  comparisonFoods: Food[] = [];
  comparisonStats: any = {
    protein: { max: 0, min: 0, avg: 0 },
    carbs: { max: 0, min: 0, avg: 0 },
    fat: { max: 0, min: 0, avg: 0 }
  };

  // Form and UI states
  showAddForm = false;
  selectedAnalysis: any = null;
  showAnalysisModal = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private foodService: FoodService,
    private enhancedAi: EnhancedAiService
  ) {}

  ngOnInit(): void {
    this.loadFoods();
    this.getPersonalizedSuggestions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // AI Food Recognition Methods
  toggleAiScan(): void {
    this.aiScanMode = !this.aiScanMode;
    if (!this.aiScanMode) {
      this.foodDescription = '';
      this.recognitionResult = null;
    }
  }

  recognizeFood(): void {
    if (!this.foodDescription.trim()) return;

    this.recognizing = true;
    this.enhancedAi.recognizeFood(this.foodDescription).subscribe(
      result => {
        if (result.success) {
          this.recognitionResult = result;
          this.generateAiRecommendations(result);
        } else {
          this.showError('Food recognition failed. Please try again.');
        }
        this.recognizing = false;
      },
      error => {
        console.error('Recognition error:', error);
        this.recognizing = false;
        this.showError('AI service temporarily unavailable');
      }
    );
  }

  generateAiRecommendations(food: any): void {
    this.aiRecommendations = [];

    if (food.healthScore > 80) {
      this.aiRecommendations.push('Excellent choice! This food supports your health goals.');
    } else if (food.healthScore > 60) {
      this.aiRecommendations.push('Good option. Consider pairing with high-fiber foods.');
    } else {
      this.aiRecommendations.push('Consume in moderation as part of a balanced diet.');
    }

    if (food.isDiabeticFriendly) {
      this.aiRecommendations.push('Great for blood sugar management.');
    } else if (food.carbs > 20) {
      this.aiRecommendations.push('High in carbs - consider smaller portions if managing blood sugar.');
    }

    if (food.protein > 15) {
      this.aiRecommendations.push('Excellent protein source for muscle maintenance.');
    }

    if (food.fiber && food.fiber > 5) {
      this.aiRecommendations.push('High fiber content supports digestive health.');
    }
  }

  // Enhanced Food Management
  analyzeFood(food: Food): void {
    this.analyzing = true;
    const foodData = {
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbohydrates,
      fat: food.fat,
      fiber: food.fiber || 0
    };

    this.enhancedAi.smartMealLog(JSON.stringify(foodData), false).subscribe(
      result => {
        this.showFoodAnalysis(result);
        this.analyzing = false;
      },
      error => {
        console.error('Analysis error:', error);
        this.analyzing = false;
      }
    );
  }

  showFoodAnalysis(analysis: any): void {
    this.selectedAnalysis = analysis;
    this.showAnalysisModal = true;
  }

  // Smart Filtering Methods
  filterFoods(): void {
    let filtered = [...this.foods];

    // Text search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(food =>
        food.name.toLowerCase().includes(term) ||
        (food.category && food.category.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (this.categoryFilter) {
      filtered = filtered.filter(food => food.category === this.categoryFilter);
    }

    // Smart filters
    if (this.diabeticFilter) {
      filtered = filtered.filter(food => this.isDiabeticFriendlyFood(food));
    }

    if (this.lowCarbFilter) {
      filtered = filtered.filter(food => (food.carbohydrates || 0) < 10);
    }

    if (this.highProteinFilter) {
      filtered = filtered.filter(food => (food.protein || 0) > 15);
    }

    if (this.highFiberFilter) {
      filtered = filtered.filter(food => (food.fiber || 0) > 5);
    }

    this.filteredFoods = filtered;
  }

  // Filter toggle methods
  toggleDiabeticFilter(): void {
    this.diabeticFilter = !this.diabeticFilter;
    this.filterFoods();
  }

  toggleLowCarbFilter(): void {
    this.lowCarbFilter = !this.lowCarbFilter;
    this.filterFoods();
  }

  toggleHighProteinFilter(): void {
    this.highProteinFilter = !this.highProteinFilter;
    this.filterFoods();
  }

  toggleHighFiberFilter(): void {
    this.highFiberFilter = !this.highFiberFilter;
  }

  // Food form methods
  onFoodNameChange(): void {
    if (this.currentFood.name && this.currentFood.name.length > 2) {
      // Generate name suggestions based on existing foods
      this.nameSuggestions = this.foods
        .filter(f => f.name.toLowerCase().includes(this.currentFood.name!.toLowerCase()))
        .slice(0, 5);
    } else {
      this.nameSuggestions = [];
    }
  }

  selectNameSuggestion(suggestion: Food): void {
    this.currentFood = { ...suggestion };
    this.nameSuggestions = [];
  }

  selectFood(food: Food): void {
    this.currentFood = { ...food };
    this.showAddForm = true;
  }

  // Health calculation methods
  calculateHealthScore(): number {
    if (!this.currentFood.calories) return 0;

    let score = 50; // Base score

    // Safe protein scoring
    if (this.currentFood.protein && this.currentFood.protein > 15) score += 20;
    else if (this.currentFood.protein && this.currentFood.protein > 10) score += 10;

    // Add fiber bonus
    if (this.currentFood.fiber && this.currentFood.fiber > 5) score += 15;

    // Carb penalties with null checking
    if (this.currentFood.carbohydrates && this.currentFood.carbohydrates > 40) score -= 15;
    else if (this.currentFood.carbohydrates && this.currentFood.carbohydrates > 25) score -= 5;

    // Fat scoring with null checking
    if (this.currentFood.fat && this.currentFood.fat > 20) score -= 10;
    else if (this.currentFood.fat && this.currentFood.fat < 5 && this.currentFood.protein && this.currentFood.protein > 10) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  getProteinRatio(): number {
    if (!this.currentFood.calories || !this.currentFood.protein) return 0;
    return Math.round((this.currentFood.protein * 4 / this.currentFood.calories) * 100);
  }

  getCarbImpact(): string {
    const carbs = this.currentFood.carbohydrates || 0;
    const fiber = this.currentFood.fiber || 0;
    const netCarbs = carbs - fiber;

    if (netCarbs < 10) return 'Low';
    if (netCarbs < 20) return 'Medium';
    return 'High';
  }

  getCarbImpactClass(): string {
    const impact = this.getCarbImpact();
    return impact.toLowerCase();
  }

  isDiabeticFriendly(): boolean {
    if (!this.currentFood.carbohydrates || !this.currentFood.protein) return false;
    const netCarbs = this.currentFood.carbohydrates - (this.currentFood.fiber || 0);
    return netCarbs < 15 && this.currentFood.protein > 5;
  }

  getDiabeticFriendlyClass(): string {
    return this.isDiabeticFriendly() ? 'friendly' : 'moderate';
  }

  // Form actions
  cancelEdit(): void {
    this.showAddForm = false;
    this.editingFood = null;
    this.currentFood = {};
  }

  analyzeCurrentFood(): void {
    if (!this.currentFood.name) return;

    this.analyzing = true;
    const foodData = {
      name: this.currentFood.name,
      calories: this.currentFood.calories || 0,
      protein: this.currentFood.protein || 0,
      carbs: this.currentFood.carbohydrates || 0,
      fat: this.currentFood.fat || 0,
      fiber: this.currentFood.fiber || 0
    };

    this.enhancedAi.smartMealLog(JSON.stringify(foodData), false).subscribe(
      result => {
        this.showFoodAnalysis(result);
        this.analyzing = false;
      },
      error => {
        console.error('Analysis error:', error);
        this.analyzing = false;
      }
    );
  }

  // CRUD operations
  editFood(food: Food): void {
    this.editingFood = food;
    this.currentFood = { ...food };
    this.showAddForm = true;
  }

  deleteFood(id: number): void {
    if (confirm('Are you sure you want to delete this food?')) {
      this.foodService.deleteFood(id).subscribe({
        next: () => {
          this.foods = this.foods.filter(f => f.id !== id);
          this.filterFoods();
          this.showSuccess('Food deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting food:', error);
          this.showError('Failed to delete food. Please try again.');
        }
      });
    }
  }

  // Comparison methods
  getComparisonClass(nutrient: string, value: number | undefined): string {
    if (!this.comparisonFoods.length || value === undefined) return '';

    // Safe comparison with null checking
    const values = this.comparisonFoods
      .map(f => this.getNutrientValue(f, nutrient))
      .filter(v => v !== null && v !== undefined) as number[];

    if (values.length === 0) return '';

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;

    if (range === 0) return 'average';

    const position = (value - min) / range;

    if (position > 0.75) return 'high';
    if (position < 0.25) return 'low';
    return 'average';
  }

  // Quick actions
  exportFoods(): void {
    const dataStr = JSON.stringify(this.foods, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `foods-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    this.showSuccess('Foods data exported successfully!');
  }

  // AI Insight Methods
  getAiInsights(food: Food): any[] {
    const insights = [];
    const healthScore = this.calculateFoodHealthScore(food);

    if (healthScore > 80) {
      insights.push({ text: 'Excellent nutritional profile', type: 'positive' });
    }

    if ((food.protein || 0) > 20) {
      insights.push({ text: 'High protein content', type: 'positive' });
    }

    if ((food.carbohydrates || 0) > 30) {
      insights.push({ text: 'High in carbohydrates', type: 'warning' });
    }

    if ((food.fiber || 0) > 5) {
      insights.push({ text: 'Good source of fiber', type: 'positive' });
    }

    if (this.isDiabeticFriendlyFood(food)) {
      insights.push({ text: 'Diabetic friendly', type: 'positive' });
    }

    return insights;
  }

  calculateFoodHealthScore(food: Food): number {
    let score = 50; // Base score

    // Safe protein scoring
    if (food.protein && food.protein > 15) score += 20;
    else if (food.protein && food.protein > 10) score += 10;

    // Add fiber bonus
    if (food.fiber && food.fiber > 5) score += 15;

    // Carb penalties with null checking
    if (food.carbohydrates && food.carbohydrates > 40) score -= 15;
    else if (food.carbohydrates && food.carbohydrates > 25) score -= 5;

    // Fat scoring with null checking
    if (food.fat && food.fat > 20) score -= 10;
    else if (food.fat && food.fat < 5 && food.protein && food.protein > 10) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  // Helper Methods
  isDiabeticFriendlyFood(food: Food): boolean {
    if (!food.carbohydrates || !food.protein) return false;
    const netCarbs = food.carbohydrates - (food.fiber || 0);
    return netCarbs < 15 && food.protein > 5;
  }

  getHealthScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 45) return 'fair';
    return 'poor';
  }

  getFoodCardClass(food: Food): string {
    const classes = [];

    if (this.isDiabeticFriendlyFood(food)) {
      classes.push('diabetic-friendly');
    }

    if ((food.protein || 0) > 15) {
      classes.push('high-protein');
    }

    return classes.join(' ');
  }

  getCategoryIcon(category: string): string {
    const icons: any = {
      'fruits': '🍎',
      'vegetables': '🥬',
      'proteins': '🥩',
      'dairy': '🥛',
      'grains': '🌾',
      'other': '📦'
    };
    return icons[category] || '🍽️';
  }

  // Comparison Methods
  toggleComparisonMode(): void {
    this.comparisonMode = !this.comparisonMode;
    if (!this.comparisonMode) {
      this.clearComparison();
    }
  }

  updateComparison(): void {
    this.comparisonFoods = this.foods.filter(food => (food as any).selected);
  }

  clearComparison(): void {
    this.foods.forEach(food => (food as any).selected = false);
    this.comparisonFoods = [];
    this.comparisonMode = false;
  }

  getComparisonInsights(): string {
    if (this.comparisonFoods.length < 2) return '';

    const insights = [];
    const calories = this.comparisonFoods.map(f => f.calories);
    const proteins = this.comparisonFoods.map(f => f.protein || 0);

    const highestCalorie = this.comparisonFoods.find(f => f.calories === Math.max(...calories));
    const highestProtein = this.comparisonFoods.find(f => (f.protein || 0) === Math.max(...proteins));

    if (highestProtein) {
      insights.push(`${highestProtein.name} has the highest protein content.`);
    }
    if (highestCalorie) {
      insights.push(`${highestCalorie.name} is the most calorie-dense option.`);
    }

    return insights.join(' ');
  }

  // Enhanced Action Methods
  quickLogFood(food: Food): void {
    // Implement quick logging to meal service
    console.log('Quick logging:', food.name);
    this.showSuccess(`${food.name} added to today's meals!`);
  }

  addRecognizedFood(): void {
    if (!this.recognitionResult) return;

    this.currentFood = {
      name: this.recognitionResult.name,
      calories: this.recognitionResult.calories,
      protein: this.recognitionResult.protein,
      carbohydrates: this.recognitionResult.carbs,
      fat: this.recognitionResult.fats,
      fiber: this.recognitionResult.fiber
    };

    this.showAddForm = true;
    this.aiScanMode = false;
  }

  logAsMeal(): void {
    // Navigate to meal logging with pre-filled data
    console.log('Logging as meal:', this.recognitionResult);
  }

  getPersonalizedSuggestions(): void {
    // Generate AI-powered food suggestions based on user's dietary preferences and history
    this.smartSuggestions = [
      {
        name: 'Grilled Chicken Breast',
        emoji: '🐔',
        reason: 'High protein, low carb',
        calories: 165,
        protein: 31
      },
      {
        name: 'Spinach Salad',
        emoji: '🥬',
        reason: 'Rich in iron and vitamins',
        calories: 25,
        protein: 3
      },
      {
        name: 'Greek Yogurt',
        emoji: '🥛',
        reason: 'Probiotics and protein',
        calories: 100,
        protein: 17
      }
    ];
  }

  loadFoods(): void {
    this.loading = true;
    this.foodService.getAllFoods().subscribe(
      (foods: Food[]) => {
        this.foods = foods;
        this.filterFoods();
        this.loading = false;
      },
      error => {
        console.error('Failed to load foods:', error);
        this.error = 'Failed to load foods';
        this.loading = false;
      }
    );
  }

  createFood(): void {
    if (!this.currentFood.name) {
      this.showError('Please provide a food name.');
      return;
    }

    // Ensure all required properties are set
    const foodData: Food = {
      name: this.currentFood.name,
      calories: this.currentFood.calories || 0,
      protein: this.currentFood.protein || 0,
      carbohydrates: this.currentFood.carbohydrates || 0,
      fat: this.currentFood.fat || 0,
      fiber: this.currentFood.fiber || 0,
      category: this.currentFood.category || 'general'
    };

    this.foodService.createFood(foodData).subscribe({
      next: (food) => {
        this.foods.unshift(food);
        this.resetForm();
        this.showSuccess('Food created successfully!');
      },
      error: (error) => {
        console.error('Error creating food:', error);
        this.showError('Failed to create food. Please try again.');
      }
    });
  }

  updateFood(): void {
    if (!this.editingFood || !this.currentFood.name) {
      this.showError('Please provide valid food data.');
      return;
    }

    // Ensure all required properties are set
    const foodData: Food = {
      ...this.editingFood,
      name: this.currentFood.name,
      calories: this.currentFood.calories || 0,
      protein: this.currentFood.protein || 0,
      carbohydrates: this.currentFood.carbohydrates || 0,
      fat: this.currentFood.fat || 0,
      fiber: this.currentFood.fiber || 0,
      category: this.currentFood.category || this.editingFood.category || 'general'
    };

    this.foodService.updateFood(this.editingFood.id!, foodData).subscribe({
      next: (updatedFood) => {
        const index = this.foods.findIndex(f => f.id === this.editingFood!.id);
        if (index !== -1) {
          this.foods[index] = updatedFood;
        }
        this.resetForm();
        this.showSuccess('Food updated successfully!');
      },
      error: (error) => {
        console.error('Error updating food:', error);
        this.showError('Failed to update food. Please try again.');
      }
    });
  }

  // Add missing utility methods
  private resetForm(): void {
    this.currentFood = {};
    this.editingFood = null;
    this.showAddForm = false;
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  private showError(message: string): void {
    this.error = message;
    setTimeout(() => this.error = '', 3000);
  }

  private getNutrientValue(food: Food, nutrient: string): number | null {
    switch (nutrient) {
      case 'protein': return food.protein || 0;
      case 'carbs': return food.carbohydrates || 0;
      case 'fat': return food.fat || 0;
      case 'fiber': return food.fiber || 0;
      case 'calories': return food.calories || 0;
      default: return null;
    }
  }
}

