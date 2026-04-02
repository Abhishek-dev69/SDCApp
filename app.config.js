export default {
  expo: {
    ...require('./app.json').expo,
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://sdcapp-backend-456970553309.asia-south1.run.app'
    }
  }
};