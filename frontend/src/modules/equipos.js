import { request } from "./api.js";

// YA IMPLEMENTADO — ejemplo de uso de request()
// Respuesta: { data: [ { id, nombre }, ... ] }
export const listarCategorias = () => request("/categorias");

/**
 * Funciones de acceso a la API de equipos usando el cliente centralizado.
 */

// Consulta paginada de equipos con parametros de ruta
export const listarEquipos = (pagina = 1, porPagina = 6) => {
  return request(`/equipos?page=${pagina}&per_page=${porPagina}`);
};

// Envio de datos para registrar un nuevo equipo
export const crearEquipo = (datos) => {
  return request("/equipos", {
    method: "POST",
    body: datos,
  });
};

// Peticion para eliminar un equipo por su identificador
export const eliminarEquipo = (id) => {
  return request(`/equipos/${id}`, {
    method: "DELETE",
  });
};