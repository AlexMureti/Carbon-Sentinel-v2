# Carbon Sentinel

An enhanced environmental monitoring application for Kenya with Firebase integration, providing separate citizen and council interfaces for real-time environmental tracking and reporting.

## Features

### Citizen Interface (`/citizen`)
- Interactive map dashboard with waste site pinning
- GPS location capture for reports
- CO2 level visualization and monitoring
- Photo upload for waste site documentation
- Real-time report submission to councils
- View personal report history

### Council Interface (`/council`)
- Dashboard for reviewing citizen reports
- Report management and status tracking
- Action assignment and cleanup coordination
- Progress monitoring and analytics
- Real-time notification system
- Report approval and resolution workflow

### Shared Features
- Firebase Authentication with role-based access
- Real-time data synchronization via Firestore
- Image upload and storage via Firebase Storage
- Responsive design for mobile/desktop
- Alert system for urgent reports
- Environmental data integration (Open-Meteo, OpenAQ)

## Tech Stack

- **Frontend**: React 19 + Vite + JavaScript + JSX
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Maps**: Leaflet + React-Leaflet
- **APIs**: Open-Meteo for weather/air quality data

## Project Structure

```
src/
├── assets/components/
│   ├── CouncilDashboard.jsx    # Council interface
│   ├── LoginForm.jsx            # Authentication
│   ├── MapView.jsx              # Interactive map
│   ├── Navbar.jsx               # Navigation
│   ├── ReportForm.jsx           # Submit reports
│   └── ReportList.jsx           # View reports
├── services/
│   └── firebase.js              # Firebase config
├── App.jsx                      # Main app with routing
├── main.jsx                     # Entry point
├── App.css                      # App styles
└── index.css                    # Global styles
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and pnpm
- Firebase project with Firestore, Auth, and Storage enabled

### 1. Clone the repository

```bash
git clone <repository-url>
cd carbon-sentinel
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password, Google, GitHub)
3. Create a Firestore database
4. Enable Storage
5. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

6. Add your Firebase configuration to `.env`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Set up Firestore Security Rules

Apply the following security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Reports
    match /reports/{reportId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(['council']));
    }
  }
}
```

### 5. Set up Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{reportId}/images/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Run the development server

```bash
pnpm dev
```

The application will open at http://localhost:3000

## Development

### Building for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Deployment

### GitHub Pages

1. Add Firebase secrets to GitHub repository settings:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

2. Push to main branch - GitHub Actions will automatically deploy

### Other Platforms

The `dist` folder can be deployed to:
- Netlify
- Vercel
- Firebase Hosting
- Any static hosting service

## User Roles

- **Citizen**: Can submit and view their own reports
- **Council**: Can view all reports and update statuses

To create a council user, select "Council Member" during sign-up.

## Features in Detail

### Interactive Map
- OpenStreetMap tiles via Leaflet
- Real-time report markers
- GPS location capture
- Click to select location
- Environmental data overlay

### Environmental Data
- Real-time weather data (temperature, humidity, wind)
- Air quality metrics (PM2.5, PM10, CO, NO2)
- Data from Open-Meteo API

### Report Management
- Categories: Waste dumping, Air pollution, Water pollution, Vehicle emissions, Industrial emissions
- Severity levels: 1 (Low) to 4 (Critical)
- Status tracking: Draft, Submitted, In Review, Resolved, Archived
- Image attachments (up to 5 per report)

### Real-time Updates
- Firebase Firestore real-time listeners
- Instant status updates for council
- Live environmental data refresh

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- OpenStreetMap contributors
- Open-Meteo for weather and air quality data
- Firebase for backend services
- Leaflet for mapping functionality
