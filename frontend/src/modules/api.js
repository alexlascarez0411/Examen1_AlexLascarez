import { BASE_URL, TIEMPO_MAXIMO_MS } from "./config.js";
import { ErrorApi } from "./errores.js";
import { obtenerToken, olvidarSesion } from "./auth.js";

/**
 * Cliente HTTP único de la aplicación.
 */
export const request = async (ruta, opciones = {}) => {
  const url = `${BASE_URL}${ruta}`;

  // Control de tiempo límite con cancelación automática
  const controller = new AbortController();
  const idTimeout = setTimeout(() => controller.abort(), TIEMPO_MAXIMO_MS);

  // Encabezados base requeridos por la API
  const headers = {
    Accept: "application/json",
    ...(opciones.headers || {}),
  };

  // Adjunta el token Bearer si existe una sesión activa
  const token = obtenerToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Serializa el cuerpo a JSON cuando se enva un objeto
  let body = opciones.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      ...opciones,
      headers,
      body,
      signal: controller.signal,
    });

    // 204 No Content no contiene cuerpo de respuesta
    if (response.status === 204) {
      return null;
    }

    const cuerpoJson = await response.json().catch(() => null);

    // Validación de respuesta HTTP exitosa y control de sesión expirada
    if (!response.ok) {
      if (response.status === 401) {
        olvidarSesion();
        window.location.reload();
      }
      throw new ErrorApi(response.status, cuerpoJson);
    }

    return cuerpoJson;
  } finally {
    // Limpieza del temporizador al finalizar la petición
    clearTimeout(idTimeout);
  }
};