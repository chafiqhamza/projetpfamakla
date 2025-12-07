import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodService } from '../../services/food.service';
import { Food } from '../../models/models';

@Component({
  selector: 'app-foods',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="foods-page">
      <div class="page-header">
        <h1>🍎 Gestion des Aliments</h1>
        <button class="btn-primary" (click)="showAddForm = !showAddForm">
          {{ showAddForm ? 'Annuler' : '+ Nouvel Aliment' }}
        </button>
      </div>

      <!-- Add/Edit Form -->
      <div class="form-card" *ngIf="showAddForm || editingFood">
        <h2>{{ editingFood ? 'Modifier' : 'Ajouter' }} un Aliment</h2>
        <form (ngSubmit)="editingFood ? updateFood() : createFood()">
          <div class="form-grid">
            <div class="form-group">
              <label>Nom de l'aliment *</label>
              <input type="text" [(ngModel)]="currentFood.name" name="name" required>
            </div>
            <div class="form-group">
              <label>Catégorie</label>
              <select [(ngModel)]="currentFood.category" name="category">
                <option value="">Sélectionner...</option>
                <option value="fruits">Fruits</option>
                <option value="vegetables">Légumes</option>
                <option value="proteins">Protéines</option>
                <option value="dairy">Produits laitiers</option>
                <option value="grains">Céréales</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div class="form-group">
              <label>Calories (kcal) *</label>
              <input type="number" [(ngModel)]="currentFood.calories" name="calories" required>
            </div>
            <div class="form-group">
              <label>Protéines (g) *</label>
              <input type="number" step="0.1" [(ngModel)]="currentFood.protein" name="protein" required>
            </div>
            <div class="form-group">
              <label>Glucides (g) *</label>
              <input type="number" step="0.1" [(ngModel)]="currentFood.carbohydrates" name="carbohydrates" required>
            </div>
            <div class="form-group">
              <label>Lipides (g) *</label>
              <input type="number" step="0.1" [(ngModel)]="currentFood.fat" name="fat" required>
            </div>
            <div class="form-group">
              <label>Fibres (g)</label>
              <input type="number" step="0.1" [(ngModel)]="currentFood.fiber" name="fiber">
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">{{ editingFood ? 'Mettre à jour' : 'Ajouter' }}</button>
            <button type="button" class="btn-secondary" (click)="cancelEdit()">Annuler</button>
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

      <!-- Foods List -->
      <div class="foods-grid" *ngIf="!loading">
        <div class="food-card" *ngFor="let food of foods">
          <div class="food-header">
            <h3>{{ food.name }}</h3>
            <span class="category-badge" *ngIf="food.category">{{ food.category }}</span>
          </div>
          <div class="food-nutrition">
            <div class="nutrition-item">
              <span class="label">Calories</span>
              <span class="value">{{ food.calories }} kcal</span>
            </div>
            <div class="nutrition-item">
              <span class="label">Protéines</span>
              <span class="value">{{ food.protein }}g</span>
            </div>
            <div class="nutrition-item">
              <span class="label">Glucides</span>
              <span class="value">{{ food.carbohydrates }}g</span>
            </div>
            <div class="nutrition-item">
              <span class="label">Lipides</span>
              <span class="value">{{ food.fat }}g</span>
            </div>
            <div class="nutrition-item" *ngIf="food.fiber">
              <span class="label">Fibres</span>
              <span class="value">{{ food.fiber }}g</span>
            </div>
          </div>
          <div class="food-actions">
            <button class="btn-edit" (click)="startEdit(food)">✏️ Modifier</button>
            <button class="btn-delete" (click)="deleteFood(food.id!)">🗑️ Supprimer</button>
          </div>
        </div>
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
  `]
})
export class FoodsComponent implements OnInit {
  foods: Food[] = [];
  currentFood: Food = this.getEmptyFood();
  showAddForm = false;
  editingFood: Food | null = null;
  loading = false;
  error = '';
  successMessage = '';

  constructor(private foodService: FoodService) {}

  ngOnInit() {
    this.loadFoods();
  }

  loadFoods() {
    this.loading = true;
    this.error = '';
    this.foodService.getAllFoods().subscribe({
      next: (data) => {
        this.foods = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des aliments. Vérifiez que les microservices sont démarrés.';
        this.loading = false;
        console.error('Error loading foods:', err);
      }
    });
  }

  createFood() {
    this.foodService.createFood(this.currentFood).subscribe({
      next: (food) => {
        this.foods.push(food);
        this.showSuccessMessage('Aliment ajouté avec succès !');
        this.resetForm();
      },
      error: (err) => {
        this.error = 'Erreur lors de l\'ajout de l\'aliment.';
        console.error('Error creating food:', err);
      }
    });
  }

  startEdit(food: Food) {
    this.editingFood = food;
    this.currentFood = { ...food };
    this.showAddForm = false;
  }

  updateFood() {
    if (this.editingFood && this.editingFood.id) {
      this.foodService.updateFood(this.editingFood.id, this.currentFood).subscribe({
        next: (updatedFood) => {
          const index = this.foods.findIndex(f => f.id === updatedFood.id);
          if (index !== -1) {
            this.foods[index] = updatedFood;
          }
          this.showSuccessMessage('Aliment modifié avec succès !');
          this.resetForm();
        },
        error: (err) => {
          this.error = 'Erreur lors de la modification de l\'aliment.';
          console.error('Error updating food:', err);
        }
      });
    }
  }

  deleteFood(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet aliment ?')) {
      this.foodService.deleteFood(id).subscribe({
        next: () => {
          this.foods = this.foods.filter(f => f.id !== id);
          this.showSuccessMessage('Aliment supprimé avec succès !');
        },
        error: (err) => {
          this.error = 'Erreur lors de la suppression de l\'aliment.';
          console.error('Error deleting food:', err);
        }
      });
    }
  }

  cancelEdit() {
    this.resetForm();
  }

  resetForm() {
    this.currentFood = this.getEmptyFood();
    this.editingFood = null;
    this.showAddForm = false;
  }

  getEmptyFood(): Food {
    return {
      name: '',
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      category: ''
    };
  }

  showSuccessMessage(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}

