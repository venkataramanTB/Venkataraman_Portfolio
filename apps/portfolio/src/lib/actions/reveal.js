export function reveal(node, { delay = 0, y = 28, duration = 650 } = {}) {
  node.style.opacity = '0';
  node.style.transform = `translateY(${y}px)`;
  node.style.transition = `opacity ${duration}ms ease ${delay}ms, transform ${duration}ms ease ${delay}ms`;

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        node.style.opacity = '1';
        node.style.transform = 'translateY(0)';
        io.disconnect();
      }
    },
    { threshold: 0.08 }
  );

  io.observe(node);
  return { destroy() { io.disconnect(); } };
}
