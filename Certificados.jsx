// ============================================================
// CERTIFICADOS — dentro de la pestaña Revista.
// Los profesores suben certificados por estudiante (identificado por
// cédula de 11 dígitos sin guiones y/o correo institucional).
// El estudiante busca con su cédula o su correo y ve todas las
// coincidencias, sin necesidad de iniciar sesión.
//
// Nota de diseño: la subida está protegida con la MISMA clave de
// administrador que ya usan las secciones de Revista/Apoyo/Admin de
// este sitio (no con las cuentas individuales del Aula Virtual, que
// es un sistema aparte). Si más adelante quieres que cada profesor
// suba con su propio usuario del Aula Virtual, hay que conectar
// ambos sistemas — es un cambio más grande, avísame si lo quieres.
// ============================================================
import { useState, useEffect } from "react";
import { Search, Upload, Trash2, Award, Lock, Loader2, Download } from "lucide-react";
import { storage } from "./storage";
import { uploadToCloudinary } from "./cloudinary";

const C = { navy: "#050B1A", navy2: "#0B1730", panel: "#101E3F", line: "#1E2C4E", text: "#EDF1F8", textDim: "#8B96B3", blue: "#1E6FEA", blueLight: "#5B9AF5", gold: "#F0BD5A", red: "#E5484D" };
const FD = "'Space Grotesk',sans-serif", FB = "'Inter',sans-serif", FM = "'JetBrains Mono',monospace";
const inputStyle = { width: "100%", background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14.5, fontFamily: FB, outline: "none" };

function soloDigitos(s) { return (s || "").replace(/\D/g, ""); }
function normalizarCorreo(s) { return (s || "").trim().toLowerCase(); }

async function cargarCertificados() {
  try {
    const res = await storage.list("cert:", true);
    if (!res || !res.keys) return [];
    const items = await Promise.all(
      res.keys.map(async (k) => {
        try { const r = await storage.get(k, true); return r ? { key: k, ...JSON.parse(r.value) } : null; }
        catch { return null; }
      })
    );
    return items.filter(Boolean);
  } catch {
    return [];
  }
}

export default function Certificados({ checkAdminCreds }) {
  const [modoSubir, setModoSubir] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div style={{ background: C.navy2, padding: "8vh 8vw", minHeight: "60vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
        <div>
          <div style={{ color: C.gold, fontFamily: FM, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>CERTIFICADOS</div>
          <h1 style={{ color: C.text, fontFamily: FD, fontSize: 26, margin: 0 }}>Busca tu certificado</h1>
        </div>
        {!modoSubir && (
          <button onClick={() => setModoSubir(true)} style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 10, padding: "11px 16px", color: C.textDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
            <Lock size={14} /> Soy profesor — subir certificado
          </button>
        )}
      </div>

      {modoSubir ? (
        <PanelSubida isAdmin={isAdmin} setIsAdmin={setIsAdmin} checkAdminCreds={checkAdminCreds} onCerrar={() => setModoSubir(false)} />
      ) : (
        <BuscadorCertificados />
      )}
    </div>
  );
}

function BuscadorCertificados() {
  const [query, setQuery] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState(null);

  const buscar = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setBuscando(true);
    const todos = await cargarCertificados();
    const digitos = soloDigitos(q);
    const correo = normalizarCorreo(q);
    const encontrados = todos.filter((c) =>
      (digitos.length >= 6 && soloDigitos(c.cedula) === digitos) ||
      (correo.includes("@") && normalizarCorreo(c.correo) === correo)
    );
    setResultados(encontrados);
    setBuscando(false);
  };

  return (
    <div style={{ maxWidth: 620 }}>
      <p style={{ color: C.textDim, fontSize: 14, marginTop: 0, marginBottom: 24 }}>Escribe tu cédula (11 dígitos) o tu correo institucional para ver tus certificados.</p>
      <form onSubmit={buscar} style={{ display: "flex", gap: 10, marginBottom: 26, flexWrap: "wrap" }}>
        <input style={{ ...inputStyle, flex: 1, minWidth: 220 }} placeholder="Cédula o correo institucional" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="submit" disabled={buscando} style={{ background: C.gold, color: "#141A22", border: "none", borderRadius: 10, padding: "0 20px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          {buscando ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} Buscar
        </button>
      </form>

      {resultados !== null && (
        resultados.length === 0 ? (
          <div style={{ color: C.textDim }}>No encontramos ningún certificado con esos datos.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {resultados.map((c) => (
              <a key={c.key} href={c.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Award size={20} color={C.gold} />
                  <div>
                    <div style={{ color: C.text, fontWeight: 700, fontFamily: FD, fontSize: 14.5 }}>{c.titulo}</div>
                    <div style={{ color: C.textDim, fontSize: 11.5 }}>{c.nombreEstudiante} · {c.fecha ? new Date(c.fecha).toLocaleDateString() : ""}</div>
                  </div>
                </div>
                <Download size={16} color={C.blueLight} />
              </a>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function PanelSubida({ isAdmin, setIsAdmin, checkAdminCreds, onCerrar }) {
  const [user, setUser] = useState(""); const [pwd, setPwd] = useState(""); const [pwdError, setPwdError] = useState(false);

  const checkPwd = (e) => {
    e.preventDefault();
    if (checkAdminCreds(user, pwd)) { setIsAdmin(true); setPwdError(false); }
    else setPwdError(true);
  };

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 380 }}>
        <form onSubmit={checkPwd} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ color: C.text, fontWeight: 700, fontFamily: FD, fontSize: 15 }}>Acceso de profesor</div>
          <input style={inputStyle} placeholder="Usuario" value={user} onChange={(e) => setUser(e.target.value)} />
          <input type="password" style={inputStyle} placeholder="Contraseña" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          {pwdError && <div style={{ color: C.red, fontSize: 12.5 }}>Usuario o contraseña incorrectos.</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" style={{ background: C.gold, color: "#141A22", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}>Entrar</button>
            <button type="button" onClick={onCerrar} style={{ background: "none", border: `1px solid ${C.line}`, color: C.textDim, borderRadius: 10, padding: "10px 16px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </form>
      </div>
    );
  }

  return <GestionCertificados onCerrar={onCerrar} />;
}

function GestionCertificados({ onCerrar }) {
  const [certificados, setCertificados] = useState(null);
  const [nombreEstudiante, setNombreEstudiante] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [titulo, setTitulo] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  const recargar = () => cargarCertificados().then((c) => { c.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")); setCertificados(c); });
  useEffect(() => { recargar(); }, []);

  const subir = async (e) => {
    e.preventDefault();
    setError("");
    const digitos = soloDigitos(cedula);
    if (!nombreEstudiante.trim() || !titulo.trim()) { setError("Completa el nombre del estudiante y el título del certificado."); return; }
    if (!digitos && !correo.trim()) { setError("Escribe al menos la cédula o el correo institucional del estudiante."); return; }
    if (digitos && digitos.length !== 11) { setError("La cédula debe tener 11 dígitos (sin guiones)."); return; }
    if (!archivo) { setError("Elige el archivo del certificado."); return; }
    setSubiendo(true);
    try {
      const subido = await uploadToCloudinary(archivo);
      const id = `cert:${digitos || "sincedula"}_${normalizarCorreo(correo).replace(/[^a-z0-9]/g, "-") || "sincorreo"}_${Date.now()}`;
      await storage.set(id, JSON.stringify({
        nombreEstudiante: nombreEstudiante.trim(), cedula: digitos, correo: normalizarCorreo(correo),
        titulo: titulo.trim(), url: subido.url, fecha: new Date().toISOString(),
      }), true);
      setNombreEstudiante(""); setCedula(""); setCorreo(""); setTitulo(""); setArchivo(null);
      recargar();
    } catch (err) {
      setError("No se pudo subir el certificado: " + (err?.message || "intenta de nuevo."));
    } finally {
      setSubiendo(false);
    }
  };

  const eliminar = async (c) => {
    if (!confirm(`¿Eliminar el certificado "${c.titulo}" de ${c.nombreEstudiante}?`)) return;
    await storage.delete(c.key, true);
    recargar();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ color: C.text, fontWeight: 700, fontFamily: FD, fontSize: 16 }}>Subir certificados</div>
        <button onClick={onCerrar} style={{ background: "none", border: `1px solid ${C.line}`, color: C.textDim, borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 12.5 }}>Cerrar</button>
      </div>

      <form onSubmit={subir} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12, maxWidth: 520, marginBottom: 30 }}>
        <input style={inputStyle} placeholder="Nombre del estudiante" value={nombreEstudiante} onChange={(e) => setNombreEstudiante(e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input style={inputStyle} placeholder="Cédula (11 dígitos, sin guiones)" value={cedula} onChange={(e) => setCedula(e.target.value)} />
          <input style={inputStyle} placeholder="Correo institucional" value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </div>
        <input style={inputStyle} placeholder="Título del certificado (ej. Curso de Excel Avanzado)" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <label style={{ display: "flex", alignItems: "center", gap: 9, background: C.navy2, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 11, cursor: "pointer", width: "fit-content" }}>
          <Upload size={15} color={C.blueLight} /><span style={{ color: C.textDim, fontSize: 12.5 }}>{archivo ? archivo.name : "Elegir archivo (PDF o imagen)"}</span>
          <input type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={(e) => setArchivo(e.target.files[0] || null)} />
        </label>
        {error && <div style={{ color: C.red, fontSize: 13 }}>{error}</div>}
        <button type="submit" disabled={subiendo} style={{ background: C.gold, color: "#141A22", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 700, cursor: subiendo ? "default" : "pointer", opacity: subiendo ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {subiendo ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} {subiendo ? "Subiendo…" : "Subir certificado"}
        </button>
      </form>

      <div style={{ color: C.textDim, fontSize: 11, fontFamily: FM, marginBottom: 10 }}>CERTIFICADOS SUBIDOS ({certificados === null ? "…" : certificados.length})</div>
      {certificados === null ? (
        <div style={{ color: C.textDim }}><Loader2 size={16} className="animate-spin" /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {certificados.map((c) => (
            <div key={c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 13px", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ color: C.text, fontSize: 13 }}>{c.titulo} — {c.nombreEstudiante}</div>
                <div style={{ color: C.textDim, fontSize: 11, fontFamily: FM }}>{c.cedula || "sin cédula"} / {c.correo || "sin correo"}</div>
              </div>
              <button onClick={() => eliminar(c)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}><Trash2 size={13} /> Eliminar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
