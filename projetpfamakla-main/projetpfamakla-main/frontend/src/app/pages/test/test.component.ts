import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  duration?: number;
}

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-page">
      <h1>🧪 Tests des Microservices</h1>

      <div class="test-header">
        <button class="btn-test" (click)="runAllTests()" [disabled]="testing">
          {{ testing ? '⏳ Tests en cours...' : '▶️ Lancer tous les tests' }}
        </button>
      </div>

      <div class="test-grid">
        <div class="test-section">
          <h2>Backend Services</h2>
          <div class="test-item" *ngFor="let test of backendTests" 
               [class.success]="test.status === 'success'"
               [class.error]="test.status === 'error'"
               [class.pending]="test.status === 'pending'">
            <div class="test-icon">
              <span *ngIf="test.status === 'pending'">⏳</span>
              <span *ngIf="test.status === 'success'">✅</span>
              <span *ngIf="test.status === 'error'">❌</span>
            </div>
            <div class="test-info">
              <div class="test-name">{{ test.name }}</div>
              <div class="test-message" *ngIf="test.message">{{ test.message }}</div>
              <div class="test-duration" *ngIf="test.duration">{{ test.duration }}ms</div>
            </div>
          </div>
        </div>

        <div class="test-section">
          <h2>API Endpoints</h2>
          <div class="test-item" *ngFor="let test of apiTests"
               [class.success]="test.status === 'success'"
               [class.error]="test.status === 'error'"
               [class.pending]="test.status === 'pending'">
            <div class="test-icon">
              <span *ngIf="test.status === 'pending'">⏳</span>
              <span *ngIf="test.status === 'success'">✅</span>
              <span *ngIf="test.status === 'error'">❌</span>
            </div>
            <div class="test-info">
              <div class="test-name">{{ test.name }}</div>
              <div class="test-message" *ngIf="test.message">{{ test.message }}</div>
              <div class="test-duration" *ngIf="test.duration">{{ test.duration }}ms</div>
            </div>
          </div>
        </div>
      </div>

      <div class="info-box">
        <h3>ℹ️ Configuration</h3>
        <p><strong>API URL:</strong> {{ apiUrl }}</p>
        <p><strong>Environment:</strong> {{ environment }}</p>
      </div>
    </div>
  `,
  styles: [`
    .test-page {
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

    .test-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .btn-test {
      padding: 1rem 2rem;
      font-size: 1.2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-test:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
    }

    .btn-test:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .test-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .test-section {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .test-section h2 {
      color: #2c3e50;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #ecf0f1;
    }

    .test-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      margin-bottom: 0.75rem;
      border-radius: 8px;
      background: #f8f9fa;
      transition: all 0.3s;
    }

    .test-item.pending {
      border-left: 4px solid #95a5a6;
    }

    .test-item.success {
      background: #d4edda;
      border-left: 4px solid #28a745;
    }

    .test-item.error {
      background: #f8d7da;
      border-left: 4px solid #dc3545;
    }

    .test-icon {
      font-size: 1.5rem;
    }

    .test-info {
      flex: 1;
    }

    .test-name {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }

    .test-message {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .test-duration {
      color: #95a5a6;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }

    .info-box {
      background: #e3f2fd;
      padding: 1.5rem;
      border-radius: 12px;
      border-left: 4px solid #2196f3;
    }

    .info-box h3 {
      color: #1976d2;
      margin-bottom: 1rem;
    }

    .info-box p {
      color: #424242;
      margin: 0.5rem 0;
    }
  `]
})
export class TestComponent implements OnInit {
  apiUrl = environment.apiUrl;
  environment = environment.production ? 'Production' : 'Development';
  testing = false;

  backendTests: TestResult[] = [
    { name: 'Eureka Server (8761)', status: 'pending' },
    { name: 'API Gateway (8080)', status: 'pending' },
    { name: 'Config Server (8888)', status: 'pending' }
  ];

  apiTests: TestResult[] = [
    { name: 'GET /api/foods', status: 'pending' },
    { name: 'GET /api/meals', status: 'pending' },
    { name: 'GET /api/water', status: 'pending' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Auto-run tests on load
    setTimeout(() => this.runAllTests(), 500);
  }

  async runAllTests() {
    this.testing = true;

    // Reset all tests
    this.backendTests.forEach(t => t.status = 'pending');
    this.apiTests.forEach(t => t.status = 'pending');

    // Test backend services
    await this.testUrl(this.backendTests[0], 'http://localhost:8761');
    await this.testUrl(this.backendTests[1], 'http://localhost:8080/actuator/health');
    await this.testUrl(this.backendTests[2], 'http://localhost:8888/actuator/health');

    // Test API endpoints
    await this.testUrl(this.apiTests[0], `${this.apiUrl}/foods`);
    await this.testUrl(this.apiTests[1], `${this.apiUrl}/meals`);
    await this.testUrl(this.apiTests[2], `${this.apiUrl}/water`);

    this.testing = false;
  }

  async testUrl(test: TestResult, url: string): Promise<void> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      this.http.get(url).subscribe({
        next: (response) => {
          test.status = 'success';
          test.message = 'Service accessible';
          test.duration = Date.now() - startTime;
          resolve();
        },
        error: (error) => {
          test.status = 'error';
          test.message = this.getErrorMessage(error);
          test.duration = Date.now() - startTime;
          resolve();
        }
      });
    });
  }

  getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'Service non accessible (CORS ou service arrêté)';
    } else if (error.status === 404) {
      return 'Endpoint non trouvé (404)';
    } else if (error.status === 500) {
      return 'Erreur serveur (500)';
    } else {
      return `Erreur HTTP ${error.status}`;
    }
  }
}

