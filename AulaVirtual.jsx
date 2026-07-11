// ============================================================
// AULA VIRTUAL — módulo embebido dentro del sitio SICODE
// Login por roles (director/staff/estudiante/visitante), cursos,
// biblioteca, chat, avisos y videollamada propia (WebRTC).
// Los datos se guardan en Firestore (no en memoria) para que
// funcione igual sin importar quién entre ni desde qué dispositivo.
// ============================================================
import { useState, useRef, useEffect, createContext, useContext } from "react";
import {
  GraduationCap, Lock, Building2, Upload, CheckCircle2, KeyRound, Plus,
  Users, BookOpen, LogOut, ShieldCheck, AlertCircle, Mail, X,
  MessageCircle, Library, Bell, Trash2, PauseCircle, PlayCircle, Send,
  ChevronLeft, UserPlus, Camera, Sparkles, Link2, Calendar, Download,
  ClipboardList, HelpCircle, School, Folder, XCircle, Image as ImageIcon,
  Eye, EyeOff, CornerDownRight, Facebook, Instagram, Youtube, Twitter,
  Music2, Globe, MoreVertical, Video, PhoneOff, Users2,
} from "lucide-react";
import { useFirestoreState } from "./aulaFirestore";
import { enviarInvitacionEmail } from "./emailInvite";
import { uploadToCloudinary } from "./cloudinary";

const C = {
  navy: "#080C16", navy2: "#0E1729", panel: "#121B2E", line: "#22304A",
  text: "#EDF1F8", textDim: "#8B96AB", blue: "#3B7AF0", blueLight: "#6AA3FF",
  gold: "#F0BD5A", green: "#3DD68C", red: "#EF6478", purple: "#9B7BF0",
};
const FD = "'Space Grotesk',sans-serif", FB = "'Inter',sans-serif", FM = "'JetBrains Mono',monospace";
const SUPERADMIN_USER = "40210249062", SUPERADMIN_PASS = "2026";

const PREGUNTAS_SEGURIDAD = [
  "¿Cuál es el nombre de tu mascota favorita?",
  "¿Cuál es el nombre de tu escuela primaria?",
  "¿En qué ciudad naciste?",
  "¿Cuál es el segundo nombre de tu madre?",
  "¿Cuál fue el nombre de tu mejor amigo/a de la infancia?",
];
const FORMATOS_ENTREGA = [
  { k: "pdf", l: "PDF", accept: ".pdf", ext: [".pdf"] },
  { k: "word", l: "Word (.doc/.docx)", accept: ".doc,.docx", ext: [".doc", ".docx"] },
  { k: "imagen", l: "Imagen (foto)", accept: "image/*", ext: [".jpg", ".jpeg", ".png", ".webp", ".gif"] },
  { k: "cualquiera", l: "Cualquier formato", accept: "", ext: [] },
];
const TIPOS_MATERIAL = [
  { k: "material", l: "Material / archivo" },
  { k: "tarea", l: "Tarea" },
  { k: "foro", l: "Foro" },
  { k: "carpeta", l: "Carpeta" },
  { k: "cuestionario", l: "Cuestionario" },
];
const REDES_DISPONIBLES = [
  { k: "facebook", l: "Facebook", icon: Facebook },
  { k: "instagram", l: "Instagram", icon: Instagram },
  { k: "whatsapp", l: "WhatsApp", icon: MessageCircle },
  { k: "youtube", l: "YouTube", icon: Youtube },
  { k: "twitter", l: "X (Twitter)", icon: Twitter },
  { k: "tiktok", l: "TikTok", icon: Music2 },
  { k: "sitio", l: "Sitio web", icon: Globe },
];

const ROLES = {
  director: "Director", admin2: "Administrador", secretaria: "Secretaría",
  maestro: "Profesor", estudiante: "Estudiante", visitante: "Visitante",
};

// Juegos de dos colores curados (teoría del color: complementarios / análogos / tríadas suavizadas)
// para que cada centro tenga una identidad visual propia en su sitio.
const PALETAS = [
  { nombre: "Azul Real & Dorado", p: "#1E4D8C", s: "#F0BD5A" },
  { nombre: "Verde Bosque & Crema", p: "#2F6B4F", s: "#F4E9D8" },
  { nombre: "Púrpura & Coral", p: "#6C4AB6", s: "#FF7F6B" },
  { nombre: "Vino & Perla", p: "#7A2E2E", s: "#D9D9D9" },
  { nombre: "Turquesa & Naranja", p: "#158C8C", s: "#F2994A" },
  { nombre: "Azul Marino & Plata", p: "#0B2545", s: "#C9D6DF" },
  { nombre: "Esmeralda & Hueso", p: "#0F6E4F", s: "#F7F4EF" },
  { nombre: "Grafito & Mostaza", p: "#33363D", s: "#E3A731" },
];

const input = { width: "100%", background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14.5, fontFamily: FB, outline: "none" };
const lbl = { fontSize: 11.5, color: C.textDim, marginBottom: 6, display: "block", fontFamily: FM, letterSpacing: 0.4 };
const btn = (disabled, variant) => ({
  background: variant === "danger" ? C.red : variant === "ghost2" ? "transparent" : C.gold,
  color: variant === "danger" ? "#fff" : variant === "ghost2" ? C.text : "#141A22",
  border: variant === "ghost2" ? `1px solid ${C.line}` : "none",
  borderRadius: 10, padding: "11px 18px", fontWeight: 700, cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.55 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: FB, fontSize: 14,
});
const ghost = { background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 13 };

function randCode(n = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let out = "";
  for (let i = 0; i < n; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function randPass() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function slug(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""); }
const PALABRAS_GENERICAS = new Set([
  "centro", "educativo", "educativa", "institucion", "institución", "instituto",
  "escuela", "colegio", "academia", "liceo", "politecnico", "politécnico",
  "de", "del", "la", "el", "los", "las", "y",
]);
function acronimo(nombre) {
  const palabras = (nombre || "").trim().split(/\s+/).filter(Boolean);
  const significativas = palabras.filter((p) => !PALABRAS_GENERICAS.has(slug(p)));
  const usar = significativas.length > 0 ? significativas : palabras;
  if (usar.length === 1) return slug(usar[0]).slice(0, 12) || "ctr";
  return slug(usar.map((p) => p[0]).join("")).slice(0, 6) || "ctr";
}
function correoInstitucional(nombre, apellido, acr) {
  // Ej: Jose Enelis Pérez -> jperez@bersaille.scd.edu (1ra letra del nombre + primer apellido, sin separador)
  return `${slug(nombre)[0] || "u"}${slug(apellido) || "user"}@${acr}.edu`;
}
function loginDesdeCorreoInvitacion(correo, acr) {
  const prefijo = slug((correo || "").split("@")[0]) || "invitado";
  return `${prefijo}@${acr}.edu`;
}
function yaAbrio(item) {
  if (!item.fechaApertura) return true;
  return new Date(item.fechaApertura) <= new Date();
}
function estaVencido(item) {
  if (!item.fechaCierre) return false;
  // el cierre vence al final del día indicado
  const limite = new Date(item.fechaCierre);
  limite.setHours(23, 59, 59, 999);
  return limite < new Date();
}
function estadoMaterial(item) {
  if (!yaAbrio(item)) return "programada";
  if (estaVencido(item)) return "cerrada";
  return "abierta";
}
function extensionValida(nombreArchivo, formatos) {
  if (!formatos || formatos.length === 0 || formatos.includes("cualquiera")) return true;
  const ext = "." + (nombreArchivo.split(".").pop() || "").toLowerCase();
  return formatos.some((k) => (FORMATOS_ENTREGA.find((f) => f.k === k)?.ext || []).includes(ext));
}
function acceptDeFormatos(formatos) {
  if (!formatos || formatos.length === 0 || formatos.includes("cualquiera")) return "";
  return formatos.map((k) => FORMATOS_ENTREGA.find((f) => f.k === k)?.accept).filter(Boolean).join(",");
}
function descargarCSV(nombreArchivo, filas) {
  const csv = filas.map((fila) => fila.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombreArchivo; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function nuevoId() { return Date.now() + Math.random(); }
function nombreSala(prefijo) { return `sicode-${slug(prefijo)}-${randCode(6)}`.toLowerCase(); }

// El director puede administrar (suspender/eliminar) a cualquiera excepto a otro director.
// El resto del staff (maestro/admin2/secretaria) solo puede administrar estudiantes y visitantes.
// Nadie puede administrarse a sí mismo desde aquí, ni a un director.
function puedeAdministrarA(sesion, usuario) {
  if (!sesion || !usuario) return false;
  if (usuario.correoLogin === sesion.correoLogin) return false;
  if (usuario.rol === "director") return false;
  if (sesion.rol === "director") return true;
  if (["maestro", "admin2", "secretaria"].includes(sesion.rol)) return usuario.rol === "estudiante" || usuario.rol === "visitante";
  return false;
}

function ventanaImprimir(titulo, htmlTabla) {
  const w = window.open("", "_blank");
  if (!w) { alert("Tu navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para este sitio e intenta de nuevo."); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${titulo}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#111;}
    h1{font-size:18px;margin:0 0 4px;} .sub{color:#555;font-size:12.5px;margin-bottom:18px;}
    table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:7px 10px;text-align:left;font-size:12.5px;}
    th{background:#f0f0f0;} @media print{ button{display:none;} }
  </style></head><body>${htmlTabla}
    <script>window.onload = function(){ window.print(); };</script>
  </body></html>`);
  w.document.close();
}

function imprimirListadoEstudiantes(curso, estudiantes) {
  const filas = estudiantes.map((u) => `<tr><td>${u.nombre || ""}</td><td>${u.correoLogin || ""}</td><td>${u.correoReal || ""}</td><td>${u.cedula || ""}</td></tr>`).join("");
  ventanaImprimir(`Lista estudiantil - ${curso.nombre}`, `
    <h1>Lista estudiantil — ${curso.nombre}</h1>
    <div class="sub">${estudiantes.length} estudiante${estudiantes.length === 1 ? "" : "s"} · ${new Date().toLocaleDateString()}</div>
    <table><thead><tr><th>Nombre</th><th>Usuario</th><th>Correo</th><th>Cédula</th></tr></thead><tbody>${filas || '<tr><td colspan="4">Sin estudiantes</td></tr>'}</tbody></table>
  `);
}

function imprimirCalificaciones(curso, estudiantes) {
  const tareas = (curso.materiales || []).filter((m) => m.tipo === "tarea");
  const headers = tareas.map((t) => `<th>${t.titulo}</th>`).join("");
  const filas = estudiantes.map((u) => {
    const celdas = tareas.map((t) => {
      const e = (t.entregas || []).find((x) => x.estudianteCorreo === u.correoLogin);
      return `<td>${e && e.calificacion !== undefined && e.calificacion !== "" ? e.calificacion : "—"}</td>`;
    }).join("");
    return `<tr><td>${u.nombre}</td>${celdas}</tr>`;
  }).join("");
  ventanaImprimir(`Calificaciones - ${curso.nombre}`, `
    <h1>Calificaciones por actividad — ${curso.nombre}</h1>
    <div class="sub">${tareas.length} actividad${tareas.length === 1 ? "" : "es"} · ${new Date().toLocaleDateString()}</div>
    <table><thead><tr><th>Estudiante</th>${headers}</tr></thead><tbody>${filas || `<tr><td colspan="${tareas.length + 1}">Sin actividades calificables todavía</td></tr>`}</tbody></table>
  `);
}

async function descargarExcelListado(curso, estudiantes) {
  try {
    const XLSX = await import("xlsx");
    const filas = estudiantes.map((u) => ({ Nombre: u.nombre || "", Usuario: u.correoLogin || "", Correo: u.correoReal || "", Cédula: u.cedula || "" }));
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lista estudiantil");
    XLSX.writeFile(wb, `Lista estudiantil - ${curso.nombre}.xlsx`);
  } catch (err) {
    alert("No se pudo generar el Excel. Si esto sigue pasando, dile al desarrollador que falta la librería 'xlsx' en package.json y volver a desplegar el sitio.\n\nDetalle: " + (err?.message || err));
  }
}
// Sala de videollamada real (Jitsi Meet, gratuito, sin cuenta). Se abre en pestaña nueva porque
// el sandbox de la vista previa de Claude no permite cámara/micrófono embebidos.

// ============================= TEMA DEL CENTRO (colores elegidos por la escuela) =============================
function hexAAlpha(hex, alpha) {
  if (!hex) return `rgba(59,122,240,${alpha})`;
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function mezclarConBlanco(hex, cantidad) {
  if (!hex) return hex;
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * cantidad);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}
function temaDe(centro) {
  const p = centro?.colorPrimario || C.blue;
  const s = centro?.colorSecundario || C.gold;
  return {
    p, s,
    pTinte: hexAAlpha(p, 0.16), pTinteFuerte: hexAAlpha(p, 0.32),
    sTinte: hexAAlpha(s, 0.18),
    pClaro: mezclarConBlanco(p, 0.35),
    grad: `linear-gradient(135deg, ${p}, ${s})`,
    fondoPagina: `radial-gradient(1200px 640px at 12% -8%, ${hexAAlpha(p, 0.24)}, transparent 62%), radial-gradient(900px 520px at 92% 6%, ${hexAAlpha(s, 0.18)}, transparent 60%), ${C.navy}`,
  };
}
const TemaContext = createContext(null);
function useTema() {
  return useContext(TemaContext) || temaDe(null);
}
function temaBtn(tema, disabled, variant) {
  if (variant === "danger") return btn(disabled, "danger");
  if (variant === "ghost2") return { ...btn(disabled, "ghost2"), borderColor: tema.p + "55" };
  return {
    background: tema.grad, color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 700,
    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.55 : 1, display: "flex", alignItems: "center",
    justifyContent: "center", gap: 8, fontFamily: FB, fontSize: 14, boxShadow: `0 8px 24px ${hexAAlpha(tema.p, 0.35)}`,
  };
}

function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div style={{ display: "flex", gap: 8, color: C.red, background: C.red + "18", border: `1px solid ${C.red}55`, borderRadius: 10, padding: "10px 13px", fontSize: 13 }}>
      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>{children}</span>
    </div>
  );
}
function OkBox({ children }) {
  return (
    <div style={{ display: "flex", gap: 8, color: C.green, background: C.green + "18", border: `1px solid ${C.green}55`, borderRadius: 10, padding: "10px 13px", fontSize: 13 }}>
      <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>{children}</span>
    </div>
  );
}
function Card({ children, maxWidth = 440, glow }) {
  return (
    <div style={{
      background: "rgba(18,27,46,0.75)", backdropFilter: "blur(18px)", border: `1px solid ${C.line}`,
      borderRadius: 20, padding: "30px 28px", width: "100%", maxWidth,
      boxShadow: glow ? `0 0 0 1px rgba(91,154,245,0.15), 0 25px 70px rgba(47,111,234,0.25)` : "0 20px 50px rgba(0,0,0,0.4)",
    }}>
      {children}
    </div>
  );
}
function Badge({ children, color }) {
  const tema = useTema();
  const c = color || tema.p;
  return <span style={{ fontSize: 10.5, fontFamily: FM, color: c, background: c + "1c", border: `1px solid ${c}44`, padding: "2px 7px", borderRadius: 6 }}>{children}</span>;
}

// ============================================================
// ============================================================
export default function AulaVirtual() {
  const NOMBRE_CENTRO_DEFAULT = "SICODE EDUCA";
  const CORREO_CENTRO_DEFAULT = "juanenelis3@gmail.com";
  const DIRECTOR_USUARIO_DEFAULT = "40210249062";
  const DIRECTOR_PASSWORD_DEFAULT = "SICODE2026";

  const centroInicial = {
    id: "principal", nombre: NOMBRE_CENTRO_DEFAULT, acronimo: "educa", codigoCentro: "EDUCA1",
    tipoPersona: "juridica", propietarioNombre: NOMBRE_CENTRO_DEFAULT, cedulaRnc: "",
    correoCentro: CORREO_CENTRO_DEFAULT, activo: true, suspendido: false, configurada: true,
    mision: "", vision: "", objetivo: "", logoUrl: null, direccion: "", telefono: "",
    redesSociales: {}, colorPrimario: PALETAS[0].p, colorSecundario: PALETAS[0].s,
  };
  const usuariosInicial = [{
    correoLogin: DIRECTOR_USUARIO_DEFAULT, cedula: DIRECTOR_USUARIO_DEFAULT, password: DIRECTOR_PASSWORD_DEFAULT,
    debeCambiarPassword: false, rol: "director", centroId: "principal", nombre: "Administrador SICODE Educa",
    correoReal: CORREO_CENTRO_DEFAULT, preguntaSeguridad: PREGUNTAS_SEGURIDAD[0], respuestaSeguridad: "sicode",
  }];

  const [centro, setCentro] = useFirestoreState("centro", centroInicial);
  const [usuarios, setUsuarios] = useFirestoreState("usuarios", usuariosInicial);
  const [cursos, setCursos] = useFirestoreState("cursos", []);
  const [biblioteca, setBiblioteca] = useFirestoreState("biblioteca", []);
  const [chats, setChats] = useFirestoreState("chats", {});
  const [grupos, setGrupos] = useFirestoreState("grupos", []);
  const [alertas, setAlertas] = useFirestoreState("alertas", []);

  const [view, setView] = useState("login");
  const [sesion, setSesion] = useState(null);

  const enviarCorreo = () => {};

  const cerrarSesion = () => { setSesion(null); setView("login"); };

  return (
    <div style={{ minHeight: "70vh", background: C.navy, fontFamily: FB, borderRadius: 20, position: "relative", overflow: "hidden" }}>
      <GlobalStyle />
      <AnimatedBackdrop />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 5vw", flexWrap: "wrap", gap: 10, position: "relative", zIndex: 2, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {centro?.logoUrl ? (
            <img src={centro.logoUrl} alt="" style={{ width: 34, height: 34, borderRadius: 9, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#3B7AF0,#9B7BF0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GraduationCap size={17} color="#fff" />
            </div>
          )}
          <div>
            <div style={{ color: C.text, fontFamily: FD, fontWeight: 700, fontSize: 15, lineHeight: 1 }}>{centro?.nombre || NOMBRE_CENTRO_DEFAULT}</div>
            <div style={{ color: C.textDim, fontSize: 10, fontFamily: FM }}>Aula Virtual</div>
          </div>
        </div>
        {sesion && (
          <button onClick={cerrarSesion} style={{ background: "none", border: `1px solid ${C.line}`, color: C.textDim, borderRadius: 8, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
            <LogOut size={13} /> Cerrar sesión
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3vh 5vw 5vh", position: "relative", zIndex: 2 }}>
        {!sesion && view === "login" && (
          <Login
            usuarios={usuarios} centro={centro} setUsuarios={setUsuarios}
            onLoggedIn={(u) => setSesion(u)}
            goInvitacion={() => setView("invitacion")}
          />
        )}

        {!sesion && view === "invitacion" && (
          <RegistroEstudianteIndependiente
            centro={centro} setUsuarios={setUsuarios} cursos={cursos}
            onRegistrado={(u) => setSesion(u)}
            goLogin={() => setView("login")}
          />
        )}

        {sesion && sesion.pendienteDatos && (
          <CompletarPerfil sesion={sesion} setSesion={setSesion} setUsuarios={setUsuarios} />
        )}

        {sesion && !sesion.pendienteDatos && sesion.debeCambiarPassword && (
          <CambiarPasswordObligatorio sesion={sesion} setSesion={setSesion} setUsuarios={setUsuarios} />
        )}

        {sesion && !sesion.pendienteDatos && !sesion.debeCambiarPassword && sesion.rol === "director" && (
          <DirectorDashboard
            sesion={sesion} centro={centro}
            usuarios={usuarios} setUsuarios={setUsuarios}
            cursos={cursos} setCursos={setCursos}
            biblioteca={biblioteca} setBiblioteca={setBiblioteca}
            chats={chats} setChats={setChats}
            grupos={grupos} setGrupos={setGrupos}
            alertas={alertas} setAlertas={setAlertas}
            enviarCorreo={enviarCorreo}
            setCentro={setCentro}
            onSalir={cerrarSesion}
          />
        )}

        {sesion && !sesion.pendienteDatos && !sesion.debeCambiarPassword && ["maestro", "admin2", "secretaria"].includes(sesion.rol) && (
          <StaffDashboard
            sesion={sesion} centro={centro}
            usuarios={usuarios} setUsuarios={setUsuarios}
            cursos={cursos} setCursos={setCursos}
            biblioteca={biblioteca} setBiblioteca={setBiblioteca}
            chats={chats} setChats={setChats}
            grupos={grupos} setGrupos={setGrupos}
            alertas={alertas} setAlertas={setAlertas}
            enviarCorreo={enviarCorreo}
            onSalir={cerrarSesion}
          />
        )}

        {sesion && !sesion.pendienteDatos && !sesion.debeCambiarPassword && sesion.rol === "visitante" && (
          <VisitanteDashboard
            sesion={sesion} centro={centro}
            usuarios={usuarios} chats={chats} setChats={setChats}
            grupos={grupos} setGrupos={setGrupos}
            biblioteca={biblioteca}
            onSalir={cerrarSesion}
          />
        )}

        {sesion && !sesion.pendienteDatos && !sesion.debeCambiarPassword && sesion.rol === "estudiante" && (
          <EstudianteDashboard
            sesion={sesion} setSesion={setSesion} centro={centro}
            usuarios={usuarios} setUsuarios={setUsuarios} cursos={cursos} setCursos={setCursos}
            biblioteca={biblioteca} setBiblioteca={setBiblioteca}
            chats={chats} setChats={setChats}
            grupos={grupos} setGrupos={setGrupos}
            alertas={alertas}
            onSalir={cerrarSesion}
          />
        )}
      </div>
    </div>
  );
}
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      *{box-sizing:border-box} ::placeholder{color:#5A6478}
      @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
      @keyframes pulseGlow { 0%,100%{opacity:.55} 50%{opacity:1} }
      @keyframes drift { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    `}</style>
  );
}
function AnimatedBackdrop() {
  const dots = Array.from({ length: 14 });
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(1100px 600px at 20% -10%, rgba(59,122,240,0.22), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(155,123,240,0.18), transparent 60%)" }} />
      {dots.map((_, i) => (
        <div key={i} style={{
          position: "absolute", width: 3, height: 3, borderRadius: "50%", background: C.blueLight,
          left: `${(i * 137) % 100}%`, top: `${(i * 71) % 100}%`,
          animation: `floatY ${6 + (i % 5)}s ease-in-out infinite`, animationDelay: `${i * 0.4}s`,
          boxShadow: `0 0 8px ${C.blueLight}`, opacity: 0.5,
        }} />
      ))}
    </div>
  );
}

function Login({ usuarios, centro, setUsuarios, onLoggedIn, goInvitacion }) {
  const [id, setId] = useState(""); const [pass, setPass] = useState(""); const [error, setError] = useState("");
  const [showRecuperar, setShowRecuperar] = useState(false);
  const [redirigiendo, setRedirigiendo] = useState(null);

  const submit = () => {
    setError("");
    const u = usuarios.find((x) => x.correoLogin === id.trim().toLowerCase() || x.cedula === id.trim());
    if (!u) { setError("No encontramos ninguna cuenta con ese usuario o cédula."); return; }
    if (u.password !== pass) { setError("La contraseña no es correcta."); return; }
    if (u.suspendido) { setError("Esta cuenta está suspendida. Habla con tu profesor o el director del centro."); return; }
    setRedirigiendo(u);
    setTimeout(() => onLoggedIn(u), 1000);
  };

  if (redirigiendo) {
    const cp = centro?.colorPrimario || PALETAS[0].p, cs = centro?.colorSecundario || PALETAS[0].s;
    return (
      <Card glow>
        <div style={{ textAlign: "center", padding: "6px 0 20px" }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 16px", borderRadius: 18, overflow: "hidden",
            background: `linear-gradient(135deg, ${cp}, ${cs})`, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 30px ${cp}66`, animation: "pulseGlow 1.2s ease-in-out infinite",
          }}>
            {centro?.logoUrl ? <img src={centro.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Sparkles size={26} color="#fff" />}
          </div>
          <h2 style={{ color: C.text, fontFamily: FD, fontSize: 19, margin: "0 0 6px" }}>Entrando…</h2>
          <p style={{ color: C.textDim, fontSize: 13 }}>Bienvenido, {redirigiendo.nombre}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card glow maxWidth={420}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          width: 56, height: 56, margin: "0 auto 14px", borderRadius: 16,
          background: "linear-gradient(135deg,#3B7AF0,#9B7BF0)", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 30px rgba(91,154,245,0.45)",
        }}>
          {centro?.logoUrl ? <img src={centro.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }} /> : <GraduationCap size={28} color="#fff" />}
        </div>
        <h1 style={{
          color: C.text, fontFamily: FD, fontSize: 23, margin: "0 0 6px",
          background: "linear-gradient(90deg,#EDF1F8,#9B7BF0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Bienvenido{centro?.nombre ? ` a ${centro.nombre}` : ""}</h1>
        <p style={{ color: C.textDim, fontSize: 12.5, margin: 0 }}>Un solo acceso para director, staff, profesores y estudiantes</p>
      </div>

      {!showRecuperar ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div><label style={lbl}>USUARIO / CORREO / CÉDULA</label><input style={input} value={id} onChange={(e) => setId(e.target.value)} placeholder="tu.usuario@centro.edu" /></div>
          <div><label style={lbl}>CONTRASEÑA</label><input type="password" style={input} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" /></div>
          <ErrorBox>{error}</ErrorBox>
          <button type="button" onClick={submit} style={{ ...btn(false), boxShadow: "0 8px 30px rgba(240,189,90,0.25)" }}><Lock size={15} /> Entrar</button>
          <button type="button" onClick={() => setShowRecuperar(true)} style={{ ...ghost, textAlign: "center" }}>¿Olvidaste tu acceso? Recuperar acceso</button>
        </div>
      ) : (
        <RecuperarAcceso usuarios={usuarios} setUsuarios={setUsuarios} onVolver={() => setShowRecuperar(false)} />
      )}

      <div style={{ marginTop: 20, textAlign: "center", display: "flex", flexDirection: "column", gap: 8, borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
        <button onClick={goInvitacion} style={{ ...ghost, color: C.blueLight, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Link2 size={13} /> Soy estudiante nuevo — crear mi cuenta</button>
      </div>
    </Card>
  );
}
function RecuperarAcceso({ usuarios, setUsuarios, onVolver }) {
  const [paso, setPaso] = useState(1); // 1: identificar, 2: pregunta de seguridad, 3: por correo, 4: listo
  const [id, setId] = useState(""); const [usuario, setUsuario] = useState(null);
  const [respuesta, setRespuesta] = useState(""); const [error, setError] = useState("");
  const [nuevaPass, setNuevaPass] = useState(null); const [enviado, setEnviado] = useState(false);

  const buscar = () => {
    setError("");
    const u = usuarios.find((x) => x.correoLogin === id.trim().toLowerCase() || x.cedula === id.trim());
    if (!u) { setError("No encontramos ninguna cuenta con ese usuario o cédula."); return; }
    setUsuario(u);
    setPaso(u.preguntaSeguridad && u.respuestaSeguridad ? 2 : 3);
  };

  const validarRespuesta = () => {
    setError("");
    if (!respuesta.trim() || respuesta.trim().toLowerCase() !== (usuario.respuestaSeguridad || "").toLowerCase()) {
      setError("La respuesta no coincide con la registrada."); return;
    }
    const nueva = randPass();
    setUsuarios((us) => us.map((x) => x.correoLogin === usuario.correoLogin ? { ...x, password: nueva, debeCambiarPassword: true } : x));
    setNuevaPass(nueva);
    setPaso(4);
  };

  const enviarPorCorreo = () => { setEnviado(true); };

  if (paso === 4) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <OkBox>Respuesta correcta. Ya puedes entrar con tu usuario y esta nueva contraseña temporal (te pedirá crear una definitiva):</OkBox>
        <div style={{ fontFamily: FM, fontSize: 14, color: C.text, background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12 }}>{nuevaPass}</div>
        <button type="button" onClick={onVolver} style={btn(false)}><Lock size={15} /> Ir al login</button>
      </div>
    );
  }

  if (paso === 3) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <p style={{ color: C.textDim, fontSize: 13, marginTop: -4 }}>Esta cuenta no tiene una pregunta de seguridad configurada. Ingresa tu correo de recuperación y te enviaremos instrucciones (simulado).</p>
        {enviado ? <OkBox>Si el correo existe en el sistema, recibirás instrucciones para restablecer tu acceso.</OkBox> : (
          <button type="button" onClick={enviarPorCorreo} style={btn(false)}><Mail size={15} /> Enviar instrucciones</button>
        )}
        <button type="button" onClick={onVolver} style={ghost}>← Volver al login</button>
      </div>
    );
  }

  if (paso === 2) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <p style={{ color: C.textDim, fontSize: 13, marginTop: -4 }}>Responde tu pregunta de seguridad para recuperar el acceso sin depender del correo.</p>
        <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, color: C.blueLight, fontSize: 13.5 }}>{usuario.preguntaSeguridad}</div>
        <input style={input} value={respuesta} onChange={(e) => setRespuesta(e.target.value)} placeholder="Tu respuesta" />
        <ErrorBox>{error}</ErrorBox>
        <button type="button" onClick={validarRespuesta} style={btn(false)}><KeyRound size={15} /> Validar y restablecer acceso</button>
        <button type="button" onClick={() => setPaso(3)} style={ghost}>Prefiero recuperar por correo</button>
        <button type="button" onClick={onVolver} style={ghost}>← Volver al login</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      <p style={{ color: C.textDim, fontSize: 13, marginTop: -4 }}>Escribe tu usuario o cédula para buscar tu cuenta.</p>
      <input style={input} value={id} onChange={(e) => setId(e.target.value)} placeholder="tu.usuario@centro.sicode.edu o cédula" />
      <ErrorBox>{error}</ErrorBox>
      <button type="button" onClick={buscar} style={btn(false)}><KeyRound size={15} /> Continuar</button>
      <button type="button" onClick={onVolver} style={ghost}>← Volver al login</button>
    </div>
  );
}

function RegistroEstudianteIndependiente({ centro, setUsuarios, cursos, onRegistrado, goLogin }) {
  const [nombre, setNombre] = useState(""); const [apellido, setApellido] = useState("");
  const [edad, setEdad] = useState(""); const [cedula, setCedula] = useState("");
  const [codigoClase, setCodigoClase] = useState("");
  const [password, setPassword] = useState("");
  const [preguntaSeguridad, setPreguntaSeguridad] = useState(PREGUNTAS_SEGURIDAD[0]);
  const [respuestaSeguridad, setRespuestaSeguridad] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    setError("");
    if (!nombre.trim() || !apellido.trim() || !codigoClase.trim()) {
      setError("Completa tu nombre, apellido y el código de tu clase."); return;
    }
    if (!password || password.length < 4) { setError("Crea una contraseña de al menos 4 caracteres."); return; }
    if (!respuestaSeguridad.trim()) { setError("Completa la pregunta de seguridad (te servirá para recuperar tu acceso)."); return; }
    const curso = cursos.find((c) => (c.codigoEstudiante || "").toUpperCase() === codigoClase.trim().toUpperCase());
    if (!curso) { setError("No encontramos ninguna clase con ese código. Verifícalo con tu profesor."); return; }
    const acr = centro.acronimo;
    const correoLogin = correoInstitucional(nombre, apellido, acr);
    const nuevoUsuario = {
      correoLogin, cedula, password, rol: "estudiante", centroId: centro.id, cursoId: curso.id,
      nombre: `${nombre} ${apellido}`, edad, correoReal: "", debeCambiarPassword: false,
      preguntaSeguridad, respuestaSeguridad: respuestaSeguridad.trim(),
    };
    setUsuarios((us) => [...us, nuevoUsuario]);
    onRegistrado(nuevoUsuario);
  };

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}><GraduationCap size={19} color={C.blueLight} /><h1 style={{ color: C.text, fontFamily: FD, fontSize: 18, margin: 0 }}>Crea tu cuenta de estudiante</h1></div>
      <p style={{ color: C.textDim, fontSize: 12.5, marginTop: -8 }}>Pide a tu profesor el <b>código de tu clase</b>. Al terminar, entrarás directo a tu aula.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input style={{ ...input, textTransform: "uppercase" }} placeholder="Código de la clase" value={codigoClase} onChange={(e) => setCodigoClase(e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input style={input} placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <input style={input} placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input style={input} placeholder="Edad" value={edad} onChange={(e) => setEdad(e.target.value)} />
          <input style={input} placeholder="Cédula (si tiene)" value={cedula} onChange={(e) => setCedula(e.target.value)} />
        </div>
        <input type="password" style={input} placeholder="Crea tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div>
          <label style={lbl}>PREGUNTA DE SEGURIDAD (para recuperar tu acceso)</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <select style={input} value={preguntaSeguridad} onChange={(e) => setPreguntaSeguridad(e.target.value)}>
              {PREGUNTAS_SEGURIDAD.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input style={input} placeholder="Tu respuesta" value={respuestaSeguridad} onChange={(e) => setRespuestaSeguridad(e.target.value)} />
          </div>
        </div>
        <ErrorBox>{error}</ErrorBox>
        <button type="button" onClick={submit} style={btn(false)}><CheckCircle2 size={15} /> Crear mi cuenta y entrar</button>
        <button type="button" onClick={goLogin} style={ghost}>← Volver</button>
      </div>
    </Card>
  );
}
function SelectorColores({ colorPrimario, colorSecundario, onChange }) {
  const esPersonalizado = !PALETAS.some((p) => p.p === colorPrimario && p.s === colorSecundario);
  return (
    <div>
      <label style={lbl}>COLORES DE TU CENTRO (así se verá tu sitio para estudiantes y visitantes)</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8, marginBottom: 10 }}>
        {PALETAS.map((pal) => {
          const activo = colorPrimario === pal.p && colorSecundario === pal.s;
          return (
            <button key={pal.nombre} type="button" onClick={() => onChange(pal.p, pal.s)} style={{
              display: "flex", alignItems: "center", gap: 8, background: C.navy2, border: `1.5px solid ${activo ? C.blueLight : C.line}`,
              borderRadius: 10, padding: "8px 10px", cursor: "pointer", textAlign: "left",
            }}>
              <span style={{ display: "flex", borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                <span style={{ width: 14, height: 22, background: pal.p }} />
                <span style={{ width: 14, height: 22, background: pal.s }} />
              </span>
              <span style={{ color: C.text, fontSize: 11.5 }}>{pal.nombre}</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, color: C.textDim, fontSize: 12 }}>
          Primario <input type="color" value={colorPrimario} onChange={(e) => onChange(e.target.value, colorSecundario)} style={{ width: 34, height: 26, border: "none", background: "none", cursor: "pointer" }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, color: C.textDim, fontSize: 12 }}>
          Secundario <input type="color" value={colorSecundario} onChange={(e) => onChange(colorPrimario, e.target.value)} style={{ width: 34, height: 26, border: "none", background: "none", cursor: "pointer" }} />
        </label>
        {esPersonalizado && <Badge color={C.purple}>Personalizado</Badge>}
      </div>
    </div>
  );
}

function EditorRedesSociales({ redes, setRedes }) {
  const set = (k, v) => setRedes((r) => ({ ...(r || {}), [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {REDES_DISPONIBLES.map((r) => (
        <div key={r.k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <r.icon size={15} color={C.textDim} style={{ flexShrink: 0 }} />
          <input style={{ ...input, padding: "8px 10px", fontSize: 12.5 }} placeholder={`Link de ${r.l} (opcional)`} value={redes?.[r.k] || ""} onChange={(e) => set(r.k, e.target.value)} />
        </div>
      ))}
    </div>
  );
}

// ============================= CAMBIO DE CONTRASEÑA OBLIGATORIO (primer ingreso o tras recuperar acceso) =============================
function CambiarPasswordObligatorio({ sesion, setSesion, setUsuarios }) {
  const [pass1, setPass1] = useState(""); const [pass2, setPass2] = useState(""); const [error, setError] = useState("");

  const guardar = (e) => {
    e.preventDefault();
    setError("");
    if (!pass1 || pass1.length < 4) { setError("La contraseña debe tener al menos 4 caracteres."); return; }
    if (pass1 !== pass2) { setError("Las contraseñas no coinciden."); return; }
    setUsuarios((us) => us.map((u) => u.correoLogin === sesion.correoLogin ? { ...u, password: pass1, debeCambiarPassword: false } : u));
    setSesion((s) => ({ ...s, password: pass1, debeCambiarPassword: false }));
  };

  return (
    <Card maxWidth={440} glow>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <KeyRound size={26} color={C.gold} />
        <h1 style={{ color: C.text, fontFamily: FD, fontSize: 19, margin: "10px 0 4px" }}>Crea tu contraseña</h1>
        <p style={{ color: C.textDim, fontSize: 13 }}>Por seguridad, debes reemplazar la contraseña temporal antes de continuar.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><label style={lbl}>NUEVA CONTRASEÑA</label><input type="password" style={input} value={pass1} onChange={(e) => setPass1(e.target.value)} placeholder="Mínimo 4 caracteres" /></div>
        <div><label style={lbl}>CONFIRMA LA CONTRASEÑA</label><input type="password" style={input} value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="Repite la contraseña" /></div>
        <ErrorBox>{error}</ErrorBox>
        <button type="button" onClick={guardar} style={btn(false)}><CheckCircle2 size={15} /> Guardar y continuar</button>
      </div>
    </Card>
  );
}

// ============================= COMPLETAR PERFIL (invitados: personal o visitantes) =============================
function CompletarPerfil({ sesion, setSesion, setUsuarios }) {
  const [nombre, setNombre] = useState(""); const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState(""); const [error, setError] = useState("");

  const guardar = (e) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim() || !apellido.trim()) { setError("Completa tu nombre y apellido."); return; }
    const nombreCompleto = `${nombre.trim()} ${apellido.trim()}`;
    setUsuarios((us) => us.map((u) => u.correoLogin === sesion.correoLogin ? { ...u, nombre: nombreCompleto, cedula: cedula.trim(), pendienteDatos: false } : u));
    setSesion((s) => ({ ...s, nombre: nombreCompleto, cedula: cedula.trim(), pendienteDatos: false }));
  };

  return (
    <Card maxWidth={480} glow>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <Sparkles size={26} color={C.gold} />
        <h1 style={{ color: C.text, fontFamily: FD, fontSize: 19, margin: "10px 0 4px" }}>Ya casi terminas</h1>
        <p style={{ color: C.textDim, fontSize: 13 }}>Te invitaron como <b style={{ color: C.blueLight }}>{ROLES[sesion.rol]}</b>. Completa tus datos para continuar.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input style={input} placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input style={input} placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
        <input style={input} placeholder="Cédula (opcional)" value={cedula} onChange={(e) => setCedula(e.target.value)} />
        <ErrorBox>{error}</ErrorBox>
        <button type="button" onClick={guardar} style={btn(false)}><CheckCircle2 size={15} /> Guardar y continuar</button>
      </div>
    </Card>
  );
}

// ============================= CHAT (compartido director/staff/estudiante) =============================
function coincide(u, q) {
  if (!q) return true;
  const qq = q.trim().toLowerCase();
  return (u.nombre || "").toLowerCase().includes(qq)
    || (u.correoLogin || "").toLowerCase().includes(qq)
    || (u.correoReal || "").toLowerCase().includes(qq)
    || (u.cedula || "").toLowerCase().includes(qq);
}

function Chat({ sesion, centro, usuarios, setUsuarios, chats, setChats, grupos, setGrupos }) {
  const contactos = usuarios.filter((u) => u.centroId === centro.id && u.correoLogin !== sesion.correoLogin);
  const misGrupos = (grupos || []).filter((g) => g.centroId === centro.id && g.miembros.includes(sesion.correoLogin));
  const [busqueda, setBusqueda] = useState("");
  const [activo, setActivo] = useState(contactos[0] ? { tipo: "directo", id: contactos[0].correoLogin } : null);
  const [texto, setTexto] = useState("");
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [miembrosSel, setMiembrosSel] = useState([]);
  const [editandoMiembros, setEditandoMiembros] = useState(false);
  const [agregarBusqueda, setAgregarBusqueda] = useState("");
  const [verFicha, setVerFicha] = useState(null);
  const key = centro.id;

  const nombreDe = (correo) => correo === sesion.correoLogin ? sesion.nombre : (usuarios.find((u) => u.correoLogin === correo)?.nombre || correo);

  const contactosFiltrados = contactos.filter((c) => coincide(c, busqueda));

  const activoContacto = activo?.tipo === "directo" ? contactos.find((c) => c.correoLogin === activo.id) : null;
  const activoGrupo = activo?.tipo === "grupo" ? misGrupos.find((g) => g.id === activo.id) : null;

  const mensajes = !activo ? [] : (chats[key] || []).filter((m) =>
    activo.tipo === "grupo"
      ? m.grupoId === activo.id
      : ((m.con === activo.id && m.de === sesion.correoLogin) || (m.de === activo.id && m.con === sesion.correoLogin))
  );

  const enviar = () => {
    if (!texto.trim() || !activo) return;
    const base = { de: sesion.correoLogin, deNombre: sesion.nombre, deRol: sesion.rol, texto, fecha: new Date().toLocaleTimeString() };
    const msg = activo.tipo === "grupo" ? { ...base, grupoId: activo.id } : { ...base, con: activo.id };
    setChats((ch) => ({ ...ch, [key]: [...(ch[key] || []), msg] }));
    setTexto("");
  };

  const toggleMiembro = (correoLogin) => setMiembrosSel((ms) => ms.includes(correoLogin) ? ms.filter((m) => m !== correoLogin) : [...ms, correoLogin]);

  const crearGrupo = (e) => {
    e.preventDefault();
    if (!nombreGrupo.trim() || miembrosSel.length === 0) return;
    const g = { id: Date.now(), centroId: centro.id, nombre: nombreGrupo.trim(), miembros: [...miembrosSel, sesion.correoLogin], creadoPor: sesion.correoLogin };
    setGrupos((gs) => [...gs, g]);
    setActivo({ tipo: "grupo", id: g.id });
    setNombreGrupo(""); setMiembrosSel([]); setCreandoGrupo(false);
  };

  const agregarMiembro = (grupoId, correoLogin) => setGrupos((gs) => gs.map((g) => g.id === grupoId ? { ...g, miembros: g.miembros.includes(correoLogin) ? g.miembros : [...g.miembros, correoLogin] } : g));
  const quitarMiembro = (grupoId, correoLogin) => setGrupos((gs) => gs.map((g) => g.id === grupoId ? { ...g, miembros: g.miembros.filter((m) => m !== correoLogin) } : g));

  return (
    <div style={{ display: "flex", gap: 14, height: 420, flexWrap: "wrap" }}>
      <div style={{ width: 210, borderRight: `1px solid ${C.line}`, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, paddingRight: 8 }}>
        <input style={{ ...input, padding: "8px 10px", fontSize: 12.5, marginBottom: 8 }} placeholder="Buscar por nombre, correo o código…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <button type="button" onClick={() => setCreandoGrupo((s) => !s)} style={{ ...btn(false, "ghost2"), width: "auto", fontSize: 12, padding: "8px 10px", marginBottom: 10 }}>
          <UserPlus size={13} /> {creandoGrupo ? "Cancelar" : "Nuevo chat grupal"}
        </button>

        {creandoGrupo && (
          <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 10, marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <input style={{ ...input, padding: "8px 10px", fontSize: 12.5 }} placeholder="Nombre del grupo" value={nombreGrupo} onChange={(e) => setNombreGrupo(e.target.value)} />
            <div style={{ maxHeight: 130, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
              {contactosFiltrados.map((c) => (
                <label key={c.correoLogin} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={miembrosSel.includes(c.correoLogin)} onChange={() => toggleMiembro(c.correoLogin)} />
                  {c.nombre} <Badge>{ROLES[c.rol]}</Badge>
                </label>
              ))}
            </div>
            <button type="button" onClick={crearGrupo} style={{ ...btn(false), width: "auto", fontSize: 12, padding: "7px 10px" }}><Plus size={13} /> Crear grupo</button>
          </div>
        )}

        {misGrupos.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ color: C.textDim, fontSize: 10, fontFamily: FM, marginBottom: 4 }}>GRUPOS</div>
            {misGrupos.map((g) => (
              <button key={g.id} onClick={() => setActivo({ tipo: "grupo", id: g.id })} style={{
                textAlign: "left", width: "100%", background: activo?.tipo === "grupo" && activo.id === g.id ? C.navy2 : "none", border: "none", borderRadius: 9,
                padding: "8px 10px", cursor: "pointer", color: C.text, fontSize: 13, display: "flex", alignItems: "center", gap: 6,
              }}><Users size={12} color={C.blueLight} /> {g.nombre}</button>
            ))}
          </div>
        )}

        <div style={{ color: C.textDim, fontSize: 10, fontFamily: FM, marginBottom: 4 }}>PERSONAS</div>
        {contactosFiltrados.length === 0 && <div style={{ color: C.textDim, fontSize: 12 }}>Nadie coincide con la búsqueda.</div>}
        {contactosFiltrados.map((c) => (
          <div key={c.correoLogin} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => setActivo({ tipo: "directo", id: c.correoLogin })} style={{
              flex: 1, textAlign: "left", background: activo?.tipo === "directo" && activo.id === c.correoLogin ? C.navy2 : "none", border: "none", borderRadius: 9,
              padding: "8px 10px", cursor: "pointer",
            }}>
              <div style={{ color: C.text, fontSize: 13 }}>{c.nombre}</div>
              <Badge>{ROLES[c.rol]}</Badge>
            </button>
            <button type="button" onClick={() => setVerFicha(c)} title="Ver ficha" style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", display: "flex", padding: 4 }}><Eye size={13} /></button>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 220 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <div style={{ color: C.textDim, fontSize: 12 }}>
            {activoGrupo ? <><Users size={12} style={{ verticalAlign: -2 }} /> {activoGrupo.nombre} · {activoGrupo.miembros.length} miembros</> : activoContacto ? activoContacto.nombre : "Elige a alguien para chatear"}
          </div>
          {activoGrupo && activoGrupo.creadoPor === sesion.correoLogin && (
            <button type="button" onClick={() => setEditandoMiembros((s) => !s)} style={{ ...ghost, border: `1px solid ${C.line}`, borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 11.5 }}>
              <UserPlus size={12} /> {editandoMiembros ? "Cerrar" : "Miembros"}
            </button>
          )}
        </div>

        {activoGrupo && editandoMiembros && (
          <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 10, marginBottom: 10, display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
            <div style={{ color: C.textDim, fontSize: 10, fontFamily: FM }}>MIEMBROS ACTUALES</div>
            {activoGrupo.miembros.map((correo) => {
              const u = usuarios.find((x) => x.correoLogin === correo);
              return (
                <div key={correo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, color: C.text }}>
                  <button type="button" onClick={() => u && setVerFicha(u)} style={{ background: "none", border: "none", color: C.text, cursor: u ? "pointer" : "default", padding: 0, textAlign: "left" }}>
                    {nombreDe(correo)}{correo === activoGrupo.creadoPor && <span style={{ color: C.textDim, fontSize: 10.5 }}> (creador)</span>}
                  </button>
                  {correo !== activoGrupo.creadoPor && (
                    <button type="button" onClick={() => quitarMiembro(activoGrupo.id, correo)} title="Quitar del grupo" style={{ background: "none", border: "none", color: C.red, cursor: "pointer", display: "flex" }}><X size={13} /></button>
                  )}
                </div>
              );
            })}
            <div style={{ color: C.textDim, fontSize: 10, fontFamily: FM, marginTop: 6 }}>AGREGAR PERSONAS</div>
            <input style={{ ...input, padding: "7px 9px", fontSize: 12 }} placeholder="Buscar…" value={agregarBusqueda} onChange={(e) => setAgregarBusqueda(e.target.value)} />
            {contactos.filter((c) => !activoGrupo.miembros.includes(c.correoLogin) && coincide(c, agregarBusqueda)).map((c) => (
              <button key={c.correoLogin} type="button" onClick={() => agregarMiembro(activoGrupo.id, c.correoLogin)} style={{ textAlign: "left", background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 9px", cursor: "pointer", color: C.text, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {c.nombre} <Plus size={12} color={C.blueLight} />
              </button>
            ))}
            {contactos.filter((c) => !activoGrupo.miembros.includes(c.correoLogin)).length === 0 && <div style={{ color: C.textDim, fontSize: 11.5 }}>Ya están todos en el grupo.</div>}
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
          {mensajes.length === 0 && <div style={{ color: C.textDim, fontSize: 12.5 }}>Sin mensajes todavía. Escribe algo abajo (demo, solo se ve tu propio mensaje).</div>}
          {mensajes.map((m, i) => (
            <div key={i} style={{ alignSelf: m.de === sesion.correoLogin ? "flex-end" : "flex-start", maxWidth: "75%" }}>
              <div style={{ color: C.textDim, fontSize: 10.5, marginBottom: 2 }}>{m.deNombre} · <Badge>{ROLES[m.deRol]}</Badge></div>
              <div style={{ background: m.de === sesion.correoLogin ? C.blue : C.navy2, color: "#fff", borderRadius: 10, padding: "8px 11px", fontSize: 13 }}>{m.texto}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input style={input} placeholder="Escribe un mensaje…" value={texto} onChange={(e) => setTexto(e.target.value)} disabled={!activo} onKeyDown={(e) => { if (e.key === "Enter") enviar(); }} />
          <button type="button" onClick={enviar} style={{ ...btn(!activo), width: "auto" }}><Send size={15} /></button>
        </div>
      </div>
      {verFicha && <FichaUsuarioModal usuario={verFicha} sesion={sesion} setUsuarios={setUsuarios} onClose={() => setVerFicha(null)} />}
    </div>
  );
}

// ============================= BIBLIOTECA =============================
function MaterialCard({ m }) {
  const esDeEstudiante = m.publicadoPorRol === "estudiante";
  return (
    <a href={m.url} download={m.nombre} style={{ background: C.panel, border: `1px solid ${esDeEstudiante ? C.blueLight + "55" : C.line}`, borderRadius: 12, padding: "13px 15px", display: "block", textDecoration: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 14.5, fontFamily: FD }}>{m.titulo || m.nombre}</div>
        {esDeEstudiante && <Badge color={C.blueLight}>Aporte de estudiante</Badge>}
      </div>
      {m.resumen && (
        <div style={{
          color: C.textDim, fontSize: 12.5, marginBottom: 8, display: "-webkit-box",
          WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4,
        }}>{m.resumen}</div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Badge><Upload size={9} style={{ verticalAlign: -1 }} /> {m.nombre}</Badge>
        <span style={{ color: C.textDim, fontSize: 11 }}>Publicado por {m.publicadoPor || m.subidoPor}</span>
        <span style={{ color: C.textDim, fontSize: 11 }}>· {m.fecha}</span>
      </div>
    </a>
  );
}

function Biblioteca({ sesion, centro, biblioteca, setBiblioteca, readOnly }) {
  const materiales = biblioteca.filter((b) => b.centroId === centro.id);
  const esEstudiante = sesion.rol === "estudiante";
  const [titulo, setTitulo] = useState(""); const [resumen, setResumen] = useState(""); const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState(""); const [subiendo, setSubiendo] = useState(false);

  const publicar = async (e) => {
    e.preventDefault();
    setError("");
    if (!titulo.trim() || !archivo) { setError("Ponle un título y elige un archivo."); return; }
    setSubiendo(true);
    try {
      const subido = await uploadToCloudinary(archivo);
      setBiblioteca((b) => [...b, {
        id: Date.now(), centroId: centro.id, titulo: titulo.trim(), resumen: resumen.trim(),
        nombre: archivo.name, url: subido.url, publicadoPor: sesion.nombre, publicadoPorRol: sesion.rol,
        fecha: new Date().toLocaleDateString(),
      }]);
      setTitulo(""); setResumen(""); setArchivo(null);
    } catch {
      setError("No se pudo subir el archivo. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div>
      {!readOnly && (
        <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, marginBottom: 16, display: "flex", flexDirection: "column", gap: 9 }}>
          {esEstudiante && <p style={{ color: C.textDim, fontSize: 12, margin: 0 }}>Comparte un material de apoyo con tus compañeros (resúmenes, guías, ejercicios, etc.).</p>}
          <input style={input} placeholder={esEstudiante ? "Título del material de apoyo" : "Título del material"} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <textarea style={{ ...input, minHeight: 50 }} placeholder="Resumen breve (hasta 3 líneas)" value={resumen} onChange={(e) => setResumen(e.target.value)} />
          <label style={{ display: "flex", alignItems: "center", gap: 9, background: C.panel, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 11, cursor: "pointer", width: "fit-content" }}>
            <Upload size={15} color={C.blueLight} /><span style={{ color: C.textDim, fontSize: 12.5 }}>{archivo ? archivo.name : "Elegir archivo"}</span>
            <input type="file" style={{ display: "none" }} onChange={(e) => setArchivo(e.target.files[0] || null)} />
          </label>
          <ErrorBox>{error}</ErrorBox>
          <button type="button" onClick={publicar} disabled={subiendo} style={{ ...btn(subiendo), width: "auto" }}><Plus size={15} /> {subiendo ? "Subiendo…" : esEstudiante ? "Publicar material de apoyo" : "Publicar en biblioteca"}</button>
        </div>
      )}
      {materiales.length === 0 ? <div style={{ color: C.textDim, fontSize: 13.5 }}>Todavía no hay materiales.</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {materiales.map((m) => <MaterialCard key={m.id} m={m} />)}
        </div>
      )}
    </div>
  );
}

// ============================= PANEL DEL DIRECTOR =============================
function EntrarConCodigo({ cursos, onEncontrado, label }) {
  const [codigo, setCodigo] = useState(""); const [error, setError] = useState("");
  const buscar = () => {
    setError("");
    const c = cursos.find((x) => (x.codigoEstudiante || "").toUpperCase() === codigo.trim().toUpperCase());
    if (!c) { setError("No se encontró ningún curso con ese código."); return; }
    onEncontrado(c); setCodigo("");
  };
  return (
    <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={lbl}>{label || "ENTRAR A UN CURSO CON CÓDIGO"}</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input style={{ ...input, flex: 1, minWidth: 160, textTransform: "uppercase" }} placeholder="Código del curso" value={codigo} onChange={(e) => setCodigo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") buscar(); }} />
        <button type="button" onClick={buscar} style={{ ...btn(false, "ghost2"), width: "auto" }}><KeyRound size={14} /> Entrar</button>
      </div>
      <ErrorBox>{error}</ErrorBox>
    </div>
  );
}

function DirectorDashboard({ sesion, centro, usuarios, setUsuarios, cursos, setCursos, biblioteca, setBiblioteca, chats, setChats, grupos, setGrupos, alertas, setAlertas, enviarCorreo, setCentro, onSalir }) {
  const [tab, setTab] = useState("panel");
  const [cursoVisitadoId, setCursoVisitadoId] = useState(null);
  const staff = usuarios.filter((u) => u.centroId === centro.id);
  const misAlertas = alertas.filter((a) => a.centroId === centro.id);
  const misCursos = cursos.filter((c) => c.centroId === centro.id);
  const cursoVisitado = cursoVisitadoId ? misCursos.find((c) => c.id === cursoVisitadoId) : null;

  const tabs = [
    { k: "panel", l: "Panel del centro", i: Building2 },
    { k: "personal", l: "Personal", i: Users },
    { k: "cursos", l: "Cursos", i: BookOpen },
    { k: "chat", l: "Chat", i: MessageCircle },
    { k: "biblioteca", l: "Biblioteca", i: Library },
    { k: "avisos", l: "Avisos", i: Bell },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 920 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          {centro.logoUrl && <img src={centro.logoUrl} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover" }} />}
          <div>
            <h1 style={{ color: C.text, fontFamily: FD, fontSize: 19, margin: 0 }}>{centro.nombre}</h1>
            <div style={{ marginTop: 4 }}><Badge color={C.gold}><School size={9} style={{ verticalAlign: -1 }} /> Código de la escuela: {centro.codigoCentro}</Badge></div>
          </div>
        </div>
        <button onClick={onSalir} style={{ background: "none", border: `1px solid ${C.line}`, color: C.textDim, borderRadius: 10, padding: "8px 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}><LogOut size={14} /> Cerrar sesión</button>
      </div>

      {misAlertas.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.gold, background: C.gold + "18", border: `1px solid ${C.gold}55`, borderRadius: 10, padding: "10px 13px", fontSize: 13, marginBottom: 16 }}>
          <Bell size={15} /> {misAlertas[0].mensaje}
        </div>
      )}

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.k} onClick={() => { setTab(t.k); setCursoVisitadoId(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "9px 8px", marginBottom: -1, borderBottom: tab === t.k ? `2px solid ${C.blueLight}` : "2px solid transparent", color: tab === t.k ? C.text : C.textDim, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <t.i size={14} /> {t.l}
          </button>
        ))}
      </div>

      {tab === "panel" && (
        <PanelCentro centro={centro} setCentro={setCentro} staff={staff} cursosCount={misCursos.length} materialesCount={biblioteca.filter((b) => b.centroId === centro.id).length} />
      )}
      {tab === "personal" && <PersonalTab sesion={sesion} centro={centro} staff={staff} setUsuarios={setUsuarios} enviarCorreo={enviarCorreo} />}
      {tab === "cursos" && (
        cursoVisitado ? (
          <div>
            <button onClick={() => setCursoVisitadoId(null)} style={{ ...ghost, display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><ChevronLeft size={15} /> Volver a Cursos</button>
            <CursoMaestroDetalle sesion={sesion} centro={centro} curso={cursoVisitado} setCursos={setCursos} usuarios={usuarios} setUsuarios={setUsuarios} enviarCorreo={enviarCorreo} />
          </div>
        ) : (
          <div>
            <EntrarConCodigo cursos={misCursos} onEncontrado={(c) => setCursoVisitadoId(c.id)} />
            <CursosTab centro={centro} cursos={misCursos} maestros={staff.filter((s) => s.rol === "maestro")} setCursos={setCursos} setUsuarios={setUsuarios} />
          </div>
        )
      )}
      {tab === "chat" && <Chat sesion={sesion} centro={centro} usuarios={usuarios} setUsuarios={setUsuarios} chats={chats} setChats={setChats} grupos={grupos} setGrupos={setGrupos} />}
      {tab === "biblioteca" && <Biblioteca sesion={sesion} centro={centro} biblioteca={biblioteca} setBiblioteca={setBiblioteca} />}
      {tab === "avisos" && <AvisosTab sesion={sesion} centro={centro} staff={staff} cursos={misCursos} alertas={misAlertas} setAlertas={setAlertas} enviarCorreo={enviarCorreo} />}
    </div>
  );
}
function PanelCentro({ centro, setCentro, staff, cursosCount, materialesCount }) {
  const [mision, setMision] = useState(centro.mision || ""); const [vision, setVision] = useState(centro.vision || ""); const [objetivo, setObjetivo] = useState(centro.objetivo || "");
  const [direccion, setDireccion] = useState(centro.direccion || ""); const [telefono, setTelefono] = useState(centro.telefono || ""); const [redesSociales, setRedesSociales] = useState(centro.redesSociales || {});
  const [colorPrimario, setColorPrimario] = useState(centro.colorPrimario || PALETAS[0].p); const [colorSecundario, setColorSecundario] = useState(centro.colorSecundario || PALETAS[0].s);
  const [logoPreview, setLogoPreview] = useState(centro.logoUrl || null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const cambiarLogo = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    setSubiendoLogo(true);
    try {
      const subido = await uploadToCloudinary(f);
      setLogoPreview(subido.url);
    } catch {
      alert("No se pudo subir el logo. Intenta de nuevo.");
    } finally {
      setSubiendoLogo(false);
    }
  };

  const guardar = (e) => {
    e.preventDefault();
    setCentro((c) => ({ ...c, mision, vision, objetivo, direccion, telefono, redesSociales, colorPrimario, colorSecundario, logoUrl: logoPreview }));
    setGuardado(true); setTimeout(() => setGuardado(false), 2500);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 22 }}>
        {[{ i: Users, l: "Personal", v: staff.length }, { i: BookOpen, l: "Cursos", v: cursosCount }, { i: Library, l: "Materiales", v: materialesCount }].map((s, idx) => (
          <div key={idx} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
            <s.i size={17} color={C.blueLight} />
            <div style={{ color: C.textDim, fontSize: 11, marginTop: 9, fontFamily: FM }}>{s.l}</div>
            <div style={{ color: C.text, fontSize: 22, fontWeight: 700, fontFamily: FD, marginTop: 2 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <h3 style={{ color: C.text, fontFamily: FD, fontSize: 15, margin: "0 0 4px" }}>Información del sitio</h3>
      <p style={{ color: C.textDim, fontSize: 12, marginTop: 0, marginBottom: 14 }}>Esto es lo que ven tus visitantes en el Inicio del sitio. Puedes editarlo cuando quieras.</p>
      <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 }}>
        {logoPreview && <img src={logoPreview} alt="" style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover" }} />}
        <label style={{ display: "flex", alignItems: "center", gap: 9, background: C.panel, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 11, cursor: subiendoLogo ? "default" : "pointer", width: "fit-content" }}>
          <Upload size={15} color={C.blueLight} /><span style={{ color: C.textDim, fontSize: 12.5 }}>{subiendoLogo ? "Subiendo…" : logoPreview ? "Cambiar logo" : "Subir logo"}</span>
          <input type="file" accept="image/*" disabled={subiendoLogo} style={{ display: "none" }} onChange={cambiarLogo} />
        </label>
        <textarea style={{ ...input, minHeight: 55 }} placeholder="Misión" value={mision} onChange={(e) => setMision(e.target.value)} />
        <textarea style={{ ...input, minHeight: 55 }} placeholder="Visión" value={vision} onChange={(e) => setVision(e.target.value)} />
        <textarea style={{ ...input, minHeight: 55 }} placeholder="Objetivo" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
        <SelectorColores colorPrimario={colorPrimario} colorSecundario={colorSecundario} onChange={(p, s) => { setColorPrimario(p); setColorSecundario(s); }} />
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
          <label style={lbl}>DATOS PARA EL PIE DE PÁGINA DE TU SITIO</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input style={input} placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            <input style={input} placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
          <label style={lbl}>REDES SOCIALES (visibles en el Inicio del sitio)</label>
          <EditorRedesSociales redes={redesSociales} setRedes={setRedesSociales} />
        </div>
        {guardado && <OkBox>Cambios guardados.</OkBox>}
        <button type="button" onClick={guardar} style={{ ...btn(false), width: "auto" }}><CheckCircle2 size={15} /> Guardar cambios</button>
      </div>
    </div>
  );
}
function PersonalTab({ sesion, centro, staff, setUsuarios, enviarCorreo }) {
  const [modo, setModo] = useState(null); // null | "completa" | "invitacion"
  const [rol, setRol] = useState("maestro"); const [nombre, setNombre] = useState(""); const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState(""); const [correo, setCorreo] = useState(""); const [error, setError] = useState(""); const [ultimo, setUltimo] = useState(null);

  const [rolInv, setRolInv] = useState("maestro"); const [correoInv, setCorreoInv] = useState(""); const [errorInv, setErrorInv] = useState(""); const [ultimoInv, setUltimoInv] = useState(null);
  const [preguntaSeguridad, setPreguntaSeguridad] = useState(PREGUNTAS_SEGURIDAD[0]); const [respuestaSeguridad, setRespuestaSeguridad] = useState("");
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [verFicha, setVerFicha] = useState(null);

  const agregar = async (e) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim() || !apellido.trim() || !cedula.trim() || !correo.trim()) { setError("Completa todos los campos."); return; }
    const correoLogin = correoInstitucional(nombre, apellido, centro.acronimo);
    const passwordTemporal = randPass();
    setUsuarios((us) => [...us, {
      correoLogin, cedula, password: passwordTemporal, rol, centroId: centro.id, nombre: `${nombre} ${apellido}`,
      correoReal: correo, debeCambiarPassword: true,
      preguntaSeguridad: respuestaSeguridad.trim() ? preguntaSeguridad : "", respuestaSeguridad: respuestaSeguridad.trim(),
    }]);
    setEnviandoCorreo(true);
    const resultado = await enviarInvitacionEmail({ to_email: correo, to_name: nombre, usuario: correoLogin, password: passwordTemporal, nombre_centro: centro.nombre });
    setEnviandoCorreo(false);
    setUltimo({ nombre, correoLogin, passwordTemporal, correoEnviado: resultado.ok, motivo: resultado.motivo });
    setNombre(""); setApellido(""); setCedula(""); setCorreo(""); setRespuestaSeguridad("");
  };

  const enviarInvitacion = async (e) => {
    e.preventDefault();
    setErrorInv("");
    if (!correoInv.trim()) { setErrorInv("Escribe el correo de la persona a invitar."); return; }
    const correoLogin = loginDesdeCorreoInvitacion(correoInv, centro.acronimo);
    const passwordTemporal = randPass();
    setUsuarios((us) => [...us, {
      correoLogin, cedula: "", password: passwordTemporal, rol: rolInv, centroId: centro.id,
      nombre: "(pendiente de completar)", correoReal: correoInv, debeCambiarPassword: true, pendienteDatos: true,
    }]);
    setEnviandoCorreo(true);
    const resultado = await enviarInvitacionEmail({ to_email: correoInv, to_name: correoInv, usuario: correoLogin, password: passwordTemporal, nombre_centro: centro.nombre });
    setEnviandoCorreo(false);
    setUltimoInv({ correoLogin, passwordTemporal, correoEnviado: resultado.ok, motivo: resultado.motivo });
    setCorreoInv("");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setModo((m) => m === "completa" ? null : "completa")} style={{ ...btn(false, modo === "completa" ? undefined : "ghost2"), width: "auto" }}><UserPlus size={15} /> Crear cuenta completa</button>
        <button onClick={() => setModo((m) => m === "invitacion" ? null : "invitacion")} style={{ ...btn(false, modo === "invitacion" ? undefined : "ghost2"), width: "auto" }}><Link2 size={15} /> Enviar link de invitación</button>
      </div>

      {modo === "completa" && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, marginBottom: 18, display: "flex", flexDirection: "column", gap: 11 }}>
          <select style={input} value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="admin2">Administrador</option>
            <option value="secretaria">Secretaría</option>
            <option value="maestro">Profesor</option>
            <option value="estudiante">Estudiante</option>
            <option value="visitante">Visitante</option>
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input style={input} placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <input style={input} placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </div>
          <input style={input} placeholder="Cédula" value={cedula} onChange={(e) => setCedula(e.target.value)} />
          <input style={input} placeholder="Correo personal (para notificarle)" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          {nombre && apellido && <div style={{ color: C.textDim, fontSize: 11.5 }}>Usuario generado: <span style={{ color: C.blueLight, fontFamily: FM }}>{correoInstitucional(nombre, apellido, centro.acronimo)}</span></div>}
          <div>
            <label style={lbl}>PREGUNTA DE SEGURIDAD (opcional, método alterno de recuperación)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <select style={input} value={preguntaSeguridad} onChange={(e) => setPreguntaSeguridad(e.target.value)}>
                {PREGUNTAS_SEGURIDAD.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input style={input} placeholder="Respuesta (déjalo vacío si no aplica)" value={respuestaSeguridad} onChange={(e) => setRespuestaSeguridad(e.target.value)} />
            </div>
          </div>
          <ErrorBox>{error}</ErrorBox>
          <button type="button" onClick={agregar} style={{ ...btn(false), width: "auto" }}><Plus size={15} /> Crear acceso y notificar</button>
          {ultimo && (
            <OkBox>
              Listo. {ultimo.nombre} — usuario <b style={{ fontFamily: FM }}>{ultimo.correoLogin}</b> y contraseña temporal <b style={{ fontFamily: FM }}>{ultimo.passwordTemporal}</b>.
              {" "}{ultimo.correoEnviado ? "✅ Correo enviado a su bandeja." : `⚠️ No pudimos enviar el correo automático (${ultimo.motivo || "error desconocido"}) — comparte estos datos manualmente.`}
            </OkBox>
          )}
        </div>
      )}

      {modo === "invitacion" && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, marginBottom: 18, display: "flex", flexDirection: "column", gap: 11 }}>
          <p style={{ color: C.textDim, fontSize: 12, margin: 0 }}>Solo necesitas el rol y su correo. Le llegará un link para entrar con un usuario y contraseña, y ahí completará sus propios datos.</p>
          <select style={input} value={rolInv} onChange={(e) => setRolInv(e.target.value)}>
            <option value="admin2">Administrador</option>
            <option value="secretaria">Secretaría</option>
            <option value="maestro">Profesor</option>
            <option value="estudiante">Estudiante</option>
            <option value="visitante">Visitante</option>
          </select>
          <input style={input} placeholder="Correo de la persona a invitar" value={correoInv} onChange={(e) => setCorreoInv(e.target.value)} />
          <ErrorBox>{errorInv}</ErrorBox>
          <button type="button" onClick={enviarInvitacion} style={{ ...btn(false), width: "auto" }}><Send size={15} /> Enviar invitación</button>
          {ultimoInv && (
            <OkBox>
              Invitación creada. Usuario <b style={{ fontFamily: FM }}>{ultimoInv.correoLogin}</b> y contraseña temporal <b style={{ fontFamily: FM }}>{ultimoInv.passwordTemporal}</b>.
              {" "}{ultimoInv.correoEnviado ? "✅ Correo enviado a su bandeja." : `⚠️ No pudimos enviar el correo automático (${ultimoInv.motivo || "error desconocido"}) — comparte estos datos manualmente.`}
            </OkBox>
          )}
        </div>
      )}

      {staff.length === 0 ? <div style={{ color: C.textDim, fontSize: 13.5 }}>Sin personal todavía.</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ color: C.textDim, fontSize: 11, fontFamily: FM }}>Toca a una persona para ver su ficha, suspenderla o eliminarla.</div>
          {staff.map((u, i) => (
            <button key={i} type="button" onClick={() => setVerFicha(u)} style={{ textAlign: "left", background: C.panel, border: `1px solid ${u.suspendido ? C.red + "66" : C.line}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", cursor: "pointer" }}>
              <span style={{ color: C.text, fontSize: 13.5 }}>{u.nombre}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {u.pendienteDatos && <Badge color={C.gold}>Invitación pendiente</Badge>}
                {u.suspendido && <Badge color={C.red}>Suspendido</Badge>}
                <Badge>{ROLES[u.rol]}</Badge>
              </div>
            </button>
          ))}
        </div>
      )}
      {verFicha && <FichaUsuarioModal usuario={verFicha} sesion={sesion} setUsuarios={setUsuarios} onClose={() => setVerFicha(null)} />}
    </div>
  );
}

function CursosTab({ centro, cursos, maestros, setCursos, setUsuarios }) {
  const [showForm, setShowForm] = useState(false);
  const [nombreCurso, setNombreCurso] = useState(""); const [maestroIdx, setMaestroIdx] = useState(""); const [error, setError] = useState("");

  const crear = (e) => {
    e.preventDefault(); setError("");
    if (!nombreCurso.trim() || maestroIdx === "") { setError("Completa el nombre y elige un profesor."); return; }
    setCursos((cs) => [...cs, { id: Date.now(), centroId: centro.id, nombre: nombreCurso, maestroNombre: maestros[maestroIdx].nombre, maestroCorreo: maestros[maestroIdx].correoLogin, codigoEstudiante: randCode(6), materiales: [], videollamada: null }]);
    setNombreCurso(""); setMaestroIdx(""); setShowForm(false);
  };

  const suspender = (c) => setCursos((cs) => cs.map((x) => x.id === c.id ? { ...x, suspendido: !x.suspendido } : x));
  const eliminar = (c) => {
    if (!confirm(`¿Eliminar el curso "${c.nombre}"? Esta acción no se puede deshacer y los estudiantes quedarán sin aula.`)) return;
    setCursos((cs) => cs.filter((x) => x.id !== c.id));
    setUsuarios((us) => us.map((u) => u.cursoId === c.id ? { ...u, cursoId: null } : u));
  };

  return (
    <div>
      <button onClick={() => setShowForm((s) => !s)} disabled={maestros.length === 0} style={{ ...btn(maestros.length === 0), width: "auto", marginBottom: 16 }}><Plus size={15} /> Crear curso</button>
      {maestros.length === 0 && <div style={{ color: C.textDim, fontSize: 12, marginTop: -10, marginBottom: 14 }}>Primero agrega un profesor.</div>}
      {showForm && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, marginBottom: 18, display: "flex", flexDirection: "column", gap: 11 }}>
          <input style={input} placeholder="Nombre del curso" value={nombreCurso} onChange={(e) => setNombreCurso(e.target.value)} />
          <select style={input} value={maestroIdx} onChange={(e) => setMaestroIdx(e.target.value)}>
            <option value="">Selecciona un profesor</option>
            {maestros.map((m, i) => <option key={i} value={i}>{m.nombre}</option>)}
          </select>
          <ErrorBox>{error}</ErrorBox>
          <button type="button" onClick={crear} style={{ ...btn(false), width: "auto" }}><Plus size={15} /> Crear</button>
        </div>
      )}
      {cursos.length === 0 ? <div style={{ color: C.textDim, fontSize: 13.5 }}>Sin cursos todavía.</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cursos.map((c) => (
            <div key={c.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "11px 14px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <div><div style={{ color: C.text, fontWeight: 600, fontSize: 13.5 }}>{c.nombre}</div><div style={{ color: C.textDim, fontSize: 11.5 }}>Profesor: {c.maestroNombre}</div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge color={C.gold}>Código: {c.codigoEstudiante}</Badge>
                {c.suspendido && <Badge color={C.red}>Suspendida</Badge>}
                <button type="button" onClick={() => suspender(c)} title={c.suspendido ? "Reactivar aula" : "Suspender aula"} style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 7, padding: "5px 7px", cursor: "pointer", color: c.suspendido ? C.green : C.gold, display: "flex" }}>
                  {c.suspendido ? <PlayCircle size={13} /> : <PauseCircle size={13} />}
                </button>
                <button type="button" onClick={() => eliminar(c)} title="Eliminar aula" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 7, padding: "5px 7px", cursor: "pointer", color: C.red, display: "flex" }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AvisosTab({ sesion, centro, staff, cursos, alertas, setAlertas, enviarCorreo }) {
  const [modo, setModo] = useState("grupo"); // grupo | curso | personas
  const [destinoGrupo, setDestinoGrupo] = useState("todos");
  const [cursoId, setCursoId] = useState(cursos[0]?.id || "");
  const [personasSel, setPersonasSel] = useState([]);
  const [mensaje, setMensaje] = useState(""); const [enviado, setEnviado] = useState(false); const [error, setError] = useState("");

  const estudiantesDeCurso = (id) => staff.filter((u) => u.rol === "estudiante" && u.cursoId === Number(id));

  const togglePersona = (correoLogin) => setPersonasSel((ps) => ps.includes(correoLogin) ? ps.filter((p) => p !== correoLogin) : [...ps, correoLogin]);

  const destinatarios = () => {
    if (modo === "grupo") return staff.filter((u) => destinoGrupo === "todos" || u.rol === destinoGrupo);
    if (modo === "curso") return estudiantesDeCurso(cursoId);
    return staff.filter((u) => personasSel.includes(u.correoLogin));
  };

  const enviar = (e) => {
    e.preventDefault();
    setError("");
    if (!mensaje.trim()) { setError("Escribe el mensaje del aviso."); return; }
    const dests = destinatarios();
    if (dests.length === 0) { setError("No hay destinatarios para esa selección."); return; }
    const para = modo === "grupo" ? destinoGrupo : modo === "curso" ? `curso: ${cursos.find((c) => c.id === Number(cursoId))?.nombre || cursoId}` : "personas específicas";
    const cursoIdAviso = modo === "curso" ? Number(cursoId) : null;
    setAlertas((al) => [{ id: nuevoId(), centroId: centro.id, cursoId: cursoIdAviso, para, mensaje: mensaje.trim(), autor: sesion.correoLogin, autorNombre: sesion.nombre, fecha: new Date().toLocaleString() }, ...al]);
    dests.forEach((u) => enviarCorreo(u.correoReal, `Aviso de ${centro.nombre}`, mensaje));
    setEnviado(true); setMensaje("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setModo("grupo")} style={{ ...btn(false, modo === "grupo" ? undefined : "ghost2"), width: "auto", fontSize: 12.5 }}>Por rol</button>
        <button type="button" onClick={() => setModo("curso")} disabled={cursos.length === 0} style={{ ...btn(cursos.length === 0, modo === "curso" ? undefined : "ghost2"), width: "auto", fontSize: 12.5 }}>A un curso</button>
        <button type="button" onClick={() => setModo("personas")} style={{ ...btn(false, modo === "personas" ? undefined : "ghost2"), width: "auto", fontSize: 12.5 }}>Personas específicas</button>
      </div>

      {modo === "grupo" && (
        <select style={input} value={destinoGrupo} onChange={(e) => setDestinoGrupo(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="maestro">Profesores</option>
          <option value="estudiante">Estudiantes</option>
        </select>
      )}

      {modo === "curso" && (
        cursos.length === 0 ? <div style={{ color: C.textDim, fontSize: 12.5 }}>Todavía no hay cursos creados.</div> : (
          <select style={input} value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
            {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({estudiantesDeCurso(c.id).length} estudiantes)</option>)}
          </select>
        )
      )}

      {modo === "personas" && (
        <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 10 }}>
          {staff.length === 0 ? <div style={{ color: C.textDim, fontSize: 12.5 }}>Sin personal ni estudiantes todavía.</div> : staff.map((u) => (
            <label key={u.correoLogin} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.text, cursor: "pointer" }}>
              <input type="checkbox" checked={personasSel.includes(u.correoLogin)} onChange={() => togglePersona(u.correoLogin)} />
              {u.nombre} <Badge>{ROLES[u.rol]}</Badge>
            </label>
          ))}
        </div>
      )}

      <textarea style={{ ...input, minHeight: 70 }} placeholder="Ej: Recuerden que el pago vence el día 30…" value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
      <ErrorBox>{error}</ErrorBox>
      {enviado && <OkBox>Aviso enviado (simulado por correo a cada destinatario).</OkBox>}
      <button type="button" onClick={enviar} style={{ ...btn(false), width: "auto" }}><Bell size={15} /> Enviar aviso</button>
      <HistorialAvisos avisos={alertas || []} sesion={sesion} setAlertas={setAlertas} />
    </div>
  );
}

// ============================= PANEL STAFF (maestro / admin2 / secretaría) =============================
function StaffDashboard({ sesion, centro, usuarios, setUsuarios, cursos, setCursos, biblioteca, setBiblioteca, chats, setChats, grupos, setGrupos, alertas, setAlertas, enviarCorreo, onSalir }) {
  const [tab, setTab] = useState(sesion.rol === "maestro" ? "cursos" : "personal");
  const misCursos = cursos.filter((c) => c.centroId === centro.id && (sesion.rol !== "maestro" || c.maestroCorreo === sesion.correoLogin || c.maestroNombre === sesion.nombre));
  const todosCursos = cursos.filter((c) => c.centroId === centro.id);
  const tema = temaDe(centro);

  return (
    <TemaContext.Provider value={tema}>
      <div style={{ width: "100%", maxWidth: 900, background: tema.fondoPagina, borderRadius: 24, padding: "22px 22px 30px" }}>
        <div style={{ borderRadius: 18, overflow: "hidden", border: `1px solid ${C.line}`, marginBottom: 20 }}>
          <div style={{ background: tema.grad, padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              {centro?.logoUrl ? <img src={centro.logoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} /> : (
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><GraduationCap size={22} color="#fff" /></div>
              )}
              <div>
                <div style={{ color: "#fff", fontFamily: FD, fontWeight: 700, fontSize: 18 }}>{centro?.nombre}</div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 11.5 }}>{sesion.nombre} · {ROLES[sesion.rol]}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {sesion.rol === "maestro" && (
                <span style={{ background: "rgba(0,0,0,0.22)", color: "#fff", borderRadius: 8, padding: "6px 11px", fontSize: 11, fontFamily: FM, display: "flex", alignItems: "center", gap: 5 }}>
                  <School size={11} /> {centro?.codigoCentro}
                </span>
              )}
              <button onClick={onSalir} style={{ background: "rgba(0,0,0,0.25)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 11px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}><LogOut size={13} /> Salir</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 2, background: C.panel, padding: "0 10px", flexWrap: "wrap" }}>
            {[
              sesion.rol === "maestro" && { k: "cursos", l: "Mis cursos", i: BookOpen },
              sesion.rol === "maestro" && { k: "avisos", l: "Avisos", i: Bell },
              (sesion.rol === "admin2" || sesion.rol === "secretaria") && { k: "personal", l: "Personal", i: Users },
              { k: "chat", l: "Chat", i: MessageCircle },
              { k: "biblioteca", l: "Biblioteca", i: Library },
            ].filter(Boolean).map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)} style={{ background: "none", border: "none", cursor: "pointer", padding: "12px 14px", borderBottom: tab === t.k ? `2.5px solid ${tema.s}` : "2.5px solid transparent", color: tab === t.k ? C.text : C.textDim, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <t.i size={14} /> {t.l}
              </button>
            ))}
          </div>
        </div>

        {tab === "cursos" && sesion.rol === "maestro" && (
          <MisCursosMaestro
            sesion={sesion} centro={centro} cursos={misCursos} todosCursos={todosCursos} setCursos={setCursos}
            usuarios={usuarios} setUsuarios={setUsuarios} enviarCorreo={enviarCorreo}
          />
        )}
        {tab === "avisos" && sesion.rol === "maestro" && (
          <AvisosMaestro sesion={sesion} centro={centro} cursos={misCursos} usuarios={usuarios} alertas={alertas} setAlertas={setAlertas} enviarCorreo={enviarCorreo} />
        )}
        {tab === "personal" && <PersonalTab sesion={sesion} centro={centro} staff={usuarios.filter((u) => u.centroId === centro.id)} setUsuarios={setUsuarios} enviarCorreo={enviarCorreo} />}
        {tab === "chat" && <Chat sesion={sesion} centro={centro} usuarios={usuarios} setUsuarios={setUsuarios} chats={chats} setChats={setChats} grupos={grupos} setGrupos={setGrupos} />}
        {tab === "biblioteca" && <Biblioteca sesion={sesion} centro={centro} biblioteca={biblioteca} setBiblioteca={setBiblioteca} />}
      </div>
    </TemaContext.Provider>
  );
}
// ============================= AVISOS DEL MAESTRO A SU(S) CURSO(S) =============================
function HistorialAvisos({ avisos, sesion, setAlertas }) {
  const eliminar = (id) => { if (confirm("¿Eliminar este aviso?")) setAlertas((al) => al.filter((a) => a.id !== id)); };
  if (avisos.length === 0) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ color: C.textDim, fontSize: 11, fontFamily: FM, marginBottom: 8 }}>AVISOS ENVIADOS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {avisos.map((a) => (
          <div key={a.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 13px", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
            <div>
              <div style={{ color: C.text, fontSize: 12.5 }}>{a.mensaje}</div>
              <div style={{ color: C.textDim, fontSize: 10.5, marginTop: 3 }}>{a.autorNombre || "—"} · {a.para} · {a.fecha}</div>
            </div>
            {a.autor === sesion.correoLogin && (
              <button type="button" onClick={() => eliminar(a.id)} title="Eliminar aviso" style={{ background: "none", border: "none", color: C.red, cursor: "pointer", flexShrink: 0 }}><Trash2 size={14} /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AvisosMaestro({ sesion, centro, cursos, usuarios, alertas, setAlertas, enviarCorreo }) {
  const [cursoId, setCursoId] = useState(cursos[0]?.id || "");
  const [mensaje, setMensaje] = useState(""); const [enviado, setEnviado] = useState(false); const [error, setError] = useState("");

  if (cursos.length === 0) return <div style={{ color: C.textDim, fontSize: 13.5 }}>Todavía no tienes ningún curso creado.</div>;

  const curso = cursos.find((c) => c.id === Number(cursoId)) || cursos[0];
  const estudiantes = usuarios.filter((u) => u.rol === "estudiante" && u.cursoId === curso.id);
  const misAvisos = (alertas || []).filter((a) => a.centroId === centro.id && cursos.some((c) => c.id === a.cursoId));

  const enviar = (e) => {
    e.preventDefault(); setError(""); setEnviado(false);
    if (!mensaje.trim()) { setError("Escribe el mensaje del aviso."); return; }
    if (estudiantes.length === 0) { setError("Este curso todavía no tiene estudiantes."); return; }
    setAlertas((al) => [{ id: nuevoId(), centroId: centro.id, cursoId: curso.id, para: `curso: ${curso.nombre}`, mensaje: mensaje.trim(), autor: sesion.correoLogin, autorNombre: sesion.nombre, fecha: new Date().toLocaleString() }, ...al]);
    estudiantes.forEach((u) => u.correoReal && enviarCorreo(u.correoReal, `Aviso de ${curso.nombre}`, mensaje.trim()));
    setEnviado(true); setMensaje("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
      <label style={lbl}>ENVIAR A LOS ESTUDIANTES DEL CURSO</label>
      <select style={input} value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
        {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({usuarios.filter((u) => u.rol === "estudiante" && u.cursoId === c.id).length} estudiantes)</option>)}
      </select>
      <textarea style={{ ...input, minHeight: 70 }} placeholder="Ej: Recuerden traer el proyecto mañana…" value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
      <ErrorBox>{error}</ErrorBox>
      {enviado && <OkBox>Aviso enviado a los estudiantes de {curso.nombre}.</OkBox>}
      <button type="button" onClick={enviar} style={{ ...temaBtn(useTema(), false), width: "auto" }}><Bell size={15} /> Enviar aviso</button>
      <HistorialAvisos avisos={misAvisos} sesion={sesion} setAlertas={setAlertas} />
    </div>
  );
}

function MisCursosMaestro({ sesion, centro, cursos, todosCursos, setCursos, usuarios, setUsuarios, enviarCorreo }) {
  const [seleccionado, setSeleccionado] = useState(cursos[0]?.id || null);
  const [cursoInvitadoId, setCursoInvitadoId] = useState(null);
  const listaBusqueda = todosCursos || cursos;
  const curso = cursoInvitadoId ? listaBusqueda.find((c) => c.id === cursoInvitadoId) : (cursos.find((c) => c.id === seleccionado) || cursos[0] || null);
  const [creando, setCreando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");

  const crearCurso = () => {
    if (!nombreNuevo.trim()) return;
    const nuevo = { id: nuevoId(), centroId: centro.id, nombre: nombreNuevo.trim(), maestroNombre: sesion.nombre, maestroCorreo: sesion.correoLogin, codigoEstudiante: randCode(6), materiales: [], videollamada: null };
    setCursos((cs) => [...cs, nuevo]);
    setCursoInvitadoId(null); setSeleccionado(nuevo.id);
    setNombreNuevo(""); setCreando(false);
  };

  return (
    <div>
      <EntrarConCodigo cursos={listaBusqueda} onEncontrado={(c) => setCursoInvitadoId(c.id)} label="Entrar a otro curso con código (aunque no seas su profesor asignado)" />
      {cursoInvitadoId && curso && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Badge color={C.gold}>Visitando: {curso.nombre}</Badge>
          <button type="button" onClick={() => setCursoInvitadoId(null)} style={{ ...ghost, fontSize: 11.5 }}>← Volver a mis cursos</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {!cursoInvitadoId && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 180 }}>
            {cursos.length === 0 && <div style={{ color: C.textDim, fontSize: 12.5, marginBottom: 6 }}>Todavía no tienes cursos. Crea el primero.</div>}
            {cursos.map((c) => (
              <button key={c.id} onClick={() => setSeleccionado(c.id)} style={{ textAlign: "left", background: (curso && curso.id === c.id) ? C.navy2 : "none", border: "none", borderRadius: 9, padding: "9px 11px", cursor: "pointer", color: C.text, fontSize: 13.5 }}>{c.nombre}</button>
            ))}
            {creando ? (
              <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                <input style={{ ...input, fontSize: 12.5, padding: "8px 10px" }} placeholder="Nombre del curso" value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={crearCurso} style={{ ...btn(false), width: "auto", fontSize: 12, padding: "7px 10px" }}><Plus size={13} /> Crear</button>
                  <button type="button" onClick={() => setCreando(false)} style={{ ...btn(false, "ghost2"), width: "auto", fontSize: 12, padding: "7px 10px" }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setCreando(true)} style={{ ...btn(false, "ghost2"), width: "auto", fontSize: 12.5, padding: "8px 10px", marginTop: 6 }}><Plus size={13} /> Crear otro curso</button>
            )}
          </div>
        )}
        {curso && (
          <CursoMaestroDetalle sesion={sesion} centro={centro} curso={curso} setCursos={setCursos} usuarios={usuarios} setUsuarios={setUsuarios} enviarCorreo={enviarCorreo} />
        )}
      </div>
    </div>
  );
}
// ============================= VIDEOLLAMADA PROPIA DEL AULA (WebRTC + Firebase, sin servicios externos) =============================
// Cada participante se conecta directamente con los demás (conexión "mesh", ideal para grupos pequeños,
// de 2 a 6 personas aproximadamente). Firebase Firestore solo se usa para "presentar" a los participantes
// entre sí (intercambiar la información técnica de conexión); el video y audio viajan directo entre
// navegadores, nunca pasan por un servidor. Solo se puede entrar desde el botón dentro del salón de
// clase (este componente solo se renderiza dentro de la vista de un curso al que ya se entró con sesión).
// ============================================================
// VIDEOLLAMADA — Jitsi Meet embebido dentro del sitio (no abre pestaña
// externa, no muestra la marca de Jitsi). Cada curso y cada sub-sala
// usan un nombre de sala único y difícil de adivinar, y solo se puede
// entrar desde el botón dentro del salón de clase.
// ============================================================
function SalonVideoJitsi({ salaId, sesion, nombreCentro, tema, onSalir }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);

  useEffect(() => {
    let cancelado = false;

    function iniciar() {
      if (cancelado || !window.JitsiMeetExternalAPI) return;
      const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: salaId,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName: sesion.nombre },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          defaultLanguage: "es",
          startWithVideoMuted: false,
          startWithAudioMuted: false,
          disableInviteFunctions: true,
          hideConferenceSubject: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: true,
          DEFAULT_BACKGROUND: C.navy,
          TOOLBAR_BUTTONS: [
            "microphone", "camera", "desktop", "fullscreen", "fodeviceselection",
            "hangup", "profile", "chat", "raisehand", "tileview", "select-background",
            "settings", "videoquality", "filmstrip",
          ],
        },
      });
      apiRef.current = api;
      api.executeCommand("subject", nombreCentro || "SICODE Educa");
      api.addEventListener("videoConferenceJoined", () => setCargando(false));
      api.addEventListener("readyToClose", () => onSalir());
      api.addEventListener("videoConferenceLeft", () => onSalir());
    }

    if (window.JitsiMeetExternalAPI) {
      iniciar();
    } else {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = iniciar;
      script.onerror = () => setErrorCarga(true);
      document.body.appendChild(script);
    }

    return () => {
      cancelado = true;
      if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaId]);

  if (errorCarga) {
    return (
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20 }}>
        <ErrorBox>No se pudo cargar la videollamada. Revisa tu conexión a internet e intenta de nuevo.</ErrorBox>
        <button type="button" onClick={onSalir} style={{ ...btn(false, "ghost2"), width: "auto", marginTop: 10 }}>← Salir</button>
      </div>
    );
  }

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: cargando ? C.textDim : C.green, fontSize: 12.5 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cargando ? C.textDim : C.green, display: "inline-block", boxShadow: cargando ? "none" : `0 0 8px ${C.green}` }} />
          {cargando ? "Conectando…" : "En vivo"}
        </div>
        <button type="button" onClick={onSalir} style={{ ...btn(false, "danger"), width: "auto" }}><PhoneOff size={14} /> Salir de la videollamada</button>
      </div>
      <div ref={containerRef} style={{ borderRadius: 10, overflow: "hidden", minHeight: 540, background: "#000" }} />
    </div>
  );
}

function VideollamadaCurso({ curso, sesion, centro, actualizarCurso, rol }) {
  const [nombreSub, setNombreSub] = useState("");
  const [salaActiva, setSalaActiva] = useState(null);
  const tema = useTema();
  const vc = curso.videollamada;

  const iniciar = () => {
    const sala = nombreSala(curso.nombre);
    actualizarCurso((c) => ({ ...c, videollamada: { activa: true, sala, iniciadaPor: sesion.nombre, fecha: new Date().toLocaleString(), subSalas: [] } }));
    setSalaActiva("principal");
  };
  const finalizar = () => { actualizarCurso((c) => ({ ...c, videollamada: { ...c.videollamada, activa: false } })); setSalaActiva(null); };
  const crearSubSala = () => {
    if (!nombreSub.trim()) return;
    actualizarCurso((c) => ({ ...c, videollamada: { ...c.videollamada, subSalas: [...(c.videollamada.subSalas || []), { id: nuevoId(), nombre: nombreSub.trim(), sala: `${c.videollamada.sala}-${slug(nombreSub)}` }] } }));
    setNombreSub("");
  };
  const quitarSubSala = (id) => actualizarCurso((c) => ({ ...c, videollamada: { ...c.videollamada, subSalas: c.videollamada.subSalas.filter((s) => s.id !== id) } }));

  if (!vc?.activa) {
    return rol === "maestro" ? (
      <div style={{ textAlign: "center", padding: "34px 12px", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12 }}>
        <Video size={26} color={tema.p} />
        <p style={{ color: C.textDim, fontSize: 13, margin: "10px 0 16px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
          Inicia la videollamada: todos los estudiantes de <b style={{ color: C.text }}>{curso.nombre}</b> podrán entrar desde este mismo botón, dentro del salón de clase.
        </p>
        <button type="button" onClick={iniciar} style={{ ...temaBtn(tema, false), width: "auto", margin: "0 auto" }}><Video size={15} /> Iniciar videollamada</button>
      </div>
    ) : (
      <div style={{ textAlign: "center", padding: "34px 12px", color: C.textDim, fontSize: 13.5, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12 }}>
        <Video size={22} /><div style={{ marginTop: 8 }}>No hay ninguna videollamada activa en este momento. Espera a que tu profesor la inicie.</div>
      </div>
    );
  }

  if (salaActiva) {
    const sub = salaActiva !== "principal" ? (vc.subSalas || []).find((s) => s.id === salaActiva) : null;
    const salaId = sub ? sub.sala : vc.sala;
    return <SalonVideoJitsi salaId={salaId} sesion={sesion} nombreCentro={centro?.nombre} tema={tema} onSalir={() => setSalaActiva(null)} />;
  }

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.green, marginBottom: 12, fontSize: 12.5 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, display: "inline-block", boxShadow: `0 0 8px ${C.green}` }} /> En vivo · iniciada por {vc.iniciadaPor} · {vc.fecha}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setSalaActiva("principal")} style={{ ...temaBtn(tema, false), width: "auto" }}><Video size={15} /> Entrar a la sala principal</button>
        {rol === "maestro" && <button type="button" onClick={finalizar} style={{ ...btn(false, "danger"), width: "auto" }}><PhoneOff size={15} /> Finalizar para todos</button>}
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ color: C.textDim, fontSize: 10.5, fontFamily: FM, marginBottom: 8 }}>SUB-SALAS (grupos pequeños dentro de la misma videollamada)</div>
        {(vc.subSalas || []).length === 0 && <div style={{ color: C.textDim, fontSize: 12, marginBottom: 8 }}>Sin sub-salas todavía. Cualquiera en la llamada puede crear una para trabajar en grupo pequeño.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          {(vc.subSalas || []).map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 11px" }}>
              <button type="button" onClick={() => setSalaActiva(s.id)} style={{ background: "none", border: "none", color: tema.p, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Users2 size={13} /> {s.nombre}</button>
              <button type="button" onClick={() => quitarSubSala(s.id)} title="Eliminar sub-sala" style={{ background: "none", border: "none", color: C.red, cursor: "pointer", display: "flex" }}><X size={13} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...input, padding: "8px 10px", fontSize: 12.5 }} placeholder="Nombre del grupo (ej. Grupo 1)" value={nombreSub} onChange={(e) => setNombreSub(e.target.value)} />
          <button type="button" onClick={crearSubSala} style={{ ...temaBtn(tema, false, "ghost2"), width: "auto", fontSize: 12 }}><Plus size={13} /> Crear</button>
        </div>
      </div>
    </div>
  );
}
function CursoMaestroDetalle({ sesion, centro, curso, setCursos, usuarios, setUsuarios, enviarCorreo }) {
  const [subtab, setSubtab] = useState("materiales");
  const tema = useTema();
  const estudiantes = usuarios.filter((u) => u.rol === "estudiante" && u.cursoId === curso.id);
  const actualizarCurso = (fn) => setCursos((cs) => cs.map((c) => c.id === curso.id ? fn(c) : c));

  return (
    <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <h3 style={{ color: C.text, fontFamily: FD, fontSize: 16, margin: 0 }}>{curso.nombre}</h3>
        <Badge color={tema.s}>Código de clase: {curso.codigoEstudiante}</Badge>
        <Badge>{estudiantes.length} estudiante{estudiantes.length === 1 ? "" : "s"}</Badge>
        {curso.suspendido && <Badge color={C.red}>Suspendida por la escuela</Badge>}
      </div>
      {curso.suspendido && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, background: C.red + "18", border: `1px solid ${C.red}55`, borderRadius: 10, padding: "10px 13px", fontSize: 12.5, marginBottom: 14 }}>
          <PauseCircle size={14} /> La escuela suspendió esta aula. Los estudiantes no pueden ver el contenido y no puedes publicar hasta que se reactive.
        </div>
      )}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
        {[{ k: "materiales", l: "Aula virtual", i: BookOpen }, { k: "estudiantes", l: "Estudiantes", i: Users }, { k: "calificaciones", l: "Calificaciones", i: ClipboardList }, { k: "videollamada", l: "Videollamada", i: Video }].map((t) => (
          <button key={t.k} onClick={() => setSubtab(t.k)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 10px", marginBottom: -1, borderBottom: subtab === t.k ? `2px solid ${tema.s}` : "2px solid transparent", color: subtab === t.k ? C.text : C.textDim, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
            <t.i size={13} /> {t.l}
          </button>
        ))}
      </div>
      {subtab === "materiales" && <MaterialesCurso sesion={sesion} curso={curso} actualizarCurso={actualizarCurso} estudiantes={estudiantes} suspendido={curso.suspendido} />}
      {subtab === "estudiantes" && <EstudiantesCurso sesion={sesion} centro={centro} curso={curso} estudiantes={estudiantes} setUsuarios={setUsuarios} enviarCorreo={enviarCorreo} />}
      {subtab === "calificaciones" && <CalificacionesMaestro curso={curso} estudiantes={estudiantes} />}
      {subtab === "videollamada" && (curso.suspendido
        ? <div style={{ color: C.textDim, fontSize: 13 }}>Esta aula está suspendida; la videollamada no está disponible.</div>
        : <VideollamadaCurso curso={curso} sesion={sesion} centro={centro} actualizarCurso={actualizarCurso} rol="maestro" />)}
    </div>
  );
}

// ============================= FICHA DE USUARIO (ver info + administrar) =============================
function FichaUsuarioModal({ usuario, sesion, setUsuarios, onClose }) {
  const puedeAdministrar = puedeAdministrarA(sesion, usuario) && !!setUsuarios;

  const toggleSuspender = () => {
    setUsuarios((us) => us.map((u) => u.correoLogin === usuario.correoLogin ? { ...u, suspendido: !u.suspendido } : u));
  };
  const eliminar = () => {
    if (!confirm(`¿Eliminar la cuenta de ${usuario.nombre}? Esta acción no se puede deshacer y borrará su acceso.`)) return;
    setUsuarios((us) => us.filter((u) => u.correoLogin !== usuario.correoLogin));
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 22, width: "100%", maxWidth: 380, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: C.textDim, cursor: "pointer", display: "flex" }}><X size={18} /></button>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          {usuario.fotoPerfil ? (
            <img src={usuario.fotoPerfil} alt="" style={{ width: 74, height: 74, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px" }} />
          ) : (
            <div style={{ width: 74, height: 74, borderRadius: "50%", background: C.navy2, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
              <Camera size={22} color={C.textDim} />
            </div>
          )}
          <div style={{ color: C.text, fontFamily: FD, fontWeight: 700, fontSize: 17 }}>{usuario.nombre}</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6 }}>
            <Badge>{ROLES[usuario.rol]}</Badge>
            {usuario.suspendido && <Badge color={C.red}>Suspendido</Badge>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <FilaInfo label="Usuario" valor={usuario.correoLogin} />
          <FilaInfo label="Cédula" valor={usuario.cedula || "No indicada"} />
          <FilaInfo label="Edad" valor={usuario.edad || "No indicada"} />
          <FilaInfo label="Correo" valor={usuario.correoReal || "No indicado"} />
        </div>
        {puedeAdministrar && (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={toggleSuspender} style={{ ...btn(false, "ghost2"), flex: 1, fontSize: 12.5 }}>
              {usuario.suspendido ? <PlayCircle size={14} /> : <PauseCircle size={14} />} {usuario.suspendido ? "Reactivar" : "Suspender"}
            </button>
            <button type="button" onClick={eliminar} style={{ ...btn(false, "danger"), flex: 1, fontSize: 12.5 }}>
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
function FilaInfo({ label, valor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}>
      <span style={{ color: C.textDim }}>{label}</span>
      <span style={{ color: C.text, fontFamily: FM, textAlign: "right" }}>{valor}</span>
    </div>
  );
}

// ============================= MI PERFIL (el estudiante completa/edita su propia info) =============================
function PerfilPropio({ sesion, setSesion, setUsuarios }) {
  const [edad, setEdad] = useState(sesion.edad || "");
  const [correoReal, setCorreoReal] = useState(sesion.correoReal || "");
  const [foto, setFoto] = useState(sesion.fotoPerfil || null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const cambiarFoto = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    setSubiendoFoto(true);
    try {
      const subido = await uploadToCloudinary(f);
      setFoto(subido.url);
      setUsuarios((us) => us.map((u) => u.correoLogin === sesion.correoLogin ? { ...u, fotoPerfil: subido.url } : u));
      setSesion((s) => ({ ...s, fotoPerfil: subido.url }));
    } catch {
      alert("No se pudo subir la foto. Intenta de nuevo.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardar = (e) => {
    e.preventDefault();
    setUsuarios((us) => us.map((u) => u.correoLogin === sesion.correoLogin ? { ...u, edad, correoReal, fotoPerfil: foto } : u));
    setSesion((s) => ({ ...s, edad, correoReal, fotoPerfil: foto }));
    setGuardado(true); setTimeout(() => setGuardado(false), 2500);
  };

  return (
    <Card maxWidth={420}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <label style={{ cursor: subiendoFoto ? "default" : "pointer", display: "inline-block", position: "relative" }}>
          {foto ? (
            <img src={foto} alt="" style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 84, height: 84, borderRadius: "50%", background: C.navy2, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={24} color={C.textDim} />
            </div>
          )}
          <div style={{ position: "absolute", bottom: -2, right: -2, background: C.blue, borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Camera size={13} color="#fff" />
          </div>
          <input type="file" accept="image/*" disabled={subiendoFoto} style={{ display: "none" }} onChange={cambiarFoto} />
        </label>
        {subiendoFoto && <div style={{ color: C.textDim, fontSize: 11, marginTop: 6 }}>Subiendo foto…</div>}
        <div style={{ color: C.text, fontFamily: FD, fontWeight: 700, fontSize: 16, marginTop: 10 }}>{sesion.nombre}</div>
        <div style={{ color: C.textDim, fontSize: 11.5, fontFamily: FM }}>{sesion.correoLogin}</div>
      </div>
      <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><label style={lbl}>EDAD</label><input style={input} value={edad} onChange={(e) => setEdad(e.target.value)} placeholder="Tu edad" /></div>
        <div><label style={lbl}>CORREO (para avisos y recuperar tu acceso)</label><input style={input} value={correoReal} onChange={(e) => setCorreoReal(e.target.value)} placeholder="tu@correo.com" /></div>
        {guardado && <OkBox>Perfil actualizado.</OkBox>}
        <button type="submit" style={btn(false)}><CheckCircle2 size={15} /> Guardar cambios</button>
      </form>
    </Card>
  );
}

function EstudiantesCurso({ sesion, centro, curso, estudiantes, setUsuarios, enviarCorreo }) {
  const [mostrar, setMostrar] = useState(false);
  const [nombre, setNombre] = useState(""); const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState(""); const [correo, setCorreo] = useState("");
  const [error, setError] = useState(""); const [ultimo, setUltimo] = useState(null);

  const agregar = async (e) => {
    e.preventDefault(); setError("");
    if (!nombre.trim() || !apellido.trim()) { setError("Completa al menos el nombre y el apellido."); return; }
    const correoLogin = correoInstitucional(nombre, apellido, centro.acronimo);
    const passwordTemporal = randPass();
    setUsuarios((us) => [...us, {
      correoLogin, cedula: cedula.trim(), password: passwordTemporal, rol: "estudiante", centroId: centro.id, cursoId: curso.id,
      nombre: `${nombre.trim()} ${apellido.trim()}`, correoReal: correo.trim(), debeCambiarPassword: true,
    }]);
    let correoEnviado = false; let motivo = "";
    if (correo.trim()) {
      const resultado = await enviarInvitacionEmail({ to_email: correo.trim(), to_name: nombre, usuario: correoLogin, password: passwordTemporal, nombre_centro: curso.nombre });
      correoEnviado = resultado.ok; motivo = resultado.motivo;
    }
    setUltimo({ nombre, correoLogin, passwordTemporal, correoEnviado, motivo, teniaCorreo: !!correo.trim() });
    setNombre(""); setApellido(""); setCedula(""); setCorreo("");
  };

  const [verFicha, setVerFicha] = useState(null);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <button type="button" onClick={() => setMostrar((s) => !s)} style={{ ...btn(false, mostrar ? undefined : "ghost2"), width: "auto" }}><UserPlus size={15} /> {mostrar ? "Cancelar" : "Agregar estudiante"}</button>
        <button type="button" onClick={() => imprimirListadoEstudiantes(curso, estudiantes)} style={{ ...btn(false, "ghost2"), width: "auto" }}><Download size={14} /> Imprimir listado</button>
        <button type="button" onClick={() => descargarExcelListado(curso, estudiantes)} style={{ ...btn(false, "ghost2"), width: "auto" }}><Download size={14} /> Descargar Excel (lista estudiantil)</button>
      </div>
      {mostrar && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input style={input} placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <input style={input} placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input style={input} placeholder="Cédula (opcional)" value={cedula} onChange={(e) => setCedula(e.target.value)} />
            <input style={input} placeholder="Correo del estudiante (opcional)" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>
          {nombre && apellido && <div style={{ color: C.textDim, fontSize: 11.5 }}>Usuario generado: <span style={{ color: useTema().p, fontFamily: FM }}>{correoInstitucional(nombre, apellido, centro.acronimo)}</span></div>}
          <ErrorBox>{error}</ErrorBox>
          <button type="button" onClick={agregar} style={{ ...temaBtn(useTema(), false), width: "auto" }}><Plus size={15} /> Agregar al curso</button>
          {ultimo && (
            <OkBox>
              Listo. Usuario <b style={{ fontFamily: FM }}>{ultimo.correoLogin}</b> · contraseña temporal <b style={{ fontFamily: FM }}>{ultimo.passwordTemporal}</b>.
              {" "}{!ultimo.teniaCorreo ? "No pusiste correo, así que compártele estos datos tú mismo." : ultimo.correoEnviado ? "✅ Correo enviado a su bandeja." : `⚠️ No pudimos enviar el correo automático (${ultimo.motivo || "error desconocido"}) — comparte estos datos manualmente.`}
            </OkBox>
          )}
        </div>
      )}
      {estudiantes.length === 0 ? <div style={{ color: C.textDim, fontSize: 13 }}>Todavía no hay estudiantes en este curso. Comparte el código <b style={{ color: C.gold }}>{curso.codigoEstudiante}</b> y el código de la escuela para que se registren solos, o agrégalos aquí.</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ color: C.textDim, fontSize: 11, fontFamily: FM }}>Toca a un estudiante para ver su ficha, suspenderlo o eliminarlo.</div>
          {estudiantes.map((u) => (
            <button key={u.correoLogin} type="button" onClick={() => setVerFicha(u)} style={{ textAlign: "left", background: C.panel, border: `1px solid ${u.suspendido ? C.red + "66" : C.line}`, borderRadius: 10, padding: "10px 13px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, cursor: "pointer" }}>
              <span style={{ color: C.text, fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}>
                {u.nombre}
                {u.suspendido && <Badge color={C.red}>Suspendido</Badge>}
              </span>
              <span style={{ color: C.textDim, fontSize: 11.5, fontFamily: FM }}>{u.correoLogin}</span>
            </button>
          ))}
        </div>
      )}
      {verFicha && <FichaUsuarioModal usuario={verFicha} sesion={sesion} setUsuarios={setUsuarios} onClose={() => setVerFicha(null)} />}
    </div>
  );
}

function CalificacionesMaestro({ curso, estudiantes }) {
  const tareas = (curso.materiales || []).filter((m) => m.tipo === "tarea");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <button type="button" onClick={() => imprimirCalificaciones(curso, estudiantes)} style={{ ...btn(false, "ghost2"), width: "auto" }}><Download size={14} /> Imprimir calificaciones por actividad</button>
      </div>
      {tareas.length === 0 ? (
        <div style={{ color: C.textDim, fontSize: 13 }}>Todavía no has creado actividades calificables (tareas) en esta aula.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 10px", color: C.textDim, borderBottom: `1px solid ${C.line}` }}>Estudiante</th>
                {tareas.map((t) => <th key={t.id} style={{ textAlign: "left", padding: "8px 10px", color: C.textDim, borderBottom: `1px solid ${C.line}` }}>{t.titulo}</th>)}
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((u) => (
                <tr key={u.correoLogin}>
                  <td style={{ padding: "8px 10px", color: C.text, borderBottom: `1px solid ${C.line}` }}>{u.nombre}</td>
                  {tareas.map((t) => {
                    const e = (t.entregas || []).find((x) => x.estudianteCorreo === u.correoLogin);
                    return <td key={t.id} style={{ padding: "8px 10px", color: C.text, borderBottom: `1px solid ${C.line}` }}>{e && e.calificacion !== undefined && e.calificacion !== "" ? e.calificacion : "—"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CalificacionesEstudiante({ curso, sesion }) {
  const tareas = (curso.materiales || []).filter((m) => m.tipo === "tarea");
  const filas = tareas.map((t) => {
    const e = (t.entregas || []).find((x) => x.estudianteCorreo === sesion.correoLogin);
    return { titulo: t.titulo, entrego: !!e, calificacion: e?.calificacion };
  });
  const calificadas = filas.filter((f) => f.calificacion !== undefined && f.calificacion !== "" && f.calificacion !== null);
  const promedio = calificadas.length ? (calificadas.reduce((s, f) => s + Number(f.calificacion), 0) / calificadas.length).toFixed(1) : null;

  if (tareas.length === 0) return <div style={{ color: C.textDim, fontSize: 13.5 }}>Todavía no hay actividades calificadas en esta aula.</div>;

  return (
    <div>
      {promedio && <div style={{ color: C.text, fontSize: 14, fontFamily: FD, fontWeight: 700, marginBottom: 14 }}>Promedio general: {promedio}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filas.map((f, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 13px" }}>
            <span style={{ color: C.text, fontSize: 13 }}>{f.titulo}</span>
            {f.calificacion !== undefined && f.calificacion !== "" && f.calificacion !== null ? (
              <Badge color={C.green}>{f.calificacion}</Badge>
            ) : f.entrego ? (
              <Badge color={C.gold}>Entregado, sin calificar</Badge>
            ) : (
              <Badge color={C.textDim}>Sin entregar</Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MaterialesCurso({ sesion, curso, actualizarCurso, estudiantes, suspendido }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const tema = useTema();
  const materiales = curso.materiales || [];

  const agregarMaterial = (item) => {
    actualizarCurso((c) => ({ ...c, materiales: [...(c.materiales || []), item] }));
    setMostrarForm(false);
  };

  return (
    <div>
      <button type="button" disabled={suspendido} onClick={() => setMostrarForm((s) => !s)} style={{ ...temaBtn(tema, suspendido, mostrarForm ? undefined : "ghost2"), width: "auto", marginBottom: 14 }}><Plus size={15} /> {mostrarForm ? "Cancelar" : "Publicar en el aula"}</button>
      {mostrarForm && !suspendido && <PublicarMaterialForm sesion={sesion} onPublicar={agregarMaterial} />}
      {materiales.length === 0 ? <div style={{ color: C.textDim, fontSize: 13 }}>Sin materiales todavía.</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {materiales.slice().reverse().map((m) => (
            <MaterialItemMaestro key={m.id} m={m} sesion={sesion} estudiantes={estudiantes} actualizarCurso={actualizarCurso} />
          ))}
        </div>
      )}
    </div>
  );
}

function PublicarMaterialForm({ sesion, onPublicar }) {
  const [tipo, setTipo] = useState("material");
  const [titulo, setTitulo] = useState(""); const [resumen, setResumen] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [fechaApertura, setFechaApertura] = useState(""); const [fechaCierre, setFechaCierre] = useState("");
  const [formatos, setFormatos] = useState([]);
  const [foroImagen, setForoImagen] = useState(null); const [foroLink, setForoLink] = useState(""); const [foroLinkTexto, setForoLinkTexto] = useState("");
  const [preguntas, setPreguntas] = useState([{ texto: "", opciones: [{ texto: "", correcta: true }, { texto: "", correcta: false }], puntos: 10 }]);
  const [error, setError] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  const toggleFormato = (k) => setFormatos((f) => f.includes(k) ? f.filter((x) => x !== k) : [...f, k]);
  const addPregunta = () => setPreguntas((ps) => [...ps, { texto: "", opciones: [{ texto: "", correcta: true }, { texto: "", correcta: false }], puntos: 10 }]);
  const quitarPregunta = (i) => setPreguntas((ps) => ps.filter((_, idx) => idx !== i));
  const cambiarPregunta = (i, campo, valor) => setPreguntas((ps) => ps.map((p, idx) => idx === i ? { ...p, [campo]: valor } : p));
  const addOpcion = (i) => setPreguntas((ps) => ps.map((p, idx) => idx === i ? { ...p, opciones: [...p.opciones, { texto: "", correcta: false }] } : p));
  const quitarOpcion = (i, oi) => setPreguntas((ps) => ps.map((p, idx) => idx === i ? { ...p, opciones: p.opciones.filter((_, oidx) => oidx !== oi) } : p));
  const cambiarOpcionTexto = (i, oi, texto) => setPreguntas((ps) => ps.map((p, idx) => idx === i ? { ...p, opciones: p.opciones.map((o, oidx) => oidx === oi ? { ...o, texto } : o) } : p));
  const marcarCorrecta = (i, oi) => setPreguntas((ps) => ps.map((p, idx) => idx === i ? { ...p, opciones: p.opciones.map((o, oidx) => ({ ...o, correcta: oidx === oi })) } : p));

  const publicar = async (e) => {
    e.preventDefault(); setError("");
    if (!titulo.trim()) { setError("Ponle un título."); return; }
    const base = {
      id: nuevoId(), tipo, titulo: titulo.trim(), resumen: resumen.trim(), publicadoPor: sesion.nombre,
      fecha: new Date().toLocaleDateString(), fechaApertura: fechaApertura || null, fechaCierre: fechaCierre || null,
    };
    setSubiendo(true);
    try {
      if (tipo === "material") {
        if (!archivo) { setError("Elige un archivo."); setSubiendo(false); return; }
        const subido = await uploadToCloudinary(archivo);
        onPublicar({ ...base, nombre: archivo.name, url: subido.url });
      } else if (tipo === "tarea") {
        const subido = archivo ? await uploadToCloudinary(archivo) : null;
        onPublicar({ ...base, nombre: archivo?.name || null, url: subido?.url || null, formatosAceptados: formatos, entregas: [] });
      } else if (tipo === "foro") {
        const imgSubida = foroImagen ? await uploadToCloudinary(foroImagen) : null;
        const publicaciones = [];
        if (resumen.trim() || foroImagen || foroLink.trim()) {
          publicaciones.push({
            id: nuevoId(), autor: sesion.correoLogin, autorNombre: sesion.nombre, rol: sesion.rol, texto: resumen.trim(),
            imagenUrl: imgSubida?.url || null,
            linkUrl: foroLink.trim() || null, linkTexto: foroLinkTexto.trim() || null, fecha: new Date().toLocaleString(), respuestas: [],
          });
        }
        onPublicar({ ...base, publicaciones });
      } else if (tipo === "carpeta") {
        onPublicar({ ...base, documentos: [] });
      } else if (tipo === "cuestionario") {
        const limpias = preguntas.filter((p) => p.texto.trim() && p.opciones.filter((o) => o.texto.trim()).length >= 2 && p.opciones.some((o) => o.correcta));
        if (limpias.length === 0) { setError("Agrega al menos una pregunta con dos opciones y marca la correcta."); setSubiendo(false); return; }
        onPublicar({ ...base, preguntas: limpias.map((p) => ({ ...p, opciones: p.opciones.filter((o) => o.texto.trim()) })), intentos: [] });
      }
    } catch {
      setError("No se pudo subir el archivo. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 11 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TIPOS_MATERIAL.map((t) => (
          <button key={t.k} type="button" onClick={() => setTipo(t.k)} style={{ ...btn(false, tipo === t.k ? undefined : "ghost2"), width: "auto", fontSize: 12, padding: "8px 11px" }}>{t.l}</button>
        ))}
      </div>
      <input style={input} placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <textarea style={{ ...input, minHeight: 50 }} placeholder={tipo === "foro" ? "Mensaje inicial del foro (opcional)" : "Resumen / instrucciones"} value={resumen} onChange={(e) => setResumen(e.target.value)} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><label style={lbl}>FECHA DE APERTURA (opcional)</label><input type="date" style={input} value={fechaApertura} onChange={(e) => setFechaApertura(e.target.value)} /></div>
        <div><label style={lbl}>FECHA DE CIERRE (opcional)</label><input type="date" style={input} value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} /></div>
      </div>

      {tipo === "material" && (
        <label style={{ display: "flex", alignItems: "center", gap: 9, background: C.panel, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 11, cursor: "pointer", width: "fit-content" }}>
          <Upload size={15} color={useTema().p} /><span style={{ color: C.textDim, fontSize: 12.5 }}>{archivo ? archivo.name : "Elegir archivo"}</span>
          <input type="file" style={{ display: "none" }} onChange={(e) => setArchivo(e.target.files[0] || null)} />
        </label>
      )}

      {tipo === "tarea" && (
        <>
          <label style={{ display: "flex", alignItems: "center", gap: 9, background: C.panel, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 11, cursor: "pointer", width: "fit-content" }}>
            <Upload size={15} color={useTema().p} /><span style={{ color: C.textDim, fontSize: 12.5 }}>{archivo ? archivo.name : "Adjuntar archivo guía (opcional)"}</span>
            <input type="file" style={{ display: "none" }} onChange={(e) => setArchivo(e.target.files[0] || null)} />
          </label>
          <div>
            <label style={lbl}>FORMATOS DE ENTREGA QUE ACEPTAS</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {FORMATOS_ENTREGA.map((f) => (
                <label key={f.k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={formatos.includes(f.k)} onChange={() => toggleFormato(f.k)} /> {f.l}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {tipo === "foro" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 9, background: C.panel, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 11, cursor: "pointer", width: "fit-content" }}>
            <Camera size={15} color={useTema().p} /><span style={{ color: C.textDim, fontSize: 12.5 }}>{foroImagen ? foroImagen.name : "Adjuntar foto (opcional)"}</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setForoImagen(e.target.files[0] || null)} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input style={input} placeholder="Link (opcional)" value={foroLink} onChange={(e) => setForoLink(e.target.value)} />
            <input style={input} placeholder="Texto del link" value={foroLinkTexto} onChange={(e) => setForoLinkTexto(e.target.value)} />
          </div>
        </div>
      )}

      {tipo === "cuestionario" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {preguntas.map((p, i) => (
            <div key={i} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input style={{ ...input, flex: 1 }} placeholder={`Pregunta ${i + 1}`} value={p.texto} onChange={(e) => cambiarPregunta(i, "texto", e.target.value)} />
                <input type="number" style={{ ...input, width: 80 }} value={p.puntos} onChange={(e) => cambiarPregunta(i, "puntos", Number(e.target.value) || 0)} title="Puntos" />
                {preguntas.length > 1 && <button type="button" onClick={() => quitarPregunta(i)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer" }}><Trash2 size={15} /></button>}
              </div>
              {p.opciones.map((o, oi) => (
                <div key={oi} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="radio" name={`correcta-${i}`} checked={o.correcta} onChange={() => marcarCorrecta(i, oi)} />
                  <input style={{ ...input, flex: 1, padding: "8px 10px" }} placeholder={`Opción ${oi + 1}`} value={o.texto} onChange={(e) => cambiarOpcionTexto(i, oi, e.target.value)} />
                  {p.opciones.length > 2 && <button type="button" onClick={() => quitarOpcion(i, oi)} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer" }}><X size={13} /></button>}
                </div>
              ))}
              <button type="button" onClick={() => addOpcion(i)} style={{ ...ghost, width: "fit-content", fontSize: 11.5 }}>+ Agregar opción</button>
            </div>
          ))}
          <button type="button" onClick={addPregunta} style={{ ...btn(false, "ghost2"), width: "auto", fontSize: 12.5 }}><Plus size={13} /> Agregar pregunta</button>
        </div>
      )}

      <ErrorBox>{error}</ErrorBox>
      <button type="button" onClick={publicar} disabled={subiendo} style={{ ...btn(subiendo), width: "auto" }}><Plus size={15} /> {subiendo ? "Subiendo…" : "Publicar"}</button>
    </div>
  );
}

function EstadoBadge({ item }) {
  const estado = estadoMaterial(item);
  if (estado === "programada") return <Badge color={C.purple}>Se abre el {item.fechaApertura}</Badge>;
  if (estado === "cerrada") return <Badge color={C.red}>Cerrada</Badge>;
  return <Badge color={C.green}>Abierta</Badge>;
}

function MaterialItemMaestro({ m, sesion, estudiantes, actualizarCurso }) {
  const tema = useTema();
  const tipoInfo = TIPOS_MATERIAL.find((t) => t.k === m.tipo) || TIPOS_MATERIAL[0];
  const actualizarItem = (cambios) => actualizarCurso((c) => ({
    ...c, materiales: c.materiales.map((x) => x.id === m.id ? (typeof cambios === "function" ? cambios(x) : { ...x, ...cambios }) : x)
  }));
  const ocultar = () => actualizarItem((it) => ({ ...it, oculto: !it.oculto }));
  const eliminar = () => {
    if (!confirm(`¿Eliminar "${m.titulo}"? Esta acción no se puede deshacer.`)) return;
    actualizarCurso((c) => ({ ...c, materiales: c.materiales.filter((x) => x.id !== m.id) }));
  };

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderLeft: `3px solid ${tema.p}`, borderRadius: 12, padding: 15, opacity: m.oculto ? 0.6 : 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Badge>{tipoInfo.l}</Badge>
          {(m.fechaApertura || m.fechaCierre) && <EstadoBadge item={m} />}
          {m.oculto && <Badge color={C.textDim}>Oculto para estudiantes</Badge>}
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button type="button" onClick={ocultar} title={m.oculto ? "Mostrar a los estudiantes" : "Ocultar a los estudiantes"} style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 7, padding: "5px 7px", cursor: "pointer", color: C.textDim, display: "flex" }}>
            {m.oculto ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button type="button" onClick={eliminar} title="Eliminar" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 7, padding: "5px 7px", cursor: "pointer", color: C.red, display: "flex" }}><Trash2 size={13} /></button>
        </div>
      </div>
      <div style={{ color: C.text, fontWeight: 700, fontSize: 15, fontFamily: FD, marginBottom: 4 }}>{m.titulo}</div>
      {m.resumen && <div style={{ color: C.textDim, fontSize: 12.5, marginBottom: 8 }}>{m.resumen}</div>}
      {(m.fechaApertura || m.fechaCierre) && (
        <div style={{ color: C.textDim, fontSize: 11, marginBottom: 8, display: "flex", gap: 10 }}>
          {m.fechaApertura && <span><Calendar size={10} style={{ verticalAlign: -1 }} /> Abre: {m.fechaApertura}</span>}
          {m.fechaCierre && <span><Calendar size={10} style={{ verticalAlign: -1 }} /> Cierra: {m.fechaCierre}</span>}
        </div>
      )}
      {m.tipo === "material" && m.url && (
        <a href={m.url} download={m.nombre} style={{ color: tema.p, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5 }}><Download size={13} /> {m.nombre}</a>
      )}
      {m.tipo === "tarea" && <TareaMaestro m={m} estudiantes={estudiantes} actualizarItem={actualizarItem} />}
      {m.tipo === "foro" && <ForoPanel m={m} sesion={sesion} actualizarItem={actualizarItem} rol="maestro" />}
      {m.tipo === "carpeta" && <CarpetaPanel m={m} actualizarItem={actualizarItem} rol="maestro" />}
      {m.tipo === "cuestionario" && <CuestionarioMaestro m={m} estudiantes={estudiantes} />}
    </div>
  );
}

function TareaMaestro({ m, estudiantes, actualizarItem }) {
  const entregas = m.entregas || [];
  const entregoMap = Object.fromEntries(entregas.map((e) => [e.estudianteCorreo, e]));
  const calificadas = entregas.filter((e) => e.calificacion !== undefined && e.calificacion !== null && e.calificacion !== "");
  const promedio = calificadas.length ? (calificadas.reduce((s, e) => s + Number(e.calificacion), 0) / calificadas.length).toFixed(1) : null;

  const calificar = (correo, valor) => {
    actualizarItem((it) => ({ ...it, entregas: it.entregas.map((e) => e.estudianteCorreo === correo ? { ...e, calificacion: valor } : e) }));
  };
  const descargarEntregas = () => {
    descargarCSV(`${m.titulo}-entregas.csv`, [
      ["Estudiante", "Correo", "Entregó", "Archivo", "Fecha entrega"],
      ...estudiantes.map((u) => [u.nombre, u.correoLogin, entregoMap[u.correoLogin] ? "Sí" : "No", entregoMap[u.correoLogin]?.archivoNombre || "", entregoMap[u.correoLogin]?.fecha || ""]),
    ]);
  };
  const descargarCalificaciones = () => {
    descargarCSV(`${m.titulo}-calificaciones.csv`, [
      ["Estudiante", "Correo", "Calificación"],
      ...entregas.map((e) => [e.estudianteNombre, e.estudianteCorreo, e.calificacion ?? ""]),
      ["", "PROMEDIO", promedio ?? ""],
    ]);
  };

  return (
    <div style={{ marginTop: 8 }}>
      {m.formatosAceptados?.length > 0 && <div style={{ color: C.textDim, fontSize: 11, marginBottom: 8 }}>Formatos aceptados: {m.formatosAceptados.map((k) => FORMATOS_ENTREGA.find((f) => f.k === k)?.l).join(", ")}</div>}
      <div style={{ color: C.text, fontSize: 12.5, marginBottom: 8 }}>Entregaron {entregas.length} de {estudiantes.length} estudiantes{promedio && ` · Promedio: ${promedio}`}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={descargarEntregas} style={{ ...btn(false, "ghost2"), width: "auto", fontSize: 11.5, padding: "6px 10px" }}><Download size={12} /> Lista de entregas</button>
        <button type="button" onClick={descargarCalificaciones} style={{ ...btn(false, "ghost2"), width: "auto", fontSize: 11.5, padding: "6px 10px" }}><Download size={12} /> Calificaciones</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {estudiantes.length === 0 && <div style={{ color: C.textDim, fontSize: 12 }}>Sin estudiantes en el curso.</div>}
        {estudiantes.map((u) => {
          const e = entregoMap[u.correoLogin];
          return (
            <div key={u.correoLogin} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: C.navy2, borderRadius: 8, padding: "7px 10px", flexWrap: "wrap" }}>
              <span style={{ color: C.text, fontSize: 12.5 }}>{u.nombre}</span>
              {e ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <a href={e.archivoUrl} download={e.archivoNombre} style={{ color: useTema().p, fontSize: 11.5, display: "flex", alignItems: "center", gap: 4 }}><Download size={11} /> {e.archivoNombre}</a>
                  <input type="number" min="0" max="100" placeholder="Nota" value={e.calificacion ?? ""} onChange={(ev) => calificar(u.correoLogin, ev.target.value)} style={{ ...input, width: 60, padding: "5px 7px", fontSize: 12 }} />
                </div>
              ) : <Badge color={C.red}>No entregó</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function insertarRespuesta(lista, targetId, respuesta) {
  return (lista || []).map((p) => {
    if (p.id === targetId) return { ...p, respuestas: [...(p.respuestas || []), respuesta] };
    if (p.respuestas?.length) return { ...p, respuestas: insertarRespuesta(p.respuestas, targetId, respuesta) };
    return p;
  });
}

function CajaRespuestaForo({ tema, onEnviar, placeholder, autofoco }) {
  const [texto, setTexto] = useState(""); const [imagen, setImagen] = useState(null); const [link, setLink] = useState(""); const [linkTexto, setLinkTexto] = useState("");
  const enviar = () => {
    if (!texto.trim() && !imagen && !link.trim()) return;
    onEnviar({ texto: texto.trim(), imagen, link: link.trim(), linkTexto: linkTexto.trim() });
    setTexto(""); setImagen(null); setLink(""); setLinkTexto("");
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <textarea autoFocus={autofoco} style={{ ...input, minHeight: 40, padding: "8px 10px", fontSize: 12.5 }} placeholder={placeholder} value={texto} onChange={(e) => setTexto(e.target.value)} />
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 5, background: C.navy2, border: `1px dashed ${C.line}`, borderRadius: 8, padding: "6px 9px", cursor: "pointer", fontSize: 11, color: C.textDim }}>
          <Camera size={12} /> {imagen ? imagen.name : "Foto"} <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setImagen(e.target.files[0] || null)} />
        </label>
        <input style={{ ...input, width: 110, padding: "6px 8px", fontSize: 11.5 }} placeholder="Link" value={link} onChange={(e) => setLink(e.target.value)} />
        <input style={{ ...input, width: 110, padding: "6px 8px", fontSize: 11.5 }} placeholder="Texto del link" value={linkTexto} onChange={(e) => setLinkTexto(e.target.value)} />
        <button type="button" onClick={enviar} style={{ ...temaBtn(tema, false), width: "auto", fontSize: 11.5, padding: "6px 11px" }}><Send size={12} /> Responder</button>
      </div>
    </div>
  );
}

function HiloForo({ p, nivel, sesion, cerrado, onResponder, tema }) {
  const [abierto, setAbierto] = useState(false);
  const esMio = p.autor === sesion.correoLogin;
  return (
    <div style={{ marginLeft: nivel > 0 ? 18 : 0, borderLeft: nivel > 0 ? `2px solid ${tema.pTinteFuerte}` : "none", paddingLeft: nivel > 0 ? 12 : 0, marginTop: nivel > 0 ? 10 : 0 }}>
      <div style={{ background: p.rol === "maestro" ? tema.pTinte : C.navy2, border: `1px solid ${p.rol === "maestro" ? tema.p + "55" : C.line}`, borderRadius: 10, padding: 10 }}>
        <div style={{ color: tema.p, fontSize: 11.5, marginBottom: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <b>{p.autorNombre}</b> <Badge color={p.rol === "maestro" ? tema.s : tema.p}>{ROLES[p.rol]}</Badge>
          {p.rol === "maestro" && nivel === 0 && <Badge color={tema.s}>Modelo del profesor</Badge>}
          <span style={{ color: C.textDim, fontWeight: 400 }}>· {p.fecha}</span>
        </div>
        {p.texto && <div style={{ color: C.text, fontSize: 13, marginBottom: p.imagenUrl || p.linkUrl ? 8 : 0 }}>{p.texto}</div>}
        {p.imagenUrl && <img src={p.imagenUrl} alt="" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: p.linkUrl ? 8 : 0 }} />}
        {p.linkUrl && <a href={p.linkUrl} target="_blank" rel="noreferrer" style={{ color: tema.p, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5 }}><Link2 size={12} /> {p.linkTexto || p.linkUrl}</a>}
        {!cerrado && (
          <button type="button" onClick={() => setAbierto((s) => !s)} style={{ marginTop: 8, background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
            <CornerDownRight size={12} /> {abierto ? "Cancelar" : "Responder"}
          </button>
        )}
        {abierto && (
          <div style={{ marginTop: 8 }}>
            <CajaRespuestaForo tema={tema} autofoco placeholder={`Responder a ${p.autorNombre}…`} onEnviar={(r) => { onResponder(p.id, r); setAbierto(false); }} />
          </div>
        )}
      </div>
      {(p.respuestas || []).map((r) => (
        <HiloForo key={r.id} p={r} nivel={nivel + 1} sesion={sesion} cerrado={cerrado} onResponder={onResponder} tema={tema} />
      ))}
    </div>
  );
}

function ForoPanel({ m, sesion, actualizarItem, rol }) {
  const tema = useTema();
  const cerrado = estaVencido(m);
  const publicaciones = m.publicaciones || [];

  const responder = async (targetId, { texto, imagen, link, linkTexto }) => {
    const subida = imagen ? await uploadToCloudinary(imagen).catch(() => null) : null;
    const nueva = {
      id: nuevoId(), autor: sesion.correoLogin, autorNombre: sesion.nombre, rol: sesion.rol, texto,
      imagenUrl: subida?.url || null, linkUrl: link || null, linkTexto: linkTexto || null,
      fecha: new Date().toLocaleString(), respuestas: [],
    };
    actualizarItem((it) => ({ ...it, publicaciones: insertarRespuesta(it.publicaciones || [], targetId, nueva) }));
  };

  const publicarModelo = async ({ texto, imagen, link, linkTexto }) => {
    const subida = imagen ? await uploadToCloudinary(imagen).catch(() => null) : null;
    const nueva = {
      id: nuevoId(), autor: sesion.correoLogin, autorNombre: sesion.nombre, rol: sesion.rol, texto,
      imagenUrl: subida?.url || null, linkUrl: link || null, linkTexto: linkTexto || null,
      fecha: new Date().toLocaleString(), respuestas: [],
    };
    actualizarItem((it) => ({ ...it, publicaciones: [...(it.publicaciones || []), nueva] }));
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
        {publicaciones.length === 0 && <div style={{ color: C.textDim, fontSize: 12 }}>{rol === "maestro" ? "Publica el modelo del foro para que los estudiantes puedan participar." : "El profesor todavía no ha publicado el modelo de este foro."}</div>}
        {publicaciones.map((p) => (
          <HiloForo key={p.id} p={p} nivel={0} sesion={sesion} cerrado={cerrado} onResponder={responder} tema={tema} />
        ))}
      </div>
      {cerrado ? (
        <Badge color={C.red}>Cerrado — ya no se pueden agregar respuestas.</Badge>
      ) : rol === "maestro" ? (
        <div style={{ background: C.navy2, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 10 }}>
          <div style={{ color: C.textDim, fontSize: 10.5, fontFamily: FM, marginBottom: 6 }}>PUBLICAR OTRO MODELO EN EL FORO</div>
          <CajaRespuestaForo tema={tema} placeholder="Escribe el planteamiento del foro…" onEnviar={publicarModelo} />
        </div>
      ) : null}
    </div>
  );
}

function CarpetaPanel({ m, actualizarItem, rol }) {
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const documentos = m.documentos || [];

  const agregar = async () => {
    if (!archivo) return;
    setSubiendo(true);
    try {
      const subido = await uploadToCloudinary(archivo);
      actualizarItem((it) => ({ ...it, documentos: [...(it.documentos || []), { id: nuevoId(), nombre: archivo.name, url: subido.url, fecha: new Date().toLocaleDateString() }] }));
      setArchivo(null);
    } catch {
      alert("No se pudo subir el documento. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      {documentos.length === 0 ? <div style={{ color: C.textDim, fontSize: 12 }}>Carpeta vacía.</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          {documentos.map((d) => (
            <a key={d.id} href={d.url} download={d.nombre} style={{ color: useTema().p, fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}><Download size={12} /> {d.nombre}</a>
          ))}
        </div>
      )}
      {rol === "maestro" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 7, background: C.navy2, border: `1px dashed ${C.line}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 11.5, color: C.textDim }}>
            <Upload size={13} /> {archivo ? archivo.name : "Elegir documento"} <input type="file" style={{ display: "none" }} onChange={(e) => setArchivo(e.target.files[0] || null)} />
          </label>
          <button type="button" onClick={agregar} disabled={subiendo} style={{ ...btn(subiendo), width: "auto", fontSize: 12, padding: "7px 12px" }}><Plus size={13} /> {subiendo ? "Subiendo…" : "Agregar"}</button>
        </div>
      )}
    </div>
  );
}

function CuestionarioMaestro({ m, estudiantes }) {
  const intentos = m.intentos || [];
  const totalPuntos = (m.preguntas || []).reduce((s, p) => s + (p.puntos || 0), 0);
  const promedio = intentos.length ? (intentos.reduce((s, i) => s + i.puntaje, 0) / intentos.length).toFixed(1) : null;

  const descargar = () => {
    descargarCSV(`${m.titulo}-resultados.csv`, [
      ["Estudiante", "Correo", "Puntaje", "Sobre", "Fecha"],
      ...intentos.map((i) => [i.estudianteNombre, i.estudianteCorreo, i.puntaje, totalPuntos, i.fecha]),
      ["", "", "PROMEDIO", promedio ?? "", ""],
    ]);
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ color: C.text, fontSize: 12.5, marginBottom: 8 }}>{(m.preguntas || []).length} pregunta(s) · {intentos.length} de {estudiantes.length} estudiantes respondieron{promedio && ` · Promedio: ${promedio}/${totalPuntos}`}</div>
      <button type="button" onClick={descargar} style={{ ...btn(false, "ghost2"), width: "auto", fontSize: 11.5, padding: "6px 10px" }}><Download size={12} /> Descargar resultados</button>
    </div>
  );
}

function MaterialItemEstudiante({ m, sesion, actualizarItem }) {
  const tipoInfo = TIPOS_MATERIAL.find((t) => t.k === (m.tipo || "material")) || TIPOS_MATERIAL[0];
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 15 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <Badge>{tipoInfo.l}</Badge>
        {(m.fechaApertura || m.fechaCierre) && <EstadoBadge item={m} />}
      </div>
      <div style={{ color: C.text, fontWeight: 700, fontSize: 15, fontFamily: FD, marginBottom: 4 }}>{m.titulo || m.nombre}</div>
      {m.resumen && <div style={{ color: C.textDim, fontSize: 12.5, marginBottom: 8 }}>{m.resumen}</div>}
      {m.fechaCierre && <div style={{ color: C.textDim, fontSize: 11, marginBottom: 8 }}><Calendar size={10} style={{ verticalAlign: -1 }} /> Fecha límite: {m.fechaCierre}</div>}
      {(!m.tipo || m.tipo === "material") && m.url && (
        <a href={m.url} download={m.nombre} style={{ color: useTema().p, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5 }}><Download size={13} /> {m.nombre}</a>
      )}
      {m.tipo === "tarea" && <TareaEstudiante m={m} sesion={sesion} actualizarItem={actualizarItem} />}
      {m.tipo === "foro" && <ForoPanel m={m} sesion={sesion} actualizarItem={actualizarItem} rol="estudiante" />}
      {m.tipo === "carpeta" && <CarpetaPanel m={m} actualizarItem={actualizarItem} rol="estudiante" />}
      {m.tipo === "cuestionario" && <CuestionarioEstudiante m={m} sesion={sesion} actualizarItem={actualizarItem} />}
    </div>
  );
}

function TareaEstudiante({ m, sesion, actualizarItem }) {
  const [archivo, setArchivo] = useState(null); const [error, setError] = useState(""); const [subiendo, setSubiendo] = useState(false);
  const cerrado = estaVencido(m);
  const miEntrega = (m.entregas || []).find((e) => e.estudianteCorreo === sesion.correoLogin);

  const entregar = async () => {
    setError("");
    if (!archivo) { setError("Elige un archivo para entregar."); return; }
    if (!extensionValida(archivo.name, m.formatosAceptados)) { setError("Ese formato de archivo no está permitido para esta tarea."); return; }
    setSubiendo(true);
    try {
      const subido = await uploadToCloudinary(archivo);
      const entrega = { estudianteCorreo: sesion.correoLogin, estudianteNombre: sesion.nombre, archivoNombre: archivo.name, archivoUrl: subido.url, fecha: new Date().toLocaleString(), calificacion: null };
      actualizarItem((it) => ({ ...it, entregas: [...(it.entregas || []).filter((e) => e.estudianteCorreo !== sesion.correoLogin), entrega] }));
      setArchivo(null);
    } catch {
      setError("No se pudo subir el archivo. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      {m.formatosAceptados?.length > 0 && <div style={{ color: C.textDim, fontSize: 11, marginBottom: 8 }}>Formatos aceptados: {m.formatosAceptados.map((k) => FORMATOS_ENTREGA.find((f) => f.k === k)?.l).join(", ")}</div>}
      {miEntrega && (
        <div style={{ color: C.green, fontSize: 12.5, marginBottom: 8 }}>
          Entregado: {miEntrega.archivoNombre} el {miEntrega.fecha}
          {(miEntrega.calificacion !== null && miEntrega.calificacion !== undefined && miEntrega.calificacion !== "") && <span style={{ color: C.gold }}> · Calificación: {miEntrega.calificacion}</span>}
        </div>
      )}
      {cerrado ? <Badge color={C.red}>Esta tarea ya cerró, no se puede entregar.</Badge> : (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 7, background: C.navy2, border: `1px dashed ${C.line}`, borderRadius: 8, padding: "8px 11px", cursor: "pointer", fontSize: 12, color: C.textDim }}>
            <Upload size={13} /> {archivo ? archivo.name : "Elegir archivo"} <input type="file" accept={acceptDeFormatos(m.formatosAceptados)} style={{ display: "none" }} onChange={(e) => setArchivo(e.target.files[0] || null)} />
          </label>
          <button type="button" onClick={entregar} disabled={subiendo} style={{ ...btn(subiendo), width: "auto", fontSize: 12, padding: "7px 12px" }}><CheckCircle2 size={13} /> {subiendo ? "Subiendo…" : miEntrega ? "Volver a entregar" : "Entregar"}</button>
        </div>
      )}
      <ErrorBox>{error}</ErrorBox>
    </div>
  );
}

function CuestionarioEstudiante({ m, sesion, actualizarItem }) {
  const miIntento = (m.intentos || []).find((i) => i.estudianteCorreo === sesion.correoLogin);
  const [respuestas, setRespuestas] = useState({});
  const cerrado = estaVencido(m);

  if (miIntento) {
    const totalPuntos = (m.preguntas || []).reduce((s, p) => s + (p.puntos || 0), 0);
    return (
      <div style={{ marginTop: 8 }}>
        <OkBox>Ya respondiste este cuestionario. Puntaje: {miIntento.puntaje} / {totalPuntos}</OkBox>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {(m.preguntas || []).map((p, i) => {
            const elegida = miIntento.respuestas[i];
            return (
              <div key={i} style={{ background: C.navy2, borderRadius: 8, padding: 10 }}>
                <div style={{ color: C.text, fontSize: 12.5, marginBottom: 6 }}>{p.texto}</div>
                {p.opciones.map((o, oi) => (
                  <div key={oi} style={{ fontSize: 12, color: o.correcta ? C.green : (oi === elegida ? C.red : C.textDim), display: "flex", alignItems: "center", gap: 6 }}>
                    {o.correcta ? <CheckCircle2 size={12} /> : (oi === elegida ? <XCircle size={12} /> : <span style={{ width: 12 }} />)} {o.texto}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (cerrado) return <Badge color={C.red}>Este cuestionario ya cerró.</Badge>;

  const responder = (i, oi) => setRespuestas((r) => ({ ...r, [i]: oi }));

  const enviar = () => {
    let puntaje = 0;
    (m.preguntas || []).forEach((p, i) => {
      const oi = respuestas[i];
      if (oi !== undefined && p.opciones[oi]?.correcta) puntaje += (p.puntos || 0);
    });
    const intento = { estudianteCorreo: sesion.correoLogin, estudianteNombre: sesion.nombre, respuestas, puntaje, fecha: new Date().toLocaleString() };
    actualizarItem((it) => ({ ...it, intentos: [...(it.intentos || []), intento] }));
  };

  const todasRespondidas = (m.preguntas || []).every((_, i) => respuestas[i] !== undefined);

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
      {(m.preguntas || []).map((p, i) => (
        <div key={i} style={{ background: C.navy2, borderRadius: 8, padding: 10 }}>
          <div style={{ color: C.text, fontSize: 12.5, marginBottom: 6 }}>{p.texto} <span style={{ color: C.textDim, fontSize: 10.5 }}>({p.puntos} pts)</span></div>
          {p.opciones.map((o, oi) => (
            <label key={oi} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.text, cursor: "pointer", marginBottom: 3 }}>
              <input type="radio" name={`q-${m.id}-${i}`} checked={respuestas[i] === oi} onChange={() => responder(i, oi)} /> {o.texto}
            </label>
          ))}
        </div>
      ))}
      <button type="button" onClick={enviar} disabled={!todasRespondidas} style={{ ...btn(!todasRespondidas), width: "auto", fontSize: 12.5 }}><Send size={13} /> Enviar respuestas</button>
    </div>
  );
}

// ============================= PANEL ESTUDIANTE =============================
function InfoBlock({ titulo, texto, color }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderLeft: `3px solid ${color}`, borderRadius: 12, padding: 14 }}>
      <div style={{ color, fontFamily: FM, fontSize: 11, marginBottom: 6, letterSpacing: 0.5 }}>{titulo.toUpperCase()}</div>
      <div style={{ color: C.text, fontSize: 13, lineHeight: 1.5 }}>{texto}</div>
    </div>
  );
}

function SitioFooter({ centro }) {
  const tema = useTema();
  const redesActivas = REDES_DISPONIBLES.filter((r) => centro.redesSociales?.[r.k]?.trim());
  return (
    <footer style={{ marginTop: 34, paddingTop: 18, borderTop: `1px solid ${C.line}`, color: C.textDim, fontSize: 12, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ color: C.text, fontWeight: 600 }}>{centro.nombre}</div>
      {centro.direccion && <div>{centro.direccion}</div>}
      {centro.telefono && <div>Tel: {centro.telefono}</div>}
      {centro.correoCentro && <div>{centro.correoCentro}</div>}
      {redesActivas.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {redesActivas.map((r) => (
            <a key={r.k} href={centro.redesSociales[r.k]} target="_blank" rel="noreferrer" title={r.l} style={{ width: 32, height: 32, borderRadius: 9, background: tema.pTinte, border: `1px solid ${tema.p}44`, display: "flex", alignItems: "center", justifyContent: "center", color: tema.p, textDecoration: "none" }}>
              <r.icon size={15} />
            </a>
          ))}
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 10.5 }}>© {new Date().getFullYear()} {centro.nombre} · sitio creado con SICODE Educa</div>
    </footer>
  );
}

function SitioHeader({ centro, sesion, foto, onFoto, onSalir, tabs, tab, setTab, subtitulo }) {
  const cp = centro?.colorPrimario || C.blue, cs = centro?.colorSecundario || C.gold;
  return (
    <div style={{ borderRadius: 18, overflow: "hidden", border: `1px solid ${C.line}`, marginBottom: 20 }}>
      <div style={{ background: `linear-gradient(120deg, ${cp}, ${cs})`, padding: "22px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {centro?.logoUrl ? <img src={centro.logoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} /> : (
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><GraduationCap size={22} color="#fff" /></div>
          )}
          <div>
            <div style={{ color: "#fff", fontFamily: FD, fontWeight: 700, fontSize: 18 }}>{centro?.nombre}</div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 11.5 }}>{subtitulo}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onFoto && (
            <div style={{ position: "relative" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.25)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {foto ? <img src={foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Camera size={14} color="#fff" />}
              </div>
              <label style={{ position: "absolute", bottom: -3, right: -3, background: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Plus size={10} color="#141A22" />
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={onFoto} />
              </label>
            </div>
          )}
          <div style={{ color: "#fff", fontSize: 12.5 }}>{sesion.nombre}</div>
          <button onClick={onSalir} style={{ background: "rgba(0,0,0,0.25)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 11px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}><LogOut size={13} /> Salir</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 2, background: C.panel, padding: "0 10px", flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ background: "none", border: "none", cursor: "pointer", padding: "12px 14px", borderBottom: tab === t.k ? `2.5px solid ${cs}` : "2.5px solid transparent", color: tab === t.k ? C.text : C.textDim, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <t.i size={14} /> {t.l}
          </button>
        ))}
      </div>
    </div>
  );
}
// ============================= PANEL ESTUDIANTE (sitio del centro) =============================
function EstudianteDashboard({ sesion, setSesion, centro, usuarios, setUsuarios, cursos, setCursos, biblioteca, setBiblioteca, chats, setChats, grupos, setGrupos, alertas, onSalir }) {
  const [tab, setTab] = useState("aula");
  const [subAula, setSubAula] = useState("materiales");
  const curso = cursos.find((c) => c.id === sesion.cursoId);
  const cambiarFoto = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const subido = await uploadToCloudinary(f);
      setUsuarios((us) => us.map((u) => u.correoLogin === sesion.correoLogin ? { ...u, fotoPerfil: subido.url } : u));
      setSesion((s) => ({ ...s, fotoPerfil: subido.url }));
    } catch {
      alert("No se pudo subir la foto. Intenta de nuevo.");
    }
  };
  const misAlertas = (alertas || []).filter((a) => a.centroId === centro?.id && (a.cursoId ? a.cursoId === sesion.cursoId : true));
  const tema = temaDe(centro);

  const unirseConCodigo = (c) => {
    setUsuarios((us) => us.map((u) => u.correoLogin === sesion.correoLogin ? { ...u, cursoId: c.id } : u));
    setSesion((s) => ({ ...s, cursoId: c.id }));
  };

  const actualizarCurso = (fn) => setCursos((cs) => cs.map((c) => c.id === curso.id ? fn(c) : c));
  const materialesVisibles = (curso?.materiales || []).filter((m) => yaAbrio(m) && !m.oculto);

  const tabs = [
    { k: "aula", l: "Aula virtual", i: BookOpen },
    { k: "calificaciones", l: "Mis calificaciones", i: ClipboardList },
    { k: "biblioteca", l: "Biblioteca", i: Library },
    { k: "chat", l: "Chat", i: MessageCircle },
    { k: "perfil", l: "Mi perfil", i: UserPlus },
  ];

  return (
    <TemaContext.Provider value={tema}>
      <div style={{ width: "100%", maxWidth: 860, background: tema.fondoPagina, borderRadius: 24, padding: "22px 22px 30px" }}>
        <SitioHeader centro={centro} sesion={sesion} foto={sesion.fotoPerfil} onFoto={cambiarFoto} onSalir={onSalir} tabs={tabs} tab={tab} setTab={setTab} subtitulo="Estudiante" />

        {misAlertas.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: tema.s, background: hexAAlpha(tema.s, 0.14), border: `1px solid ${hexAAlpha(tema.s, 0.4)}`, borderRadius: 10, padding: "10px 13px", fontSize: 13, marginBottom: 16 }}>
            <Bell size={15} /> {misAlertas[0].mensaje}
          </div>
        )}

        {tab === "aula" && (
          curso ? (
            curso.suspendido ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.red, background: C.red + "16", border: `1px solid ${C.red}55`, borderRadius: 12, padding: "16px 18px", fontSize: 13.5 }}>
                <PauseCircle size={18} /> La escuela suspendió temporalmente esta aula. Vuelve más tarde.
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                  <h3 style={{ color: C.text, fontFamily: FD, fontSize: 16, margin: 0 }}>{curso.nombre}</h3>
                  <div style={{ display: "flex", gap: 4, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 9, padding: 3 }}>
                    {[{ k: "materiales", l: "Materiales", i: BookOpen }, { k: "videollamada", l: "Videollamada", i: Video }].map((t) => (
                      <button key={t.k} onClick={() => setSubAula(t.k)} style={{ background: subAula === t.k ? tema.grad : "none", color: subAula === t.k ? "#fff" : C.textDim, border: "none", borderRadius: 7, padding: "6px 11px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                        <t.i size={12} /> {t.l}
                      </button>
                    ))}
                  </div>
                </div>
                {subAula === "materiales" && (
                  materialesVisibles.length === 0 ? <div style={{ color: C.textDim, fontSize: 13.5 }}>Sin materiales publicados todavía.</div> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {materialesVisibles.slice().reverse().map((m) => {
                        const actualizarItem = (cambios) => actualizarCurso((c) => ({
                          ...c, materiales: c.materiales.map((x) => x.id === m.id ? (typeof cambios === "function" ? cambios(x) : { ...x, ...cambios }) : x)
                        }));
                        return <MaterialItemEstudiante key={m.id} m={m} sesion={sesion} actualizarItem={actualizarItem} />;
                      })}
                    </div>
                  )
                )}
                {subAula === "videollamada" && <VideollamadaCurso curso={curso} sesion={sesion} centro={centro} actualizarCurso={actualizarCurso} rol="estudiante" />}
              </div>
            )
          ) : (
            <div>
              <div style={{ textAlign: "center", padding: "20px 12px 4px" }}>
                <BookOpen size={24} color={tema.p} />
                <p style={{ color: C.textDim, fontSize: 13, margin: "10px 0 16px" }}>Todavía no perteneces a ningún aula. Pide a tu profesor el código de la clase y entra aquí.</p>
              </div>
              <EntrarConCodigo cursos={cursos.filter((c) => c.centroId === centro.id)} onEncontrado={unirseConCodigo} label="ENTRAR A TU CURSO CON EL CÓDIGO DE TU PROFESOR" />
            </div>
          )
        )}
        {tab === "calificaciones" && (
          curso ? <CalificacionesEstudiante curso={curso} sesion={sesion} /> : <div style={{ color: C.textDim, fontSize: 13.5 }}>Todavía no perteneces a ningún aula.</div>
        )}
        {tab === "biblioteca" && <Biblioteca sesion={sesion} centro={centro} biblioteca={biblioteca} setBiblioteca={setBiblioteca} />}
        {tab === "chat" && <Chat sesion={sesion} centro={centro} usuarios={usuarios} setUsuarios={setUsuarios} chats={chats} setChats={setChats} grupos={grupos} setGrupos={setGrupos} />}
        {tab === "perfil" && <PerfilPropio sesion={sesion} setSesion={setSesion} setUsuarios={setUsuarios} />}

        {centro && <SitioFooter centro={centro} />}
      </div>
    </TemaContext.Provider>
  );
}

// ============================= PANEL VISITANTE (sitio del centro) =============================
function VisitanteDashboard({ sesion, centro, usuarios, biblioteca, chats, setChats, grupos, setGrupos, onSalir }) {
  const [tab, setTab] = useState("biblioteca");
  const tabs = [
    { k: "biblioteca", l: "Biblioteca", i: Library },
    { k: "chat", l: "Chat", i: MessageCircle },
  ];
  return (
    <div style={{ width: "100%", maxWidth: 820 }}>
      <SitioHeader centro={centro} sesion={sesion} foto={null} onFoto={null} onSalir={onSalir} tabs={tabs} tab={tab} setTab={setTab} subtitulo="Visitante" />
      {tab === "biblioteca" && <Biblioteca sesion={sesion} centro={centro} biblioteca={biblioteca} setBiblioteca={() => {}} readOnly />}
      {tab === "chat" && <Chat sesion={sesion} centro={centro} usuarios={usuarios} chats={chats} setChats={setChats} grupos={grupos} setGrupos={setGrupos} />}
      {centro && <SitioFooter centro={centro} />}
    </div>
  );
}
