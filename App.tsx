import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrderTable, { ActiveFilterType } from './components/OrderTable';
import OrderTimeline from './components/OrderTimeline';
import OrderDetails from './components/OrderDetails';
import ImportModal from './components/ImportModal';
import Settings from './components/Settings';
import StopReasons from './components/StopReasons';
import Login from './components/Login';
import { Order, User } from './types';
import { WifiOff, CheckCircle2, X, Download, Loader2, Cloud } from 'lucide-react';
import { SECTORS, STOP_REASONS_HIERARCHY } from './constants';
import SectorOrderTable from './components/SectorOrderTable';

// ─── Firebase Services ───────────────────────────────────────
import {
  subscribeToOrders,
  saveOrderToFirebase,
  deleteOrderFromFirebase,
  deleteDocFromFirebase,
  mergeExcelToFirebase,
  saveStopReasonsToFirebase,
  loadStopReasonsFromFirebase,
} from './services/firebaseService';

const App: React.FC = () => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [stopReasons, setStopReasons] = React.useState<any[]>(STOP_REASONS_HIERARCHY);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeView, setActiveView] = React.useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [excelHeaders, setExcelHeaders] = React.useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [activeDashboardFilter, setActiveDashboardFilter] = React.useState<ActiveFilterType>(null);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const unsubscribeRef = React.useRef<(() => void) | null>(null);

  // ─── Inicialização ───────────────────────────────────────────
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('texflow-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
    const handleBeforeInstallPrompt = (e: any) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallBanner(true); };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ─── Subscrição Firebase em Tempo Real ───────────────────────
  React.useEffect(() => {
    if (!currentUser) return;
    setIsLoading(true);

    loadStopReasonsFromFirebase()
      .then(saved => { if (saved) setStopReasons(saved); })
      .catch(err => console.error('[Firebase] Erro ao carregar motivos:', err));

    const unsub = subscribeToOrders(
      (remoteOrders) => { setOrders(remoteOrders); setIsLoading(false); },
      (error) => {
        console.error('[Firebase] Erro:', error);
        setIsLoading(false);
        setNotification({ message: 'Erro de ligação ao Firebase.', type: 'info' });
      }
    );

    unsubscribeRef.current = unsub;
    return () => { if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; } };
  }, [currentUser]);

  // ─── Auto-dismiss notificação ────────────────────────────────
  React.useEffect(() => {
    if (notification) { const t = setTimeout(() => setNotification(null), 6000); return () => clearTimeout(t); }
  }, [notification]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('texflow-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // ─── Actualizar encomenda ────────────────────────────────────
  const handleUpdateOrder = async (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    try { await saveOrderToFirebase(updatedOrder); }
    catch (err) { console.error('[Firebase] Erro ao guardar:', err); setNotification({ message: 'Erro ao guardar no Firebase.', type: 'info' }); }
  };

  const handleUpdatePriority = async (docNr: string, priority: number) => {
    const toUpdate = orders.filter(o => o.docNr === docNr).map(o => ({ ...o, priority }));
    setOrders(prev => prev.map(o => o.docNr === docNr ? { ...o, priority } : o));
    try { await Promise.all(toUpdate.map(o => saveOrderToFirebase(o))); }
    catch (err) { console.error('[Firebase] Erro prioridade:', err); }
  };

  const handleUpdateManual = async (docNr: string, isManual: boolean) => {
    const toUpdate = orders.filter(o => o.docNr === docNr).map(o => ({ ...o, isManual }));
    setOrders(prev => prev.map(o => o.docNr === docNr ? { ...o, isManual } : o));
    try { await Promise.all(toUpdate.map(o => saveOrderToFirebase(o))); }
    catch (err) { console.error('[Firebase] Erro manual:', err); }
  };

  const handleUpdateStopReason = async (docNr: string, sectorId: string, stopReason: string) => {
    const toUpdate = orders.filter(o => o.docNr === docNr)
      .map(o => ({ ...o, sectorStopReasons: { ...(o.sectorStopReasons ?? {}), [sectorId]: stopReason } }));
    setOrders(prev => prev.map(o => o.docNr === docNr ? { ...o, sectorStopReasons: { ...(o.sectorStopReasons ?? {}), [sectorId]: stopReason } } : o));
    try { await Promise.all(toUpdate.map(o => saveOrderToFirebase(o))); }
    catch (err) { console.error('[Firebase] Erro motivo:', err); }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try { await deleteOrderFromFirebase(orderId); setNotification({ message: 'Item removido com sucesso.', type: 'success' }); }
    catch (error) { console.error(error); setNotification({ message: 'Erro ao remover item.', type: 'info' }); }
  };

  const handleDeleteDoc = async (docNr: string) => {
    try { await deleteDocFromFirebase(docNr, orders); setNotification({ message: `Documento ${docNr} removido.`, type: 'success' }); }
    catch (error) { console.error(error); setNotification({ message: 'Erro ao remover documento.', type: 'info' }); }
  };

  const handleUpdateStopReasonsHierarchy = async (newHierarchy: any[]) => {
    setStopReasons(newHierarchy);
    try { await saveStopReasonsToFirebase(newHierarchy); }
    catch (err) { console.error('[Firebase] Erro motivos:', err); }
  };

  // ─── IMPORTAÇÃO EXCEL -> FIREBASE (só admin) ─────────────────
  const handleImport = async (
    _baseData: { orders: Order[]; headers: Record<string, string> } | null,
    newData: { orders: Order[]; headers: Record<string, string> } | null
  ) => {
    if (!newData || newData.orders.length === 0) {
      setNotification({ message: 'Nenhum dado válido no ficheiro Excel.', type: 'info' });
      setIsImportModalOpen(false);
      return;
    }
    setIsLoading(true);
    setIsImportModalOpen(false);
    try {
      const { added, updated } = await mergeExcelToFirebase(newData.orders, orders);
      if (newData.headers) setExcelHeaders(newData.headers);
      setNotification({
        message: `Firebase actualizado: ${added} linha(s) nova(s), ${updated} actualizada(s). Todos sincronizados.`,
        type: 'success',
      });
      setActiveView('orders');
    } catch (err) {
      console.error('[Firebase] Erro no merge:', err);
      setNotification({ message: 'Erro ao actualizar o Firebase. Tente novamente.', type: 'info' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('ATENÇÃO: Apagar TODOS os dados do Firebase?\n\nAfecta TODOS os utilizadores. Esta acção é irreversível.')) {
      setIsLoading(true);
      try {
        await Promise.all(orders.map(o => deleteOrderFromFirebase(o.id)));
        setOrders([]);
        setExcelHeaders({});
        setStopReasons(STOP_REASONS_HIERARCHY);
        setActiveView('dashboard');
        setNotification({ message: 'Base de dados Firebase limpa com sucesso.', type: 'success' });
      } catch (error) {
        console.error(error);
        setNotification({ message: 'Erro ao limpar dados.', type: 'info' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const selectedOrder = React.useMemo(() => orders.find(o => o.id === selectedOrderId) || null, [orders, selectedOrderId]);
  const handleViewDetails = React.useCallback((order: Order) => { setSelectedOrderId(order.id); }, []);
  const handleNavigateToOrders = (filter: ActiveFilterType) => { setActiveDashboardFilter(filter); setActiveView('orders'); };
  const handleSetActiveView = (view: string) => { if (view !== 'orders') setActiveDashboardFilter(null); setActiveView(view); };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 dark:text-slate-500">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p className="text-sm font-medium">A sincronizar com o Firebase...</p>
          <p className="text-xs text-slate-400">Dados em tempo real para todos os utilizadores</p>
        </div>
      );
    }
    if (activeView.startsWith('sector-')) {
      const sectorId = activeView.replace('sector-', '');
      const sector = SECTORS.find(s => s.id === sectorId);
      return (
        <div className="flex flex-col h-full">
          <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              {sector?.icon && React.createElement(sector.icon, { size: 24 })}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Sector: {sector?.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Listagem de encomendas</p>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <SectorOrderTable orders={orders} sector={sector!} onViewDetails={handleViewDetails} onUpdateOrder={handleUpdateOrder} stopReasonsHierarchy={stopReasons} />
          </div>
        </div>
      );
    }
    switch (activeView) {
      case 'dashboard': return <Dashboard orders={orders} onNavigateToOrders={handleNavigateToOrders} />;
      case 'orders': return <OrderTable orders={orders} onViewDetails={handleViewDetails} excelHeaders={excelHeaders} activeFilter={activeDashboardFilter} user={currentUser} onUpdatePriority={handleUpdatePriority} onUpdateManual={handleUpdateManual} onUpdateStopReason={handleUpdateStopReason} onDeleteOrder={handleDeleteOrder} onDeleteDoc={handleDeleteDoc} stopReasonsHierarchy={stopReasons} />;
      case 'timeline': return <OrderTimeline orders={orders} onViewDetails={handleViewDetails} />;
      case 'config': return <Settings currentTheme={theme} onToggleTheme={toggleTheme} onResetData={handleResetData} />;
      case 'stop-reasons': return <StopReasons hierarchy={stopReasons} onUpdateHierarchy={handleUpdateStopReasonsHierarchy} />;
      default: return <Dashboard orders={orders} />;
    }
  };

  const alertCount = React.useMemo(() => orders.filter(o => { const now = new Date(); return o.requestedDate && o.requestedDate < now && o.qtyOpen > 0; }).length, [orders]);

  if (!currentUser) {
    return <Login onLogin={user => { setCurrentUser(user); setActiveView(user.role === 'admin' ? 'dashboard' : 'orders'); }} />;
  }

  return (
    <>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 flex items-center justify-center gap-2 z-[120]">
          <WifiOff size={12} /> Modo Offline — Sincronização suspensa
        </div>
      )}
      {isOnline && (
        <div className="fixed top-2 right-16 z-[119] flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full pointer-events-none">
          <Cloud size={10} /> Firebase • Em directo
        </div>
      )}
      {showInstallBanner && (
        <div className="fixed bottom-20 md:bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 z-[110]">
          <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg"><Download size={20} /></div>
              <div><h4 className="font-bold text-xs uppercase">Instalar TexFlow</h4><p className="text-[10px] opacity-80">Aceda mais rápido.</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleInstallClick} className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">Instalar</button>
              <button onClick={() => setShowInstallBanner(false)} className="p-1 hover:bg-white/10 rounded-full"><X size={16} /></button>
            </div>
          </div>
        </div>
      )}
      {notification && (
        <div className="fixed top-6 right-6 z-[115] animate-in slide-in-from-right duration-300 max-w-md">
          <div className="bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-start gap-4 border border-slate-700">
            <div className="bg-emerald-500 rounded-full p-1 mt-0.5 shrink-0 text-slate-900"><CheckCircle2 size={16} strokeWidth={3} /></div>
            <div>
              <h4 className="font-bold text-sm mb-1">{notification.type === 'success' ? 'Sucesso' : 'Informação'}</h4>
              <p className="text-sm text-slate-300 font-medium leading-snug">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-white"><X size={16} /></button>
          </div>
        </div>
      )}
      <Layout activeView={activeView} setActiveView={handleSetActiveView} onImportClick={() => setIsImportModalOpen(true)} alertCount={alertCount} user={currentUser} onLogout={() => setCurrentUser(null)}>
        {renderContent()}
      </Layout>
      {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrderId(null)} onUpdateOrder={handleUpdateOrder} user={currentUser} stopReasonsHierarchy={stopReasons} />}
      {isImportModalOpen && <ImportModal onClose={() => setIsImportModalOpen(false)} onImport={handleImport} currentUser={currentUser} />}
    </>
  );
};

export default App;
