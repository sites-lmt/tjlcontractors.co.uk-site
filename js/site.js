/* ============================================================
   TJL Contractors — shared site behaviour
   Nav toggle, footer year, FAQ accordion, scroll reveal.
   Every block is guarded so a page without that element is fine.
   ============================================================ */
"use strict";

document.addEventListener("DOMContentLoaded", function () {

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close when a link is chosen (mobile)
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-q").forEach(function (btn) {
    var panel = btn.nextElementSibling;
    if (!panel) return;
    btn.setAttribute("aria-expanded", "false");
    panel.style.maxHeight = "0px";

    btn.addEventListener("click", function () {
      var isOpen = btn.getAttribute("aria-expanded") === "true";

      // Close siblings so only one answer is open at a time
      var group = btn.closest(".faq");
      if (group) {
        group.querySelectorAll(".faq-q").forEach(function (other) {
          if (other !== btn && other.getAttribute("aria-expanded") === "true") {
            other.setAttribute("aria-expanded", "false");
            other.nextElementSibling.style.maxHeight = "0px";
          }
        });
      }

      btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
      panel.style.maxHeight = isOpen ? "0px" : panel.scrollHeight + "px";
    });
  });

  // Keep an open answer correctly sized if the viewport changes
  window.addEventListener("resize", function () {
    document.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(function (btn) {
      var panel = btn.nextElementSibling;
      if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
    });
  });

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    if (!("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }
});
