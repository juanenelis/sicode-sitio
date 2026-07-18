// ============================================================
// FORMULARIOS — sistema de formularios múltiples.
// El cliente ve tarjetas con los formularios disponibles, elige uno,
// lo llena y lo envía. Cada respuesta se guarda en Firestore y además
// se notifica por correo (Web3Forms) a la cuenta del sitio.
// Los formularios en sí (título, campos, banner, color, tamaño de
// letra, qué pasa al enviarlo) se crean/editan/eliminan desde el
// panel de Administrador → sección "Formularios".
// ============================================================
import { useState, useEffect } from "react";
import { ChevronLeft, Plus, Trash2, Send, CheckCircle2, ClipboardList, Loader2, Upload, Pencil, Image as ImageIcon, X } from "lucide-react";
import { storage } from "./storage";
import { sendEmailNotification } from "./email";
import { uploadToCloudinary } from "./cloudinary";

const C = { navy: "#050B1A", navy2: "#0B1730", panel: "#101E3F", line: "#1E2C4E", text: "#EDF1F8", textDim: "#8B96B3", blue: "#1E6FEA", blueLight: "#5B9AF5", gold: "#F0BD5A", red: "#E5484D" };
const FD = "'Space Grotesk',sans-serif", FB = "'Inter',sans-serif", FM = "'JetBrains Mono',monospace";
const inputStyle = { width: "100%", background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14.5, fontFamily: FB, outline: "none" };

const TIPOS_CAMPO = [
  { v: "text", l: "Texto corto" },
  { v: "textarea", l: "Texto largo" },
  { v: "email", l: "Correo" },
  { v: "tel", l: "Teléfono" },
  { v: "date", l: "Fecha" },
  { v: "opciones", l: "Varias opciones (elegir una)" },
  { v: "imagen", l: "Imagen (la sube quien llena el formulario)" },
];

const COLORES_DISPONIBLES = ["#F0BD5A", "#1E6FEA", "#5B9AF5", "#3DD68C", "#E5484D", "#9B7BF0", "#EC4899"];
const TAMANOS_LETRA = { normal: { base: 14.5, titulo: 22, label: 11.5 }, grande: { base: 17, titulo: 26, label: 13.5 } };

const FORMULARIOS_SEMILLA = [
  {
    id: "seed-inscripcion", titulo: "Inscripción", descripcion: "Regístrate para iniciar el proceso de inscripción.",
    banner: null, color: "#F0BD5A", tamanoLetra: "normal",
    accionEnvio: { tipo: "mensaje", mensaje: "", urlRedireccion: "" },
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

function formularioCompleto(f) {
  return {
    banner: null, color: "#F0BD5A", tamanoLetra: "normal",
    accionEnvio: { tipo: "mensaje", mensaje: "", urlRedireccion: "" },
    ...f,
  };
}

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
        try { const r = await storage.get(k, true); return r ? formularioCompleto(JSON.parse(r.value)) : null; }
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
    const mensaje = seleccionado?.accionEnvio?.mensaje?.trim();
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.navy2, padding: "8vh 8vw", textAlign: "center" }}>
        <div>
          <CheckCircle2 size={34} color={seleccionado?.color || C.gold} style={{ marginBottom: 14 }} />
          <h2 style={{ color: C.text, fontFamily: FD, fontSize: 22, margin: "0 0 8px" }}>¡Enviado!</h2>
          <p style={{ color: C.textDim, fontSize: 14, marginBottom: 20, maxWidth: 420 }}>{mensaje || "Recibimos tu respuesta. Te contactaremos pronto."}</p>
          <button onClick={() => { setEnviado(false); setSeleccionado(null); }} style={{ background: seleccionado?.color || C.gold, color: "#141A22", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, cursor: "pointer" }}>
            Volver a formularios
          </button>
        </div>
      </div>
    );
  }

  if (seleccionado) {
    return (
      <div style={{ background: C.navy2, padding: "6vh 6vw", minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <button onClick={() => setSeleccionado(null)} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 13.5 }}>
            <ChevronLeft size={16} /> Ver todos los formularios
          </button>
          <DynamicForm
            form={seleccionado}
            onEnviado={() => {
              const accion = seleccionado.accionEnvio;
              if (accion?.tipo === "redireccion" && accion.urlRedireccion?.trim()) {
                window.location.href = accion.urlRedireccion.trim();
              } else {
                setEnviado(true);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.navy2, padding: "6vh 6vw", minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 900 }}>
        <h1 style={{ color: C.text, fontFamily: FD, fontSize: 26, margin: "0 0 8px", textAlign: "center" }}>Formularios</h1>
        <p style={{ color: C.textDim, fontSize: 14, marginBottom: 30, textAlign: "center" }}>Elige el formulario que necesitas llenar.</p>
        {formularios.length === 0 ? (
          <div style={{ color: C.textDim, textAlign: "center" }}>No hay formularios disponibles en este momento.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
            {formularios.map((f) => (
              <button key={f.id} onClick={() => setSeleccionado(f)} style={{ textAlign: "left", background: C.panel, border: `1px solid ${C.line}`, borderTop: `3px solid ${f.color || C.gold}`, borderRadius: 14, padding: 0, cursor: "pointer", overflow: "hidden" }}>
                {f.banner && <img src={f.banner} alt="" style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />}
                <div style={{ padding: 20 }}>
                  <ClipboardList size={20} color={f.color || C.blueLight} style={{ marginBottom: 10 }} />
                  <div style={{ color: C.text, fontFamily: FD, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.titulo}</div>
                  {f.descripcion && <div style={{ color: C.textDim, fontSize: 12.5 }}>{f.descripcion}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DynamicForm({ form, onEnviado }) {
  const vacio = Object.fromEntries(form.campos.map((c) => [c.id, ""]));
  const [valores, setValores] = useState(vacio);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(null);
  const t = TAMANOS_LETRA[form.tamanoLetra] || TAMANOS_LETRA.normal;
  const color = form.color || C.gold;

  const set = (id) => (e) => setValores((v) => ({ ...v, [id]: e.target.value }));

  const subirImagenCampo = async (id, file) => {
    if (!file) return;
    setSubiendoImagen(id);
    try {
      const subida = await uploadToCloudinary(file);
      setValores((v) => ({ ...v, [id]: subida.url }));
    } catch {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setSubiendoImagen(null);
    }
  };

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
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
      {form.banner && <img src={form.banner} alt="" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />}
      <form onSubmit={submit} style={{ padding: 26 }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: color, marginBottom: 14 }} />
        <h2 style={{ color: C.text, fontFamily: FD, fontSize: t.titulo, margin: "0 0 6px" }}>{form.titulo}</h2>
        {form.descripcion && <p style={{ color: C.textDim, fontSize: t.base - 1, marginTop: 0, marginBottom: 22 }}>{form.descripcion}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {form.campos.map((c) => (
            <div key={c.id}>
              <label style={{ fontSize: t.label, color: C.textDim, marginBottom: 6, display: "block", fontFamily: FM }}>{c.label.toUpperCase()}{c.requerido ? " *" : ""}</label>
              {c.tipo === "textarea" ? (
                <textarea style={{ ...inputStyle, minHeight: 90, fontSize: t.base }} value={valores[c.id]} onChange={set(c.id)} />
              ) : c.tipo === "opciones" ? (
                <select style={{ ...inputStyle, fontSize: t.base }} value={valores[c.id]} onChange={set(c.id)}>
                  <option value="">Selecciona una opción…</option>
                  {(c.opciones || []).map((op, i) => <option key={i} value={op}>{op}</option>)}
                </select>
              ) : c.tipo === "imagen" ? (
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 9, background: C.navy2, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 11, cursor: subiendoImagen === c.id ? "default" : "pointer", width: "fit-content" }}>
                    {subiendoImagen === c.id ? <Loader2 size={15} className="animate-spin" color={C.blueLight} /> : <ImageIcon size={15} color={C.blueLight} />}
                    <span style={{ color: C.textDim, fontSize: t.base - 2 }}>
                      {subiendoImagen === c.id ? "Subiendo…" : valores[c.id] ? "Imagen lista ✓ — toca para cambiarla" : "Elegir imagen"}
                    </span>
                    <input type="file" accept="image/*" disabled={subiendoImagen === c.id} style={{ display: "none" }} onChange={(e) => subirImagenCampo(c.id, e.target.files[0])} />
                  </label>
                  {valores[c.id] && <img src={valores[c.id]} alt="" style={{ marginTop: 10, maxWidth: 160, maxHeight: 160, borderRadius: 8, display: "block" }} />}
                </div>
              ) : (
                <input type={c.tipo === "text" ? "text" : c.tipo} style={{ ...inputStyle, fontSize: t.base }} value={valores[c.id]} onChange={set(c.id)} />
              )}
            </div>
          ))}
          {error && <div style={{ color: C.red, fontSize: 13 }}>{error}</div>}
          <button type="submit" disabled={enviando} style={{ background: color, color: "#141A22", border: "none", borderRadius: 10, padding: "13px 0", fontWeight: 700, cursor: enviando ? "default" : "pointer", opacity: enviando ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: t.base }}>
            {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} {enviando ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================= GESTIÓN (ADMIN) =============================
const FORM_VACIO = () => ({
  titulo: "", descripcion: "", banner: null, color: "#F0BD5A", tamanoLetra: "normal",
  accionEnvio: { tipo: "mensaje", mensaje: "", urlRedireccion: "" },
  campos: [{ id: "campo1", label: "", tipo: "text", requerido: true, opciones: [] }],
});

export function GestionFormularios() {
  const [formularios, setFormularios] = useState(null);
  const [editando, setEditando] = useState(null);
  const [datos, setDatos] = useState(FORM_VACIO());
  const [subiendoBanner, setSubiendoBanner] = useState(false);
  const [error, setError] = useState("");

  const recargar = () => cargarFormularios().then(setFormularios);
  useEffect(() => { recargar(); }, []);

  const abrirNuevo = () => { setDatos(FORM_VACIO()); setEditando("nuevo"); setError(""); };
  const abrirEditar = (f) => { setDatos(formularioCompleto(JSON.parse(JSON.stringify(f)))); setEditando(f.id); setError(""); };
  const cerrar = () => setEditando(null);

  const agregarCampo = () => setDatos((d) => ({ ...d, campos: [...d.campos, { id: "campo_" + Date.now(), label: "", tipo: "text", requerido: true, opciones: [] }] }));
  const quitarCampo = (idx) => setDatos((d) => ({ ...d, campos: d.campos.filter((_, i) => i !== idx) }));
  const actualizarCampo = (idx, cambios) => setDatos((d) => ({ ...d, campos: d.campos.map((c, i) => i === idx ? { ...c, ...cambios } : c) }));

  const cambiarBanner = async (file) => {
    if (!file) return;
    setSubiendoBanner(true);
    try {
      const subida = await uploadToCloudinary(file);
      setDatos((d) => ({ ...d, banner: subida.url }));
    } catch {
      setError("No se pudo subir el banner. Intenta de nuevo.");
    } finally {
      setSubiendoBanner(false);
    }
  };

  const guardar = async () => {
    setError("");
    const esNuevo = editando === "nuevo";
    if (esNuevo && formularios && formularios.length >= 3) { setError("Ya tienes 3 formularios. Elimina uno para crear otro."); return; }
    if (!datos.titulo.trim()) { setError("Ponle un título al formulario."); return; }
    if (datos.campos.some((c) => !c.label.trim())) { setError("Todos los campos necesitan una etiqueta (nombre visible)."); return; }
    if (datos.campos.some((c) => c.tipo === "opciones" && (c.opciones || []).filter((o) => o.trim()).length < 2)) {
      setError("Los campos de 'varias opciones' necesitan al menos 2 opciones escritas."); return;
    }
    const id = esNuevo ? "form_" + Date.now() : editando;
    const guardado = {
      id, titulo: datos.titulo.trim(), descripcion: datos.descripcion.trim(),
      banner: datos.banner || null, color: datos.color || "#F0BD5A", tamanoLetra: datos.tamanoLetra || "normal",
      accionEnvio: datos.accionEnvio,
      campos: datos.campos.map((c) => ({
        ...c, id: c.id || slugCampo(c.label),
        opciones: c.tipo === "opciones" ? (c.opciones || []).filter((o) => o.trim()) : undefined,
      })),
    };
    await storage.set("formdef:" + id, JSON.stringify(guardado), true);
    setEditando(null);
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
        {formularios.length < 3 && editando === null && (
          <button onClick={abrirNuevo} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 10, padding: "9px 15px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Plus size={14} /> Crear formulario
          </button>
        )}
      </div>

      {editando !== null && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, marginBottom: 22, display: "flex", flexDirection: "column", gap: 14, maxWidth: 600 }}>
          <div style={{ color: C.text, fontWeight: 700, fontFamily: FD, fontSize: 15 }}>{editando === "nuevo" ? "Nuevo formulario" : "Editando formulario"}</div>

          <input style={inputStyle} placeholder="Título del formulario" value={datos.titulo} onChange={(e) => setDatos((d) => ({ ...d, titulo: e.target.value }))} />
          <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Descripción breve (opcional)" value={datos.descripcion} onChange={(e) => setDatos((d) => ({ ...d, descripcion: e.target.value }))} />

          <div>
            <div style={{ color: C.textDim, fontSize: 11, fontFamily: FM, marginBottom: 8 }}>DECORACIÓN</div>
            <label style={{ display: "flex", alignItems: "center", gap: 9, background: C.navy2, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 11, cursor: subiendoBanner ? "default" : "pointer", width: "fit-content", marginBottom: 10 }}>
              {subiendoBanner ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} color={C.blueLight} />}
              <span style={{ color: C.textDim, fontSize: 12.5 }}>{subiendoBanner ? "Subiendo…" : datos.banner ? "Banner puesto ✓ — toca para cambiarlo" : "Subir banner (imagen de portada)"}</span>
              <input type="file" accept="image/*" disabled={subiendoBanner} style={{ display: "none" }} onChange={(e) => cambiarBanner(e.target.files[0])} />
            </label>
            {datos.banner && (
              <div style={{ position: "relative", width: "fit-content", marginBottom: 10 }}>
                <img src={datos.banner} alt="" style={{ maxWidth: 240, maxHeight: 100, borderRadius: 8, display: "block" }} />
                <button type="button" onClick={() => setDatos((d) => ({ ...d, banner: null }))} style={{ position: "absolute", top: -8, right: -8, background: C.red, border: "none", borderRadius: "50%", width: 22, height: 22, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={12} /></button>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ color: C.textDim, fontSize: 12 }}>Color:</span>
              {COLORES_DISPONIBLES.map((col) => (
                <button key={col} type="button" onClick={() => setDatos((d) => ({ ...d, color: col }))} style={{ width: 26, height: 26, borderRadius: "50%", background: col, border: datos.color === col ? `2px solid ${C.text}` : "2px solid transparent", cursor: "pointer" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: C.textDim, fontSize: 12 }}>Tamaño de letra:</span>
              {[["normal", "Normal"], ["grande", "Grande"]].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setDatos((d) => ({ ...d, tamanoLetra: v }))} style={{ background: datos.tamanoLetra === v ? C.blue : "none", color: datos.tamanoLetra === v ? "#fff" : C.textDim, border: `1px solid ${C.line}`, borderRadius: 7, padding: "5px 11px", cursor: "pointer", fontSize: 12 }}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ color: C.textDim, fontSize: 11, fontFamily: FM, marginBottom: 8 }}>CAMPOS DEL FORMULARIO</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {datos.campos.map((c, idx) => (
                <div key={idx} style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input style={{ ...inputStyle, flex: 2, minWidth: 140, padding: "9px 12px" }} placeholder="Nombre del campo (ej. Teléfono)" value={c.label} onChange={(e) => actualizarCampo(idx, { label: e.target.value })} />
                    <select style={{ ...inputStyle, flex: 1, minWidth: 150, padding: "9px 12px" }} value={c.tipo} onChange={(e) => actualizarCampo(idx, { tipo: e.target.value })}>
                      {TIPOS_CAMPO.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                    </select>
                    <label style={{ display: "flex", alignItems: "center", gap: 5, color: C.textDim, fontSize: 12 }}>
                      <input type="checkbox" checked={c.requerido} onChange={(e) => actualizarCampo(idx, { requerido: e.target.checked })} /> Obligatorio
                    </label>
                    {datos.campos.length > 1 && (
                      <button type="button" onClick={() => quitarCampo(idx)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", display: "flex" }}><Trash2 size={14} /></button>
                    )}
                  </div>
                  {c.tipo === "opciones" && (
                    <div>
                      <div style={{ color: C.textDim, fontSize: 11 }}>Opciones (una por línea):</div>
                      <textarea
                        style={{ ...inputStyle, minHeight: 70, padding: "9px 12px", fontSize: 13 }}
                        placeholder={"Opción 1\nOpción 2\nOpción 3"}
                        value={(c.opciones || []).join("\n")}
                        onChange={(e) => actualizarCampo(idx, { opciones: e.target.value.split("\n") })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={agregarCampo} style={{ background: "none", border: `1px dashed ${C.line}`, color: C.blueLight, borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 12.5, width: "fit-content", display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
              <Plus size={13} /> Agregar campo
            </button>
          </div>

          <div>
            <div style={{ color: C.textDim, fontSize: 11, fontFamily: FM, marginBottom: 8 }}>AL ENVIAR EL FORMULARIO</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[["mensaje", "Mostrar un mensaje"], ["redireccion", "Redirigir a un link"]].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setDatos((d) => ({ ...d, accionEnvio: { ...d.accionEnvio, tipo: v } }))} style={{ background: datos.accionEnvio.tipo === v ? C.blue : "none", color: datos.accionEnvio.tipo === v ? "#fff" : C.textDim, border: `1px solid ${C.line}`, borderRadius: 7, padding: "7px 12px", cursor: "pointer", fontSize: 12.5 }}>{l}</button>
              ))}
            </div>
            {datos.accionEnvio.tipo === "mensaje" ? (
              <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Ej: ¡Gracias! Te contactaremos en menos de 24 horas." value={datos.accionEnvio.mensaje} onChange={(e) => setDatos((d) => ({ ...d, accionEnvio: { ...d.accionEnvio, mensaje: e.target.value } }))} />
            ) : (
              <input style={inputStyle} placeholder="https://..." value={datos.accionEnvio.urlRedireccion} onChange={(e) => setDatos((d) => ({ ...d, accionEnvio: { ...d.accionEnvio, urlRedireccion: e.target.value } }))} />
            )}
          </div>

          {error && <div style={{ color: C.red, fontSize: 13 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={guardar} style={{ background: C.gold, color: "#141A22", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}>Guardar formulario</button>
            <button type="button" onClick={cerrar} style={{ background: "none", border: `1px solid ${C.line}`, color: C.textDim, borderRadius: 10, padding: "10px 16px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {formularios.map((f) => (
          <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.panel, border: `1px solid ${C.line}`, borderLeft: `3px solid ${f.color || C.gold}`, borderRadius: 12, padding: "13px 16px", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ color: C.text, fontWeight: 700, fontFamily: FD, fontSize: 14.5 }}>{f.titulo}</div>
              <div style={{ color: C.textDim, fontSize: 11.5 }}>{f.campos.length} campo{f.campos.length === 1 ? "" : "s"}{f.banner ? " · con banner" : ""}</div>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <button onClick={() => abrirEditar(f)} style={{ background: "none", border: "none", color: C.blueLight, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5 }}>
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => eliminar(f)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5 }}>
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function slugCampo(s) {
  return (s || "campo").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "campo";
}
