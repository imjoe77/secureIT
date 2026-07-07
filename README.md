# ðŸ›¡ï¸ SecureIT: Multi-Tenant Permission Escalation Firewall

**SecureIT** is a defense-grade authorization system designed to prevent indirect privilege escalation in multi-tenant SaaS environments. It combines real-time graph analysis with zero-trust security protocols to ensure that personnel only hold the tactical access they are explicitly granted.

![SecureIT Dashboard Mockup](https://raw.githubusercontent.com/lucide-react/lucide/main/icons/shield-check.svg)

## ðŸš€ Key Features

- **Predictive Escalation Simulator**: Real-time graph analysis to identify "hidden" permission paths before they are exploited.
- **Zero-Trust Device Lockdown**: Restricts high-level command access (e.g., Brigadier role) to pre-registered, trusted hardware terminals via IP verification.
- **Multi-Tenant Isolation**: Hardened boundary enforcement to prevent cross-tenant data leaks and unauthorized access.
- **Unified Tactical Dashboard**: A sleek, professional interface for monitoring live alerts, managing role graphs, and auditing access logs.
- **Self-Seeding Database**: Automatically initializes with a military-grade operational environment (roles, users, and hierarchy).

## ðŸ› ï¸ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: Node.js, Express, Morgan (logging).
- **Database**: PostgreSQL (via `pg` connection pooling).
- **Security**: JWT Authentication, Bcrypt password hashing, IP-based Firewall rules.

---

## ðŸ“¥ Installation & Setup

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** running locally or hosted, with `DATABASE_URL` configured

### 2. Clone the Repository
```bash
git clone https://github.com/imjoe77/SecureIT.git
cd SecureIT
```

### 3. Configure PostgreSQL
Create a Postgres database and set `DATABASE_URL` in `.env`. The default local URL is:
```env
DATABASE_URL=postgresql://secureit:secureit_password@localhost:5432/secureit
```

### 4. Install Dependencies
This project uses a unified dependency management system. You can install all required packages (backend + frontend) with a single command from the root:
```bash
npm install && npm install --prefix frontend
```

---

## ðŸ’» Local Development

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

## ðŸ—ï¸ Production & Deployment

### Build the Project
Compiles the React frontend into static assets for the Node.js server to serve:
```bash
npm run build
```

### Database Initialization
Run `npm run db:setup` and `npm run db:seed` once against a new database. Do not put `db:setup` in the normal start command because it drops existing tables.

### Run in Production Mode
Starts the server and ensures the database schema exists:
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
   - `DATABASE_URL`: your hosted PostgreSQL connection string
   - `PGSSLMODE`: `require` or `no-verify` if your provider requires SSL
   - `CORS_ORIGIN`: your deployed frontend origin

---

## ðŸ“‚ Project Structure

```text
secureIT/
â”œâ”€â”€ src/                # Backend Source
â”‚   â”œâ”€â”€ database/       # PostgreSQL connection & seed scripts
â”‚   â”œâ”€â”€ engine/         # Permission Graph Logic
â”‚   â”œâ”€â”€ routes/         # API Endpoints
â”‚   â””â”€â”€ server.js       # Main Entry Point
â”œâ”€â”€ frontend/           # React App
â”‚   â”œâ”€â”€ src/            # Components, Pages, & Styles
â”‚   â””â”€â”€ vite.config.js  # Vite Configuration
â””â”€â”€ package.json        # Unified scripts & dependencies
```

## ðŸ“œ License
This project is developed for hackathon purposes and is licensed under the MIT License.
