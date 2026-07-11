// ============================================================
// Persistencia del Aula Virtual usando Firestore.
// useFirestoreState funciona como useState, pero además guarda y
// sincroniza el valor en un documento de Firestore en tiempo real,
// para que directores, profesores y estudiantes vean los mismos
// datos sin importar desde qué computadora o celular entren.
// ============================================================
import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc, deleteDoc, collection, getDoc, getDocs } from "firebase/firestore";

const COLECCION = "aula_data";

export function useFirestoreState(docId, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);
  const initialRef = useRef(initialValue);
  const sembradoRef = useRef(false);

  useEffect(() => {
    const ref = doc(db, COLECCION, docId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          try {
            const parsed = JSON.parse(snap.data().json);
            setValue(parsed);
          } catch {
            setValue(initialRef.current);
          }
        } else if (!sembradoRef.current) {
          // Primera vez que se usa este documento: sembramos el valor inicial.
          sembradoRef.current = true;
          setDoc(ref, { json: JSON.stringify(initialRef.current) }).catch(() => {});
          setValue(initialRef.current);
        }
        setLoaded(true);
      },
      () => setLoaded(true)
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const setState = useCallback(
    (updater) => {
      setValue((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        setDoc(doc(db, COLECCION, docId), { json: JSON.stringify(next) }).catch(() => {});
        return next;
      });
    },
    [docId]
  );

  return [value, setState, loaded];
}

// ============================================================
// Migración de una sola vez: si el sitio ya tenía usuarios/cursos/etc.
// guardados en el formato antiguo (todo en un solo documento gigante),
// los copiamos a las colecciones nuevas (documento por documento) antes
// de que useFirestoreCollection empiece a usarlas. Así nadie pierde lo
// que ya tenía cargado. Se ejecuta una sola vez por sitio; después
// queda marcada como hecha y no se repite.
// ============================================================
export async function migrarDatosAntiguos() {
  const banderaRef = doc(db, "aula_data", "_migrado_v2");
  try {
    const bandera = await getDoc(banderaRef);
    if (bandera.exists()) return;
  } catch {
    return;
  }

  const mapa = [
    { blobId: "usuarios", coleccion: "aula_usuarios", keyFn: (u) => u.correoLogin },
    { blobId: "cursos", coleccion: "aula_cursos", keyFn: (c) => c.id },
    { blobId: "biblioteca", coleccion: "aula_biblioteca", keyFn: (b) => b.id },
    { blobId: "grupos", coleccion: "aula_grupos", keyFn: (g) => g.id },
    { blobId: "alertas", coleccion: "aula_alertas", keyFn: (a) => a.id },
  ];

  for (const m of mapa) {
    try {
      const blobSnap = await getDoc(doc(db, "aula_data", m.blobId));
      if (!blobSnap.exists()) continue;
      const arr = JSON.parse(blobSnap.data().json || "[]");
      if (!Array.isArray(arr) || arr.length === 0) continue;
      const yaExiste = await getDocs(collection(db, m.coleccion));
      if (!yaExiste.empty) continue; // ya se migró o ya tiene datos nuevos, no tocar
      await Promise.all(arr.map((item) => setDoc(doc(db, m.coleccion, String(m.keyFn(item))), item).catch(() => {})));
    } catch {
      // si algo falla con una colección, seguimos con las demás
    }
  }

  await setDoc(banderaRef, { hecho: true, fecha: new Date().toISOString() }).catch(() => {});
}

// ============================================================
// useFirestoreCollection: igual que useState, pero cada elemento de la
// lista vive como SU PROPIO documento de Firestore (no todos amontonados
// en un solo documento gigante). Esto evita que dos personas editando
// cosas distintas (dos cursos distintos, dos cuentas distintas) se
// sobrescriban entre sí — cada quien escribe solo su propio documento.
// Se usa exactamente igual que useFirestoreState / useState:
//   const [usuarios, setUsuarios] = useFirestoreCollection("aula_usuarios", u => u.correoLogin, semilla);
//   setUsuarios(us => [...us, nuevo]);   // sigue funcionando igual que antes
// ============================================================
export function useFirestoreCollection(collectionName, keyFn, initialSeed = [], enabled = true) {
  const [items, setItems] = useState(initialSeed);
  const [loaded, setLoaded] = useState(false);
  const sembradoRef = useRef(false);
  const seedRef = useRef(initialSeed);

  useEffect(() => {
    if (!enabled) return;
    const colRef = collection(db, collectionName);
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (snap.empty && !sembradoRef.current && seedRef.current.length > 0) {
          sembradoRef.current = true;
          Promise.all(
            seedRef.current.map((item) => setDoc(doc(db, collectionName, String(keyFn(item))), item).catch(() => {}))
          );
          return; // el propio onSnapshot recibirá los documentos recién sembrados
        }
        const arr = snap.docs.map((d) => d.data());
        setItems(arr);
        setLoaded(true);
      },
      () => setLoaded(true)
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, enabled]);

  const setArray = useCallback(
    (updater) => {
      setItems((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        const prevByKey = new Map(prev.map((it) => [String(keyFn(it)), it]));
        const nextKeys = new Set(next.map((it) => String(keyFn(it))));
        // Borrar documentos de items que ya no están en la lista nueva.
        prevByKey.forEach((_, k) => {
          if (!nextKeys.has(k)) deleteDoc(doc(db, collectionName, k)).catch(() => {});
        });
        // Guardar solo los documentos nuevos o que realmente cambiaron.
        next.forEach((item) => {
          const k = String(keyFn(item));
          const anterior = prevByKey.get(k);
          if (!anterior || JSON.stringify(anterior) !== JSON.stringify(item)) {
            setDoc(doc(db, collectionName, k), item).catch(() => {});
          }
        });
        return next;
      });
    },
    [collectionName]
  );

  return [items, setArray, loaded];
}
