/**
 * Livestock Connect - Mock Data
 * Simulates backend data for prototype. Replace with API calls in production.
 */

const MOCK_DATA = {
  /** Market prices in UGX - used on Prices page */
  marketPrices: [
    { type: 'Cow', price: 1200000, unit: 'UGX' },
    { type: 'Goat', price: 250000, unit: 'UGX' },
    { type: 'Sheep', price: 300000, unit: 'UGX' },
    { type: 'Poultry', price: 35000, unit: 'UGX' }
  ],

  /** Last updated date for prices display */
  pricesLastUpdated: '2025-03-15',

  /** Health tips - simple advice for farmers */
  healthTips: [
    {
      id: 1,
      icon: '💉',
      title: 'Vaccinate animals regularly',
      description: 'Keep your animals healthy by giving vaccines on time. Ask your vet for a schedule.'
    },
    {
      id: 2,
      icon: '💧',
      title: 'Provide clean drinking water',
      description: 'Animals need fresh, clean water every day. Change water often and keep containers clean.'
    },
    {
      id: 3,
      icon: '⚖️',
      title: 'Monitor animal weight weekly',
      description: 'Weigh your animals to see if they are growing well. Write down the numbers.'
    },
    {
      id: 4,
      icon: '🏠',
      title: 'Separate sick animals',
      description: 'When an animal is sick, keep it away from others so illness does not spread.'
    },
    {
      id: 5,
      icon: '🌿',
      title: 'Give good feed',
      description: 'Quality feed helps animals grow strong. Use clean feed and store it safely.'
    }
  ],

  /** Livestock types for dropdowns */
  livestockTypes: ['Cattle', 'Goats', 'Sheep', 'Poultry'],

  /** Health status options */
  healthStatusOptions: ['Healthy', 'Needs Checkup', 'Sick']
};
