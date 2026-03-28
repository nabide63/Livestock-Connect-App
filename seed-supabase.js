const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = process.cwd();
const configPaths = [
  path.join(root, 'data', 'data', 'config.js'),
  path.join(root, 'data', 'config.js'),
  path.join(root, '.env')
];

function loadConfig() {
  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) continue;
    const raw = fs.readFileSync(configPath, 'utf8');
    if (configPath.endsWith('.js')) {
      const urlMatch = raw.match(/supabaseUrl\s*:\s*['\"]([^'\"]+)['\"]/);
      const keyMatch = raw.match(/supabaseAnonKey\s*:\s*['\"]([^'\"]+)['\"]/);
      if (urlMatch && keyMatch) {
        return { url: urlMatch[1], key: keyMatch[1] };
      }
    } else if (configPath.endsWith('.env')) {
      const urlMatch = raw.match(/VITE_SUPABASE_URL\s*=\s*(.+)/);
      const keyMatch = raw.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.+)/);
      if (urlMatch && keyMatch) {
        return { url: urlMatch[1].trim(), key: keyMatch[1].trim() };
      }
    }
  }
  throw new Error('Could not load Supabase config from data/data/config.js, data/config.js, or .env');
}

function loadMockData() {
  const mockPath = path.join(root, 'data', 'mock-data.js');
  if (!fs.existsSync(mockPath)) {
    throw new Error('Could not find data/mock-data.js');
  }
  const raw = fs.readFileSync(mockPath, 'utf8');
  const code = raw.replace(/const\s+MOCK_DATA\s*=/, 'globalThis.MOCK_DATA =');
  const context = { globalThis: {}, console, process };
  vm.createContext(context);
  vm.runInContext(code, context);
  if (!context.globalThis.MOCK_DATA) {
    throw new Error('Failed to load MOCK_DATA from data/mock-data.js');
  }
  return context.globalThis.MOCK_DATA;
}

function createEmailFromPhone(phone) {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');
  return digits ? `${digits}@livestock.local` : raw;
}

async function request(url, options = {}) {
  const res = await fetch(url, options);
  let body = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch (err) {
    body = text;
  }
  return { status: res.status, body };
}

async function signIn(email, password, config) {
  const url = `${config.url}/auth/v1/token?grant_type=password`;
  const response = await request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.key,
      Authorization: `Bearer ${config.key}`
    },
    body: JSON.stringify({ email, password })
  });
  if (response.status === 200 && response.body && response.body.access_token) {
    return response.body;
  }
  return null;
}

async function signUp(email, password, config) {
  const url = `${config.url}/auth/v1/signup`;
  const response = await request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.key,
      Authorization: `Bearer ${config.key}`
    },
    body: JSON.stringify({ email, password })
  });
  if ((response.status === 200 || response.status === 201) && response.body) {
    return response.body;
  }
  return { error: response.body };
}

async function signUpOrSignIn(email, password, config) {
  const signedIn = await signIn(email, password, config);
  if (signedIn) {
    return signedIn;
  }

  const signedUp = await signUp(email, password, config);
  if (signedUp && signedUp.access_token) {
    return signedUp;
  }

  if (signedUp.error && signedUp.error.code === 400 && signedUp.error.error_code === 'invalid_credentials') {
    const retry = await signIn(email, password, config);
    if (retry) return retry;
  }

  throw new Error(`Unexpected signup response for ${email}: ${JSON.stringify(signedUp.error || signedUp)}`);
}

async function upsertRows(table, rows, token, config) {
  const url = `${config.url}/rest/v1/${table}?on_conflict=id`;
  const response = await request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.key,
      Authorization: `Bearer ${token}`,
      Prefer: 'return=minimal, resolution=merge-duplicates'
    },
    body: JSON.stringify(rows)
  });
  if (![200, 201, 204].includes(response.status)) {
    throw new Error(`Failed to upsert ${table}: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response;
}

(async () => {
  try {
    const config = loadConfig();
    const mockData = loadMockData();
    const userIdMap = {};

    if (!Array.isArray(mockData.mockUsers) || !Array.isArray(mockData.mockListings)) {
      throw new Error('Mock data is missing mockUsers or mockListings arrays');
    }

    for (const user of mockData.mockUsers) {
      const email = createEmailFromPhone(user.phone);
      console.log(`Processing user ${user.fullName} (${user.role}) -> ${email}`);
      const auth = await signUpOrSignIn(email, user.password, config);
      const token = auth.access_token;
      if (!token) throw new Error(`No token returned for ${email}`);
      const userId = auth.user?.id || auth?.data?.user?.id;
      if (!userId) {
        throw new Error(`No user id available for ${email}`);
      }
      userIdMap[user.id] = userId;
      await upsertRows('profiles', [{
        id: userId,
        full_name: user.fullName,
        phone: user.phone,
        location: user.location,
        role: user.role,
        created_at: user.createdAt
      }], token, config);
    }

    const listingsByUser = mockData.mockListings.reduce((acc, listing) => {
      acc[listing.userId] = acc[listing.userId] || [];
      acc[listing.userId].push(listing);
      return acc;
    }, {});

    for (const [mockUserId, listings] of Object.entries(listingsByUser)) {
      const mockUser = mockData.mockUsers.find((u) => u.id === mockUserId);
      if (!mockUser) continue;
      const realUserId = userIdMap[mockUserId];
      if (!realUserId) continue;
      const email = createEmailFromPhone(mockUser.phone);
      const auth = await signIn(email, mockUser.password, config);
      if (!auth) {
        throw new Error(`Could not sign in mock user ${email} to seed listings`);
      }
      const token = auth.access_token;
      const rows = listings.map((listing) => ({
        id: listing.id,
        user_id: realUserId,
        animal_type: listing.animalType,
        age: listing.age,
        weight: listing.weight,
        price: listing.price,
        health_status: listing.healthStatus,
        location: listing.location,
        description: listing.description,
        image_url: listing.imageData || listing.image_url || null,
        created_at: listing.createdAt
      }));
      await upsertRows('listings', rows, token, config);
    }

    console.log('Seed upload completed successfully.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
})();
