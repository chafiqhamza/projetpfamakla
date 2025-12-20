import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GoalsSyncService } from '../../services/goals-sync.service';
import { AiService } from '../../services/ai.service';

interface UserPreferences {
  isDiabetic: boolean;
  healthConditions: string[];
  dietaryRestrictions: string[];
  goals: {
    calories: number;
    carbs: number;
    protein: number;
    fats: number;
    water: number;
  };
  notifications: {
    waterReminders: boolean;
    mealReminders: boolean;
    carbAlerts: boolean;
  };
  theme: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  preferences: UserPreferences = {
    isDiabetic: false,
    healthConditions: [],
    dietaryRestrictions: [],
    goals: {
      calories: 2000,
      carbs: 130,
      protein: 50,
      fats: 65,
      water: 2500
    },
    notifications: {
      waterReminders: true,
      mealReminders: true,
      carbAlerts: true
    },
    theme: 'default'
  };

  healthConditionOptions = [
    'Diabetes Type 1',
    'Diabetes Type 2',
    'High Blood Pressure',
    'High Cholesterol',
    'Celiac Disease',
    'Food Allergies',
    'Heart Disease',
    'Kidney Disease'
  ];

  dietOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Low-Carb',
    'Keto',
    'Mediterranean',
    'Halal',
    'Kosher',
    'Paleo'
  ];

  activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little/no exercise)', multiplier: 1.2 },
    { value: 'light', label: 'Lightly Active (1-3 days/week)', multiplier: 1.375 },
    { value: 'moderate', label: 'Moderately Active (3-5 days/week)', multiplier: 1.55 },
    { value: 'very', label: 'Very Active (6-7 days/week)', multiplier: 1.725 },
    { value: 'extra', label: 'Extra Active (athlete)', multiplier: 1.9 }
  ];

  selectedActivity = 'moderate';
  age = 30;
  weight = 70; // kg
  height = 170; // cm
  gender = 'male';
  goalType = 'maintain'; // maintain, lose, gain

  savedMessage = false;
  // Visual confirmation that profile was sent to AI (Phi3)
  aiProfileSent = false;
  aiProfileSentAt: Date | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private goalsService: GoalsSyncService,
    private aiService: AiService
  ) { }

  ngOnInit(): void {
    this.loadPreferences();

    // Subscribe to global goals
    this.goalsService.goals$.subscribe(goals => {
      if (goals) {
        this.preferences.goals = {
          calories: goals.calories,
          carbs: goals.carbs,
          protein: goals.protein,
          fats: goals.fat,
          water: goals.water
        };
      }
    });
  }

  loadPreferences(): void {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.preferences = { ...this.preferences, ...parsed };
    }

    // Load user profile data
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const data = JSON.parse(profile);
      this.age = data.age || 30;
      this.weight = data.weight || 70;
      this.height = data.height || 170;
      this.gender = data.gender || 'male';
      this.selectedActivity = data.activity || 'moderate';
      this.goalType = data.goalType || 'maintain';
    }
  }

  toggleHealthCondition(condition: string): void {
    const index = this.preferences.healthConditions.indexOf(condition);
    if (index > -1) {
      this.preferences.healthConditions.splice(index, 1);
    } else {
      this.preferences.healthConditions.push(condition);
    }

    // Auto-enable diabetic mode if diabetes selected
    if (condition.includes('Diabetes')) {
      this.preferences.isDiabetic = this.preferences.healthConditions.some(c => c.includes('Diabetes'));
      if (this.preferences.isDiabetic) {
        // Set diabetic-friendly defaults
        this.preferences.goals.carbs = 130;
        this.preferences.notifications.carbAlerts = true;
      }
    }
  }

  toggleDietRestriction(diet: string): void {
    const index = this.preferences.dietaryRestrictions.indexOf(diet);
    if (index > -1) {
      this.preferences.dietaryRestrictions.splice(index, 1);
    } else {
      this.preferences.dietaryRestrictions.push(diet);
    }
  }

  calculateRecommendedGoals(): void {
    // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
    let bmr: number;
    if (this.gender === 'male') {
      bmr = 10 * this.weight + 6.25 * this.height - 5 * this.age + 5;
    } else {
      bmr = 10 * this.weight + 6.25 * this.height - 5 * this.age - 161;
    }

    // Apply activity multiplier
    const activity = this.activityLevels.find(a => a.value === this.selectedActivity);
    let tdee = bmr * (activity?.multiplier || 1.55);

    // Adjust based on goal
    if (this.goalType === 'lose') {
      tdee -= 500; // 500 calorie deficit for weight loss
    } else if (this.goalType === 'gain') {
      tdee += 500; // 500 calorie surplus for weight gain
    }

    // Set calorie goal
    this.preferences.goals.calories = Math.round(tdee);

    // Calculate macros
    if (this.preferences.isDiabetic) {
      // Diabetic-friendly macros: Lower carbs, higher protein
      this.preferences.goals.carbs = 130; // ADA recommendation
      this.preferences.goals.protein = Math.round(this.weight * 1.2); // 1.2g per kg
      this.preferences.goals.fats = Math.round((tdee * 0.3) / 9); // 30% from fats
    } else {
      // Standard macros: 50% carbs, 20% protein, 30% fats
      this.preferences.goals.carbs = Math.round((tdee * 0.5) / 4);
      this.preferences.goals.protein = Math.round((tdee * 0.2) / 4);
      this.preferences.goals.fats = Math.round((tdee * 0.3) / 9);
    }

    // Water goal based on weight (30-35ml per kg)
    this.preferences.goals.water = Math.round(this.weight * 35);

    alert('Goals calculated based on your profile! Review and save.');
  }

  savePreferences(): void {
    // Save preferences
    localStorage.setItem('userPreferences', JSON.stringify(this.preferences));

    // Save profile data
    const profile = {
      age: this.age,
      weight: this.weight,
      height: this.height,
      gender: this.gender,
      activity: this.selectedActivity,
      goalType: this.goalType
    };
    localStorage.setItem('userProfile', JSON.stringify(profile));

    // Update global goals state
    this.goalsService.updateGoals({
      calories: this.preferences.goals.calories,
      carbs: this.preferences.goals.carbs,
      protein: this.preferences.goals.protein,
      fat: this.preferences.goals.fats,
      water: this.preferences.goals.water,
      fiber: 30 // Default or needs to be added to settings
    }, 'Settings update');

    // Update AI agent with the latest user profile and preferences so chat/AI suggestions use them
    const aiProfile = {
      healthConditions: this.preferences.healthConditions,
      dietaryRestrictions: this.preferences.dietaryRestrictions,
      age: this.age,
      weight: this.weight,
      height: this.height,
      gender: this.gender,
      activityLevel: this.selectedActivity,
      dailyCalorieGoal: this.preferences.goals.calories,
      dailyWaterGoal: this.preferences.goals.water,
      dailyCarbLimit: this.preferences.isDiabetic ? this.preferences.goals.carbs : this.preferences.goals.carbs
    };
    this.aiService.updateUserProfile(aiProfile);

    // Mark confirmation visual: profile sent to AI
    this.aiProfileSent = true;
    this.aiProfileSentAt = new Date();

    // Optional: emit dashboard update so other parts of the app react immediately
    this.aiService.dashboardUpdate.emit({ type: 'UPDATE_INSIGHTS', data: aiProfile });

    this.savedMessage = true;
    setTimeout(() => {
      this.savedMessage = false;
    }, 3000);

    // Optionally navigate back to dashboard
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 1500);
  }

  resetToDefaults(): void {
    if (confirm('Reset all settings to defaults?')) {
      this.preferences = {
        isDiabetic: false,
        healthConditions: [],
        dietaryRestrictions: [],
        goals: {
          calories: 2000,
          carbs: 300,
          protein: 50,
          fats: 65,
          water: 2500
        },
        notifications: {
          waterReminders: true,
          mealReminders: true,
          carbAlerts: true
        },
        theme: 'default'
      };
      this.age = 30;
      this.weight = 70;
      this.height = 170;
      this.gender = 'male';
      this.selectedActivity = 'moderate';
      this.goalType = 'maintain';
    }
  }

  exportData(): void {
    const data = {
      preferences: this.preferences,
      profile: {
        age: this.age,
        weight: this.weight,
        height: this.height,
        gender: this.gender,
        activity: this.selectedActivity,
        goalType: this.goalType
      },
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `makla-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  importData(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.preferences) {
            this.preferences = data.preferences;
          }
          if (data.profile) {
            this.age = data.profile.age;
            this.weight = data.profile.weight;
            this.height = data.profile.height;
            this.gender = data.profile.gender;
            this.selectedActivity = data.profile.activity;
            this.goalType = data.profile.goalType;
          }
          alert('Settings imported successfully!');
        } catch (error) {
          alert('Error importing settings. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }

  getBMI(): number {
    return this.weight / ((this.height / 100) ** 2);
  }

  getBMICategory(): string {
    const bmi = this.getBMI();
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  resendProfileToAI(): void {
    const aiProfile = {
      healthConditions: this.preferences.healthConditions,
      dietaryRestrictions: this.preferences.dietaryRestrictions,
      age: this.age,
      weight: this.weight,
      height: this.height,
      gender: this.gender,
      activityLevel: this.selectedActivity,
      dailyCalorieGoal: this.preferences.goals.calories,
      dailyWaterGoal: this.preferences.goals.water,
      dailyCarbLimit: this.preferences.goals.carbs
    };
    this.aiService.updateUserProfile(aiProfile);
    this.aiProfileSent = true;
    this.aiProfileSentAt = new Date();
    this.aiService.dashboardUpdate.emit({ type: 'UPDATE_INSIGHTS', data: aiProfile });
  }
}
