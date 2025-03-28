# User Administration System

A modern, comprehensive administration system for user management built with Next.js and Express.js. This system provides a secure platform for user registration, authentication, and administration with advanced activity tracking capabilities.

## Table of Contents
- Features
- Tech Stack
- Getting Started
- Project Structure
- Authentication
- User Management
- Activity Tracking
- API Documentation
- Deployment
- Contributing

## Features

- **Authentication System**
  - Secure registration and login
  - JWT-based authentication
  - Status tracking for blocked accounts
  - Offline mode support

- **User Management**
  - View and search users
  - Block/unblock user accounts
  - Delete user accounts
  - Sort and filter functionality

- **Activity Tracking**
  - Track user login times
  - Monitor user activity patterns
  - Visual activity representation
  - Last seen status

- **Responsive UI**
  - Modern authentication forms
  - Dark/light mode support
  - Mobile-friendly design
  - Interactive animations

- **Security**
  - Protected routes
  - Token validation
  - Session management
  - Error handling

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animation**: Framer Motion
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Theming**: next-themes

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT

## Getting Started

### Prerequisites
- Node.js (>=18.x)
- npm or yarn
- PostgreSQL

### Frontend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd user-administration/frontend
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

4. Update the .env.local file with your API URL:
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

### Backend Setup

1. Navigate to the backend directory:
```bash
cd ../backend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your database connection details and JWT secret.

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The API will be available at [http://localhost:4000](http://localhost:4000).

## Project Structure

### Frontend
```
frontend/
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js application routes
│   │   ├── admin/      # Admin panel
│   │   ├── auth/       # Authentication pages
│   │   └── ...
│   ├── components/     # Reusable components
│   ├── config/         # Configuration (Axios setup, etc.)
│   ├── context/        # React Context providers
│   ├── hooks/          # Custom React hooks
│   └── types/          # TypeScript type definitions
└── ...
```

### Backend
```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   └── types/          # TypeScript type definitions
└── ...
```

## Authentication

The application uses JWT (JSON Web Tokens) for authentication. The authentication flow is as follows:

1. User registers or logs in
2. Server validates credentials and returns a JWT token
3. Token is stored in localStorage and included in subsequent API requests
4. Protected routes verify the token before allowing access

### Auth Pages

- **Login**: Email and password authentication
- **Registration**: Create new account with name, email, and password
- **Logout**: Clear session and token

## User Management

The admin panel allows authorized users to:

- View all registered users
- Search users by name or email
- Filter users by status (active/blocked)
- Sort users by various attributes
- Block/unblock users
- Delete users from the system

## Activity Tracking

The system tracks user activity in several ways:

- Records login times
- Monitors session activity
- Generates visual activity patterns
- Displays "last seen" status for users

Activity data is visualized through interactive charts in the admin panel.

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register`: Register new user
- `POST /api/auth/login`: Login user
- `POST /api/auth/logout`: Logout user (requires auth)
- `POST /api/auth/update-activity`: Update user activity timestamp
- `GET /api/auth/validate`: Validate JWT token
- `GET /api/auth/ping`: Server status check with timezone info

### User Management Endpoints
- `GET /api/users`: Get all users (requires auth)
- `GET /api/users/activity`: Get aggregated user activity data
- `GET /api/users/activity/:userId`: Get specific user's activity pattern
- `POST /api/users/block`: Block selected users
- `POST /api/users/unblock`: Unblock selected users
- `POST /api/users/delete`: Delete selected users

## Deployment

### Frontend
The frontend can be deployed to Vercel with the following steps:

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy the application

### Backend
The backend can be deployed to any Node.js hosting service (Heroku, DigitalOcean, AWS, etc.). Make sure to:

1. Configure environment variables
2. Set up a production database
3. Configure CORS for your frontend domain

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

This project was bootstrapped with [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Similar code found with 2 license types