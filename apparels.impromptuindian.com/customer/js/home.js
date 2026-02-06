// Home Page JavaScript
lucide.createIcons();

// Populate welcome username
const welcomeUsername = document.getElementById('welcomeUsername');
if (welcomeUsername) {
  const username = localStorage.getItem('username') || 'Guest';
  welcomeUsername.textContent = username;
}

// CATEGORY CARDS
const categories = [
  { name: "T-Shirts", image: "../images/t_shirt.png" },
  { name: "Hoodies", image: "../images/hoodie.png" },
  { name: "Jackets", image: "../images/jacket.png" },
  { name: "Uniforms", image: "../images/uniform_set.png" },
  { name: "Sweatshirts", image: "../images/sweat_shirt.png" },
  { name: "Cap", image: "../images/hat.png" },
  { name: "Shirts", image: "../images/shirt.png" }
];

const grid = document.getElementById("categoryGrid");
categories.forEach((cat, index) => {
  const card = document.createElement("div");
  card.className = "reveal rounded-xl overflow-hidden bg-black/20 relative group cursor-pointer";
  card.style.transitionDelay = `${index * 120}ms`;
  card.innerHTML = `
    <img src="${cat.image}" class="w-full h-64 sm:h-64 md:h-[600px] object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
    <div class="absolute bottom-0 left-0 p-4">
      <p class="text-sm md:text-lg font-semibold">${cat.name}</p>
    </div>
  `;
  grid.appendChild(card);
});

// REVEAL ANIMATION
// REVEAL ANIMATION
const revealEls = document.querySelectorAll(".reveal");
const mainContainer = document.querySelector('main'); // Select the scrollable container

function revealOnScroll() {
  const trigger = window.innerHeight * 0.9;
  revealEls.forEach(el => {
    if (el.getBoundingClientRect().top < trigger) el.classList.add("show");
  });
}

// Attach listener to the scrollable container, not window
if (mainContainer) {
  mainContainer.addEventListener("scroll", revealOnScroll);
}
window.addEventListener("scroll", revealOnScroll); // Fallback
window.addEventListener("load", revealOnScroll);
// Trigger once immediately in case content is already visible
revealOnScroll();
