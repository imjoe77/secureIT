# SecureIT: Zero-Trust Defense Infrastructure Briefing

## 1. Core Mission
SecureIT is a high-assurance, multi-tenant SaaS platform designed to prevent data leakage and session hijacking in sensitive operational environments. It moves beyond standard authentication into a **Hardware-Bound Zero-Trust** model.

## 2. Authentication & Session Integrity
- **Triple-Factor Binding**: Every session is tied to (1) User Credentials, (2) Source IP, and (3) Hardware Fingerprint (Canvas/WebGL/Platform hash).
- **JWT Lock**: The `tenant_id` and `fingerprint_hash` are baked into the JWT. They are immutable once signed.
- **Session Split Detection**: If a request arrives with a valid JWT but a non-matching hardware fingerprint, the system identifies a "Session Hijack" attempt and revokes access immediately.

## 3. Multi-Tenant Isolation (MTI)
- **Data Partitioning**: The database uses a strict `tenant_id` schema for every table (Documents, Users, Roles, Audit Logs).
- **Query Scoping**: Backend logic enforces mandatory tenant filtering. No query ever searches the "global" space; every `SELECT` is scoped to the user's specific organization.
- **Cross-Tenant Blocking**: The Admin Panel prevents cross-tenant discovery. Admins can only see and manage personnel within their own organization.

## 4. Permission Escalation Firewall
- **Graph-Based RBAC**: Permissions are not static. The system uses a **PermissionGraph (BFS/DFS)** to calculate inherited rights through the command hierarchy (e.g., Brigadier inherits from Colonel).
- **Predictive Simulation**: Admins can run "What-If" simulations to see the security impact of a role grant before applying it.
- **Isolation of Chains**: Role inheritance chains are tenant-locked. A "General" in one tenant has zero authority over another tenant.

## 5. Horizontal & Delegated Access
- **Ownership Verification**: Standard users can only see documents where `owner_id = current_user_id`.
- **Whitelisted Sharing**: Access to another user's private data requires an explicit "Share" entry in the `document_shares` table, created by an authorized Admin.
- **Tenant-Validation on Share**: The sharing engine verifies that both the document and the recipient user belong to the same tenant before allowing the delegation.

## 6. Audit & Forensic Intelligence
- **Isolated Audit Trails**: Logs are filtered by `tenant_id`. Admins only see activity for their own organization.
- **Real-Time Polling**: The frontend dashboard monitors the audit log for `SESSION_SPLIT` or `UNAUTHORIZED_ACCESS` events, triggering immediate UI alerts.

## 7. Technical Stack
- **Backend**: Node.js, Express, SQLite (better-sqlite3).
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion (premium aesthetics).
- **Security**: JWT (Hardware-Bound), FingerprintJS/Custom Canvas, Bcrypt.

## 8. Maintenance & Operations
- **Seed Script**: `src/database/seed.js` handles full environment resets with realistic multi-tenant data.
- **Connection**: Managed via `src/database/connection.js` (Singleton pattern).
- **Middlewares**: `src/middleware/auth.js` (Session Guard) and `src/middleware/firewall.js` (Permission Guard).
