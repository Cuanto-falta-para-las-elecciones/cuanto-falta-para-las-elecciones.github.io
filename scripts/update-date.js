import { config } from "dotenv";
import { resolve } from "path";
import { existsSync, promises } from "fs";
import { parseHTML } from "linkedom";

config();
const { round } = Math;
const HERE = process.cwd();

const { ULTIMA_PRESIDENCIAL, ULTIMA_PASO } = process.env;

const [
  TARGET_PRESIDENCIAL,
  TARGET_PASO,
  TARGET_ULT_PRESIDENCIALES,
  TARGET_PROX_PRES,
  TARGET_ULT_PASO,
  TARGET_PROX_PASO,
  TARGET_META_TITLE,
] = [
  ".days-to-presidential-elections__update-target-days",
  ".days-to-primary-elections__update-target-days",
  ".last-presidentials-date__update-target",
  ".next-presidentials-date__update-target",
  ".last-primaries-date__update-target",
  ".next-primaries-date__update-target",
  '[property="og:title"]',
];

const INDEX_PATH = resolve(HERE, "./index.html");

if (!INDEX_PATH || !existsSync(INDEX_PATH)) {
  console.error("No hay indice para actualizar");
  process.exit(1);
}

const [PROXIMA_PRESIDENCIAL, PROXIMA_PASO] = calcularFechas();

await actualizarFechas(INDEX_PATH, PROXIMA_PRESIDENCIAL, PROXIMA_PASO);

function calcularFechas() {
  const [dPresidencial, mPresidencial, yPresidencial] =
    ULTIMA_PRESIDENCIAL.split("/");
  const [dPaso, mPaso, yPaso] = ULTIMA_PASO.split("/");

  const nuevasPresidenciales = new Date(
    Number(yPresidencial) + 4,
    Number(mPresidencial) - 1,
    1
  );
  const nuevasPaso = new Date(Number(yPaso) + 4, Number(mPaso) - 1, 1);
  while (nuevasPresidenciales.getDay() != 0) {
    nuevasPresidenciales.setDate(nuevasPresidenciales.getDate() + 1);
  }
  nuevasPresidenciales.setDate(nuevasPresidenciales.getDate() + 21);
  while (nuevasPaso.getDay() != 0) {
    nuevasPaso.setDate(nuevasPaso.getDate() + 1);
  } // primer domingo
  nuevasPaso.setDate(nuevasPaso.getDate() + 21);

  return [nuevasPresidenciales, nuevasPaso];
}

async function actualizarFechas(path, presidenciales, paso) {
  const htmlString = await promises.readFile(path, "utf-8");
  const { document } = parseHTML(htmlString);
  const query = document.querySelector.bind(document);

  const [
    DOMpresidenciales,
    DOMPaso,
    DOMFechaUltPresidenciales,
    DOMFechaUltPaso,
    DOMFechaProxPresidenciales,
    DOMFechaProxPaso,
    DOMMetaTitle,
  ] = [
    query(TARGET_PRESIDENCIAL),
    query(TARGET_PASO),
    query(TARGET_ULT_PRESIDENCIALES),
    query(TARGET_ULT_PASO),
    query(TARGET_PROX_PRES),
    query(TARGET_PROX_PASO),
    query(TARGET_META_TITLE),
  ];

  const daysBetween = (a, b) => round((b - a) / (1000 * 60 * 60 * 24));
  const [diasAPresidenciales, diasAPaso] = [
    daysBetween(new Date(), presidenciales),
    daysBetween(new Date(), paso),
  ];

  const formatter = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  DOMpresidenciales.firstChild.replaceWith(
    document.createTextNode(diasAPresidenciales)
  );
  DOMPaso.firstChild.replaceWith(diasAPaso);
  DOMFechaUltPresidenciales.firstChild.replaceWith(ULTIMA_PRESIDENCIAL);
  DOMFechaUltPaso.firstChild.replaceWith(ULTIMA_PASO);
  DOMFechaProxPaso.firstChild.replaceWith(formatter.format(paso));
  DOMFechaProxPresidenciales.firstChild.replaceWith(
    formatter.format(presidenciales)
  );

  DOMMetaTitle.setAttribute(
    "content",
    `Faltan ${diasAPresidenciales} días para las elecciones`
  );

  await promises.writeFile(path, document.toString(), "utf-8");
}
