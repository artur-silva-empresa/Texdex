import React from 'react';
import { User, UserRole } from '../types';
import { Lock, User as UserIcon, ArrowRight, AlertCircle } from 'lucide-react';

// ============================================================
// UTILIZADORES DO SISTEMA
// Para adicionar um novo utilizador, basta acrescentar uma linha
// à lista abaixo com: username, password, name, role e sector.
//
// role: 'admin'  -> pode importar Excel, ver tudo, editar tudo
// role: 'viewer' -> pode ver tudo, só edita comentários do seu sector
//
// sector: corresponde ao id do sector em constants.ts:
//   'tecelagem' | 'felpo_cru' | 'tinturaria' | 'confeccao' | 'embalagem' | 'expedicao'
//   ou 'all' para acesso a todos os sectores
// ============================================================

interface UserConfig {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  sector?: string;
}

const USERS: UserConfig[] = [
  // ── Administrador ────────────────────────────────────────
  { username: 'plan',       password: 'Lasa',      name: 'Planeamento',            role: 'admin',  sector: 'all' },

  // ── Sectores ─────────────────────────────────────────────
  { username: 'tecelagem',  password: 'tec123',    name: 'Tecelagem',              role: 'viewer', sector: 'tecelagem' },
  { username: 'tinturaria', password: 'tin123',    name: 'Tinturaria',             role: 'viewer', sector: 'tinturaria' },
  { username: 'confeccao',  password: 'conf123',   name: 'Confecção',              role: 'viewer', sector: 'confeccao' },
  { username: 'embalagem',  password: 'emb123',    name: 'Embalagem/Acabamento',   role: 'viewer', sector: 'embalagem' },
  { username: 'expedicao',  password: 'exp123',    name: 'Stock/Expedição',        role: 'viewer', sector: 'expedicao' },

  // ── Acesso geral (visualização) ───────────────────────────
  { username: 'lasa',       password: '',          name: 'Utilizador Lasa',        role: 'viewer', sector: 'all' },
];

// ─── Tipo User extendido com sector ──────────────────────────
// (o tipo base em types.ts já tem username, role, name)
// Passamos sector como campo extra no objecto User

interface LoginProps {
  onLogin: (user: User & { sector?: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const found = USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password
    );

    if (found) {
      onLogin({
        username: found.username,
        name: found.name,
        role: found.role,
        sector: found.sector,
      } as User & { sector?: string });
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); passwordInputRef.current?.focus(); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 bg-slate-50 border-b border-slate-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
            <span className="text-white font-black text-2xl">TF</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800">TexFlow</h1>
          <p className="text-sm text-slate-500 font-medium">Gestão de Produção Têxtil</p>
          <div className="mt-3 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Firebase • Sincronização em tempo real
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">Utilizador</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={handleUsernameKeyDown}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Nome de utilizador"
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">Palavra-passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                ref={passwordInputRef}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            Entrar no Sistema <ArrowRight size={18} />
          </button>
        </form>

        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium">© 2026 TexFlow Lasa. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
