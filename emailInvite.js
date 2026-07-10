// ============================================================
// Envío de credenciales (usuario/contraseña) al correo real de la
// persona invitada, usando EmailJS. A diferencia de Web3Forms (que
// solo notifica al dueño del sitio), EmailJS sí puede enviar a
// cualquier destinatario que le pasemos en "to_email".
// ============================================================
const EMAILJS_SERVICE_ID = "service_i6j7myf";
const EMAILJS_TEMPLATE_ID = "template_0stin9f";
const EMAILJS_PUBLIC_KEY = "SRjz-Xk_KYNsoTXjM";

export async function enviarInvitacionEmail({ to_email, to_name, usuario, password, nombre_centro, link_sitio }) {
  if (!to_email || !to_email.trim()) return { ok: false, motivo: "sin_correo" };
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: to_email.trim(),
          to_name: to_name || "",
          usuario: usuario || "",
          password: password || "",
          nombre_centro: nombre_centro || "SICODE Educa",
          link_sitio: link_sitio || (typeof window !== "undefined" ? window.location.origin : ""),
        },
      }),
    });
    if (!res.ok) {
      const texto = await res.text().catch(() => "");
      return { ok: false, motivo: texto || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: e.message || "error de red" };
  }
}
