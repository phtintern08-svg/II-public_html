// Feedback Page JavaScript
lucide.createIcons();

let rating = 0;
const starContainer = document.getElementById("starContainer");

// ⭐ Generate stars
for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.innerHTML = "★";
    star.dataset.value = i;
    star.classList.add("star");

    star.onclick = () => updateRating(i);
    star.onmouseover = () => highlightStars(i);
    star.onmouseleave = () => highlightStars(rating);

    starContainer.appendChild(star);
}

const stars = document.querySelectorAll(".star");

function updateRating(value) {
    rating = value;
    highlightStars(value);
    updateSuggestions();
}

function highlightStars(value) {
    stars.forEach((star, index) => {
        star.style.color = index < value ? "#facc15" : "#4b5563";
    });
}

// ⭐ Suggestions based on rating
const suggestionSets = {
    positive: ["The product is good.", "Great quality!", "Fast delivery.", "Vibrant colors."],
    neutral: ["The product is okay.", "Average quality.", "Delivery was on time.", "Colors are as expected."],
    negative: ["Poor quality.", "Product was damaged.", "Late delivery.", "Colors are faded."]
};

function updateSuggestions() {
    const box = document.getElementById("suggestionsBox");
    const container = document.getElementById("suggestions");

    let suggestions = [];
    if (rating >= 4) suggestions = suggestionSets.positive;
    else if (rating === 3) suggestions = suggestionSets.neutral;
    else if (rating > 0) suggestions = suggestionSets.negative;

    if (suggestions.length === 0) {
        box.classList.add("hidden");
        return;
    }

    box.classList.remove("hidden");
    container.innerHTML = "";

    suggestions.forEach((text) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bg-gray-700 px-3 py-1 rounded-lg hover:bg-gray-600 text-sm";
        btn.textContent = text;
        btn.onclick = () => {
            const comment = document.getElementById("comment");
            comment.value = comment.value
                ? comment.value + " " + text
                : text;
        };
        container.appendChild(btn);
    });
}

// 📁 Image Preview
document.getElementById("imageUpload").addEventListener("change", function () {
    const preview = document.getElementById("preview");
    preview.innerHTML = "";

    Array.from(this.files).forEach((file, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "relative bg-gray-800 p-2 rounded-lg";

        const name = document.createElement("p");
        name.className = "text-sm text-gray-300";
        name.textContent = file.name;

        const removeBtn = document.createElement("button");
        removeBtn.className =
            "absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1";
        removeBtn.innerHTML = `<i data-lucide="x" class="w-3 h-3"></i>`;
        removeBtn.onclick = () => wrapper.remove();

        wrapper.appendChild(name);
        wrapper.appendChild(removeBtn);
        preview.appendChild(wrapper);

        lucide.createIcons();
    });
});

// SUBMIT
document.getElementById("feedbackForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const btn = document.getElementById("submitBtn");

    if (rating === 0) {
        showAlert("Rating Required", "Please select a rating.", "error");
        return;
    }

    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Submitting...`;
    btn.disabled = true;

    setTimeout(() => {
        showAlert("Success", "Feedback Submitted!", "success");
        setTimeout(() => {
            window.location.href = "orders.html";
        }, 1500);
    }, 1200);
});
