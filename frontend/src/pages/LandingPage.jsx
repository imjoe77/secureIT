import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plane, Eye, ChevronRight, Lock } from 'lucide-react';
import { authApi } from '../services/api';
import { motion } from 'framer-motion';

const roles = [
  { 
    id: 'airman_smith', 
    name: 'Airman', 
    icon: Plane, 
    color: 'border-defense-green text-defense-green',
    bg: 'bg-defense-green/10',
    desc: 'Aircraft maintenance and ground operations.' 
  },
  { 
    id: 'pilot_jones', 
    name: 'Flight Operator', 
    icon: Plane, 
    color: 'border-defense-cyan text-defense-cyan',
    bg: 'bg-defense-cyan/10',
    desc: 'Tactical flight execution and sortie management.' 
  },
  { 
    id: 'analyst_miller', 
    name: 'Intelligence Analyst', 
    icon: Eye, 
    color: 'border-defense-yellow text-defense-yellow',
    bg: 'bg-defense-yellow/10',
    desc: 'Strategic data analysis and surveillance monitoring.' 
  },
  { 
    id: 'colonel_vance', 
    name: 'Command Officer', 
    icon: Shield, 
    color: 'border-defense-red text-defense-red',
    bg: 'bg-defense-red/10',
    desc: 'Strategic oversight and full theater command.' 
  },
];

const LandingPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const handleRoleSelect = async (roleId) => {
    setLoading(roleId);
    setError(null);
    try {
      const response = await authApi.login(roleId, 'password123');
      localStorage.setItem('secureit_token', response.data.token);
      localStorage.setItem('secureit_user', JSON.stringify(response.data.user));
      localStorage.setItem('secureit_role', roleId);
      setUser(response.data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Authentication failure. Ensure the defense server is operational.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-defense-primary/20 rounded-3xl mb-6 shadow-2xl shadow-defense-primary/20 border border-defense-primary/30">
            <Lock className="text-defense-primary" size={40} />
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white mb-4">SecureIT</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            Next-Generation RBAC-based Permission Escalation Firewall for Air Force Strategic Operations.
          </p>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-defense-red/10 border border-defense-red/20 text-defense-red p-4 rounded-xl mb-8 text-center"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, idx) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleRoleSelect(role.id)}
              disabled={loading !== null}
              className={`glass p-8 rounded-2xl text-left transition-all hover:scale-105 active:scale-95 group relative overflow-hidden ${
                loading === role.id ? 'opacity-50' : ''
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${role.color} ${role.bg}`}>
                <role.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{role.name}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {role.desc}
              </p>
              <div className="flex items-center gap-2 text-defense-primary font-bold text-sm uppercase tracking-wider group-hover:gap-4 transition-all">
                {loading === role.id ? 'Authenticating...' : 'Access Portal'}
                <ChevronRight size={16} />
              </div>
              
              {/* Decorative background element */}
              <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <role.icon size={120} />
              </div>
            </motion.button>
          ))}
        </div>
        
        <p className="text-center mt-12 text-slate-600 text-sm font-medium">
          SecureIT Authentication System v4.2.0 • Personnel ID required for access
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
