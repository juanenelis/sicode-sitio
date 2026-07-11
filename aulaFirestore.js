// ============================================================
// Persistencia del Aula Virtual usando Firestore.
// useFirestoreState funciona como useState, pero además guarda y
// sincroniza el valor en un documento de Firestore en tiempo real,
// para que directores, profesores y estudiantes vean los mismos
// datos sin importar desde qué computadora o celular entren.
// ============================================================
import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

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
