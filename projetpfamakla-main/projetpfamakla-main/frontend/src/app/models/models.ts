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
  // Additional properties for frontend functionality
  servingSize?: string;
  healthScore?: number;
  selected?: boolean;
}

export interface Meal {
  id?: number;
  name: string;
  description?: string;
  mealTime: string;
  foods: Food[];
  totalCalories?: number;
  calories?: number;  // Alias pour totalCalories
  protein?: number;
  carbs?: number;
  fats?: number;
  date?: string;
  // Additional properties for enhanced functionality
  type?: string;
  carbohydrates?: number;
  fiber?: number;
  createdAt?: string;
  showInsights?: boolean;
  aiGenerated?: boolean;
  // Add missing properties for AI functionality
  nutrientFocus?: string;
  fromSuggestion?: boolean;
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

export interface UserProfile {
  id?: number;
  userId?: number;
  healthConditions?: string[];
  dietaryRestrictions?: string[];
  goals?: string[];
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: string;
  dailyCalorieGoal?: number;
  dailyWaterGoal?: number;
  dailyCarbLimit?: number;
  // Additional properties for AI chat
  dietaryPreferences?: string[];
}

export interface SmartMealLog {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  netCarbs?: number;
  healthScore?: number;
  isDiabeticFriendly?: boolean;
  glycemicLoad?: string;
  glucoseImpact?: string;
  confidence?: number;
  recommendations?: string[];
}
