// Envía una notificación por correo usando Web3Forms (https://web3forms.com)
// No requiere backend propio: el correo llega directo a la cuenta configurada
// en el panel de Web3Forms asociado a este access_key.

const WEB3FORMS_ACCESS_KEY = "d60ce5b6-6285-4610-8037-7fcaedc82d49";

export async function sendEmailNotification({ subject, fromName, data }) {
  try {
    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: subject || "Nueva notificación desde sicode.com.do",
      from_name: fromName || "Sitio SICODE",
      ...data,
    };
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    // Si falla el envío de correo, no debe romper el flujo principal (guardado en Firestore)
    return false;
  }
}
