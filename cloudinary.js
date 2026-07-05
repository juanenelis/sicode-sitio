// Sube un archivo (imagen o documento) a Cloudinary usando un "unsigned upload preset"
// y devuelve la URL pública del archivo subido.

const CLOUD_NAME = "nsh8wbqb";
const UPLOAD_PRESET = "sicode_clientes";

export async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
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
