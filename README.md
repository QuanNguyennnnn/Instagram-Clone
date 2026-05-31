# Instagram Clone

A full-stack Instagram clone built with Node.js + Express (backend) and React + Vite (frontend).

## Tech Stack

### Backend
- **Runtime:** Node.js + Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (access token 15m + refresh token 7d, httpOnly cookie)
- **Real-time:** Socket.io
- **Queue:** BullMQ + Redis (email & AI moderation background jobs)
- **Media:** Cloudinary (image/video upload)
- **Email:** Nodemailer via SMTP (Mailtrap for dev, any SMTP for prod)
- **AI:** Google Gemini 1.5 Flash (caption generation + content moderation)

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS v4
- **State:** Zustand + persist middleware
- **HTTP:** Axios (auto token refresh on 401)
- **Forms:** React Hook Form + Zod validation
- **Real-time:** Socket.io client
- **Icons:** Lucide React

## Features

- Register / Login / Logout with JWT
- Email verification & password reset (via Mailtrap or SMTP)
- Create posts with images/videos (up to 10 files), privacy settings
- Feed (infinite scroll, cursor-based pagination)
- Explore / Saved / Profile pages
- Like, Comment, Reply, Delete
- Follow / Unfollow system
- Friend system (send request, accept, decline, suggestions)
- Real-time chat (Socket.io)
- Real-time notifications
- Search (users, posts, hashtags)
- AI caption generator (Google Gemini)
- AI content moderation (auto-hide harmful posts)
- Report system
- Admin dashboard

## Project Structure

```
instagram-clone/
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── config/    # DB, Redis, Socket, Cloudinary
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/    # 13 Mongoose models
│   │   ├── queues/    # BullMQ email & AI moderation
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── utils/
│   │   └── validators/
│   ├── .env.example
│   └── package.json
│
└── frontend/          # React + Vite SPA
    ├── src/
    │   ├── api/       # Axios API modules
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/
    │   ├── pages/
    │   ├── stores/    # Zustand stores
    │   └── App.jsx
    ├── .env.example
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional — email falls back to direct SMTP if unavailable)

### 1. Clone the repo
```bash
git clone https://github.com/QuanNguyennnnn/Instagram-Clone.git
cd Instagram-Clone
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env (see Environment Variables section)
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173` — API is proxied to `http://localhost:5000`.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description | Where to get |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | Local or [MongoDB Atlas](https://cloud.mongodb.com) |
| `JWT_SECRET` | Random string min 32 chars | Generate randomly |
| `JWT_REFRESH_SECRET` | Random string min 32 chars | Generate randomly |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | [cloudinary.com](https://cloudinary.com) Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Cloudinary Dashboard → Settings → Access Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Cloudinary Dashboard → Settings → Access Keys |
| `SMTP_HOST` | SMTP server host | [Mailtrap](https://mailtrap.io) (dev) or Gmail |
| `SMTP_PORT` | SMTP port (587) | Same as above |
| `SMTP_USER` | SMTP username | Mailtrap inbox → SMTP Settings |
| `SMTP_PASS` | SMTP password | Mailtrap inbox → SMTP Settings |
| `REDIS_HOST` | Redis host (optional) | Local Redis or Redis Cloud |
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://aistudio.google.com) (optional) |

### External Services Used

| Service | Purpose | Free Tier |
|---|---|---|
| **MongoDB** | Primary database | Local or Atlas 512MB free |
| **Cloudinary** | Image/video storage & CDN | 25GB storage, 25GB bandwidth/month |
| **Mailtrap** | Email sandbox for dev/testing | 1000 emails/month |
| **Redis** | Background job queue (optional) | Local or Redis Cloud 30MB free |
| **Google Gemini** | AI caption & moderation (optional) | Free tier available |

> **Note:** Redis and Gemini are optional. The app runs fully without them — emails fall back to direct SMTP, AI features are simply disabled.

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/verify-email/:token` | Verify email |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/posts/feed` | Get personalized feed |
| GET | `/api/posts/explore` | Get explore posts |
| POST | `/api/posts` | Create post (multipart) |
| POST | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/save` | Toggle save |
| GET | `/api/users/:username` | Get user profile |
| POST | `/api/users/:id/follow` | Toggle follow |
| GET | `/api/friends/requests` | Get friend requests |
| POST | `/api/friends/:id/request` | Send friend request |
| GET | `/api/messages/conversations` | Get conversations |
| GET | `/api/search` | Search users/posts/hashtags |
| GET | `/api/notifications` | Get notifications |
| POST | `/api/ai/caption` | Generate AI caption |
