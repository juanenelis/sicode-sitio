// ============================================================
// FORMULARIOS — sistema de formularios múltiples.
// El cliente ve tarjetas con los formularios disponibles, elige uno,
// lo llena y lo envía. Cada respuesta se guarda en Firestore y además
// se notifica por correo (Web3Forms) a la cuenta del sitio.
// Los formularios en sí (título, campos) se crean/eliminan desde el
// panel de Administrador → pestaña "Formularios".
// ============================================================
import { useState, useEffect } from "react";
import { ChevronLeft, Plus, Trash2, Send, CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
import { storage } from "./storage";
import { sendEmailNotification } from "./email";

const C = { navy: "#050B1A", navy2: "#0B1730", panel: "#101E3F", line: "#1E2C4E", text: "#EDF1F8", textDim: "#8B96B3", blue: "#1E6FEA", blueLight: "#5B9AF5", gold: "#F0BD5A", red: "#E5484D" };
const FD = "'Space Grotesk',sans-serif", FB = "'Inter',sans-serif", FM = "'JetBrains Mono',monospace";
const inputStyle = { width: "100%", background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14.5, fontFamily: FB, outline: "none" };

const TIPOS_CAMPO = [
  { v: "text", l: "Texto corto" },
  { v: "textarea", l: "Texto largo" },
  { v: "email", l: "Correo" },
  { v: "tel", l: "Teléfono" },
  { v: "date", l: "Fecha" },
];

const FORMULARIOS_SEMILLA = [
  {
    id: "seed-inscripcion", titulo: "Inscripción", descripcion: "Regístrate para iniciar el proceso de inscripción.",
    campos: [
      { id: "nombre", label: "Nombre", tipo: "text", requerido: true },
      { id: "apellido", label: "Apellido", tipo: "text", requerido: true },
      { id: "contacto", label: "Teléfono de contacto", tipo: "tel", requerido: true },
      { id: "direccion", label: "Dirección", tipo: "text", requerido: true },
      { id: "cedula", label: "Cédula", tipo: "text", requerido: true },
      { id: "correo", label: "Correo", tipo: "email", requerido: true },
      { id: "horario", label: "Horario preferido", tipo: "text", requerido: true },
    ],
  },
];

async function cargarFormularios() {
  try {
    const res = await storage.list("formdef:", true);
    if (!res || !res.keys || res.keys.length === 0) {
      for (const f of FORMULARIOS_SEMILLA) {
        await storage.set("formdef:" + f.id, JSON.stringify(f), true);
      }
      return FORMULARIOS_SEMILLA;
    }
    const items = await Promise.all(
      res.keys.map(async (k) => {
        try { const r = await storage.get(k, true); return r ? JSON.parse(r.value) : null; }
        catch { return null; }
      })
    );
    return items.filter(Boolean);
  } catch {
    return FORMULARIOS_SEMILLA;
  }
}

// ============================= VISTA PÚBLICA =============================
export function Formularios() {
  const [formularios, setFormularios] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => { cargarFormularios().then(setFormularios); }, []);

  if (formularios === null) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, background: C.navy2 }}>
        <Loader2 size={18} className="animate-spin" style={{ marginRight: 8 }} /> Cargando formularios…
      </div>
    );
  }

  if (enviado) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.navy2, padding: "8vh 8vw", textAlign: "center" }}>
        <div>
          <CheckCircle2 size={34} color={C.gold} style={{ marginBottom: 14 }} />
          <h2 style={{ color: C.text, fontFamily: FD, fontSize: 22, margin: "0 0 8px" }}>¡Enviado!</h2>
          <p style={{ color: C.textDim, fontSize: 14, marginBottom: 20 }}>Recibimos tu respuesta. Te contactaremos pronto.</p>
          <button onClick={() => { setEnviado(false); setSeleccionado(null); }} style={{ background: C.gold, color: "#141A22", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, cursor: "pointer" }}>
            Volver a formularios
          </button>
        </div>
      </div>
    );
  }

  if (seleccionado) {
    return (
      <div style={{ background: C.navy2, padding: "8vh 8vw", minHeight: "70vh" }}>
        <button onClick={() => setSeleccionado(null)} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 13.5 }}>
          <ChevronLeft size={16} /> Ver todos los formularios
        </button>
        <DynamicForm form={seleccionado} onEnviado={() => setEnviado(true)} />
      </div>
    );
  }

  return (
    <div style={{ background: C.navy2, padding: "8vh 8vw", minHeight: "70vh" }}>
      <h1 style={{ color: C.text, fontFamily: FD, fontSize: 26, margin: "0 0 8px" }}>Formularios</h1>
      <p style={{ color: C.textDim, fontSize: 14, marginBottom: 30 }}>Elige el formulario que necesitas llenar.</p>
      {formularios.length === 0 ? (
        <div style={{ color: C.textDim }}>No hay formularios disponibles en este momento.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, maxWidth: 900 }}>
          {formularios.map((f) => (
            <button key={f.id} onClick={() => setSeleccionado(f)} style={{ textAlign: "left", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20, cursor: "pointer" }}>
              <ClipboardList size={20} color={C.blueLight} style={{ marginBottom: 10 }} />
              <div style={{ color: C.text, fontFamily: FD, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.titulo}</div>
              {f.descripcion && <div style={{ color: C.textDim, fontSize: 12.5 }}>{f.descripcion}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DynamicForm({ form, onEnviado }) {
  const vacio = Object.fromEntries(form.campos.map((c) => [c.id, ""]));
  const [valores, setValores] = useState(vacio);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const set = (id) => (e) => setValores((v) => ({ ...v, [id]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    for (const c of form.campos) {
      if (c.requerido && !valores[c.id].trim()) { setError("Completa todos los campos obligatorios."); return; }
    }
    setEnviando(true);
    try {
      const id = `formresp:${form.id}:${Date.now()}`;
      await storage.set(id, JSON.stringify({ formularioTitulo: form.titulo, ...valores, fecha: new Date().toISOString() }), true);
      await sendEmailNotification({
        subject: `Nueva respuesta — ${form.titulo}`,
        fromName: `Formulario: ${form.titulo}`,
        data: valores,
      });
      onEnviado();
    } catch {
      setError("No se pudo enviar. Intenta de nuevo en unos segundos.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 520 }}>
      <h2 style={{ color: C.text, fontFamily: FD, fontSize: 22, margin: "0 0 6px" }}>{form.titulo}</h2>
      {form.descripcion && <p style={{ color: C.textDim, fontSize: 13.5, marginTop: 0, marginBottom: 22 }}>{form.descripcion}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {form.campos.map((c) => (
          <div key={c.id}>
            <label style={{ fontSize: 11.5, color: C.textDim, marginBottom: 6, display: "block", fontFamily: FM }}>{c.label.toUpperCase()}{c.requerido ? " *" : ""}</label>
            {c.tipo === "textarea" ? (
              <textarea style={{ ...inputStyle, minHeight: 90 }} value={valores[c.id]} onChange={set(c.id)} />
            ) : (
              <input type={c.tipo === "text" ? "text" : c.tipo} style={inputStyle} value={valores[c.id]} onChange={set(c.id)} />
            )}
          </div>
        ))}
        {error && <div style={{ color: C.red, fontSize: 13 }}>{error}</div>}
        <button type="submit" disabled={enviando} style={{ background: C.gold, color: "#141A22", border: "none", borderRadius: 10, padding: "13px 0", fontWeight: 700, cursor: enviando ? "default" : "pointer", opacity: enviando ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} {enviando ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </form>
  );
}

// ============================= GESTIÓN (ADMIN) =============================
export function GestionFormularios() {
  const [formularios, setFormularios] = useState(null);
  const [creando, setCreando] = useState(false);
  const [titulo, setTitulo] = useState(""); const [descripcion, setDescripcion] = useState("");
  const [campos, setCampos] = useState([{ id: "campo1", label: "", tipo: "text", requerido: true }]);
  const [error, setError] = useState("");

  const recargar = () => cargarFormularios().then(setFormularios);
  useEffect(() => { recargar(); }, []);

  const agregarCampo = () => setCampos((c) => [...c, { id: "campo" + (c.length + 1) + "_" + Date.now(), label: "", tipo: "text", requerido: true }]);
  const quitarCampo = (idx) => setCampos((c) => c.filter((_, i) => i !== idx));
  const actualizarCampo = (idx, cambios) => setCampos((c) => c.map((camp, i) => i === idx ? { ...camp, ...cambios } : camp));

  const crear = async () => {
    setError("");
    if (formularios && formularios.length >= 3) { setError("Ya tienes 3 formularios. Elimina uno para crear otro."); return; }
    if (!titulo.trim()) { setError("Ponle un título al formulario."); return; }
    if (campos.some((c) => !c.label.trim())) { setError("Todos los campos necesitan una etiqueta (nombre visible)."); return; }
    const id = "form_" + Date.now();
    const nuevo = { id, titulo: titulo.trim(), descripcion: descripcion.trim(), campos: campos.map((c) => ({ ...c, id: c.id || slugCampo(c.label) })) };
    await storage.set("formdef:" + id, JSON.stringify(nuevo), true);
    setTitulo(""); setDescripcion(""); setCampos([{ id: "campo1", label: "", tipo: "text", requerido: true }]); setCreando(false);
    recargar();
  };

  const eliminar = async (f) => {
    if (!confirm(`¿Eliminar el formulario "${f.titulo}"? Esta acción no se puede deshacer.`)) return;
    await storage.delete("formdef:" + f.id, true);
    recargar();
  };

  if (formularios === null) return <div style={{ color: C.textDim }}><Loader2 size={16} className="animate-spin" /> Cargando…</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ color: C.textDim, fontSize: 13 }}>{formularios.length}/3 formularios creados</div>
        {formularios.length < 3 && !creando && (
          <button onClick={() => setCreando(true)} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 10, padding: "9px 15px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Plus size={14} /> Crear formulario
          </button>
        )}
      </div>

      {creando && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, marginBottom: 22, display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 }}>
          <input style={inputStyle} placeholder="Título del formulario" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Descripción breve (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          <div style={{ color: C.textDim, fontSize: 11, fontFamily: FM, marginTop: 4 }}>CAMPOS DEL FORMULARIO</div>
          {campos.map((c, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input style={{ ...inputStyle, flex: 2, minWidth: 140 }} placeholder="Nombre del campo (ej. Teléfono)" value={c.label} onChange={(e) => actualizarCampo(idx, { label: e.target.value })} />
              <select style={{ ...inputStyle, flex: 1, minWidth: 120 }} value={c.tipo} onChange={(e) => actualizarCampo(idx, { tipo: e.target.value })}>
                {TIPOS_CAMPO.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 5, color: C.textDim, fontSize: 12 }}>
                <input type="checkbox" checked={c.requerido} onChange={(e) => actualizarCampo(idx, { requerido: e.target.checked })} /> Obligatorio
              </label>
              {campos.length > 1 && (
                <button type="button" onClick={() => quitarCampo(idx)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", display: "flex" }}><Trash2 size={14} /></button>
              )}
            </div>
          ))}
          <button type="button" onClick={agregarCampo} style={{ background: "none", border: `1px dashed ${C.line}`, color: C.blueLight, borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 12.5, width: "fit-content", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={13} /> Agregar campo
          </button>
          {error && <div style={{ color: C.red, fontSize: 13 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={crear} style={{ background: C.gold, color: "#141A22", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}>Guardar formulario</button>
            <button type="button" onClick={() => setCreando(false)} style={{ background: "none", border: `1px solid ${C.line}`, color: C.textDim, borderRadius: 10, padding: "10px 16px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {formularios.map((f) => (
          <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 16px" }}>
            <div>
              <div style={{ color: C.text, fontWeight: 700, fontFamily: FD, fontSize: 14.5 }}>{f.titulo}</div>
              <div style={{ color: C.textDim, fontSize: 11.5 }}>{f.campos.length} campo{f.campos.length === 1 ? "" : "s"}</div>
            </div>
            <button onClick={() => eliminar(f)} title="Eliminar formulario" style={{ background: "none", border: "none", color: C.red, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5 }}>
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function slugCampo(s) {
  return (s || "campo").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "campo";
}
