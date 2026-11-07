/* Gasthaus Lendplatzl — ONE swappable business-name constant.
   Change BUSINESS_NAME here and every [data-business] spot on every page updates. */
var BUSINESS_NAME = "Gasthaus Lendplatzl";

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-business]').forEach(function (n) {
    n.textContent = BUSINESS_NAME;
  });
  document.querySelectorAll('form.demo-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = form.querySelector('.form-ok');
      if (ok) ok.style.display = 'block';
      form.querySelectorAll('input, textarea').forEach(function (i) { i.disabled = true; });
    });
  });
});
