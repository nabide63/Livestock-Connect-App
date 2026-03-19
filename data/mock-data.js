/**
 * Livestock Connect - Mock Data & Resources
 * Mirrors the shape of real API data. Used for seeding localStorage and form options.
 */

const MOCK_DATA = {
  /** Market prices in UGX */
  marketPrices: [
    { type: 'Cow', price: 1200000, unit: 'UGX' },
    { type: 'Goat', price: 250000, unit: 'UGX' },
    { type: 'Sheep', price: 300000, unit: 'UGX' },
    { type: 'Hen', price: 35000, unit: 'UGX' },
    { type: 'Rabbits', price: 55000, unit: 'UGX' },
    { type: 'Pigs', price: 350000, unit: 'UGX' },
    { type: 'Ducks', price: 40000, unit: 'UGX' },
    { type: 'Turkeys', price: 90000, unit: 'UGX' },
    { type: 'Pigeons', price: 20000, unit: 'UGX' },
    { type: 'Guinea fowls', price: 40000, unit: 'UGX' }
  ],
  pricesLastUpdated: '2025-03-15',

  /** Health tips for farmers */
  healthTips: [
    { id: 1, icon: '💉', title: 'Vaccinate animals regularly', description: 'Keep your animals healthy by giving vaccines on time. Ask your vet for a schedule.' },
    { id: 2, icon: '💧', title: 'Provide clean water', description: 'Animals need fresh, clean water every day. Change water often and keep containers clean.' },
    { id: 3, icon: '⚖️', title: 'Monitor weight weekly', description: 'Weigh your animals to see if they are growing well. Write down the numbers.' },
    { id: 4, icon: '🏠', title: 'Separate sick animals', description: 'When an animal is sick, keep it away from others so illness does not spread.' }
  ],

  animalTypes: ['Cow', 'Goat', 'Sheep', 'Hen', 'Rabbits', 'Pigs', 'Ducks', 'Turkeys', 'Pigeons', 'Guinea fowls'],
  healthStatusOptions: ['Healthy', 'Needs Checkup', 'Sick'],

  /**
   * Mock users (farmers and buyers). Same shape as real API / register.
   * Password for all mock users: 1234
   */
  mockUsers: [
    { id: 'mock-farmer-1', fullName: 'James Okello', phone: '0772123456', location: 'Gulu', role: 'farmer', password: '1234', createdAt: '2025-01-10T08:00:00.000Z' },
    { id: 'mock-farmer-2', fullName: 'Mary Akello', phone: '0783234567', location: 'Lira', role: 'farmer', password: '1234', createdAt: '2025-01-12T09:00:00.000Z' },
    { id: 'mock-farmer-3', fullName: 'Peter Odongo', phone: '0754345678', location: 'Mbarara', role: 'farmer', password: '1234', createdAt: '2025-01-15T10:00:00.000Z' },
    { id: 'mock-farmer-4', fullName: 'Grace Atim', phone: '0765456789', location: 'Kampala', role: 'farmer', password: '1234', createdAt: '2025-01-18T11:00:00.000Z' },
    { id: 'mock-farmer-5', fullName: 'Joseph Mugisha', phone: '0776567890', location: 'Mbale', role: 'farmer', password: '1234', createdAt: '2025-01-20T12:00:00.000Z' },
    { id: 'mock-farmer-6', fullName: 'Sarah Nansubuga', phone: '0787678901', location: 'Jinja', role: 'farmer', password: '1234', createdAt: '2025-01-22T13:00:00.000Z' },
    { id: 'mock-farmer-7', fullName: 'David Kato', phone: '0758789012', location: 'Masaka', role: 'farmer', password: '1234', createdAt: '2025-01-25T14:00:00.000Z' },
    { id: 'mock-farmer-8', fullName: 'Alice Namukasa', phone: '0769890123', location: 'Fort Portal', role: 'farmer', password: '1234', createdAt: '2025-01-28T15:00:00.000Z' },
    { id: 'mock-farmer-9', fullName: 'Robert Ssebunya', phone: '0770901234', location: 'Hoima', role: 'farmer', password: '1234', createdAt: '2025-02-01T16:00:00.000Z' },
    { id: 'mock-farmer-10', fullName: 'Florence Nalwadda', phone: '0781012345', location: 'Soroti', role: 'farmer', password: '1234', createdAt: '2025-02-05T17:00:00.000Z' },
    { id: 'mock-buyer-1', fullName: 'Buyer John', phone: '0700000001', location: 'Kampala', role: 'buyer', password: '1234', createdAt: '2025-02-10T18:00:00.000Z' },
    { id: 'mock-buyer-2', fullName: 'Buyer Jane', phone: '0700000002', location: 'Entebbe', role: 'buyer', password: '1234', createdAt: '2025-02-12T19:00:00.000Z' }
  ],

  /**
   * Mock listings. Same shape as real API / addListing. Many entries for a full marketplace.
   */
  mockListings: (function () {
    const farmers = ['mock-farmer-1', 'mock-farmer-2', 'mock-farmer-3', 'mock-farmer-4', 'mock-farmer-5', 'mock-farmer-6', 'mock-farmer-7', 'mock-farmer-8', 'mock-farmer-9', 'mock-farmer-10'];
    const locations = ['Gulu', 'Lira', 'Mbarara', 'Kampala', 'Mbale', 'Jinja', 'Masaka', 'Fort Portal', 'Hoima', 'Soroti', 'Ntungamo', 'Kasese', 'Arua', 'Masindi', 'Kabale'];
    const types = ['Cow', 'Goat', 'Sheep', 'Hen', 'Rabbits', 'Pigs', 'Ducks', 'Turkeys', 'Pigeons', 'Guinea fowls'];
    const smallFowlTypes = ['Hen', 'Ducks', 'Turkeys', 'Pigeons', 'Guinea fowls'];
    const health = ['Healthy', 'Healthy', 'Healthy', 'Needs Checkup', 'Sick'];
    const descriptions = [
      'Strong and well fed. Good for breeding.',
      'Vaccinated. Raised on open pasture.',
      'Healthy animal. Reason for sale: reducing herd.',
      'Friendly and easy to handle.',
      'Suitable for dairy / meat.',
      'Local breed. Good growth.',
      '',
      'Recently checked by vet.',
      'Weaned and ready.'
    ];
    const list = [];
    const now = Date.now();
    for (let i = 0; i < 52; i++) {
      const type = types[i % types.length];
      const isSmallFowl = smallFowlTypes.indexOf(type) !== -1;
      let basePrice;
      if (type === 'Cow') basePrice = 900000 + (i % 6) * 150000;
      else if (type === 'Goat') basePrice = 200000 + (i % 5) * 50000;
      else if (type === 'Sheep') basePrice = 250000 + (i % 4) * 25000;
      else if (type === 'Pigs') basePrice = 320000 + (i % 8) * 40000;
      else if (type === 'Rabbits') basePrice = 55000 + (i % 5) * 12000;
      else if (isSmallFowl) basePrice = 25000 + (i % 3) * 5000;
      else basePrice = 25000 + (i % 3) * 5000;
      let weight;
      if (type === 'Cow') weight = 280 + (i % 12) * 25;
      else if (type === 'Pigs') weight = 50 + (i % 18) * 5;
      else if (type === 'Rabbits') weight = 2 + (i % 8) * 0.4;
      else if (isSmallFowl) weight = 1.5 + (i % 5) * 0.5;
      else weight = 25 + (i % 15) * 5;
      let age;
      if (type === 'Cow') age = (1 + (i % 8)) + ' years';
      else if (type === 'Pigs') age = (4 + (i % 14)) + ' months';
      else if (type === 'Rabbits') age = (3 + (i % 9)) + ' months';
      else if (isSmallFowl) age = (3 + (i % 8)) + ' months';
      else age = (1 + (i % 4)) + ' years';
      list.push({
        id: 'mock-listing-' + (i + 1),
        userId: farmers[i % farmers.length],
        animalType: type,
        age: age,
        weight: String(weight),
        price: String(basePrice),
        healthStatus: health[i % health.length],
        location: locations[i % locations.length],
        description: descriptions[i % descriptions.length],
        imageData: null,
        createdAt: new Date(now - (i * 86400000 * 2)).toISOString()
      });
    }
    return list;
  })()
};
