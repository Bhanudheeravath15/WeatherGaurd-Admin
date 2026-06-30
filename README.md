# WeatherGuard Admin

A secure, invite-only weather alert system that connects a React-based administration dashboard to a NestJS modular backend and a Telegram notification bot.

This project is structured specifically with a focus on **modular architecture**, **type safety**, **separation of concerns**, and **clean data flow**.

---

## 🏗️ System Architecture & Design

### High-Level Component Flow

```
                 +-----------------------------------------+
                 |          React Admin Panel              |
                 | (Login / Request Access / Dashboard)    |
                 +-------------------+---------------------+
                                     |
                                     | HTTP Requests (JWT Bearer)
                                     v
                 +-----------------------------------------+
                 |            NestJS API Gateway           |
                 | (Auth, Admin, Telegram, Weather modules)|
                 +----+--------------+----------------+----+
                      |              |                |
         Read / Write |              | Polling        | Fetch Weather
                      v              v                v
                 +----+----+   +-----+----+    +------+------+
                 | MongoDB |   | Telegram |    | OpenWeather |
                 | Database|   | Bot API  |    | API (or Mock|
                 +---------+   +-----+----+    +-------------+
                                     |
                                     | Pushes Messages
                                     v
                               +-----+----+
                               | Telegram |
                               |   User   |
                               +----------+
```

### Database Schema (MongoDB / Mongoose)

We define two collections using Mongoose schemas:

#### 1. User Schema (`User`)
Stores profile information, authentication source, verification details, and linked Telegram credentials.
* `email` (String, required, unique, indexed): The user's registration email.
* `name` (String, required): Display name.
* `avatarUrl` (String, optional): Link to profile avatar.
* `role` (String, enum: `['USER', 'ADMIN']`, default: `'USER'`): Access permission role.
* `status` (String, enum: `['PENDING', 'APPROVED', 'REJECTED']`, default: `'PENDING'`): Account approval status.
* `provider` (String, enum: `['google', 'github']`): OAuth provider.
* `providerId` (String, required): External OAuth profile ID.
* `telegramChatId` (String, indexed, optional): The unique chat identifier used to send notifications to Telegram.
* `telegramUsername` (String, optional): The linked user's Telegram username.
* `telegramVerificationToken` (String, unique, sparse, indexed): Temporary token (e.g. `WG-123456`) used to securely pair a web session with a Telegram chat.

#### 2. WeatherAlertLog Schema (`WeatherAlertLog`)
Tracks the history of alerts sent to users for audit and statistics.
* `userId` (ObjectId, ref: `'User'`, required, indexed): Reference to the target user.
* `telegramChatId` (String, required): The destination Telegram chat.
* `status` (String, enum: `['SUCCESS', 'FAILED']`): Dispatch execution status.
* `weatherDetails` (Object, optional): JSON details of the weather conditions pushed.
* `sentAt` (Date, default: `Date.now`): Timestamp of dispatch.
* `errorMessage` (String, optional): Error message if the dispatch failed.

---

## 🔄 Data Flow (Securing "Approved-Only" Alerts)

To ensure that **only approved users** receive weather notifications, the system implements a strict multi-layer verification check.

### 1. The Onboarding & Linking Pipeline
1. **Social Registration:** A new user authenticates via Google/GitHub OAuth. The backend creates an account with status `PENDING` (unless they are the very first user, who is auto-granted `ADMIN` status to allow bootstrapping the portal).
2. **Access Page:** The user is locked to a `/request-access` view and cannot browse the `/dashboard`.
3. **Telegram Link Token:** The user clicks "Link Telegram". The NestJS backend generates a random `telegramVerificationToken` (e.g. `WG-483920`) and stores it in the user's DB document.
4. **Deep Linking:** The user is redirected to Telegram via `https://t.me/BotName?start=WG-483920`.
5. **Bot Handshake:** When the user clicks "Start", the Telegram bot retrieves the token, looks up the user with that token, and updates their `telegramChatId` and `telegramUsername`. It then clears the token.
6. **Vetting:** The Administrator views the user in the Dashboard's **Pending Approvals** tab and clicks "Approve". The backend updates the user's status to `APPROVED`.

### 2. Alert Dispatch Verification Loop
Whether alerts are triggered automatically by the hourly cron scheduler or manually by the Administrator:
1. **Query Filter:** The scheduler queries the database using a strict filter:
   ```typescript
   this.usersService.findAll({
     status: 'APPROVED',
     telegramChatId: { $exists: true, $ne: null }
   })
   ```
2. **Double-Check:** Any accounts where `status !== 'APPROVED'` or `telegramChatId` is missing are completely bypassed.
3. **Validation & Logging:** For each approved/connected account, the backend fetches weather coordinates, formats the message, dispatches it to Telegram, and records a log. If a user is later rejected or blocked by an admin (`status` changed to `REJECTED`), they immediately fall out of the query filter and receive no further alerts.

---

## 🛠️ Local Development Setup

The project is structured as a monorepo consisting of:
* `/api` - NestJS API backend
* `/admin` - Vite React Admin Panel frontend

### Prerequisites
* Node.js (v18+)
* MongoDB running locally (`mongodb://localhost:27017/weatherguard`) or a MongoDB Atlas URI.

---

### Step 1: Backend Setup (`/api`)

1. Navigate to the backend directory:
   ```bash
   cd api
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Configure the variables in `.env`:
   * `MONGODB_URI`: Link to your MongoDB instance (defaults to local).
   * `TELEGRAM_BOT_TOKEN`: Token obtained from `@BotFather`.
   * *Note: If `TELEGRAM_BOT_TOKEN` or social client IDs are left blank or configured with default placeholders, the application automatically enters **Mock Sandbox Mode**. You will still be able to simulate logins, simulate Telegram connections, and preview log alerts in the console without configuring real credentials!*
5. Build and start the backend:
   ```bash
   # Development watch mode
   npm run start:dev
   
   # Or production build & start
   npm run build
   npm run start
   ```
   The backend will run on `http://localhost:3000/api`.

---

### Step 2: Frontend Setup (`/admin`)

1. Navigate to the frontend directory:
   ```bash
   cd ../admin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

---

## 🧪 How to Evaluate / Test (No Keys Needed!)

We have built a custom **Sandbox Mode** to make evaluating this project simple, even if you don't want to set up Google/GitHub OAuth apps or create a Telegram Bot.

1. **First User = Admin:** Register any mock email (e.g. `admin@test.com`) on the login screen. Since the database is empty, this user becomes the **ADMIN** and is auto-approved. You will be redirected to the Dashboard.
2. **Register a User:** Log out or open a private window, go to `/login`, and enter a user email (e.g. `user@test.com`). They will be set to `PENDING` and land on the Request Access page.
3. **Simulate Telegram Connection:** On the user's Request Access page, look at **Method 2 (Link Simulator)**. Enter a mock username (e.g. `tester_bot`) and click **Link Simulator**. The interface will update to show Telegram is connected!
4. **Approve the User:** Log back in as the admin. You will see the user in the "Pending Approvals" list. Click **Approve**.
5. **Send Alerts:** In the admin dashboard, click the **Trigger Alert Dispatches** button. A green success banner will confirm the alerts were sent. You will see the dispatch logs populate in the "Recent Alert Logs" panel on the right side of the dashboard, and a simulation warning will log to the backend server terminal!
