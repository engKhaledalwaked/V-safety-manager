# Dashboard Login System Plan

## Overview

This plan adds a login system for the dashboard with two admin levels, using Firebase Realtime Database for authentication (not Firebase Auth).

## Requirements

1. **Two Admin Accounts**:
   - Admin: `dashboard@admin.com`
   - Super Admin: `dashboard@superadmin.com`

2. **Authentication via Firebase Realtime Database**:
   - Email and password stored in database
   - Password should be hashed for security
   - Easy to modify credentials directly in Firebase console

3. **Permission Levels**:
   - **Admin**: Can view users, send commands, view payments
   - **Super Admin**: All admin permissions + can delete users, clear data, manage blocked BINs

## Database Structure

Add to Firebase Realtime Database:

```json
{
  "adminUsers": {
    "admin_1": {
      "email": "dashboard@admin.com",
      "passwordHash": "hashed_password_here",
      "role": "admin",
      "createdAt": 1234567890,
      "lastLogin": 1234567890
    },
    "admin_2": {
      "email": "dashboard@superadmin.com",
      "passwordHash": "hashed_password_here",
      "role": "superadmin",
      "createdAt": 1234567890,
      "lastLogin": 1234567890
    }
  }
}
```

## Implementation Steps

### Step 1: Firebase Setup Required

**You need to do this in Firebase Console:**

1. Go to Firebase Console > Realtime Database
2. Add a new node called `adminUsers`
3. Add the admin users with this structure:

```json
{
  "adminUsers": {
    "admin_1": {
      "email": "dashboard@admin.com",
      "password": "your_password_here",
      "role": "admin"
    },
    "admin_2": {
      "email": "dashboard@superadmin.com", 
      "password": "your_password_here",
      "role": "superadmin"
    }
  }
}
```

4. Set Database Rules to protect admin data:

```json
{
  "rules": {
    "adminUsers": {
      ".read": true,
      ".write": false
    },
    "users": {
      ".read": true,
      ".write": true
    },
    "presence": {
      ".read": true,
      ".write": true
    },
    "commands": {
      ".read": true,
      ".write": true
    },
    "blockedBins": {
      ".read": true,
      ".write": true
    },
    "blockedUsers": {
      ".read": true,
      ".write": true
    }
  }
}
```

### Step 2: Create Login Page

Create new file: `dashboard/LoginPage.tsx`

```typescript
import React, { useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebaseConfig';

interface AdminUser {
  email: string;
  password: string;
  role: 'admin' | 'superadmin';
}

const LoginPage: React.FC<{ onLogin: (user: AdminUser) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Fetch admin users from database
    const adminRef = ref(db, 'adminUsers');
    onValue(adminRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users = Object.values(data) as AdminUser[];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          // Save to session storage
          sessionStorage.setItem('dashboardUser', JSON.stringify(user));
          onLogin(user);
        } else {
          setError('Invalid email or password');
        }
      } else {
        setError('No admin users found');
      }
      setLoading(false);
    }, { onlyOnce: true });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-xl shadow-xl w-96">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Dashboard Login</h2>
        
        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-gray-700 text-white rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 bg-gray-700 text-white rounded-lg mb-6 outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
```

### Step 3: Create Auth Context

Create new file: `contexts/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminUser {
  email: string;
  role: 'admin' | 'superadmin';
}

interface AuthContextType {
  user: AdminUser | null;
  login: (user: AdminUser) => void;
  logout: () => void;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Check session storage for existing session
    const savedUser = sessionStorage.getItem('dashboardUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (user: AdminUser) => {
    setUser(user);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('dashboardUser');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isSuperAdmin: user?.role === 'superadmin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Step 4: Create Protected Route

Create new file: `dashboard/ProtectedRoute.tsx`

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from './LoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireSuperAdmin }) => {
  const { user, isSuperAdmin } = useAuth();

  if (!user) {
    return <LoginPage onLogin={(user) => {}} />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <div className="text-white p-8 text-center">Access Denied - Super Admin Only</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```

### Step 5: Update App.tsx

Wrap dashboard route with AuthProvider and ProtectedRoute:

```typescript
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './dashboard/ProtectedRoute';

// In Routes:
<Route path="/dashboard" element={
  <AuthProvider>
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  </AuthProvider>
} />
```

### Step 6: Add Logout Button to Dashboard

Add logout button in DashboardPage header:

```typescript
import { useAuth } from '../contexts/AuthContext';

// In component:
const { user, logout, isSuperAdmin } = useAuth();

// In header:
<button
  onClick={logout}
  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
>
  Logout
</button>
```

### Step 7: Permission-Based Features

In DashboardPage, show/hide features based on role:

```typescript
// Only super admin can clear all data
{isSuperAdmin && (
  <button onClick={handleClearData}>Clear All Data</button>
)}

// Only super admin can delete users
{isSuperAdmin && (
  <button onClick={() => handleDeleteUser(user.ip)}>Delete User</button>
)}
```

## Files to Create

1. `dashboard/LoginPage.tsx` - Login form
2. `contexts/AuthContext.tsx` - Authentication context
3. `dashboard/ProtectedRoute.tsx` - Route protection

## Files to Modify

1. `App.tsx` - Add AuthProvider and ProtectedRoute
2. `dashboard/DashboardPage.tsx` - Add logout button and permission checks

## Firebase Setup Instructions

### What You Need to Do in Firebase Console:

1. **Open Firebase Console**: https://console.firebase.google.com

2. **Go to Realtime Database**

3. **Add Admin Users**:
   - Click on the `+` button to add a new node
   - Name it `adminUsers`
   - Add two children:

   ```
   adminUsers
   |-- admin_1
   |   |-- email: "dashboard@admin.com"
   |   |-- password: "your_desired_password"
   |   |-- role: "admin"
   |
   |-- admin_2
       |-- email: "dashboard@superadmin.com"
       |-- password: "your_desired_password"
       |-- role: "superadmin"
   ```

4. **Update Database Rules** (optional for security):
   - Go to Rules tab
   - Set appropriate read/write permissions

### To Change Password Later:

1. Open Firebase Console
2. Go to Realtime Database
3. Navigate to `adminUsers > admin_1` or `admin_2`
4. Update the `password` field
5. Click Save

## Permission Matrix

| Feature | Admin | Super Admin |
|---------|-------|-------------|
| View Users | Yes | Yes |
| Send Commands | Yes | Yes |
| View Payments | Yes | Yes |
| Block Users | Yes | Yes |
| Delete Users | No | Yes |
| Clear All Data | No | Yes |
| Manage Blocked BINs | No | Yes |
| Add/Remove Admin Users | No | Yes |

## Testing Checklist

- [ ] Add admin users to Firebase
- [ ] Test login with correct credentials
- [ ] Test login with wrong credentials
- [ ] Test logout functionality
- [ ] Test admin permissions
- [ ] Test super admin permissions
- [ ] Test session persistence (refresh page)
- [ ] Test protected route redirect