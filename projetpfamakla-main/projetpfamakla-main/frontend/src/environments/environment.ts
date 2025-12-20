export const environment = {
  production: false,
  // Use relative /api paths so the dev proxy (proxy.conf.json) can route requests and avoid CORS
  apiUrl: '/api', // route to gateway via proxy
  mealServiceUrl: '/api/meals',
  waterServiceUrl: '/api/water',
  // Gateway routing (kept for reference)
  gatewayUrl: 'http://localhost:8080/api',
  gatewayMealUrl: 'http://localhost:8080/api/meals',
  gatewayWaterUrl: 'http://localhost:8080/api/water',
  // AI Service: use relative path so proxy can route to gateway in dev
  aiServiceUrl: '/api',
  // Fallback mode when AI service is unavailable
  aiServiceFallback: true,
  // Enhanced local AI capabilities
  enableLocalAI: true
};
