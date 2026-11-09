// Content stays visible without JavaScript; movement is a progressive enhancement.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
 const observer = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
   entry.target.classList.add('reveal-in'); observer.unobserve(entry.target);
  }
 }, {threshold: .12});
 document.querySelectorAll('.section-heading,.service-rows>a,.steps li,.founder-grid,.project-info').forEach(node => observer.observe(node));
}
