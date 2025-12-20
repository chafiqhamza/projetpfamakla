import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'checking' | 'success' | 'error';
  message: string;
  responseTime?: number;
}

@Component({
  selector: 'app-diagnostic',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diagnostic-page">
      <h1>🔍 Diagnostic des Services</h1>
      
      <div class="info-box">
        <h3>📋 Configuration</h3>
        <p><strong>API URL:</strong> {{ apiUrl }}</p>
        <p><strong>Environnement:</strong> {{ environment.production ? 'Production' : 'Développement' }}</p>
      </div>

      <button class="btn-test" (click)="runDiagnostics()" [disabled]="testing">
        {{ testing ? '⏳ Test en cours...' : '🔄 Lancer les tests' }}
      </button>

      <div class="services-grid">
        <div *ngFor="let service of services" 
             class="service-card"
             [ngClass]="service.status">
          <div class="service-header">
            <h3>{{ service.name }}</h3>
            <span class="status-badge" [ngClass]="service.status">
              <span *ngIf="service.status === 'checking'">⏳</span>
              <span *ngIf="service.status === 'success'">✅</span>
              <span *ngIf="service.status === 'error'">❌</span>
            </span>
          </div>
          
          <div class="service-details">
            <p class="url">{{ service.url }}</p>
            <p class="message" [ngClass]="service.status">{{ service.message }}</p>
            <p class="response-time" *ngIf="service.responseTime">
              ⚡ {{ service.responseTime }}ms
            </p>
          </div>
        </div>
      </div>

      <div class="recommendations" *ngIf="hasErrors">
        <h3>💡 Recommandations</h3>
        <div class="recommendation-box">
          <p><strong>Services en erreur détectés !</strong></p>
          <ol>
            <li>Vérifiez que tous les services sont démarrés</li>
            <li>Consultez Eureka Dashboard : <a href="http://localhost:8761" target="_blank">http://localhost:8761</a></li>
            <li>Vérifiez les logs des services dans les terminaux</li>
            <li>Si nécessaire, redémarrez tous les services avec <code>START-ALL-SERVICES.ps1</code></li>
          </ol>
        </div>
      </div>

      <div class="success-box" *ngIf="allSuccess">
        <h3>🎉 Tous les services fonctionnent correctement !</h3>
        <p>Vous pouvez commencer à utiliser l'application.</p>
      </div>
    </div>
  `,
  styles: [`
    .diagnostic-page {
      padding: 2rem;
      animation: fadeIn 0.5s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    h1 {
      color: #2c3e50;
      margin-bottom: 1.5rem;
      font-size: 2rem;
    }

    .info-box {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 1.5rem;
    }

    .info-box h3 {
      color: #667eea;
      margin-bottom: 1rem;
    }

    .info-box p {
      margin: 0.5rem 0;
      color: #2c3e50;
    }

    .btn-test {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
      border: none;
      border-radius: 10px;
      font-size: 1.1rem;
      cursor: pointer;
      margin-bottom: 2rem;
      transition: transform 0.3s;
    }

    .btn-test:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    .btn-test:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .service-card {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-left: 4px solid #ddd;
      transition: all 0.3s;
    }

    .service-card.checking {
      border-left-color: #f39c12;
    }

    .service-card.success {
      border-left-color: #27ae60;
    }

    .service-card.error {
      border-left-color: #e74c3c;
    }

    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .service-header h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.2rem;
    }

    .status-badge {
      font-size: 1.5rem;
    }

    .service-details .url {
      color: #7f8c8d;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      word-break: break-all;
    }

    .service-details .message {
      margin: 0.5rem 0;
      font-weight: 500;
    }

    .message.checking {
      color: #f39c12;
    }

    .message.success {
      color: #27ae60;
    }

    .message.error {
      color: #e74c3c;
    }

    .response-time {
      color: #667eea;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .recommendations {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 1.5rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
    }

    .recommendations h3 {
      color: #856404;
      margin-bottom: 1rem;
    }

    .recommendation-box {
      color: #856404;
    }

    .recommendation-box ol {
      margin-left: 1.5rem;
      margin-top: 1rem;
    }

    .recommendation-box li {
      margin: 0.5rem 0;
    }

    .recommendation-box a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    .recommendation-box a:hover {
      text-decoration: underline;
    }

    .recommendation-box code {
      background: #f8f9fa;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
    }

    .success-box {
      background: #d4edda;
      border: 1px solid #28a745;
      padding: 1.5rem;
      border-radius: 10px;
      text-align: center;
    }

    .success-box h3 {
      color: #155724;
      margin-bottom: 0.5rem;
    }

    .success-box p {
      color: #155724;
      margin: 0;
    }
  `]
})
export class DiagnosticComponent implements OnInit {
  apiUrl = environment.apiUrl;
  environment = environment;
  testing = false;
  hasErrors = false;
  allSuccess = false;

  services: ServiceStatus[] = [
    {
      name: 'API Gateway',
      url: 'http://localhost:8080/actuator/health',
      status: 'checking',
      message: 'En attente...'
    },
    {
      name: 'Eureka Server',
      url: 'http://localhost:8761/actuator/health',
      status: 'checking',
      message: 'En attente...'
    },
    {
      name: 'Meal Service (direct)',
      url: 'http://localhost:8084/api/meals',
      status: 'checking',
      message: 'En attente...'
    },
    {
      name: 'Water Service (direct)',
      url: 'http://localhost:8085/api/water',
      status: 'checking',
      message: 'En attente...'
    },
    {
      name: 'Meal Service (via Gateway)',
      url: 'http://localhost:8080/api/meals',
      status: 'checking',
      message: 'En attente...'
    },
    {
      name: 'Water Service (via Gateway)',
      url: 'http://localhost:8080/api/water',
      status: 'checking',
      message: 'En attente...'
    }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Auto-start diagnostics on component load
    setTimeout(() => this.runDiagnostics(), 500);
  }

  async runDiagnostics() {
    this.testing = true;
    this.hasErrors = false;
    this.allSuccess = false;

    // Reset all services
    this.services.forEach(service => {
      service.status = 'checking';
      service.message = 'Test en cours...';
      service.responseTime = undefined;
    });

    // Test each service
    for (const service of this.services) {
      await this.testService(service);
    }

    this.testing = false;
    this.hasErrors = this.services.some(s => s.status === 'error');
    this.allSuccess = this.services.every(s => s.status === 'success');
  }

  private async testService(service: ServiceStatus): Promise<void> {
    const startTime = Date.now();

    try {
      const response: any = await this.http.get(service.url, { observe: 'response' }).toPromise();
      service.responseTime = Date.now() - startTime;
      service.status = 'success';
      service.message = 'Service opérationnel';

      // Ajouter plus d'informations pour les services via Gateway
      if (service.url.includes('localhost:8080')) {
        service.message += ' (via API Gateway ✓)';
      }
    } catch (error: any) {
      service.responseTime = Date.now() - startTime;
      service.status = 'error';

      if (error.status === 0) {
        // Erreur CORS ou service non accessible
        if (service.url.includes('localhost:8080')) {
          service.message = '❌ Gateway ne route pas vers ce service. Vérifiez:\n1. Service enregistré dans Eureka?\n2. Gateway redémarrée après les services?';
        } else {
          service.message = '❌ Service inaccessible - Vérifiez qu\'il est démarré';
        }
      } else if (error.status === 404) {
        if (service.url.includes('localhost:8080')) {
          service.message = '❌ Route non configurée dans Gateway ou service non trouvé';
        } else {
          service.message = '❌ Endpoint non trouvé - Vérifiez l\'URL';
        }
      } else if (error.status === 400) {
        service.message = '❌ Erreur CORS - Configuration Gateway incorrecte';
      } else if (error.status === 500) {
        service.message = '❌ Erreur interne du service - Vérifiez les logs';
      } else if (error.status === 503) {
        service.message = '❌ Service temporairement indisponible';
      } else {
        service.message = `❌ Erreur HTTP ${error.status}: ${error.statusText || 'Erreur inconnue'}`;
      }

      // Ajouter le message d'erreur détaillé si disponible
      if (error.error && typeof error.error === 'string') {
        service.message += `\nDétails: ${error.error.substring(0, 100)}`;
      }
    }
  }
}

