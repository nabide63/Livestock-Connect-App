# Livestock Connect

A **mobile-first web app** for smallholder livestock farmers in the Busoga region, Uganda. Built with **HTML5, CSS3, and Vanilla JavaScript** (no frameworks). Optimized for low-end devices, slow connections, and users with limited digital literacy.

## Features

- **Welcome** – Register / Login
- **Dashboard** – Quick stats and links to My Livestock, Add Livestock, Market Prices, Health Tips, Reports, Profile
- **Add Livestock** – Record animal type, age, weight, health status, notes; optional photo upload
- **My Livestock** – List all records with Edit and Delete
- **Market Prices** – Mock UGX prices for Cow, Goat, Sheep, Poultry
- **Health Tips** – Simple advice cards (vaccinate, water, weight, separate sick animals, feed)
- **Reports** – Generate summary: total count, count by type, average weight
- **Profile** – User details and notifications; Logout
- **Offline** – Service worker caches static assets for basic offline use

## How to Run

1. **Local server (recommended)**  
   Serve the project from a folder (service worker and routing work best with HTTP):

   ```bash
   npx serve .
   # or: python -m http.server 8080
   # or: php -S localhost:8080
   ```

2. Open the URL shown (e.g. `http://localhost:3000`) in your browser.

3. **First use**  
   - Open the app → **Register** (Full Name, Phone, Farm Location, Livestock Type, Password).  
   - Then **Login** with the same phone and password.  
   - Data is stored in **localStorage** (no real backend).

## Project Structure

```
Livestock-Connect-App/
├── index.html          # Welcome (Register / Login)
├── login.html
├── register.html
├── dashboard.html
├── livestock.html
├── add-livestock.html
├── prices.html
├── health.html
├── reports.html
├── profile.html
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline)
├── css/
│   └── styles.css
├── js/
│   └── app.js
├── data/
│   └── mock-data.js
└── assets/
    ├── icons/
    └── images/
```

## Design

- **Mobile-first**, max content width 480px  
- **Large touch targets** (min 48px)  
- **Bottom navigation**: Home, Livestock, Add, Prices, Health  
- **Colors**: Primary green `#2E7D32`, secondary `#A5D6A7`, background `#F5F5F5`  
- **Simple language** and clear feedback messages  

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript  
- LocalStorage for users and livestock data  
- Mock data in `data/mock-data.js`  
- Optional PWA: `manifest.json` + `sw.js` for offline caching  

No build step required. Replace mock data and localStorage with your backend API when ready.
