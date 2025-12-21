import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="analysis-container">
      <header class="page-header">
        <button class="btn-back" routerLink="/dashboard">← Retour</button>
        <h1>📊 Analyses & Statistiques</h1>
      </header>

      <!-- Filtres de période -->
      <div class="filters-section">
        <div class="filter-group">
          <label>Période:</label>
          <select [(ngModel)]="selectedPeriod" (change)="loadAnalytics()">
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">3 derniers mois</option>
          </select>
        </div>
        <button class="btn-export" (click)="exportData()">📥 Exporter PDF</button>
      </div>

      <!-- Résumé Global -->
      <div class="summary-grid">
        <div class="summary-card">
          <h3>🔥 Calories Moyennes/Jour</h3>
          <div class="big-number">{{ avgCalories }}</div>
          <p class="trend" [class.positive]="caloriesTrend > 0" [class.negative]="caloriesTrend < 0">
            {{ caloriesTrend > 0 ? '↗' : '↘' }} {{ Math.abs(caloriesTrend) }}% vs période précédente
          </p>
        </div>

        <div class="summary-card">
          <h3>💧 Hydratation Moyenne</h3>
          <div class="big-number">{{ avgWater }}ml</div>
          <p class="trend" [class.positive]="waterTrend > 0" [class.negative]="waterTrend < 0">
            {{ waterTrend > 0 ? '↗' : '↘' }} {{ Math.abs(waterTrend) }}% vs période précédente
          </p>
        </div>

        <div class="summary-card">
          <h3>🍽️ Repas par Jour</h3>
          <div class="big-number">{{ avgMealsPerDay }}</div>
          <p class="stat-detail">{{ totalMeals }} repas au total</p>
        </div>

        <div class="summary-card">
          <h3>⭐ Score Nutrition</h3>
          <div class="big-number score">{{ nutritionScore }}/100</div>
          <div class="score-bar">
            <div class="score-fill" [style.width.%]="nutritionScore"></div>
          </div>
        </div>
      </div>

      <!-- Graphiques Détaillés -->
      <div class="charts-section">
        <!-- Graphique Calories -->
        <div class="chart-card">
          <h2>📈 Évolution des Calories</h2>
          <div class="line-chart">
            <div class="chart-area">
              <div *ngFor="let point of caloriesData; let i = index" 
                   class="data-point"
                   [style.left.%]="(i / (caloriesData.length - 1)) * 100"
                   [style.bottom.%]="(point.value / maxCalories) * 100">
                <div class="point-dot" [title]="point.date + ': ' + point.value + ' kcal'"></div>
              </div>
              <svg class="chart-line" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline [attr.points]="getLinePoints(caloriesData)" 
                          fill="none" 
                          stroke="#667eea" 
                          stroke-width="2"/>
              </svg>
            </div>
            <div class="chart-labels">
              <span *ngFor="let point of caloriesData" class="label">{{ point.label }}</span>
            </div>
          </div>
        </div>

        <!-- Répartition Macronutriments -->
        <div class="chart-card">
          <h2>🥗 Répartition Macronutriments</h2>
          <div class="pie-chart">
            <svg viewBox="0 0 200 200" class="pie-svg">
              <circle cx="100" cy="100" r="80" fill="none" 
                      stroke="#3498db" stroke-width="40"
                      [attr.stroke-dasharray]="proteinPercent * 5.03 + ' 503'"
                      transform="rotate(-90 100 100)"/>
              <circle cx="100" cy="100" r="80" fill="none" 
                      stroke="#e74c3c" stroke-width="40"
                      [attr.stroke-dasharray]="carbsPercent * 5.03 + ' 503'"
                      [attr.stroke-dashoffset]="-proteinPercent * 5.03"
                      transform="rotate(-90 100 100)"/>
              <circle cx="100" cy="100" r="80" fill="none" 
                      stroke="#f39c12" stroke-width="40"
                      [attr.stroke-dasharray]="fatsPercent * 5.03 + ' 503'"
                      [attr.stroke-dashoffset]="-(proteinPercent + carbsPercent) * 5.03"
                      transform="rotate(-90 100 100)"/>
            </svg>
            <div class="pie-legend">
              <div class="legend-item">
                <span class="color-box protein"></span>
                <span>Protéines: {{ proteinPercent }}%</span>
              </div>
              <div class="legend-item">
                <span class="color-box carbs"></span>
                <span>Glucides: {{ carbsPercent }}%</span>
              </div>
              <div class="legend-item">
                <span class="color-box fats"></span>
                <span>Lipides: {{ fatsPercent }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Aliments -->
        <div class="chart-card">
          <h2>🏆 Top 10 Aliments Consommés</h2>
          <div class="top-foods">
            <div *ngFor="let food of topFoods; let i = index" class="food-row">
              <span class="rank">{{ i + 1 }}</span>
              <span class="food-name">{{ food.name }}</span>
              <div class="food-bar">
                <div class="bar-fill" [style.width.%]="(food.count / topFoods[0].count) * 100"></div>
              </div>
              <span class="food-count">{{ food.count }}x</span>
            </div>
          </div>
        </div>

        <!-- Tendances Hydratation -->
        <div class="chart-card">
          <h2>💦 Tendances Hydratation</h2>
          <div class="bar-chart">
            <div *ngFor="let day of waterData" class="bar-container">
              <div class="bar" [style.height.%]="(day.amount / 3000) * 100">
                <span class="bar-value">{{ day.amount }}</span>
              </div>
              <span class="bar-label">{{ day.day }}</span>
            </div>
          </div>
          <div class="chart-footer">
            <span>Objectif: 2000ml</span>
            <span>Moyenne: {{ avgWater }}ml</span>
          </div>
        </div>
      </div>

      <!-- Objectifs et Recommandations -->
      <div class="recommendations-section">
        <h2>💡 Recommandations Personnalisées</h2>
        <div class="recommendations-grid">
          <div class="recommendation-card" *ngFor="let rec of recommendations">
            <div class="rec-icon">{{ rec.icon }}</div>
            <h4>{{ rec.title }}</h4>
            <p>{{ rec.message }}</p>
            <button class="btn-action">{{ rec.action }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analysis-container {
      min-height: 100vh;
      background: #f5f7fa;
      padding: 20px;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
    }

    .page-header h1 {
      margin: 0;
      color: #333;
      font-size: 2rem;
    }

    .btn-back {
      padding: 10px 20px;
      background: white;
      border: 2px solid #667eea;
      color: #667eea;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-back:hover {
      background: #667eea;
      color: white;
    }

    .filters-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .filter-group label {
      font-weight: 600;
      color: #333;
    }

    .filter-group select {
      padding: 8px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
    }

    .btn-export {
      padding: 10px 20px;
      background: #27ae60;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-export:hover {
      background: #229954;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .summary-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .summary-card h3 {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 1rem;
    }

    .big-number {
      font-size: 2.5rem;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 10px;
    }

    .big-number.score {
      color: #27ae60;
    }

    .trend {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .trend.positive {
      color: #27ae60;
    }

    .trend.negative {
      color: #e74c3c;
    }

    .stat-detail {
      margin: 0;
      color: #999;
      font-size: 0.9rem;
    }

    .score-bar {
      background: #e0e0e0;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 10px;
    }

    .score-fill {
      background: linear-gradient(90deg, #27ae60, #2ecc71);
      height: 100%;
      transition: width 0.5s ease;
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .chart-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .chart-card h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 1.3rem;
    }

    .line-chart {
      height: 250px;
    }

    .chart-area {
      position: relative;
      height: 200px;
      border-bottom: 2px solid #e0e0e0;
      border-left: 2px solid #e0e0e0;
    }

    .data-point {
      position: absolute;
    }

    .point-dot {
      width: 10px;
      height: 10px;
      background: #667eea;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      cursor: pointer;
    }

    .point-dot:hover {
      transform: scale(1.5);
    }

    .chart-line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .chart-labels {
      display: flex;
      justify-content: space-around;
      margin-top: 10px;
    }

    .label {
      font-size: 0.85rem;
      color: #666;
    }

    .pie-chart {
      display: flex;
      align-items: center;
      gap: 40px;
    }

    .pie-svg {
      width: 200px;
      height: 200px;
    }

    .pie-legend {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
    }

    .color-box {
      width: 20px;
      height: 20px;
      border-radius: 4px;
    }

    .color-box.protein { background: #3498db; }
    .color-box.carbs { background: #e74c3c; }
    .color-box.fats { background: #f39c12; }

    .top-foods {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .food-row {
      display: grid;
      grid-template-columns: 30px 1fr 2fr 50px;
      align-items: center;
      gap: 15px;
    }

    .rank {
      font-weight: bold;
      color: #667eea;
      font-size: 1.1rem;
    }

    .food-name {
      font-weight: 600;
      color: #333;
    }

    .food-bar {
      background: #e0e0e0;
      height: 25px;
      border-radius: 12px;
      overflow: hidden;
    }

    .bar-fill {
      background: linear-gradient(90deg, #667eea, #764ba2);
      height: 100%;
      transition: width 0.5s ease;
    }

    .food-count {
      text-align: right;
      color: #666;
      font-weight: 600;
    }

    .bar-chart {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 200px;
      padding: 20px 0;
    }

    .bar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      max-width: 60px;
    }

    .bar {
      width: 100%;
      background: linear-gradient(to top, #3498db, #5dade2);
      border-radius: 8px 8px 0 0;
      position: relative;
      min-height: 20px;
      transition: all 0.3s;
    }

    .bar:hover {
      opacity: 0.8;
    }

    .bar-value {
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.85rem;
      font-weight: 600;
      color: #3498db;
    }

    .bar-label {
      margin-top: 10px;
      font-size: 0.85rem;
      color: #666;
    }

    .chart-footer {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 0.9rem;
    }

    .recommendations-section {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .recommendations-section h2 {
      margin: 0 0 25px 0;
      color: #333;
    }

    .recommendations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .recommendation-card {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      text-align: center;
    }

    .rec-icon {
      font-size: 3rem;
      margin-bottom: 15px;
    }

    .recommendation-card h4 {
      margin: 0 0 10px 0;
      font-size: 1.2rem;
    }

    .recommendation-card p {
      margin: 0 0 15px 0;
      opacity: 0.9;
    }

    .btn-action {
      padding: 8px 20px;
      background: white;
      color: #667eea;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-action:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }

    @media (max-width: 768px) {
      .charts-section {
        grid-template-columns: 1fr;
      }
      
      .pie-chart {
        flex-direction: column;
      }
    }
  `]
})
export class AnalysisComponent implements OnInit {
  Math = Math;

  selectedPeriod = '7';

  // Stats globales
  avgCalories = 1950;
  caloriesTrend = 5.2;
  avgWater = 1850;
  waterTrend = -2.3;
  avgMealsPerDay = 3.2;
  totalMeals = 22;
  nutritionScore = 78;

  maxCalories = 2500;

  // Données graphique calories
  caloriesData = [
    { date: '2025-12-01', label: '01/12', value: 1800 },
    { date: '2025-12-02', label: '02/12', value: 2100 },
    { date: '2025-12-03', label: '03/12', value: 1950 },
    { date: '2025-12-04', label: '04/12', value: 2200 },
    { date: '2025-12-05', label: '05/12', value: 1850 },
    { date: '2025-12-06', label: '06/12', value: 2050 },
    { date: '2025-12-07', label: '07/12', value: 1900 }
  ];

  // Macronutriments
  proteinPercent = 30;
  carbsPercent = 45;
  fatsPercent = 25;

  // Top aliments
  topFoods = [
    { name: 'Poulet grillé', count: 8 },
    { name: 'Riz basmati', count: 7 },
    { name: 'Brocoli', count: 6 },
    { name: 'Oeufs', count: 5 },
    { name: 'Pain complet', count: 5 },
    { name: 'Banane', count: 4 },
    { name: 'Yaourt grec', count: 4 },
    { name: 'Amandes', count: 3 },
    { name: 'Saumon', count: 3 },
    { name: 'Avocat', count: 2 }
  ];

  // Données hydratation
  waterData = [
    { day: 'L', amount: 1800 },
    { day: 'M', amount: 2100 },
    { day: 'M', amount: 1950 },
    { day: 'J', amount: 2200 },
    { day: 'V', amount: 1850 },
    { day: 'S', amount: 2050 },
    { day: 'D', amount: 1900 }
  ];

  // Recommandations
  recommendations = [
    {
      icon: '💪',
      title: 'Augmentez les protéines',
      message: 'Vous êtes 15g en dessous de votre objectif quotidien',
      action: 'Voir suggestions'
    },
    {
      icon: '💧',
      title: 'Buvez plus d\'eau',
      message: 'Objectif non atteint 3 jours cette semaine',
      action: 'Définir rappels'
    },
    {
      icon: '🥗',
      title: 'Variez vos légumes',
      message: 'Vous consommez surtout du brocoli, essayez d\'autres légumes',
      action: 'Découvrir recettes'
    }
  ];

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    // Simuler le chargement des données
    console.log('Chargement analytics pour période:', this.selectedPeriod);
  }

  getLinePoints(data: any[]): string {
    return data.map((point, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((point.value / this.maxCalories) * 100);
      return `${x},${y}`;
    }).join(' ');
  }

  exportData() {
    alert('Export PDF en cours de développement...');
    // Ici, implémenter l'export PDF avec jsPDF
  }
}

