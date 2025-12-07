import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MealService } from '../../services/meal.service';
import { WaterService } from '../../services/water.service';
import { FoodService } from '../../services/food.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="header-content">
          <h1>🍎 Tableau de Bord Makla</h1>
          <p class="welcome-text">Bienvenue, {{ currentUser?.username || 'Utilisateur' }} !</p>
        </div>
        <button class="btn-logout" (click)="logout()">Déconnexion</button>
      </header>

      <div class="dashboard-grid">
        <!-- Card Calories -->
        <div class="stat-card calories">
          <div class="card-icon">🔥</div>
          <div class="card-content">
            <h3>Calories Aujourd'hui</h3>
            <div class="stat-value">{{ todayCalories }} / {{ caloriesGoal }}</div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="getCaloriesPercent()"></div>
            </div>
            <p class="stat-label">{{ getCaloriesPercent() }}% de l'objectif</p>
          </div>
        </div>

        <!-- Card Repas -->
        <div class="stat-card meals">
          <div class="card-icon">🍽️</div>
          <div class="card-content">
            <h3>Repas du Jour</h3>
            <div class="stat-value">{{ todayMeals }}</div>
            <p class="stat-label">{{ todayMeals > 0 ? 'repas enregistrés' : 'Aucun repas' }}</p>
            <button class="btn-action" routerLink="/meals">+ Ajouter un repas</button>
          </div>
        </div>

        <!-- Card Eau -->
        <div class="stat-card water">
          <div class="card-icon">💧</div>
          <div class="card-content">
            <h3>Hydratation</h3>
            <div class="stat-value">{{ todayWater }}ml / {{ waterGoal }}ml</div>
            <div class="progress-bar">
              <div class="progress-fill water-fill" [style.width.%]="getWaterPercent()"></div>
            </div>
            <p class="stat-label">{{ getWaterPercent() }}% de l'objectif</p>
          </div>
        </div>

        <!-- Card Protéines -->
        <div class="stat-card protein">
          <div class="card-icon">🥩</div>
          <div class="card-content">
            <h3>Protéines</h3>
            <div class="stat-value">{{ todayProtein }}g</div>
            <p class="stat-label">Consommées aujourd'hui</p>
          </div>
        </div>

        <!-- Card Glucides -->
        <div class="stat-card carbs">
          <div class="card-icon">🍞</div>
          <div class="card-content">
            <h3>Glucides</h3>
            <div class="stat-value">{{ todayCarbs }}g</div>
            <p class="stat-label">Consommés aujourd'hui</p>
          </div>
        </div>

        <!-- Card Lipides -->
        <div class="stat-card fats">
          <div class="card-icon">🥑</div>
          <div class="card-content">
            <h3>Lipides</h3>
            <div class="stat-value">{{ todayFats }}g</div>
            <p class="stat-label">Consommés aujourd'hui</p>
          </div>
        </div>
      </div>

      <!-- Graphique de la semaine -->
      <div class="chart-section">
        <h2>📊 Tendances de la Semaine</h2>
        <div class="week-chart">
          <div class="chart-bars">
            <div *ngFor="let day of weekData" class="chart-bar-container">
              <div class="chart-bar" [style.height.%]="getBarHeight(day.calories)">
                <span class="bar-value">{{ day.calories }}</span>
              </div>
              <span class="bar-label">{{ day.day }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Rapides -->
      <div class="quick-actions">
        <h2>⚡ Actions Rapides</h2>
        <div class="actions-grid">
          <button class="action-btn" routerLink="/meals">
            <span class="action-icon">🍽️</span>
            <span class="action-text">Ajouter un Repas</span>
          </button>
          <button class="action-btn" routerLink="/water">
            <span class="action-icon">💧</span>
            <span class="action-text">Enregistrer Eau</span>
          </button>
          <button class="action-btn" routerLink="/foods">
            <span class="action-icon">🥗</span>
            <span class="action-text">Chercher Aliment</span>
          </button>
          <button class="action-btn" routerLink="/analysis">
            <span class="action-icon">📈</span>
            <span class="action-text">Voir Analyses</span>
          </button>
        </div>
      </div>

      <!-- Derniers Repas -->
      <div class="recent-meals" *ngIf="recentMeals.length > 0">
        <h2>🕐 Derniers Repas</h2>
        <div class="meals-list">
          <div *ngFor="let meal of recentMeals" class="meal-item">
            <div class="meal-info">
              <h4>{{ meal.name }}</h4>
              <p class="meal-time">{{ formatDate(meal.date) }}</p>
            </div>
            <div class="meal-calories">
              <span class="calories-badge">{{ meal.calories }} kcal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 20px 30px;
      border-radius: 15px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .header-content h1 {
      margin: 0;
      color: #667eea;
      font-size: 2rem;
    }

    .welcome-text {
      margin: 5px 0 0 0;
      color: #666;
    }

    .btn-logout {
      padding: 10px 20px;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-logout:hover {
      background: #c0392b;
      transform: translateY(-2px);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      border-radius: 15px;
      padding: 25px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transition: transform 0.3s;
    }

    .stat-card:hover {
      transform: translateY(-5px);
    }

    .card-icon {
      font-size: 3rem;
      margin-bottom: 10px;
    }

    .card-content h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 1.1rem;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 10px;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
      margin: 5px 0;
    }

    .progress-bar {
      background: #e0e0e0;
      border-radius: 10px;
      height: 10px;
      overflow: hidden;
      margin: 10px 0;
    }

    .progress-fill {
      background: linear-gradient(90deg, #667eea, #764ba2);
      height: 100%;
      transition: width 0.5s ease;
    }

    .water-fill {
      background: linear-gradient(90deg, #3498db, #2980b9);
    }

    .btn-action {
      margin-top: 10px;
      padding: 8px 16px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-action:hover {
      background: #5568d3;
    }

    .chart-section {
      background: white;
      border-radius: 15px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .chart-section h2 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .week-chart {
      height: 300px;
    }

    .chart-bars {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 250px;
      padding: 20px 0;
    }

    .chart-bar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }

    .chart-bar {
      width: 60px;
      background: linear-gradient(to top, #667eea, #764ba2);
      border-radius: 8px 8px 0 0;
      position: relative;
      transition: all 0.3s;
      min-height: 20px;
    }

    .chart-bar:hover {
      opacity: 0.8;
    }

    .bar-value {
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-weight: bold;
      color: #667eea;
      font-size: 0.9rem;
    }

    .bar-label {
      margin-top: 10px;
      font-size: 0.85rem;
      color: #666;
    }

    .quick-actions {
      background: white;
      border-radius: 15px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .quick-actions h2 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 1rem;
    }

    .action-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .action-icon {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }

    .action-text {
      font-weight: 600;
    }

    .recent-meals {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .recent-meals h2 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .meals-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .meal-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 10px;
      transition: all 0.3s;
    }

    .meal-item:hover {
      background: #e9ecef;
      transform: translateX(5px);
    }

    .meal-info h4 {
      margin: 0 0 5px 0;
      color: #333;
    }

    .meal-time {
      margin: 0;
      color: #666;
      font-size: 0.85rem;
    }

    .calories-badge {
      padding: 8px 16px;
      background: #667eea;
      color: white;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
      
      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;

  // Stats du jour
  todayCalories = 0;
  caloriesGoal = 2000;
  todayMeals = 0;
  todayWater = 0;
  waterGoal = 2000;
  todayProtein = 0;
  todayCarbs = 0;
  todayFats = 0;

  // Données de la semaine
  weekData = [
    { day: 'Lun', calories: 1800 },
    { day: 'Mar', calories: 2100 },
    { day: 'Mer', calories: 1950 },
    { day: 'Jeu', calories: 2200 },
    { day: 'Ven', calories: 1850 },
    { day: 'Sam', calories: 2050 },
    { day: 'Dim', calories: 1900 }
  ];

  recentMeals: any[] = [];

  constructor(
    private authService: AuthService,
    private mealService: MealService,
    private waterService: WaterService,
    private foodService: FoodService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Charger les repas du jour
    this.mealService.getAllMeals().subscribe({
      next: (meals: any[]) => {
        this.recentMeals = meals.slice(0, 5);
        this.todayMeals = meals.length;
        this.todayCalories = meals.reduce((sum: number, meal: any) => sum + (meal.calories || meal.totalCalories || 0), 0);
        this.todayProtein = meals.reduce((sum: number, meal: any) => sum + (meal.protein || meal.totalProtein || 0), 0);
        this.todayCarbs = meals.reduce((sum: number, meal: any) => sum + (meal.carbs || meal.totalCarbs || 0), 0);
        this.todayFats = meals.reduce((sum: number, meal: any) => sum + (meal.fats || meal.totalFat || 0), 0);
      },
      error: (err: any) => console.error('Erreur chargement repas:', err)
    });

    // Charger les données d'eau
    this.waterService.getAllWaterIntakes().subscribe({
      next: (intakes: any[]) => {
        this.todayWater = intakes.reduce((sum: number, intake: any) => sum + (intake.amount || intake.amountMl || 0), 0);
      },
      error: (err: any) => console.error('Erreur chargement eau:', err)
    });
  }

  getCaloriesPercent(): number {
    return Math.min(Math.round((this.todayCalories / this.caloriesGoal) * 100), 100);
  }

  getWaterPercent(): number {
    return Math.min(Math.round((this.todayWater / this.waterGoal) * 100), 100);
  }

  getBarHeight(calories: number): number {
    const maxCalories = Math.max(...this.weekData.map(d => d.calories));
    return (calories / maxCalories) * 100;
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  logout() {
    this.authService.logout();
  }
}

