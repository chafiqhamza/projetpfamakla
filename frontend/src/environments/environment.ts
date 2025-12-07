export const environment = {
  production: false,
  // Services directs fonctionnels (Meal et Water uniquement)
  apiUrl: 'http://localhost:8084/api', // Meal service direct par défaut
  mealServiceUrl: 'http://localhost:8084/api/meals',
  waterServiceUrl: 'http://localhost:8085/api/water',
  // Gateway routing (fonctionne pour Meal et Water)
  gatewayUrl: 'http://localhost:8080/api',
  gatewayMealUrl: 'http://localhost:8080/api/meals',
  gatewayWaterUrl: 'http://localhost:8080/api/water'
};

