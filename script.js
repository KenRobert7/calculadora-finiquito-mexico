const form = document.getElementById("calculatorForm");
const resetBtn = document.getElementById("resetBtn");

const summaryText = document.getElementById("summaryText");
const errorBox = document.getElementById("errorBox");
const resultsBox = document.getElementById("resultsBox");

const fields = {
  ingresoDia: document.getElementById("ingresoDia"),
  ingresoMes: document.getElementById("ingresoMes"),
  ingresoAnio: document.getElementById("ingresoAnio"),
  bajaDia: document.getElementById("bajaDia"),
  bajaMes: document.getElementById("bajaMes"),
  bajaAnio: document.getElementById("bajaAnio"),
  tipoSalida: document.getElementById("tipoSalida"),
  salarioMensual: document.getElementById("salarioMensual"),
  salarioPendienteDias: document.getElementById("salarioPendienteDias"),
  aguinaldoDias: document.getElementById("aguinaldoDias"),
  primaVacacional: document.getElementById("primaVacacional"),
  vacacionesPorAno: document.getElementById("vacacionesPorAno"),
  vacacionesPendientes: document.getElementById("vacacionesPendientes"),
  primaAntiguedad: document.getElementById("primaAntiguedad"),
};

const outputs = {
  yearsWorked: document.getElementById("yearsWorked"),
  daysWorked: document.getElementById("daysWorked"),
  dailySalary: document.getElementById("dailySalary"),
  grossFiniquito: document.getElementById("grossFiniquito"),
  aguinaldoValue: document.getElementById("aguinaldoValue"),
  vacationValue: document.getElementById("vacationValue"),
  vacationPremiumValue: document.getElementById("vacationPremiumValue"),
  salaryPendingValue: document.getElementById("salaryPendingValue"),
  seniorityValue: document.getElementById("seniorityValue"),
  isrFiniquitoValue: document.getElementById("isrFiniquitoValue"),
  isrLiquidacionValue: document.getElementById("isrLiquidacionValue"),
  totalValue: document.getElementById("totalValue"),
};

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number.isFinite(value) ? value : 0);
}

function getNumberValue(el) {
  const value = parseFloat(el.value);
  return Number.isFinite(value) ? value : 0;
}

function buildDate(dayEl, monthEl, yearEl, label) {
  const d = parseInt(dayEl.value, 10);
  const m = parseInt(monthEl.value, 10);
  const y = parseInt(yearEl.value, 10);

  if (!d || !m || !y) {
    throw new Error(`Completa la ${label}.`);
  }

  const date = new Date(y, m - 1, d);

  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    throw new Error(`La ${label} no es válida.`);
  }

  return date;
}

function daysBetween(start, end) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end.getTime() - start.getTime()) / msPerDay);
}

function yearsWorkedFromDates(start, end) {
  let years = end.getFullYear() - start.getFullYear();
  const anniversary = new Date(start);
  anniversary.setFullYear(start.getFullYear() + years);

  if (anniversary > end) {
    years -= 1;
  }

  return Math.max(0, years);
}

function daysSinceLastAnniversary(start, end) {
  let years = end.getFullYear() - start.getFullYear();
  const anniversary = new Date(start);
  anniversary.setFullYear(start.getFullYear() + years);

  if (anniversary > end) {
    years -= 1;
    anniversary.setFullYear(start.getFullYear() + years);
  }

  return Math.max(0, daysBetween(anniversary, end));
}

function estimateISR(amount) {
  if (amount <= 0) return 0;
  if (amount <= 5000) return amount * 0.01;
  if (amount <= 15000) return amount * 0.05;
  if (amount <= 30000) return amount * 0.10;
  return amount * 0.15;
}

function clearErrors() {
  errorBox.hidden = true;
  errorBox.textContent = "";
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  resultsBox.hidden = true;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();

  try {
    const ingreso = buildDate(
      fields.ingresoDia,
      fields.ingresoMes,
      fields.ingresoAnio,
      "fecha de ingreso"
    );

    const baja = buildDate(
      fields.bajaDia,
      fields.bajaMes,
      fields.bajaAnio,
      "fecha de baja"
    );

    if (baja <= ingreso) {
      throw new Error("La fecha de baja debe ser posterior a la fecha de ingreso.");
    }

    const tipoSalida = fields.tipoSalida.value;
    const salarioMensual = getNumberValue(fields.salarioMensual);
    const salarioPendienteDias = getNumberValue(fields.salarioPendienteDias);
    const aguinaldoDias = getNumberValue(fields.aguinaldoDias);
    const primaVacacional = getNumberValue(fields.primaVacacional);
    const vacacionesPendientes = getNumberValue(fields.vacacionesPendientes);

    if (salarioMensual <= 0) {
      throw new Error("El salario mensual debe ser mayor que cero.");
    }

    const salarioDiario = salarioMensual / 30;
    const diasTrabajados = daysBetween(ingreso, baja);
    const aniosTrabajados = yearsWorkedFromDates(ingreso, baja);
    const diasPeriodoActual = daysSinceLastAnniversary(ingreso, baja);

    const aguinaldoProporcional = salarioDiario * aguinaldoDias * (diasPeriodoActual / 365);
    const vacacionesPago = salarioDiario * vacacionesPendientes;
    const primaVacacionalPago = vacacionesPago * (primaVacacional / 100);
    const salarioPendientePago = salarioDiario * salarioPendienteDias;

    const finiquitoBruto =
      aguinaldoProporcional +
      vacacionesPago +
      primaVacacionalPago +
      salarioPendientePago;

    let primaAntiguedad = 0;
    const quierePrimaAntiguedad = fields.primaAntiguedad.value === "si";

    if (quierePrimaAntiguedad) {
      const aplicaPrima =
        tipoSalida === "despido_injustificado" ||
        (tipoSalida === "renuncia" && aniosTrabajados >= 15);

      if (aplicaPrima) {
        primaAntiguedad = salarioDiario * 12 * aniosTrabajados;
      }
    }

    const liquidacionBruta =
      tipoSalida === "despido_injustificado"
        ? (salarioMensual * 3) + primaAntiguedad
        : 0;

    const isrFiniquito = estimateISR(finiquitoBruto);
    const isrLiquidacion = estimateISR(liquidacionBruta);
    const totalEstimado = finiquitoBruto + liquidacionBruta - isrFiniquito - isrLiquidacion;

    outputs.yearsWorked.textContent = aniosTrabajados.toString();
    outputs.daysWorked.textContent = diasTrabajados.toString();
    outputs.dailySalary.textContent = formatCurrency(salarioDiario);
    outputs.grossFiniquito.textContent = formatCurrency(finiquitoBruto);
    outputs.aguinaldoValue.textContent = formatCurrency(aguinaldoProporcional);
    outputs.vacationValue.textContent = formatCurrency(vacacionesPago);
    outputs.vacationPremiumValue.textContent = formatCurrency(primaVacacionalPago);
    outputs.salaryPendingValue.textContent = formatCurrency(salarioPendientePago);
    outputs.seniorityValue.textContent = formatCurrency(primaAntiguedad);
    outputs.isrFiniquitoValue.textContent = formatCurrency(isrFiniquito);
    outputs.isrLiquidacionValue.textContent = formatCurrency(isrLiquidacion);
    outputs.totalValue.textContent = formatCurrency(totalEstimado);

    const tipoTexto = {
      renuncia: "renuncia",
      despido_justificado: "despido justificado",
      despido_injustificado: "despido injustificado",
    };

    summaryText.textContent = `Cálculo hecho con ${aniosTrabajados} año(s) trabajados y ${diasTrabajados} día(s) totales. Escenario: ${tipoTexto[tipoSalida]}.`;
    resultsBox.hidden = false;
  } catch (error) {
    showError(error.message || "Ocurrió un error al calcular.");
  }
});

resetBtn.addEventListener("click", () => {
  form.reset();
  fields.aguinaldoDias.value = 15;
  fields.primaVacacional.value = 25;
  fields.vacacionesPorAno.value = 12;
  fields.salarioPendienteDias.value = 0;
  fields.vacacionesPendientes.value = 0;
  fields.primaAntiguedad.value = "si";

  clearErrors();
  resultsBox.hidden = true;
  summaryText.textContent = "Aquí aparecerá el desglose del cálculo.";
});