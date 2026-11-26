/* Validación del chatbot SALVIA (26-nov-2026) */
const VAL = {
 "fecha": "26 de noviembre de 2026",
 "recomendacion": "Adoptar el diagrama de flujo v0.6 como flujo de referencia del chatbot. Resuelve 4 de los 26 hallazgos del plan, avanza en 2 y cubre el vacío más riesgoso del árbol v0.3: qué pasa cuando no hay una agente disponible.",
 "defectos": [
  {
   "id": "DEF-001",
   "caso": "A-01, A-02",
   "nodo": "E1",
   "sev": "Alta",
   "desc": "Tras responder «4» (Está encerrada), el bot pregunta si alguna situación incluye una persona desaparecida, en lugar de pasar a la ubicación (E2). El árbol y el v0.6 solo llevan a AR1 si se marcó la opción 12.",
   "evid": "Prueba A-01 (25-nov) y ruta de emergencia en WhatsApp (26-nov): se repite.",
   "estado": "Abierto"
  },
  {
   "id": "DEF-002",
   "caso": "A-01",
   "nodo": "N1, E1",
   "sev": "Baja",
   "desc": "Faltan tildes: «¿esta en peligro ahora?» (N1), «¿qué esta pasando?», «numeros» y «donde quedarse» (E1) y «¿Donde se encuentra?» (E2). Confirmado otra vez en WhatsApp el 26-nov.",
   "evid": "Pasos 2 y 3 de la prueba A-01",
   "estado": "Abierto"
  },
  {
   "id": "DEF-003",
   "caso": "A-01, K-01, A-02",
   "nodo": "N0 → N1",
   "sev": "Crítica",
   "desc": "En el chat web el bot no responde el primer mensaje de la persona (5 de 5 conversaciones, incluido «Estoy en peligro»; la última, el 26-nov a las 2:07 p. m.). Se queda «escribiendo» más de un minuto; una vez mostró el error del servidor «'NoneType' object has no attribute 'search'». Bloquea todo el flujo: no se llega a N1 ni a E1, y no se muestra el 123.",
   "evid": "Chat web de pruebas, conversaciones 1 a 5 del 26-nov",
   "estado": "Abierto"
  },
  {
   "id": "DEF-004",
   "caso": "K-01",
   "nodo": "SALIR",
   "sev": "Crítica",
   "desc": "Al escribir SALIR el bot envía una encuesta de satisfacción (1 a 5) en lugar de cerrar con un mensaje neutro. Deja a la vista el uso del servicio, justo cuando la persona necesita ocultarlo.",
   "evid": "Chat web, conversación 2 del 26-nov",
   "estado": "Abierto"
  },
  {
   "id": "DEF-005",
   "caso": "A-01",
   "nodo": "N0",
   "sev": "Media",
   "desc": "La bienvenida del chat web no es el texto del árbol: no menciona la Línea 155, agrega un emoji y termina con una pregunta abierta («¿En qué le podemos orientar hoy?») en lugar de pasar a la pregunta de seguridad N1 con sus botones.",
   "evid": "Chat web, conversaciones 1 a 3 y 5 (sigue igual a las 2:07 p. m.)",
   "estado": "Abierto"
  },
  {
   "id": "DEF-006",
   "caso": "A-01",
   "nodo": "Registro previo",
   "sev": "Alta",
   "desc": "Antes de conversar, el chat web exige nombre, apellido y correo, y aceptar «Acepto ser atendido por un Bot IA». Contradice el flujo: los datos se piden después de la seguridad (N1) y de la autorización (N2), y la ruta «No autorizo» debe ser anónima. Una persona en peligro no debería llenar un formulario para pedir ayuda.",
   "evid": "Chat web, formulario de registro",
   "estado": "Abierto"
  },
  {
   "id": "DEF-007",
   "caso": "A-01",
   "nodo": "Interfaz",
   "sev": "Baja",
   "desc": "Textos de la interfaz en inglés: «Type a message», «Agente is typing...», «Today».",
   "evid": "Chat web",
   "estado": "Abierto"
  },
  {
   "id": "DEF-008",
   "caso": "A-02",
   "nodo": "H1",
   "sev": "Crítica",
   "desc": "En WhatsApp, al pasar una emergencia a la agente (H1), el bot responde «Por el momento no hay agentes disponibles para atenderte. Por favor intenta más tarde o contáctanos por otro canal», con Repetir y Finalizar. No dice «No cierre este chat», no repite el 123, no deja el caso en cola y tutea. Con Finalizar cierra sin número de caso. Es el vacío que el v0.6 cubre con HD y HG.",
   "evid": "WhatsApp, ruta de emergencia del 26-nov",
   "estado": "Abierto"
  },
  {
   "id": "DEF-009",
   "caso": "E-01",
   "nodo": "N5, P1",
   "sev": "Alta",
   "desc": "Si en N5 no se marca «Sexual», el bot igual pregunta si alguna situación fue violencia sexual, y A7 vuelve a preguntarlo. La misma pregunta sensible se hace dos veces sin necesidad (revictimización).",
   "evid": "WhatsApp, flujo de persona afectada del 26-nov",
   "estado": "Abierto"
  },
  {
   "id": "DEF-010",
   "caso": "D-02",
   "nodo": "R0a",
   "sev": "Alta",
   "desc": "R0a responde con el texto de referencia del árbol («Información de derechos (Ley 1257 de 2008) y rutas del municipio según el tema») en lugar de la información real del municipio y el tema pedidos.",
   "evid": "WhatsApp, ruta de solo información del 26-nov",
   "estado": "Abierto"
  },
  {
   "id": "DEF-011",
   "caso": "A-04, E-01",
   "nodo": "N1a, E2, N4, N11",
   "sev": "Media",
   "desc": "El bot sigue el árbol v0.3: no tiene N1b–N1d (modo silencioso), ni el botón de ubicación de 1 clic (E2, N4), ni HD/HG, ni N11a («¿Necesita algo más?»). El número de caso sale «por asignar (pendiente integración Mi SALVIA)».",
   "evid": "WhatsApp, pruebas del 25 y 26-nov",
   "estado": "Abierto"
  },
  {
   "id": "DEF-012",
   "caso": "A-04",
   "nodo": "SALIR",
   "sev": "Alta",
   "desc": "SALIR no se comporta igual siempre: a mitad del flujo cierra con mensaje neutro, pero escrito justo después del cierre (N11) mostró otra vez la bienvenida y luego un mensaje de despedida.",
   "evid": "WhatsApp, prueba de la tester del 25-nov (9:24 p. m.)",
   "estado": "Abierto"
  }
 ],
 "comparacion": [
  [
   "Botones de N1",
   "«Estoy en peligro», «No es seguro escribir», «Estoy en un lugar seguro»",
   "«Estoy en peligro», «No es seguro», «Lugar seguro»",
   "«En peligro», «No es seguro», «Lugar seguro»",
   "Textos cortos: los botones de WhatsApp admiten 20 caracteres."
  ],
  [
   "Forma de elegir en E1",
   "12 opciones con selección múltiple",
   "Lista numerada; se responde con números separados por coma",
   "No lo define",
   "Lo del bot. Agregarlo al v0.6 (las listas de WhatsApp admiten 10 filas)."
  ],
  [
   "Salida de E1",
   "Desaparición → AR1; resto → E2",
   "Pregunta por desaparición aunque se eligió solo la opción 4",
   "Criterio de riesgo → E2; desaparición → AR1",
   "v0.6. Corregir el bot (DEF-001)."
  ],
  [
   "Ubicación (E2 y N4)",
   "E2: compartir o escribir; N4: lista DIVIPOLA",
   "No se llegó a este paso",
   "Botón de 1 clic en E2 y N4, con fuente de la ubicación",
   "v0.6"
  ],
  [
   "No puede escribir (N1a)",
   "Sin salida si responde que no está en peligro",
   "No probado",
   "N1b → N1c → N1d, con registro preliminar y agenda",
   "v0.6"
  ],
  [
   "Reporte de tercero (T1)",
   "Dos preguntas en una; «modo tercero» sin definir",
   "No probado",
   "Una pregunta; No o No sé → H2",
   "v0.6"
  ],
  [
   "Funcionario (I1)",
   "«Fin o H2» sin condición",
   "No probado",
   "I1a con datos y dos salidas",
   "v0.6"
  ],
  [
   "Agente disponible",
   "Se asume que siempre hay una",
   "No probado",
   "HD y HG: cola por prioridad, recontacto, 123 y aviso a Gestora",
   "v0.6"
  ],
  [
   "Cierre",
   "N11 cierra la conversación",
   "No probado",
   "N11a pregunta si necesita algo más y encadena trámites",
   "v0.6"
  ],
  [
   "Datos enviados",
   "Hoja Datos, variable por variable",
   "No verificado en Mi SALVIA",
   "Solicitud generada: 12 bloques y ejemplo JSON",
   "v0.6"
  ],
  [
   "Reglas globales y X1",
   "Definidas en la hoja Nodos",
   "SALIR anunciado en N0",
   "No aparecen en el diagrama",
   "Completar el v0.6 (la app ya las incluye)."
  ]
 ],
 "justificacion": [
  [
   "Ninguna persona queda sin respuesta (HD y HG)",
   "El v0.3 supone que siempre hay una agente libre. De noche, en fin de semana o con la cola llena, un caso de prioridad 1 quedaría esperando en el chat. Con el v0.6 el caso queda guardado en Mi SALVIA, en cola por prioridad, con el 123 visible y aviso a la Gestora."
  ],
  [
   "Protección de quien no puede escribir (N1b a N1d)",
   "Si la conversación se corta, ya hay un registro preliminar y un medio seguro de contacto. Además la persona tiene una salida cuando no está en peligro, que en el v0.3 no existía."
  ],
  [
   "Ubicación precisa en emergencias (E2 y N4)",
   "Escribir una dirección en plena agresión es lento y riesgoso. El botón de un clic envía coordenadas y la fuente le dice a la agente y al 123 qué tan confiable es el dato."
  ],
  [
   "Rutas sin ambigüedad (T1 e I1a)",
   "Un nodo sin destino claro no se puede probar ni auditar. El v0.6 da un destino único a cada respuesta."
  ],
  [
   "Trámites completos y trazables (N11a)",
   "La persona puede tener una segunda situación o escribir por otra persona. El v0.6 la atiende sin perderla y la enlaza con id_tramite_relacionado."
  ],
  [
   "Acuerdo de datos con Mi SALVIA (Solicitud generada)",
   "Define qué recibe la agente y cuándo. Es la base para la integración y para verificar los casos de datos (módulo O)."
  ],
  [
   "Una sola referencia para juzgar la prueba",
   "La prueba A-01 ya encontró al bot haciendo algo que no está en ningún diagrama. Con el v0.6 aprobado, cada paso se califica contra un solo documento."
  ]
 ],
 "recomendaciones": [
  "Corregir de inmediato los 3 defectos críticos: DEF-003 (el chat web no responde; confirmado otra vez a las 2:07 p. m.), DEF-004 (SALIR envía una encuesta en el chat web) y DEF-008 (emergencia sin agente termina en «intente más tarde»). Luego repetir las pruebas por canal.",
  "Aprobar el v0.6 como flujo de referencia y llevar sus cambios al Excel del árbol (v0.4).",
  "Completar el v0.6 con X1, las reglas globales, la lista numerada de E1 y la pregunta de seguridad en N11a.",
  "Corregir el bot: DEF-001 (pregunta extra en E1), DEF-002 (tildes), DEF-005 (bienvenida), DEF-006 (registro previo), DEF-007 (textos en inglés), DEF-009 (preguntas repetidas de violencia sexual), DEF-010 (R0a sin información), DEF-011 (proceso v0.6) y DEF-012 (SALIR inconsistente).",
  "Retomar el caso A-01 y ejecutar los 44 casos críticos del plan en esta app.",
  "Resolver con los equipos psicosocial y jurídico los hallazgos críticos y altos abiertos."
 ],
 "hallazgos": [
  {
   "id": "HZ-01",
   "nodo": "Regla global «SALIR»",
   "sev": "Crítica",
   "hallazgo": "Si SALIR se detecta como palabra dentro de una frase («no me deja salir de la casa»), el bot cierra la vista justo cuando la persona describe un encierro (criterio de Alerta Inminente).",
   "reco": "Que SALIR solo se active cuando es el mensaje completo (o un botón dedicado). Una frase con «salir» se evalúa como palabra de riesgo.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-02",
   "nodo": "Regla global «Palabras de riesgo»",
   "sev": "Alta",
   "hallazgo": "La palabra «ayuda» dispara E1, pero aparece en usos legítimos: la opción de N3 «Quiero ayuda porque puedo ejercer violencia» (si se escribe en lugar de pulsarla) y consultas como «quiero ayuda con información» en R0.",
   "reco": "Limitar «ayuda» a expresiones de auxilio («ayuda», «ayúdenme» como mensaje aislado) o confirmar con una pregunta de sí o no antes de saltar a E1.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-03",
   "nodo": "Reglas globales dentro de E1, E2, H1, AR1–AR3",
   "sev": "Alta",
   "hallazgo": "Los disparadores siguen activos dentro de las rutas críticas. Si la persona que reporta escribe «desaparecida» en AR2, o «me va a matar» en E2, el flujo puede reiniciarse o entrar en un bucle.",
   "reco": "Suspender los disparadores de riesgo y desaparición mientras se está dentro de E1–E2–H1 y AR1–AR3 (SALIR sigue activo).",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-04",
   "nodo": "N1a",
   "sev": "Alta",
   "hallazgo": "«Responder sí/no ahora» va siempre a E1. No se define qué pasa si en modo silencioso la persona responde que NO está en peligro.",
   "reco": "Añadir una rama: sin peligro → N2 en modo silencioso, o → H3.",
   "estado": "Resuelto",
   "nota": "v0.6: N1d → No → H3"
  },
  {
   "id": "HZ-05",
   "nodo": "E1",
   "sev": "Alta",
   "hallazgo": "Selección múltiple: si se marca «Una persona está desaparecida» junto con otro criterio, la regla «Desaparición → AR1 · Resto → E2» no dice cuál prevalece.",
   "reco": "Definir la prioridad (probablemente E2 → H1, y AR1 en paralelo por la agente).",
   "estado": "Abierto",
   "nota": "La prueba A-01 muestra que el bot agrega una pregunta que no está en el flujo"
  },
  {
   "id": "HZ-06",
   "nodo": "E1 (WhatsApp)",
   "sev": "Alta",
   "hallazgo": "E1 tiene 12 opciones y la más larga tiene 38 caracteres. Las listas de WhatsApp admiten como máximo 10 filas de 24 caracteres y no permiten selección múltiple.",
   "reco": "Rediseñar E1 para WhatsApp: agrupar criterios, dividirlos en dos mensajes o usar texto libre con detección.",
   "estado": "Parcial",
   "nota": "Resuelto en el bot (lista numerada); falta en el diagrama"
  },
  {
   "id": "HZ-07",
   "nodo": "N3, N5, N10, F1 (WhatsApp)",
   "sev": "Media",
   "hallazgo": "Hay opciones de 42 a 45 caracteres (p. ej., «Quiero ayuda porque puedo ejercer violencia»). Superan los 24 caracteres de una fila de lista y los 20 de un botón.",
   "reco": "Acortar el título y pasar el detalle a la descripción de la fila (hasta 72 caracteres).",
   "estado": "Parcial",
   "nota": "Resuelto en el bot para N1; falta N3, N5, N10 y F1"
  },
  {
   "id": "HZ-08",
   "nodo": "T1",
   "sev": "Alta",
   "hallazgo": "Hace dos preguntas («¿está en peligro ahora?» y «¿sabe que nos escribe?») con una sola respuesta Sí / No / No sé. La respuesta es ambigua.",
   "reco": "Separarlas en dos preguntas. Solo la primera decide el salto a E1.",
   "estado": "Resuelto",
   "nota": "v0.6: T1 con una sola pregunta"
  },
  {
   "id": "HZ-09",
   "nodo": "T1 → N4 «modo tercero» → H2",
   "sev": "Alta",
   "hallazgo": "No se define en qué nodo sale el modo tercero hacia H2. N4 continúa hasta N8a → P1, y P1 no debe aplicarse a terceros.",
   "reco": "Definir el recorrido del modo tercero (p. ej., N4 → N5 → N6 → H2) y el salto explícito de P1.",
   "estado": "Resuelto",
   "nota": "v0.6: T1 No / No sé → H2"
  },
  {
   "id": "HZ-10",
   "nodo": "P1",
   "sev": "Alta",
   "hallazgo": "La regla de prioridad cuenta las alertas en «Sí», pero no define qué hacer con «Prefiero no decir». Si todo es «Prefiero no decir», el bot asignaría prioridad 3.",
   "reco": "Tratar «Prefiero no decir» en las preguntas críticas como alerta o enviar a H2 con una marca de «pretamizaje incompleto».",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-11",
   "nodo": "P1 → H1/H2",
   "sev": "Media",
   "hallazgo": "Con prioridad 1 o 2 la persona sale a la agente antes de N9, N9a y N10. Se pierden las variables diferenciales, la elección de jurisdicción y la solicitud de medidas de emergencia.",
   "reco": "Confirmar que es intencional y que la agente las captura. Si no, preguntar N9 de forma opcional antes de H2.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-12",
   "nodo": "N8a y P1 (A5)",
   "sev": "Media",
   "hallazgo": "N8a ya pregunta si el agresor incumplió las medidas, y A5 lo vuelve a preguntar. Esto contradice el principio de no repetir preguntas.",
   "reco": "Precargar A5 a partir de N8a y no volver a mostrarla.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-13",
   "nodo": "N9a",
   "sev": "Media",
   "hallazgo": "Se ofrece la «Jurisdicción Especial Indígena» también a mujeres NARP (destino «Indígena o NARP → N9a»).",
   "reco": "Validar con el área jurídica. Probablemente N9a aplica solo a pueblos indígenas y para NARP corresponde otra orientación.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-14",
   "nodo": "N2 → N3 → M1",
   "sev": "Alta",
   "hallazgo": "La persona menor de edad autoriza el tratamiento de sus datos en N2 antes de identificarse como menor. El tratamiento de datos de NNA tiene reglas especiales (Ley 1581 de 2012, art. 7). Además, el «registro mínimo» de M1 no define sus campos.",
   "reco": "Validar con el área jurídica y definir las variables del registro mínimo en la hoja Datos.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-15",
   "nodo": "N2 «No autorizo» → R0a",
   "sev": "Media",
   "hallazgo": "R0a ofrece «rutas del municipio», pero quien no autoriza nunca pasa por R0 y el municipio es desconocido.",
   "reco": "Preguntar el municipio como dato no personal o mostrar solo rutas nacionales.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-16",
   "nodo": "R0a «Terminar» → N11",
   "sev": "Media",
   "hallazgo": "N11 dice «Su número de caso es [código]» a una consulta de solo información o sin autorización.",
   "reco": "Usar un cierre distinto para las consultas de orientación (sin número de caso, o con un id de consulta).",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-17",
   "nodo": "Canal WhatsApp – hábeas data",
   "sev": "Alta",
   "hallazgo": "En WhatsApp el número de teléfono llega siempre con el mensaje. Aunque la persona elija «No autorizo», el número queda en los registros del canal y del proveedor.",
   "reco": "Definir la anonimización o eliminación del número en los registros cuando no hay autorización.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-18",
   "nodo": "Canal WhatsApp – SALIR",
   "sev": "Alta",
   "hallazgo": "SALIR «cierra la vista», pero en WhatsApp el bot no puede borrar el historial del teléfono. El agresor puede leer la conversación.",
   "reco": "Informar a la persona que borre el chat; usar un nombre de perfil y unos mensajes discretos; probar el texto neutro.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-19",
   "nodo": "I1",
   "sev": "Baja",
   "hallazgo": "El destino «Fin o H2» no tiene una condición.",
   "reco": "Añadir la pregunta o la condición que decide entre Fin y H2.",
   "estado": "Resuelto",
   "nota": "v0.6: I1a con dos salidas"
  },
  {
   "id": "HZ-20",
   "nodo": "AR1",
   "sev": "Media",
   "hallazgo": "La Alerta Rosa aplica a NNA, jóvenes de hasta 28 años y mujeres. No hay rama para la desaparición de otras personas (p. ej., un hombre de 40 años).",
   "reco": "Definir la orientación (Fiscalía 122 / Policía 123) y el registro para los casos fuera de alcance.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-21",
   "nodo": "Horario especial",
   "sev": "Media",
   "hallazgo": "La franja «6:00 p. m. – 8:00 p. m., noches» es ambigua y no se mencionan los festivos.",
   "reco": "Precisar la hora de inicio y de fin de cada franja y el tratamiento de los festivos en Colombia.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-22",
   "nodo": "Todo el flujo",
   "sev": "Alta",
   "hallazgo": "No se define qué hace el bot por inactividad ni cómo retoma una conversación abandonada (¿reanuda o reinicia?).",
   "reco": "Definir los tiempos de espera por tipo de nodo (en E1/E2 la inactividad debe pasar a H1) y la reanudación sin repetir preguntas.",
   "estado": "Abierto",
   "nota": "HG cubre el caso pendiente, no la inactividad"
  },
  {
   "id": "HZ-23",
   "nodo": "Todo el flujo (WhatsApp)",
   "sev": "Media",
   "hallazgo": "No se define cómo se manejan audios, imágenes, stickers o ubicaciones enviadas en nodos de opción cerrada.",
   "reco": "Definir la respuesta. Un audio en E1 o N1 debería pasar a la agente.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-24",
   "nodo": "E1 → E2 → H1",
   "sev": "Media",
   "hallazgo": "En la ruta de riesgo inminente se guardan la ubicación y el criterio sin pasar por N2 (autorización).",
   "reco": "Documentar la base legal (protección de la vida, debida diligencia) y cuándo se informa a la persona.",
   "estado": "Parcial",
   "nota": "v0.6: N1c define el registro preliminar; falta la base legal"
  },
  {
   "id": "HZ-25",
   "nodo": "X1",
   "sev": "Media",
   "hallazgo": "X1 solo se alcanza por regla global y no se define cómo se detecta la burla o el acoso.",
   "reco": "Definir los criterios de detección o dejar que la marque la agente.",
   "estado": "Abierto",
   "nota": ""
  },
  {
   "id": "HZ-26",
   "nodo": "N11",
   "sev": "Media",
   "hallazgo": "La regla «Antes de cerrar, verificar de nuevo seguridad y medio de recontacto» no está modelada como un nodo con opciones y destinos.",
   "reco": "Modelarla (p. ej., N11a) para que se pueda probar y registrar.",
   "estado": "Parcial",
   "nota": "v0.6: N11a pregunta si necesita algo más; falta la pregunta de seguridad"
  }
 ],
 "validaciones": [
  [
   "25-nov-2026",
   "Revisión estática del árbol v0.3",
   "38 nodos con todos sus destinos válidos; se registraron 26 hallazgos (1 crítico, 12 altos, 12 medios y 1 bajo).",
   "Completada"
  ],
  [
   "25-nov-2026",
   "Mensajes de la app frente al Excel del árbol v0.3",
   "38 de 38 mensajes y 7 de 7 preguntas A1–A7 idénticos al Excel.",
   "Cumple"
  ],
  [
   "25-nov-2026",
   "Prueba de la tester en WhatsApp: modo silencioso, agenda, cierre y SALIR",
   "Modo silencioso → Agendar contacto → H3 → cierre funciona; N1a sigue el v0.3; el número de caso sale por asignar; SALIR tras el cierre reinició la bienvenida.",
   "Falla"
  ],
  [
   "25-nov-2026",
   "Prueba en el bot real por WhatsApp (caso A-01)",
   "N0 y N1 cumplen; en E1 el bot agrega una pregunta que no está en el flujo (DEF-001).",
   "En curso"
  ],
  [
   "26-nov-2026",
   "Árbol «Arbol_Decision_Chatbot_SALVIA (2).xlsx» frente a v0.3",
   "Idéntico en las 7 hojas: no trae cambios.",
   "Sin cambios"
  ],
  [
   "26-nov-2026",
   "Diagrama de flujo v0.6",
   "84 elementos y 79 conexiones; 7 nodos nuevos; no incluye X1 ni las reglas globales.",
   "Analizado"
  ],
  [
   "26-nov-2026",
   "Proceso v0.6 cargado en la app",
   "45 nodos, 0 destinos rotos y 0 nodos inalcanzables desde N0.",
   "Cumple"
  ],
  [
   "26-nov-2026",
   "Recorridos de verificación del proceso v0.6",
   "27 de 27 rutas llegan al destino esperado y entre todas pasan por los 45 nodos.",
   "Cumple"
  ],
  [
   "26-nov-2026",
   "Prueba en el chatbot virtual (chat web de pruebas, testpublic.agentiabpm.com)",
   "4 conversaciones: el bot saluda pero no responde ningún mensaje (ni «Estoy en peligro»); una vez mostró un error del servidor. SALIR envía una encuesta. Defectos DEF-003 a DEF-007.",
   "Falla"
  ],
  [
   "26-nov-2026",
   "Nueva prueba del chat web (2:07 p. m.)",
   "Conversación 5: registro correcto y saludo, pero el bot no responde «Hola buenas tardes» ni «Necesito orientación» en más de 90 s. DEF-003 sigue abierto; la bienvenida sigue sin el texto del árbol (DEF-005).",
   "Falla"
  ],
  [
   "26-nov-2026",
   "Prueba del flujo completo en WhatsApp (3 rutas)",
   "Emergencia: E1 repite DEF-001 y H1 termina en «no hay agentes» (DEF-008). Persona afectada: 16 pasos de N0 a N11, 14 cumplen; prioridad 2 correcta. Solo información: R0a sin información real (DEF-010). SALIR a mitad del flujo cierra bien. 22 de 45 nodos probados.",
   "Falla"
  ]
 ],
 "recorridos": [
  {
   "id": "V-01",
   "nombre": "Emergencia con agente disponible",
   "esperado": "N0 > N1 > E1 > E2 > H1 > HD > N11 > N11a > S1 > FIN",
   "obtenido": "N0 > N1 > E1 > E2 > H1 > HD > N11 > N11a > S1 > FIN",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-02",
   "nombre": "Emergencia sin agente disponible (caso en cola)",
   "esperado": "E1 > E2 > H1 > HD > HG > N11 > N11a",
   "obtenido": "E1 > E2 > H1 > HD > HG > N11 > N11a",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-03",
   "nombre": "E1 sin opción 12 no pregunta por desaparición (DEF-001)",
   "esperado": "E1 > E2",
   "obtenido": "E1 > E2",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-04",
   "nombre": "Alerta Rosa desde E1",
   "esperado": "E1 > AR1 > AR2 > AR3 > HD > N11",
   "obtenido": "E1 > AR1 > AR2 > AR3 > HD > N11",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-05",
   "nombre": "Alerta Rosa sin consentimiento",
   "esperado": "N3 > AR1 > H2 > HD",
   "obtenido": "N3 > AR1 > H2 > HD",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-06",
   "nombre": "Modo silencioso sin peligro → agenda",
   "esperado": "N1 > N1a > N1b > N1c > N1d > H3 > N11",
   "obtenido": "N1 > N1a > N1b > N1c > N1d > H3 > N11",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-07",
   "nombre": "Modo silencioso con peligro → E1",
   "esperado": "N1d > E1",
   "obtenido": "N1d > E1",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-08",
   "nombre": "Solo información con varias consultas",
   "esperado": "N2 > R0 > R0a > R0 > R0a > N11",
   "obtenido": "N2 > R0 > R0a > R0 > R0a > N11",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-09",
   "nombre": "No autoriza y pide hablar con alguien",
   "esperado": "N2 > R0a > H2 > H3",
   "obtenido": "N2 > R0a > H2 > H3",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-10",
   "nombre": "Persona afectada con alerta crítica (prioridad 1)",
   "esperado": "N3 > N3a > N4 > N5 > N6 > N6a > N7 > N8 > N8a > P1 > H1",
   "obtenido": "N3 > N3a > N4 > N5 > N6 > N6a > N7 > N8 > N8a > P1 > H1",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-11",
   "nombre": "Pretamizaje con 1 alerta moderada (prioridad 2)",
   "esperado": "P1 > H2",
   "obtenido": "P1 > H2",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-12",
   "nombre": "Pretamizaje con 3 alertas moderadas (prioridad 1)",
   "esperado": "P1 > H1",
   "obtenido": "P1 > H1",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-13",
   "nombre": "Sin alertas, pueblo étnico y rutas (prioridad 3)",
   "esperado": "P1 > N9 > N9a > N10 > R2 > N11",
   "obtenido": "P1 > N9 > N9a > N10 > R2 > N11",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-14",
   "nombre": "Violencia sexual en las últimas 72 h",
   "esperado": "N5 > N5a > R1 > H1 > HD",
   "obtenido": "N5 > N5a > R1 > H1 > HD",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-15",
   "nombre": "Reporte de tercero sin peligro",
   "esperado": "N3 > T1 > H2",
   "obtenido": "N3 > T1 > H2",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-16",
   "nombre": "Reporte de tercero en peligro",
   "esperado": "T1 > E1",
   "obtenido": "T1 > E1",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-17",
   "nombre": "Menor de edad",
   "esperado": "N3 > M1 > N11",
   "obtenido": "N3 > M1 > N11",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-18",
   "nombre": "Familiar de víctima de feminicidio",
   "esperado": "N3 > F1 > H2",
   "obtenido": "N3 > F1 > H2",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-19",
   "nombre": "Hombre en riesgo de ejercer violencia",
   "esperado": "N3 > HM1 > H3",
   "obtenido": "N3 > HM1 > H3",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-20",
   "nombre": "Funcionario que solo pide información",
   "esperado": "N3 > I1 > I1a > N11",
   "obtenido": "N3 > I1 > I1a > N11",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-21",
   "nombre": "Cierre con nuevo trámite",
   "esperado": "N11a > N1",
   "obtenido": "N11a > N1",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-22",
   "nombre": "Cierre ayudando a otra persona",
   "esperado": "N11a > T1",
   "obtenido": "N11a > T1",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-23",
   "nombre": "Seguimiento con aumento del riesgo",
   "esperado": "S1 > E1",
   "obtenido": "S1 > E1",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-24",
   "nombre": "Regla global: burla con riesgo",
   "esperado": "N6 > X1 > E1",
   "obtenido": "N6 > X1 > E1",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-25",
   "nombre": "Regla global: SALIR en plena caracterización",
   "esperado": "N5 > FIN",
   "obtenido": "N5 > FIN",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-26",
   "nombre": "Regla global: desaparición escrita en N6",
   "esperado": "N6 > AR1",
   "obtenido": "N6 > AR1",
   "ok": true,
   "error": ""
  },
  {
   "id": "V-27",
   "nombre": "Medidas de emergencia (lugar seguro)",
   "esperado": "N10 > H2",
   "obtenido": "N10 > H2",
   "ok": true,
   "error": ""
  }
 ],
 "recorridosFecha": "26-nov-2026"
};
