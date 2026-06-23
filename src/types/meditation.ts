// Meditation library type contracts.
//
// D-07: a meditation record stores id, filename, duration, blob, addedAt.
// D-08: filename IS the title — there is no separate user-editable title field.
// D-06: blobs live in IndexedDB (the persistence boundary is the meditationsDB
// module); these types describe the shape that crosses it.

export type MeditationView = 'library' | 'playing';

export interface MeditationRecord {
  id: string;          // crypto.randomUUID() at the call site — string, not number
  filename: string;    // user-uploaded filename, used as title (D-08)
  duration: number;    // seconds, extracted on import (D-07)
  blob: Blob;          // audio binary stored in IDB (D-06)
  addedAt: number;     // Date.now() — used as the sort index for listMeditations
}
