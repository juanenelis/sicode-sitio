// ============================================================
// FORO — vive dentro de la pestaña Opiniones, a mano derecha.
// El dueño del sitio crea temas (título + descripción). Cualquier
// visitante puede entrar a un tema, dejar su opinión con calificación,
// ver el promedio del tema, y responder a las opiniones de otros
// (hilo de respuestas). Nada de esto envía correo — es solo para que
// la conversación quede visible en el sitio.
// ============================================================
import { useState, useEffect } from "react";
import { MessageSquare, Plus, Send, Star, ChevronLeft, Lock, Loader2, CornerDownRight } from "lucide-react";
import { storage } from "./storage";

const C = { navy: "#10306B", navy2: "#EEF1F4", panel: "#FFFFFF", line: "#E2E2E2", text: "#20242C", textDim: "#5B6472", blue: "#10306B", blueLight: "#10306B", gold: "#F0A500", red: "#C0392B" };
const FD = "Arial, Helvetica, sans-serif", FB = "Arial, Helvetica, sans-serif", FM = "Arial, Helvetica, sans-serif";
const inputStyle = { width: "100%", background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 13px", color: C.text, fontSize: 13.5, fontFamily: FB, outline: "none" };

const CATEGORIAS_FORO = [
  { key: "no", label: "No recomendado", score: 1, color: "#FF6B6B" },
  { key: "si", label: "Se recomienda", score: 2, color: C.gold },
  { key: "muy", label: "Muy recomendado", score: 3, color: C.blueLight },
];

async function cargarTemas() {
  try {
    const res = await storage.list("forotema:", true);
    if (!res || !res.keys) return [];
    const items = await Promise.all(res.keys.map(async (k) => {
      try { const r = await storage.get(k, true); return r ? { key: k, ...JSON.parse(r.value) } : null; }
      catch { return null; }
    }));
    return items.filter(Boolean).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  } catch { return []; }
}

async function cargarPosts(temaId) {
  try {
    const res = await storage.list("foropost:" + temaId + "_", true);
    if (!res || !res.keys) return [];
    const items = await Promise.all(res.keys.map(async (k) => {
      try { const r = await storage.get(k, true); return r ? { key: k, ...JSON.parse(r.value) } : null; }
      catch { return null; }
    }));
    return items.filter(Boolean).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  } catch { return []; }
}

export default function ForoPanel({ isAdmin }) {
  const [temas, setTemas] = useState(null);
  const [temaActivo, setTemaActivo] = useState(null);
  const [creandoTema, setCreandoTema] = useState(false);

  const recargarTemas = () => cargarTemas().then(setTemas);
  useEffect(() => { recargarTemas(); }, []);

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20, position: "sticky", top: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <MessageSquare size={17} color={C.blueLight} />
        <span style={{ color: C.text, fontFamily: FD, fontWeight: 700, fontSize: 15 }}>Foro</span>
      </div>

      {temaActivo ? (
        <TemaDetalle tema={temaActivo} onVolver={() => setTemaActivo(null)} />
      ) : (
        <>
          <p style={{ color: C.textDim, fontSize: 12.5, marginTop: 0 }}>Temas de conversación abiertos por SICODE. Entra y deja tu opinión.</p>
          {temas === null ? (
            <div style={{ color: C.textDim, fontSize: 12.5 }}><Loader2 size={14} className="animate-spin" /></div>
          ) : temas.length === 0 ? (
            <div style={{ color: C.textDim, fontSize: 12.5 }}>Todavía no hay temas abiertos.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {temas.map((t) => (
                <button key={t.key} onClick={() => setTemaActivo(t)} style={{ textAlign: "left", background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>
                  <div style={{ color: C.text, fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{t.titulo}</div>
                  {t.descripcion && <div style={{ color: C.textDim, fontSize: 11.5 }}>{t.descripcion}</div>}
                </button>
              ))}
            </div>
          )}
          {isAdmin && (
            creandoTema ? (
              <NuevoTema onCreado={() => { setCreandoTema(false); recargarTemas(); }} onCancelar={() => setCreandoTema(false)} />
            ) : (
              <button onClick={() => setCreandoTema(true)} style={{ background: "none", border: `1px dashed ${C.line}`, color: C.textDim, borderRadius: 9, padding: "9px 12px", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "center" }}>
                <Plus size={11} /> Crear tema
              </button>
            )
          )}
        </>
      )}
    </div>
  );
}

function NuevoTema({ onCreado, onCancelar }) {
  const [titulo, setTitulo] = useState(""); const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    if (!titulo.trim()) return;
    setGuardando(true);
    const id = "tema_" + Date.now();
    await storage.set("forotema:" + id, JSON.stringify({ titulo: titulo.trim(), descripcion: descripcion.trim(), fecha: new Date().toISOString() }), true);
    setGuardando(false);
    onCreado();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12 }}>
      <input style={inputStyle} placeholder="Título del tema" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Descripción breve" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" onClick={crear} disabled={guardando} style={{ background: C.gold, color: "#141A22", border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>{guardando ? "Creando…" : "Crear tema"}</button>
        <button type="button" onClick={onCancelar} style={{ background: "none", border: `1px solid ${C.line}`, color: C.textDim, borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
      </div>
    </div>
  );
}

function TemaDetalle({ tema, onVolver }) {
  const [posts, setPosts] = useState(null);
  const [nombre, setNombre] = useState(""); const [comentario, setComentario] = useState(""); const [categoria, setCategoria] = useState("muy");
  const [enviando, setEnviando] = useState(false);

  const recargar = () => cargarPosts(tema.key.replace("forotema:", "")).then(setPosts);
  useEffect(() => { recargar(); }, [tema.key]);

  const temaId = tema.key.replace("forotema:", "");
  const promedio = posts && posts.length ? posts.reduce((s, p) => s + (CATEGORIAS_FORO.find((c) => c.key === p.categoria)?.score || 2), 0) / posts.length : 0;

  const publicar = async () => {
    if (!nombre.trim() || !comentario.trim()) return;
    setEnviando(true);
    const id = "foropost:" + temaId + "_" + Date.now();
    await storage.set(id, JSON.stringify({ temaId, nombre: nombre.trim(), comentario: comentario.trim(), categoria, fecha: new Date().toISOString(), respuestas: [] }), true);
    setNombre(""); setComentario("");
    setEnviando(false);
    recargar();
  };

  const responder = async (post, texto, nombreResp) => {
    if (!texto.trim() || !nombreResp.trim()) return;
    const nuevo = { id: Date.now(), nombre: nombreResp.trim(), texto: texto.trim(), fecha: new Date().toISOString() };
    const actualizado = { ...post, respuestas: [...(post.respuestas || []), nuevo] };
    await storage.set(post.key, JSON.stringify({ temaId: post.temaId, nombre: post.nombre, comentario: post.comentario, categoria: post.categoria, fecha: post.fecha, respuestas: actualizado.respuestas }), true);
    recargar();
  };

  return (
    <div>
      <button onClick={onVolver} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, marginBottom: 10, fontSize: 12 }}>
        <ChevronLeft size={13} /> Volver a temas
      </button>
      <div style={{ color: C.text, fontFamily: FD, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{tema.titulo}</div>
      {tema.descripcion && <div style={{ color: C.textDim, fontSize: 12, marginBottom: 10 }}>{tema.descripcion}</div>}

      {posts && posts.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, color: C.gold, fontSize: 12 }}>
          <Star size={13} /> {promedio.toFixed(1)} / 3 · {posts.length} opinión{posts.length === 1 ? "" : "es"}
        </div>
      )}

      <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <input style={inputStyle} placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <textarea style={{ ...inputStyle, minHeight: 55 }} placeholder="Tu opinión sobre este tema…" value={comentario} onChange={(e) => setComentario(e.target.value)} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIAS_FORO.map((c) => (
            <button key={c.key} type="button" onClick={() => setCategoria(c.key)} style={{ padding: "5px 10px", borderRadius: 999, fontSize: 11, cursor: "pointer", border: `1px solid ${categoria === c.key ? c.color : C.line}`, background: categoria === c.key ? c.color + "22" : "transparent", color: categoria === c.key ? c.color : C.textDim }}>{c.label}</button>
          ))}
        </div>
        <button type="button" onClick={publicar} disabled={enviando} style={{ background: C.gold, color: "#141A22", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {enviando ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Publicar opinión
        </button>
      </div>

      {posts === null ? (
        <div style={{ color: C.textDim, fontSize: 12 }}><Loader2 size={14} className="animate-spin" /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {posts.map((p) => <PostConRespuestas key={p.key} post={p} onResponder={responder} />)}
        </div>
      )}
    </div>
  );
}

function PostConRespuestas({ post, onResponder }) {
  const [respondiendo, setRespondiendo] = useState(false);
  const [nombreResp, setNombreResp] = useState("");
  const [texto, setTexto] = useState("");
  const cat = CATEGORIAS_FORO.find((c) => c.key === post.categoria) || CATEGORIAS_FORO[1];

  const enviar = async () => {
    await onResponder(post, texto, nombreResp);
    setTexto(""); setRespondiendo(false);
  };

  return (
    <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
        <span style={{ color: C.text, fontSize: 12.5, fontWeight: 600 }}>{post.nombre}</span>
        <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 999, color: cat.color, border: `1px solid ${cat.color}55`, fontFamily: FM }}>{cat.label}</span>
      </div>
      <p style={{ color: C.textDim, fontSize: 12.5, margin: "0 0 8px", lineHeight: 1.5 }}>{post.comentario}</p>

      {(post.respuestas || []).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8, paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
          {post.respuestas.map((r) => (
            <div key={r.id} style={{ fontSize: 11.5 }}>
              <span style={{ color: C.text, fontWeight: 600 }}>{r.nombre}: </span>
              <span style={{ color: C.textDim }}>{r.texto}</span>
            </div>
          ))}
        </div>
      )}

      {respondiendo ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} placeholder="Tu nombre" value={nombreResp} onChange={(e) => setNombreResp(e.target.value)} />
          <input style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} placeholder="Tu respuesta" value={texto} onChange={(e) => setTexto(e.target.value)} />
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={enviar} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>Enviar</button>
            <button type="button" onClick={() => setRespondiendo(false)} style={{ background: "none", border: `1px solid ${C.line}`, color: C.textDim, borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setRespondiendo(true)} style={{ background: "none", border: "none", color: C.blueLight, cursor: "pointer", fontSize: 11.5, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
          <CornerDownRight size={11} /> Responder
        </button>
      )}
    </div>
  );
}
