/* ============================================================
   TJL Contractors — shared UK tax engine
   Rates for the 2026/27 tax year (6 April 2026 – 5 April 2027).

   Verified against GOV.UK:
     - "Rates and thresholds for employers 2026 to 2027"
     - "Income Tax rates and Personal Allowances"
     - "National Insurance rates and categories"

   Every calculator reads its constants from here. Never hardcode
   a rate in a page — change it once, here.
   ============================================================ */
"use strict";

(function (window) {
  const TAX_YEAR = "2026/27";

  const TAX = {
    personalAllowance: 12570,   // standard PA, tax code 1257L
    taperStart: 100000,         // PA and basic-rate limit both reduce £1 per £2 over £100k
    basicRateLimit: 37700,      // basic-rate band width (England, Wales, NI)
    additionalThreshold: 125140,// income at which the additional rate begins (PA fully tapered)
    additionalRate: 0.45,

    // Scotland — taxable income thresholds
    scotland: [
      { rate: 0.19, upTo: 16537 },
      { rate: 0.20, upTo: 29526 },
      { rate: 0.21, upTo: 43662 },
      { rate: 0.42, upTo: 75000 },
      { rate: 0.45, upTo: 125140 },
      { rate: 0.48, upTo: Infinity },
    ],

    // Employee NI — category A
    eeNi: { threshold: 12570, uel: 50270, mainRate: 0.08, upperRate: 0.02 },
    // Employer NI — secondary threshold. Employment Allowance is NOT applied:
    // umbrella employers do not qualify against contractor pay.
    erNi: { threshold: 5000, rate: 0.15 },
    // Apprenticeship Levy — 0.5% of pay bill above a £3m allowance. An umbrella
    // employing many contractors typically exceeds £3m, so this is charged.
    apprenticeshipLevyRate: 0.005,
    // Working Time Regulations holiday accrual: 5.6 weeks / 46.4 worked weeks
    holidayAccrualRate: 0.1207,

    studentLoans: {
      plan1:        { threshold: 26900, rate: 0.09 },
      plan2:        { threshold: 29385, rate: 0.09 },
      plan4:        { threshold: 33795, rate: 0.09 },
      plan5:        { threshold: 25000, rate: 0.09 },
      postgraduate: { threshold: 21000, rate: 0.06 },
    },
  };

  /* Personal allowance tapers to nil between £100k and £125,140. */
  function personalAllowance(income) {
    return Math.max(0, TAX.personalAllowance - Math.max(0, income - TAX.taperStart) / 2);
  }

  /* Basic-rate limit ALSO tapers £1 per £2 over £100k. Omitting this
   * over-extends the 20% band and understates tax in the taper zone. */
  function basicRateLimit(income) {
    return Math.max(0, TAX.basicRateLimit - Math.max(0, income - TAX.taperStart) / 2);
  }

  /**
   * Income tax on gross employment income.
   * Presumes the whole figure is taxable pay — salary sacrifice / pension
   * must be deducted by the caller before passing it in.
   */
  function incomeTax(income, region) {
    if (income <= 0) return 0;
    const pa = personalAllowance(income);
    const taxable = Math.max(0, income - pa);

    if (region === "scotland") {
      let tax = 0;
      let floor = 0;
      for (const band of TAX.scotland) {
        if (taxable <= floor) break;
        tax += (Math.min(taxable, band.upTo) - floor) * band.rate;
        floor = band.upTo;
      }
      return tax;
    }

    const basic = basicRateLimit(income);
    const higherEnd = Math.max(basic, TAX.additionalThreshold - pa);

    let tax = Math.min(taxable, basic) * 0.20;
    if (taxable > basic) tax += (Math.min(taxable, higherEnd) - basic) * 0.40;
    if (taxable > higherEnd) tax += (taxable - higherEnd) * TAX.additionalRate;
    return tax;
  }

  function employeeNi(earnings) {
    if (earnings <= TAX.eeNi.threshold) return 0;
    const main = Math.min(earnings, TAX.eeNi.uel) - TAX.eeNi.threshold;
    return main * TAX.eeNi.mainRate +
      Math.max(0, earnings - TAX.eeNi.uel) * TAX.eeNi.upperRate;
  }

  function employerNi(earnings) {
    return TAX.erNi.rate * Math.max(0, earnings - TAX.erNi.threshold);
  }

  function studentLoanRepayment(earnings, plan) {
    const p = TAX.studentLoans[plan];
    if (!p || earnings <= p.threshold) return 0;
    return (earnings - p.threshold) * p.rate;
  }

  /**
   * Umbrella take-home.
   *
   * Money flows: assignment value -> employer NI + levy -> umbrella margin
   * -> salary -> employee deductions. Employer NI is charged on the salary
   * itself, so the salary is solved iteratively until it converges.
   */
  function umbrellaTakeHome(opts) {
    const weeks = Math.min(52, Math.max(1, opts.weeksPerYear || 52));
    const assignment = (opts.dayRate || 0) * (opts.daysPerWeek || 5) * weeks;
    const margin = (opts.marginPerWeek || 0) * weeks;

    let salary = Math.max(0, assignment - margin);
    for (let i = 0; i < 60; i++) {
      const levy = opts.includeLevy ? salary * TAX.apprenticeshipLevyRate : 0;
      const erNi = employerNi(salary);
      const target = Math.max(0, assignment - margin - erNi - levy);
      if (Math.abs(target - salary) < 0.005) { salary = target; break; }
      salary = target;
    }

    const employerLevy = opts.includeLevy ? salary * TAX.apprenticeshipLevyRate : 0;
    const erNi = employerNi(salary);
    const pension = ((opts.pensionPct || 0) / 100) * salary;
    const taxable = Math.max(0, salary - pension);
    const tax = incomeTax(taxable, opts.region);
    const eeNi = employeeNi(salary);
    const sl = studentLoanRepayment(salary, opts.studentLoan);
    const takeHome = Math.max(0, salary - pension - tax - eeNi - sl);
    const holidayPay = assignment * (TAX.holidayAccrualRate / (1 + TAX.holidayAccrualRate));

    return {
      weeks,
      assignment,
      margin,
      employerNi: erNi,
      employerLevy,
      grossSalary: salary,
      pension,
      tax,
      eeNi,
      studentLoan: sl,
      totalDeductions: pension + tax + eeNi + sl,
      takeHome,
      holidayPay,
      retentionPct: assignment > 0 ? (takeHome / assignment) * 100 : 0,
    };
  }

  /* Comparison: same contract value through a limited company.
   * Simplified — assumes salary = PA, remainder as dividends. */
  function limitedCompanyTakeHome(opts) {
    const weeks = Math.min(52, Math.max(1, opts.weeksPerYear || 52));
    const contractValue = (opts.dayRate || 0) * (opts.daysPerWeek || 5) * weeks;
    const salary = Math.min(TAX.personalAllowance, Math.max(0, contractValue));
    const profitBeforeTax = Math.max(0, contractValue - salary - employerNi(salary));
    const corporationTax = corporationTaxOn(profitBeforeTax);
    const dividends = Math.max(0, profitBeforeTax - corporationTax);
    const dividendTax = dividendTaxOn(dividends);
    const takeHome = salary + dividends - dividendTax;
    return {
      contractValue, salary, employerNi: employerNi(salary),
      corporationTax, dividends, dividendTax, takeHome,
      retentionPct: contractValue > 0 ? (takeHome / contractValue) * 100 : 0,
    };
  }

  function corporationTaxOn(profit) {
    if (profit <= 0) return 0;
    const smallRate = 0.19;    // profits up to £50,000
    const mainRate = 0.25;     // profits above £250,000
    if (profit <= 50000) return profit * smallRate;
    if (profit >= 250000) return profit * mainRate;
    // Marginal relief between the two limits
    const marginal = profit * mainRate - (250000 - profit) * (3 / 200);
    return marginal;
  }

  /* Dividend tax — £500 allowance; 8.75% / 33.75% / 39.35% */
  function dividendTaxOn(dividends) {
    const taxable = Math.max(0, dividends - 500);
    if (taxable <= 0) return 0;
    const basic = Math.max(0, TAX.basicRateLimit);           // dividends sit above salary
    let tax = Math.min(taxable, basic) * 0.0875;
    if (taxable > basic) tax += (Math.min(taxable, 125140) - basic) * 0.3375;
    if (taxable > 125140) tax += (taxable - 125140) * 0.3935;
    return tax;
  }

  const gbp = new Intl.NumberFormat("en-GB", {
    style: "currency", currency: "GBP",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
  const gbp2 = new Intl.NumberFormat("en-GB", {
    style: "currency", currency: "GBP",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

  window.TaxCalc = {
    TAX_YEAR, TAX,
    personalAllowance, basicRateLimit, incomeTax,
    employeeNi, employerNi, studentLoanRepayment,
    umbrellaTakeHome, limitedCompanyTakeHome,
    corporationTaxOn, dividendTaxOn,
    formatGBP: (n) => gbp.format(Math.round(n || 0)),
    formatGBP2: (n) => gbp2.format(n || 0),
  };
})(window);
