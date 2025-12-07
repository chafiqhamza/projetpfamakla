import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WaterService } from '../../services/water.service';
import { WaterIntake } from '../../models/models';

@Component({
  selector: 'app-water',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="water-page">
      <h1>💧 Suivi d'Hydratation</h1>

      <div class="water-summary">
        <div class="total-card">
          <h2>{{ todayTotal }} ml</h2>
          <p>Aujourd'hui</p>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="getProgressPercent()"></div>
          </div>
          <p class="goal">Objectif: 2000 ml</p>
        </div>
      </div>

      <div class="quick-add">
        <button class="water-btn" (click)="addQuickWater(250)">+ 250ml</button>
        <button class="water-btn" (click)="addQuickWater(500)">+ 500ml</button>
        <button class="water-btn" (click)="addQuickWater(750)">+ 750ml</button>
        <button class="water-btn" (click)="addQuickWater(1000)">+ 1L</button>
      </div>

      <div class="history" *ngIf="waterIntakes.length > 0">
        <h3>Historique</h3>
        <div class="intake-list">
          <div class="intake-item" *ngFor="let intake of waterIntakes">
            <span class="amount">{{ intake.amount }} ml</span>
            <span class="time">{{ formatDate(intake.date) }}</span>
            <button class="btn-delete" (click)="deleteIntake(intake.id!)">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .water-page {
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

    .water-summary {
      margin-bottom: 2rem;
    }

    .total-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }

    .total-card h2 {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }

    .progress-bar {
      background: rgba(255,255,255,0.2);
      height: 20px;
      border-radius: 10px;
      overflow: hidden;
      margin: 1rem 0;
    }

    .progress-fill {
      background: white;
      height: 100%;
      transition: width 0.5s;
    }

    .goal {
      opacity: 0.8;
      font-size: 0.9rem;
    }

    .quick-add {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .water-btn {
      flex: 1;
      min-width: 150px;
      padding: 1.5rem;
      background: white;
      border: 2px solid #667eea;
      color: #667eea;
      border-radius: 15px;
      font-size: 1.2rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
    }

    .water-btn:hover {
      background: #667eea;
      color: white;
      transform: translateY(-5px);
    }

    .history {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .history h3 {
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .intake-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .intake-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .amount {
      font-weight: bold;
      color: #2c3e50;
    }

    .time {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .btn-delete {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
    }

    .btn-delete:hover {
      background: #c0392b;
    }
  `]
})
export class WaterComponent implements OnInit {
  waterIntakes: WaterIntake[] = [];
  todayTotal = 0;
  loading = false;

  constructor(private waterService: WaterService) {}

  ngOnInit() {
    this.loadWaterIntakes();
    this.loadTodayTotal();
  }

  loadWaterIntakes() {
    this.loading = true;
    this.waterService.getAllWaterIntakes().subscribe({
      next: (data) => {
        this.waterIntakes = data.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading water intakes:', err);
        this.loading = false;
      }
    });
  }

  loadTodayTotal() {
    this.waterService.getTodayTotal().subscribe({
      next: (total) => {
        this.todayTotal = total;
      },
      error: (err) => {
        console.error('Error loading today total:', err);
      }
    });
  }

  addQuickWater(amount: number) {
    const intake: WaterIntake = {
      amount: amount,
      date: new Date().toISOString()
    };

    this.waterService.addWaterIntake(intake).subscribe({
      next: (newIntake) => {
        this.waterIntakes.unshift(newIntake);
        this.todayTotal += amount;
      },
      error: (err) => {
        console.error('Error adding water intake:', err);
      }
    });
  }

  deleteIntake(id: number) {
    this.waterService.deleteWaterIntake(id).subscribe({
      next: () => {
        const intake = this.waterIntakes.find(w => w.id === id);
        if (intake) {
          this.todayTotal -= intake.amount;
        }
        this.waterIntakes = this.waterIntakes.filter(w => w.id !== id);
      },
      error: (err) => {
        console.error('Error deleting water intake:', err);
      }
    });
  }

  getProgressPercent(): number {
    const goal = 2000;
    return Math.min((this.todayTotal / goal) * 100, 100);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

