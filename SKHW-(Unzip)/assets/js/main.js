/* She Knows Her Worth — sponsor.html site behavior
   (mirrors the inline script used on the other pages, adapted to this
   page's markup: .nav-wrap / .nav-links / .nav-toggle, .reveal cards,
   and [data-sk-form] interest forms.) */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- mobile nav toggle ---------- */
  (function initNavToggle() {
    var toggle = document.querySelector('.nav-wrap .nav-toggle');
    var links = document.querySelector('.nav-wrap .nav-links');
    if (!toggle || !links) return;

    toggle.setAttribute('aria-expanded', 'false');

    function setOpen(isOpen) {
      links.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.textContent = isOpen ? '\u2715' : '\u2630'; /* ✕ / ☰ */
    }

    toggle.addEventListener('click', function () {
      setOpen(!links.classList.contains('open'));
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
  })();

  /* ---------- mark active nav link ---------- */
  (function markActiveLink() {
    var here = (location.pathname.split('/').pop() || 'index.html');
    document.querySelectorAll('.nav-wrap .nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === here) a.classList.add('active');
    });
  })();

  /* ---------- scroll reveal (safe by default) ----------
     Base CSS keeps every .reveal element fully visible so the page
     never breaks if this script fails to load or run. Only once we
     know we can observe elements do we hide them (.reveal-pending)
     and fade them back in on scroll — with a timed safety net that
     force-reveals anything left pending, so nothing can stay
     permanently invisible even if the observer misbehaves. */
  (function initScrollReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length || !('IntersectionObserver' in window)) return;

    els.forEach(function (el) { el.classList.add('reveal-pending'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('reveal-pending');
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { io.observe(el); });

    // Safety net: after 3s, force-reveal anything still pending
    // (covers elements the observer never fires for, e.g. edge cases
    // with dynamic mobile viewport heights).
    setTimeout(function () {
      document.querySelectorAll('.reveal-pending').forEach(function (el) {
        el.classList.remove('reveal-pending');
        el.classList.add('is-visible');
      });
    }, 3000);
  })();

  /* ---------- [data-sk-form] submission handling ----------
     Used by the sponsorship interest form and the volunteer interest
     form. Each form declares:
       data-endpoint       -> Formspree (or similar) POST URL
       data-success-target -> id of the .form-success panel to reveal
     A placeholder endpoint (containing "YOUR_FORM_ID") simulates a
     successful submission so the UX can be reviewed before a real
     form backend is wired up. */
  (function initSkForms() {
    document.querySelectorAll('form[data-sk-form]').forEach(function (form) {
      var endpoint = form.getAttribute('data-endpoint') || '';
      var successId = form.getAttribute('data-success-target');
      var successEl = successId ? document.getElementById(successId) : null;
      var errorMsg = form.querySelector('.form-msg-error');
      var submitBtn = form.querySelector('button[type="submit"]');
      var defaultLabel = submitBtn
        ? (submitBtn.getAttribute('data-label') || submitBtn.textContent)
        : '';

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!form.checkValidity()) {
          form.reportValidity();
          if (errorMsg) {
            errorMsg.textContent = 'Please complete all required fields before submitting.';
            errorMsg.classList.add('show');
          }
          return;
        }
        if (errorMsg) errorMsg.classList.remove('show');

        var isPlaceholder = !endpoint || endpoint.indexOf('YOUR_FORM_ID') !== -1;
        var data = new FormData(form);

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending\u2026';
        }

        function showSuccess() {
          form.style.display = 'none';
          if (successEl) successEl.classList.add('show');
        }

        function showError() {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = defaultLabel;
          }
          if (errorMsg) {
            errorMsg.textContent = 'Something went wrong sending this. Please try again, or email us directly.';
            errorMsg.classList.add('show');
          }
        }

        if (isPlaceholder) {
          // No real backend wired up yet — simulate success so the
          // flow can be reviewed end-to-end.
          setTimeout(showSuccess, 500);
          return;
        }

        fetch(endpoint, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        }).then(function (res) {
          if (res.ok) { showSuccess(); } else { showError(); }
        }).catch(showError);
      });
    });
  })();

});
