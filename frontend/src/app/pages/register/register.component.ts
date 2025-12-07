import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h1>🍎 Makla</h1>
          <h2>Créer un compte</h2>
          <p>Rejoignez-nous pour suivre votre nutrition</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Prénom</label>
              <input
                id="firstName"
                type="text"
                formControlName="firstName"
                class="form-control"
                [class.error]="submitted && f['firstName'].errors"
                placeholder="Prénom"
              />
              <div class="error-message" *ngIf="submitted && f['firstName'].errors">
                <span *ngIf="f['firstName'].errors['required']">Le prénom est requis</span>
              </div>
            </div>

            <div class="form-group">
              <label for="lastName">Nom</label>
              <input
                id="lastName"
                type="text"
                formControlName="lastName"
                class="form-control"
                [class.error]="submitted && f['lastName'].errors"
                placeholder="Nom"
              />
              <div class="error-message" *ngIf="submitted && f['lastName'].errors">
                <span *ngIf="f['lastName'].errors['required']">Le nom est requis</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              formControlName="username"
              class="form-control"
              [class.error]="submitted && f['username'].errors"
              placeholder="Choisissez un nom d'utilisateur"
            />
            <div class="error-message" *ngIf="submitted && f['username'].errors">
              <span *ngIf="f['username'].errors['required']">Le nom d'utilisateur est requis</span>
              <span *ngIf="f['username'].errors['minlength']">Minimum 3 caractères</span>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="form-control"
              [class.error]="submitted && f['email'].errors"
              placeholder="votre.email@exemple.com"
            />
            <div class="error-message" *ngIf="submitted && f['email'].errors">
              <span *ngIf="f['email'].errors['required']">L'email est requis</span>
              <span *ngIf="f['email'].errors['email']">Email invalide</span>
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
              placeholder="Minimum 6 caractères"
            />
            <div class="error-message" *ngIf="submitted && f['password'].errors">
              <span *ngIf="f['password'].errors['required']">Le mot de passe est requis</span>
              <span *ngIf="f['password'].errors['minlength']">Minimum 6 caractères</span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              class="form-control"
              [class.error]="submitted && f['confirmPassword'].errors"
              placeholder="Confirmez votre mot de passe"
            />
            <div class="error-message" *ngIf="submitted && f['confirmPassword'].errors">
              <span *ngIf="f['confirmPassword'].errors['required']">Confirmez le mot de passe</span>
            </div>
            <div class="error-message" *ngIf="submitted && registerForm.errors?.['passwordMismatch']">
              Les mots de passe ne correspondent pas
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
            <span *ngIf="!loading">Créer mon compte</span>
            <span *ngIf="loading">Création en cours...</span>
          </button>

          <div class="login-link">
            Déjà un compte ?
            <a routerLink="/login">Se connecter</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .register-card {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 600px;
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

    .register-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .register-header h1 {
      font-size: 3rem;
      margin-bottom: 10px;
      color: #667eea;
    }

    .register-header h2 {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 1.8rem;
    }

    .register-header p {
      color: #7f8c8d;
      font-size: 1rem;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
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

    .login-link {
      text-align: center;
      color: #7f8c8d;
      font-size: 0.95rem;
    }

    .login-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      margin-left: 5px;
    }

    .login-link a:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
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

    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  passwordMatchValidator(group: FormGroup): { passwordMismatch: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    const { confirmPassword, ...registerData } = this.registerForm.value;

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Registration error:', error);
        console.log('Error details:', JSON.stringify(error, null, 2));

        // Afficher les erreurs de validation si disponibles
        if (error.error?.validationErrors) {
          const validationErrors = Object.values(error.error.validationErrors).join(', ');
          this.errorMessage = validationErrors;
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Une erreur est survenue lors de l\'inscription';
        }

        this.loading = false;
      }
    });
  }
}

