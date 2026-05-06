import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, ChevronRight, Lock, Crown, WifiOff, Globe } from 'lucide-react';
import { authApi } from '../services/api';

const DefLanding = ({ setUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Soldier');
    const [status, setStatus] = useState('idle'); // idle, checking, success, error, lockdown
    const [error, setError] = useState(null);
    const [lockdownDetails, setLockdownDetails] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setStatus('checking');
        setError(null);
        setLockdownDetails(null);

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
                localStorage.removeItem('secureit_admin');
                
                if (setUser) setUser(response.data.user);
                
                setStatus('success');
                setTimeout(() => navigate('/dashboard'), 1000);
            } catch (err) {
                console.error(err);
                // Check for Device Lockdown Violation
                if (err.response?.data?.error === 'DEVICE_LOCKDOWN_VIOLATION') {
                    setLockdownDetails(err.response.data.details);
                    setError(err.response.data.message);
                    setStatus('lockdown');
                } else {
                    setError(err.response?.data?.message || err.message || 'Authentication Protocol Failed');
                    setStatus('error');
                }
            }
        }, 1500);
    };

    const handleAdminLogin = async () => {
        setStatus('checking');
        setError(null);
        setLockdownDetails(null);

        setTimeout(async () => {
            try {
                // Using a dedicated HQ Admin account (Bypasses Brigadier Device Lockdown)
                const response = await authApi.login('hq_admin', 'password123');
                
                localStorage.setItem('secureit_token', response.data.token);
                localStorage.setItem('secureit_user', JSON.stringify(response.data.user));
                localStorage.setItem('secureit_role', 'Strategic_Admin');
                localStorage.setItem('secureit_admin', 'true');
                
                if (setUser) setUser(response.data.user);
                
                setStatus('success');
                setTimeout(() => navigate('/admin/command'), 1000);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || err.message || 'Admin Authentication Failed');
                setStatus('error');
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-defense-900 flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Minimal background accents */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-defense-primary/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-defense-cyan/10 blur-[120px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-defense-800 p-12 rounded-[32px] border border-slate-700/50 shadow-2xl">
                    <div className="relative z-10">
                        <div className="flex flex-col items-center text-center mb-10">
                            <div className="w-16 h-16 bg-defense-primary/5 rounded-[24px] flex items-center justify-center border border-defense-primary/10 shadow-inner mb-6">
                                <Shield className="text-defense-primary" size={32} />
                            </div>
                            <h1 className="text-4xl font-bold text-white tracking-tight uppercase">SecureIT</h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black mt-2">Enterprise Security Terminal</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-1">
                                    Personnel ID
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your ID"
                                    className="w-full bg-slate-900/50 border border-slate-800 text-white p-4 rounded-2xl focus:outline-none focus:border-defense-primary focus:ring-1 focus:ring-defense-primary/50 transition-all font-bold text-sm"
                                    disabled={status === 'checking'}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-1">
                                    Access Code
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-slate-900/50 border border-slate-800 text-white p-4 rounded-2xl focus:outline-none focus:border-defense-primary focus:ring-1 focus:ring-defense-primary/50 transition-all font-bold text-sm tracking-widest"
                                    disabled={status === 'checking'}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-1">
                                    Command Level
                                </label>
                                <div className="relative">
                                    <select
                                        id="role-select"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        disabled={status === 'checking'}
                                        className="w-full bg-slate-900/50 border border-slate-800 text-white p-4 rounded-2xl appearance-none focus:outline-none focus:border-defense-primary transition-all cursor-pointer font-bold text-sm"
                                    >
                                        <option value="Soldier" className="bg-slate-900 text-white">Soldier</option>
                                        <option value="Officer" className="bg-slate-900 text-white">Officer</option>
                                        <option value="Colonel" className="bg-slate-900 text-white">Colonel</option>
                                        <option value="Brigadier" className="bg-slate-900 text-white">Brigadier</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <ChevronRight size={18} className="rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={status === 'checking'}
                                className="w-full bg-defense-primary hover:bg-defense-primary/90 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-defense-primary/20 active:scale-[0.98] disabled:opacity-50"
                            >
                                {status === 'checking' ? 'Authorizing...' : (
                                    <>
                                        Initialize Session
                                        <ChevronRight size={16} />
                                    </>
                                )}
                            </button>

                            <button 
                                type="button"
                                onClick={handleAdminLogin}
                                disabled={status === 'checking'}
                                className="w-full mt-4 flex items-center justify-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] hover:text-amber-400 transition-colors"
                            >
                                <Crown size={14} />
                                Command HQ Login
                            </button>
                        </form>

                        <AnimatePresence>
                            {status === 'checking' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-8 flex flex-col items-center gap-4"
                                >
                                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '100%' }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                            className="w-1/2 h-full bg-defense-primary"
                                        />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Synchronizing Security Layers...</span>
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

                            {status === 'lockdown' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-8 space-y-3"
                                >
                                    {/* Main Lockdown Alert */}
                                    <div className="p-5 bg-gradient-to-br from-defense-red/15 to-orange-500/10 border border-defense-red/30 rounded-2xl">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-defense-red/20 rounded-xl flex items-center justify-center">
                                                <WifiOff className="text-defense-red" size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-defense-red uppercase tracking-widest">Device Lockdown Triggered</p>
                                                <p className="text-[10px] text-slate-500 font-bold">Zero-Trust Security Protocol</p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                            Remote access attempt blocked. This device is not registered in the Trusted Device Registry for supreme command access.
                                        </p>
                                    </div>

                                    {/* Device Details */}
                                    {lockdownDetails && (
                                        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] text-slate-500 uppercase font-bold">Detected Device IP</span>
                                                <span className="text-[10px] font-mono font-bold text-defense-red">{lockdownDetails.detectedIp}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] text-slate-500 uppercase font-bold">Restricted Role</span>
                                                <span className="text-[10px] font-bold text-amber-500">{lockdownDetails.restrictedRole}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] text-slate-500 uppercase font-bold">Firewall Rule</span>
                                                <span className="text-[10px] font-bold text-white">{lockdownDetails.firewallRule}</span>
                                            </div>
                                            <div className="pt-2 border-t border-slate-800 flex gap-2 items-start">
                                                <AlertTriangle size={12} className="text-amber-500 mt-0.5" />
                                                <p className="text-[9px] text-slate-500 italic leading-tight">
                                                    Contact your security administrator to register this device IP in the Trusted Devices Registry.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-12 pt-8 border-t border-slate-800/50 text-center space-y-4">
                            <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                <Lock size={10} />
                                Secure Terminal Access Only
                            </div>
                            <p className="text-[8px] text-slate-700 font-mono">Node ID: 772-DELTA-AF - Encrypted via AES-512</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DefLanding;
