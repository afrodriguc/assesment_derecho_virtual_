# LexIA — Asistente Jurídico Especializado

**Autor:** Andrés Rodríguez

---

## Descripción del proyecto

LexIA es un asistente jurídico especializado en **Derecho Español y Europeo**, desarrollado como parte de la prueba técnica.  
Permite automatizar la atención al alumno mediante un chatbot jurídico que responde consultas legales en tiempo real, usando **OpenAI GPT-4o**.

---

## Funcionalidades implementadas

✅ **Autenticación completa** (registro / login) mediante Supabase.

✅ **Interfaz de chat completa**:

- Input para consulta.
- Visualización de mensajes.
- Sidebar con historial de conversaciones.

✅ **Gestión de la API Key**:

- Campo tipo password para pegar la API Key.
- Almacenamiento en `localStorage`, no en base de datos.
- Uso en cada request en la cabecera `Authorization`.

✅ **Llamadas al LLM**:

- Endpoint: [https://api.openai.com/v1/chat/completions](https://api.openai.com/v1/chat/completions)
- Modelo: `gpt-4o`
- Parámetros: `temperature: 0.4`, `max_tokens: 8000`
- Prompt del sistema: _"Eres LexIA, asistente jurídico especializado en Derecho español y europeo. Responde con lenguaje claro y, cuando proceda, menciona la norma o jurisprudencia aplicable."_

✅ **Base de datos Supabase**:

- Tabla `messages` con:
  - `id`, `user_id`, `role`, `content`, `created_at`
- RLS configuradas.
- Historial completo por usuario.

---

## URL pública del proyecto

👉 [https://preview--span-law-assistant.lovable.app/](https://preview--span-law-assistant.lovable.app/)

---

## Instrucciones para desplegar localmente

1. Clonar el proyecto desde Lovable (opción Export Project → ZIP o GitHub).
2. Configurar un proyecto en Supabase:
   - Crear tabla `messages` (estructura proporcionada en el repo).
   - Habilitar Auth (email / password).
3. Obtener API Key en [platform.openai.com](https://platform.openai.com).
4. Ejecutar el proyecto en Lovable o como app web.

---

## Instrucciones para cambiar entre GPT y Gemini (extensible)

Actualmente la app está implementada con **OpenAI GPT-4o**.

Para extenderla a **Gemini**:

- Añadir en la UI un selector de modelo.
- Implementar un nuevo endpoint en `onSendMessage` para **Generative AI Gemini** (requiere configurar una cuenta de [Google AI Studio](https://makersuite.google.com/app)).
- Cambiar la llamada `fetch` según el modelo seleccionado.

---

## Mejoras pendientes

- Implementar un sistema de **limpieza de historial** (botón "Limpiar historial").
- Añadir un **feedback del usuario** (útil / no útil) para cada respuesta del asistente.
- Optimizar el control de **ventana de contexto** (limitar el tamaño del historial que se envía al LLM).
- Añadir **paginación** o scroll infinito en el sidebar de conversaciones.
- Implementar soporte para múltiples idiomas en la interfaz (internacionalización, i18n).
- Mejorar la gestión de errores en la UI (por ejemplo, cuando la API Key no es válida o la API falla).
- Añadir la posibilidad de **editar el prompt del sistema** desde la configuración avanzada.

---

