import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, RotateCcw, ArrowLeft, FileText, Receipt, Users, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

interface TrashedItem {
  id: string;
  number?: string;
  name?: string;
  type?: string;
  client_name?: string;
  company?: string;
  email?: string;
  deleted_at: string;
  deleted_by: string;
}

interface TrashData {
  invoices: TrashedItem[];
  quotes: TrashedItem[];
  clients: TrashedItem[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface ItemRowProps {
  type: 'invoices' | 'quotes' | 'clients';
  item: TrashedItem;
  restoring: string | null;
  onRestore: (type: 'invoices' | 'quotes' | 'clients', item: TrashedItem) => void;
  onConfirmDelete: (type: 'invoices' | 'quotes' | 'clients', item: TrashedItem) => void;
}

function ItemRow({ type, item, restoring, onRestore, onConfirmDelete }: ItemRowProps) {
  const isReceipt = type === 'invoices' && item.type === 'receipt';
  const isClient = type === 'clients';
  const isQuote = type === 'quotes';

  const icon = isReceipt
    ? <Receipt className="w-4 h-4 text-emerald-600" />
    : isClient
    ? <Users className="w-4 h-4 text-blue-600" />
    : isQuote
    ? <FileText className="w-4 h-4 text-violet-600" />
    : <FileText className="w-4 h-4 text-indigo-600" />;

  const label = isReceipt ? 'Receipt' : isClient ? 'Client' : isQuote ? 'Quote' : 'Invoice';
  const badgeClass = isReceipt
    ? 'bg-emerald-50 text-emerald-700'
    : isClient
    ? 'bg-blue-50 text-blue-700'
    : isQuote
    ? 'bg-violet-50 text-violet-700'
    : 'bg-indigo-50 text-indigo-700';

  const title = isClient ? item.name : item.number;
  const subtitle = isClient
    ? (item.company || item.email || '')
    : (item.client_name || '');

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white transition-all">
      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0 ${badgeClass}`}>{label}</span>
          <span className="text-sm font-bold text-slate-800 truncate">{title}</span>
        </div>
        {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
        <p className="text-[11px] text-slate-400 mt-0.5">
          Moved by <span className="font-semibold">{item.deleted_by}</span> · {formatDate(item.deleted_at)}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onRestore(type, item)}
          disabled={restoring === item.id}
          title="Restore"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
        >
          {restoring === item.id
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <RotateCcw className="w-3 h-3" />}
          <span className="hidden sm:inline">Restore</span>
        </button>
        <button
          onClick={() => onConfirmDelete(type, item)}
          title="Delete forever"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span className="hidden sm:inline">Delete forever</span>
        </button>
      </div>
    </div>
  );
}

export default function Trash() {
  const navigate = useNavigate();
  const [data, setData] = useState<TrashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deletingForever, setDeletingForever] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'invoices' | 'quotes' | 'clients'; item: TrashedItem } | null>(null);

  const load = async () => {
    try {
      const result = await api.trash.list();
      setData(result);
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('krafo_token')) { navigate('/login'); return; }
    load();
  }, []);

  const restore = async (type: 'invoices' | 'quotes' | 'clients', item: TrashedItem) => {
    setRestoring(item.id);
    try {
      await api.trash.restore(type, item.id);
      await load();
    } catch {
      // silently fail — item still in list on reload
    } finally {
      setRestoring(null);
    }
  };

  const permanentDelete = async () => {
    if (!confirmDelete) return;
    setDeletingForever(true);
    try {
      await api.trash.permanentDelete(confirmDelete.type, confirmDelete.item.id);
      setConfirmDelete(null);
      await load();
    } catch {
      // silently fail
    } finally {
      setDeletingForever(false);
    }
  };

  const total = data ? data.invoices.length + data.quotes.length + data.clients.length : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/generator')}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-slate-400" />
            <span className="font-black text-slate-800 text-sm">Trash</span>
            {!loading && total > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-[10px] flex items-center justify-center font-black">
                {total > 9 ? '9+' : total}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        ) : total === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-slate-300" />
            </div>
            <h2 className="text-lg font-black text-slate-800 mb-2">Trash is empty</h2>
            <p className="text-sm text-slate-400 mb-6">Nothing has been moved to Trash yet.</p>
            <button
              onClick={() => navigate('/generator')}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Back to documents
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-amber-700 font-black text-[10px]">!</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Items in Trash are hidden from your documents, clients, and quotes views. Any team member can restore or permanently delete items here. Public links to trashed documents return "Not found" until restored.
              </p>
            </div>

            {data!.invoices.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Documents ({data!.invoices.length})
                </h2>
                <div className="space-y-2">
                  {data!.invoices.map(item => (
                    <ItemRow
                      key={item.id}
                      type="invoices"
                      item={item}
                      restoring={restoring}
                      onRestore={restore}
                      onConfirmDelete={(t, i) => setConfirmDelete({ type: t, item: i })}
                    />
                  ))}
                </div>
              </section>
            )}

            {data!.quotes.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Quotes ({data!.quotes.length})
                </h2>
                <div className="space-y-2">
                  {data!.quotes.map(item => (
                    <ItemRow
                      key={item.id}
                      type="quotes"
                      item={item}
                      restoring={restoring}
                      onRestore={restore}
                      onConfirmDelete={(t, i) => setConfirmDelete({ type: t, item: i })}
                    />
                  ))}
                </div>
              </section>
            )}

            {data!.clients.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Clients ({data!.clients.length})
                </h2>
                <div className="space-y-2">
                  {data!.clients.map(item => (
                    <ItemRow
                      key={item.id}
                      type="clients"
                      item={item}
                      restoring={restoring}
                      onRestore={restore}
                      onConfirmDelete={(t, i) => setConfirmDelete({ type: t, item: i })}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Permanent delete confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !deletingForever && setConfirmDelete(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">Delete forever?</h3>
            <p className="text-sm text-slate-500 mb-5">
              <span className="font-semibold text-slate-700">
                {confirmDelete.item.number || confirmDelete.item.name}
              </span>{' '}
              will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deletingForever}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={permanentDelete}
                disabled={deletingForever}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deletingForever
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…</>
                  : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
