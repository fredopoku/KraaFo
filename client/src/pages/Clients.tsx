import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Edit2, Users, ArrowLeft, Mail, Phone, Building2, X, Check, FileText, Receipt, Download, Eye, ExternalLink, ChevronRight, Loader2 } from 'lucide-react';
import { useOrg } from '../hooks/useOrg';
import { api, formatCurrency } from '../utils/api';
import { Client, Invoice } from '../types';
import { LogoMark, Logo } from '../components/Logo';
import { cn } from '../utils/cn';

const INPUT = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all placeholder:text-slate-300';
const LABEL = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';

const EMPTY: Partial<Client> = { name: '', email: '', phone: '', company: '', address: '', city: '', state: '', zip: '', country: '', notes: '' };

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-slate-100 text-slate-500',
  sent: 'bg-blue-50 text-blue-600',
  overdue: 'bg-red-50 text-red-600',
  cancelled: 'bg-slate-100 text-slate-400',
  none: 'bg-slate-100 text-slate-400',
};

export default function Clients() {
  const navigate = useNavigate();
  const { org } = useOrg();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<Client> | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Client profile panel
  const [selected, setSelected] = useState<Client | null>(null);
  const [clientDocs, setClientDocs] = useState<Invoice[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => { if (org) load(); }, [org, search]);

  const load = async () => {
    if (!org) return;
    try { setClients(await api.clients.list(org.id, search || undefined)); } catch {}
  };

  const openProfile = async (client: Client) => {
    setSelected(client);
    setClientDocs([]);
    setLoadingDocs(true);
    try {
      const docs = await api.invoices.list(org!.id, { client_id: client.id });
      setClientDocs(docs);
    } catch {}
    setLoadingDocs(false);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const save = async () => {
    if (!org || !editing?.name) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.clients.update(editing.id, { ...editing });
        showToast('Client updated');
      } else {
        await api.clients.create({ ...editing, org_id: org.id });
        showToast('Client added');
      }
      setEditing(null);
      load();
    } catch { showToast('Save failed'); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    setDeleting(true);
    try {
      await api.clients.delete(id);
      if (selected?.id === id) setSelected(null);
      setDeleteTarget(null);
      showToast('Client deleted');
      load();
    } catch (err) {
      showToast((err as Error).message || 'Delete failed — please try again');
    } finally {
      setDeleting(false);
    }
  };

  const primary = org?.primary_color || '#2563EB';
  const sym = org?.currency_symbol || '$';

  const totalSpend = clientDocs.reduce((s, d) => s + (d.total || 0), 0);
  const paidCount = clientDocs.filter(d => d.status === 'paid').length;

  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* Header */}
      <header className="bg-white/90 glass border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between" style={{ height: '58px' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
              <Logo size="sm" className="sm:hidden" />
              <Logo size="md" className="hidden sm:flex" />
            </button>
            <h1 className="font-black text-slate-900 tracking-tight">Clients</h1>
          </div>
          <button
            onClick={() => setEditing({ ...EMPTY })}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white btn-glow"
            style={{ background: primary }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Client
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        {/* Search */}
        <div className="relative mb-6 animate-fade-up">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients by name, company or email…"
            type="search"
            autoComplete="off"
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Client grid */}
        {clients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-24 text-center animate-fade-up">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium text-sm">No clients yet</p>
            <p className="text-slate-300 text-xs mt-1">Add your first client to auto-fill invoices faster</p>
            <button onClick={() => setEditing({ ...EMPTY })} className="mt-5 px-5 py-2 rounded-xl text-xs font-bold text-white btn-glow" style={{ background: primary }}>
              Add Client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client, i) => (
              <div
                key={client.id}
                onClick={() => openProfile(client)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover-lift animate-fade-up cursor-pointer hover:border-indigo-200 transition-all"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm" style={{ background: primary }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={e => { e.stopPropagation(); setEditing({ ...client }); }} className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setDeleteTarget(client); }} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="font-black text-slate-800 text-sm truncate">{client.name}</div>
                {client.company && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <Building2 className="w-3 h-3" /> {client.company}
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <Mail className="w-3 h-3" /> {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <Phone className="w-3 h-3" /> {client.phone}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={e => { e.stopPropagation(); navigate('/generator', { state: { client } }); }}
                    className="py-1.5 px-3 rounded-xl text-xs font-bold border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    Create Invoice
                  </button>
                  <span className="text-[10px] text-slate-300 flex items-center gap-0.5">View profile <ChevronRight className="w-3 h-3" /></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Client Profile Slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">

            {/* Panel header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between" style={{ background: `${primary}12` }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-base" style={{ background: primary }}>
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-black text-slate-800 text-base leading-tight">{selected.name}</div>
                  {selected.company && <div className="text-xs text-slate-400">{selected.company}</div>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contact info */}
            <div className="px-6 py-4 border-b border-slate-50 space-y-2">
              {selected.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-300 shrink-0" /> {selected.email}
                </div>
              )}
              {selected.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0" /> {selected.phone}
                </div>
              )}
              {(selected.address || selected.city) && (
                <div className="text-xs text-slate-400 mt-1">
                  {[selected.address, selected.city, selected.state, selected.zip].filter(Boolean).join(', ')}
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="px-6 py-4 border-b border-slate-50 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-black text-slate-800">{clientDocs.length}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Documents</div>
              </div>
              <div className="text-center border-x border-slate-100">
                <div className="text-lg font-black text-slate-800">{paidCount}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Paid</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black" style={{ color: primary }}>{formatCurrency(totalSpend, sym, true)}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Total</div>
              </div>
            </div>

            {/* Documents list */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-3 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documents</span>
                <button
                  onClick={() => navigate('/generator', { state: { client: selected } })}
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg text-white btn-glow"
                  style={{ background: primary }}
                >
                  <Plus className="w-3 h-3" /> New Invoice
                </button>
              </div>

              {loadingDocs ? (
                <div className="px-6 py-12 text-center text-slate-300 text-sm">Loading…</div>
              ) : clientDocs.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No documents yet</p>
                  <p className="text-slate-300 text-xs mt-1">Create an invoice or receipt for this client</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {clientDocs.map(doc => (
                    <div key={doc.id} className="px-6 py-3.5 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {doc.type === 'receipt'
                            ? <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                            : <FileText className="w-3.5 h-3.5 text-blue-500" />
                          }
                          <span className="text-sm font-black text-slate-800">{doc.number}</span>
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', STATUS_COLORS[doc.status] || STATUS_COLORS.none)}>
                            {doc.status}
                          </span>
                        </div>
                        <span className="text-sm font-black text-slate-700">{formatCurrency(doc.total, sym)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-slate-400">{doc.issue_date}{doc.due_date ? ` · Due ${doc.due_date}` : ''}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate('/generator', { state: { loadId: doc.id } })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Open in editor"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => api.pdf.download(doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => api.pdf.preview(doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View PDF"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel footer actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => { setSelected(null); setEditing({ ...selected }); }}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Client
              </button>
              <button
                onClick={() => navigate('/generator', { state: { client: selected } })}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white btn-glow flex items-center justify-center gap-1.5"
                style={{ background: primary }}
              >
                <Plus className="w-3.5 h-3.5" /> New Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-bounce-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-base font-black text-slate-800">{editing.id ? 'Edit Client' : 'Add Client'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Full Name *</label>
                  <input autoComplete="name" value={editing.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} className={INPUT} placeholder="John Smith" />
                </div>
                <div>
                  <label className={LABEL}>Company</label>
                  <input autoComplete="organization" value={editing.company || ''} onChange={e => setEditing(p => ({ ...p, company: e.target.value }))} className={INPUT} placeholder="Acme Ltd" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Email</label>
                  <input type="email" autoComplete="email" value={editing.email || ''} onChange={e => setEditing(p => ({ ...p, email: e.target.value }))} className={INPUT} placeholder="john@example.com" />
                </div>
                <div>
                  <label className={LABEL}>Phone</label>
                  <input type="tel" autoComplete="tel" value={editing.phone || ''} onChange={e => setEditing(p => ({ ...p, phone: e.target.value }))} className={INPUT} placeholder="+1 555 000 0000" />
                </div>
              </div>
              <div>
                <label className={LABEL}>Address</label>
                <input autoComplete="street-address" value={editing.address || ''} onChange={e => setEditing(p => ({ ...p, address: e.target.value }))} className={INPUT} placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={LABEL}>City</label>
                  <input autoComplete="address-level2" value={editing.city || ''} onChange={e => setEditing(p => ({ ...p, city: e.target.value }))} className={INPUT} placeholder="City" />
                </div>
                <div>
                  <label className={LABEL}>State</label>
                  <input autoComplete="address-level1" value={editing.state || ''} onChange={e => setEditing(p => ({ ...p, state: e.target.value }))} className={INPUT} placeholder="State" />
                </div>
                <div>
                  <label className={LABEL}>ZIP</label>
                  <input autoComplete="postal-code" value={editing.zip || ''} onChange={e => setEditing(p => ({ ...p, zip: e.target.value }))} className={INPUT} placeholder="00000" />
                </div>
              </div>
              <div>
                <label className={LABEL}>Notes</label>
                <textarea value={editing.notes || ''} onChange={e => setEditing(p => ({ ...p, notes: e.target.value }))} className={cn(INPUT, 'resize-none h-20')} placeholder="Any notes about this client…" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={save} disabled={saving || !editing.name} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 btn-glow" style={{ background: primary }}>
                <Check className="w-4 h-4" /> {editing.id ? 'Save Changes' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1">Delete client?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-700">{deleteTarget.name}</span>
                {deleteTarget.company ? ` · ${deleteTarget.company}` : ''} will be permanently removed. This cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => remove(deleteTarget.id)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-lg animate-fade-up z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
