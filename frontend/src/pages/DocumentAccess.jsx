import { useState, useEffect } from 'react';
import {
  FileText, Users, ShieldAlert, Plus, Trash2, Search,
  Lock, Unlock, AlertTriangle, CheckCircle2, XCircle, ChevronDown, Activity, ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const classColors = {
  'UNCLASSIFIED': 'text-muted bg-bg-elevated border-border',
  'RESTRICTED':   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'CONFIDENTIAL': 'text-amber-secure bg-amber-secure/10 border-amber-secure/20',
  'SECRET':       'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'TOP SECRET':   'text-red-secure bg-red-secure/10 border-red-secure/20',
};

const DocumentAccess = () => {
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Grant form state
  const [selectedDoc, setSelectedDoc] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [docSearch, setDocSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const loadData = async () => {
    try {
      const [docsRes, usersRes, sharesRes] = await Promise.all([
        api.get('/resource/documents'),
        api.get('/resource/users'),
        api.get('/resource/shares'),
      ]);
      setDocuments(docsRes.data.documents || []);
      setUsers(usersRes.data.users || []);
      setShares(sharesRes.data.shares || []);
    } catch (err) {
      console.error('Failed to load document data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const grantAccess = async () => {
    if (!selectedDoc || !selectedUser) return;
    try {
      const res = await api.post('/resource/share', { documentId: selectedDoc, targetUserId: selectedUser });
      showFeedback('success', res.data.message);
      setSelectedDoc('');
      setSelectedUser('');
      setDocSearch('');
      setUserSearch('');
      loadData();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to grant access.');
    }
  };

  const revokeAccess = async (documentId, userId) => {
    try {
      const res = await api.delete('/resource/share', { data: { documentId, targetUserId: userId } });
      showFeedback('success', res.data.message);
      loadData();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to revoke access.');
    }
  };

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
    d.owner_name.toLowerCase().includes(docSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.roles || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 bg-bg-base min-h-[400px]">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin" />
      <p className="text-[10px] font-mono uppercase tracking-widest text-secondary animate-pulse">Initializing Registry...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-bg-base overflow-hidden">
      <div className="p-6 border-b border-border bg-bg-surface shrink-0 flex justify-between items-end">
        <div>
          <h2 className="section-label">DOCUMENT ACCESS CONTROL</h2>
          <p className="text-[11px] text-muted mt-1 uppercase tracking-wider">Assign & Revoke Cross-User Document Permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-bg-elevated border border-border px-3 py-1 flex items-center gap-2">
            <FileText size={12} className="text-accent" />
            <span className="text-[10px] font-bold text-secondary uppercase">{documents.length} ASSETS</span>
          </div>
          <div className="bg-bg-elevated border border-border px-3 py-1 flex items-center gap-2">
            <Unlock size={12} className="text-green-secure" />
            <span className="text-[10px] font-bold text-secondary uppercase">{shares.length} ACTIVE SHARES</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto relative">
          {/* Grant Section */}
          <div className="p-6 border-b border-border bg-bg-surface/30">
            <h3 className="section-label mb-6">GRANT DOCUMENT ACCESS</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Doc Selector */}
              <div className="space-y-2 relative">
                <label className="text-[9px] font-bold text-secondary uppercase tracking-widest block ml-1">SELECT DOCUMENT</label>
                <div className="relative">
                   <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                   <input 
                      type="text" 
                      placeholder="SEARCH DOCUMENTS..."
                      value={docSearch}
                      onChange={e => setDocSearch(e.target.value)}
                      className="w-full input-flat pl-9 rounded-none"
                   />
                </div>
                {docSearch && filteredDocs.length > 0 && !selectedDoc && (
                   <div className="absolute z-[100] mt-1 w-full max-h-48 overflow-y-auto bg-bg-surface border border-border shadow-2xl">
                      {filteredDocs.map(doc => (
                         <button 
                            key={doc.id}
                            onClick={() => { setSelectedDoc(doc.id); setDocSearch(doc.title); }}
                            className="w-full text-left p-3 hover:bg-bg-elevated border-b border-border last:border-0 group"
                         >
                            <p className="text-[11px] font-bold text-primary group-hover:text-accent truncate">{doc.title}</p>
                            <p className="text-[9px] text-muted uppercase">{doc.owner_name} · {doc.classification}</p>
                         </button>
                      ))}
                   </div>
                )}
              </div>

              {/* User Selector */}
              <div className="space-y-2 relative">
                <label className="text-[9px] font-bold text-secondary uppercase tracking-widest block ml-1">GRANT ACCESS TO</label>
                <div className="relative">
                   <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                   <input 
                      type="text" 
                      placeholder="SEARCH PERSONNEL..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full input-flat pl-9 rounded-none"
                   />
                </div>
                {userSearch && filteredUsers.length > 0 && !selectedUser && (
                   <div className="absolute z-[100] mt-1 w-full max-h-48 overflow-y-auto bg-bg-surface border border-border shadow-2xl">
                      {filteredUsers.map(user => (
                         <button 
                            key={user.id}
                            onClick={() => { setSelectedUser(user.id); setUserSearch(user.username); }}
                            className="w-full text-left p-3 hover:bg-bg-elevated border-b border-border last:border-0 group"
                         >
                            <p className="text-[11px] font-bold text-primary group-hover:text-accent">{user.username.toUpperCase()}</p>
                            <p className="text-[9px] text-muted uppercase">{user.roles || 'NO ROLE'}</p>
                         </button>
                      ))}
                   </div>
                )}
              </div>

              {/* Action */}
              <div className="flex items-end">
                <button 
                  onClick={grantAccess}
                  disabled={!selectedDoc || !selectedUser}
                  className="w-full btn-accent h-9 text-[10px] font-bold uppercase rounded-none disabled:opacity-30"
                >
                  ESTABLISH CROSS-USER LINK
                </button>
              </div>
            </div>
          </div>

          {/* Active Shares */}
          <div className="p-0">
             <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-bg-surface z-10">
                   <tr className="border-b border-border">
                      <th className="px-6 py-3 section-label font-medium">DOCUMENT ASSET</th>
                      <th className="px-6 py-3 section-label font-medium text-center">PATH</th>
                      <th className="px-6 py-3 section-label font-medium">AUTHORIZED RECIPIENT</th>
                      <th className="px-6 py-3 section-label font-medium text-center">CLEARANCE</th>
                      <th className="px-6 py-3 section-label font-medium text-right">REVOKE</th>
                   </tr>
                </thead>
                <tbody className="font-mono text-[11px] divide-y divide-border-subtle">
                   {shares.length === 0 ? (
                      <tr>
                         <td colSpan="5" className="px-6 py-12 text-center text-muted">
                            <Lock size={32} className="mx-auto mb-4 opacity-10" />
                            <p className="uppercase tracking-[0.2em]">NO ACTIVE CROSS-USER SHARES</p>
                         </td>
                      </tr>
                   ) : (
                      shares.map(share => (
                         <tr key={`${share.document_id}-${share.user_id}`} className="hover:bg-bg-elevated transition-colors h-12">
                            <td className="px-6 py-2">
                               <div className="flex flex-col">
                                  <span className="text-primary font-bold">{share.document_title}</span>
                                  <span className="text-[9px] text-muted uppercase">OWNER: {share.owner_name}</span>
                               </div>
                            </td>
                            <td className="px-6 py-2 text-center text-muted"><ArrowRight size={14} className="inline" /></td>
                            <td className="px-6 py-2">
                               <div className="flex flex-col">
                                  <span className="text-primary font-bold">{share.recipient_name.toUpperCase()}</span>
                                  <span className="text-[9px] text-muted uppercase">{share.recipient_roles || 'NO ROLE'}</span>
                               </div>
                            </td>
                            <td className="px-6 py-2 text-center">
                               <span className={`inline-block px-2 py-0.5 border text-[9px] font-bold uppercase ${classColors[share.classification] || classColors['UNCLASSIFIED']}`}>
                                  {share.classification}
                               </span>
                            </td>
                            <td className="px-6 py-2 text-right">
                               <button 
                                  onClick={() => revokeAccess(share.document_id, share.user_id)}
                                  className="p-2 text-muted hover:text-red-secure transition-colors"
                               >
                                  <Trash2 size={16} />
                               </button>
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
        </div>

        <div className="px-6 h-10 border-t border-border bg-bg-surface flex items-center justify-between shrink-0">
          <p className="text-[10px] text-muted uppercase">Document Isolation Protocol: ACTIVE</p>
          <div className="flex items-center gap-4">
             {feedback && (
                <div className={`text-[10px] font-bold uppercase ${feedback.type === 'success' ? 'text-green-secure' : 'text-red-secure'}`}>
                   {feedback.message}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAccess;
