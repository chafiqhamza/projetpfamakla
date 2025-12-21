import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, forkJoin } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Meal } from '../models/models';
import { environment } from '../../environments/environment';
import { AiService } from './ai.service';

@Injectable({
  providedIn: 'root'
})
export class MealService {
  private apiUrl = environment.mealServiceUrl || `${environment.apiUrl}/meals`;

  // Reactive Subject for meals
  private mealsSubject = new BehaviorSubject<Meal[]>([]);
  public meals$ = this.mealsSubject.asObservable();

  constructor(private http: HttpClient, private aiService: AiService) { }

  getAllMeals(): Observable<Meal[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(meals => meals.map(m => this.mapBackendToFrontend(m))),
      tap(meals => this.mealsSubject.next(meals)),
      catchError((err) => {
        console.warn('getAllMeals failed, falling back to local meals', err);
        const local = JSON.parse(localStorage.getItem('local_meals') || '[]');
        const localMapped: Meal[] = (local || []).map((m: any) => ({
          id: m.id || null,
          name: m.name || m.mealType || 'Repas local',
          description: m.description || '',
          mealTime: m.mealTime || m.mealType || '',
          foods: m.foods || [],
          totalCalories: m.calories || m.totalCalories || 0,
          calories: m.calories || m.totalCalories || 0,
          protein: m.protein || m.totalProtein || 0,
          carbs: m.carbs || m.totalCarbs || 0,
          fats: m.fats || m.totalFat || 0,
          date: m.date || m.mealDate || new Date().toISOString()
        }));
        this.mealsSubject.next(localMapped);
        return of(localMapped);
      })
    );
  }

  getMealById(id: number): Observable<Meal> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(m => this.mapBackendToFrontend(m))
    );
  }

  createMeal(meal: Meal): Observable<Meal> {
    const request = this.mapFrontendToBackend(meal);
    // Primary attempt to create via configured apiUrl (relative path -> goes through proxy)
    return this.http.post<any>(this.apiUrl, request).pipe(
      map(m => this.mapBackendToFrontend(m)),
      tap((m) => {
        // Immediately upsert the saved meal into the subject so UI updates without waiting for a full refresh
        try { this.upsertMealInSubject(m); } catch (e) { /* continue */ }
        // Also trigger a background refresh to reconcile with backend canonical list
        this.refreshTodayMeals();
      }),
      catchError((err) => {
        console.warn('createMeal failed, saving locally', err);
        // Save locally and return a frontend representation so UI remains responsive
        return this.saveMealLocallyAndReturn(meal).pipe(
          tap((savedMeal) => {
            // Also ensure local saved meals are visible immediately in UI
            try { this.upsertMealInSubject(savedMeal); } catch (e) { /* continue */ }
          })
        );
      })
    );
  }

  /**
   * Synchronize meals saved locally (local_meals) to the backend.
   * Returns an observable that emits an array of results (successful created meals)
   */
  syncLocalMeals(): Observable<Meal[]> {
    try {
      const local = JSON.parse(localStorage.getItem('local_meals') || '[]');
      if (!local || !local.length) return of([]);

      const posts = (local as any[]).map(item => {
        // Map frontend local item to backend request
        const req = this.mapFrontendToBackend(item as Meal);
        return this.http.post<any>(this.apiUrl, req).pipe(
          map(resp => this.mapBackendToFrontend(resp)),
          catchError(err => {
            console.warn('syncLocalMeals: failed to push item', err);
            return of(null);
          })
        );
      });

      // Use forkJoin to wait for all attempts
      return forkJoin(posts).pipe(
        map((results: any[]) => {
          const successes = results.filter(r => r && typeof r === 'object') as Meal[];
          if (successes.length) {
            // Remove successfully synced items from local storage: simple approach -> clear all local and rely on backend getAllMeals
            try { localStorage.removeItem('local_meals'); } catch (e) { }
            // refresh local subject
            this.refreshTodayMeals();
            // Emit dashboard refresh so UI can re-evaluate totals
            try { this.aiService.updateDashboard('REFRESH_DATA'); } catch (e) { }
          }
          return successes;
        }),
        catchError(() => of([]))
      );
    } catch (e) {
      console.error('syncLocalMeals error', e);
      return of([]);
    }
  }

  updateMeal(id: number, meal: Meal): Observable<Meal> {
    const request = this.mapFrontendToBackend(meal);
    return this.http.put<any>(`${this.apiUrl}/${id}`, request).pipe(
      map(m => this.mapBackendToFrontend(m)),
      tap(() => {
        this.refreshTodayMeals();
        try { this.aiService.updateDashboard('REFRESH_DATA'); } catch (e) { }
      })
    );
  }

  deleteMeal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.refreshTodayMeals();
        try { this.aiService.updateDashboard('REFRESH_DATA'); } catch (e) { }
      })
    );
  }

  getTodayMeals(): Observable<Meal[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.http.get<any[]>(`${this.apiUrl}/today`).pipe(
      map(meals => meals.map(m => ({
        ...this.mapBackendToFrontend(m),
        calories: m.totalCalories ?? m.calories ?? 0,
        protein: m.totalProtein ?? m.protein ?? 0,
        carbs: m.totalCarbs ?? m.carbs ?? 0,
        fats: m.totalFat ?? m.fats ?? 0
      }))),
      tap(meals => this.mealsSubject.next(meals)),
      catchError((err) => {
        console.warn('getTodayMeals failed, falling back to local meals', err);
        const local = JSON.parse(localStorage.getItem('local_meals') || '[]');
        const todayLocal = (local || []).filter((m: any) => (m.date || '').startsWith(today));
        const mapped = todayLocal.map((m: any) => ({
          id: m.id ?? undefined,
          name: m.name || m.mealType || 'Repas local',
          description: m.description || '',
          mealTime: m.mealTime ?? m.mealType ?? '',
          foods: m.foods || [],
          totalCalories: m.calories ?? m.totalCalories ?? 0,
          calories: m.calories ?? m.totalCalories ?? 0,
          protein: m.protein ?? m.totalProtein ?? 0,
          carbs: m.carbs ?? m.totalCarbs ?? 0,
          fats: m.fats ?? m.totalFat ?? 0,
          date: m.date ?? new Date().toISOString()
        }));
        this.mealsSubject.next(mapped);
        return of(mapped);
      })
    );
  }

  // Helper to refresh meals (useful for other components to trigger)
  public refreshTodayMeals(): void {
    this.getTodayMeals().subscribe();
  }

  // Add missing methods that are referenced in MealsComponent
  getMealsByDate(date: Date): Observable<Meal[]> {
    const dateString = date.toISOString().split('T')[0];
    return this.http.get<any[]>(`${this.apiUrl}/by-date/${dateString}`).pipe(
      map(meals => meals.map(m => this.mapBackendToFrontend(m))),
      catchError(() => of([])) // Fallback to empty array on error
    );
  }

  getMealHistory(days: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/history?days=${days}`).pipe(
      catchError(() => of({ meals: [], totalCalories: 0 })) // Fallback on error
    );
  }

  getUserMeals(): Observable<Meal[]> {
    return this.getAllMeals();
  }

  private mapFrontendToBackend(meal: Meal): any {
    return {
      authUserId: 1, // Default user ID for demo
      // Preserve name/description so backend (or local fallback) stores the label
      name: meal.name,
      description: meal.description || '',
      mealDate: meal.date || new Date().toISOString().split('T')[0],
      mealType: (meal.mealTime || meal.type || 'LUNCH').toString().toUpperCase(),
      foodIds: meal.foods?.map(f => f.id).filter(id => id != null) || [],
      totalCalories: meal.totalCalories || meal.calories || 0,
      totalProtein: meal.protein || 0,
      totalCarbs: meal.carbs || meal.carbohydrates || 0,
      totalFat: meal.fats || 0,
      fiber: meal.fiber || 0
    };
  }

  private mapBackendToFrontend(backendMeal: any): Meal {
    // Normalize backend payload to frontend Meal shape. Backend may provide mealType/mealDate
    const name = backendMeal.name || backendMeal.mealType || 'Repas';
    const dateStr = backendMeal.mealDate || backendMeal.date || backendMeal.createdAt || null;
    const createdAt = backendMeal.createdAt || (dateStr ? new Date(dateStr).toISOString() : undefined);

    return {
      id: backendMeal.id,
      name,
      description: backendMeal.description || '',
      mealTime: backendMeal.mealType || backendMeal.mealTime || '',
      // Keep `type` as alias for templates that reference meal.type
      type: (backendMeal.mealType || backendMeal.mealTime || '').toString().toLowerCase(),
      foods: backendMeal.foods || [], // Would need to fetch foods separately if missing
      totalCalories: backendMeal.totalCalories || backendMeal.calories || 0,
      calories: backendMeal.totalCalories || backendMeal.calories || 0,
      protein: backendMeal.totalProtein || backendMeal.protein || 0,
      // Provide both `carbs` and `carbohydrates` because templates use carbohydrates
      carbs: backendMeal.totalCarbs || backendMeal.carbs || 0,
      carbohydrates: backendMeal.totalCarbs || backendMeal.carbs || backendMeal.carbohydrates || 0,
      fats: backendMeal.totalFat || backendMeal.fats || 0,
      // fiber may be provided by backend or be missing; default to 0
      fiber: backendMeal.fiber ?? backendMeal.fibers ?? 0,
      date: dateStr,
      createdAt
    } as Meal;
  }

  private saveMealLocallyAndReturn(meal: Meal): Observable<Meal> {
    try {
      const local = JSON.parse(localStorage.getItem('local_meals') || '[]');
      const uniqueId = `local-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const saved = {
        ...meal,
        uniqueId,
        id: meal.id || undefined,
        date: meal.date || new Date().toISOString()
      } as any;
      local.push(saved);
      localStorage.setItem('local_meals', JSON.stringify(local));

      // Update the meals subject to include the new local meal
      this.refreshTodayMeals();

      // Return a frontend-friendly Meal object
      const frontendMeal: Meal = {
        id: saved.id ?? undefined,
        name: saved.name || 'Local Meal',
        description: saved.description || '',
        mealTime: saved.mealTime || 'LUNCH',
        foods: saved.foods || [],
        totalCalories: saved.calories || saved.totalCalories || 0,
        calories: saved.calories || saved.totalCalories || 0,
        protein: saved.protein || saved.totalProtein || 0,
        carbs: saved.carbs || saved.totalCarbs || 0,
        fats: saved.fats || saved.totalFat || 0,
        date: saved.date
      };

      // Ensure subject immediately contains this local meal
      try { this.upsertMealInSubject(frontendMeal); } catch (e) { /* ignore */ }

      return of(frontendMeal);
    } catch (e) {
      console.error('Failed to save meal locally', e);
      return of(meal);
    }
  }

  // Upsert helper - add or replace a meal in the mealsSubject array
  private upsertMealInSubject(meal: Meal): void {
    try {
      const current = this.mealsSubject.value || [];
      const existsIdx = current.findIndex(m => m.id !== undefined && m.id === meal.id);
      let updated: Meal[];
      if (existsIdx >= 0) {
        updated = [...current];
        updated[existsIdx] = { ...current[existsIdx], ...meal };
      } else {
        // If meal has no id, try to deduplicate by matching name + date + calories
        const dedupIdx = current.findIndex(m => !m.id && m.name === meal.name && m.date === meal.date && (m.calories || 0) === (meal.calories || 0));
        if (dedupIdx >= 0) {
          updated = [...current];
          updated[dedupIdx] = { ...current[dedupIdx], ...meal };
        } else {
          updated = [...current, meal];
        }
      }
      this.mealsSubject.next(updated);
    } catch (e) {
      console.warn('upsertMealInSubject failed', e);
    }
  }
}
