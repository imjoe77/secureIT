import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  FileText,
  Network,
  LogOut,
  Lock,
  Smartphone,
  Shield,
  Activity,
  History,
  GitBranch,
  Terminal,
  Settings,
  Cpu,
  Zap,
  Users
} from 'lucide-react';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import RequestAccess from './pages/RequestAccess';
import AuditLog from './pages/AuditLog';
import RoleGraph from './pages/RoleGraph';
import TechStack from './pages/TechStack';
import TrustedDevices from './pages/TrustedDevices';
import DocumentAccess from './pages/DocumentAccess';

// ═══════════════════════════════════════════════
//  SIDEBAR
// ═══════════════════════════════════════════════
const Sidebar = ({ user, isAdmin, onLogout }) => {
  const location = useLocation();
  
  const userLinks = [
    { name: 'OVERVIEW', path: '/dashboard', icon: LayoutDashboard },
    { name: 'MY PERMISSIONS', path: '/dashboard', icon: Shield },
    { name: 'REQUEST ACCESS', path: '/request', icon: Lock },
    { name: 'ROLE GRAPH', path: '/graph', icon: GitBranch },
    { name: 'AUDIT TRAIL', path: '/dashboard', icon: History },
  ];

  const adminLinks = [
    { name: 'SYSTEM OVERVIEW', path: '/admin/command', icon: Activity },
    { name: 'PERMISSION GRAPH', path: '/admin/graph', icon: GitBranch },
    { name: 'THREAT FEED', path: '/admin/command', icon: ShieldAlert },
    { name: 'AUDIT INTELLIGENCE', path: '/admin/logs', icon: FileText },
    { name: 'SECURE TERMINALS', path: '/admin/devices', icon: Smartphone },
    { name: 'DOCUMENT ACCESS', path: '/admin/docs', icon: FileText },
    { name: 'TECH INTEL', path: '/admin/tech', icon: Cpu },
    { name: 'SETTINGS', path: '/admin/command', icon: Settings },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <div className="w-[220px] h-screen bg-bg-surface border-r border-border flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-border">
        <div className="text-sm font-semibold tracking-tight uppercase text-primary">SECUREIT</div>
        <div className="text-[11px] font-mono text-secondary uppercase tracking-widest mt-1 truncate">
          {isAdmin ? 'STRATEGIC CMD' : user?.tenant?.name || 'OPERATIONS'}
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`flex items-center gap-3 px-6 py-2.5 text-[11px] font-semibold tracking-wider transition-all border-l-2 ${
              location.pathname === link.path 
                ? 'border-accent text-primary bg-bg-elevated' 
                : 'border-transparent text-secondary hover:text-primary hover:bg-bg-elevated'
            }`}
          >
            <link.icon size={14} className={location.pathname === link.path ? 'text-accent' : ''} />
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-bg-elevated p-3 rounded-sm space-y-2 font-mono text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted">OPERATOR</span>
            <span className="text-secondary uppercase">{user?.username || 'GUEST'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">CLEARANCE</span>
            <span className={isAdmin ? 'text-amber-secure font-bold' : 'text-secondary'}>
              {isAdmin ? 'ADMIN' : (localStorage.getItem('secureit_role') || 'SOLDIER').toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between gap-2 overflow-hidden">
            <span className="text-muted shrink-0">TENANT</span>
            <span className="text-secondary truncate">STRAT DEF CMD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">SESSION</span>
            <span className="text-secondary">a3f7...c91b</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">UPTIME</span>
            <span className="text-secondary">00:14:32</span>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full mt-4 flex items-center justify-center gap-2 text-[10px] font-semibold text-muted hover:text-red-secure transition-colors uppercase tracking-widest"
        >
          <LogOut size={12} />
          Terminate Session
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  TOP BAR
// ═══════════════════════════════════════════════
const TopBar = ({ isAdmin }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-10 border-b border-border flex items-center justify-between px-6 bg-bg-base sticky top-0 z-40">
      <div className="flex items-center gap-2 text-[11px] font-mono text-muted uppercase">
        <span>SECUREIT</span>
        <span>/</span>
        <span>STRATEGIC DEFENSE CMD</span>
        <span>/</span>
        <span className="text-secondary">OVERVIEW</span>
      </div>
      <div className="flex items-center gap-4">
        {isAdmin && (
          <div className="text-[10px] font-mono text-amber-secure uppercase tracking-widest mr-4">
            ADMIN CONSOLE · FULL SPECTRUM ACCESS
          </div>
        )}
        <div className="flex items-center gap-4 font-mono text-[12px] text-secondary">
          <span>{time.toLocaleTimeString('en-GB', { hour12: false })}</span>
          <div className="flex items-center gap-2">
            <div className="status-dot green pulse-dot" />
            <span className="text-[11px] uppercase tracking-widest text-muted">SYSTEM NOMINAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  ROUTE GUARDS
// ═══════════════════════════════════════════════
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('secureit_token');
  if (!token) return <Navigate to="/" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('secureit_token');
  const isAdmin = localStorage.getItem('secureit_admin');
  if (!token) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

// ═══════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════
function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('secureit_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('secureit_token');
    localStorage.removeItem('secureit_user');
    localStorage.removeItem('secureit_role');
    localStorage.removeItem('secureit_admin');
    setUser(null);
    window.location.href = '/';
  };

  const Layout = ({ children, isAdmin = false }) => (
    <div className="min-h-screen bg-bg-base flex selection:bg-accent selection:text-white">
      <Sidebar user={user} isAdmin={isAdmin} onLogout={handleLogout} />
      <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
        <TopBar isAdmin={isAdmin} />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen font-sans">
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Login Page */}
          <Route path="/login" element={<LoginPage setUser={setUser} />} />

          {/* ─── USER ROUTES ─── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard user={user} />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/request"
            element={
              <ProtectedRoute>
                <Layout>
                  <RequestAccess user={user} />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/graph"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleGraph />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ─── ADMIN ROUTES ─── */}
          <Route
            path="/admin/command"
            element={
              <AdminRoute>
                <Layout isAdmin={true}>
                  <AdminDashboard />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <AdminRoute>
                <Layout isAdmin={true}>
                  <AuditLog />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/graph"
            element={
              <AdminRoute>
                <Layout isAdmin={true}>
                  <RoleGraph />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tech"
            element={
              <AdminRoute>
                <Layout isAdmin={true}>
                  <TechStack />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/devices"
            element={
              <AdminRoute>
                <Layout isAdmin={true}>
                  <TrustedDevices />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/docs"
            element={
              <AdminRoute>
                <Layout isAdmin={true}>
                  <DocumentAccess />
                </Layout>
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
