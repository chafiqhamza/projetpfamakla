import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, forkJoin } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { GoalsSyncService } from './goals-sync.service';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    actions?: AgentAction[];
    timestamp?: Date;
}

export interface SmartChatResult {
    response: ChatMessage;
    actions?: AgentAction[];
    actionData?: any;
    intent?: string;
}

export interface ChatRequest {
    message: string;
    context?: {
        meals?: any[];
        waterIntake?: any[];
        userStats?: any;
    };
}

export interface AgentAction {
    type: 'ADD_MEAL' | 'ADD_WATER' | 'SET_GOAL' | 'SHOW_STATS' | 'GET_SUGGESTIONS' | 'NAVIGATE' | 'SCHEDULE_REMINDER' | 'GENERATE_REPORT' | 'UPDATE_DASHBOARD' | 'ADD_FOOD_TO_MEAL' | 'CREATE_MEAL_PLAN' | 'navigate' | 'quick-add' | 'quick-suggestions' | 'smart-log' | 'add-water';
    parameters: any;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    result?: any;
    data?: any;
    label?: string;
}

export interface AgentAnalysis {
    success: boolean;
    insights?: string[];
    alerts?: Array<{ type: string; title: string; message: string; priority: string }>;
    recommendations?: string[];
    suggestedActions?: AgentAction[];
    dailyGoals?: { calories: number; water: number; protein: number; carbs: number };
    healthScore?: number;
    motivationalMessage?: string;
}

export interface UserProfile {
    healthConditions?: string[];  // diabetic, hypertension, etc.
    dietaryRestrictions?: string[];  // vegan, gluten-free, etc.
    goals?: string[];  // weight-loss, muscle-gain, etc.
    age?: number;
    weight?: number;
    height?: number;
    gender?: string;  // Added for profile completeness
    activityLevel?: string;
    dailyCalorieGoal?: number;
    dailyWaterGoal?: number;
    dailyCarbLimit?: number;  // Important for diabetics
}

export interface DiabeticMealPlan {
    breakfast: MealSuggestion;
    lunch: MealSuggestion;
    dinner: MealSuggestion;
    snacks: MealSuggestion[];
    totalCarbs: number;
    totalCalories: number;
    glycemicLoad: string;
}

export interface MealSuggestion {
    name: string;
    foods: FoodItem[];
    totalCalories: number;
    totalCarbs: number;
    totalProtein: number;
    totalFat: number;
    // Add missing properties
    calories?: number; // alias for totalCalories
    prepTime?: string;
    glycemicIndex: string;
    recipe?: string;
    diabeticFriendly: boolean;
    tips?: string;
    // Additional nutrient content properties
    ironContent?: string;
    vitaminDContent?: string;
    proteinContent?: string;
}

export interface FoodItem {
    name: string;
    portion: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    // Add missing properties
    quantity?: string; // alias for portion
    unit?: string;
    fiber?: number;
    glycemicIndex?: string;
    sugar?: number;
}

// Event to update dashboard from AI agent
export interface DashboardUpdate {
    type: 'REFRESH_DATA' | 'UPDATE_GOALS' | 'ADD_MEAL' | 'ADD_WATER' | 'SHOW_ALERT' | 'UPDATE_INSIGHTS' | 'SHOW_MEAL_PREVIEW';
    data?: any;
}

@Injectable({
    providedIn: 'root'
})
export class AiService {
    private baseUrl = environment.aiServiceUrl;

    // Agent state
    private agentActiveSubject = new BehaviorSubject<boolean>(false);
    public agentActive$ = this.agentActiveSubject.asObservable();

    private analysisSubject = new BehaviorSubject<AgentAnalysis | null>(null);
    public analysis$ = this.analysisSubject.asObservable();

    private alertsSubject = new BehaviorSubject<any[]>([]);
    public alerts$ = this.alertsSubject.asObservable();

    // Dashboard communication
    public dashboardUpdate = new EventEmitter<DashboardUpdate>();

    // Goals that can be updated by AI
    private goalsSubject = new BehaviorSubject<{ calories: number, water: number, carbs: number }>({
        calories: 2000,
        water: 2500,
        carbs: 250
    });
    public goals$ = this.goalsSubject.asObservable();

    private userProfile: UserProfile = {};
    // Expose profile as observable so components can react when settings change
    private userProfileSubject: BehaviorSubject<UserProfile> = new BehaviorSubject<UserProfile>({});
    public userProfile$ = this.userProfileSubject.asObservable();

    // Diabetic-friendly food database (built-in suggestions)
    private diabeticFriendlyFoods: FoodItem[] = [
        { name: 'Grilled Chicken Breast', portion: '150g', calories: 165, carbs: 0, protein: 31, fat: 3.6, glycemicIndex: 'low' },
        { name: 'Salmon Fillet', portion: '150g', calories: 280, carbs: 0, protein: 39, fat: 13, glycemicIndex: 'low' },
        { name: 'Broccoli (steamed)', portion: '100g', calories: 35, carbs: 7, protein: 2.4, fat: 0.4, fiber: 2.6, glycemicIndex: 'low' },
        { name: 'Spinach Salad', portion: '100g', calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4, fiber: 2.2, glycemicIndex: 'low' },
        { name: 'Quinoa', portion: '100g', calories: 120, carbs: 21, protein: 4.4, fat: 1.9, fiber: 2.8, glycemicIndex: 'low' },
        { name: 'Brown Rice', portion: '100g', calories: 112, carbs: 24, protein: 2.3, fat: 0.8, fiber: 1.8, glycemicIndex: 'medium' },
        { name: 'Lentils', portion: '100g', calories: 116, carbs: 20, protein: 9, fat: 0.4, fiber: 8, glycemicIndex: 'low' },
        { name: 'Greek Yogurt (unsweetened)', portion: '150g', calories: 100, carbs: 6, protein: 17, fat: 0.7, glycemicIndex: 'low' },
        { name: 'Almonds', portion: '30g', calories: 170, carbs: 6, protein: 6, fat: 15, fiber: 3.5, glycemicIndex: 'low' },
        { name: 'Avocado', portion: '100g', calories: 160, carbs: 9, protein: 2, fat: 15, fiber: 7, glycemicIndex: 'low' },
        { name: 'Eggs (boiled)', portion: '2 large', calories: 140, carbs: 1, protein: 12, fat: 10, glycemicIndex: 'low' },
        { name: 'Cauliflower Rice', portion: '100g', calories: 25, carbs: 5, protein: 2, fat: 0.3, fiber: 2, glycemicIndex: 'low' },
        { name: 'Zucchini', portion: '100g', calories: 17, carbs: 3, protein: 1.2, fat: 0.3, fiber: 1, glycemicIndex: 'low' },
        { name: 'Turkey Breast', portion: '150g', calories: 135, carbs: 0, protein: 30, fat: 1, glycemicIndex: 'low' },
        { name: 'Cottage Cheese', portion: '100g', calories: 98, carbs: 3.4, protein: 11, fat: 4.3, glycemicIndex: 'low' },
        { name: 'Olive Oil', portion: '1 tbsp', calories: 120, carbs: 0, protein: 0, fat: 14, glycemicIndex: 'low' },
        { name: 'Bell Peppers', portion: '100g', calories: 31, carbs: 6, protein: 1, fat: 0.3, fiber: 2.1, glycemicIndex: 'low' },
        { name: 'Mushrooms', portion: '100g', calories: 22, carbs: 3.3, protein: 3.1, fat: 0.3, fiber: 1, glycemicIndex: 'low' },
        { name: 'Green Beans', portion: '100g', calories: 31, carbs: 7, protein: 1.8, fat: 0.1, fiber: 3.4, glycemicIndex: 'low' },
        { name: 'Tofu', portion: '100g', calories: 76, carbs: 1.9, protein: 8, fat: 4.8, glycemicIndex: 'low' },
    ];

    constructor(
        private http: HttpClient,
        private goalsSyncService: GoalsSyncService
    ) {
        // Load user profile from localStorage on app start
        this.loadUserProfileFromStorage();
    }

    // ==================== AGENT CONTROL ====================

    activateAgent(): void {
        this.agentActiveSubject.next(true);
    }

    deactivateAgent(): void {
        this.agentActiveSubject.next(false);
    }

    // ==================== USER PROFILE ====================

    updateUserProfile(profile: UserProfile): void {
        this.userProfile = { ...this.userProfile, ...profile };
        // Emit updated profile for subscribers
        this.userProfileSubject.next(this.userProfile);

        // Adjust goals for diabetics
        if (profile.healthConditions?.includes('Diabetic')) {
            this.userProfile.dailyCarbLimit = 130; // Recommended for diabetics
            this.userProfile.dailyCalorieGoal = profile.dailyCalorieGoal || 1800;

            // Update goals
            this.goalsSubject.next({
                calories: this.userProfile.dailyCalorieGoal,
                water: 2500,
                carbs: 130
            });

            // Notify dashboard
            const goalsUpdate: DashboardUpdate = {
                type: 'UPDATE_GOALS',
                data: this.goalsSubject.value
            };
            this.dashboardUpdate.emit(goalsUpdate);

            // Sync with central GoalsSyncService
            this.goalsSyncService.updateGoals({
                calories: this.userProfile.dailyCalorieGoal,
                water: 2500,
                carbs: 130
            }, 'AI Agent Profile Update (Diabetic Mode)');
        }
    }

    getUserProfile(): UserProfile {
        return this.userProfile;
    }

    isDiabetic(): boolean {
        return this.userProfile.healthConditions?.includes('Diabetic') || false;
    }

    // ==================== DIABETIC MEAL PLANNING ====================

    generateDiabeticMealPlan(mealType?: string): Observable<MealSuggestion[]> {
        const suggestions: MealSuggestion[] = [];

        if (!mealType || mealType === 'dinner') {
            // Diabetic-friendly dinner options with full recipes
            suggestions.push(
                {
                    name: '🥗 Grilled Salmon with Roasted Vegetables',
                    foods: [
                        this.diabeticFriendlyFoods.find(f => f.name === 'Salmon Fillet')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Broccoli (steamed)')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Bell Peppers')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Olive Oil')!,
                    ],
                    totalCalories: 466,
                    totalCarbs: 13,
                    totalProtein: 42,
                    totalFat: 28,
                    glycemicIndex: 'low',
                    diabeticFriendly: true,
                    prepTime: '30 minutes',
                    recipe: `**Ingredients:**
• 150g salmon fillet
• 100g broccoli florets
• 1 bell pepper, sliced
• 1 tbsp olive oil
• Lemon, garlic, herbs

**Instructions:**
1. Preheat oven to 200°C (400°F)
2. Season salmon with lemon, garlic, salt & pepper
3. Toss vegetables with olive oil and herbs
4. Bake salmon for 15 min, vegetables for 20 min
5. Serve with a squeeze of fresh lemon

**Why it's good for diabetics:**
✅ High protein, very low carbs
✅ Omega-3 fatty acids help insulin sensitivity
✅ Low glycemic index vegetables`,
                    tips: '💡 Omega-3 in salmon helps improve insulin sensitivity!'
                },
                {
                    name: '🍗 Herb Chicken with Cauliflower Rice',
                    foods: [
                        this.diabeticFriendlyFoods.find(f => f.name === 'Grilled Chicken Breast')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Cauliflower Rice')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Spinach Salad')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Olive Oil')!,
                    ],
                    totalCalories: 343,
                    totalCarbs: 12,
                    totalProtein: 36,
                    totalFat: 18,
                    glycemicIndex: 'low',
                    diabeticFriendly: true,
                    prepTime: '25 minutes',
                    recipe: `**Ingredients:**
• 150g chicken breast
• 100g cauliflower rice
• 100g fresh spinach
• 1 tbsp olive oil
• Italian herbs, garlic

**Instructions:**
1. Season chicken with herbs, garlic, salt & pepper
2. Grill chicken 6-7 min per side until cooked
3. Sauté cauliflower rice in olive oil for 5 min
4. Serve over fresh spinach

**Why it's good for diabetics:**
✅ Only 12g carbs total!
✅ High protein keeps you full
✅ Cauliflower rice is a perfect low-carb substitute`,
                    tips: '💡 Cauliflower rice has 75% fewer carbs than regular rice!'
                },
                {
                    name: '🥘 Turkey & Vegetable Stir-Fry',
                    foods: [
                        this.diabeticFriendlyFoods.find(f => f.name === 'Turkey Breast')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Bell Peppers')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Mushrooms')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Green Beans')!,
                    ],
                    totalCalories: 219,
                    totalCarbs: 16,
                    totalProtein: 36,
                    totalFat: 2,
                    glycemicIndex: 'low',
                    diabeticFriendly: true,
                    prepTime: '20 minutes',
                    recipe: `**Ingredients:**
• 150g turkey breast, sliced
• 100g bell peppers
• 100g mushrooms
• 100g green beans
• Low-sodium soy sauce, ginger, garlic

**Instructions:**
1. Slice turkey and vegetables into strips
2. Heat wok/pan over high heat
3. Stir-fry turkey 5 min until browned
4. Add vegetables, cook 5 more min
5. Season with soy sauce, ginger, garlic

**Why it's good for diabetics:**
✅ Very low fat and low carb
✅ High fiber from vegetables
✅ No blood sugar spikes`,
                    tips: '💡 Use low-sodium soy sauce to keep sodium in check!'
                },
                {
                    name: '🥚 Veggie Omelette with Avocado',
                    foods: [
                        this.diabeticFriendlyFoods.find(f => f.name === 'Eggs (boiled)')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Spinach Salad')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Mushrooms')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Avocado')!,
                    ],
                    totalCalories: 345,
                    totalCarbs: 16,
                    totalProtein: 19,
                    totalFat: 26,
                    glycemicIndex: 'low',
                    diabeticFriendly: true,
                    prepTime: '15 minutes',
                    recipe: `**Ingredients:**
• 2 large eggs
• 50g spinach
• 50g mushrooms
• 1/2 avocado
• Salt, pepper, herbs

**Instructions:**
1. Whisk eggs with salt and pepper
2. Sauté mushrooms and spinach
3. Pour eggs over vegetables
4. Cook until set, fold in half
5. Serve with sliced avocado

**Why it's good for diabetics:**
✅ Eggs don't raise blood sugar
✅ Healthy fats from avocado
✅ Quick and satisfying`,
                    tips: '💡 Eggs are one of the best foods for diabetics - high protein, zero carbs!'
                },
                {
                    name: '🐟 Lemon Herb Cod with Quinoa',
                    foods: [
                        { name: 'Cod Fillet', portion: '150g', calories: 140, carbs: 0, protein: 32, fat: 1, glycemicIndex: 'low' },
                        this.diabeticFriendlyFoods.find(f => f.name === 'Quinoa')!,
                        this.diabeticFriendlyFoods.find(f => f.name === 'Zucchini')!,
                    ],
                    totalCalories: 282,
                    totalCarbs: 29,
                    totalProtein: 38,
                    totalFat: 3,
                    glycemicIndex: 'low-medium',
                    diabeticFriendly: true,
                    prepTime: '25 minutes',
                    recipe: `**Ingredients:**
• 150g cod fillet
• 100g quinoa (cooked)
• 100g zucchini
• Lemon, dill, olive oil

**Instructions:**
1. Cook quinoa according to package
2. Season cod with lemon, dill, salt
3. Bake cod at 180°C for 15 min
4. Sauté zucchini with olive oil
5. Plate quinoa, top with cod and zucchini

**Why it's good for diabetics:**
✅ Quinoa has low glycemic index
✅ High protein fish
✅ Balanced macros`,
                    tips: '💡 Quinoa is a complete protein and has a lower GI than rice!'
                }
            );
        } else if (mealType === 'breakfast') {
            // Diabetic-friendly breakfast
            suggestions.push(
                {
                    name: '🥣 Oatmeal with Berries',
                    foods: [
                        { name: 'Oats', portion: '50g', calories: 190, carbs: 34, protein: 6, fat: 3 },
                        { name: 'Mixed Berries', portion: '100g', calories: 50, carbs: 12, protein: 1, fat: 0 },
                        { name: 'Almonds', portion: '15g', calories: 85, carbs: 3, protein: 3, fat: 7 }
                    ],
                    totalCalories: 325,
                    totalCarbs: 49,
                    totalProtein: 10,
                    totalFat: 10,
                    glycemicIndex: 'low',
                    diabeticFriendly: true,
                    prepTime: '10 minutes',
                    recipe: `**Ingredients:**\n• 50g oats\n• 100g berries\n• 15g almonds\n**Instructions:**\nCook oats with water or milk. Top with berries and nuts.`,
                    tips: '💡 Oats are great for stable energy!'
                },
                {
                    name: '🍳 Spinach & Mushroom Omelette',
                    foods: [
                        { name: 'Eggs', portion: '2 large', calories: 140, carbs: 1, protein: 12, fat: 10 },
                        { name: 'Spinach', portion: '1 cup', calories: 7, carbs: 1, protein: 1, fat: 0 },
                        { name: 'Mushrooms', portion: '1/2 cup', calories: 15, carbs: 2, protein: 2, fat: 0 }
                    ],
                    totalCalories: 162,
                    totalCarbs: 4,
                    totalProtein: 15,
                    totalFat: 10,
                    glycemicIndex: 'low',
                    diabeticFriendly: true,
                    prepTime: '15 minutes',
                    recipe: `**Ingredients:**\n• 2 eggs\n• Spinach & Mushrooms\n**Instructions:**\nWhisk eggs. Sauté veggies. Cook together.`,
                    tips: '💡 High protein, very low carb start to the day.'
                }
            );
        } else if (mealType === 'lunch') {
            // Diabetic-friendly lunch
            suggestions.push(
                {
                    name: '🥗 Grilled Chicken Salad',
                    foods: [
                        { name: 'Chicken Breast', portion: '150g', calories: 165, carbs: 0, protein: 31, fat: 3 },
                        { name: 'Mixed Greens', portion: '2 cups', calories: 20, carbs: 4, protein: 2, fat: 0 },
                        { name: 'Olive Oil Dressing', portion: '1 tbsp', calories: 120, carbs: 0, protein: 0, fat: 14 }
                    ],
                    totalCalories: 305,
                    totalCarbs: 4,
                    totalProtein: 33,
                    totalFat: 17,
                    glycemicIndex: 'low',
                    diabeticFriendly: true,
                    prepTime: '15 minutes',
                    recipe: `**Ingredients:**\n• Chicken breast\n• Greens\n• Dressing\n**Instructions:**\nGrill chicken. Toss salad.`,
                    tips: '💡 Perfect light lunch for stable blood sugar.'
                },
                {
                    name: '🥙 Quinoa & Black Bean Bowl',
                    foods: [
                        { name: 'Quinoa', portion: '1/2 cup', calories: 111, carbs: 20, protein: 4, fat: 2 },
                        { name: 'Black Beans', portion: '1/2 cup', calories: 114, carbs: 20, protein: 7, fat: 0 },
                        { name: 'Avocado', portion: '1/4', calories: 80, carbs: 4, protein: 1, fat: 7 }
                    ],
                    totalCalories: 305,
                    totalCarbs: 44,
                    totalProtein: 12,
                    totalFat: 9,
                    glycemicIndex: 'low',
                    diabeticFriendly: true,
                    prepTime: '10 minutes (precooked)',
                    recipe: `**Ingredients:**\n• Quinoa\n• Black Beans\n• Avocado\n**Instructions:**\nMix ingredients in a bowl.`,
                    tips: '💡 High fiber content helps manage blood sugar spikes.'
                }
            );
        }

        return of(suggestions);
    }

    // ==================== DASHBOARD INTEGRATION ====================

    updateDashboard(updateType: string, data?: any): void {
        const payload: DashboardUpdate = { type: updateType as any, data };
        console.log('AiService: Emitting dashboard update', payload);
        this.dashboardUpdate.emit(payload);
    }

    refreshDashboardData(): void {
        const payload: DashboardUpdate = { type: 'REFRESH_DATA' };
        console.log('AiService: Emitting REFRESH_DATA');
        this.dashboardUpdate.emit(payload);
    }

    // ==================== SMART FOOD SUGGESTIONS ====================

    getSmartFoodSuggestions(userFoods: any[], condition?: string): FoodItem[] {
        let suggestions = [...this.diabeticFriendlyFoods];

        if (condition === 'Diabetic' || this.isDiabetic()) {
            // Filter for low glycemic foods only
            suggestions = suggestions.filter(f => f.glycemicIndex === 'low');
        }

        // Add user's foods that match criteria
        if (userFoods && userFoods.length > 0) {
            userFoods.forEach(food => {
                if (!suggestions.find(s => s.name.toLowerCase() === food.name?.toLowerCase())) {
                    // Check if it's diabetic friendly (low sugar, moderate carbs)
                    if ((food.sugar || 0) < 10 && (food.carbohydrates || 0) < 30) {
                        suggestions.push({
                            name: food.name,
                            portion: '100g',
                            calories: food.calories || 0,
                            carbs: food.carbohydrates || 0,
                            protein: food.protein || 0,
                            fat: food.fat || 0,
                            fiber: food.fiber,
                            sugar: food.sugar,
                            glycemicIndex: (food.sugar || 0) < 5 ? 'low' : 'medium'
                        });
                    }
                }
            });
        }

        return suggestions;
    }

    // ==================== CHAT & COMMANDS ====================

    /**
     * Main chat method - uses RAG-enabled Phi3 with fallback
     */
    chat(message: string): Observable<string> {
        // Try RAG-enabled chat first
        const payload = { message };
        return this.http.post<any>(`${this.baseUrl}/chat/rag`, payload).pipe(
            map(resp => {
                if (!resp) return '';
                // Support different response shapes: { response: 'text' } or plain string
                if (typeof resp === 'string') return resp;
                if (resp.response) return resp.response;
                // fallback: pick first text-like field
                const keys = Object.keys(resp);
                for (const k of keys) {
                    if (typeof resp[k] === 'string') return resp[k];
                }
                return JSON.stringify(resp);
            }),
            catchError(err => {
                console.warn('Error with RAG chat, falling back to simple chat: ', err);
                // fallback to simpler endpoint if RAG is unavailable
                return this.http.post<any>(`${this.baseUrl}/chat`, payload).pipe(
                    map(r => (r && (r.response || r)) ? (r.response || r) : JSON.stringify(r)),
                    catchError(innerErr => {
                        console.warn('Fallback simple chat failed, returning local reply', innerErr);
                        return of(`[Local fallback] Sorry, AI is currently unavailable. You said: ${message}`);
                    })
                );
            })
        );
    }

    /**
     * Chat with RAG (Retrieval-Augmented Generation)
     */
    chatWithRag(message: string, context?: any): Observable<ChatMessage> {
        const request: ChatRequest = {
            message: message,
            context: context
        };

        return this.http.post<any>(`${this.baseUrl}/chat/rag`, request).pipe(
            map(response => ({
                role: 'assistant' as const,
                content: response.response || 'No response from AI',
                timestamp: new Date(),
                actions: this.extractActionsFromIntent(response.intent, response.suggestedActions)
            })),
            catchError(error => {
                console.error('Error with RAG chat, falling back to simple chat:', error);
                // Fallback to simple chat
                return this.chatWithPhi3(message, context);
            })
        );
    }

    /**
     * Extract actions from intent and suggested actions
     */
    private extractActionsFromIntent(intent: string, suggestedActions: string[]): AgentAction[] {
        const actions: AgentAction[] = [];

        if (!suggestedActions || suggestedActions.length === 0) {
            return actions;
        }

        for (const actionType of suggestedActions) {
            switch (actionType) {
                case 'suggest_meals':
                    actions.push({
                        type: 'GET_SUGGESTIONS',
                        parameters: { mealType: 'any' },
                        status: 'pending',
                        label: '🍽️ Suggérer des repas'
                    });
                    break;
                case 'log_meal':
                    actions.push({
                        type: 'ADD_MEAL',
                        parameters: {},
                        status: 'pending',
                        label: '📝 Enregistrer un repas'
                    });
                    break;
                case 'add_water':
                    actions.push({
                        type: 'ADD_WATER',
                        parameters: { amount: 250 },
                        status: 'pending',
                        label: '💧 Ajouter de l\'eau'
                    });
                    break;
                case 'analyze_profile':
                    actions.push({
                        type: 'UPDATE_DASHBOARD',
                        parameters: { action: 'analyze' },
                        status: 'pending',
                        label: '📊 Analyser mon profil'
                    });
                    break;
                case 'update_goals':
                    actions.push({
                        type: 'SET_GOAL',
                        parameters: {},
                        status: 'pending',
                        label: '🎯 Mettre à jour mes objectifs'
                    });
                    break;
            }
        }

        return actions;
    }

    /**
     * Legacy chat method with response object
     */
    chatLegacy(message: string, context?: any): Observable<{ response: string }> {
        const body: ChatRequest = { message };
        if (context) {
            body.context = context;
        }

        // Always try to call the backend first
        return this.http.post<{ response: string }>(`${this.baseUrl}/chat/rag`, body).pipe(
            tap(response => {
                // Process the response and update dashboard if it contains actionable data
                this.processAiResponse(response.response, message);
            }),
            catchError(err => {
                console.warn('Chat backend failed, using local response:', err);
                const localResponse = this.getFallbackResponse(message);
                // Still process local response for dashboard updates
                this.processAiResponse(localResponse, message);
                return of({ response: localResponse });
            })
        );
    }

    /**
     * Get fallback response when Phi3 is not available
     */
    private getFallbackResponse(message: string): string {
        return this.generateLocalResponse(message);
    }

    // ==================== CHAT WITH PHI3 ====================

    /**
     * Chat with Phi3 AI model via backend service
     */
    chatWithPhi3(message: string, context?: any): Observable<ChatMessage> {
        const request: ChatRequest = {
            message: message,
            context: context
        };

        return this.http.post<any>(`${this.baseUrl}/chat/rag`, request).pipe(
            map(response => ({
                role: 'assistant' as const,
                content: response.response || 'No response from AI',
                timestamp: new Date()
            })),
            catchError(error => {
                console.error('Error chatting with Phi3:', error);
                return of({
                    role: 'assistant' as const,
                    content: 'I\'m having trouble connecting to Phi3 right now. Please ensure Ollama is running with the phi3 model.',
                    timestamp: new Date()
                });
            })
        );
    }

    /**
     * Smart chat with intent detection via Phi3
     */
    smartChatWithPhi3(message: string, context?: any): Observable<SmartChatResult> {
        const request = {
            message: message,
            context: context
        };

        return this.http.post<any>(`${this.baseUrl}/smart/chat`, request).pipe(
            map(response => {
                const chatResponse: ChatMessage = {
                    role: 'assistant' as const,
                    content: response.response || 'No response from AI',
                    timestamp: new Date()
                };

                // Convert backend response to frontend actions
                const actions: AgentAction[] = [];
                if (response.actionData) {
                    const data = response.actionData;
                    if (response.intent === 'LOG_MEAL' && data.mealName) {
                        actions.push({
                            type: 'ADD_MEAL',
                            parameters: {
                                name: data.mealName,
                                calories: data.calories || 300,
                                protein: data.protein || 0,
                                carbs: data.carbs || 0,
                                fats: data.fats || 0,
                                fiber: data.fiber || 0
                            },
                            status: 'pending'
                        });
                    } else if (response.intent === 'LOG_WATER' && (data.glasses || data.waterAmount)) {
                        actions.push({
                            type: 'ADD_WATER',
                            parameters: {
                                amount: data.waterAmount || (data.glasses * 250) || 250
                            },
                            status: 'pending'
                        });
                    }
                }

                chatResponse.actions = actions;
                return { response: chatResponse, actions, actionData: response.actionData };
            }),
            catchError(error => {
                console.error('Error with smart chat:', error);
                const fallbackResponse: ChatMessage = {
                    role: 'assistant' as const,
                    content: this.getFallbackResponse(message),
                    timestamp: new Date()
                };
                return of({ response: fallbackResponse, actions: [] });
            })
        );
    }

    /**
     * Generate diagnostic report with Phi3
     */
    generateDiagnosticWithPhi3(userData: string): Observable<string> {
        return this.http.post<any>(`${this.baseUrl}/smart/diagnostic`, { userData }).pipe(
            map(response => response.report || 'Unable to generate report'),
            catchError(error => {
                console.error('Error generating diagnostic:', error);
                return of('Diagnostic report is temporarily unavailable. Please ensure the AI service is running.');
            })
        );
    }

    /**
     * Test Phi3 connectivity
     */
    testPhi3Connection(): Observable<boolean> {
        return this.http.post<any>(`${this.baseUrl}/chat/rag`, { message: "Hello, are you working?" }).pipe(
            map(response => {
                console.log('Phi3 connection test successful:', response);
                return true;
            }),
            catchError(error => {
                console.error('Phi3 connection test failed:', error);
                return of(false);
            })
        );
    }

    // ==================== ENHANCED AGENT INTEGRATION ====================

    /**
     * Quick analyze with enhanced agent
     */
    quickAnalyzeWithPhi3(userData: string, isDiabetic: boolean = false): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/enhanced/quick-analyze`, {
            userData: userData,
            isDiabetic: isDiabetic
        }).pipe(
            catchError(error => {
                console.error('Error with quick analyze:', error);
                return of({
                    success: false,
                    insights: ['Unable to connect to AI service'],
                    recommendations: ['Please check if Ollama is running with phi3 model']
                });
            })
        );
    }

    /**
     * Smart meal logging with Phi3
     */
    smartMealLogWithPhi3(description: string, isDiabetic: boolean = false): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/enhanced/smart-meal-log`, {
            description: description,
            isDiabetic: isDiabetic
        }).pipe(
            catchError(error => {
                console.error('Error with smart meal log:', error);
                return of({
                    success: false,
                    message: 'Unable to log meal automatically'
                });
            })
        );
    }

    /**
     * Ask the enhanced agent to produce automatic actions based on current user data
     */
    autoAct(userData: any, isDiabetic: boolean = false): Observable<any> {
        const payload = { userData: userData, isDiabetic: isDiabetic };
        return this.http.post<any>(`${this.baseUrl}/enhanced/auto-act`, payload).pipe(
            catchError(error => {
                console.warn('autoAct backend failed, returning local auto actions:', error);
                // Provide a small local fallback that mirrors backend heuristics
                const actions: any = { success: false };
                try {
                    const recommendedWater = (userData?.water) ? Math.max(0, 2000 - userData.water) : 2000;
                    if (recommendedWater > 0) actions.water = { type: 'remind_water', amount_ml: Math.min(500, recommendedWater), message: '💧 Add a glass of water' };
                    const carbs = userData?.carbs || 0;
                    if (isDiabetic && carbs > 130) {
                        actions.carbs = { type: 'suggest_low_carb_meals', remainingCarbs: Math.max(0, 130 - carbs), suggestions: [] };
                    }
                    const protein = userData?.protein || 0;
                    if (protein < 30) actions.protein = { type: 'tip_add_protein', message: '🍗 Try a protein-rich snack.' };
                    actions.success = true;
                } catch (e) { actions.success = false; }
                return of(actions);
            })
        );
    }

    // ==================== LEGACY METHODS (Updated to use Phi3) ====================

    /**
     * Process natural language command - now uses Phi3
     */
    processNaturalLanguage(message: string): Observable<{ response: string, actions: AgentAction[] }> {
        return this.smartChatWithPhi3(message).pipe(
            map(result => ({
                response: result.response.content,
                actions: result.actions || []
            }))
        );
    }


    // New method to process AI responses and extract actionable data
    private processAiResponse(response: string, originalMessage: string): void {
        const lowerMessage = originalMessage.toLowerCase();
        const lowerResponse = response.toLowerCase();

        // Extract meal data from AI response if user was logging food
        if (lowerMessage.includes('ate') || lowerMessage.includes('had') || lowerMessage.includes('meal')) {
            const mealData = this.extractMealDataFromResponse(response, originalMessage);
            if (mealData) {
                this.updateDashboardWithMealData(mealData);
            }
        }

        // Extract water intake if mentioned
        if (lowerMessage.includes('water') || lowerMessage.includes('drink')) {
            const waterAmount = this.extractWaterFromResponse(response, originalMessage);
            if (waterAmount > 0) {
                this.updateDashboardWithWaterData(waterAmount);
            }
        }

        // Update health insights based on AI response
        if (lowerResponse.includes('health') || lowerResponse.includes('nutrition')) {
            this.updateHealthInsights(response);
        }
    }

    private extractMealDataFromResponse(response: string, originalMessage: string): any {
        // Extract food items from the original message
        const foods = this.extractFoodsFromCommand(originalMessage);

        if (foods.length > 0) {
            // Estimate nutrition values (AI should provide these, but we'll estimate as fallback)
            const estimatedCalories = this.estimateCalories(foods);
            const estimatedCarbs = this.estimateCarbs(foods);
            const estimatedProtein = this.estimateProtein(foods);
            const estimatedFat = this.estimateFat(foods);

            return {
                name: foods.join(', '),
                calories: estimatedCalories,
                carbs: estimatedCarbs,
                protein: estimatedProtein,
                fat: estimatedFat,
                foods: foods,
                aiGenerated: true,
                mealTime: this.determineMealTime(),
                date: new Date().toISOString()
            };
        }
        return null;
    }

    private extractWaterFromResponse(response: string, originalMessage: string): number {
        // Look for water amount in the message
        const waterMatch = originalMessage.match(/(\d+)\s*(?:ml|liters?|glasses?|cups?)/i);
        if (waterMatch) {
            const amount = parseInt(waterMatch[1]);
            const unit = waterMatch[2]?.toLowerCase();

            // Convert to ml
            if (unit?.includes('liter')) return amount * 1000;
            if (unit?.includes('glass') || unit?.includes('cup')) return amount * 250;
            return amount; // assume ml
        }

        // Default glass of water
        if (originalMessage.toLowerCase().includes('glass')) return 250;
        return 0;
    }

    private updateDashboardWithMealData(mealData: any): void {
        // Emit dashboard update event to add the meal directly
        this.dashboardUpdate.emit({
            type: 'ADD_MEAL',
            data: mealData
        });

        // Update local analytics (no direct log action)
        this.updateAnalyticsFromMeal(mealData);
    }

    private updateDashboardWithWaterData(amount: number): void {
        // Emit dashboard update event
        this.dashboardUpdate.emit({
            type: 'ADD_WATER',
            data: { amount, date: new Date().toISOString() }
        });
    }

    private updateHealthInsights(aiResponse: string): void {
        // Extract health insights from AI response
        const insights = this.parseHealthInsights(aiResponse);

        if (insights.length > 0) {
            this.dashboardUpdate.emit({
                type: 'UPDATE_INSIGHTS',
                data: { insights }
            });
        }
    }

    private updateAnalyticsFromMeal(mealData: any): void {
        // Update local analytics that can be displayed immediately
        const currentAnalysis = this.analysisSubject.value;

        if (currentAnalysis) {
            currentAnalysis.insights = currentAnalysis.insights || [];
            currentAnalysis.insights.push(`Added: ${mealData.name} (${mealData.calories} cal)`);

            // Update health score based on meal
            if (currentAnalysis.healthScore !== undefined) {
                const mealHealthImpact = this.calculateMealHealthImpact(mealData);
                currentAnalysis.healthScore = Math.min(100, currentAnalysis.healthScore + mealHealthImpact);
            }

            this.analysisSubject.next(currentAnalysis);
        }
    }

    private calculateMealHealthImpact(mealData: any): number {
        let impact = 0;

        // Positive impacts
        if (mealData.protein && mealData.protein > 15) impact += 5;
        if (mealData.calories && mealData.calories < 400) impact += 3;
        if (mealData.foods && mealData.foods.some((f: string) =>
            f.toLowerCase().includes('vegetable') ||
            f.toLowerCase().includes('fruit') ||
            f.toLowerCase().includes('salad'))) impact += 5;

        // Negative impacts
        if (mealData.calories && mealData.calories > 600) impact -= 3;
        if (mealData.fat && mealData.fat > 25) impact -= 2;

        return impact;
    }

    private parseHealthInsights(aiResponse: string): string[] {
        const insights: string[] = [];

        // Look for health-related advice in the AI response
        const sentences = aiResponse.split(/[.!?]+/).filter(s => s.trim());

        for (const sentence of sentences) {
            const lowerSentence = sentence.toLowerCase().trim();

            if (lowerSentence.includes('recommend') ||
                lowerSentence.includes('suggest') ||
                lowerSentence.includes('try') ||
                lowerSentence.includes('consider') ||
                lowerSentence.includes('good') ||
                lowerSentence.includes('healthy')) {
                insights.push(sentence.trim());
            }
        }

        return insights.slice(0, 3); // Limit to 3 insights
    }

    private determineMealTime(): string {
        const hour = new Date().getHours();
        if (hour < 11) return 'breakfast';
        if (hour < 16) return 'lunch';
        return 'dinner';
    }

    private estimateProtein(foods: string[]): number {
        let total = 0;
        foods.forEach(food => {
            const lowerFood = food.toLowerCase();
            if (lowerFood.includes('chicken') || lowerFood.includes('meat') || lowerFood.includes('fish')) total += 25;
            else if (lowerFood.includes('egg')) total += 12;
            else if (lowerFood.includes('cheese') || lowerFood.includes('yogurt')) total += 10;
            else if (lowerFood.includes('beans') || lowerFood.includes('lentil')) total += 8;
            else total += 3; // Default protein content
        });
        return total || 20;
    }

    private estimateFat(foods: string[]): number {
        let total = 0;
        foods.forEach(food => {
            const lowerFood = food.toLowerCase();
            if (lowerFood.includes('oil') || lowerFood.includes('butter')) total += 14;
            else if (lowerFood.includes('cheese') || lowerFood.includes('nuts')) total += 10;
            else if (lowerFood.includes('meat') || lowerFood.includes('fish')) total += 8;
            else if (lowerFood.includes('avocado')) total += 15;
            else total += 2; // Default fat content
        });
        return total || 15;
    }

    // ==================== DIAGNOSTIC & ANALYSIS METHODS ====================

    generateDiagnostic(userData: any): Observable<any> {
        // Try to call backend diagnostic endpoint
        return this.http.post(`${this.baseUrl}/diagnostic`, userData).pipe(
            catchError(err => {
                console.warn('Diagnostic backend failed, generating local report:', err);
                // Generate local diagnostic report
                const localReport = this.generateLocalDiagnostic(userData);
                return of(localReport);
            })
        );
    }

    analyzeAndAct(userData: any): Observable<AgentAnalysis> {
        // Try to call backend analysis endpoint
        return this.http.post<AgentAnalysis>(`${this.baseUrl}/analyze`, userData).pipe(
            tap(analysis => {
                // Update local analysis state
                this.analysisSubject.next(analysis);

                // Emit dashboard updates if analysis contains actionable data
                if (analysis.insights) {
                    this.dashboardUpdate.emit({
                        type: 'UPDATE_INSIGHTS',
                        data: { insights: analysis.insights }
                    });
                }
            }),
            catchError(err => {
                console.warn('Analysis backend failed, generating local analysis:', err);
                // Generate local analysis
                const localAnalysis = this.generateLocalAnalysis(userData);
                this.analysisSubject.next(localAnalysis);
                return of(localAnalysis);
            })
        );
    }

    // ==================== HEALTH ALERTS ====================

    checkHealthAlerts(userData: any): Observable<any> {
        // Try to call backend health alerts endpoint
        return this.http.post(`${this.baseUrl}/health-alerts`, userData).pipe(
            tap(alerts => {
                // Update local alerts state - ensure it's an array
                const alertsArray = Array.isArray(alerts) ? alerts : [];
                this.alertsSubject.next(alertsArray);

                // Emit dashboard updates if there are alerts
                if (alertsArray && alertsArray.length > 0) {
                    this.dashboardUpdate.emit({
                        type: 'SHOW_ALERT',
                        data: alertsArray
                    });
                }
            }),
            catchError(err => {
                console.warn('Health alerts backend failed, generating local alerts:', err);
                // Generate local health alerts
                const localAlerts = this.generateLocalHealthAlerts(userData);
                this.alertsSubject.next(localAlerts);

                if (localAlerts.length > 0) {
                    this.dashboardUpdate.emit({
                        type: 'SHOW_ALERT',
                        data: localAlerts
                    });
                }

                return of(localAlerts);
            })
        );
    }

    private generateLocalHealthAlerts(userData: any): any[] {
        const alerts: any[] = [];

        // Diabetic-specific alerts
        if (this.isDiabetic()) {
            if (userData.todayCarbs > 150) {
                alerts.push({
                    type: 'warning',
                    title: 'High Carbohydrate Intake',
                    message: `Your carb intake today (${userData.todayCarbs}g) exceeds the recommended limit for diabetics (130g).`,
                    priority: 'high'
                });
            }

            if (userData.todayCalories > (this.userProfile.dailyCalorieGoal || 1800) * 1.2) {
                alerts.push({
                    type: 'warning',
                    title: 'High Calorie Intake',
                    message: 'Your calorie intake is significantly above your daily goal.',
                    priority: 'medium'
                });
            }
        }

        // General health alerts
        if (userData.todayWater < 1000) {
            alerts.push({
                type: 'info',
                title: 'Low Water Intake',
                message: 'You\'ve had less than 1 liter of water today. Try to increase your hydration.',
                priority: 'medium'
            });
        }

        if (userData.todayCalories < 1000) {
            alerts.push({
                type: 'warning',
                title: 'Very Low Calorie Intake',
                message: 'Your calorie intake today is quite low. Make sure you\'re getting adequate nutrition.',
                priority: 'high'
            });
        }

        return alerts;
    }

    // ==================== MISSING HELPER METHODS ====================

    private generateLocalDiagnostic(userData: any): any {
        const diagnostic = {
            success: true,
            timestamp: new Date().toISOString(),
            userId: userData.userId || 'anonymous',
            healthStatus: 'normal',
            recommendations: [] as string[],
            alerts: [] as any[],
            summary: {} as any
        };

        // Calculate health metrics
        const todayCalories = userData.todayCalories || 0;
        const todayCarbs = userData.todayCarbs || 0;
        const todayProtein = userData.todayProtein || 0;
        const todayWater = userData.todayWater || 0;
        const goalCalories = this.userProfile.dailyCalorieGoal || 2000;
        const goalWater = 2500;

        diagnostic.summary = {
            calories: { consumed: todayCalories, goal: goalCalories, percentage: Math.round((todayCalories / goalCalories) * 100) },
            water: { consumed: todayWater, goal: goalWater, percentage: Math.round((todayWater / goalWater) * 100) },
            carbs: { consumed: todayCarbs, limit: this.isDiabetic() ? 130 : 250 },
            protein: { consumed: todayProtein, goal: 150 }
        };

        // Generate recommendations
        diagnostic.recommendations = [
            "Continue tracking your meals consistently",
            "Aim for balanced macronutrients in each meal",
            "Stay hydrated throughout the day"
        ];

        if (this.isDiabetic()) {
            diagnostic.recommendations.push("Monitor carbohydrate intake to maintain stable blood sugar");
            if (todayCarbs > 130) {
                diagnostic.alerts.push({
                    type: 'warning',
                    message: 'Carbohydrate intake exceeds diabetic recommendations',
                    priority: 'high'
                });
            }
        }

        if (todayWater < 1500) {
            diagnostic.recommendations.push("Increase water intake - aim for at least 8 glasses per day");
        }

        if (todayCalories < goalCalories * 0.7) {
            diagnostic.alerts.push({
                type: 'info',
                message: 'Calorie intake is below recommended levels',
                priority: 'medium'
            });
        }

        return diagnostic;
    }

    private generateLocalAnalysis(userData: any): AgentAnalysis {
        const analysis: AgentAnalysis = {
            success: true,
            insights: [],
            alerts: [],
            recommendations: [],
            suggestedActions: [],
            healthScore: 75,
            motivationalMessage: "Keep up the great work with your nutrition tracking!"
        };

        // Calculate health score based on various factors
        let score = 50; // Base score

        const todayCalories = userData.todayCalories || 0;
        const todayCarbs = userData.todayCarbs || 0;
        const todayProtein = userData.todayProtein || 0;
        const todayWater = userData.todayWater || 0;
        const goalCalories = this.userProfile.dailyCalorieGoal || 2000;

        // Scoring factors
        if (todayWater >= 2000) score += 15;
        else if (todayWater >= 1500) score += 10;
        else if (todayWater >= 1000) score += 5;

        if (todayCalories > goalCalories * 0.8 && todayCalories < goalCalories * 1.2) score += 15;
        else if (todayCalories > goalCalories * 0.6 && todayCalories < goalCalories * 1.4) score += 10;

        if (todayProtein >= 100) score += 10;
        else if (todayProtein >= 60) score += 5;

        if (this.isDiabetic()) {
            if (todayCarbs <= 130) score += 10;
            else if (todayCarbs <= 160) score += 5;
            else score -= 5;
        }

        analysis.healthScore = Math.min(100, Math.max(0, score));

        // Generate insights
        analysis.insights = [
            `Your health score today is ${analysis.healthScore}/100`,
            `You've consumed ${todayCalories} calories out of your ${goalCalories} goal`,
            `Water intake: ${todayWater}ml (${Math.round((todayWater / 2500) * 100)}% of daily goal)`
        ];

        if (this.isDiabetic()) {
            analysis.insights.push(`Carbs today: ${todayCarbs}g (diabetic limit: 130g)`);
        }

        // Generate recommendations
        analysis.recommendations = [
            "Continue consistent meal tracking",
            "Focus on whole, unprocessed foods",
            "Maintain regular meal timing"
        ];

        if (todayWater < 2000) {
            analysis.recommendations.push("Increase water intake for better hydration");
        }

        if (todayProtein < 100) {
            analysis.recommendations.push("Add more protein-rich foods to your meals");
        }

        // Generate suggested actions
        analysis.suggestedActions = [
            {
                type: 'GET_SUGGESTIONS',
                parameters: { mealType: this.determineMealTime() },
                status: 'pending',
                label: 'Get meal suggestions'
            },
            {
                type: 'ADD_WATER',
                parameters: { amount: 250 },
                status: 'pending',
                label: 'Log water intake'
            }
        ];

        if (this.isDiabetic()) {
            analysis.suggestedActions.push({
                type: 'CREATE_MEAL_PLAN',
                parameters: { dietType: 'diabetic' },
                status: 'pending',
                label: 'Create diabetic meal plan'
            });
        }

        // Set motivational message based on score
        if (analysis.healthScore >= 90) {
            analysis.motivationalMessage = "Excellent! You're doing fantastic with your nutrition goals! 🌟";
        } else if (analysis.healthScore >= 75) {
            analysis.motivationalMessage = "Great job! You're on track with your healthy lifestyle! 👍";
        } else if (analysis.healthScore >= 60) {
            analysis.motivationalMessage = "Good progress! A few small adjustments can make a big difference! 💪";
        } else {
            analysis.motivationalMessage = "Every step counts! Let's work together to improve your nutrition! 🎯";
        }

        // Generate alerts if needed
        if (this.isDiabetic() && todayCarbs > 150) {
            analysis.alerts?.push({
                type: 'warning',
                title: 'High Carbohydrate Intake',
                message: `Your carb intake (${todayCarbs}g) exceeds the recommended limit for diabetics`,
                priority: 'high'
            });
        }

        if (todayCalories < goalCalories * 0.6) {
            analysis.alerts?.push({
                type: 'info',
                title: 'Low Calorie Intake',
                message: 'Consider adding more nutritious foods to meet your calorie goals',
                priority: 'medium'
            });
        }

        return analysis;
    }

    private generateLocalResponse(message: string, context?: any): string {
        const lowerMessage = message.toLowerCase();

        // Greeting responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return "Hello! I'm your AI nutrition assistant. I can help you track meals, analyze your diet, and provide personalized recommendations. What would you like to do today?";
        }

        // Help responses
        if (lowerMessage.includes('help')) {
            return `I can help you with:
• 🍽️ Log meals: "I ate chicken salad"
• 💧 Track water: "I drank 2 glasses of water"
• 📊 Health analysis: "How am I doing today?"
• 🥗 Meal suggestions: "Suggest a healthy dinner"
• 🩺 Health check: "Run a health check"
            
What would you like to try?`;
        }

        // Meal logging responses
        if (lowerMessage.includes('ate') || lowerMessage.includes('had') || lowerMessage.includes('meal')) {
            const foods = this.extractFoodsFromCommand(message);
            if (foods.length > 0) {
                return `Great! I've logged your meal: ${foods.join(', ')}. I've estimated the nutrition values and updated your dashboard. Your daily totals have been refreshed!`;
            }
            return "I'd be happy to help you log your meal! Can you tell me what specific foods you ate?";
        }

        // Water tracking responses
        if (lowerMessage.includes('water') || lowerMessage.includes('drink')) {
            const amount = this.extractWaterFromResponse('', message);
            if (amount > 0) {
                return `Excellent! I've added ${amount}ml of water to your daily intake. Stay hydrated! 💧`;
            }
            return "Great job staying hydrated! I've added a glass of water (250ml) to your intake. How much water did you drink?";
        }

        // Health analysis responses
        if (lowerMessage.includes('health') || lowerMessage.includes('doing') || lowerMessage.includes('progress')) {
            return `Based on your current data, here's your health summary:
• Your nutrition tracking is going well!
• Keep focusing on balanced meals with protein and vegetables
• Remember to stay hydrated throughout the day
• I recommend regular meal timing for better metabolism
            
Would you like a detailed health report?`;
        }

        // Meal suggestion responses
        if (lowerMessage.includes('suggest') || lowerMessage.includes('recommend') || lowerMessage.includes('meal plan')) {
            if (this.isDiabetic()) {
                return `Here are some diabetes-friendly meal suggestions:
• 🥗 Grilled salmon with roasted vegetables (low-carb)
• 🍗 Herb chicken with cauliflower rice
• 🥚 Veggie omelette with avocado
• 🐟 Lemon herb cod with quinoa
                
All meals are designed to maintain stable blood sugar levels!`;
            }
            return `Here are some healthy meal suggestions:
• 🥗 Mediterranean chicken salad
• 🍲 Quinoa Buddha bowl with mixed vegetables  
• 🐟 Baked salmon with sweet potato
• 🥙 Turkey and avocado wrap
            
Would you like a recipe for any of these?`;
        }

        // Default response
        return "I'm here to help with your nutrition goals! You can ask me to log meals, track water intake, analyze your health, or suggest healthy recipes. What would you like to do?";
    }

    private extractFoodsFromCommand(message: string): string[] {
        const lowerMessage = message.toLowerCase();
        const foods: string[] = [];

        // Common food patterns
        const foodPatterns = [
            /(?:ate|had|consumed)\s+(.+?)(?:\s+for\s+|\s+at\s+|\s*$)/gi,
            /(?:chicken|beef|fish|salmon|tuna|turkey|pork|lamb|tofu)/gi,
            /(?:salad|soup|sandwich|pizza|pasta|rice|quinoa|bread)/gi,
            /(?:apple|banana|orange|berries|grapes|vegetables|broccoli|spinach)/gi,
            /(?:cheese|yogurt|milk|eggs|nuts|almonds|avocado)/gi
        ];

        // Extract food items using patterns
        for (const pattern of foodPatterns) {
            const matches = message.match(pattern);
            if (matches) {
                foods.push(...matches.map(match => match.trim()));
            }
        }

        // If no specific patterns found, try to extract from common phrases
        if (foods.length === 0) {
            const ateMatch = lowerMessage.match(/(?:ate|had|consumed)\s+(.+?)(?:\s+for|\s+at|\.|$)/);
            if (ateMatch) {
                const foodText = ateMatch[1];
                // Split by common separators
                const items = foodText.split(/\s+(?:and|with|,)\s+/);
                foods.push(...items.filter(item => item.trim().length > 2));
            }
        }

        // Clean up and return unique foods
        return [...new Set(foods.map(food =>
            food.replace(/^(ate|had|consumed)\s+/i, '').trim()
        ))].filter(food => food.length > 0);
    }

    private estimateCalories(foods: string[]): number {
        let total = 0;
        foods.forEach(food => {
            const lowerFood = food.toLowerCase();
            if (lowerFood.includes('salad')) total += 150;
            else if (lowerFood.includes('chicken') || lowerFood.includes('meat')) total += 250;
            else if (lowerFood.includes('fish') || lowerFood.includes('salmon')) total += 200;
            else if (lowerFood.includes('pasta') || lowerFood.includes('rice')) total += 220;
            else if (lowerFood.includes('sandwich')) total += 300;
            else if (lowerFood.includes('pizza')) total += 285;
            else if (lowerFood.includes('soup')) total += 100;
            else if (lowerFood.includes('fruit') || lowerFood.includes('apple')) total += 80;
            else if (lowerFood.includes('yogurt')) total += 120;
            else if (lowerFood.includes('nuts')) total += 160;
            else total += 100; // Default estimate
        });
        return total || 250; // Default meal calories
    }

    private estimateCarbs(foods: string[]): number {
        let total = 0;
        foods.forEach(food => {
            const lowerFood = food.toLowerCase();
            if (lowerFood.includes('pasta') || lowerFood.includes('rice')) total += 45;
            else if (lowerFood.includes('bread') || lowerFood.includes('sandwich')) total += 30;
            else if (lowerFood.includes('pizza')) total += 35;
            else if (lowerFood.includes('fruit') || lowerFood.includes('apple')) total += 20;
            else if (lowerFood.includes('yogurt')) total += 15;
            else if (lowerFood.includes('salad')) total += 8;
            else if (lowerFood.includes('chicken') || lowerFood.includes('meat') || lowerFood.includes('fish')) total += 0;
            else total += 10; // Default carb estimate
        });
        return total || 25; // Default meal carbs
    }

    /**
     * Load user profile from localStorage
     */
    private loadUserProfileFromStorage(): void {
        const profileJson = localStorage.getItem('userProfile');
        const preferencesJson = localStorage.getItem('userPreferences');

        let profile: UserProfile = {};

        if (profileJson) {
            try {
                const basicProfile = JSON.parse(profileJson);
                profile = { ...profile, ...basicProfile };
            } catch (e) {
                console.error('Error loading user profile from storage', e);
            }
        }

        if (preferencesJson) {
            try {
                const preferences = JSON.parse(preferencesJson);
                profile = {
                    ...profile,
                    healthConditions: preferences.healthConditions || [],
                    dietaryRestrictions: preferences.dietaryRestrictions || [],
                    goals: preferences.goals ? [preferences.goals] : []
                };
            } catch (e) {
                console.error('Error loading user preferences from storage', e);
            }
        }

        if (Object.keys(profile).length > 0) {
            this.userProfile = profile;
            this.userProfileSubject.next(this.userProfile);

            // Adjust goals if diabetic
            if (this.isDiabetic()) {
                this.goalsSubject.next({
                    calories: this.userProfile.dailyCalorieGoal || 1800,
                    water: 2500,
                    carbs: 130
                });
            }
        }
    }
}
