import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EnhancedAiService } from '../../services/enhanced-ai.service';
import { MealService } from '../../services/meal.service';
import { WaterService } from '../../services/water.service';
import { AiService } from '../../services/ai.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionData?: any;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.css']
})
export class AiAssistantComponent implements OnInit {
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  // Chat state
  messages: ChatMessage[] = [];
  userInput = '';
  isProcessing = false;

  // Voice input
  isListening = false;
  recognition: any;

  // User profile
  isDiabetic = false;
  dailyGoals = {
    calories: 2000,
    carbs: 130,
    protein: 50,
    water: 2500
  };
  // Full profile object (from Settings via AiService)
  userProfile: any = {};

  // Quick actions
  quickActions = [
    { icon: '🍽️', label: 'Log Meal', action: 'log-meal' },
    { icon: '💧', label: 'Add Water', action: 'add-water' },
    { icon: '📊', label: 'Get Report', action: 'report' },
    { icon: '🎯', label: 'Meal Plan', action: 'meal-plan' },
    { icon: '🩺', label: 'Health Check', action: 'health-check' }
  ];

  // Stats for context
  todayStats = {
    calories: 0,
    carbs: 0,
    protein: 0,
    water: 0,
    meals: 0
  };

  constructor(
    private enhancedAi: EnhancedAiService,
    private mealService: MealService,
    private waterService: WaterService,
    private aiService: AiService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadTodayStats();
    this.initVoiceRecognition();
    this.addWelcomeMessage();

    // Subscribe to AI service profile updates so assistant reflects saved settings immediately
    this.aiService.userProfile$.subscribe(profile => {
      if (profile) {
        // store full profile for use in AI calls
        this.userProfile = profile;
        // determine diabetic mode from healthConditions
        if (profile.healthConditions && Array.isArray(profile.healthConditions)) {
          this.isDiabetic = profile.healthConditions.some((c: string) => c.toLowerCase().includes('diabet'));
        }

        // update daily goals if provided
        if (profile.dailyCalorieGoal) {
          this.dailyGoals.calories = profile.dailyCalorieGoal;
        }
        if (profile.dailyWaterGoal) {
          this.dailyGoals.water = profile.dailyWaterGoal;
        }
        if (profile.dailyCarbLimit) {
          this.dailyGoals.carbs = profile.dailyCarbLimit;
        }
      }
    });
  }

  loadUserProfile(): void {
    const prefs = localStorage.getItem('userPreferences');
    if (prefs) {
      const data = JSON.parse(prefs);
      this.isDiabetic = data.isDiabetic || false;
      this.dailyGoals = { ...this.dailyGoals, ...data.goals };
    }

    // Also initialize from AiService if profile was already loaded there
    const aiProfile = this.aiService.getUserProfile();
    if (aiProfile) {
      // cache the profile locally
      this.userProfile = aiProfile;
      if (aiProfile.healthConditions && Array.isArray(aiProfile.healthConditions)) {
        this.isDiabetic = aiProfile.healthConditions.some((c: string) => c.toLowerCase().includes('diabet'));
      }
      if (aiProfile.dailyCalorieGoal) this.dailyGoals.calories = aiProfile.dailyCalorieGoal;
      if (aiProfile.dailyWaterGoal) this.dailyGoals.water = aiProfile.dailyWaterGoal;
      if (aiProfile.dailyCarbLimit) this.dailyGoals.carbs = aiProfile.dailyCarbLimit;
    }
  }

  loadTodayStats(): void {
    const today = new Date().toISOString().split('T')[0];

    this.mealService.getAllMeals().subscribe((meals: any) => {
      const todayMeals = meals.filter((m: any) =>
        m.date?.startsWith(today) || m.dateConsumed?.startsWith(today)
      );

      this.todayStats.meals = todayMeals.length;
      this.todayStats.calories = todayMeals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0);
      this.todayStats.carbs = todayMeals.reduce((sum: number, m: any) => sum + (m.carbs || 0), 0);
      this.todayStats.protein = todayMeals.reduce((sum: number, m: any) => sum + (m.protein || 0), 0);
    });

    this.waterService.getAllWaterIntakes().subscribe((logs: any) => {
      const todayLogs = logs.filter((l: any) => l.date?.startsWith(today));
      this.todayStats.water = todayLogs.reduce((sum: number, l: any) => sum + (l.amount || 0), 0);
    });
  }

  addWelcomeMessage(): void {
    const greeting = this.getGreeting();
    const diabeticNote = this.isDiabetic ? ' I see you have diabetic mode enabled - I\'ll help you monitor your carbs carefully.' : '';

    this.messages.push({
      role: 'assistant',
      content: `${greeting}! 🤖 I'm your smart nutrition assistant.${diabeticNote} How can I help you today?\n\nYou can:\n• Log meals naturally (just describe what you ate)\n• Ask for meal suggestions\n• Get nutrition insights\n• Track your progress\n• Use voice input 🎤`,
      timestamp: new Date()
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  initVoiceRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        this.userInput = event.results[0][0].transcript;
        this.isListening = false;
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  toggleVoiceInput(): void {
    if (!this.recognition) {
      alert('Voice input not supported in your browser');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      this.recognition.start();
      this.isListening = true;
    }
  }

  sendMessage(): void {
    if (!this.userInput.trim() || this.isProcessing) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: this.userInput,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    const input = this.userInput;
    this.userInput = '';
    this.isProcessing = true;

    this.scrollToBottom();

    // Process the message with AI
    this.processUserMessage(input);
  }

  processUserMessage(message: string): void {
    const lowerMsg = message.toLowerCase();

    // Detect intent
    if (lowerMsg.includes('ate') || lowerMsg.includes('had') || lowerMsg.includes('meal') ||
        lowerMsg.includes('food') || lowerMsg.includes('breakfast') || lowerMsg.includes('lunch') ||
        lowerMsg.includes('dinner')) {
      this.handleMealLog(message);
    } else if (lowerMsg.includes('water') || lowerMsg.includes('drink') || lowerMsg.includes('glass')) {
      this.handleWaterLog(message);
    } else if (lowerMsg.includes('suggest') || lowerMsg.includes('recommend') ||
               lowerMsg.includes('meal plan') || lowerMsg.includes('what should i eat')) {
      this.handleMealSuggestion();
    } else if (lowerMsg.includes('report') || lowerMsg.includes('progress') ||
               lowerMsg.includes('stats') || lowerMsg.includes('how am i doing')) {
      this.handleReport();
    } else {
      this.handleGeneralChat(message);
    }
  }

  handleMealLog(description: string): void {
    this.enhancedAi.smartMealLog(description, this.isDiabetic, this.userProfile).subscribe(
      result => {
        // Log the meal
        const mealData: any = {
          name: result.name,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fats: result.fats,
          date: new Date().toISOString()
        };

        this.mealService.createMeal(mealData).subscribe(
          () => {
            let response = `✅ Logged: **${result.name}**\n\n`;
            response += `📊 Nutrition:\n`;
            response += `• Calories: ${result.calories}\n`;
            response += `• Protein: ${result.protein}g\n`;
            response += `• Carbs: ${result.carbs}g\n`;
            response += `• Fats: ${result.fats}g\n`;

            if (this.isDiabetic && result.netCarbs) {
              response += `• Net Carbs: ${result.netCarbs}g\n`;
              response += `• Glycemic Load: ${result.glycemicLoad}\n`;

              if (result.diabeticWarning) {
                response += `\n⚠️ ${result.diabeticWarning}`;
              }
            }

            response += `\nHealth Score: ${result.healthScore}/100`;

            this.addAssistantMessage(response);
            this.loadTodayStats(); // Refresh stats
          },
          (_error: any) => {
            this.addAssistantMessage('❌ Failed to log meal. Please try again.');
          }
        );

        this.isProcessing = false;
      },
      (_error: any) => {
        this.addAssistantMessage('❌ AI meal analysis failed. Please describe your meal differently.');
        this.isProcessing = false;
      }
    );
  }

  handleWaterLog(message: string): void {
    // Extract amount
    const match = message.match(/(\d+)/);
    const amount = match ? parseInt(match[0]) * 250 : 250; // Default 250ml or extract number

    this.waterService.addWaterIntake({ amount, date: new Date().toISOString() }).subscribe(
      () => {
        this.addAssistantMessage(`💧 Added ${amount}ml of water! Great job staying hydrated!`);
        this.loadTodayStats();
        this.isProcessing = false;
      },
      (_error: any) => {
        this.addAssistantMessage('❌ Failed to log water. Please try again.');
        this.isProcessing = false;
      }
    );
  }

  handleMealSuggestion(): void {
    const remainingCarbs = this.isDiabetic ? Math.max(0, this.dailyGoals.carbs - this.todayStats.carbs) : 50;

    this.enhancedAi.getDiabeticMeals(remainingCarbs, this.userProfile).subscribe(
      result => {
        if (result.meals && result.meals.length > 0) {
          let response = this.isDiabetic
            ? `🍽️ Here are diabetic-friendly meal suggestions (you have ${remainingCarbs}g carbs remaining):\n\n`
            : `🍽️ Here are some healthy meal suggestions:\n\n`;

          result.meals.slice(0, 3).forEach((meal: any, index: number) => {
            response += `**${index + 1}. ${meal.name}**\n`;
            response += `   • Net Carbs: ${meal.netCarbs}g\n`;
            response += `   • Protein: ${meal.protein}g\n`;
            if (meal.diabeticScore) {
              response += `   • Diabetic Score: ${meal.diabeticScore}/100\n`;
            }
            response += `\n`;
          });

          this.addAssistantMessage(response);
        } else {
          this.addAssistantMessage('🍽️ Try meals rich in protein and vegetables, with moderate healthy fats.');
        }
        this.isProcessing = false;
      },
      () => {
        this.addAssistantMessage('❌ Failed to get meal suggestions. Please try again.');
        this.isProcessing = false;
      }
    );
  }

  handleReport(): void {
    // Ask the enhanced AI to analyze today's data using the saved user profile
    // Flatten the payload so the backend receives top-level numeric fields it expects
    const userData: any = {
      calories: this.todayStats.calories || 0,
      carbs: this.todayStats.carbs || 0,
      protein: this.todayStats.protein || 0,
      water: this.todayStats.water || 0,
      meals: this.todayStats.meals || 0,
      // merge profile keys at top-level so agent gets full context
      ...(this.userProfile || {})
    };

    this.enhancedAi.quickAnalyze(userData, this.isDiabetic, this.userProfile).subscribe(
       (result) => {
         if (result?.success) {
           let report = `📊 **AI Summary Report**\n\n`;
           report += `• Health Score: ${result.healthScore ?? 'N/A'}/100\n`;
           if (result.topAlert) report += `• Top Alert: ${result.topAlert}\n`;
           if (result.quickTip) report += `• Tip: ${result.quickTip}\n`;
           if (result.carbsWarning) report += `• Carb Warning: ${result.carbsWarning}\n`;
           this.addAssistantMessage(report);
         } else {
          // Fallback to local report generation
          const caloriesPercent = Math.round((this.todayStats.calories / this.dailyGoals.calories) * 100);
          const waterPercent = Math.round((this.todayStats.water / this.dailyGoals.water) * 100);
          const carbsPercent = Math.round((this.todayStats.carbs / this.dailyGoals.carbs) * 100);

          let report = `📊 **Today's Progress Report**\n\n`;
          report += `🍽️ **Meals:** ${this.todayStats.meals} logged\n\n`;
          report += `🔥 **Calories:** ${this.todayStats.calories}/${this.dailyGoals.calories} (${caloriesPercent}%)\n`;
          report += `🍞 **Carbs:** ${this.todayStats.carbs}/${this.dailyGoals.carbs}g (${carbsPercent}%)\n`;
          report += `💪 **Protein:** ${this.todayStats.protein}/${this.dailyGoals.protein}g\n`;
          report += `💧 **Water:** ${this.todayStats.water}/${this.dailyGoals.water}ml (${waterPercent}%)\n\n`;

          if (this.isDiabetic) {
            if (carbsPercent > 100) {
              report += `⚠️ **Alert:** You've exceeded your daily carb limit. Focus on low-carb options.\n`;
            } else if (carbsPercent > 80) {
              report += `⚠️ **Caution:** You're approaching your carb limit for today.\n`;
            } else {
              report += `✅ **Great:** Your carb intake is well managed today!\n`;
            }
          }

          if (waterPercent < 50) {
            report += `💧 **Reminder:** Drink more water to stay hydrated!\n`;
          }

          this.addAssistantMessage(report);
        }
        this.isProcessing = false;
      },
      (err) => {
        console.error('Quick analyze failed:', err);
        this.addAssistantMessage('❌ AI analysis failed. Showing local summary instead.');
        // fallback local summary
        const caloriesPercent = Math.round((this.todayStats.calories / this.dailyGoals.calories) * 100);
        const waterPercent = Math.round((this.todayStats.water / this.dailyGoals.water) * 100);
        const carbsPercent = Math.round((this.todayStats.carbs / this.dailyGoals.carbs) * 100);

        let report = `📊 **Today's Progress Report**\n\n`;
        report += `🍽️ **Meals:** ${this.todayStats.meals} logged\n\n`;
        report += `🔥 **Calories:** ${this.todayStats.calories}/${this.dailyGoals.calories} (${caloriesPercent}%)\n`;
        report += `🍞 **Carbs:** ${this.todayStats.carbs}/${this.dailyGoals.carbs}g (${carbsPercent}%)\n`;
        report += `💪 **Protein:** ${this.todayStats.protein}/${this.dailyGoals.protein}g\n`;
        report += `💧 **Water:** ${this.todayStats.water}/${this.dailyGoals.water}ml (${waterPercent}%)\n\n`;

        if (this.isDiabetic) {
          if (carbsPercent > 100) {
            report += `⚠️ **Alert:** You've exceeded your daily carb limit. Focus on low-carb options.\n`;
          } else if (carbsPercent > 80) {
            report += `⚠️ **Caution:** You're approaching your carb limit for today.\n`;
          } else {
            report += `✅ **Great:** Your carb intake is well managed today!\n`;
          }
        }

        if (waterPercent < 50) {
          report += `💧 **Reminder:** Drink more water to stay hydrated!\n`;
        }

        this.addAssistantMessage(report);
        this.isProcessing = false;
      }
    );
  }

  handleGeneralChat(message: string): void {
    // Simple responses for common queries
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('help')) {
      this.addAssistantMessage('I can help you with:\n• Logging meals (just say "I ate...")\n• Tracking water intake\n• Getting meal suggestions\n• Viewing your progress\n• Health tips and advice');
    } else if (lowerMsg.includes('thank')) {
      this.addAssistantMessage('You\'re welcome! Keep up the great work with your nutrition tracking! 💪');
    } else {
      this.addAssistantMessage('I\'m here to help with your nutrition tracking! Try asking me to log a meal, suggest foods, or show your progress.');
    }

    this.isProcessing = false;
  }

  handleQuickAction(action: string): void {
    switch(action) {
      case 'log-meal':
        this.userInput = 'I want to log a meal';
        break;
      case 'add-water':
        this.handleWaterLog('1 glass');
        return;
      case 'report':
        this.handleReport();
        return;
      case 'meal-plan':
        this.handleMealSuggestion();
        return;
      case 'health-check':
        this.handleReport();
        return;
    }
  }

  addAssistantMessage(content: string): void {
    this.messages.push({
      role: 'assistant',
      content,
      timestamp: new Date()
    });
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  clearChat(): void {
    if (confirm('Clear chat history?')) {
      this.messages = [];
      this.addWelcomeMessage();
    }
  }

  formatMessage(content: string): string {
    // Convert markdown-style formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }
}
