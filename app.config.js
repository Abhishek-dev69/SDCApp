export default {
  expo: {
    ...require('./app.json').expo,
    extra: {
      eas: {
        projectId: 'e629b11b-6f86-4f4a-83ad-20f5f634c326',
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://sdcapp-backend-456970553309.asia-south1.run.app'
    }
  }
};