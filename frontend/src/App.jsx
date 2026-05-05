import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  FileText, 
  Network, 
  LogOut, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Menu, 
  X 
} from 'lucide-react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import RequestAccess from './pages/RequestAccess';
import AuditLog from './pages/AuditLog';
import RoleGraph from './pages/RoleGraph';
import SecurityAlerts from './pages/SecurityAlerts';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Request Access', path: '/request', icon: Lock },
    { name: 'Audit Logs', path: '/logs', icon: FileText },
    { name: 'Role Graph', path: '/graph', icon: Network },
    { name: 'Alerts', path: '/alerts', icon: ShieldAlert },
  ];

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 mb-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-defense-primary rounded-xl flex items-center justify-center shadow-lg shadow-defense-primary/30">
            <ShieldAlert className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">SecureIT</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Air Force Operations</p>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                location.pathname === link.path ? 'text-defense-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              <link.icon size={18} />
              {link.name}
            </Link>
          ))}
          <div className="h-6 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-white">{user?.username}</p>
              <p className="text-[10px] text-slate-500">{user?.tenant?.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-defense-red hover:bg-defense-red/10 rounded-lg transition-all"
            >
              <LogOut size={20} />
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
        <div className="md:hidden absolute top-full left-0 w-full glass border-t border-white/5 py-4 flex flex-col gap-2 px-6">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                location.pathname === link.path ? 'bg-defense-primary/20 text-defense-primary' : 'text-slate-400'
              }`}
            >
              <link.icon size={20} />
              {link.name}
            </Link>
          ))}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 p-3 text-defense-red hover:bg-defense-red/10 rounded-lg"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('secureit_token');
  if (!token) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('secureit_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('secureit_token');
    localStorage.removeItem('secureit_user');
    localStorage.removeItem('secureit_role');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage setUser={setUser} />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="pb-12">
                  <Navbar user={user} onLogout={handleLogout} />
                  <div className="max-w-7xl mx-auto px-6">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard user={user} />} />
                      <Route path="/request" element={<RequestAccess user={user} />} />
                      <Route path="/logs" element={<AuditLog />} />
                      <Route path="/graph" element={<RoleGraph />} />
                      <Route path="/alerts" element={<SecurityAlerts />} />
                    </Routes>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
