/* Proceso del chatbot SALVIA – flujo v0.6
   Fuente: árbol de decisión v0.3 (hoja Nodos: mensajes, reglas y datos) + diagrama de flujo v0.6
   (Diagrama_Flujo_Chatbot_SALVIA, 25-nov-2026: nodos N1b, N1c, N1d, I1a, HD, HG y N11a, rutas de T1, I1, H2 y cierre).
   X1 y las reglas globales se mantienen del árbol v0.3 (el v0.6 no las dibuja).
   Cada opción tiene "to" (nodo destino). Los tipos especiales:
   - multi: selección múltiple; el destino lo decide route(selección, estado)
   - questions: varias preguntas con sus propias respuestas (N7, P1)
   "FIN" termina el recorrido. */

const TREE_VERSION = "v0.6";

const NODES = {
  N0: { tipo: "Información", nombre: "Bienvenida",
    msg: "Hola, le habla el asistente virtual de SALVIA (Línea 155). Acompañamos situaciones de violencias basadas en género y por prejuicio. Este espacio es confidencial. Si necesita cerrar rápido, escriba SALIR.",
    regla: "Trato de «usted» en todo el flujo",
    datos: "canal, fecha_hora_inicio",
    opts: [{ label: "Continuar", to: "N1" }] },

  N1: { tipo: "Decisión", nombre: "Seguridad y peligro",
    msg: "¿Está en un lugar seguro para escribir en este momento? Si no puede escribir libremente, responda solo sí o no: ¿está en peligro ahora?",
    regla: "Seguridad primero: la protección prevalece sobre completar el registro",
    datos: "condicion_seguridad",
    opts: [
      { label: "Estoy en peligro", to: "E1" },
      { label: "No es seguro", to: "N1a", flag: "modoSilencioso" },
      { label: "Lugar seguro", to: "N2" } ] },

  N1a: { tipo: "Decisión", nombre: "Comunicación no segura",
    msg: "Le haré solo preguntas de sí o no. Si prefiere, díganos un horario y un medio seguro para contactarle.",
    regla: "Modo silencioso: preguntas cerradas, sin nombrar orientación sexual o identidad de género",
    datos: "modo_silencioso",
    opts: [{ label: "Responder por escrito", to: "N1b" }] },

  N1b: { tipo: "Captura de dato", nombre: "Datos por escrito (modo silencioso)", v06: true,
    msg: "Responda solo lo que pueda, con sí/no u opciones: un nombre o alias, su ubicación (botón de 1 clic o una referencia), y un teléfono y horario seguros para contactarle.",
    regla: "Modo silencioso: preguntas cerradas y cortas; ningún dato es obligatorio",
    datos: "nombre_o_alias, referencia_ubicacion, telefono_seguro, horario_seguro",
    opts: [
      { label: "Datos entregados", to: "N1c" },
      { label: "Datos parciales", to: "N1c" } ] },

  N1c: { tipo: "Captura de dato", nombre: "Registro preliminar en Mi SALVIA", v06: true,
    msg: "(Sin mensaje a la persona) El bot guarda un registro preliminar del caso en Mi SALVIA, en modo silencioso.",
    regla: "Verificar en Mi SALVIA que el registro quedó creado y marcado como modo silencioso",
    datos: "registro_preliminar",
    opts: [{ label: "Registro preliminar creado", to: "N1d" }] },

  N1d: { tipo: "Decisión", nombre: "¿Está en peligro ahora? (sí / no)", v06: true,
    msg: "¿Está en peligro ahora? Responda sí o no.",
    regla: "Sí → Alerta Inminente (E1). No → agendar un contacto seguro (H3)",
    datos: "en_peligro_si_no",
    opts: [
      { label: "Sí", to: "E1" },
      { label: "No: agendar", to: "H3" } ] },

  E1: { tipo: "Decisión", nombre: "Alerta Inminente: criterio", multi: true,
    msg: "Llame ya al 123 si puede. Mientras tanto, ¿qué está pasando? Puede elegir varias.",
    regla: "En WhatsApp: lista numerada, se responde con números separados por coma. Solo se pregunta por desaparición si se marcó la opción 12. Químicos: alejarse de la fuente. Lesiones: primeros auxilios básicos. Conducta suicida: H1 con Equipo Psicosocial",
    datos: "criterio_alerta_inminente",
    opts: [
      { label: "La están agrediendo ahora" }, { label: "Amenaza de muerte ahora" },
      { label: "Tiene o usó un arma" }, { label: "Está encerrada" },
      { label: "Lesiones graves o sangrado" }, { label: "Escapó y no tiene dónde quedarse" },
      { label: "La sacaron de su casa" }, { label: "Ataque con químicos" },
      { label: "Violencia sexual con amenaza de muerte" }, { label: "Agresor drogado o ebrio y violento" },
      { label: "Piensa en quitarse la vida", flag: "psicosocial" },
      { label: "Una persona está desaparecida" } ],
    route: (sel) => sel.includes("Una persona está desaparecida") ? "AR1" : "E2",
    rutaTexto: "Desaparición → AR1 · Resto → E2" },

  E2: { tipo: "Captura de dato", nombre: "Georreferenciación progresiva",
    msg: "¿Dónde se encuentra? Solo si es seguro, use el botón «Compartir mi ubicación» (1 clic). Si no, escriba municipio, barrio o vereda, o un lugar de referencia cercano (iglesia, escuela, tienda, puente).",
    regla: "No insistir si hay bloqueo o llanto: pasar a la agente. La ubicación viaja con el caso",
    datos: "ubicacion_gps, fuente_ubicacion, referencia_territorial, zona_rural",
    opts: [
      { label: "Compartir mi ubicación (1 clic)", to: "H1" },
      { label: "Escribir dirección o referencia", to: "H1" },
      { label: "No sé", to: "H1" } ] },

  H1: { tipo: "Handoff", nombre: "Agente Receptor: alerta inminente o prioridad 1",
    msg: "Le estamos conectando ya con una agente de SALVIA. No cierre este chat. Si se corta, llame al 155 o al 123.",
    regla: "La agente activa el protocolo de Alerta Inminente (12 pasos). SALVIA no es línea de emergencia: activa y articula",
    datos: "hora_handoff, criterio, ubicacion",
    opts: [{ label: "Transferir a la agente", to: "HD" }] },

  AR1: { tipo: "Decisión", nombre: "Alerta Rosa: encuadre y consentimiento",
    msg: "Le vamos a acompañar. SALVIA recibe el reporte y lo enlaza de inmediato con la Policía (123) o la Fiscalía (122), que activan la búsqueda. ¿Autoriza activar la Alerta Rosa y el uso de los datos de la persona desaparecida?",
    regla: "Aplica a niñas, niños, adolescentes, jóvenes hasta 28 años y mujeres. Informar límites operativos de SALVIA",
    datos: "consentimiento_alerta_rosa",
    opts: [
      { label: "Sí, autorizo", to: "AR2" },
      { label: "No", to: "H2" } ] },

  AR2: { tipo: "Captura de dato", nombre: "Alerta Rosa: datos mínimos",
    msg: "¿A quién buscamos? Nombre, edad, último lugar, fecha y hora en que fue vista, descripción y ropa, si tiene celular, GPS o redes sociales, y si hay indicios de peligro.",
    regla: "No aplicar tamizaje de riesgo al reportante: documentar «no aplica: reporte de tercero»",
    datos: "datos_reportante, datos_persona_desaparecida, ultimo_avistamiento, celular_gps_redes, indicios_peligro",
    opts: [{ label: "Formulario corto diligenciado", to: "AR3" }] },

  AR3: { tipo: "Handoff", nombre: "Alerta Rosa: llamada tripartita",
    msg: "Una agente le llamará ya para enlazarle con la Línea 123. Mantenga su celular encendido y cargado. No manipule pertenencias ni dispositivos de su familiar. Si recibe una llamada extorsiva, llame a la Línea 165 del GAULA.",
    regla: "Priorizar 123. Informar de inmediato a la Profesional de Alertas. Registrar en Mi SALVIA como «Alerta Rosa». Seguimiento 12 y 72 h",
    datos: "telefono_reportante, radicado_SIRDEC",
    opts: [{ label: "Confirmar número de contacto", to: "HD" }] },

  N2: { tipo: "Decisión", nombre: "Autorización de datos y debida diligencia",
    msg: "Antes de continuar: algunos de sus datos serán registrados y tratados para brindarle atención, según la Ley 1581 de 2012. Puede conocerlos, corregirlos o pedir su eliminación. Además, si identificamos un riesgo, es nuestro deber informar a las entidades competentes. ¿Autoriza el tratamiento de sus datos?",
    regla: "Hábeas data y debida diligencia son principios no negociables. La debida diligencia se informa, no se pide",
    datos: "autorizacion_datos, tipo_consentimiento",
    opts: [
      { label: "Autorizo registro completo", to: "N3" },
      { label: "Solo quiero información", to: "R0" },
      { label: "No autorizo", to: "R0a", flag: "sinDatos" } ] },

  N3: { tipo: "Decisión", nombre: "Quién escribe",
    msg: "¿Para quién es esta consulta?",
    regla: "Sujetos de atención del sistema",
    datos: "tipo_contacto, sujeto_atencion",
    opts: [
      { label: "Soy la persona afectada", to: "N3a" },
      { label: "Escribo por otra persona", to: "T1" },
      { label: "Soy menor de 18", to: "M1" },
      { label: "Soy familiar de una víctima de feminicidio", to: "F1" },
      { label: "Quiero ayuda porque puedo ejercer violencia", to: "HM1" },
      { label: "Soy funcionario(a)", to: "I1" },
      { label: "Quiero reportar una desaparición", to: "AR1" } ] },

  N3a: { tipo: "Captura de dato", nombre: "Nombre preferido y documento",
    msg: "¿Cómo prefiere que le llamemos? Si lo desea, escriba su tipo y número de documento para no duplicar su registro.",
    regla: "Verificación de no duplicidad en Mi SALVIA; si ya existe registro, se vincula y solo se pregunta lo nuevo",
    datos: "nombre_preferido, tipo_documento, numero_documento",
    opts: [
      { label: "Texto (nombre y documento)", to: "N4" },
      { label: "Prefiero no darlo", to: "N4" } ] },

  M1: { tipo: "Derivación", nombre: "Menor de edad",
    msg: "Le conectamos con la Línea 141 del ICBF. Si hay peligro ahora, llame al 123.",
    regla: "Orientar a la 141 NO excluye el registro: se crea registro mínimo en Mi SALVIA. Principio de no separación de la madre o cuidadora",
    datos: "derivacion_icbf, registro_minimo",
    opts: [
      { label: "Hay peligro ahora", to: "E1" },
      { label: "Es una desaparición", to: "AR1" },
      { label: "Continuar", to: "N11" } ] },

  T1: { tipo: "Decisión", nombre: "Ayudar a otra persona",
    msg: "¿La persona está en peligro ahora?",
    regla: "Sin tamizaje al tercero: documentar «no aplica». Registrar como reporte de terceros",
    datos: "reporte_tercero, relacion_con_victima",
    opts: [
      { label: "Sí", to: "E1" },
      { label: "No", to: "H2", flag: "tercero" },
      { label: "No sé", to: "H2", flag: "tercero" } ] },

  F1: { tipo: "Derivación", nombre: "Familiar de víctima de feminicidio",
    msg: "Lamentamos profundamente su pérdida. ¿En qué le podemos acompañar?",
    regla: "Formulario de Ingreso de Familiares de víctimas de feminicidio. Medidas: alojamiento, transporte, alimentación, apoyo exequial",
    datos: "motivo_familiar",
    opts: [
      { label: "Reportar el caso", to: "H2" },
      { label: "Barreras en el proceso", to: "H2" },
      { label: "Apoyo y medidas de emergencia para la familia", to: "H2" } ] },

  HM1: { tipo: "Derivación", nombre: "Hombre en riesgo de ejercer violencia",
    msg: "Gracias por buscar ayuda. Un profesional del equipo de orientación a hombres puede acompañarle.",
    regla: "Formulario Kobo de hombres; criterios de elegibilidad OPS",
    datos: "motivo_orientacion_hombres",
    opts: [
      { label: "Hablar ahora", to: "H2" },
      { label: "Que me llamen", to: "H3" } ] },

  I1: { tipo: "Información", nombre: "Funcionario(a): canal institucional",
    msg: "Información de articulación y canal institucional.",
    regla: "Pasa siempre a I1a para identificar al funcionario(a)",
    datos: "entidad",
    opts: [{ label: "Continuar", to: "I1a" }] },

  I1a: { tipo: "Captura de dato", nombre: "Datos del funcionario(a)", v06: true,
    msg: "¿Cuál es su nombre, la entidad donde trabaja y un teléfono de contacto?",
    regla: "Requiere apoyo → H2. Solo información → cierre (N11)",
    datos: "nombre_funcionario, entidad, telefono_funcionario",
    opts: [
      { label: "Requiere apoyo", to: "H2" },
      { label: "Solo información", to: "N11" } ] },

  N4: { tipo: "Captura de dato", nombre: "Ubicación",
    msg: "¿Dónde está? Use el botón «Compartir mi ubicación» (1 clic) o escriba departamento, municipio y vereda.",
    regla: "Define el directorio territorial de rutas",
    datos: "ubicacion_gps, fuente_ubicacion, departamento, municipio, zona_rural, referencia",
    opts: [
      { label: "Compartir mi ubicación (1 clic)", to: "N5" },
      { label: "Departamento, municipio y vereda", to: "N5" } ] },

  N5: { tipo: "Captura de dato", nombre: "Tipo de violencia", multi: true,
    msg: "¿Qué le está pasando? Puede elegir varias.",
    regla: "Selección múltiple",
    datos: "tipo_violencia",
    opts: [
      { label: "Física" }, { label: "Psicológica" }, { label: "Sexual" },
      { label: "Económica o patrimonial" }, { label: "A través de hijos u otras personas (vicaria)" },
      { label: "Política" }, { label: "Reproductiva" }, { label: "Prefiero no decir" } ],
    route: (sel) => sel.includes("Sexual") ? "N5a" : "N6",
    rutaTexto: "Sexual → N5a · Resto → N6" },

  N5a: { tipo: "Decisión", nombre: "Violencia sexual reciente",
    msg: "¿Pasó en los últimos 3 días?",
    regla: "Antes de 72 h: salud urgente",
    datos: "sexual_72h",
    opts: [
      { label: "Sí", to: "R1", flag: "prioridad1" },
      { label: "No", to: "N6" },
      { label: "Prefiero no decir", to: "N6" } ] },

  N6: { tipo: "Captura de dato", nombre: "Relación con quien agrede",
    msg: "¿Quién le hizo esto?",
    regla: "Pareja o expareja → instrumento pareja; resto → no pareja",
    datos: "relacion_agresor",
    opts: ["Pareja actual", "Expareja", "Familiar", "Conocido", "Compañero o jefe de trabajo", "Desconocido", "Prefiero no decir"]
      .map(l => ({ label: l, to: "N6a" })) },

  N6a: { tipo: "Decisión", nombre: "Agresor de fuerza pública o grupo armado",
    msg: "¿Esa persona pertenece a la Policía, el Ejército, seguridad privada o un grupo armado?",
    regla: "Si es fuerza pública: no activar su misma unidad; denuncia en Fiscalía. Si es grupo armado: valorar si la Fuerza Pública empeora la seguridad",
    datos: "agresor_fuerza_publica, agresor_grupo_armado",
    opts: ["Sí", "No", "No sé"].map(l => ({ label: l, to: "N7" })) },

  N7: { tipo: "Captura de dato", nombre: "Convivencia y dependencia", questions: true,
    msg: "¿Vive con esa persona? ¿Depende de ella económicamente?",
    regla: "—",
    datos: "cercania, dependencia_economica",
    qs: [
      { id: "convive", text: "¿Vive con esa persona?", answers: ["Sí", "No"] },
      { id: "depende", text: "¿Depende de ella económicamente?", answers: ["Sí", "No"] } ],
    route: () => "N8", rutaTexto: "N8" },

  N8: { tipo: "Captura de dato", nombre: "Recurrencia",
    msg: "¿Es la primera vez?",
    regla: "—", datos: "recurrencia",
    opts: ["Primera vez", "Segunda vez", "Ha pasado varias veces"].map(l => ({ label: l, to: "N8a" })) },

  N8a: { tipo: "Captura de dato", nombre: "Denuncias y medidas previas", multi: true,
    msg: "¿Ya presentó denuncia o tiene medidas de protección? ¿Esa persona las ha incumplido?",
    regla: "Incumplimiento de medidas eleva el riesgo. Guion de denuncia fácil lo continúa la agente",
    datos: "denuncia_previa, NUNC, medidas_proteccion, incumplimiento_medidas",
    opts: [
      { label: "Ya denuncié (número opcional)" }, { label: "Tengo medidas de protección" },
      { label: "Las ha incumplido", flag: "incumplio" }, { label: "No" } ],
    route: () => "P1", rutaTexto: "P1" },

  P1: { tipo: "Pretamizaje", nombre: "Pretamizaje", questions: true,
    msg: "Preguntas A1–A7 (hoja Prioridad)",
    regla: "Solo si escribe la persona afectada. Prioridad 1: cualquier alerta crítica (A1–A3) o 3 o más moderadas. Prioridad 2: 1 o 2 moderadas. Prioridad 3: ninguna",
    datos: "A1–A7, prioridad_bot",
    qs: [
      { id: "A1", peso: "Crítica", text: "¿Le ha amenazado de muerte o con hacerle daño grave?" },
      { id: "A2", peso: "Crítica", text: "¿Le ha intentado ahorcar, asfixiar o quitar el aire, o intentó matarle antes?" },
      { id: "A3", peso: "Crítica", text: "¿Tiene o puede conseguir un arma?" },
      { id: "A4", peso: "Moderada", text: "¿La violencia ha aumentado en frecuencia o gravedad, o le persigue o controla lo que hace?" },
      { id: "A5", peso: "Moderada", text: "¿Ha incumplido medidas de protección u órdenes de alejamiento?" },
      { id: "A6", peso: "Moderada", text: "¿Hay niñas, niños u otras personas a su cargo en riesgo?" },
      { id: "A7", peso: "Moderada", text: "¿Ha sufrido violencia sexual por parte de esa persona?" }
    ].map(q => ({ ...q, answers: ["Sí", "No", "Prefiero no decir"] })),
    route: (ans, st) => {
      const p = prioridadP1(ans);
      st.prioridad = Math.min(st.prioridad || 3, p);
      return p === 1 ? "H1" : p === 2 ? "H2" : "N9";
    },
    rutaTexto: "Prioridad 1 → H1 · 2 → H2 · 3 → N9" },

  N9: { tipo: "Captura de dato", nombre: "Enfoque diferencial (opcional)", multi: true,
    msg: "Si lo desea, cuéntenos un poco más de usted para atenderle mejor.",
    regla: "Opcional, no bloquea. Activa rutas diferenciales. Respetar nombre y pronombres",
    datos: "variables_diferenciales",
    opts: [
      { label: "Identidad de género" }, { label: "Orientación sexual" },
      { label: "Pertenencia étnica: indígena o NARP" }, { label: "Pertenencia étnica: otra" },
      { label: "Discapacidad" }, { label: "Migrante" }, { label: "Lideresa o defensora" },
      { label: "Víctima del conflicto armado" }, { label: "Zona rural" }, { label: "Omitir" } ],
    route: (sel) => sel.includes("Pertenencia étnica: indígena o NARP") ? "N9a" : "N10",
    rutaTexto: "Indígena o NARP → N9a · Resto → N10" },

  N9a: { tipo: "Decisión", nombre: "Jurisdicción (pueblos étnicos)",
    msg: "Reconociendo su identidad, ¿quiere que su caso lo conozca la Jurisdicción Especial Indígena o la Jurisdicción Ordinaria?",
    regla: "JEI: orientar a la autoridad de su comunidad e informar a la COCOIN",
    datos: "jurisdiccion",
    opts: ["Jurisdicción Especial Indígena", "Jurisdicción Ordinaria", "No sé"].map(l => ({ label: l, to: "N10" })) },

  N10: { tipo: "Decisión", nombre: "Qué necesita",
    msg: "¿Qué le ayudaría ahora?",
    regla: "Medidas de emergencia: Cruz Roja tiene 72 h para contactar",
    datos: "necesidad, solicita_medidas_emergencia",
    opts: [
      { label: "Hablar con una profesional", to: "H2" },
      { label: "Conocer mis derechos y rutas", to: "R2" },
      { label: "Que me llamen después", to: "H3" },
      { label: "Un lugar seguro, transporte o alimentación", to: "H2", flag: "medidasEmergencia" } ] },

  R0: { tipo: "Captura de dato", nombre: "Registro de orientación",
    msg: "Para darle información útil: ¿en qué departamento y municipio está y sobre qué quiere saber?",
    regla: "Crea registro de orientación en la base SALVIA; no pide nombre ni documento",
    datos: "id_consulta, fecha_hora, canal, departamento, municipio, tema_consulta",
    opts: ["Derechos", "Tipos de violencia", "Dónde denunciar", "Medidas de protección", "Apoyo psicosocial", "Otro"]
      .map(l => ({ label: l, to: "R0a" })) },

  R0a: { tipo: "Derivación", nombre: "Información solicitada",
    msg: "Información de derechos (Ley 1257 de 2008) y rutas del municipio según el tema. ¿Algo más?",
    regla: "Si llegó por «No autorizo»: solo estadística anónima, sin datos personales",
    datos: "informacion_entregada, paso_a_humano",
    opts: [
      { label: "Otra consulta", to: "R0" },
      { label: "Hablar con alguien", to: "H2" },
      { label: "Terminar", to: "N11" } ] },

  R1: { tipo: "Derivación", nombre: "Salud urgente",
    msg: "Acuda a urgencias antes de 72 h: atención integral, anticoncepción de emergencia y profilaxis. Puede denunciar en la Fiscalía, Línea 122.",
    regla: "Prioridad 1. Evitar preguntas forenses extensas",
    datos: "ruta_informada",
    opts: [{ label: "Continuar", to: "H1" }] },

  R2: { tipo: "Derivación", nombre: "Rutas según el caso",
    msg: "Le mostramos la ruta que aplica con las entidades de su municipio.",
    regla: "Orden: salud si hay lesiones; Comisaría si es ámbito familiar; Fiscalía en otros ámbitos; UNP si es ámbito político",
    datos: "ruta_informada",
    opts: [
      { label: "Entendido", to: "N11" },
      { label: "Hablar con alguien", to: "H2" } ] },

  H2: { tipo: "Handoff", nombre: "Profesional estándar",
    msg: "¿Quiere hablar ahora con una profesional o prefiere que le llamemos?",
    regla: "Riesgo alto o extremo → Seguimiento de Riesgo; moderado o bajo → Seguimiento general",
    datos: "hora_handoff",
    opts: [
      { label: "Ahora", to: "HD" },
      { label: "Prefiero que me llamen", to: "H3" } ] },

  HD: { tipo: "Decisión", nombre: "¿Hay agente disponible?", v06: true,
    msg: "(Verificación del sistema) ¿Hay una agente disponible para atender ahora?",
    regla: "Sí: atiende la agente y luego cierre. No: guardar el caso pendiente (HG)",
    datos: "agente_disponible",
    opts: [
      { label: "Sí: atiende la agente", to: "N11" },
      { label: "No hay agente", to: "HG" } ] },

  HG: { tipo: "Captura de dato", nombre: "Caso pendiente en cola", v06: true,
    msg: "Guardamos su caso y una agente le contactará lo antes posible. Si está en peligro, llame al 123.",
    regla: "Guarda el caso pendiente en Mi SALVIA, en cola por prioridad, con recontacto agendado. Prioridad 1: muestra el 123 y avisa a la Gestora",
    datos: "estado_caso (pendiente en cola), canal_recontacto, horario",
    opts: [{ label: "Caso guardado en cola", to: "N11" }] },

  H3: { tipo: "Handoff", nombre: "Contacto agendado",
    msg: "¿En qué momento del día y a qué hora le podemos llamar? ¿A qué número? ¿Tiene un teléfono adicional? ¿Podemos dejar mensaje?",
    regla: "Medio seguro de recontacto. Horario especial: ver hoja Prioridad",
    datos: "canal_recontacto, horario, telefono_adicional, permite_mensaje",
    opts: [
      { label: "Datos de recontacto registrados (sí permite mensaje)", to: "N11" },
      { label: "Datos de recontacto registrados (no permite mensaje)", to: "N11" } ] },

  N11: { tipo: "Cierre", nombre: "Cierre",
    msg: "SALVIA hará seguimiento a las entidades y estará atenta a cualquier barrera. Su número de caso es [código]. Puede escribirnos o llamar al 155 cuando lo necesite; en emergencia, 123.",
    regla: "Antes de cerrar, verificar de nuevo seguridad y medio de recontacto",
    datos: "codigo_caso",
    opts: [{ label: "Cierre mostrado", to: "N11a" }] },

  N11a: { tipo: "Decisión", nombre: "¿Necesita algo más?", v06: true,
    msg: "¿Necesita algo más?",
    regla: "Ningún trámite se cierra sin preguntar. Cada nuevo trámite o ayuda a otra persona genera un registro nuevo enlazado al anterior (id_tramite_relacionado)",
    datos: "necesita_algo_mas, tipo_nuevo_tramite, id_tramite_relacionado",
    opts: [
      { label: "No, es todo", to: "S1" },
      { label: "Sí: nuevo trámite", to: "N1" },
      { label: "Ayudar a otra persona", to: "T1" } ] },

  S1: { tipo: "Información", nombre: "Seguimiento",
    msg: "Recontacto según nivel de riesgo (hoja Prioridad) para verificar respuesta de las entidades, barreras y cambios en el riesgo.",
    regla: "Barrera → Alerta por Barreras · No contesta → protocolo 3x3 · Riesgo aumenta → reclasificar o E1",
    datos: "estado_ruta, barreras, nivel_riesgo_actual",
    opts: [
      { label: "Accedió", to: "FIN" },
      { label: "No accedió", to: "FIN" },
      { label: "Hay barrera (Alerta por Barreras)", to: "FIN" },
      { label: "No contesta (protocolo 3x3)", to: "FIN" },
      { label: "El riesgo aumentó", to: "E1" } ] },

  X1: { tipo: "Decisión", nombre: "Mensajes de burla o acoso",
    msg: "Si no puede escribir libremente, responda sí o no: ¿está en una situación de riesgo?",
    regla: "Si persiste: avisar a Gestoras o coordinación. Nunca cerrar sin descartar riesgo",
    datos: "registro_uso_indebido",
    opts: [
      { label: "Sí", to: "E1" },
      { label: "No (recordar misionalidad, cerrar y registrar)", to: "FIN" } ] },
};

/* Reglas globales: activas en todos los nodos */
const GLOBAL_RULES = [
  { id: "SALIR", label: "SALIR", desc: "Cierra la vista y muestra un mensaje neutro.", to: "FIN" },
  { id: "RIESGO", label: "Palabra de riesgo", desc: "«me va a matar», «está aquí», «me tiene encerrada», «ayuda» → E1", to: "E1" },
  { id: "DESAP", label: "Desaparición", desc: "«desaparecida», «no aparece», «no sé dónde está» → AR1", to: "AR1" },
  { id: "HUMANO1", label: "Hablar con alguien (con riesgo)", desc: "Pide hablar con alguien o 3 respuestas no entendidas, con contenido de riesgo", to: "H1" },
  { id: "HUMANO2", label: "Hablar con alguien (sin riesgo)", desc: "Pide hablar con alguien o 3 respuestas no entendidas, sin contenido de riesgo", to: "H2" },
  { id: "BURLA", label: "Burla o acoso", desc: "→ X1 (siempre se descarta riesgo antes de cerrar)", to: "X1" },
];

/* Regla de prioridad del pretamizaje (hoja Prioridad) */
function prioridadP1(ans) {
  const criticas = ["A1", "A2", "A3"].filter(k => ans[k] === "Sí").length;
  const moderadas = ["A4", "A5", "A6", "A7"].filter(k => ans[k] === "Sí").length;
  if (criticas > 0 || moderadas >= 3) return 1;
  if (moderadas >= 1) return 2;
  return 3;
}

const NODE_ORDER = Object.keys(NODES);
