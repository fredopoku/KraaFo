import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Mail, Shield, Trash2, RefreshCw, ChevronDown,
  Loader2, AlertCircle, CheckCircle2, Clock, ArrowLeft,
} from 'lucide-react';
import { api } from '../utils/api';
import { useOrg } from '../hooks/useOrg';
import { Logo } from '../components/Logo';

const ROLES = ['admin', 'staff', 'accountant'] as const;
type Role = typeof ROLES[number];

const ROLE_META: Record<Role | 'owner', { label: string; color: string; desc: string }> = {
  owner: { label: 'Owner', color: 'bg-violet-100 text-violet-700', desc: 'Full access' },
  admin: { label: 'Admin', color: 'bg-indigo-100 text-indigo-700', desc: 'Create, send, manage team' },
  staff: { label: 'Staff', color: 'bg-sky-100 text-sky-700', desc: 'Create and send documents' },
  accountant: { label: 'Accountant', color: 'bg-amber-100 text-amber-700', desc: 'View only' },
};

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  invite_accepted: number;
  created_at: string;
}

export default function Team() {
  const navigate = useNavigate();
  const { org, canManageTeam, isOwner, role: myRole } = useOrg();

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberError, setMemberError] = useState('');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('staff');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!canManageTeam) { navigate('/generator'); return; }
    api.team.list()
      .then(setMembers)
      .catch(err => setMemberError((err as Error).message))
      .finally(() => setLoadingMembers(false));
  }, [canManageTeam]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true); setInviteError(''); setInviteSuccess('');
    try {
      const m = await api.team.invite(inviteEmail.trim(), inviteRole);
      setMembers(prev => [...prev, m]);
      setInviteSuccess(`Invite sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
    } catch (err) {
      setInviteError((err as Error).message);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    setActionLoading(memberId + '-role');
    try {
      await api.team.changeRole(memberId, newRole);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (memberId: string, email: string) => {
    if (!confirm(`Remove ${email} from your team?`)) return;
    setActionLoading(memberId + '-remove');
    try {
      await api.team.remove(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResend = async (memberId: string) => {
    setActionLoading(memberId + '-resend');
    try {
      await api.team.resendInvite(memberId);
      setInviteSuccess('Invite resent.');
      setTimeout(() => setInviteSuccess(''), 3000);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  if (!org) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/generator')}
            className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1.5 text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Logo size="md" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="w-4 h-4" />
          <span className="font-semibold">{org.name}</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" /> Team Members
          </h1>
          <p className="text-slate-500 text-sm">Manage who has access to your KraaFo account.</p>
        </div>

        {/* Invite form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-500" /> Invite a team member
          </h2>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email" value={inviteEmail} onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }}
                placeholder="colleague@yourcompany.com" required
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              />
            </div>
            <div className="relative">
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as Role)}
                className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white font-medium transition-all"
              >
                {ROLES.filter(r => isOwner || r !== 'admin').map(r => (
                  <option key={r} value={r}>{ROLE_META[r].label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <button type="submit" disabled={inviting || !inviteEmail.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-all">
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {inviting ? 'Sending…' : 'Send invite'}
            </button>
          </form>

          {inviteError && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{inviteError}</span>
            </div>
          )}
          {inviteSuccess && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{inviteSuccess}</span>
            </div>
          )}

          {/* Role guide */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ROLES.map(r => (
              <div key={r} className="bg-slate-50 rounded-xl px-3 py-2">
                <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mb-1 ${ROLE_META[r].color}`}>
                  {ROLE_META[r].label}
                </span>
                <p className="text-[11px] text-slate-500">{ROLE_META[r].desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Member list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="text-sm font-black text-slate-700">Current team</h2>
          </div>

          {loadingMembers ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          ) : memberError ? (
            <div className="p-6 text-sm text-red-500">{memberError}</div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {/* Owner row */}
              <li className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{org.name}</p>
                    <p className="text-xs text-slate-400 truncate">{org.email}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-black px-2.5 py-1 rounded-full shrink-0 ${ROLE_META.owner.color}`}>Owner</span>
              </li>

              {members.length === 0 && (
                <li className="px-6 py-8 text-center text-sm text-slate-400">
                  No team members yet. Invite someone above to get started.
                </li>
              )}

              {members.map(member => {
                const meta = ROLE_META[member.role] || ROLE_META.staff;
                const pending = member.invite_accepted === 0;
                return (
                  <li key={member.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 text-sm font-bold">
                        {member.name ? member.name[0].toUpperCase() : member.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {member.name || <span className="text-slate-400 font-medium italic">Invite pending</span>}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {pending && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}

                      {isOwner && !pending ? (
                        <div className="relative">
                          <select
                            value={member.role}
                            onChange={e => handleRoleChange(member.id, e.target.value as Role)}
                            disabled={!!actionLoading}
                            className={`appearance-none text-[11px] font-black pl-2.5 pr-6 py-1 rounded-full border-0 cursor-pointer ${meta.color} focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                          >
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                        </div>
                      ) : !pending ? (
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                      ) : null}

                      {pending && (
                        <button
                          onClick={() => handleResend(member.id)}
                          disabled={actionLoading === member.id + '-resend'}
                          title="Resend invite"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-40">
                          {actionLoading === member.id + '-resend'
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <RefreshCw className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      <button
                        onClick={() => handleRemove(member.id, member.email)}
                        disabled={!!actionLoading}
                        title="Remove member"
                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40">
                        {actionLoading === member.id + '-remove'
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
