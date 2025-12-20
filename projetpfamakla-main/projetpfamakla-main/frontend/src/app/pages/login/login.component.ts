import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>🍎 Makla</h1>
          <h2>Connexion</h2>
          <p>Bienvenue ! Connectez-vous à votre compte</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              formControlName="username"
              class="form-control"
              [class.error]="submitted && f['username'].errors"
              placeholder="Entrez votre nom d'utilisateur"
            />
            <div class="error-message" *ngIf="submitted && f['username'].errors">
              <span *ngIf="f['username'].errors['required']">Le nom d'utilisateur est requis</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="form-control"
              [class.error]="submitted && f['password'].errors"
              placeholder="Entrez votre mot de passe"
            />
            <div class="error-message" *ngIf="submitted && f['password'].errors">
              <span *ngIf="f['password'].errors['required']">Le mot de passe est requis</span>
            </div>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn-primary"
            [disabled]="loading"
          >
            <span *ngIf="!loading">Se connecter</span>
            <span *ngIf="loading">Connexion en cours...</span>
          </button>

          <div class="register-link">
            Pas encore de compte ?
            <a routerLink="/register">S'inscrire</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 450px;
      animation: slideUp 0.5s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .login-header h1 {
      font-size: 3rem;
      margin-bottom: 10px;
      color: #667eea;
    }

    .login-header h2 {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 1.8rem;
    }

    .login-header p {
      color: #7f8c8d;
      font-size: 1rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      color: #2c3e50;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .form-control {
      padding: 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.3s;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-control.error {
      border-color: #e74c3c;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-top: 5px;
    }

    .btn-primary {
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 10px;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .register-link {
      text-align: center;
      color: #7f8c8d;
      font-size: 0.95rem;
    }

    .register-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      margin-left: 5px;
    }

    .register-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Redirect if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
    }

    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Login error:', error);
        console.log('Error details:', JSON.stringify(error, null, 2));

        // Afficher les erreurs de validation si disponibles
        if (error.error?.validationErrors) {
          const validationErrors = Object.values(error.error.validationErrors).join(', ');
          this.errorMessage = validationErrors;
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
        } else {
          this.errorMessage = 'Une erreur est survenue lors de la connexion';
        }

        this.loading = false;
      }
    });
  }
}

