import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface QuickAnalysis {
  healthScore: number;
  topAlert: string;
  quickTip: string;
  carbsWarning?: string;
  success: boolean;
}

export interface SmartMealLog {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  netCarbs?: number;
  glycemicLoad?: string;
  glucoseImpact?: string;
  diabeticWarning?: string;
  healthScore: number;
  isDiabeticFriendly: boolean;
}

export interface DiabeticAlert {
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  action: string;
}

export interface DiabeticMonitoring {
  alerts: DiabeticAlert[];
  carbsPercent: number;
  status: 'good' | 'warning' | 'danger';
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EnhancedAiService {
  private baseUrl = `${environment.apiUrl}/enhanced`;
  private fastTimeout = 15000; // 15 second timeout for AI responses

  // Real-time state management
  private healthScoreSubject = new BehaviorSubject<number>(70);
  public healthScore$ = this.healthScoreSubject.asObservable();

  private alertsSubject = new BehaviorSubject<DiabeticAlert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Cache for fast repeated requests
  private cache = new Map<string, any>();
  private cacheTimeout = 60000; // 1 minute cache

  constructor(private http: HttpClient) { }

  /**
   * Ultra-fast quick analysis - optimized for speed
   */
  quickAnalyze(userData: any, isDiabetic: boolean = false, userProfile?: any): Observable<QuickAnalysis> {
    const cacheKey = `quick-${JSON.stringify(userData)}-${isDiabetic}`;

    // Check cache first for instant response
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    this.loadingSubject.next(true);

    const payload = { userData: JSON.stringify(userData), isDiabetic, userProfile };
    console.debug('[EnhancedAiService] POST quick-analyze payload:', payload);
    return this.http.post<QuickAnalysis>(`${this.baseUrl}/quick-analyze`, payload).pipe(
      timeout(this.fastTimeout),
      tap(result => {
        if (result.healthScore) {
          this.healthScoreSubject.next(result.healthScore);
        }
        this.cache.set(cacheKey, result);
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Quick analysis failed:', error);
        this.loadingSubject.next(false);
        return of({
          healthScore: 70,
          topAlert: 'Keep tracking your meals!',
          quickTip: isDiabetic ? 'Monitor carb intake' : 'Stay hydrated',
          success: false
        });
      })
    );
  }

  /**
   * Smart meal logging with AI estimation
   */
  smartMealLog(description: string, isDiabetic: boolean = false, userProfile?: any): Observable<SmartMealLog> {
    this.loadingSubject.next(true);

    const mealPayload = { description, isDiabetic, userProfile };
    console.debug('[EnhancedAiService] POST smart-meal-log payload:', mealPayload);
    return this.http.post<SmartMealLog>(`${this.baseUrl}/smart-meal-log`, mealPayload).pipe(
      timeout(8000), // 8 seconds for meal analysis
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        console.error('Smart meal log failed:', error);
        this.loadingSubject.next(false);
        // Provide reasonable estimates
        return of(this.getDefaultMealEstimate(description, isDiabetic));
      })
    );
  }

  /**
   * Real-time diabetic monitoring
   */
  diabeticMonitor(todayData: any, totalCarbs: number, glucoseLevel: number = 0): Observable<DiabeticMonitoring> {
    return this.http.post<DiabeticMonitoring>(`${this.baseUrl}/diabetic-monitor`, {
      todayData: JSON.stringify(todayData),
      totalCarbs,
      glucoseLevel
    }).pipe(
      tap(result => {
        if (result.alerts && result.alerts.length > 0) {
          this.alertsSubject.next(result.alerts);
        }
      }),
      catchError(error => {
        console.error('Diabetic monitoring failed:', error);
        return of(this.getDefaultMonitoring(totalCarbs));
      })
    );
  }

  /**
   * Get diabetic-friendly meal suggestions
   */
  getDiabeticMeals(remainingCarbs: number, userProfile?: any): Observable<any> {
    const payload = { remainingCarbs, userProfile };
    console.debug('[EnhancedAiService] POST diabetic/meals payload:', payload);
    return this.http.post<any>(`${this.baseUrl}/diabetic/meals`, payload).pipe(
      catchError(() => of({ meals: [], success: false }))
    );
  }

  /**
   * Weekly trends analysis
   */
  getWeeklyTrends(weekData: any, isDiabetic: boolean = false): Observable<any> {
    const cacheKey = `trends-${isDiabetic}`;

    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    return this.http.post(`${this.baseUrl}/weekly-trends`, {
      weekData: JSON.stringify(weekData),
      isDiabetic
    }).pipe(
      tap(result => {
        this.cache.set(cacheKey, result);
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      }),
      catchError(error => {
        console.error('Weekly trends failed:', error);
        return of({ success: false });
      })
    );
  }

  /**
   * Food recognition
   */
  recognizeFood(description: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/recognize-food`, {
      description
    }).pipe(
      timeout(10000),
      catchError(error => {
        console.error('Food recognition failed:', error);
        return of({ success: false, error: 'Recognition unavailable' });
      })
    );
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alertsSubject.next([]);
  }

  /**
   * Dismiss specific alert
   */
  dismissAlert(alert: DiabeticAlert): void {
    // Remove alert from the alerts array
    const currentAlerts = this.alertsSubject.value;
    const updatedAlerts = currentAlerts.filter(a => a !== alert);
    this.alertsSubject.next(updatedAlerts);
  }

  // Helper methods for fallbacks
  private getDefaultMealEstimate(description: string, isDiabetic: boolean): SmartMealLog {
    return {
      name: description,
      calories: 400,
      protein: 20,
      carbs: 40,
      fats: 15,
      fiber: 5,
      netCarbs: 35,
      glycemicLoad: 'medium',
      healthScore: 60,
      isDiabeticFriendly: false,
      diabeticWarning: isDiabetic ? 'Estimated values - track carefully' : undefined
    };
  }

  private getDefaultMonitoring(totalCarbs: number): DiabeticMonitoring {
    const alerts: DiabeticAlert[] = [];

    if (totalCarbs > 130) {
      alerts.push({
        type: 'danger',
        title: '⚠️ High Carb Intake',
        message: `You've exceeded recommended daily carbs (${totalCarbs}g/130g)`,
        action: 'REDUCE_CARBS'
      });
    }

    return {
      alerts,
      carbsPercent: Math.min(100, (totalCarbs * 100) / 130),
      status: totalCarbs > 130 ? 'danger' : totalCarbs > 100 ? 'warning' : 'good',
      recommendations: [
        'Focus on protein and vegetables',
        'Stay hydrated',
        'Consider a short walk after meals'
      ]
    };
  }

  private getDefaultDiabeticMeals(): any[] {
    return [
      {
        name: 'Grilled Chicken Salad',
        netCarbs: 8,
        protein: 35,
        fiber: 6,
        diabeticScore: 95
      },
      {
        name: 'Salmon with Broccoli',
        netCarbs: 12,
        protein: 40,
        fiber: 5,
        diabeticScore: 92
      },
      {
        name: 'Egg Omelet with Veggies',
        netCarbs: 5,
        protein: 25,
        fiber: 4,
        diabeticScore: 90
      }
    ];
  }

  generateNutritionInsights(userData: string, isDiabetic: boolean): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/nutrition/insights`, {
      userData,
      isDiabetic
    }).pipe(
      catchError(() => of({ insights: [], success: false }))
    );
  }

  calculateWaterRecommendations(userData: string, activityLevel: string, currentWater: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/water/recommendations`, {
      userData,
      activityLevel,
      currentWater
    }).pipe(
      catchError(() => of({
        recommendedTotal: 2500,
        currentIntake: currentWater,
        deficit: Math.max(0, 2500 - currentWater),
        success: false
      }))
    );
  }
}
