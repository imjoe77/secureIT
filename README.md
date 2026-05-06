# 🛡️ SecureIT: Multi-Tenant Permission Escalation Firewall

**SecureIT** is a defense-grade authorization system designed to prevent indirect privilege escalation in multi-tenant SaaS environments. It combines real-time graph analysis with zero-trust security protocols to ensure that personnel only hold the tactical access they are explicitly granted.

![SecureIT Dashboard Mockup](https://raw.githubusercontent.com/lucide-react/lucide/main/icons/shield-check.svg)

## 🚀 Key Features

- **Predictive Escalation Simulator**: Real-time graph analysis to identify "hidden" permission paths before they are exploited.
- **Zero-Trust Device Lockdown**: Restricts high-level command access (e.g., Brigadier role) to pre-registered, trusted hardware terminals via IP verification.
- **Multi-Tenant Isolation**: Hardened boundary enforcement to prevent cross-tenant data leaks and unauthorized access.
- **Unified Tactical Dashboard**: A sleek, professional interface for monitoring live alerts, managing role graphs, and auditing access logs.
- **Self-Seeding Database**: Automatically initializes with a military-grade operational environment (roles, users, and hierarchy).

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: Node.js, Express, Morgan (logging).
- **Database**: SQLite (via `sql.js` for zero-config, portable deployment).
- **Security**: JWT Authentication, Bcrypt password hashing, IP-based Firewall rules.

---

## 📥 Installation & Setup

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

### 2. Clone the Repository
```bash
git clone https://github.com/imjoe77/SecureIT.git
cd SecureIT
```

### 3. Install Dependencies
This project uses a unified dependency management system. You can install all required packages (backend + frontend) with a single command from the root:
```bash
npm install && npm install --prefix frontend
```

---

## 💻 Local Development

To run the full tactical suite (Backend API + Frontend Dashboard) concurrently:
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

### Admin & User Credentials (Default Seed)
- **Admin**: `brigadier_user` / `password123`
- **Standard User**: `soldier_user` / `password123`

---

## 🏗️ Production & Deployment

### Build the Project
Compiles the React frontend into static assets for the Node.js server to serve:
```bash
npm run build
```

### Run in Production Mode
Starts the server and automatically initializes/seeds the database:
```bash
npm start
```

### Hosting on Render
SecureIT is optimized for single-service deployment on Render:
1. **Connect your repo** to a new Render **Web Service**.
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. **Environment Variables**:
   - `JWT_SECRET`: (Choose a secure key)
   - `JWT_EXPIRES_IN`: `24h`
   - `NODE_ENV`: `production`

---

## 📂 Project Structure

```text
secureIT/
├── src/                # Backend Source
│   ├── database/       # SQLite Connection & Seed Scripts
│   ├── engine/         # Permission Graph Logic
│   ├── routes/         # API Endpoints
│   └── server.js       # Main Entry Point
├── frontend/           # React App
│   ├── src/            # Components, Pages, & Styles
│   └── vite.config.js  # Vite Configuration
├── data/               # Persistent SQLite storage
└── package.json        # Unified scripts & dependencies
```

## 📜 License
This project is developed for hackathon purposes and is licensed under the MIT License.
