# Consejos de expertos

Para la demo, WopFit no usa un modelo de IA. Las rutinas, el plan y las respuestas de Wopi se apoyan en recomendaciones publicadas por organismos de salud y sociedades de nutricionistas, entrenadores y médicos. Más adelante, el modelo de IA propio va a usar esta misma base.

Cada consejo se muestra con su fuente y el link al documento. Ninguno reemplaza la consulta con un profesional.

## Dónde está

| Archivo | Qué tiene |
|---|---|
| `backend/src/main/resources/expertos/fuentes.tsv` | Las fuentes: id, cita para mostrar y link |
| `backend/src/main/resources/expertos/consejos.tsv` | Los consejos: dónde se muestran, para quién, qué preguntas responden, el texto, la fuente y el botón de Wopi |
| `ExpertAdvice.java` | Lee los dos archivos al arrancar. Si alguno está mal, la app no arranca. |

Dónde aparecen:
- **Plan listo** ("Lo que recomiendan los expertos"): los consejos del plan que aplican a la persona.
- **Rutina**: los consejos de entrenamiento, según su salud.
- **Wopi**: responde las dudas de alimentación, sueño, estrés y actividad con el consejo que corresponde y muestra la fuente. Si pide una comida concreta ("¿qué ceno con $2.000?"), propone comidas del plan.

En Wopi gana el consejo que es para la persona, por ejemplo el de celiaquía si come sin TACC. Si no hay uno así, va el general, y al final el que es para otras personas.

## Fuentes y qué tomamos de cada una

| Fuente | Qué usamos |
|---|---|
| [OMS, Directrices sobre actividad física y hábitos sedentarios (2020)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/) | 150 a 300 min por semana de actividad moderada (o 75 a 150 de intensa); fuerza 2 o más días por semana; "algo de actividad es mejor que nada" y empezar de a poco; limitar el tiempo sentado. **Embarazo y posparto:** 150 min por semana, fuerza y estiramientos suaves, evitar el calor fuerte y los ejercicios boca arriba después del primer trimestre. **Presión alta:** la actividad física baja la presión. |
| [Ministerio de Salud, Guías Alimentarias para la Población Argentina (2015)](https://iah.msal.gov.ar/doc/Documento110.pdf) | Los 10 mensajes: 8 vasos de agua por día; 5 porciones de frutas y verduras; cocinar sin sal y leer etiquetas; limitar azúcar, golosinas y snacks; 3 porciones de lácteos; porción de carne del tamaño de la palma, pescado 2 o más veces por semana y hasta un huevo por día; legumbres con cereales para reemplazar la carne; 2 cucharadas de aceite crudo y frutos secos; alcohol con moderación; 4 comidas por día. |
| [OMS, Alimentación sana](https://www.who.int/es/news-room/fact-sheets/detail/healthy-diet) | Menos de 5 g de sal por día; azúcares libres por debajo del 10 % (mejor del 5 %); cuidado con los jugos. |
| [Asociación Americana de Diabetes (ADA), Actividad física y diabetes (2016)](https://doi.org/10.2337/dc16-1728) | 150 min o más por semana en al menos 3 días, sin pasar más de 2 días seguidos sin moverse; fuerza 2 o 3 veces por semana en días no seguidos; cortar el tiempo sentado cada 30 min. |
| [AASM y SRS, Horas de sueño para adultos (2015)](https://aasm.org/seven-or-more-hours-of-sleep-per-night-a-health-necessity-for-adults/) | 7 horas o más por noche. Dormir menos de forma habitual se asocia con aumento de peso, diabetes, presión alta y depresión. Los horarios regulares también cuentan. |
| [OPS/OMS, En tiempos de estrés, haz lo que importa (2022)](https://www.paho.org/es/documentos/tiempos-estres-haz-lo-que-importa-guia-ilustrada-version-adaptada-para-america-latina) | Ejercicios cortos de la guía, como "poner los pies en la tierra". |
| [OMS, Guía sobre el dolor lumbar crónico (2023)](https://www.who.int/news/item/07-12-2023-who-releases-guidelines-on-chronic-low-back-pain) | Recomienda programas de ejercicio y educación; desaconseja fajas y soportes lumbares. |
| [Ministerio de Agricultura, Guía para la población celíaca](https://alimentosargentinos.magyp.gob.ar/HomeAlimentos/Publicaciones/pdf/Guia_Celiaquia_2012.pdf) | Sin TACC es sin trigo, avena, cebada y centeno; el símbolo oficial; cocinar primero lo sin gluten, guardarlo aparte y no reusar aceite ni agua. |

Lo que cambió en las rutinas por estas fuentes: con embarazo, el puente de glúteos (boca arriba) pasa a patada de glúteo en cuatro apoyos (OMS 2020).

## Cómo sumar un consejo

1. Si la fuente es nueva, agregala en `fuentes.tsv`. Usá el documento original, no una nota de prensa.
2. Agregá una fila en `consejos.tsv` (las columnas están explicadas al principio del archivo). En `para` van los códigos de `Catalog` (salud, lo que evita, objetivos) o `*`.
3. Si es para Wopi, probá que las palabras no le ganen a otras respuestas (por ejemplo, que "sentado" no agarre "sentadilla"). Las preguntas que piden una comida van primero a las comidas.
4. Corré `mvn test`: `ExpertAdviceTest` y `WopiTest` revisan el plan, la rutina y las respuestas.
