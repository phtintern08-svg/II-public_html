document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('show'));
    if (window.lucide) lucide.createIcons();
});
