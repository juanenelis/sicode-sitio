// Sube un archivo (imagen o documento) a Cloudinary usando un "unsigned upload preset"
// y devuelve la URL pública del archivo subido.
//
// Las imágenes se suben como "image" (Cloudinary genera miniaturas/vistas previas).
// Los documentos (PDF, Word, etc.) se suben como "raw": se guardan tal cual, sin que
// Cloudinary intente renderizarlos — esto evita el error "Out of Processing Capacity"
// que da la cuenta gratis cuando intenta generar una vista previa de un PDF.

const CLOUD_NAME = "nsh8wbqb";
const UPLOAD_PRESET = "sicode_clientes";

export async function uploadToCloudinary(file) {
  const esImagen = (file.type || "").startsWith("image/");
  const tipoRecurso = esImagen ? "image" : "raw";
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${tipoRecurso}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error("Cloudinary upload failed: " + text);
  }
  const data = await res.json();
  return {
    url: data.secure_url,
    tipo: file.type || "application/octet-stream",
    nombreArchivo: file.name || "",
  };
}
