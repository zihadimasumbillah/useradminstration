# User Administration System - Frontend

A modern, responsive user management interface built with Next.js. This frontend application provides a secure platform for user registration, authentication, and administration with advanced activity tracking capabilities.

## Table of Contents
- Features
- Tech Stack
- Getting Started
- Project Structure
- Pages & Components
- Authentication Flow
- User Management Interface
- Activity Visualization
- Deployment
- Contributing

## Features

- **Authentication Interface**
  - Secure registration and login forms
  - Status notifications for account status
  - Offline mode support
  - Form validation

- **User Management Dashboard**
  - View and search users with pagination
  - Block/unblock user accounts
  - Delete user accounts with confirmation
  - Sort and filter functionality

- **Activity Visualization**
  - Interactive activity charts
  - Visual user status indicators
  - Time-based activity patterns
  - "Last seen" status display

- **Responsive UI**
  - Modern authentication forms with animations
  - Dark/light mode support
  - Mobile-friendly adaptive design
  - Interactive loading states

- **Advanced Features**
  - Error boundaries for fault tolerance
  - Network status detection
  - Optimistic UI updates
  - Debounced search

## Tech Stack

- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animation**: Framer Motion
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Theming**: next-themes
- **Form Handling**: React Hook Form

## Getting Started

### Prerequisites
- Node.js (>=18.x)
- npm or yarn
- Backend API (see separate backend repository)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd user-administration-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

4. Update the `.env.local` file with your API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
frontend/
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js application routes
│   │   ├── admin/         # Admin dashboard
│   │   ├── auth/          # Authentication pages
│   │   └── ...
│   ├── components/        # Reusable components
│   │   ├── ActivityUtils/ # Activity tracking components
│   │   ├── Notification/  # Toast notification system
│   │   └── ...
│   ├── config/            # Configuration (Axios setup, etc.)
│   ├── context/           # React Context providers
│   │   ├── AuthContext.tsx # Authentication context
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   │   ├── useClickOutside.ts
│   │   └── ...
│   └── types/             # TypeScript type definitions
│       ├── user.ts        # User interface definitions
│       └── ...
└── ...
```

## Pages & Components

### Main Pages
- **Auth Page (`/auth`)**: Combined login/registration interface
- **Admin Dashboard (`/admin`)**: User management interface 

### Key Components
- **AuthForm**: Handles both login and registration flows
- **UserTable**: Displays user data with sorting and filtering
- **ActivityBarChart**: Visualizes user activity patterns
- **TimeDisplay**: Shows user status and last seen time
- **Notification**: Toast notification system
- **FilterDropdown**: Advanced filtering options for users

## Authentication Flow

The frontend uses JWT for authentication with the following flow:

1. User enters credentials in the login form or registers a new account
2. Credentials are sent to the API endpoint
3. On successful authentication, the JWT token is stored in localStorage
4. AuthContext provider maintains the authentication state
5. Protected routes redirect unauthenticated users to login
6. Automatic token validation on app startup

## User Management Interface

The admin dashboard provides several features:

- **Table/Card Views**: Switch between table and card layouts
- **Search**: Find users by name or email with debounced input
- **Bulk Actions**: Select multiple users for actions
- **Responsive Design**: Optimized for mobile and desktop
- **Pagination**: Navigate through user records efficiently

## Activity Visualization

User activity is presented through:

- **Activity Charts**: Visualize patterns over time
- **Status Indicators**: Show online/away/offline status
- **Time Displays**: Show relative and absolute times
- **Activity Metrics**: Display engagement statistics

## Deployment

### Vercel Deployment

The frontend is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
3. Deploy the application

### Environment Setup

For production deployment, ensure these environment variables are set:

```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

Make sure your backend has CORS configured to allow requests from your frontend domain.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

