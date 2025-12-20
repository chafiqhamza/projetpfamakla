import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { WaterIntake } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WaterService {
  private apiUrl = environment.waterServiceUrl || `${environment.apiUrl}/water`;

  // Add observable for water intakes
  private waterIntakesSubject = new BehaviorSubject<WaterIntake[]>([]);
  public waterIntakes$ = this.waterIntakesSubject.asObservable();

  constructor(private http: HttpClient) { }

  getAllWaterIntakes(): Observable<WaterIntake[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(intakes => intakes.map(intake => ({
        id: intake.id,
        amount: intake.amountMl,
        date: intake.intakeTime || intake.createdAt,
        time: intake.intakeTime || intake.createdAt
      }))),
      tap(intakes => this.waterIntakesSubject.next(intakes))
    );
  }

  getWaterIntakeById(id: number): Observable<WaterIntake> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(intake => ({
        id: intake.id,
        amount: intake.amountMl,
        date: intake.intakeTime || intake.createdAt,
        time: intake.intakeTime || intake.createdAt
      }))
    );
  }

  getTodayIntake(): Observable<{ totalAmount: number; intakes: WaterIntake[] }> {
    const today = new Date().toISOString().split('T')[0];
    return this.http.get<any>(`${this.apiUrl}/today`).pipe(
      map(data => ({
        totalAmount: data.totalAmount || 0,
        intakes: (data.intakes || []).map((intake: any) => ({
          id: intake.id,
          amount: intake.amountMl,
          date: intake.intakeTime || intake.createdAt,
          time: intake.intakeTime || intake.createdAt
        }))
      })),
      tap(result => {
        // Update the reactive subject so subscribers get the data
        this.waterIntakesSubject.next(result.intakes);
      }),
      catchError((err) => {
        console.warn('getTodayIntake failed, falling back to local water', err);
        const local = JSON.parse(localStorage.getItem('local_water') || '[]');
        const todayLocal = (local || []).filter((w: any) => (w.date || '').startsWith(today));

        const mapped = todayLocal.map((w: any) => ({
          id: w.id,
          amount: w.amount,
          date: w.date,
          time: w.date
        }));

        this.waterIntakesSubject.next(mapped);

        const total = mapped.reduce((s: number, w: any) => s + (w.amount || 0), 0);
        return new BehaviorSubject({ totalAmount: total, intakes: mapped });
      })
    );
  }

  // Update addWaterIntake to use local storage fallback
  addWaterIntake(water: WaterIntake): Observable<WaterIntake> {
    const request = {
      amountMl: water.amount,
      intakeTime: water.date || new Date().toISOString(),
      notes: ''
    };
    return this.http.post<any>(this.apiUrl, request).pipe(
      map(intake => ({
        id: intake.id,
        amount: intake.amountMl,
        date: intake.intakeTime || intake.createdAt,
        time: intake.intakeTime || intake.createdAt
      })),
      tap(() => this.refreshTodayIntake()), // Use specific refresh
      catchError((err) => {
        console.warn('addWaterIntake failed, saving locally', err);
        return this.saveWaterLocallyAndReturn(water);
      })
    );
  }

  deleteWaterIntake(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refreshTodayIntake())
    );
  }

  getTodayTotal(): Observable<number> {
    const today = new Date().toISOString().split('T')[0];
    return this.http.get<number>(`${this.apiUrl}/total/${today}`);
  }

  // Helper to refresh specifically today's data (more efficient than getAll)
  private refreshTodayIntake(): void {
    this.getTodayIntake().subscribe();
  }

  private saveWaterLocallyAndReturn(water: WaterIntake): Observable<WaterIntake> {
    const local = JSON.parse(localStorage.getItem('local_water') || '[]');
    const saved = {
      ...water,
      id: Date.now(), // generating a temporary local ID
      date: water.date || new Date().toISOString()
    };
    local.push(saved);
    localStorage.setItem('local_water', JSON.stringify(local));

    this.refreshTodayIntake();
    return new BehaviorSubject(saved);
  }
}
