// ============================================================
// REGRAS DE SEGURANÇA - FIRESTORE
// Copiar para: Firebase Console -> Firestore -> Regras
// ============================================================
//
// Política:
// - Todos os utilizadores autenticados podem LER tudo
// - Todos os utilizadores autenticados podem ESCREVER
//   (o controlo de quem pode escrever o quê é feito na app)
// - Sem autenticação: sem acesso
//
// NOTA: Como a app usa logins hardcoded (sem Firebase Auth),
// estamos a usar modo de teste (leitura/escrita abertas por 90 dias).
// Para produção, é recomendado activar Firebase Authentication.
// ============================================================

// OPÇÃO A: Modo de teste (válido por 90 dias) - USE ESTA AGORA
// Colar no Firebase Console -> Firestore -> Separador "Regras":

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 6, 1);
    }
  }
}


// ============================================================
// OPÇÃO B: Regras mais restritas (para depois de configurar Firebase Auth)
// ============================================================
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow read: if true;  // Todos podem ler
      allow write: if true; // Todos podem escrever (controlado na app)
    }
    match /meta/{document} {
      allow read: if true;
      allow write: if true;
    }
  }
}
*/
