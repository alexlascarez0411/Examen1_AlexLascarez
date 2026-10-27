import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;

const $lista = document.querySelector("#lista-equipos");
const $plantilla = document.querySelector("#tpl-equipo");
const $resumen = document.querySelector("#resumen");
const $paginaActual = document.querySelector("#pagina-actual");
const $btnAnterior = document.querySelector("#btn-anterior");
const $btnSiguiente = document.querySelector("#btn-siguiente");

let paginaActual = 1;
let ultimaPagina = 1;

// YA IMPLEMENTADO — "2026-09-15" -> "15 set 2026"
export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

/**
 * Carga y renderizado de la lista paginada de equipos.
 */
export const cargarPagina = async (pagina = 1) => {
  // Marcado de estado ocupado para accesibilidad
  $lista.setAttribute("aria-busy", "true");

  try {
    // Peticion paginada al servicio centralizado
    const respuesta = await listarEquipos(pagina, POR_PAGINA);
    const equipos = respuesta?.data || [];
    const meta = respuesta?.meta || {};

    paginaActual = meta.current_page || pagina;
    ultimaPagina = meta.last_page || 1;

    // Limpieza del contenedor antes de renderizar
    $lista.replaceChildren();

    // Estado vacio si la respuesta no contiene registros
    if (equipos.length === 0) {
      const $liVacio = document.createElement("li");
      $liVacio.className = "vacio";
      $liVacio.textContent = "No hay equipos registrados.";
      $lista.append($liVacio);
    } else {
      // Renderizado de tarjetas 
      equipos.forEach((equipo) => {
        const fragmento = $plantilla.content.cloneNode(true);
        const $li = fragmento.querySelector("li");
        $li.dataset.id = String(equipo.id);

        const $codigo = fragmento.querySelector(".codigo");
        if ($codigo) $codigo.textContent = equipo.codigo;

        const $nombre = fragmento.querySelector(".nombre");
        if ($nombre) $nombre.textContent = equipo.nombre;

        const $categoria = fragmento.querySelector(".categoria");
        if ($categoria) $categoria.textContent = equipo.categoria?.nombre || "";

        const $fecha = fragmento.querySelector(".fecha");
        if ($fecha) $fecha.textContent = formatearFecha(equipo.fecha_adquisicion);

        const $estado = fragmento.querySelector(".estado");
        if ($estado) {
          $estado.textContent = equipo.estado;
          $estado.dataset.estado = equipo.estado;
        }

        $lista.append(fragmento);
      });
    }

    // Actualizacion de indicadores de resumen y paginacion
    const from = meta.from ?? 0;
    const to = meta.to ?? 0;
    const total = meta.total ?? 0;

    if ($resumen) {
      $resumen.textContent = `Mostrando ${from}–${to} de ${total}`;
    }

    if ($paginaActual) {
      $paginaActual.textContent = `Página ${paginaActual} de ${ultimaPagina}`;
    }

    // Bloqueo de botones de navegacion en los extremos
    if ($btnAnterior) {
      $btnAnterior.disabled = paginaActual <= 1;
    }
    if ($btnSiguiente) {
      $btnSiguiente.disabled = paginaActual >= ultimaPagina;
    }
  } catch (error) {
    mostrarMensaje(
      "error",
      error?.datos?.mensaje || error?.message || "Error al cargar la lista de equipos."
    );
  } finally {
    $lista.removeAttribute("aria-busy");
  }
};

/**
 * Eliminacion de equipos mediante delegacion de eventos y control de regla de negocio.
 */
const alHacerClicEnLista = async (evento) => {
  // Delegacion de eventos sobre el contenedor principal
  const $btnEliminar = evento.target.closest(".btn-eliminar");
  if (!$btnEliminar) return;

  const $li = $btnEliminar.closest("[data-id]");
  const id = $li?.dataset?.id;
  if (!id) return;

  // Confirmacion interactiva antes de proceder con el borrado
  const confirmado = confirm("¿Esta seguro que desea eliminar este equipo?");
  if (!confirmado) return;

  try {
    await eliminarEquipo(id);
    mostrarMensaje("exito", "Equipo eliminado correctamente.");

    // Ajuste hacia la pagina previa si era el unico registro de la pagina
    const totalVisibles = $lista.querySelectorAll("li:not(.vacio)").length;
    if (totalVisibles === 1 && paginaActual > 1) {
      paginaActual -= 1;
    }

    await cargarPagina(paginaActual);
  } catch (error) {
    // Mensaje exacto enviado por la API ante error de regla de negocio 409
    if (error?.status === 409 || error?.datos?.codigo === "REGLA_NEGOCIO") {
      mostrarMensaje("error", error.datos.mensaje);
    } else {
      mostrarMensaje(
        "error",
        error?.datos?.mensaje || error?.message || "Error al intentar eliminar el equipo."
      );
    }
  }
};

export const iniciarListado = () => {
  $lista.addEventListener("click", alHacerClicEnLista);

  // Asignacion de eventos de paginacion y carga inicial
  if ($btnAnterior) {
    $btnAnterior.addEventListener("click", () => {
      if (paginaActual > 1) {
        cargarPagina(paginaActual - 1);
      }
    });
  }

  if ($btnSiguiente) {
    $btnSiguiente.addEventListener("click", () => {
      if (paginaActual < ultimaPagina) {
        cargarPagina(paginaActual + 1);
      }
    });
  }

  cargarPagina(1);
};