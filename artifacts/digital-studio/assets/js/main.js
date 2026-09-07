(() => {
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.querySelector('span:first-child').textContent = open ? 'Close' : 'Menu';
    });
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.querySelector('span:first-child').textContent = 'Menu';
    }));
  }
  const reveal = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, io) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); io.unobserve(entry.target); }
      });
    }, { threshold: .12 });
    reveal.forEach((item, index) => { item.style.transitionDelay = `${Math.min(index * 45, 240)}ms`; observer.observe(item); });
  } else reveal.forEach((item) => item.classList.add('is-revealed'));
  const form = document.querySelector('[data-contact-form]');
  const success = document.querySelector('[data-form-success]');
  if (form && success) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.checkValidity()) { form.classList.add('form-error'); form.reportValidity(); return; }
      form.classList.remove('form-error');
      form.querySelector('button[type="submit"]').disabled = true;
      form.querySelector('button[type="submit"]').textContent = 'Message sent';
      success.classList.add('is-visible');
      success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
})();