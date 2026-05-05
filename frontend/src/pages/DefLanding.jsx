import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Activity, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { authApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage({ setUser }) {
    const [username, setUsername] = useState(localStorage.getItem('secureit_last_user') || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(localStorage.getItem('secureit_last_role') || 'Soldier');
    const [status, setStatus] = useState('idle'); 
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            setError('CREDENTIALS_REQUIRED: Please enter ID and Access Code');
            setStatus('error');
            return;
        }

        setStatus('checking');
        setError(null);

        // Artificial delay for "Security Clearance Verification"
        setTimeout(async () => {
            try {
                const response = await authApi.login(username, password);
                
                // RBAC Validation: Check if the user actually has the role they selected
                const userRoles = response.data.user.roles;
                const roleMatches = userRoles.some(r => r.toLowerCase().includes(role.toLowerCase().split(' ')[0].toLowerCase()));

                if (!roleMatches) {
                     throw new Error(`CLEARANCE_MISMATCH: Personnel "${username}" does not hold "${role}" rank.`);
                }

                localStorage.setItem('secureit_token', response.data.token);
                localStorage.setItem('secureit_user', JSON.stringify(response.data.user));
                localStorage.setItem('secureit_role', role);
                localStorage.setItem('secureit_last_user', username);
                localStorage.setItem('secureit_last_role', role);
                
                if (setUser) setUser(response.data.user);
                
                setStatus('success');
                setTimeout(() => navigate('/dashboard'), 1000);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || err.message || 'Authentication Protocol Failed');
                setStatus('error');
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="glass p-10 rounded-[40px] border border-white/5 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-defense-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-14 h-14 bg-defense-primary/20 rounded-2xl flex items-center justify-center border border-defense-primary/30 shadow-lg shadow-defense-primary/10">
                                <Shield className="text-defense-primary" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight">MSAS</h1>
                                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Military Secure Access System</p>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                                    Personnel ID (Username)
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. soldier_user, colonel_user"
                                    className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:outline-none focus:border-defense-primary transition-colors font-bold text-sm"
                                    disabled={status === 'checking'}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                                    Access Code (Password)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:outline-none focus:border-defense-primary transition-colors font-bold text-sm"
                                    disabled={status === 'checking'}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                                    Claimed Role
                                </label>
                                <div className="relative">
                                    <select
                                        id="role-select"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        disabled={status === 'checking'}
                                        className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl appearance-none focus:outline-none focus:border-defense-primary transition-colors cursor-pointer font-bold text-sm"
                                    >
                                        <option value="Soldier" className="bg-slate-900 text-white">Soldier (Level 1)</option>
                                        <option value="Officer" className="bg-slate-900 text-white">Officer (Level 3)</option>
                                        <option value="Colonel" className="bg-slate-900 text-white">Colonel (Level 6)</option>
                                        <option value="Brigadier" className="bg-slate-900 text-white">Brigadier (Level 10)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <Activity size={18} />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={status === 'checking'}
                                className="w-full bg-defense-primary hover:bg-defense-primary-hover text-white p-5 rounded-2xl font-bold transition-all shadow-xl shadow-defense-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {status === 'checking' ? 'Verifying Credentials...' : 'Initialize Authentication'}
                                <ChevronRight size={20} />
                            </button>
                        </form>

                        <AnimatePresence mode="wait">
                            {status === 'checking' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-8 p-4 bg-defense-primary/5 border border-defense-primary/10 rounded-2xl flex items-center gap-3"
                                >
                                    <div className="w-2 h-2 bg-defense-primary rounded-full animate-ping" />
                                    <span className="text-[10px] font-bold text-defense-primary uppercase tracking-widest">Running Firewall Chain Analysis...</span>
                                </motion.div>
                            )}

                            {status === 'error' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-8 p-4 bg-defense-red/10 border border-defense-red/20 rounded-2xl flex items-center gap-3"
                                >
                                    <AlertTriangle className="text-defense-red" size={16} />
                                    <span className="text-[10px] font-bold text-defense-red uppercase tracking-widest">{error}</span>
                                </motion.div>
                            )}

                            {status === 'success' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-8 p-4 bg-defense-green/10 border border-defense-green/20 rounded-2xl flex items-center gap-3"
                                >
                                    <ShieldCheck className="text-defense-green" size={16} />
                                    <span className="text-[10px] font-bold text-defense-green uppercase tracking-widest">Clearance Verified. Proceeding to Theater.</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-12 pt-8 border-t border-white/5 text-center">
                            <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
                                <Lock size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Secure Terminal Access Only</span>
                            </div>
                            <p className="text-[9px] text-slate-700 font-medium">Node ID: 772-DELTA-AF • Encrypted via AES-512</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}