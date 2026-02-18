
import { Sector } from './types';
import { 
  Waves, 
  Layers, 
  Droplets, 
  Scissors, 
  Package, 
  Truck 
} from 'lucide-react';

export const SECTORS: (Sector & { icon: any })[] = [
  { id: 'tecelagem', name: 'Tecelagem', orderIndex: 0, icon: Waves },
  { id: 'felpo_cru', name: 'Felpo Cru', orderIndex: 1, icon: Layers },
  { id: 'tinturaria', name: 'Tinturaria', orderIndex: 2, icon: Droplets },
  { id: 'confeccao', name: 'Confecção', orderIndex: 3, icon: Scissors },
  { id: 'embalagem', name: 'Embalagem/Acabamento', orderIndex: 4, icon: Package },
  { id: 'expedicao', name: 'Stock/Expedição', orderIndex: 5, icon: Truck },
];

export const STATUS_COLORS = {
  COMPLETED: 'bg-emerald-500',
  IN_PROGRESS: 'bg-amber-500',
  LATE: 'bg-rose-500',
  NOT_STARTED: 'bg-slate-300',
};

export const SECTOR_COLUMNS: Record<string, string[]> = {
  tecelagem: ['qtyRequested'],
  felpo_cru: ['felpoCruQty'],
  tinturaria: ['tinturariaQty'],
  confeccao: ['confRoupoesQty', 'confFelposQty'],
  embalagem: ['embAcabQty'],
  expedicao: ['stockCxQty'],
};
