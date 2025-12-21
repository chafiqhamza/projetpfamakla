import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface NutritionGoals {
  calories: number;
  water: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
}

export interface GoalUpdate {
  timestamp: Date;
  previousGoals: NutritionGoals;
  newGoals: NutritionGoals;
  reason: string;
  source: 'USER' | 'AI_AGENT' | 'PROFILE_UPDATE';
}

/**
 * Service centralisé pour la gestion et la synchronisation des objectifs nutritionnels
 * Communique avec l'AI Agent et le User Service
 */
@Injectable({
  providedIn: 'root'
})
export class GoalsSyncService {
  private baseUrl = environment.apiUrl; // e.g. /api
  private aiServiceUrl = environment.aiServiceUrl; // e.g. /api

  // État centralisé des objectifs
  private goalsSubject = new BehaviorSubject<NutritionGoals>({
    calories: 2000,
    water: 2500,
    carbs: 250,
    protein: 60,
    fat: 65,
    fiber: 30
  });

  // Observable public pour que les composants s'abonnent
  public goals$ = this.goalsSubject.asObservable();

  // Historique des mises à jour
  private historySubject = new BehaviorSubject<GoalUpdate[]>([]);
  public history$ = this.historySubject.asObservable();

  // État de chargement
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadGoalsFromStorage();
  }

  /**
   * Récupère les objectifs actuels
   */
  getCurrentGoals(): NutritionGoals {
    return this.goalsSubject.value;
  }

  /**
   * Met à jour les objectifs manuellement
   */
  updateGoals(newGoals: Partial<NutritionGoals>, reason: string = 'Manual update'): void {
    const currentGoals = this.goalsSubject.value;
    const updatedGoals = { ...currentGoals, ...newGoals };

    // Enregistrer dans l'historique
    this.addToHistory(currentGoals, updatedGoals, reason, 'USER');

    // Mettre à jour le BehaviorSubject
    this.goalsSubject.next(updatedGoals);

    // Sauvegarder localement
    this.saveGoalsToStorage(updatedGoals);
  }

  /**
   * Demande à l'AI Agent d'analyser le profil et suggérer de nouveaux objectifs
   */
  requestAIAnalysis(userProfile: any, currentData?: any): Observable<any> {
    this.loadingSubject.next(true);

    return this.http.post(`${this.aiServiceUrl}/agent/analyze-profile`, {
      userProfile,
      currentData
    }).pipe(
      tap((response: any) => {
        this.loadingSubject.next(false);
        console.log('AI Analysis received:', response);
      })
    );
  }

  /**
   * Applique les objectifs suggérés par l'AI Agent
   */
  applyAISuggestedGoals(userId: string, suggestedGoals: NutritionGoals, accepted: boolean, feedback?: string): Observable<any> {
    this.loadingSubject.next(true);

    return this.http.post(`${this.aiServiceUrl}/agent/update-goals`, {
      userId,
      newGoals: suggestedGoals,
      accepted,
      feedback
    }).pipe(
      tap((response: any) => {
        if (response.success && accepted) {
          const currentGoals = this.goalsSubject.value;

          // Enregistrer dans l'historique
          this.addToHistory(currentGoals, suggestedGoals, 'AI Agent recommendation', 'AI_AGENT');

          // Mettre à jour les objectifs
          this.goalsSubject.next(suggestedGoals);
          this.saveGoalsToStorage(suggestedGoals);

          // Notifier le user-service pour mettre à jour le profil
          this.syncWithUserService(userId, suggestedGoals).subscribe(
            () => console.log('Goals synced with user service'),
            error => console.error('Failed to sync with user service:', error)
          );
        }
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Synchronise les objectifs avec le user-service
   */
  private syncWithUserService(userId: string, goals: NutritionGoals): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${userId}/goals`, {
      dailyCalorieGoal: goals.calories,
      dailyWaterGoal: goals.water,
      dailyCarbLimit: goals.carbs,
      dailyProteinGoal: goals.protein,
      dailyFatGoal: goals.fat,
      dailyFiberGoal: goals.fiber
    });
  }

  /**
   * Charge les objectifs depuis le user-service
   */
  loadGoalsFromUserService(userId: string): Observable<any> {
    this.loadingSubject.next(true);

    return this.http.get(`${this.baseUrl}/users/${userId}/profile`).pipe(
      tap((profile: any) => {
        if (profile) {
          const goals: NutritionGoals = {
            calories: profile.dailyCalorieGoal || 2000,
            water: profile.dailyWaterGoal || 2500,
            carbs: profile.dailyCarbLimit || 250,
            protein: profile.dailyProteinGoal || 60,
            fat: profile.dailyFatGoal || 65,
            fiber: profile.dailyFiberGoal || 30
          };

          this.goalsSubject.next(goals);
          this.saveGoalsToStorage(goals);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Calcule automatiquement les objectifs basés sur le profil
   */
  calculateGoalsFromProfile(profile: any): NutritionGoals {
    // Simple calculation - could be enhanced
    const age = profile.age || 30;
    const weight = profile.weight || 70;
    const height = profile.height || 170;
    const gender = profile.gender || 'MALE';
    const activityLevel = profile.activityLevel || 'MODERATE';

    // Mifflin-St Jeor BMR calculation
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (gender === 'MALE') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    // Activity multiplier
    const activityMultipliers: { [key: string]: number } = {
      'SEDENTARY': 1.2,
      'LIGHT': 1.375,
      'MODERATE': 1.55,
      'ACTIVE': 1.725,
      'VERY_ACTIVE': 1.9
    };

    const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);
    const calories = Math.round(tdee);

    // Check for diabetic condition
    const isDiabetic = profile.healthConditions &&
      profile.healthConditions.some((c: string) => c.toLowerCase().includes('diabet'));

    return {
      calories,
      water: Math.round(weight * 35), // 35ml per kg
      carbs: isDiabetic ? 130 : Math.round(calories * 0.50 / 4), // 130g for diabetics, 50% otherwise
      protein: Math.round(calories * 0.20 / 4), // 20% of calories
      fat: Math.round(calories * 0.30 / 9), // 30% of calories
      fiber: isDiabetic ? 35 : 30
    };
  }

  /**
   * Réinitialise aux objectifs par défaut
   */
  resetToDefaults(): void {
    const defaultGoals: NutritionGoals = {
      calories: 2000,
      water: 2500,
      carbs: 250,
      protein: 60,
      fat: 65,
      fiber: 30
    };

    this.updateGoals(defaultGoals, 'Reset to defaults');
  }

  /**
   * Ajoute une entrée à l'historique
   */
  private addToHistory(previous: NutritionGoals, updated: NutritionGoals, reason: string, source: 'USER' | 'AI_AGENT' | 'PROFILE_UPDATE'): void {
    const history = this.historySubject.value;
    const update: GoalUpdate = {
      timestamp: new Date(),
      previousGoals: previous,
      newGoals: updated,
      reason,
      source
    };

    history.unshift(update); // Add to beginning

    // Keep only last 20 entries
    if (history.length > 20) {
      history.pop();
    }

    this.historySubject.next(history);
    localStorage.setItem('goals-history', JSON.stringify(history));
  }

  /**
   * Sauvegarde les objectifs dans le localStorage
   */
  private saveGoalsToStorage(goals: NutritionGoals): void {
    localStorage.setItem('nutrition-goals', JSON.stringify(goals));
  }

  /**
   * Charge les objectifs depuis le localStorage
   */
  private loadGoalsFromStorage(): void {
    const stored = localStorage.getItem('nutrition-goals');
    if (stored) {
      try {
        const goals = JSON.parse(stored);
        this.goalsSubject.next(goals);
      } catch (e) {
        console.error('Failed to parse stored goals', e);
      }
    }

    // Load history
    const storedHistory = localStorage.getItem('goals-history');
    if (storedHistory) {
      try {
        const history = JSON.parse(storedHistory);
        this.historySubject.next(history);
      } catch (e) {
        console.error('Failed to parse goals history', e);
      }
    }
  }

  /**
   * Efface tout l'historique
   */
  clearHistory(): void {
    this.historySubject.next([]);
    localStorage.removeItem('goals-history');
  }
}

