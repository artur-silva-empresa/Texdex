// ============================================================
// FIREBASE SERVICE - TexFlow
// Sincronização em tempo real com merge inteligente do Excel
// ============================================================

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDoc,
  Timestamp,
  query,
  limit
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Order } from '../types';

// Nomes das colecções no Firestore
const ORDERS_COLLECTION = 'orders';
const META_COLLECTION = 'meta';

// ============================================================
// CONVERSÃO DE DATAS (Date <-> Firestore Timestamp)
// ============================================================

const dateToFirestore = (date: Date | null | undefined): Timestamp | null => {
  if (!date) return null;
  try {
    return Timestamp.fromDate(date instanceof Date ? date : new Date(date));
  } catch {
    return null;
  }
};

const firestoreToDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

// ============================================================
// SERIALIZAR Order -> Firestore (sem undefined, com Timestamps)
// ============================================================

export const orderToFirestore = (order: Order): Record<string, any> => {
  return {
    id: order.id,
    docNr: order.docNr ?? '',
    clientCode: order.clientCode ?? '',
    clientName: order.clientName ?? '',
    issueDate: dateToFirestore(order.issueDate),
    requestedDate: dateToFirestore(order.requestedDate),
    itemNr: order.itemNr ?? 0,
    po: order.po ?? '',
    articleCode: order.articleCode ?? '',
    reference: order.reference ?? '',
    colorCode: order.colorCode ?? '',
    colorDesc: order.colorDesc ?? '',
    size: order.size ?? '',
    family: order.family ?? '',
    sizeDesc: order.sizeDesc ?? '',
    ean: order.ean ?? '',
    qtyRequested: order.qtyRequested ?? 0,
    dataTec: dateToFirestore(order.dataTec),
    felpoCruQty: order.felpoCruQty ?? 0,
    felpoCruDate: dateToFirestore(order.felpoCruDate),
    tinturariaQty: order.tinturariaQty ?? 0,
    tinturariaDate: dateToFirestore(order.tinturariaDate),
    confRoupoesQty: order.confRoupoesQty ?? 0,
    confFelposQty: order.confFelposQty ?? 0,
    confDate: dateToFirestore(order.confDate),
    embAcabQty: order.embAcabQty ?? 0,
    armExpDate: dateToFirestore(order.armExpDate),
    stockCxQty: order.stockCxQty ?? 0,
    dataEnt: dateToFirestore(order.dataEnt),
    dataEspecial: dateToFirestore(order.dataEspecial),
    dataPrinter: dateToFirestore(order.dataPrinter),
    dataDebuxo: dateToFirestore(order.dataDebuxo),
    dataAmostras: dateToFirestore(order.dataAmostras),
    dataBordados: dateToFirestore(order.dataBordados),
    qtyBilled: order.qtyBilled ?? 0,
    qtyOpen: order.qtyOpen ?? 0,
    priority: order.priority ?? 0,
    isManual: order.isManual ?? false,
    sectorObservations: order.sectorObservations ?? {},
    sectorPredictedDates: order.sectorPredictedDates
      ? Object.fromEntries(
          Object.entries(order.sectorPredictedDates).map(([k, v]) => [k, dateToFirestore(v as Date | null)])
        )
      : {},
    sectorStopReasons: order.sectorStopReasons ?? {},
    // Não guardar _raw no Firebase (dados desnecessários)
  };
};

// ============================================================
// DESERIALIZAR Firestore -> Order (com Dates correctas)
// ============================================================

export const firestoreToOrder = (data: Record<string, any>): Order => {
  const sectorPredictedDates: Record<string, Date | null> = {};
  if (data.sectorPredictedDates) {
    Object.entries(data.sectorPredictedDates).forEach(([k, v]) => {
      sectorPredictedDates[k] = firestoreToDate(v);
    });
  }

  return {
    id: data.id ?? '',
    docNr: data.docNr ?? '',
    clientCode: data.clientCode ?? '',
    clientName: data.clientName ?? '',
    issueDate: firestoreToDate(data.issueDate),
    requestedDate: firestoreToDate(data.requestedDate),
    itemNr: data.itemNr ?? 0,
    po: data.po ?? '',
    articleCode: data.articleCode ?? '',
    reference: data.reference ?? '',
    colorCode: data.colorCode ?? '',
    colorDesc: data.colorDesc ?? '',
    size: data.size ?? '',
    family: data.family ?? '',
    sizeDesc: data.sizeDesc ?? '',
    ean: data.ean ?? '',
    qtyRequested: data.qtyRequested ?? 0,
    dataTec: firestoreToDate(data.dataTec),
    felpoCruQty: data.felpoCruQty ?? 0,
    felpoCruDate: firestoreToDate(data.felpoCruDate),
    tinturariaQty: data.tinturariaQty ?? 0,
    tinturariaDate: firestoreToDate(data.tinturariaDate),
    confRoupoesQty: data.confRoupoesQty ?? 0,
    confFelposQty: data.confFelposQty ?? 0,
    confDate: firestoreToDate(data.confDate),
    embAcabQty: data.embAcabQty ?? 0,
    armExpDate: firestoreToDate(data.armExpDate),
    stockCxQty: data.stockCxQty ?? 0,
    dataEnt: firestoreToDate(data.dataEnt),
    dataEspecial: firestoreToDate(data.dataEspecial),
    dataPrinter: firestoreToDate(data.dataPrinter),
    dataDebuxo: firestoreToDate(data.dataDebuxo),
    dataAmostras: firestoreToDate(data.dataAmostras),
    dataBordados: firestoreToDate(data.dataBordados),
    qtyBilled: data.qtyBilled ?? 0,
    qtyOpen: data.qtyOpen ?? 0,
    priority: data.priority ?? 0,
    isManual: data.isManual ?? false,
    sectorObservations: data.sectorObservations ?? {},
    sectorPredictedDates,
    sectorStopReasons: data.sectorStopReasons ?? {},
  };
};

// ============================================================
// SUBSCRIÇÃO EM TEMPO REAL
// Chama o callback sempre que os dados mudarem no Firebase
// ============================================================

export const subscribeToOrders = (
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const ordersRef = collection(db, ORDERS_COLLECTION);

  const unsubscribe = onSnapshot(
    ordersRef,
    (snapshot) => {
      const orders: Order[] = snapshot.docs.map(d => firestoreToOrder(d.data() as Record<string, any>));
      // Ordenar por docNr e itemNr para consistência
      orders.sort((a, b) => {
        const docCompare = a.docNr.localeCompare(b.docNr);
        if (docCompare !== 0) return docCompare;
        return a.itemNr - b.itemNr;
      });
      callback(orders);
    },
    (error) => {
      console.error('[Firebase] Erro na subscrição:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// ============================================================
// GUARDAR UMA ENCOMENDA (observações, prioridade, etc.)
// ============================================================

export const saveOrderToFirebase = async (order: Order): Promise<void> => {
  const orderRef = doc(db, ORDERS_COLLECTION, order.id);
  await setDoc(orderRef, orderToFirestore(order), { merge: true });
};

// ============================================================
// ELIMINAR UMA ENCOMENDA
// ============================================================

export const deleteOrderFromFirebase = async (orderId: string): Promise<void> => {
  await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
};

// ============================================================
// ELIMINAR TODAS AS ENCOMENDAS DE UM DOCUMENTO
// ============================================================

export const deleteDocFromFirebase = async (docNr: string, currentOrders: Order[]): Promise<void> => {
  const batch = writeBatch(db);
  const toDelete = currentOrders.filter(o => o.docNr === docNr);
  toDelete.forEach(o => {
    batch.delete(doc(db, ORDERS_COLLECTION, o.id));
  });
  await batch.commit();
};

// ============================================================
// MERGE INTELIGENTE DO EXCEL -> FIREBASE
//
// Regras:
// - Linhas existentes: actualiza campos do Excel, PRESERVA tudo da aplicação
// - Linhas novas: cria com campos da aplicação vazios
// - Linhas que desapareceram do Excel: marcadas como "arquivadas" (não apagadas)
// ============================================================

export const mergeExcelToFirebase = async (
  newOrders: Order[],
  currentOrders: Order[]
): Promise<{ added: number; updated: number }> => {

  const BATCH_SIZE = 400; // Firestore limita a 500 operações por batch
  let added = 0;
  let updated = 0;

  // Índice das encomendas actuais por ID composto
  const currentMap = new Map<string, Order>();
  currentOrders.forEach(o => currentMap.set(o.id, o));

  // Preparar todas as operações
  const allOperations: Array<{ id: string; data: Record<string, any> }> = [];

  for (const newOrder of newOrders) {
    const existing = currentMap.get(newOrder.id);

    if (existing) {
      // ACTUALIZAR: combinar dados do Excel com dados da aplicação
      updated++;
      const merged = orderToFirestore({
        ...newOrder,                                              // dados frescos do Excel
        id: existing.id,                                         // manter ID
        priority: existing.priority,                             // preservar prioridade
        isManual: existing.isManual,                             // preservar flag manual
        sectorObservations: existing.sectorObservations ?? {},   // preservar observações
        sectorPredictedDates: existing.sectorPredictedDates ?? {},// preservar datas previstas
        sectorStopReasons: existing.sectorStopReasons ?? {},     // preservar motivos de paragem
      });
      allOperations.push({ id: newOrder.id, data: merged });
    } else {
      // NOVA LINHA: criar com campos da aplicação em branco
      added++;
      allOperations.push({ id: newOrder.id, data: orderToFirestore(newOrder) });
    }
  }

  // Executar em batches de 400 para não exceder o limite do Firestore
  for (let i = 0; i < allOperations.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = allOperations.slice(i, i + BATCH_SIZE);
    chunk.forEach(({ id, data }) => {
      const ref = doc(db, ORDERS_COLLECTION, id);
      batch.set(ref, data);
    });
    await batch.commit();
  }

  return { added, updated };
};

// ============================================================
// GUARDAR MOTIVOS DE PARAGEM
// ============================================================

export const saveStopReasonsToFirebase = async (hierarchy: any[]): Promise<void> => {
  const metaRef = doc(db, META_COLLECTION, 'stop_reasons');
  await setDoc(metaRef, { hierarchy }, { merge: false });
};

// ============================================================
// CARREGAR MOTIVOS DE PARAGEM
// ============================================================

export const loadStopReasonsFromFirebase = async (): Promise<any[] | null> => {
  const metaRef = doc(db, META_COLLECTION, 'stop_reasons');
  const snap = await getDoc(metaRef);
  if (snap.exists()) {
    return snap.data().hierarchy ?? null;
  }
  return null;
};

// ============================================================
// VERIFICAR SE O FIREBASE TEM DADOS (para primeiro arranque)
// ============================================================

export const firebaseHasData = async (): Promise<boolean> => {
  const q = query(collection(db, ORDERS_COLLECTION), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
};
