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
] = [
  ".days-to-presidential-elections__update-target-days",
  ".days-to-primary-elections__update-target-days",
  ".last-presidentials-date__update-target",
  ".next-presidentials-date__update-target",
  ".last-primaries-date__update-target",
  ".next-primaries-date__update-target",
];

const INDEX_PATH = resolve(HERE, "./index.html");

if (!INDEX_PATH || !existsSync(INDEX_PATH)) {
  console.error("No hay indice para actualizar");
  process.exit(1);
}

const [PROXIMA_PRESIDENCIAL, PROXIMA_PASO] = calcularFechas();

await actualizarFechas(INDEX_PATH, PROXIMA_PRESIDENCIAL, PROXIMA_PASO);

function dateFromString(arFormatStringDate) {
  const [d, m, y] = arFormatStringDate.split("/");
  return new Date(y, m, d);
}

function calcularFechas() {
  const [dPresidencial, mPresidencial, yPresidencial] =
    ULTIMA_PRESIDENCIAL.split("/");
  const [dPaso, mPaso, yPaso] = ULTIMA_PASO.split("/");

  return [
    new Date(Number(yPresidencial) + 4, mPresidencial, dPresidencial),
    new Date(Number(yPaso) + 4, mPaso, dPaso),
  ];
}

async function actualizarFechas(path, presidenciales, paso) {
  const htmlString = await promises.readFile(path, "utf-8");
  const { document } = parseHTML(htmlString);
  const query = document.body.querySelector.bind(document.body);
  const [
    DOMpresidenciales,
    DOMPaso,
    DOMFechaUltPresidenciales,
    DOMFechaUltPaso,
    DOMFechaProxPresidenciales,
    DOMFechaProxPaso,
  ] = [
    query(TARGET_PRESIDENCIAL),
    query(TARGET_PASO),
    query(TARGET_ULT_PRESIDENCIALES),
    query(TARGET_ULT_PASO),
    query(TARGET_PROX_PRES),
    query(TARGET_PROX_PASO),
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

  await promises.writeFile(path, document.toString(), "utf-8");
}
