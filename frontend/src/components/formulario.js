import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

/**
 * Formulario de registro de equipos y control de validaciones.
 */
export const iniciarFormulario = ({ alGuardar }) => {
  // Carga inicial de categorias en el elemento select
  const cargarCategorias = async () => {
    try {
      const respuesta = await listarCategorias();
      const categorias = respuesta?.data || [];

      categorias.forEach((categoria) => {
        const option = document.createElement("option");
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        $selectCategoria.append(option);
      });
    } catch {
      mostrarMensaje("error", "No se pudieron cargar las categorias.");
    }
  };

  // Limpieza de mensajes de error previos y atributos de accesibilidad
  const limpiarErrores = () => {
    const mensajesError = document.querySelectorAll("[data-error]");
    mensajesError.forEach((p) => {
      p.textContent = "";
    });

    const camposInvalidos = $form.querySelectorAll("[aria-invalid]");
    camposInvalidos.forEach((campo) => {
      campo.removeAttribute("aria-invalid");
    });
  };

  // Gestion del envio de formulario y procesamiento de respuesta
  $form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limpiarErrores();

    const formData = new FormData($form);
    const datos = Object.fromEntries(formData.entries());

    // Conversion de campos numericos segun contrato
    if (datos.categoria_id) {
      datos.categoria_id = Number(datos.categoria_id);
    }
    if (datos.costo_interno !== undefined && datos.costo_interno !== "") {
      datos.costo_interno = Number(datos.costo_interno);
    }
    if (!datos.estado) {
      delete datos.estado;
    }

    // Estado visual de espera en el boton de envio
    const textoOriginal = $btnGuardar.textContent;
    $btnGuardar.disabled = true;
    $btnGuardar.textContent = "Guardando…";

    try {
      const resultado = await crearEquipo(datos);
      const codigo = resultado?.data?.codigo || datos.codigo;

      $form.reset();
      mostrarMensaje("exito", `Equipo ${codigo} registrado.`);

      if (typeof alGuardar === "function") {
        alGuardar();
      }
    } catch (error) {
      // Mapeo de errores de validacion 422 por campo
      if (error?.datos?.errors) {
        Object.entries(error.datos.errors).forEach(([campo, mensajes]) => {
          const mensajeTexto = Array.isArray(mensajes) ? mensajes[0] : mensajes;
          const parrafoError = document.querySelector(`[data-error="${campo}"]`);
          if (parrafoError) {
            parrafoError.textContent = mensajeTexto;
          }

          const campoInput = $form.querySelector(`[name="${campo}"]`);
          if (campoInput) {
            campoInput.setAttribute("aria-invalid", "true");
          }
        });
      } else {
        mostrarMensaje(
          "error",
          error?.datos?.mensaje || error.message || "Error al guardar el equipo."
        );
      }
    } finally {
      // Restauracion del estado del boton al finalizar la peticion
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = textoOriginal;
    }
  });

  cargarCategorias();
};