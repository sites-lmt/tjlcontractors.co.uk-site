/* ============================================================
   TJL Contractors — umbrella take-home calculator
   Reads inputs, calls TaxCalc.umbrellaTakeHome(), paints results.
   All rates live in js/tax.js — nothing is hardcoded here.
   ============================================================ */
"use strict";

(function () {
  const form = document.getElementById("calcForm");
  if (!form || !window.TaxCalc) return;

  const T = window.TaxCalc;

  const els = {
    dayRate:  document.getElementById("dayRate"),
    margin:   document.getElementById("margin"),
    days:     document.getElementById("days"),
    weeks:    document.getElementById("weeks"),
    region:   document.getElementById("region"),
    sl:       document.getElementById("studentLoan"),
    pension:  document.getElementById("pension"),
    levy:     document.getElementById("levy"),
  };

  const out = {
    total:     document.getElementById("takeHomeTotal"),
    per:       document.getElementById("takeHomePer"),
    month:     document.getElementById("perMonth"),
    week:      document.getElementById("perWeek"),
    assignment: document.getElementById("rAssignment"),
    margin:    document.getElementById("rMargin"),
    erNi:      document.getElementById("rErNi"),
    levy:      document.getElementById("rLevy"),
    gross:     document.getElementById("rGross"),
    tax:       document.getElementById("rTax"),
    eeNi:      document.getElementById("rEeNi"),
    sl:        document.getElementById("rSl"),
    rowSl:     document.getElementById("rowSl"),
    pension:   document.getElementById("rPension"),
    rowPension: document.getElementById("rowPension"),
    takeHome:  document.getElementById("rTakeHome"),
    retention: document.getElementById("rRetention"),
    barTakeHome: document.getElementById("barTakeHome"),
    barTax:    document.getElementById("barTax"),
    barNi:     document.getElementById("barNi"),
    barFee:    document.getElementById("barFee"),
  };

  const num = (el, fallback) => {
    const v = parseFloat(el && el.value);
    return isNaN(v) ? fallback : v;
  };

  function calculate() {
    const result = T.umbrellaTakeHome({
      dayRate:      num(els.dayRate, 0),
      daysPerWeek:  Math.min(7, Math.max(1, num(els.days, 5))),
      weeksPerYear: Math.min(52, Math.max(1, num(els.weeks, 46))),
      marginPerWeek: num(els.margin, 0),
      region:       els.region.value,
      studentLoan:  els.sl.value,
      pensionPct:   Math.min(100, Math.max(0, num(els.pension, 0))),
      includeLevy:  !!(els.levy && els.levy.checked),
    });

    const weeks = result.weeks || 46;

    out.total.textContent    = T.formatGBP(result.takeHome);
    out.per.textContent      = "per year · " + T.TAX_YEAR + " rates";
    out.month.textContent    = T.formatGBP(result.takeHome / 12);
    out.week.textContent     = T.formatGBP(result.takeHome / weeks);

    out.assignment.textContent = T.formatGBP(result.assignment);
    out.margin.textContent     = "-" + T.formatGBP(result.margin);
    out.erNi.textContent       = "-" + T.formatGBP(result.employerNi);
    out.levy.textContent       = "-" + T.formatGBP(result.employerLevy);
    out.gross.textContent      = T.formatGBP(result.grossSalary);
    out.tax.textContent        = "-" + T.formatGBP(result.tax);
    out.eeNi.textContent       = "-" + T.formatGBP(result.eeNi);

    out.pension.textContent  = "-" + T.formatGBP(result.pension);
    out.rowPension.hidden    = result.pension <= 0;

    out.sl.textContent = "-" + T.formatGBP(result.studentLoan);
    out.rowSl.hidden   = result.studentLoan <= 0;

    out.takeHome.textContent = T.formatGBP(result.takeHome);
    out.retention.textContent = result.retentionPct.toFixed(1) + "%";

    /* Proportional bar */
    const total = result.assignment || 1;
    const pct = (v) => Math.max(0, (v / total) * 100);
    const costs = result.margin + result.employerNi + result.employerLevy;
    out.barTakeHome.style.width = pct(result.takeHome) + "%";
    out.barTax.style.width      = pct(result.tax) + "%";
    out.barNi.style.width       = pct(result.eeNi + result.studentLoan) + "%";
    out.barFee.style.width      = pct(costs) + "%";
  }

  /* Recalculate on any input change */
  form.addEventListener("input", calculate);
  form.addEventListener("change", calculate);
  calculate();
})();
