# Firebase Setup Guide for Carbon Sentinel

## 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Enter project name: "Carbon Sentinel" (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable these sign-in methods:
   - **Email/Password**: Click "Email/Password" → Enable → Save
   - (Optional) Google, GitHub for social login

## 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **production mode**
4. Choose your region (preferably closest to Kenya: `europe-west1` or `us-central1`)
5. Click "Enable"

## 4. Set up Security Rules

In Firestore Database → Rules, replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user has council role
    function isCouncil() {
      return isSignedIn() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(['council']);
    }
    
    // User documents
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && request.auth.uid == userId;
      
      // Council memberships subcollection
      match /councilMemberships/{membershipId} {
        allow read: if isSignedIn();
        allow write: if isSignedIn() && request.auth.uid == userId;
      }
    }
    
    // Reports
    match /reports/{reportId} {
      allow read: if isSignedIn();
      
      allow create: if isSignedIn() && 
        request.resource.data.userId == request.auth.uid;
      
      allow update: if isSignedIn() && (
        // Report owner can update their own reports
        resource.data.userId == request.auth.uid ||
        // Council members can update any report
        isCouncil()
      );
      
      allow delete: if isSignedIn() && (
        resource.data.userId == request.auth.uid ||
        isCouncil()
      );
      
      // Report images subcollection
      match /images/{imageId} {
        allow read: if isSignedIn();
        allow write: if isSignedIn();
      }
      
      // Report status history subcollection
      match /reportStatusHistory/{historyId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn();
      }
      
      // Report comments subcollection
      match /reportComments/{commentId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn();
        allow update: if isSignedIn() && 
          (resource.data.authorId == request.auth.uid || isCouncil());
      }
    }
    
    // Locations (read-only for users)
    match /locations/{locationId} {
      allow read: if isSignedIn();
      allow write: if false; // Only via admin SDK
    }
    
    // CO2 data (read-only for users)
    match /co2_data/{dataId} {
      allow read: if isSignedIn();
      allow write: if false; // Only via admin SDK
    }
  }
}
```

Click "Publish" to apply the rules.

## 5. Enable Storage

1. Go to **Storage**
2. Click "Get started"
3. Start in **production mode**
4. Choose same region as Firestore
5. Click "Done"

## 6. Set up Storage Security Rules

In Storage → Rules, replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Reports images
    match /reports/{reportId}/images/{fileName} {
      // Anyone authenticated can read
      allow read: if request.auth != null;
      
      // Only authenticated users can write
      allow write: if request.auth != null;
      
      // Limit file size to 5MB
      allow write: if request.resource.size < 5 * 1024 * 1024;
      
      // Only allow image files
      allow write: if request.resource.contentType.matches('image/.*');
    }
  }
}
```

Click "Publish" to apply the rules.

## 7. Get Firebase Configuration

1. Go to **Project settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **</>** (Web) icon
4. Register app with nickname: "Carbon Sentinel Web"
5. Don't check "Set up Firebase Hosting"
6. Click "Register app"
7. Copy the `firebaseConfig` object values

## 8. Configure Environment Variables

Create a `.env` file in your project root:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Replace the values with those from step 7.

## 9. Testing Locally

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open http://localhost:3000 and test:
1. Sign up as citizen
2. Sign up as council member
3. Submit a report as citizen
4. View and manage reports as council

## 10. Deploy to GitHub Pages

### A. Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each of these secrets:
   - Name: `VITE_FIREBASE_API_KEY`, Value: (from step 7)
   - Name: `VITE_FIREBASE_AUTH_DOMAIN`, Value: (from step 7)
   - Name: `VITE_FIREBASE_PROJECT_ID`, Value: (from step 7)
   - Name: `VITE_FIREBASE_STORAGE_BUCKET`, Value: (from step 7)
   - Name: `VITE_FIREBASE_MESSAGING_SENDER_ID`, Value: (from step 7)
   - Name: `VITE_FIREBASE_APP_ID`, Value: (from step 7)

### B. Enable GitHub Pages

1. Go to repository Settings → Pages
2. Source: "GitHub Actions"
3. Save

### C. Deploy

```bash
git add .
git commit -m "Initial commit: Carbon Sentinel application"
git push origin main
```

GitHub Actions will automatically build and deploy your application.

## 11. Post-Deployment

1. Go to your repository → Actions to view deployment status
2. Once complete, visit the URL: `https://yourusername.github.io/carbon-sentinel`
3. Test all features in production

## Troubleshooting

### Authentication Issues
- Verify Email/Password is enabled in Firebase Authentication
- Check that Firebase config environment variables are correct

### Firestore Permission Denied
- Verify security rules are published
- Check that user document is created with `roles` array during sign-up

### Storage Upload Fails
- Verify Storage is enabled
- Check storage security rules are published
- Ensure file size is under 5MB
- Ensure file is an image type

### Map Not Loading
- Check internet connection (OpenStreetMap requires external access)
- Verify Leaflet CSS is loading in browser console

## Support

For additional help:
- Check browser console for error messages
- Review Firebase Console logs (Authentication, Firestore, Storage)
- Ensure all dependencies are installed: `pnpm install`
