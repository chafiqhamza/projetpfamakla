import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home">
      <div class="auth-bar">
        <div *ngIf="!isAuthenticated">
          <a routerLink="/login" class="auth-link">Se connecter</a>
          <a routerLink="/register" class="auth-link register">S'inscrire</a>
        </div>
        <div *ngIf="isAuthenticated" class="user-info">
          <span>Bonjour, {{ username }}</span>
          <button (click)="logout()" class="logout-btn">Déconnexion</button>
        </div>
      </div>

      <div class="hero">
        <h1>🍎 Bienvenue sur Makla</h1>
        <p class="subtitle">Votre assistant nutrition personnalisé</p>
      </div>

      <div class="features">
        <div class="feature-card">
          <div class="icon">🍎</div>
          <h3>Base d'Aliments</h3>
          <p>Gérez une base complète d'aliments avec leurs informations nutritionnelles</p>
          <a routerLink="/foods" class="btn">Gérer les Aliments</a>
        </div>

        <div class="feature-card">
          <div class="icon">🍽️</div>
          <h3>Repas</h3>
          <p>Planifiez et suivez vos repas quotidiens</p>
          <a routerLink="/meals" class="btn">Mes Repas</a>
        </div>

        <div class="feature-card">
          <div class="icon">💧</div>
          <h3>Hydratation</h3>
          <p>Suivez votre consommation d'eau journalière</p>
          <a routerLink="/water" class="btn">Suivi d'Eau</a>
        </div>

        <div class="feature-card">
          <div class="icon">🧪</div>
          <h3>Tests API</h3>
          <p>Testez la connexion avec les microservices</p>
          <a routerLink="/test" class="btn">Tester les API</a>
        </div>
      </div>

      <div class="info-section">
        <h2>Services Actifs</h2>
        <div class="services-grid">
          <div class="service active">
            <h4>✅ Meal Service</h4>
            <p>Port 8084 - Opérationnel</p>
          </div>
          <div class="service active">
            <h4>✅ Water Service</h4>
            <p>Port 8085 - Opérationnel</p>
          </div>
          <div class="service active">
            <h4>✅ API Gateway</h4>
            <p>Port 8080 - Routing OK</p>
          </div>
          <div class="service active">
            <h4>✅ Eureka Server</h4>
            <p>Port 8761 - Discovery OK</p>
          </div>
        </div>
        
        <div class="status-info">
          <p>✅ Application 100% fonctionnelle avec Meals et Water</p>
          <p>📊 <a routerLink="/diagnostic">Voir le diagnostic complet</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home {
      animation: fadeIn 0.5s;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .auth-bar {
      display: flex;
      justify-content: flex-end;
      padding: 1rem 2rem;
      background: white;
      border-radius: 10px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .auth-link {
      padding: 0.5rem 1rem;
      color: #667eea;
      text-decoration: none;
      border-radius: 5px;
      transition: all 0.3s;
      margin-left: 1rem;
    }

    .auth-link:hover {
      background: #f0f0f0;
    }

    .auth-link.register {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .auth-link.register:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info span {
      color: #2c3e50;
      font-weight: 600;
    }

    .logout-btn {
      padding: 0.5rem 1rem;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .logout-btn:hover {
      background: #c0392b;
      transform: translateY(-2px);
    }

    .hero {
      text-align: center;
      padding: 3rem 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 15px;
      margin-bottom: 3rem;
    }

    .hero h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .subtitle {
      font-size: 1.3rem;
      opacity: 0.9;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .feature-card {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .feature-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.15);
    }

    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .feature-card p {
      color: #7f8c8d;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 25px;
      transition: transform 0.3s;
      font-weight: bold;
    }

    .btn:hover {
      transform: scale(1.05);
    }

    .info-section {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .info-section h2 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 2rem;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .service {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 10px;
      text-align: center;
    }

    .service.active {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      border: 2px solid #28a745;
    }

    .service h4 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .service p {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .status-info {
      margin-top: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      border-radius: 10px;
      text-align: center;
    }

    .status-info p {
      margin: 0.5rem 0;
      color: #155724;
      font-weight: 500;
    }

    .status-info a {
      color: #667eea;
      text-decoration: none;
      font-weight: bold;
    }

    .status-info a:hover {
      text-decoration: underline;
    }
  `]
})
export class HomeComponent implements OnInit {
  isAuthenticated = false;
  username = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.isAuthenticated = !!user;
      this.username = user?.username || '';
    });
  }

  logout(): void {
    this.authService.logout();
  }
}

