lucide.createIcons();

// DO NOT redeclare ImpromptuIndianApi - sidebar.js already creates it
// Use window.ImpromptuIndianApi directly throughout this file

/* -------------------------------
   Utility: close dropdowns + calendar
--------------------------------*/
function closeAllPanels(except) {
  document.querySelectorAll(".custom-select .panel").forEach((p) => {
    if (p !== except) p.classList.add("hidden");
  });
  const cal = document.getElementById("calendar");
  if (except !== cal) cal.classList.add("hidden");
}

/* ---------------------------
   Custom dropdowns
---------------------------*/
function initDropdowns() {
  // Global click handler to close dropdowns when clicking outside
  // Include .trigger to handle SVG path clicks properly
  // Exclude calendar to prevent conflicts
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".custom-select, .trigger, #calendar")) {
      closeAllPanels();
    }
  });

  document.querySelectorAll(".custom-select").forEach((wrapper) => {
    const native = wrapper.querySelector("select");
    const trigger = wrapper.querySelector(".trigger");
    const panel = wrapper.querySelector(".panel");
    const display = trigger ? trigger.querySelector(".value") : null;

    // Safety check - ensure all required elements exist
    if (!native || !trigger || !panel || !display) {
      console.warn("Custom select missing required elements:", wrapper);
      return;
    }

    function rebuildOptions() {
      if (!panel || !native) return;

      panel.innerHTML = "";

      // Ensure we have options to build
      if (!native.options || native.options.length === 0) {
        console.warn("No options found in select:", native);
        return;
      }

      Array.from(native.options).forEach((opt) => {
        const optEl = document.createElement("div");
        optEl.className = "option";
        optEl.dataset.value = opt.value || opt.text;
        optEl.textContent = opt.text || opt.value;
        if (opt.selected) optEl.classList.add("selected");

        optEl.addEventListener("click", (e) => {
          e.preventDefault(); // Prevent default browser behavior
          e.stopPropagation(); // Stop event bubbling to document
          const selectedValue = opt.value || opt.text;
          const selectedText = opt.text || opt.value;

          if (native) native.value = selectedValue;
          if (display) display.textContent = selectedText;

          panel.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
          optEl.classList.add("selected");
          panel.classList.add("hidden");

          if (wrapper.dataset.name === "product-type") {
            const key = selectedText.trim();

            // Update dependent UI
            renderCategories(key);
            renderFabrics(key);

            // 🔥 FORCE SYNC after rebuild - ensures native select stays in sync
            if (native) {
              native.dispatchEvent(new Event("change"));
            }

            // 🔥 Keep UI in sync after rebuild - prevents display from resetting
            if (display) {
              display.textContent = selectedText;
            }

            // 🔥 Re-initialize dropdowns after dynamic rebuild to ensure event listeners are bound
            // This is safe because initDropdowns checks for existing elements
            setTimeout(() => {
              initDropdowns();
            }, 0);
          }

          // Trigger estimate check when any relevant dropdown changes
          if (['product-type', 'fabric-type', 'sample-size'].includes(wrapper.dataset.name)) {
            checkEstimate();
          }

          // Trigger MODAL estimate check (for old modal)
          if (wrapper.dataset.name === 'modal-sample-size') {
            checkModalEstimate();
          }
        });

        panel.appendChild(optEl);
      });
    }

    // Expose rebuild function for dynamic updates
    wrapper.rebuild = rebuildOptions;

    rebuildOptions();

    trigger.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default browser behavior
      e.stopPropagation(); // Stop event bubbling
      const isHidden = panel.classList.contains("hidden");
      closeAllPanels(panel); // Pass current panel as exception
      if (isHidden) {
        panel.classList.remove("hidden");
        // Ensure panel is visible and properly positioned
        panel.style.display = "block";
      }
    });

    native.addEventListener("change", rebuildOptions);
  });
}

/* ---------------------------
   FABRIC MAP
---------------------------*/
const FABRIC_MAP = {
  "T-Shirt": ["Cotton", "Polyester", "Dry Fit", "Pique Cotton"],
  "Hoodie": ["Cotton", "Fleece"],
  "Sweatshirt": ["Cotton", "Fleece"],
  "Jacket": ["Polyester", "Fleece", "Nylon"],
  "Cap": ["Cotton", "Polyester"],
  "Shirt": ["Cotton", "Linen", "Blend", "Formal Fabric"]
};

function renderFabrics(productType) {
  const wrapper = document.querySelector('.custom-select[data-name="fabric-type"]');
  const native = wrapper.querySelector('select');
  const display = wrapper.querySelector('.value');

  // Clear existing options
  native.innerHTML = '<option value="">Select a fabric</option>';

  // Get fabrics for product type or default
  const fabrics = FABRIC_MAP[productType] || ["Cotton", "Polyester", "Fleece"];

  // Populate new options
  fabrics.forEach(fab => {
    const opt = document.createElement('option');
    opt.value = fab;
    opt.textContent = fab;
    native.appendChild(opt);
  });

  // Reset display
  native.value = "";
  display.textContent = "Select a fabric";

  // Rebuild custom UI
  if (wrapper.rebuild) {
    wrapper.rebuild();
  }

  // 🔥 Re-initialize dropdowns after dynamic rebuild to ensure event listeners are bound
  // This ensures clicks work on newly created options
  setTimeout(() => {
    initDropdowns();
  }, 0);
}

/* ---------------------------
   CATEGORY MAP
---------------------------*/
const CATEGORY_MAP = {
  "T-Shirt": [
    { label: "Regular Fit", img: "../images/regular_fit.png" },
    { label: "Oversized Fit", img: "../images/oversized_fit.png" },
    { label: "Polo T-Shirt", img: "../images/polo-shirt.png" },
    { label: "Full Sleeve", img: "../images/full_sleeve.png" },
  ],
  Hoodie: [
    { label: "Pullover Hoodie", img: "../images/hoodie_pullover.png" },
    { label: "Zipper Hoodie", img: "../images/hoodie_zipper.png" },
    { label: "Oversized Hoodie", img: "../images/hoodie_oversized.png" },
  ],
  Jacket: [
    { label: "Zipper Jacket", img: "../images/jacket_bomber.png" },
    { label: "Bomber Jacket", img: "../images/jacket_zipper.png" },
    { label: "Windcheater", img: "../images/windcheater.png" },
  ],
  Sweatshirt: [
    { label: "Crewneck Sweatshirt", img: "../images/sweatshirt_crewneck.png" },
    { label: "Oversized Sweatshirt", img: "../images/sweatshirt_oversized.png" },
    { label: "Fleece Sweatshirt", img: "../images/sweatshirt_fleece.png" },
  ],
  Cap: [
    { label: "Baseball Cap", img: "../images/cap_baseball.png" },
    { label: "Dad Cap", img: "../images/cap_dad.png" },
    { label: "Trucker Cap", img: "../images/cap_trucker.png" },
    { label: "Snapback Cap", img: "../images/cap_snapback.png" },
  ],
  Shirt: [
    { label: "Formal Shirt", img: "../images/shirt_formal.png" },
    { label: "Casual Shirt", img: "../images/shirt_casual.png" },
    { label: "Oversized Shirt", img: "../images/shirt_oversized.png" },
    { label: "Checkered Shirt", img: "../images/shirt_checkered.png" },
  ],
};

let selectedCategory = "";
let selectedNeckType = "";

/* ---------------------------
   NECK TYPE MAPS
---------------------------*/
const NECK_TYPE_MAP = {
  "Regular Fit": [
    { label: "Crew Neck", img: "../images/neck_crew.png" },
    { label: "V-Neck", img: "../images/neck_vneck.png" },
    { label: "Henley Neck", img: "../images/neck_henley.png" },
    { label: "Round Neck", img: "../images/neck_round.png" },
  ],
  "Oversized Fit": [
    { label: "Crew Neck", img: "../images/neck_crew.png" },
    { label: "Round Neck", img: "../images/neck_round.png" },
    { label: "Henley Neck", img: "../images/neck_henley.png" },
  ],
  "Full Sleeve": [
    { label: "Crew Neck", img: "../images/f_crew.png" },
    { label: "V-Neck", img: "../images/f_vneck.png" },
    { label: "Round Neck", img: "../images/f_round.png" },
    { label: "Henley Neck", img: "../images/f_henley.png" },
    { label: "Polo Collar Neck", img: "../images/f_polo.png" },
  ],
  "Polo T-Shirt": [
    { label: "Classic Polo Collar (Standard)", img: "../images/polo_standard.png" },
    { label: "Zip Polo Collar", img: "../images/polo_zip.png" },
    { label: "Mandarin Collar Polo (Chinese Collar Polo)", img: "../images/polo_mandarin.png" },
  ],
  "Formal Shirt": [
    { label: "Point Collar", img: "../images/neck_point.png" },
    { label: "Spread Collar", img: "../images/neck_spread.png" },
    { label: "Cutaway Collar", img: "../images/neck_cutaway.png" },
    { label: "Button-Down Collar", img: "../images/neck_buttondown.png" },
  ],
  "Casual Shirt": [
    { label: "Cuban Collar", img: "../images/neck_cuban.png" },
    { label: "Button-Down Collar", img: "../images/neck_buttondown.png" },
    { label: "Point Collar", img: "../images/neck_point.png" },
  ],
  "Oversized Shirt": [
    { label: "Point Collar", img: "../images/neck_point.png" },
    { label: "Cuban Collar", img: "../images/neck_cuban.png" },
  ],
  "Checkered Shirt": [
    { label: "Button-Down Collar", img: "../images/neck_buttondown.png" },
    { label: "Point Collar", img: "../images/neck_point.png" },
  ],
};

/* ---------------------------
   Check Price Estimate
---------------------------*/

/* ---------------------------
   Check Price Estimate (MAIN & MODAL)
---------------------------*/
async function checkEstimate() {
  const productType = document.querySelector('.custom-select[data-name="product-type"] select').value;
  const fabric = document.querySelector('.custom-select[data-name="fabric-type"] select').value;
  const sampleSize = document.querySelector('.custom-select[data-name="sample-size"] select')?.value;

  const displayEl = document.getElementById("estimatedPriceDisplay");
  const containerEl = document.getElementById("estimatedCostContainer");

  // Sync with Sidebar Payment Text if present
  const sampleCostDisplay = document.getElementById("sampleCostDisplay");
  const sampleCostInput = document.getElementById("sampleCostInput");
  const samplePaymentCard = document.getElementById("samplePaymentCard");


  if (!displayEl && !sampleCostDisplay) return;

  if (displayEl) {
    if (!productType || !selectedCategory || !sampleSize) {
      displayEl.textContent = "--";
    } else {
      displayEl.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-[#FFCC00]"></i>';
    }
  }

  if (!productType || !selectedCategory || !sampleSize) {
    if (samplePaymentCard) samplePaymentCard.classList.add("hidden");
    return;
  }

  lucide.createIcons();

  try {
    const cost = await fetchEstimate(productType, selectedCategory, selectedNeckType, fabric, sampleSize);

    if (cost > 0) {
      if (displayEl) displayEl.textContent = `₹${cost}`;

      // Update sidebar
      if (sampleCostDisplay) sampleCostDisplay.textContent = `₹${cost}`;
      if (sampleCostInput) sampleCostInput.value = cost;
      if (samplePaymentCard) samplePaymentCard.classList.remove("hidden");

      if (containerEl) {
        containerEl.classList.remove("border-gray-700");
        containerEl.classList.add("border-[#FFCC00]");
      }
    } else {
      if (displayEl) displayEl.textContent = "N/A";
      if (samplePaymentCard) samplePaymentCard.classList.add("hidden");
      if (containerEl) {
        containerEl.classList.add("border-gray-700");
        containerEl.classList.remove("border-[#FFCC00]");
      }
    }
  } catch (error) {
    console.error("Error fetching estimate:", error);
    if (displayEl) displayEl.textContent = "Error";
  }
}

async function checkModalEstimate() {
  const productType = document.querySelector('.custom-select[data-name="product-type"] select').value;
  const fabric = document.querySelector('.custom-select[data-name="fabric-type"] select').value;

  // Use the modal's sample size
  const modalSampleSize = document.querySelector('.custom-select[data-name="modal-sample-size"] select')?.value;

  const modalCostDisplay = document.getElementById("modalCostDisplay");

  if (!modalCostDisplay) return;

  if (!productType || !selectedCategory || !modalSampleSize) {
    modalCostDisplay.textContent = "--";
    return;
  }

  modalCostDisplay.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-[#FFCC00]"></i>';
  lucide.createIcons();

  try {
    const cost = await fetchEstimate(productType, selectedCategory, selectedNeckType, fabric, modalSampleSize);
    if (cost > 0) {
      modalCostDisplay.textContent = `?${cost}`;
      // Store it for payment
      document.getElementById("modalPayBtn").dataset.cost = cost;
    } else {
      modalCostDisplay.textContent = "N/A";
    }
  } catch (e) {
    modalCostDisplay.textContent = "Error";
  }
}

// Helper to fetch estimate
async function fetchEstimate(product, category, neck, fabric, size) {
  const payload = {
    product_type: product,
    category: category,
    neck_type: neck || "Standard",
    fabric: fabric || "Cotton",
    size: size
  };

  try {
    const resp = await window.ImpromptuIndianApi.fetch("/api/estimate-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) return 0;

    const data = await resp.json().catch(() => null);
    return data?.estimated_price > 0 ? data.estimated_price : 0;
  } catch (error) {
    console.error("Estimate API error:", error);
    return 0;
  }
}

/* ---------------------------
   Render categories
---------------------------*/
function renderCategories(product) {
  const container = document.getElementById("categoryContainer");
  container.innerHTML = "";
  if (!CATEGORY_MAP[product]) return;

  CATEGORY_MAP[product].forEach((cat) => {
    const card = document.createElement("div");
    card.className = "category-card";
    card.tabIndex = 0;

    const img = document.createElement("img");
    img.src = cat.img;

    const label = document.createElement("div");
    label.className = "category-label";
    label.textContent = cat.label;

    card.appendChild(img);
    card.appendChild(label);

    card.addEventListener("click", () => selectCategory(card, cat.label));

    container.appendChild(card);
  });
}

/* ---------------------------
   Select category
---------------------------*/
function selectCategory(cardEl, label) {
  document.querySelectorAll(".category-card").forEach((c) => c.classList.remove("selected"));
  cardEl.classList.add("selected");
  selectedCategory = label;

  renderNeckTypes(label);
  checkEstimate();
}

/* ---------------------------
   Render neck types
---------------------------*/
function renderNeckTypes(categoryLabel) {
  const cont = document.getElementById("neckTypeContainer");
  cont.innerHTML = "";

  const list = NECK_TYPE_MAP[categoryLabel];
  if (!list) return;

  list.forEach((neck) => {
    const card = document.createElement("div");
    card.className = "category-card";

    const img = document.createElement("img");
    img.src = neck.img;

    const label = document.createElement("div");
    label.className = "category-label";
    label.textContent = neck.label;

    card.appendChild(img);
    card.appendChild(label);

    card.addEventListener("click", () => selectNeckType(card, neck.label));

    cont.appendChild(card);
  });
}

/* ---------------------------
   Select neck type
---------------------------*/
function selectNeckType(cardEl, label) {
  document.querySelectorAll("#neckTypeContainer .category-card").forEach((c) =>
    c.classList.remove("selected")
  );

  cardEl.classList.add("selected");
  selectedNeckType = label;
  checkEstimate();
}

/* ---------------------------
   DELIVERY DEADLINE CALENDAR
---------------------------*/
function initCalendar() {
  const calendar = document.getElementById("calendar");
  if (!calendar) return;

  const dateBtn = document.getElementById("dateBtn");
  const dateText = document.getElementById("dateText");
  const daysGrid = document.getElementById("daysGrid");
  const monthLabel = document.getElementById("monthLabel");
  const prevMonth = document.getElementById("prevMonth");
  const nextMonth = document.getElementById("nextMonth");

  if (!dateBtn || !dateText || !daysGrid || !monthLabel || !prevMonth || !nextMonth) return;

  // Move calendar to body to ensure positioning works correctly
  document.body.appendChild(calendar);

  const now = new Date();
  const minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

  let viewYear = minDate.getFullYear();
  let viewMonth = minDate.getMonth();
  let selectedDate = new Date(minDate);

  function formatLabel(d) {
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function renderCalendar() {
    daysGrid.innerHTML = "";

    const firstDay = new Date(viewYear, viewMonth, 1);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    monthLabel.textContent = firstDay.toLocaleString("en-IN", { month: "long", year: "numeric" });

    for (let i = 0; i < firstWeekday; i++) {
      const blank = document.createElement("div");
      blank.className = "cal-day";
      blank.style.visibility = "hidden";
      daysGrid.appendChild(blank);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      const el = document.createElement("div");
      el.className = "cal-day";
      el.textContent = d;

      if (dateObj < minDate) {
        el.classList.add("disabled");
      } else {
        el.addEventListener("click", () => {
          selectedDate = dateObj;
          dateText.textContent = formatLabel(dateObj);
          calendar.classList.add("hidden");
          renderCalendar();
        });
      }

      if (
        dateObj.getFullYear() === selectedDate.getFullYear() &&
        dateObj.getMonth() === selectedDate.getMonth() &&
        dateObj.getDate() === selectedDate.getDate()
      ) {
        el.classList.add("selected");
      }

      daysGrid.appendChild(el);
    }
  }

  renderCalendar();
  dateText.textContent = formatLabel(selectedDate);

  function toggleCalendar() {
    const isHidden = calendar.classList.contains("hidden");

    if (!isHidden) {
      calendar.classList.add("hidden");
      return;
    }

    // Get button position
    const rect = dateBtn.getBoundingClientRect();
    const calHeight = 350; // Approximate calendar height
    const calWidth = 320; // Approximate calendar width

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Smart positioning: choose side with more space
    if (spaceBelow >= calHeight) {
      // Enough space below - position below
      calendar.style.top = rect.bottom + window.scrollY + 8 + "px";
    } else if (spaceAbove >= calHeight) {
      // Not enough below but enough above - position above
      calendar.style.top = rect.top + window.scrollY - calHeight - 8 + "px";
    } else {
      // Not enough space either side - position below and let it be visible
      calendar.style.top = rect.bottom + window.scrollY + 8 + "px";
    }

    // Horizontal positioning
    calendar.style.left = rect.left + window.scrollX + "px";

    // Prevent calendar from going off-screen horizontally
    setTimeout(() => {
      const calRect = calendar.getBoundingClientRect();
      if (calRect.right > window.innerWidth) {
        calendar.style.left = window.innerWidth - calWidth - 16 + window.scrollX + "px";
      }
      if (calRect.left < 0) {
        calendar.style.left = 16 + window.scrollX + "px";
      }
    }, 0);

    calendar.classList.remove("hidden");
  }

  dateBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    renderCalendar();
    toggleCalendar();
  });

  prevMonth.addEventListener("click", (e) => {
    e.stopPropagation();
    viewMonth--;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    }
    if (
      viewYear < minDate.getFullYear() ||
      (viewYear === minDate.getFullYear() && viewMonth < minDate.getMonth())
    ) {
      viewYear = minDate.getFullYear();
      viewMonth = minDate.getMonth();
    }
    renderCalendar();
  });

  nextMonth.addEventListener("click", (e) => {
    e.stopPropagation();
    viewMonth++;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    renderCalendar();
  });

  // Prevent calendar from closing when clicking inside it
  calendar.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document.addEventListener("click", (e) => {
    if (!calendar.contains(e.target) && !dateBtn.contains(e.target)) {
      calendar.classList.add("hidden");
    }
  });

  window.addEventListener("resize", () => {
    if (!calendar.classList.contains("hidden")) {
      toggleCalendar();
      toggleCalendar();
    }
  });

  window.addEventListener("scroll", () => {
    if (!calendar.classList.contains("hidden")) {
      toggleCalendar();
      toggleCalendar();
    }
  }, { passive: true });
}

/* ---------------------------
   Quantity Inputs
---------------------------*/
function initQuantities() {
  const qtyInputs = Array.from(document.querySelectorAll(".qty-input"));
  const totalQuantityEl = document.getElementById("totalQuantity");
  const sizeSumEl = document.getElementById("sizeSum");

  if (!qtyInputs.length || !totalQuantityEl || !sizeSumEl) return;

  // Make computeSizeSum globally accessible for place order validation
  window.computeSizeSum = function () {
    const inputs = Array.from(document.querySelectorAll(".qty-input"));
    return inputs.reduce((sum, inp) => sum + (parseInt(inp.value) || 0), 0);
  };

  function updateTotals() {
    const sum = window.computeSizeSum();
    sizeSumEl.textContent = sum;

    const total = Number(totalQuantityEl.value);

    if (sum === total) {
      sizeSumEl.classList.remove("text-red-500");
      sizeSumEl.classList.add("text-green-400");
    } else {
      sizeSumEl.classList.remove("text-green-400");
      sizeSumEl.classList.add("text-red-500");
    }
  }

  qtyInputs.forEach((i) => {
    // Clear 0 when user focuses on the input
    i.addEventListener("focus", () => {
      if (i.value === "0") {
        i.value = "";
      }
    });

    // Validate and update totals on input
    i.addEventListener("input", () => {
      if (i.value === "") {
        i.value = "0";
      } else {
        i.value = Math.max(0, Math.floor(Number(i.value) || 0));
      }
      updateTotals();
    });

    // Ensure at least 0 on blur
    i.addEventListener("blur", () => {
      if (i.value === "") {
        i.value = "0";
      }
      updateTotals();
    });
  });

  totalQuantityEl.addEventListener("input", updateTotals);
}

/* ------------------------------------------------
   ADDRESS MANAGEMENT (Home / Work / Other)
--------------------------------------------------*/
let currentAddressType = "home";
let addressesData = {};

/* ---------------------------
   Normalize address API response (handles all formats)
---------------------------*/
function normalizeAddressResponse(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.addresses)) return data.addresses;
  return [];
}

/* ---------------------------
   Clear input form (global scope)
---------------------------*/
function clearAddressForm() {
  ["fldHouse", "fldArea", "fldLandmark", "fldCity", "fldState", "fldCountry", "fldPincode", "fldPhone"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
}

/* ---------------------------
   Enable / Disable form fields (global scope)
---------------------------*/
function toggleAddressFields(enable) {
  const ids = [
    "fldHouse",
    "fldArea",
    "fldLandmark",
    "fldCity",
    "fldState",
    "fldCountry",
    "fldPincode",
    "fldPhone",
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !enable;
  });
}

/* ---------------------------
   Show/Hide Save Button (global scope)
---------------------------*/
function toggleSaveButton(show) {
  const saveAddressBtn = document.getElementById("saveAddressBtn");
  if (!saveAddressBtn) return;

  if (show) {
    saveAddressBtn.classList.remove("hidden");
    saveAddressBtn.textContent =
      "Save " + currentAddressType.charAt(0).toUpperCase() + currentAddressType.slice(1) + " Address";
  } else {
    saveAddressBtn.classList.add("hidden");
  }
}

/* ---------------------------
   Fill the form with backend data (global scope)
---------------------------*/
function fillAddressForm(addr) {
  // Note: address_line1 splitting is fragile for complex addresses like "Flat No 12 Block A Phase 2"
  // For MVP, we split on first space. Future: consider storing house/area separately in DB
  const line1 = addr.address_line1 || "";
  const parts = line1.split(" ");
  const house = addr.house || (parts.length > 0 ? parts[0] : "");
  const area = addr.area || (parts.length > 1 ? parts.slice(1).join(" ") : "");
  
  document.getElementById("fldHouse").value = house;
  document.getElementById("fldArea").value = area;
  document.getElementById("fldLandmark").value = addr.landmark || "";
  document.getElementById("fldCity").value = addr.city || "";
  document.getElementById("fldState").value = addr.state || "";
  document.getElementById("fldCountry").value = addr.country || "";
  document.getElementById("fldPincode").value = addr.pincode || "";
  document.getElementById("fldPhone").value = addr.alternative_phone || "";
}

/* ---------------------------
   Save address (POST or PUT) (global scope)
---------------------------*/
async function saveAddress() {
  const house = document.getElementById("fldHouse").value.trim();
  const area = document.getElementById("fldArea").value.trim();
  const landmark = document.getElementById("fldLandmark").value.trim();
  const city = document.getElementById("fldCity").value.trim();
  const state = document.getElementById("fldState").value.trim();
  const country = document.getElementById("fldCountry").value.trim();
  const pincode = document.getElementById("fldPincode").value.trim();
  const phone = document.getElementById("fldPhone").value.trim();

  if (!house || !area || !city || !state || !pincode) {
    showAlert("Missing Fields", "Please fill in all required fields.", "error");
    return;
  }

  const payload = {
    address_type: currentAddressType,
    address_line1: house + " " + area,
    address_line2: landmark,
    city,
    state,
    country,
    pincode,
    alternative_phone: phone,
    landmark
  };

  try {
    let response;
    let existing = addressesData[currentAddressType];

    if (existing && existing.id) {
      response = await window.ImpromptuIndianApi.fetch(`/api/customer/addresses/${existing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });
    } else {
      response = await window.ImpromptuIndianApi.fetch("/api/customer/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });
    }

    const result = await response.json();

    if (response.ok) {
      // Update local cache immediately
      addressesData[currentAddressType] = result;
      
      // Immediately reflect in UI
      fillAddressForm(result);
      toggleAddressFields(false);
      toggleSaveButton(false);
      
      // Trigger cross-page sync
      localStorage.setItem('address_updated_at', Date.now().toString());
      
      showAlert("Success", "Address saved successfully!", "success");
    } else {
      showAlert("Error", result.error || "Failed to save address", "error");
    }
  } catch (e) {
    console.error("Save address error", e);
    showAlert("Connection Error", "Unable to reach server", "error");
  }
}

/* ---------------------------
   Load address from backend
---------------------------*/
async function loadAddressForType(type) {
  const token = localStorage.getItem("token");
  if (!token) {
    // Clear address cache on token loss
    addressesData = {};
    clearAddressForm();
    toggleAddressFields(true);
    toggleSaveButton(true);
    return;
  }

  // If already cached
  if (addressesData[type]) {
    fillAddressForm(addressesData[type]);
    toggleAddressFields(false);
    toggleSaveButton(false);
    return;
  }

  try {
    const resp = await window.ImpromptuIndianApi.fetch(`/api/customer/addresses`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (resp.ok) {
      const raw = await resp.json();
      const addresses = normalizeAddressResponse(raw);

      // Handle empty array gracefully - always show empty form for new users
      if (addresses.length === 0) {
        clearAddressForm();
        toggleAddressFields(true);
        toggleSaveButton(true);
        return;
      }

      const address = addresses.find(a => a && a.address_type === type);

      // If address exists and has data
      if (address && Object.keys(address).length > 0) {
        addressesData[type] = address;
        fillAddressForm(address);
        toggleAddressFields(false);
        toggleSaveButton(false);

        // Make missing fields editable
        const idsToCheck = ["fldHouse", "fldArea", "fldLandmark"];
        let hasEmptyFields = false;
        idsToCheck.forEach((id) => {
          const el = document.getElementById(id);
          if (el && !el.value.trim()) {
            el.disabled = false;
            hasEmptyFields = true;
          }
        });

        if (hasEmptyFields) {
          toggleSaveButton(true);
        }
      } else {
        // No address found for this type - show empty form (no error)
        clearAddressForm();
        toggleAddressFields(true);
        toggleSaveButton(true);
      }
    } else if (resp.status === 404) {
      // 404 is fine - user just hasn't saved any addresses yet
      // Show empty form for user to add address (no error)
      clearAddressForm();
      toggleAddressFields(true);
      toggleSaveButton(true);
    } else {
      // Other API errors - still allow user to add address
      clearAddressForm();
      toggleAddressFields(true);
      toggleSaveButton(true);
    }
  } catch (err) {
    console.error("Error loading address:", err);
    // Gracefully handle missing addresses - no errors, just enable form for input
    clearAddressForm();
    toggleAddressFields(true);
    toggleSaveButton(true);
    // Don't show error alert - this is normal when user hasn't saved addresses yet
  }
}

/* ---------------------------
   Switch between address types
---------------------------*/
function switchAddressType(type) {
  currentAddressType = type;

  const btnHome = document.getElementById("btnHome");
  const btnWork = document.getElementById("btnWork");
  const btnOther = document.getElementById("btnOther");

  if (btnHome && btnWork && btnOther) {
    [btnHome, btnWork, btnOther].forEach((b) => b.classList.remove("active"));
    if (type === "home") btnHome.classList.add("active");
    if (type === "work") btnWork.classList.add("active");
    if (type === "other") btnOther.classList.add("active");
  }

  loadAddressForType(type);
}

function initAddress() {
  const btnHome = document.getElementById("btnHome");
  const btnWork = document.getElementById("btnWork");
  const btnOther = document.getElementById("btnOther");
  const saveAddressBtn = document.getElementById("saveAddressBtn");

  if (!btnHome || !btnWork || !btnOther || !saveAddressBtn) return;

  btnHome.addEventListener("click", () => switchAddressType("home"));
  btnWork.addEventListener("click", () => switchAddressType("work"));
  btnOther.addEventListener("click", () => switchAddressType("other"));

  // All address functions are now in global scope (see above)
  // Just wire up the event listener
  saveAddressBtn.addEventListener("click", saveAddress);

  /* ---------------------------
     Load ALL addresses at start
  ---------------------------*/
  
  // Check for cross-page sync (address updated on another page)
  const lastSeenUpdate = localStorage.getItem('address_updated_at_seen');
  const currentUpdate = localStorage.getItem('address_updated_at');
  
  if (currentUpdate && currentUpdate !== lastSeenUpdate) {
    // Address was updated on another page - reload addresses
    loadAllAddresses().then(() => {
      localStorage.setItem('address_updated_at_seen', currentUpdate);
      switchAddressType(currentAddressType);
    });
  } else {
    loadAllAddresses();
    switchAddressType("home");
  }
}

async function loadAllAddresses() {
  const token = localStorage.getItem('token');
  if (!token) {
    // No token - silently return, user can still add addresses
    return;
  }

  try {

    const resp = await window.ImpromptuIndianApi.fetch(`/api/customer/addresses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (resp.ok) {
      const raw = await resp.json();
      const addresses = normalizeAddressResponse(raw);

      // Handle empty array or null response gracefully
      if (addresses.length > 0) {
        addresses.forEach((addr) => {
          if (addr && addr.address_type) {
            addressesData[addr.address_type] = addr;
          }
        });
      }
      // If list is empty, addressesData remains empty - this is fine, user can add addresses
    } else if (resp.status === 404) {
      // 404 is fine - user just hasn't saved any addresses yet
      console.log("No addresses found - user can add new ones");
    }
  } catch (e) {
    // Silently handle errors - don't show alerts for missing addresses
    // User can still add addresses on this page
    console.log("Addresses not loaded - user can add new ones:", e.message);
  }
}

/* ------------------------------------------------
   USE CURRENT LOCATION  MAPMYINDIA (MAPPLS)
--------------------------------------------------*/

const useCurrentLocationBtn = document.getElementById("useCurrentLocationBtn");
let map = null;
let marker = null;

if (useCurrentLocationBtn) {
  useCurrentLocationBtn.addEventListener("click", async () => {
    const btnHTML = useCurrentLocationBtn.innerHTML;
    useCurrentLocationBtn.innerHTML =
      '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Getting Location...';
    useCurrentLocationBtn.disabled = true;
    lucide.createIcons();

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation not supported");
      }


      // Search Functionality for Map
      const mapSearchBtn = document.getElementById("mapSearchBtn");
      const mapSearchInput = document.getElementById("mapSearchInput");

      const performMapSearch = () => {
        const query = mapSearchInput.value.trim();
        if (!query) return;

        const oldText = mapSearchBtn.innerText;
        mapSearchBtn.innerText = "...";
        mapSearchBtn.disabled = true;

        // ? USE CLIENT-SIDE SDK SEARCH
        // This runs from the browser using the whitelisted domain, bypassing backend 412 blocks.
        const searchOptions = {
          query: query
        };

        try {
          // Try calling as function first (common in v3.0 updates)
          mappls.search(searchOptions, (data) => {
            mapSearchBtn.innerText = oldText;
            mapSearchBtn.disabled = false;

            if (data && data.length > 0) {
              const result = data[0];
              const newLat = parseFloat(result.latitude || result.lat);
              const newLng = parseFloat(result.longitude || result.lng);

              // eLoc is precise unique ID for a place
              const eLoc = result.eLoc;

              if (!isNaN(newLat) && !isNaN(newLng)) {
                map.setCenter([newLat, newLng]);
                marker.setPosition({ lat: newLat, lng: newLng });
                map.setZoom(17); // Close zoom for confirmed search
              } else if (eLoc) {
                // Fallback: If only eLoc is returned (sometimes happens)
                // We might need to resolve eLoc, but usually SDK returns lat/lng
                console.warn("Received eLoc only:", eLoc);
              }
            } else {
              // Try Autosuggest if Search fails (sometimes different results)
              new mappls.autoSuggest({ query: query }, (autoData) => {
                if (autoData && autoData.length > 0) {
                  const autoRes = autoData[0];
                  const aLat = parseFloat(autoRes.latitude || autoRes.lat);
                  const aLng = parseFloat(autoRes.longitude || autoRes.lng);
                  if (!isNaN(aLat)) {
                    map.setCenter([aLat, aLng]);
                    marker.setPosition({ lat: aLat, lng: aLng });
                    map.setZoom(17);
                    return;
                  }
                }
                showAlert("Not Found", "Location not found. Try a broader area name.", "info");
              });
            }
          });
        } catch (e) {
          console.error("SDK Search Error", e);
          mapSearchBtn.innerText = oldText;
          mapSearchBtn.disabled = false;
          showAlert("Error", "Search service is unavailable.", "error");
        }
      };

      mapSearchBtn.addEventListener("click", performMapSearch);
      mapSearchInput.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') performMapSearch();
      });

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          // ... rest of existing code ...

          let lat, lng;
          if (pos.coords) {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            // Debugging Location Accuracy
            console.log(`GPS Success: Lat ${lat}, Lng ${lng}, Acc ${pos.coords.accuracy}m`);
            // alert(`Debug: Browser returned location.\n\nLat: ${lat}\nLng: ${lng}\nAccuracy: ${pos.coords.accuracy} meters\n\nNote: If this is wrong, your Browser/ISP is estimating location via IP.`);
          } else if (Array.isArray(pos)) {
            [lat, lng] = pos;
          }

          const mapModal = document.getElementById("mapModal");
          mapModal.classList.remove("hidden");

          // Initialize map AFTER modal is visible (use requestAnimationFrame for proper rendering)
          requestAnimationFrame(async () => {
            try {
              // Load SDK if not already loaded
              await loadMapplsSDK();

              if (typeof mappls === 'undefined' || !mappls.Map) {
                throw new Error("Mappls SDK not loaded");
              }

              // Smart Zoom based on Accuracy
              // If accuracy is poor (>500m), set zoom to 16
              // If good, zoom in tight
              const zoomLevel = (pos.coords.accuracy > 500) ? 16 : 18;

              if (!map) {
                map = new mappls.Map("mapContainer", {
                  center: [lat, lng],
                  zoom: zoomLevel
                });

                marker = new mappls.Marker({
                  map: map,
                  position: { lat: lat, lng: lng },
                  draggable: true
                });

                // Add accuracy circle
                const accuracy = pos.coords ? pos.coords.accuracy : 50;
                new mappls.Circle({
                  map: map,
                  center: [lat, lng],
                  radius: accuracy, // meters
                  fillColor: "#3b82f6",
                  fillOpacity: 0.15,
                  strokeOpacity: 0.3,
                });

                console.log('Map initialized correctly');

              } else {
                // Map already exists - update position and resize
                map.setCenter([lat, lng]);
                marker.setPosition({ lat: lat, lng: lng });
                map.setZoom(zoomLevel);
                // Resize map to handle container size changes
                if (map.resize) {
                  requestAnimationFrame(() => map.resize());
                }
              }
            } catch (err) {
              console.error("Map initialization error:", err);
              showAlert("Configuration Error", "Map service failed to load. Please try again later.", "error");
              useCurrentLocationBtn.innerHTML = btnHTML;
              useCurrentLocationBtn.disabled = false;
              return;
            }
          });

          // Reset button
          useCurrentLocationBtn.innerHTML = btnHTML;
          useCurrentLocationBtn.disabled = false;
          lucide.createIcons();

        },

        (err) => {
          console.error("GPS Error", err);

          // Even if GPS fails/denied, OPEN THE MAP ANYWAY so they can search
          // Default to Bangalore center
          let lat = 12.9716;
          let lng = 77.5946;

          const mapModal = document.getElementById("mapModal");
          mapModal.classList.remove("hidden");

          // Initialize map AFTER modal is visible (use requestAnimationFrame for proper rendering)
          requestAnimationFrame(async () => {
            try {
              // Load SDK if not already loaded
              await loadMapplsSDK();

              if (typeof mappls === 'undefined' || !mappls.Map) {
                throw new Error("Mappls SDK not loaded");
              }

              if (!map) {
                map = new mappls.Map("mapContainer", { center: [lat, lng], zoom: 12 });
                marker = new mappls.Marker({ map: map, position: { lat: lat, lng: lng }, draggable: true });
                console.log('Map initialized correctly');
              } else {
                // Map already exists - update position and resize
                map.setCenter([lat, lng]);
                marker.setPosition({ lat: lat, lng: lng });
                map.setZoom(12);
                // Resize map to handle container size changes
                if (map.resize) {
                  requestAnimationFrame(() => map.resize());
                }
              }
            } catch (err) {
              console.error("Map initialization error:", err);
              showAlert("Configuration Error", "Map service failed to load. Please try again later.", "error");
            }
          });

          useCurrentLocationBtn.innerHTML = btnHTML;
          useCurrentLocationBtn.disabled = false;
          lucide.createIcons();
        },
        // Aggressive GPS Options
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );

      /* -------------------------------
         CONFIRM LOCATION ? REVERSE GEOCODE -> SAVE
      ------------------------------- */
      document.getElementById("confirmLocationBtn").onclick = async () => {
        if (!marker) return;

        const btn = document.getElementById("confirmLocationBtn");
        const oldHTML = btn.innerHTML;
        btn.innerHTML =
          '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing...';
        btn.disabled = true;
        lucide.createIcons();

        try {
          const pos = marker.getPosition(); // Returns { lat, lng } or similar object
          // Mappls SDK docs say getPosition() returns object with lat, lng properties
          const lat = pos.lat || pos[0];
          const lng = pos.lng || pos[1];

          // Use MapmyIndia Reverse Geocoding
          const locService = new LocationService();
          const addressData = await locService.reverseGeocodeMappls(lat, lng);

          // Determine target address type (Home -> Work -> Other)
          // Use existing logic to find empty slot or default to current
          let targetType = currentAddressType;
          if (!addressesData.home) targetType = 'home';
          else if (!addressesData.work) targetType = 'work';
          else if (!addressesData.other) targetType = 'other';
          else targetType = currentAddressType;

          // Prepare address object for the form (Draft mode, not saved to backend) //
          const newAddress = {
            id: (addressesData[targetType] && addressesData[targetType].id) ? addressesData[targetType].id : null,
            address_type: targetType,
            house: "",
            area: addressData.area || addressData.street || "",
            landmark: "",
            city: addressData.city || addressData.district || "",
            state: addressData.state || "",
            country: addressData.country || "India",
            pincode: addressData.pincode || "",
            alternative_phone: (addressesData[targetType] && addressesData[targetType].alternative_phone) || ""
          };

          // Update local state
          addressesData[targetType] = newAddress;

          // Switch to target type (this fills the form)
          switchAddressType(targetType);

          // Force Enable Edit Mode
          // Wait for switchAddressType to finish its UI updates
          setTimeout(() => {
            toggleAddressFields(true);
            toggleSaveButton(true);

            // Focus on the first empty field (likely House)
            const houseInput = document.getElementById("fldHouse");
            if (houseInput && !houseInput.value) houseInput.focus();
          }, 50);

          mapModal.classList.add("hidden");
          showAlert("Location Fetched", "Please verify details and save the address.", "info");

        } catch (err) {
          console.error(err);
          showAlert("Error", "Unable to fetch address details.", "error");
        } finally {
          btn.innerHTML = oldHTML;
          btn.disabled = false;
          lucide.createIcons();
        }
      };

    } catch (error) {
      console.error(error);
      showAlert("Error", "An unexpected error occurred.", "error");
      useCurrentLocationBtn.innerHTML = btnHTML;
      useCurrentLocationBtn.disabled = false;
    }
  });
}
/* ------------------------------------------------
   FILE UPLOAD + 3D VIEWER
--------------------------------------------------*/
function initFileUpload() {
  const fileInput = document.getElementById("file");
  const fileLabel = document.getElementById("fileLabel");
  const viewModelBtn = document.getElementById("viewModelBtn");

  if (!fileInput || !fileLabel || !viewModelBtn) return;

  fileInput.addEventListener("change", () => {
    const hasFile = fileInput.files && fileInput.files.length > 0;
    const filename = hasFile ? fileInput.files[0].name : "Choose File";

    fileLabel.querySelector(".filename").textContent = filename;

    if (hasFile) {
      document.getElementById("placementOptions").classList.remove("hidden");
      viewModelBtn.classList.remove("hidden");

      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof update3DTexture === "function") {
          update3DTexture(e.target.result);
        }
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      document.getElementById("placementOptions").classList.add("hidden");
      viewModelBtn.classList.add("hidden");
    }
  });
}

/* ------------------------------------------------
   CART BADGE
--------------------------------------------------*/
function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  const cart = JSON.parse(localStorage.getItem("threadly_cart") || "[]");
  const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  badge.style.display = total > 0 ? "flex" : "none";
  if (total > 0) badge.textContent = total;
}

try { updateCartBadge(); } catch { }

/* ------------------------------------------------
   PAYMENT MODAL LOGIC & VALIDATION
--------------------------------------------------*/
// Load payment state from localStorage
let isSamplePaid = localStorage.getItem("sample_paid") === "1";
let currentTransactionId = null;

// Card Number Formatting - safely check for element existence
const cardNumber = document.getElementById("cardNumber");
if (cardNumber) {
  cardNumber.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.replace(/(.{4})/g, '$1 ').trim();
    e.target.value = val;
  });
}

// Expiry Date Formatting - safely check for element existence
const cardExpiry = document.getElementById("cardExpiry");
if (cardExpiry) {
  cardExpiry.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    e.target.value = val;
  });
}

// Modal Pay Button
// Card Listeners
function attachCardListeners() {
  const cn = document.getElementById("cardNumber");
  if (cn) {
    cn.removeEventListener("input", cardNumInputHandler); // remove old if exists (unnamed, so can't really)
    cn.addEventListener("input", cardNumInputHandler);
  }
  const exp = document.getElementById("cardExpiry");
  if (exp) {
    exp.addEventListener("input", cardExpInputHandler);
  }
}

function cardNumInputHandler(e) {
  let val = e.target.value.replace(/\D/g, '');
  val = val.replace(/(.{4})/g, '$1 ').trim();
  e.target.value = val;
}
function cardExpInputHandler(e) {
  let val = e.target.value.replace(/\D/g, '');
  if (val.length >= 2) {
    val = val.substring(0, 2) + '/' + val.substring(2, 4);
  }
  e.target.value = val;
}

// Safely attach card listeners if elements exist
// This is called at top level but has safety checks inside
if (document.getElementById("cardNumber") || document.getElementById("cardExpiry")) {
  attachCardListeners();
}


/* ------------------------------------------------
   PAYMENT GATEWAY LOGIC
--------------------------------------------------*/
let currentPaymentMethod = 'card';

window.switchPaymentTab = function (method) {
  currentPaymentMethod = method;
  // Update Sidebar
  ['card', 'upi', 'netbanking', 'cod'].forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    if (btn) {
      if (t === method) {
        btn.classList.add('bg-blue-900/10', 'border-blue-500', 'text-blue-400');
        btn.classList.remove('border-transparent', 'text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
      } else {
        btn.classList.remove('bg-blue-900/10', 'border-blue-500', 'text-blue-400');
        btn.classList.add('border-transparent', 'text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
      }
    }
  });
  // Update View
  document.querySelectorAll('.payment-view').forEach(el => el.classList.add('hidden'));
  const v = document.getElementById(`view-${method}`);
  if (v) v.classList.remove('hidden');
};

async function checkGatewayEstimate() {
  const productType = document.querySelector('.custom-select[data-name="product-type"] select').value;
  const fabric = document.querySelector('.custom-select[data-name="fabric-type"] select').value;
  const modalSampleSize = document.querySelector('.custom-select[data-name="modal-sample-size"] select')?.value;

  const gatewaySample = document.getElementById("gatewaySampleCost");
  const gatewayTotal = document.getElementById("gatewayTotalPayable");
  const gatewayEstTotal = document.getElementById("gatewayEstTotalCost");

  if (!gatewayTotal) return;

  if (!productType || !selectedCategory || !modalSampleSize) {
    gatewayTotal.textContent = "--";
    document.querySelectorAll('.pay-amount-display').forEach(el => el.textContent = '--');
    return;
  }

  gatewayTotal.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-[#FFCC00]"></i>';
  lucide.createIcons();

  try {
    const cost = await fetchEstimate(productType, selectedCategory, selectedNeckType, fabric, modalSampleSize);
    const displayCost = cost > 0 ? `₹${cost}` : "N/A";

    if (gatewaySample) gatewaySample.textContent = displayCost;
    gatewayTotal.textContent = displayCost;
    if (gatewayEstTotal) gatewayEstTotal.textContent = cost > 0 ? `Approx. ₹${cost * (document.getElementById("totalQuantity").value || 50)}` : "--";

    document.querySelectorAll('.pay-amount-display').forEach(el => el.textContent = displayCost);
    document.getElementById("paymentModal").dataset.currentCost = cost > 0 ? cost : 0;

  } catch (e) {
    gatewayTotal.textContent = "Error";
  }
}

async function processGatewayPayment(btnId) {
  const btn = document.getElementById(btnId);
  const cost = document.getElementById("paymentModal").dataset.currentCost;

  if (!cost || cost == 0) {
    showAlert("Error", "Please select a size to calculate cost.", "error");
    return;
  }

  // Initialize payment gateway
  const gateway = new FakePaymentGateway();

  try {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing...';
    btn.disabled = true;
    lucide.createIcons();

    let paymentResult;
    const amount = parseFloat(cost);

    // Process payment based on method
    if (currentPaymentMethod === 'card') {
      const cardNum = document.getElementById("cardNumber").value;
      const expiry = document.getElementById("cardExpiry").value;
      const cvv = document.getElementById("cardCvv").value;
      const cardName = document.getElementById("cardName").value;

      if (!cardName || cardName.trim().length < 3) {
        throw new Error("Please enter cardholder name");
      }

      paymentResult = await gateway.processCardPayment({
        number: cardNum,
        expiry: expiry,
        cvv: cvv,
        name: cardName
      }, amount);

      // Show card type
      const cardType = gateway.getCardType(cardNum);
      console.log('Card Type:', cardType);

    } else if (currentPaymentMethod === 'upi') {
      const upiId = document.getElementById("upiId").value;
      paymentResult = await gateway.processUpiPayment(upiId, amount);

    } else if (currentPaymentMethod === 'netbanking') {
      const bank = document.getElementById("bankSelect").value;
      if (!bank) {
        throw new Error("Please select a bank");
      }
      paymentResult = await gateway.processNetBankingPayment(bank, amount);

    } else if (currentPaymentMethod === 'cod') {
      paymentResult = await gateway.processCOD(amount);
    }

    // Payment successful
    isSamplePaid = true;
    localStorage.setItem("sample_paid", "1");
    currentTransactionId = paymentResult.transactionId;

    // Store payment details for order
    window.paymentDetails = {
      transactionId: paymentResult.transactionId,
      method: paymentResult.method,
      amount: paymentResult.amount,
      timestamp: paymentResult.timestamp,
      status: 'success'
    };

    // Show success UI
    btn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> Payment Successful';
    btn.classList.remove("bg-[#FFCC00]", "hover:bg-[#FFB800]");
    btn.classList.add("bg-green-600", "hover:bg-green-700");
    btn.classList.remove("text-black");
    btn.classList.add("text-white");
    lucide.createIcons();

    // Show success message with transaction details
    const successMsg = `
      Payment successful!<br>
      <span class="text-sm opacity-80">Transaction ID: ${paymentResult.transactionId}</span><br>
      <span class="text-sm opacity-80">Amount: ₹${amount}</span>
    `;

    showAlert("Payment Successful", successMsg, "success");

    // Close modal and proceed to place order
    await new Promise(r => setTimeout(r, 1500));
    document.getElementById("paymentModal").classList.add("hidden");

    // Reset button for next time
    btn.innerHTML = originalText;
    btn.classList.remove("bg-green-600", "hover:bg-green-700");
    btn.classList.add("bg-[#FFCC00]", "hover:bg-[#FFB800]");
    btn.classList.remove("text-white");
    btn.classList.add("text-black");
    btn.disabled = false;

    // Auto-trigger place order
    document.getElementById("placeOrderBtn").click();

  } catch (error) {
    console.error('Payment error:', error);
    showAlert("Payment Failed", error.message || "Payment processing failed. Please try again.", "error");

    // Reset button
    btn.innerHTML = '<i data-lucide="x-circle" class="w-4 h-4"></i> ' + error.message;
    btn.classList.add("bg-red-600");
    lucide.createIcons();

    setTimeout(() => {
      btn.innerHTML = btn.id === 'btnPayCard' ?
        '<i data-lucide="credit-card" class="w-4 h-4"></i> Pay ₹' + cost :
        '<i data-lucide="smartphone" class="w-4 h-4"></i> Pay ₹' + cost;
      btn.classList.remove("bg-red-600");
      btn.classList.add("bg-[#FFCC00]");
      btn.disabled = false;
      lucide.createIcons();
    }, 2000);
  }
}

// Bind Buttons (delegate)
document.addEventListener('click', (e) => {
  if (e.target.closest('#btnPayCard')) { e.preventDefault(); processGatewayPayment('btnPayCard'); }
  if (e.target.closest('#btnPayUpi')) { e.preventDefault(); processGatewayPayment('btnPayUpi'); }
});

/* Old processModalPayment listener removed/replaced */

/* ------------------------------------------------
   PLACE ORDER BUTTON
--------------------------------------------------*/
/* ------------------------------------------------
   PLACE ORDER BUTTON
--------------------------------------------------*/
function initPlaceOrder() {
  const desktopBtn = document.getElementById("placeOrderBtn");
  const mobileBtn = document.getElementById("placeOrderBtnMobile");

  const handlePlaceOrder = async () => {
    /* 1. QUANTITY VALIDATION */
    const sum = window.computeSizeSum();
    const totalQuantityEl = document.getElementById("totalQuantity");
    const rawTotal = totalQuantityEl.value;
    const total = Math.floor(Number(rawTotal));

    if (!Number.isFinite(total) || total < 10 || total > 300) {
      showAlert("Invalid Quantity", "Total quantity must be between 10 and 300.", "error");
      return;
    }
    if (sum !== total) {
      showAlert("Quantity Mismatch", "Sizes total must match the Total Quantity.", "error");
      return;
    }

    /* 2. PRICE VALIDATION */
    const pricePerPieceInput = document.getElementById("pricePerPiece");
    const pricePerPiece = Number(pricePerPieceInput.value);
    if (!pricePerPiece || pricePerPiece < 200) {
      showAlert("Invalid Price", "Price per piece must be at least ₹200.", "error");
      pricePerPieceInput.focus();
      return;
    }

    /* 3. PRODUCT DETAILS */
    const product = document.querySelector('.custom-select[data-name="product-type"] select').value;
    const color = document.querySelector('.custom-select[data-name="color"] select').value;
    const fabric = document.querySelector('.custom-select[data-name="fabric-type"] select').value;
    const printType = document.querySelector('.custom-select[data-name="print-type"] select').value;

    if (!product || !selectedCategory) {
      showAlert("Missing Details", "Please select a product type and category.", "error");
      return;
    }

    /* 5. ADDRESS VALIDATION */
    const house = document.getElementById("fldHouse").value.trim();
    const area = document.getElementById("fldArea").value.trim();
    const city = document.getElementById("fldCity").value.trim();
    const state = document.getElementById("fldState").value.trim();
    const pincode = document.getElementById("fldPincode").value.trim();
    const landmark = document.getElementById("fldLandmark").value.trim();
    const country = document.getElementById("fldCountry").value.trim();

    if (!house || !area || !city || !state || !pincode) {
      showAlert("Missing Address", "Please fill in all required address fields.", "error");
      return;
    }

    /* 6. PAYMENT CHECK */
    if (!isSamplePaid) {
      // OPEN GATEWAY
      const paymentModal = document.getElementById("paymentModal");
      paymentModal.classList.remove("hidden");

      // Sync Size
      const mainSampleSize = document.querySelector('.custom-select[data-name="sample-size"] select')?.value;
      if (mainSampleSize) {
        // Trigger sync for gateway dropdown
        const modalSelectWrapper = document.querySelector('.custom-select[data-name="modal-sample-size"]');
        if (modalSelectWrapper) {
          const modalOptions = modalSelectWrapper.querySelectorAll('.option');
          let found = false;
          modalOptions.forEach(opt => {
            if (opt.dataset.value === mainSampleSize) {
              opt.click();
              found = true;
            }
          });
          if (!found) {
            const sel = modalSelectWrapper.querySelector('select');
            if (sel) sel.value = mainSampleSize;
            const disp = modalSelectWrapper.querySelector('.trigger .value');
            if (disp) disp.textContent = mainSampleSize;
            // Use checkGatewayEstimate for payment gateway modal
            if (typeof checkGatewayEstimate === 'function') checkGatewayEstimate();
          }
        }
      }
      return;
    }

    /* 7. BUILD PAYLOAD */
    const dateText = document.getElementById("dateText");

    // Sample Size
    const mainSampleSize = document.querySelector('.custom-select[data-name="sample-size"] select')?.value;
    const modalSampleSize = document.querySelector('.custom-select[data-name="modal-sample-size"] select')?.value;
    const finalSampleSize = modalSampleSize || mainSampleSize || "M"; // fallback

    // Cost Retrieval
    const estimatedCostEl = document.getElementById("estimatedPriceDisplay");
    // Try gateway cost first, then modal, then main
    const gatewayTotal = document.getElementById("gatewayTotalPayable");
    const modalCostEl = document.getElementById("modalCostDisplay");

    let finalEstCost = estimatedCostEl?.textContent;
    if (finalEstCost === "--" || finalEstCost === "N/A" || !finalEstCost) {
      if (gatewayTotal && gatewayTotal.textContent !== "--") finalEstCost = gatewayTotal.textContent;
      else if (modalCostEl) finalEstCost = modalCostEl.textContent;
    }

    // Actual numeric cost for backend
    const storedCost = document.getElementById("paymentModal").dataset.currentCost;
    const numericCost = storedCost ? parseFloat(storedCost) : 0.0;

    const payload = {
      product_type: product,
      category: selectedCategory,
      neck_type: selectedNeckType || "",
      color: color,
      fabric: fabric,
      print_type: printType,
      quantity: total,
      price_per_piece: pricePerPiece,
      sample_size: finalSampleSize,
      estimated_cost: finalEstCost,
      delivery_date: dateText.textContent,
      address_line1: `${house} ${area}`,
      address_line2: landmark,
      city,
      state,
      pincode,
      country,
      transaction_id: currentTransactionId,
      sample_cost: numericCost,
      payment_method: window.paymentDetails?.method || 'card',
      payment_details: JSON.stringify(window.paymentDetails || {})
    };

    /* 8. SUBMIT ORDER */
    submitOrder(payload);
  };

  if (desktopBtn) desktopBtn.addEventListener("click", handlePlaceOrder);
  if (mobileBtn) mobileBtn.addEventListener("click", handlePlaceOrder);
}

async function submitOrder(payload) {
  const btns = [
    document.getElementById("placeOrderBtn"),
    document.getElementById("placeOrderBtnMobile")
  ].filter(b => b);

  // Update UI state
  btns.forEach(btn => {
    btn.dataset.oldText = btn.textContent;
    btn.textContent = "Placing Order...";
    btn.disabled = true;
  });

  try {
    const token = localStorage.getItem('token');
    const res = await window.ImpromptuIndianApi.fetch("/api/orders/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (res.ok) {
      showAlert("Success", "Order placed successfully! Redirecting to your orders...", "success", () => {
        window.location.href = "orders.html";
      });

      // Auto-redirect after 2 seconds if user doesn't click
      setTimeout(() => {
        window.location.href = "orders.html";
      }, 2000);

    } else {
      showAlert("Order Failed", result.error || "Failed to place order.", "error");
      // Reset UI
      btns.forEach(btn => {
        btn.textContent = btn.dataset.oldText || "Place Order";
        btn.disabled = false;
      });
    }
  } catch (err) {
    console.error(err);
    showAlert("Connection Error", "Could not connect to server.", "error");
    // Reset UI
    btns.forEach(btn => {
      btn.textContent = btn.dataset.oldText || "Place Order";
      btn.disabled = false;
    });
  }
}

// Load Mappls SDK dynamically (REQUIRED)
async function loadMapplsSDK() {
  // Check if SDK is already loaded
  if (typeof mappls !== 'undefined' && mappls.Map) {
    console.log('Mappls SDK already loaded');
    return Promise.resolve();
  }

  try {
    const res = await window.ImpromptuIndianApi.fetch('/api/config', { 
      credentials: 'include' 
    });
    
    if (!res.ok) {
      throw new Error('Failed to load config');
    }

    const config = await res.json();
    const apiKey = config?.mappls?.apiKey;

    if (!apiKey) {
      throw new Error('Mappls API key missing');
    }

    // CSS
    const css = document.getElementById('mappls-css');
    if (css) {
      css.href = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk.css`;
    }

    // JS
    const script = document.getElementById('mappls-script');
    if (!script) {
      throw new Error('Mappls script element not found');
    }

    // If script is already loading or loaded, wait for it
    if (script.src && script.src !== '') {
      return new Promise((resolve, reject) => {
        if (typeof mappls !== 'undefined' && mappls.Map) {
          resolve();
        } else {
          script.onload = () => {
            console.log('Mappls SDK loaded');
            resolve();
          };
          script.onerror = () => reject(new Error('Mappls SDK failed to load'));
        }
      });
    }

    // Set script source and load
    script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk.js`;
    script.defer = true;

    return new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('Mappls SDK loaded');
        resolve();
      };
      script.onerror = () => reject(new Error('Mappls SDK failed to load'));
    });
  } catch (err) {
    console.error('Mappls SDK load error:', err);
    throw err;
  }
}

/* ---------------------------
   MAIN INITIALIZATION
---------------------------*/
function initNewOrderPage() {
  lucide.createIcons();

  // Initialize all page components
  initDropdowns();
  initCalendar();
  initQuantities();
  initAddress();
  // Note: Location functionality is handled inline in initAddress() via useCurrentLocationBtn
  initFileUpload();
  initPlaceOrder();

  // Initialize cart badge
  try {
    updateCartBadge();
  } catch (e) {
    console.warn("Cart badge update failed:", e);
  }

  // Note: Mappls SDK will be loaded on-demand when map modal opens
  // This prevents loading SDK on every page load
}

// Initialize when DOM is ready (defer ensures DOM is ready, but this is extra safety)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewOrderPage);
} else {
  // DOM already ready
  initNewOrderPage();
}