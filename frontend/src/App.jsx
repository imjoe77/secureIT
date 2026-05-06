import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  FileText,
  Network,
  LogOut,
  Lock,
  Menu,
  X,
  Cpu,
  Crown,
  Smartphone
} from 'lucide-react';
import DefLanding from './pages/DefLanding';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import RequestAccess from './pages/RequestAccess';
import AuditLog from './pages/AuditLog';
import RoleGraph from './pages/RoleGraph';
import TechStack from './pages/TechStack';
import TrustedDevices from './pages/TrustedDevices';

// ═══════════════════════════════════════════════
//  USER NAVBAR — Personnel Operations
// ═══════════════════════════════════════════════
const UserNavbar = ({ user, onLogout }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Request Access', path: '/request', icon: Lock },
    { name: 'Role Graph', path: '/graph', icon: Network },
  ];

  return (
    <nav className="bg-defense-900/50 border-b border-slate-800 sticky top-0 z-50 px-6 py-4 mb-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-defense-primary rounded-xl flex items-center justify-center shadow-lg shadow-defense-primary/20">
            <ShieldAlert className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase tracking-wider">SecureIT</h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Personnel Operations</p>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                location.pathname === link.path ? 'text-defense-primary' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <link.icon size={16} />
              {link.name}
            </Link>
          ))}
          <div className="h-6 w-px bg-slate-800 mx-2" />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-black text-white uppercase tracking-tight">{user?.username}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{user?.tenant?.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-defense-red hover:bg-defense-red/5 rounded-xl transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-defense-900 border-b border-slate-800 py-4 flex flex-col gap-2 px-6">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                location.pathname === link.path ? 'bg-defense-primary/10 text-defense-primary' : 'text-slate-400'
              }`}
            >
              <link.icon size={20} />
              {link.name}
            </Link>
          ))}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 p-3 text-defense-red hover:bg-defense-red/10 rounded-xl"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

// ═══════════════════════════════════════════════
//  ADMIN NAVBAR — Strategic Command
// ═══════════════════════════════════════════════
const AdminNavbar = ({ user, onLogout }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: 'Command Center', path: '/admin/command', icon: ShieldAlert },
    { name: 'Audit Logs', path: '/admin/logs', icon: FileText },
    { name: 'Secure Terminals', path: '/admin/devices', icon: Smartphone },
    { name: 'Role Graph', path: '/admin/graph', icon: Network },
    { name: 'Tech Intel', path: '/admin/tech', icon: Cpu },
  ];

  return (
    <nav className="sticky top-0 z-50 px-6 py-4 mb-8 bg-defense-900 border-b border-amber-900/30">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shadow-lg border border-amber-500/20">
            <Crown className="text-amber-500" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase tracking-wider">SecureIT</h1>
            <p className="text-[9px] text-amber-500 uppercase tracking-widest font-black">Admin Command Center</p>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                location.pathname === link.path ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <link.icon size={16} />
              {link.name}
            </Link>
          ))}
          <div className="h-6 w-px bg-amber-900/30 mx-2" />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <Smartphone size={10} className="text-emerald-500" />
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Secure Terminal Verified</span>
                </div>
                <Crown size={12} className="text-amber-500 ml-1" />
                <p className="text-[10px] font-black text-amber-500 uppercase">Strategic HQ</p>
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{user?.tenant?.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-defense-red hover:bg-defense-red/5 rounded-xl transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-defense-900 border-b border-amber-900/30 py-4 flex flex-col gap-2 px-6">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                location.pathname === link.path ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400'
              }`}
            >
              <link.icon size={20} />
              {link.name}
            </Link>
          ))}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 p-3 text-defense-red hover:bg-defense-red/10 rounded-xl"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      )}
    </nav>
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

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          {/* Login Page */}
          <Route path="/" element={<DefLanding setUser={setUser} />} />

          {/* ─── USER ROUTES ─── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div className="pb-12">
                  <UserNavbar user={user} onLogout={handleLogout} />
                  <div className="max-w-7xl mx-auto px-6">
                    <Dashboard user={user} />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/request"
            element={
              <ProtectedRoute>
                <div className="pb-12">
                  <UserNavbar user={user} onLogout={handleLogout} />
                  <div className="max-w-7xl mx-auto px-6">
                    <RequestAccess user={user} />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/graph"
            element={
              <ProtectedRoute>
                <div className="pb-12">
                  <UserNavbar user={user} onLogout={handleLogout} />
                  <div className="max-w-7xl mx-auto px-6">
                    <RoleGraph />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* ─── ADMIN ROUTES ─── */}
          <Route
            path="/admin/command"
            element={
              <AdminRoute>
                <div className="pb-12">
                  <AdminNavbar user={user} onLogout={handleLogout} />
                  <div className="max-w-7xl mx-auto px-6">
                    <AdminDashboard />
                  </div>
                </div>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <AdminRoute>
                <div className="pb-12">
                  <AdminNavbar user={user} onLogout={handleLogout} />
                  <div className="max-w-7xl mx-auto px-6">
                    <AuditLog />
                  </div>
                </div>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/graph"
            element={
              <AdminRoute>
                <div className="pb-12">
                  <AdminNavbar user={user} onLogout={handleLogout} />
                  <div className="max-w-7xl mx-auto px-6">
                    <RoleGraph />
                  </div>
                </div>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tech"
            element={
              <AdminRoute>
                <div className="pb-12">
                  <AdminNavbar user={user} onLogout={handleLogout} />
                  <div className="max-w-7xl mx-auto px-6">
                    <TechStack />
                  </div>
                </div>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/devices"
            element={
              <AdminRoute>
                <div className="pb-12">
                  <AdminNavbar user={user} onLogout={handleLogout} />
                  <div className="max-w-7xl mx-auto px-6">
                    <TrustedDevices />
                  </div>
                </div>
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
