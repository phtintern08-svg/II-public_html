lucide.createIcons();

const ImpromptuIndianApi = window.ImpromptuIndianApi || (() => {
  const rawBase =
    window.IMPROMPTU_INDIAN_API_BASE ||
    window.APP_API_BASE ||
    localStorage.getItem('IMPROMPTU_INDIAN_API_BASE') ||
    '';

  let base = rawBase.trim().replace(/\/$/, '');
  if (!base) {
    const origin = window.location.origin;
    if (origin && origin.startsWith('http')) {
      base = origin.replace(/\/$/, '');
    } else {
      // Use relative paths - no absolute URLs
      base = '';
    }
  }

  const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

  return {
    baseUrl: base,
    buildUrl,
    fetch: (path, options = {}) => fetch(buildUrl(path), options),
  };
})();
window.ImpromptuIndianApi = ImpromptuIndianApi;

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

document.addEventListener("click", (e) => {
  if (!e.target.closest(".custom-select")) closeAllPanels();
});

/* ---------------------------
   Custom dropdowns
---------------------------*/
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
        e.stopPropagation();
        if (native) native.value = opt.value || opt.text;
        if (display) display.textContent = opt.text || opt.value;

        panel.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
        optEl.classList.add("selected");
        panel.classList.add("hidden");

        if (wrapper.dataset.name === "product-type") {
          renderCategories(opt.text);
          renderFabrics(opt.text);
        }

        // Trigger estimate check when any relevant dropdown changes
        if (['product-type', 'fabric-type', 'sample-size'].includes(wrapper.dataset.name)) {
          checkEstimate();
        }

        // Trigger MODAL estimate check
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
    e.stopPropagation();
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

  const resp = await ImpromptuIndianApi.fetch("/api/estimate-price", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await resp.json();
  return (resp.ok && data.estimated_price > 0) ? data.estimated_price : 0;
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
const calendar = document.getElementById("calendar");
const dateBtn = document.getElementById("dateBtn");
const dateText = document.getElementById("dateText");
const daysGrid = document.getElementById("daysGrid");
const monthLabel = document.getElementById("monthLabel");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

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

/* ---------------------------
   Quantity Inputs
---------------------------*/
const qtyInputs = Array.from(document.querySelectorAll(".qty-input"));
const totalQuantityEl = document.getElementById("totalQuantity");
const sizeSumEl = document.getElementById("sizeSum");

function computeSizeSum() {
  return qtyInputs.reduce((sum, inp) => sum + (parseInt(inp.value) || 0), 0);
}

function updateTotals() {
  const sum = computeSizeSum();
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
/* ------------------------------------------------
   ADDRESS MANAGEMENT (Home / Work / Other)
--------------------------------------------------*/
let currentAddressType = "home";
let addressesData = {};

const btnHome = document.getElementById("btnHome");
const btnWork = document.getElementById("btnWork");
const btnOther = document.getElementById("btnOther");
const saveAddressBtn = document.getElementById("saveAddressBtn");

btnHome.addEventListener("click", () => switchAddressType("home"));
btnWork.addEventListener("click", () => switchAddressType("work"));
btnOther.addEventListener("click", () => switchAddressType("other"));

/* ---------------------------
   Switch between address types
---------------------------*/
function switchAddressType(type) {
  currentAddressType = type;

  [btnHome, btnWork, btnOther].forEach((b) => b.classList.remove("active"));
  if (type === "home") btnHome.classList.add("active");
  if (type === "work") btnWork.classList.add("active");
  if (type === "other") btnOther.classList.add("active");

  loadAddressForType(type);
}

/* ---------------------------
   Load address from backend
---------------------------*/
async function loadAddressForType(type) {
  const userId = localStorage.getItem("user_id");
  if (!userId) return clearAddressForm();

  // If already cached
  if (addressesData[type]) {
    fillAddressForm(addressesData[type]);
    toggleAddressFields(false);
    toggleSaveButton(false);
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const resp = await ImpromptuIndianApi.fetch(`/api/customer/addresses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (resp.ok) {
      const data = await resp.json();
      const addresses = data.addresses || data;
      const address = addresses.find(a => a.address_type === type);

      // If backend returns null (200 OK), treat as "Not Found" essentially
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
        clearAddressForm();
        toggleAddressFields(true);
        toggleSaveButton(true);
      }
    } else {
      clearAddressForm();
      toggleAddressFields(true);
      toggleSaveButton(true);
    }
  } catch (err) {
    console.error("Error loading address:", err);
    clearAddressForm();
    toggleAddressFields(true);
    toggleSaveButton(true);
  }
}

/* ---------------------------
   Enable / Disable form fields
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
   Show/Hide Save Button
---------------------------*/
function toggleSaveButton(show) {
  if (show) {
    saveAddressBtn.classList.remove("hidden");
    saveAddressBtn.textContent =
      "Save " + currentAddressType.charAt(0).toUpperCase() + currentAddressType.slice(1) + " Address";
  } else {
    saveAddressBtn.classList.add("hidden");
  }
}

/* ---------------------------
   Fill the form with backend data
---------------------------*/
function fillAddressForm(addr) {
  document.getElementById("fldHouse").value = addr.house || addr.address_line1?.split(" ")[0] || "";
  document.getElementById("fldArea").value = addr.area || addr.address_line1?.split(" ").slice(1).join(" ") || "";
  document.getElementById("fldLandmark").value = addr.landmark || "";
  document.getElementById("fldCity").value = addr.city || "";
  document.getElementById("fldState").value = addr.state || "";
  document.getElementById("fldCountry").value = addr.country || "";
  document.getElementById("fldPincode").value = addr.pincode || "";
  document.getElementById("fldPhone").value = addr.alternative_phone || "";
}

/* ---------------------------
   Clear input form
---------------------------*/
function clearAddressForm() {
  ["fldHouse", "fldArea", "fldLandmark", "fldCity", "fldState", "fldCountry", "fldPincode", "fldPhone"]
    .forEach(id => document.getElementById(id).value = "");
}

/* ---------------------------
   Save address (POST or PUT)
---------------------------*/
async function saveAddress() {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

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
    customer_id: parseInt(userId),
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
    const token = localStorage.getItem('token');
    let response;
    let existing = addressesData[currentAddressType];

    if (existing && existing.id) {
      response = await ImpromptuIndianApi.fetch(`/api/customer/addresses/${existing.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
    } else {
      response = await ImpromptuIndianApi.fetch("/api/customer/addresses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
    }

    const result = await response.json();

    if (response.ok) {
      addressesData[currentAddressType] = result;
      toggleAddressFields(false);
      toggleSaveButton(false);
      showAlert("Success", "Address saved successfully!", "success");
    } else {
      showAlert("Error", result.error || "Failed to save address", "error");
    }
  } catch (e) {
    console.error("Save address error", e);
    showAlert("Connection Error", "Unable to reach server", "error");
  }
}

saveAddressBtn.addEventListener("click", saveAddress);

/* ---------------------------
   Load ALL addresses at start
---------------------------*/
async function loadAllAddresses() {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  try {
    const token = localStorage.getItem('token');
    const resp = await ImpromptuIndianApi.fetch(`/api/customer/addresses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (resp.ok) {
      const data = await resp.json();
      const list = data.addresses || data;
      list.forEach((addr) => {
        addressesData[addr.address_type] = addr;
      });
    }
  } catch (e) {
    console.error("Failed to load addresses", e);
  }
}

loadAllAddresses();
switchAddressType("home");
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

          // Initialize map (wait for modal to be visible)
          setTimeout(() => {
            if (typeof mappls === 'undefined' || !mappls.Map) {
              console.error("Mappls SDK not loaded. Check your API Key in new-order.html");
              showAlert("Configuration Error", "Map service is not loaded correcty. Please contact support.", "error");
              useCurrentLocationBtn.innerHTML = btnHTML;
              useCurrentLocationBtn.disabled = false;
              return;
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

              // Force redraw
              setTimeout(() => { map.invalidateSize?.(); setTimeout(() => map.invalidateSize?.(), 100); }, 200);

            } else {
              map.setCenter([lat, lng]);
              marker.setPosition({ lat: lat, lng: lng });
              map.setZoom(zoomLevel);

              // Force redraw
              setTimeout(() => { map.invalidateSize?.(); setTimeout(() => map.invalidateSize?.(), 100); }, 200);
            }
          }, 300);

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

          setTimeout(() => {
            if (typeof mappls === 'undefined' || !mappls.Map) {
              console.error("Mappls SDK not loaded.");
              return;
            }

            if (!map) {
              map = new mappls.Map("mapContainer", { center: [lat, lng], zoom: 12 });
              marker = new mappls.Marker({ map: map, position: { lat: lat, lng: lng }, draggable: true });

              setTimeout(() => { map.invalidateSize?.(); setTimeout(() => map.invalidateSize?.(), 100); }, 200);
            } else {
              map.setCenter([lat, lng]);
              marker.setPosition({ lat: lat, lng: lng });
              map.setZoom(12);
              setTimeout(() => { map.invalidateSize?.(); setTimeout(() => map.invalidateSize?.(), 100); }, 200);
            }
          }, 300);

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
const fileInput = document.getElementById("file");
const fileLabel = document.getElementById("fileLabel");
const viewModelBtn = document.getElementById("viewModelBtn");

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
let isSamplePaid = false;
let currentTransactionId = null;

// Card Number Formatting
document.getElementById("cardNumber").addEventListener("input", (e) => {
  let val = e.target.value.replace(/\D/g, '');
  val = val.replace(/(.{4})/g, '$1 ').trim();
  e.target.value = val;
});

// Expiry Date Formatting
document.getElementById("cardExpiry").addEventListener("input", (e) => {
  let val = e.target.value.replace(/\D/g, '');
  if (val.length >= 2) {
    val = val.substring(0, 2) + '/' + val.substring(2, 4);
  }
  e.target.value = val;
});

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

attachCardListeners();


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

async function checkModalEstimate() {
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
document.getElementById("placeOrderBtn").addEventListener("click", async () => {

  /* 1. QUANTITY VALIDATION */
  const sum = computeSizeSum();
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

  /* 3. AUTH CHECK */
  const userId = localStorage.getItem("user_id");
  if (!userId) {
    showAlert("Authentication Error", "You must be logged in to place an order.", "error");
    return;
  }

  /* 4. PRODUCT DETAILS */
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
          if (typeof checkModalEstimate === 'function') checkModalEstimate();
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
    customer_id: Number(userId),
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
});

async function submitOrder(payload) {
  const btn = document.getElementById("placeOrderBtn");
  const oldText = btn.textContent;
  btn.textContent = "Placing Order...";
  btn.disabled = true;

  try {
    const token = localStorage.getItem('token');
    const res = await ImpromptuIndianApi.fetch("/api/orders/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
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
      btn.textContent = oldText;
      btn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    showAlert("Connection Error", "Could not connect to server.", "error");
    btn.textContent = oldText;
    btn.disabled = false;
  }
}

// Load Mappls API key from backend and inject into SDK URLs
async function loadMapplsConfig() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found. Map features may not work.');
      return;
    }
    
    const response = await fetch('/api/config', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const config = await response.json();
      const apiKey = config.mapplsApiKey || '';
      
      if (apiKey) {
        // Update CSS link
        const cssLink = document.getElementById('mappls-css');
        if (cssLink) {
          cssLink.href = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk_plugins/v3.0/mappls.css`;
        }
        
        // Load script
        const script = document.getElementById('mappls-script');
        if (script) {
          script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?v=3.0&layer=vector&libraries=services`;
          script.onload = () => console.log('Mappls SDK loaded');
          script.onerror = () => console.error('Mappls SDK failed to load');
        }
      } else {
        console.warn('Mappls API key not configured');
      }
    }
  } catch (error) {
    console.error('Failed to load map configuration:', error);
  }
}

// Initialize Mappls config on page load
document.addEventListener('DOMContentLoaded', () => {
  loadMapplsConfig();
});