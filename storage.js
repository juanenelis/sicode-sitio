// Reemplazo de window.storage (solo disponible dentro de Claude.ai) usando Firebase Firestore.
// Mantiene la misma forma de uso: storage.set(key, value, shared), storage.get(key, shared),
// storage.delete(key, shared), storage.list(prefix, shared).
// Las claves tienen el formato "coleccion:id" (ej. "comentarios:1699999999999").

import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

function splitKey(key) {
  const idx = key.indexOf(":");
  if (idx === -1) return { coll: key, id: "root" };
  return { coll: key.slice(0, idx), id: key.slice(idx + 1) };
}

// Si una operación tarda más de 15 segundos (por ejemplo, por una red que bloquea
// la conexión), la cancelamos con un error en vez de dejarla colgada para siempre.
function withTimeout(promise, ms = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Tiempo de espera agotado. Revisa tu conexión a internet.")), ms)
    ),
  ]);
}

export const storage = {
  async set(key, value /*, shared */) {
    const { coll, id } = splitKey(key);
    await withTimeout(setDoc(doc(db, coll, id), { value }));
    return { key, value };
  },

  async get(key /*, shared */) {
    const { coll, id } = splitKey(key);
    const snap = await withTimeout(getDoc(doc(db, coll, id)));
    if (!snap.exists()) throw new Error("not found: " + key);
    return { key, value: snap.data().value };
  },

  async delete(key /*, shared */) {
    const { coll, id } = splitKey(key);
    await withTimeout(deleteDoc(doc(db, coll, id)));
    return { key, deleted: true };
  },

  async list(prefix /*, shared */) {
    const coll = prefix.endsWith(":") ? prefix.slice(0, -1) : prefix;
    const snap = await withTimeout(getDocs(collection(db, coll)));
    return { keys: snap.docs.map((d) => prefix + d.id) };
  },
};
