import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Meal } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MealService {
  private apiUrl = environment.mealServiceUrl || `${environment.apiUrl}/meals`;

  constructor(private http: HttpClient) {}

  getAllMeals(): Observable<Meal[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(meals => meals.map(m => this.mapBackendToFrontend(m)))
    );
  }

  getMealById(id: number): Observable<Meal> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(m => this.mapBackendToFrontend(m))
    );
  }

  createMeal(meal: Meal): Observable<Meal> {
    const request = this.mapFrontendToBackend(meal);
    return this.http.post<any>(this.apiUrl, request).pipe(
      map(m => this.mapBackendToFrontend(m))
    );
  }

  updateMeal(id: number, meal: Meal): Observable<Meal> {
    const request = this.mapFrontendToBackend(meal);
    return this.http.put<any>(`${this.apiUrl}/${id}`, request).pipe(
      map(m => this.mapBackendToFrontend(m))
    );
  }

  deleteMeal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private mapFrontendToBackend(meal: Meal): any {
    return {
      authUserId: 1, // Default user ID for demo
      mealDate: meal.date || new Date().toISOString().split('T')[0],
      mealType: meal.mealTime || 'LUNCH',
      foodIds: meal.foods?.map(f => f.id).filter(id => id != null) || []
    };
  }

  private mapBackendToFrontend(backendMeal: any): Meal {
    return {
      id: backendMeal.id,
      name: backendMeal.mealType || 'Repas',
      description: '',
      mealTime: backendMeal.mealType || '',
      foods: [], // Would need to fetch foods separately
      totalCalories: backendMeal.totalCalories,
      date: backendMeal.mealDate
    };
  }
}

