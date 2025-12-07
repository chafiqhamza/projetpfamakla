import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WaterIntake } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WaterService {
  private apiUrl = environment.waterServiceUrl || `${environment.apiUrl}/water`;

  constructor(private http: HttpClient) {}

  getAllWaterIntakes(): Observable<WaterIntake[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(intakes => intakes.map(intake => ({
        id: intake.id,
        amount: intake.amountMl,
        date: intake.intakeTime || intake.createdAt,
        time: intake.intakeTime || intake.createdAt
      })))
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
      }))
    );
  }

  deleteWaterIntake(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getTodayTotal(): Observable<number> {
    const today = new Date().toISOString().split('T')[0];
    return this.http.get<number>(`${this.apiUrl}/total/${today}`);
  }

  getTodayIntake(): Observable<{ totalAmount: number; intakes: WaterIntake[] }> {
    return this.http.get<any>(`${this.apiUrl}/today`).pipe(
      map(data => ({
        totalAmount: data.totalAmount || 0,
        intakes: (data.intakes || []).map((intake: any) => ({
          id: intake.id,
          amount: intake.amountMl,
          date: intake.intakeTime || intake.createdAt,
          time: intake.intakeTime || intake.createdAt
        }))
      }))
    );
  }
}

