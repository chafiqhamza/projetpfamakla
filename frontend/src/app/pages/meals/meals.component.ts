import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealService } from '../../services/meal.service';
import { Meal } from '../../models/models';

@Component({
  selector: 'app-meals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="meals-page">
      <h1>🍽️ Gestion des Repas</h1>
      
      <div class="alert alert-info">
        <p>📝 Section en développement. Fonctionnalité complète bientôt disponible.</p>
      </div>

      <div class="meals-list" *ngIf="meals.length > 0">
        <div class="meal-card" *ngFor="let meal of meals">
          <h3>{{ meal.name }}</h3>
          <p>{{ meal.description }}</p>
          <span class="meal-time">{{ meal.mealTime }}</span>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading && meals.length === 0">
        <p>Aucun repas enregistré pour le moment.</p>
      </div>
    </div>
  `,
  styles: [`
    .meals-page {
      animation: fadeIn 0.5s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    h1 {
      color: #2c3e50;
      margin-bottom: 2rem;
    }

    .alert-info {
      background: #e3f2fd;
      color: #1976d2;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
      margin-bottom: 2rem;
    }

    .meals-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .meal-card {
      background: white;
      padding: 1.5rem;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .meal-card h3 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .meal-time {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #7f8c8d;
      font-size: 1.2rem;
    }
  `]
})
export class MealsComponent implements OnInit {
  meals: Meal[] = [];
  loading = false;

  constructor(private mealService: MealService) {}

  ngOnInit() {
    this.loadMeals();
  }

  loadMeals() {
    this.loading = true;
    this.mealService.getAllMeals().subscribe({
      next: (data) => {
        this.meals = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading meals:', err);
        this.loading = false;
      }
    });
  }
}

