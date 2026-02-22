import React from 'react';
import { X, FileCheck, Loader2, AlertCircle, Cloud, FileSpreadsheet, RefreshCw, ShieldAlert } from 'lucide-react';
import { parseExcelFile } from '../services/dataService';
import { Order, User } from '../types';

interface ImportModalProps {
  onClose: () => void;
  onImport: (
    baseData: { orders: Order[]; headers: Record<string, string> } | null,
    newData: { orders: Order[]; headers: Record<string, string> } | null
  ) => void;
  currentUser: User | null;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport, currentUser }) => {
  const [fileNew, setFileNew] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setFileNew(file);
      } else {
        setError('Utilize ficheiros Excel (.xlsx)');
      }
    }
  };

  const handleSubmit = async () => {
    if (!fileNew || !isAdmin) return;
    setIsProcessing(true);
    setError(null);
    try {
      const newData = await parseExcelFile(fileNew);
      onImport(null, newData);
    } catch (err) {
      console.error(err);
      setError('Erro ao processar o ficheiro Excel. Verifique o formato.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Cloud size={20} className="text-blue-500" />
              Actualizar Firebase
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Upload Excel → Merge inteligente → Sincronização para todos
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-5">

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-700">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Bloqueio para não-admins */}
          {!isAdmin ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-amber-100 rounded-full">
                <ShieldAlert size={28} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800 mb-1">Acesso Restrito</h3>
                <p className="text-sm text-amber-700">
                  Apenas o utilizador <strong>Planeamento (admin)</strong> pode fazer upload de dados para o Firebase.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Upload Excel */}
              <div className={`p-5 rounded-2xl border-2 border-dashed transition-all ${fileNew ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${fileNew ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Ficheiro Excel do ERP</h3>
                    <p className="text-xs text-slate-500">Formato .xlsx exportado do programa da empresa</p>
                  </div>
                </div>

                <label className="block">
                  <div className={`cursor-pointer py-3 px-4 rounded-xl border text-center text-sm font-bold transition-all ${fileNew ? 'bg-white border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {fileNew
                      ? <span className="flex items-center justify-center gap-2"><FileCheck size={16} /> {fileNew.name}</span>
                      : <span className="flex items-center justify-center gap-2"><FileSpreadsheet size={16} /> Selecionar ficheiro .xlsx</span>
                    }
                  </div>
                  <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileChange} />
                </label>
              </div>

              {/* Explicação do merge */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <RefreshCw size={12} /> Como funciona o merge
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    <span>Linhas existentes: actualiza dados do Excel, <strong>preserva</strong> observações, prioridades e motivos de paragem</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">+</span>
                    <span>Linhas novas: adicionadas automaticamente ao Firebase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold mt-0.5">→</span>
                    <span>Após o upload, <strong>todos os utilizadores</strong> recebem os dados actualizados instantaneamente</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex gap-3 justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition-colors text-xs uppercase tracking-widest"
          >
            {isAdmin ? 'Cancelar' : 'Fechar'}
          </button>
          {isAdmin && (
            <button
              onClick={handleSubmit}
              disabled={!fileNew || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 text-xs uppercase tracking-widest flex items-center gap-2"
            >
              {isProcessing ? (
                <><Loader2 size={16} className="animate-spin" /> A processar...</>
              ) : (
                <><Cloud size={16} /> Enviar para Firebase</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
