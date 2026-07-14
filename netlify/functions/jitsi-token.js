// ============================================================
// Función de Netlify: genera un token (JWT) firmado para poder usar
// las videollamadas de Jitsi vía JaaS (8x8.vc).
//
// La clave privada NUNCA viaja al navegador — vive solo aquí, en el
// servidor de Netlify, leída de una variable de entorno secreta.
// El navegador solo le pide un token a esta función cada vez que
// alguien entra a una videollamada.
//
// Variable de entorno requerida en Netlify (Site settings → Environment
// variables): JAAS_PRIVATE_KEY  → pega ahí el contenido COMPLETO del
// archivo .pk (incluyendo las líneas -----BEGIN/END PRIVATE KEY-----).
// ============================================================
const jwt = require("jsonwebtoken");

const APP_ID = "vpaas-magic-cookie-0765e974aa644e15ba065b893753e8a9";
const KEY_ID = "vpaas-magic-cookie-0765e974aa644e15ba065b893753e8a9/9d2a20";

function obtenerClavePrivada() {
  let key = process.env.JAAS_PRIVATE_KEY || "";
  // Por si Netlify guarda los saltos de línea como texto "\n" en vez de saltos reales.
  if (key.includes("\\n") && !key.includes("\n")) key = key.replace(/\\n/g, "\n");
  return key;
}

exports.handler = async (event) => {
  const headersCORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: headersCORS, body: "" };
  }

  try {
    const privateKey = obtenerClavePrivada();
    if (!privateKey || !privateKey.includes("BEGIN PRIVATE KEY")) {
      return {
        statusCode: 500,
        headers: headersCORS,
        body: JSON.stringify({ error: "Falta configurar la variable de entorno JAAS_PRIVATE_KEY en Netlify." }),
      };
    }

    const params = event.queryStringParameters || {};
    const nombre = (params.name || "Invitado").slice(0, 60);
    const email = (params.email || "").slice(0, 100);
    const moderador = params.moderator === "1";

    const ahora = Math.floor(Date.now() / 1000);
    const payload = {
      aud: "jitsi",
      iss: "chat",
      sub: APP_ID,
      room: "*",
      exp: ahora + 60 * 60 * 3, // el token vale por 3 horas
      nbf: ahora - 10,
      context: {
        user: {
          name: nombre,
          email: email,
          moderator: moderador ? "true" : "false",
        },
        features: {
          livestreaming: "false",
          "outbound-call": "false",
          "sip-outbound-call": "false",
          transcription: "false",
          recording: "false",
        },
      },
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      header: { kid: KEY_ID, typ: "JWT" },
    });

    return {
      statusCode: 200,
      headers: { ...headersCORS, "Content-Type": "application/json" },
      body: JSON.stringify({ token, appId: APP_ID }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: headersCORS,
      body: JSON.stringify({ error: err.message || "Error generando el token." }),
    };
  }
};
