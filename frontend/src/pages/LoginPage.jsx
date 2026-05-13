import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '../services/api';

const LoginPage = ({ setUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Soldier');
    const [status, setStatus] = useState('idle'); // idle, checking, success, error
    const [error, setError] = useState(null);
    const [fingerprint, setFingerprint] = useState('COMPUTING...');
    const [events, setEvents] = useState([
        { time: '14:22:01', type: 'BLOCKED', action: 'ESCALATION_ATTEMPT', tenant: 'alpha', details: 'chain:4' },
        { time: '14:21:47', type: 'GRANTED', action: 'ACCESS_REQUEST', tenant: 'bravo', details: 'role:colonel' },
        { time: '14:21:33', type: 'FLAGGED', action: 'CROSS_TENANT_PROBE', tenant: 'alpha', details: 'severity:HIGH' },
    ]);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            setFingerprint('8f7a...c2d1');
        }, 1500);

        const eventInterval = setInterval(() => {
            const types = ['BLOCKED', 'GRANTED', 'FLAGGED'];
            const type = types[Math.floor(Math.random() * types.length)];
            const newEvent = {
                time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                type,
                action: type === 'BLOCKED' ? 'ESCALATION_ATTEMPT' : type === 'GRANTED' ? 'ACCESS_REQUEST' : 'CROSS_TENANT_PROBE',
                tenant: Math.random() > 0.5 ? 'alpha' : 'bravo',
                details: type === 'BLOCKED' ? 'chain:7' : type === 'GRANTED' ? 'role:soldier' : 'severity:MED'
            };
            setEvents(prev => [newEvent, ...prev.slice(0, 7)]);
        }, 4000);

        return () => {
            clearTimeout(timer);
            clearInterval(eventInterval);
        };
    }, []);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setStatus('checking');
        setError(null);

        setTimeout(async () => {
            try {
                const response = await authApi.login(username, password);
                
                // RBAC Validation
                const userRoles = response.data.user.roles;
                const roleMatches = userRoles.some(r => r.toLowerCase().includes(role.toLowerCase().split(' ')[0].toLowerCase()));

                if (!roleMatches && username !== 'hq_admin') {
                     throw new Error(`CLEARANCE_MISMATCH: Personnel "${username}" does not hold "${role}" rank.`);
                }

                localStorage.setItem('secureit_token', response.data.token);
                localStorage.setItem('secureit_user', JSON.stringify(response.data.user));
                localStorage.setItem('secureit_role', role);
                localStorage.removeItem('secureit_admin');
                
                if (setUser) setUser(response.data.user);
                
                setStatus('success');
                setTimeout(() => navigate('/dashboard'), 500);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Authentication Protocol Failed');
                setStatus('error');
            }
        }, 1000);
    };

    const handleAdminLogin = async () => {
        setStatus('checking');
        setError(null);

        setTimeout(async () => {
            try {
                const response = await authApi.login('hq_admin', 'password123');
                
                localStorage.setItem('secureit_token', response.data.token);
                localStorage.setItem('secureit_user', JSON.stringify(response.data.user));
                localStorage.setItem('secureit_role', 'Strategic_Admin');
                localStorage.setItem('secureit_admin', 'true');
                
                if (setUser) setUser(response.data.user);
                
                setStatus('success');
                setTimeout(() => navigate('/admin/command'), 500);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Admin Authentication Failed');
                setStatus('error');
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-bg-base flex font-sans selection:bg-accent selection:text-white">
            {/* Left Column */}
            <div className="w-[45%] bg-bg-surface border-r border-border p-6 flex flex-col justify-between relative">
                <div className="space-y-1">
                    <div className="text-sm font-semibold tracking-tight uppercase text-primary">SECUREIT</div>
                    <div className="text-[10px] font-mono text-muted uppercase tracking-widest">AUTHORIZED PERSONNEL ONLY</div>
                </div>

                <div className="max-w-[320px] mx-auto w-full">
                    <div className="mb-6">
                        <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-secondary font-semibold">OPERATOR AUTHENTICATION</div>
                        <div className="text-[11px] text-muted mt-1">Session will be cryptographically bound to this terminal.</div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase text-secondary tracking-widest">OPERATOR ID</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full input-flat"
                                disabled={status === 'checking'}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase text-secondary tracking-widest">PASSPHRASE</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full input-flat"
                                disabled={status === 'checking'}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase text-secondary tracking-widest">CLEARANCE TIER</label>
                            <div className="relative">
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full input-flat cursor-pointer appearance-none"
                                    disabled={status === 'checking'}
                                >
                                    <option value="Soldier">SOLDIER</option>
                                    <option value="Officer">OFFICER</option>
                                    <option value="Colonel">COLONEL</option>
                                    <option value="Brigadier">BRIGADIER</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                                    ▼
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={status === 'checking'}
                            className="w-full btn-accent uppercase tracking-widest text-[12px] h-[40px] mt-2 rounded-none"
                        >
                            {status === 'checking' ? 'AUTHORIZING...' : 'AUTHENTICATE ⟶'}
                        </button>

                        {error && (
                            <div className="mt-4 p-4 threat-bg text-[10px] flex items-start gap-3">
                                <span className="font-bold shrink-0">AUTHENTICATION_PROTOCOL_ERROR:</span>
                                <span className="opacity-90">{error}</span>
                            </div>
                        )}

                        <div className="pt-2">
                            <div className="h-px bg-border mb-4" />
                            <div className="text-[10px] text-red-secure font-medium leading-tight">
                                ⚠ Unauthorized access attempts are recorded, logged, and reported.
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={handleAdminLogin}
                            className="text-[10px] font-mono text-amber-secure hover:underline uppercase tracking-widest mt-4"
                        >
                            COMMAND HQ ACCESS
                        </button>
                    </form>
                </div>

                <div className="text-[10px] font-mono text-muted uppercase tracking-widest">
                    DEVICE FINGERPRINT: <span className={fingerprint === 'COMPUTING...' ? 'animate-pulse' : 'text-secondary'}>{fingerprint}</span>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-[55%] bg-bg-base p-12 dot-grid overflow-hidden flex flex-col">
                <div className="flex gap-12 mb-12">
                    {[
                        { label: 'ACTIVE TENANTS', value: '4' },
                        { label: 'SESSIONS TODAY', value: '1,284' },
                        { label: 'THREATS BLOCKED', value: '12' },
                    ].map((stat, i) => (
                        <div key={i} className="flex gap-12 items-center">
                            <div className="flex flex-col">
                                <div className="text-[20px] font-mono text-primary">{stat.value}</div>
                                <div className="text-[10px] text-muted uppercase tracking-widest">{stat.label}</div>
                            </div>
                            {i < 2 && <div className="h-10 w-px bg-border" />}
                        </div>
                    ))}
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="text-[10px] font-mono text-secondary mb-4 uppercase tracking-[0.12em] font-semibold">RECENT SECURITY EVENTS</div>
                    <div className="space-y-2 font-mono text-[13px]">
                        <AnimatePresence initial={false}>
                            {events.map((event, i) => (
                                <motion.div 
                                    key={`${event.time}-${i}`}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-4 py-1"
                                >
                                    <span className="text-muted">[{event.time}]</span>
                                    <span className={`w-[80px] font-bold ${
                                        event.type === 'BLOCKED' ? 'text-red-secure' : 
                                        event.type === 'GRANTED' ? 'text-green-secure' : 
                                        'text-amber-secure'
                                    }`}>
                                        {event.type}
                                    </span>
                                    <span className="text-primary flex-1">{event.action}</span>
                                    <span className="text-secondary">tenant:{event.tenant}</span>
                                    <span className="text-muted truncate">{event.details}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
