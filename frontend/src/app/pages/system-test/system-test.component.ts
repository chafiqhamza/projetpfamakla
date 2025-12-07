import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ServiceTest {
  name: string;
  status: 'pending' | 'success' | 'error';
  endpoint: string;
  response?: any;
  error?: string;
  duration?: number;
}

@Component({
  selector: 'app-system-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <div class="test-header">
        <h1>🧪 Test Complet du Système Makla</h1>
        <p>Vérification de tous les microservices et opérations CRUD</p>
        <button (click)="runAllTests()" [disabled]="testing" class="test-btn">
          <span *ngIf="testing">⏳ Tests en cours...</span>
          <span *ngIf="!testing">▶️ Lancer tous les tests</span>
        </button>
      </div>

      <div class="test-grid">
        <!-- Services Backend -->
        <div class="test-section">
          <h2>🔧 Services Backend</h2>
          <div *ngFor="let test of backendTests" class="test-item" [class.success]="test.status === 'success'" [class.error]="test.status === 'error'">
            <div class="test-status">
              <span *ngIf="test.status === 'pending'">⏳</span>
              <span *ngIf="test.status === 'success'">✅</span>
              <span *ngIf="test.status === 'error'">❌</span>
            </div>
            <div class="test-info">
              <div class="test-name">{{ test.name }}</div>
              <div class="test-endpoint">{{ test.endpoint }}</div>
              <div *ngIf="test.duration" class="test-duration">{{ test.duration }}ms</div>
              <div *ngIf="test.error" class="test-error">{{ test.error }}</div>
            </div>
          </div>
        </div>

        <!-- Food Service CRUD -->
        <div class="test-section">
          <h2>🍎 Food Service - CRUD</h2>
          <div *ngFor="let test of foodTests" class="test-item" [class.success]="test.status === 'success'" [class.error]="test.status === 'error'">
            <div class="test-status">
              <span *ngIf="test.status === 'pending'">⏳</span>
              <span *ngIf="test.status === 'success'">✅</span>
              <span *ngIf="test.status === 'error'">❌</span>
            </div>
            <div class="test-info">
              <div class="test-name">{{ test.name }}</div>
              <div class="test-endpoint">{{ test.endpoint }}</div>
              <div *ngIf="test.duration" class="test-duration">{{ test.duration }}ms</div>
              <div *ngIf="test.error" class="test-error">{{ test.error }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 20px;
      background: #f5f5f5;
      min-height: 100vh;
    }
    
    .test-header {
      text-align: center;
      margin-bottom: 40px;
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .test-header h1 {
      color: #2c3e50;
      margin-bottom: 15px;
    }
    
    .test-header p {
      color: #7f8c8d;
      font-size: 1.2em;
      margin-bottom: 25px;
    }
    
    .test-btn {
      padding: 15px 40px;
      font-size: 1.2em;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .test-btn:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    
    .test-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .test-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 30px;
    }
    
    .test-section {
      background: white;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .test-section h2 {
      color: #2c3e50;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ecf0f1;
    }
    
    .test-item {
      display: flex;
      align-items: start;
      gap: 15px;
      padding: 15px;
      margin-bottom: 10px;
      background: #f8f9fa;
      border-radius: 8px;
      transition: all 0.3s ease;
    }
    
    .test-item.success {
      background: #d4edda;
      border-left: 4px solid #28a745;
    }
    
    .test-item.error {
      background: #f8d7da;
      border-left: 4px solid #dc3545;
    }
    
    .test-status {
      font-size: 1.5em;
    }
    
    .test-info {
      flex: 1;
    }
    
    .test-name {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 5px;
    }
    
    .test-endpoint {
      font-size: 0.9em;
      color: #7f8c8d;
      font-family: monospace;
      margin-bottom: 5px;
    }
    
    .test-duration {
      font-size: 0.85em;
      color: #95a5a6;
    }
    
    .test-error {
      color: #dc3545;
      font-size: 0.9em;
      margin-top: 5px;
    }
  `]
})
export class SystemTestComponent implements OnInit {
  testing = false;
  backendTests: ServiceTest[] = [];
  foodTests: ServiceTest[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.initializeTests();
  }

  initializeTests() {
    this.backendTests = [
      { name: 'Eureka Server', status: 'pending', endpoint: 'http://localhost:8761' },
      { name: 'Config Server', status: 'pending', endpoint: 'http://localhost:8888' },
      { name: 'API Gateway', status: 'pending', endpoint: `${environment.apiUrl}/actuator/health` }
    ];

    this.foodTests = [
      { name: 'GET All Foods', status: 'pending', endpoint: `${environment.apiUrl}/foods` },
      { name: 'CREATE Food', status: 'pending', endpoint: `${environment.apiUrl}/foods` },
      { name: 'UPDATE Food', status: 'pending', endpoint: `${environment.apiUrl}/foods/{id}` },
      { name: 'DELETE Food', status: 'pending', endpoint: `${environment.apiUrl}/foods/{id}` }
    ];
  }

  async runAllTests() {
    this.testing = true;
    this.initializeTests();

    // Test backend services
    for (const test of this.backendTests) {
      await this.runTest(test);
    }

    // Test food service CRUD
    for (const test of this.foodTests) {
      await this.runTest(test);
    }

    this.testing = false;
  }

  async runTest(test: ServiceTest) {
    const startTime = Date.now();
    try {
      const response = await firstValueFrom(this.http.get(test.endpoint));
      test.status = 'success';
      test.response = response;
      test.duration = Date.now() - startTime;
    } catch (error: any) {
      test.status = 'error';
      test.error = error.message || 'Une erreur est survenue';
      test.duration = Date.now() - startTime;
    }
  }
}

