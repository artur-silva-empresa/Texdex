# TexFlow — Guia de Integração Firebase
## Passo a passo para activar a sincronização em tempo real

---

## FICHEIROS MODIFICADOS / NOVOS

| Ficheiro | Alteração |
|---|---|
| `services/firebaseConfig.ts` | **NOVO** — Configuração do Firebase |
| `services/firebaseService.ts` | **NOVO** — Todas as funções Firebase (subscrição, merge, etc.) |
| `App.tsx` | **SUBSTITUÍDO** — Usa Firebase em vez de IndexedDB |
| `components/Login.tsx` | **SUBSTITUÍDO** — Utilizadores por sector, passwords individuais |
| `components/ImportModal.tsx` | **SUBSTITUÍDO** — Upload Excel directo para Firebase (só admin) |
| `package.json` | **MODIFICADO** — Adicionada dependência `firebase` |

---

## PASSO 1 — Instalar a dependência Firebase

No terminal, dentro da pasta do projecto:

```bash
npm install firebase
```

---

## PASSO 2 — Configurar as Regras do Firestore

1. Vai ao Firebase Console: https://console.firebase.google.com
2. Selecciona o projecto **texflow-3687d**
3. No menu lateral: **Firestore Database** → separador **Regras**
4. Substitui o conteúdo pelo seguinte e clica **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 6, 1);
    }
  }
}
```

> ⚠️ Esta regra permite acesso aberto até Junho 2026.
> É suficiente para uso interno na empresa.

---

## PASSO 3 — Substituir os Ficheiros

Copia os ficheiros desta pasta para o teu projecto:

```
services/firebaseConfig.ts   → copiar para pasta services/
services/firebaseService.ts  → copiar para pasta services/
App.tsx                      → substituir o App.tsx existente
components/Login.tsx         → substituir o Login.tsx existente
components/ImportModal.tsx   → substituir o ImportModal.tsx existente
package.json                 → substituir o package.json existente
```

---

## PASSO 4 — Build e Deploy

```bash
npm install        # instalar nova dependência firebase
npm run build      # compilar a aplicação
```

Depois copiar o conteúdo da pasta `dist/` para o GitHub Pages
(ou usar `gh-pages` como de costume).

---

## UTILIZADORES CONFIGURADOS

| Username | Password | Nome | Acesso |
|---|---|---|---|
| `plan` | `Lasa` | Planeamento | Admin (importa Excel, edita tudo) |
| `tecelagem` | `tec123` | Tecelagem | Sector Tecelagem |
| `tinturaria` | `tin123` | Tinturaria | Sector Tinturaria |
| `confeccao` | `conf123` | Confecção | Sector Confecção |
| `embalagem` | `emb123` | Embalagem/Acabamento | Sector Embalagem |
| `expedicao` | `exp123` | Stock/Expedição | Sector Expedição |
| `lasa` | *(sem password)* | Utilizador Lasa | Visualização geral |

### Para alterar passwords ou adicionar utilizadores:
Editar o array `USERS` no ficheiro `components/Login.tsx`

---

## COMO FUNCIONA O UPLOAD EXCEL

1. O utilizador **Planeamento (plan)** faz login
2. Clica no botão de importação
3. Selecciona o ficheiro `.xlsx` exportado do ERP
4. Clica **Enviar para Firebase**
5. O sistema faz merge inteligente:
   - Actualiza campos do Excel nas linhas existentes
   - **Preserva**: observações, prioridades, motivos de paragem
   - Adiciona linhas novas
6. **Todos os outros utilizadores recebem os dados actualizados instantaneamente**

---

## LIMITES GRATUITOS DO FIREBASE

| Recurso | Limite Gratuito | Uso Estimado (20 utilizadores) |
|---|---|---|
| Leituras/dia | 50.000 | ~5.000 ✅ |
| Escritas/dia | 20.000 | ~2.000 ✅ |
| Armazenamento | 1 GB | ~10 MB ✅ |
| Ligações simultâneas | Ilimitadas | 20 ✅ |

---

## ESTRUTURA NO FIRESTORE

```
texflow-3687d (projecto)
└── orders (colecção)
│   └── ENC001-1 (documento = id da encomenda)
│       ├── docNr, clientName, qtyRequested, ...  ← dados do Excel
│       ├── priority, isManual                    ← dados da app
│       ├── sectorObservations: {}                ← comentários por sector
│       ├── sectorPredictedDates: {}              ← datas previstas
│       └── sectorStopReasons: {}                 ← motivos de paragem
└── meta (colecção)
    └── stop_reasons                              ← hierarquia de motivos
```
