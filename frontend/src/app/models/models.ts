export interface Food {
  id?: number;
  name: string;
  description?: string;
  calories: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Meal {
  id?: number;
  name: string;
  description?: string;
  mealTime: string;
  foods: Food[];
  totalCalories?: number;
  date?: string;
}

export interface WaterIntake {
  id?: number;
  amount: number;
  date: string;
  time?: string;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

