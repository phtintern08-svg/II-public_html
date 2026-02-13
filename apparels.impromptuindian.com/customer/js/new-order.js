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
  // 🔥 CRITICAL: Prevent duplicate event listeners (guard against multiple calls)
  if (window.__dropdownsInitialized) {
    return;  // Already initialized, skip
  }
  window.__dropdownsInitialized = true;
  
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

            // 🔥 CRITICAL: Reset ALL dependent selections when product changes
            // This prevents sending wrong category/neck/fabric (e.g., Regular Fit for Hoodie when it should be Pullover Hoodie)
            
            // Reset state variables
            selectedCategory = "";
            selectedNeckType = "";
            
            // Reset fabric selection
            const fabricWrapper = document.querySelector('.custom-select[data-name="fabric-type"]');
            if (fabricWrapper) {
              const fabricSelect = fabricWrapper.querySelector('select');
              const fabricDisplay = fabricWrapper.querySelector('.value');
              if (fabricSelect) {
                fabricSelect.value = "";
                if (fabricDisplay) fabricDisplay.textContent = "Select a fabric";
              }
              // Clear any selected option in custom UI
              fabricWrapper.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
            }
            
            // Clear category and neck type UI
            const categoryContainer = document.getElementById("categoryContainer");
            if (categoryContainer) categoryContainer.innerHTML = "";
            const neckContainer = document.getElementById("neckContainer");
            if (neckContainer) neckContainer.innerHTML = "";

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
            clearEstimateUI(); // Clear UI immediately before fetching new estimate
            checkEstimate();
          }

          // Modal sample size is now locked - no change listener needed
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
  "Hoodie": ["Fleece"],  // Only Fleece exists in DB for Hoodie
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
   Request Guard - Prevent Stale Responses
---------------------------*/
let currentEstimateRequestId = 0;
let currentModalEstimateRequestId = 0;
let currentGatewayEstimateRequestId = 0;

/* ---------------------------
   Order State - Source of Truth (Not DOM)
---------------------------*/
let currentOrderState = {
  size: null,
  sampleCost: null,
  productType: null,
  category: null,
  neckType: null,
  fabric: null,
  pricePerPiece: null,
  quantity: null,
  estimateFound: false  // Flag indicating if estimate is from exact match
};

/* ---------------------------
   Reset Order State - Clear All Stale Data
---------------------------*/
function resetOrderState() {
  // Reset selection variables
  selectedCategory = "";
  selectedNeckType = "";

  // Reset request IDs to prevent stale responses
  currentEstimateRequestId = 0;
  currentModalEstimateRequestId = 0;
  currentGatewayEstimateRequestId = 0;

  // Reset payment state
  isSamplePaid = false;
  currentTransactionId = null;
  window.paymentDetails = null;

  // Reset order state
  currentOrderState = {
    size: null,
    sampleCost: null,
    productType: null,
    category: null,
    neckType: null,
    fabric: null,
    pricePerPiece: null,
    quantity: null,
    estimateFound: false
  };

  // Clear payment-related localStorage
  localStorage.removeItem("sample_paid");

  // Reset payment modal dataset
  const paymentModal = document.getElementById("paymentModal");
  if (paymentModal) {
    paymentModal.dataset.currentCost = "0";
  }

  // Clear all estimate UI displays
  clearEstimateUI();

  console.log("Order state reset - all stale data cleared");
}

/* ---------------------------
   Clear UI Immediately on Selection Change
---------------------------*/
function clearEstimateUI() {
  const displayEl = document.getElementById("estimatedPriceDisplay");
  const sampleCostDisplay = document.getElementById("sampleCostDisplay");
  const sampleCostInput = document.getElementById("sampleCostInput");
  const samplePaymentCard = document.getElementById("samplePaymentCard");
  const containerEl = document.getElementById("estimatedCostContainer");
  const gatewaySample = document.getElementById("gatewaySampleCost");
  const gatewayTotal = document.getElementById("gatewayTotalPayable");
  const gatewayEstTotal = document.getElementById("gatewayEstTotalCost");
  const modalCostDisplay = document.getElementById("modalCostDisplay");
  const modalPayBtn = document.getElementById("modalPayBtn");

  // Clear main estimate
  if (displayEl) displayEl.textContent = "--";
  if (sampleCostDisplay) sampleCostDisplay.textContent = "--";
  if (sampleCostInput) sampleCostInput.value = "";
  if (samplePaymentCard) samplePaymentCard.classList.add("hidden");
  if (containerEl) {
    containerEl.classList.add("border-gray-700");
    containerEl.classList.remove("border-[#FFCC00]");
  }

  // Clear gateway estimate
  if (gatewaySample) gatewaySample.textContent = "--";
  if (gatewayTotal) gatewayTotal.textContent = "--";
  if (gatewayEstTotal) gatewayEstTotal.textContent = "--";
  document.querySelectorAll('.pay-amount-display').forEach(el => el.textContent = '--');
  if (document.getElementById("paymentModal")) {
    document.getElementById("paymentModal").dataset.currentCost = "0";
  }

  // Clear modal estimate
  if (modalCostDisplay) modalCostDisplay.textContent = "--";
  if (modalPayBtn) modalPayBtn.dataset.cost = "0";

  // Disable modal pay button (Place Order button validation is handled in handlePlaceOrder)
  if (modalPayBtn) modalPayBtn.disabled = true;
  const payButtons = document.querySelectorAll('[id*="pay"], [id*="Pay"], .pay-button');
  payButtons.forEach(btn => {
    if (btn) btn.disabled = true;
  });
}

/* ---------------------------
   Check Price Estimate (MAIN & MODAL)
---------------------------*/
async function checkEstimate() {
  const requestId = ++currentEstimateRequestId;
  
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

  // Clear UI immediately
  if (displayEl) {
    if (!productType || !selectedCategory || !selectedNeckType || !fabric || !sampleSize) {
      displayEl.textContent = "--";
    } else {
      displayEl.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-[#FFCC00]"></i>';
    }
  }

  // 🔥 CRITICAL: Validate ALL required fields (neckType and fabric are required for exact matching)
  if (!productType || !selectedCategory || !selectedNeckType || !fabric || !sampleSize) {
    if (samplePaymentCard) samplePaymentCard.classList.add("hidden");
    // Clear state if required fields missing
    currentOrderState.productType = null;
    currentOrderState.category = null;
    currentOrderState.neckType = null;
    currentOrderState.fabric = null;
    currentOrderState.size = null;
    currentOrderState.sampleCost = null;
    return;
  }

  // 🔥 CRITICAL: Update selection state IMMEDIATELY (before estimate call)
  // This ensures state is always valid even if estimate fails
  currentOrderState.productType = productType;
  currentOrderState.category = selectedCategory;
  currentOrderState.neckType = selectedNeckType;
  currentOrderState.fabric = fabric;
  currentOrderState.size = sampleSize;
  
  console.log("💾 Order state updated (before estimate):", {
    productType: currentOrderState.productType,
    category: currentOrderState.category,
    neckType: currentOrderState.neckType,
    fabric: currentOrderState.fabric,
    size: currentOrderState.size
  });

  lucide.createIcons();

  try {
    const estimateResult = await fetchEstimate(productType, selectedCategory, selectedNeckType, fabric, sampleSize);

    // Ignore stale responses
    if (requestId !== currentEstimateRequestId) {
      console.log("Ignoring stale estimate response (requestId:", requestId, "current:", currentEstimateRequestId, ")");
      return;
    }

    const cost = estimateResult.price || 0;
    const found = estimateResult.found === true;

    // Only sampleCost depends on estimate result
    if (cost > 0) {
      // Show price in UI (for informational purposes)
      if (displayEl) displayEl.textContent = `₹${cost}`;

      // Update sidebar
      if (sampleCostDisplay) sampleCostDisplay.textContent = `₹${cost}`;
      if (sampleCostInput) sampleCostInput.value = cost;
      if (samplePaymentCard) samplePaymentCard.classList.remove("hidden");

      if (containerEl) {
        containerEl.classList.remove("border-gray-700");
        containerEl.classList.add("border-[#FFCC00]");
      }
      
      // 🔥 CRITICAL: Only allow payment if exact match found (financially safe)
      if (found) {
        // Exact match found - allow payment
        currentOrderState.sampleCost = cost;
        currentOrderState.estimateFound = true;
        console.log("✅ Exact match found - payment allowed:", currentOrderState);
      } else {
        // Relaxed estimate - show price but prevent payment
        console.warn("⚠️ Estimate is based on relaxed matching (not exact match) - payment blocked");
        if (displayEl) {
          displayEl.title = "⚠️ Estimate based on similar products. Exact match not found - payment not available.";
        }
        // Clear sampleCost to prevent payment
        currentOrderState.sampleCost = null;
        currentOrderState.estimateFound = false;
      }
      
      console.log("💾 Order state updated (after estimate):", currentOrderState);
    } else {
      // Estimate failed - clear only sampleCost, keep selection state
      currentOrderState.sampleCost = null;
      currentOrderState.estimateFound = false;
      
      if (displayEl) displayEl.textContent = "N/A";
      if (samplePaymentCard) samplePaymentCard.classList.add("hidden");
      if (containerEl) {
        containerEl.classList.add("border-gray-700");
        containerEl.classList.remove("border-[#FFCC00]");
      }
      
      console.warn("⚠️ Estimate returned 0 - sampleCost cleared, selection state preserved:", currentOrderState);
    }
  } catch (error) {
    // Ignore errors from stale requests
    if (requestId !== currentEstimateRequestId) {
      console.log("Ignoring error from stale estimate request");
      return;
    }
    console.error("Error fetching estimate:", error);
    if (displayEl) displayEl.textContent = "Error";
  }
}

// checkModalEstimate() removed - modal size is now locked, price is computed before modal opens

// Helper to fetch estimate
async function fetchEstimate(product, category, neck, fabric, size) {
  // Normalize values to match backend expectations:
  // - Text fields: lowercase
  // - Size: uppercase
  // - neck_type: "none" (lowercase) if empty
  // - fabric: only include if actually selected (not empty/null/"None")
  const payload = {
    product_type: product ? product.trim().toLowerCase() : null,
    category: category ? category.trim().toLowerCase() : null,
    neck_type: neck && neck.trim() ? neck.trim().toLowerCase() : "none",  // lowercase "none" to match backend
    size: size ? size.trim().toUpperCase() : null  // uppercase for size
  };
  
  // Fabric is now required - always include it (validation ensures it's not empty)
  if (fabric && fabric.trim()) {
    payload.fabric = fabric.trim().toLowerCase();
  }

  // Debug logging
  console.log("Estimate Payload:", payload);

  try {
    const resp = await window.ImpromptuIndianApi.fetch("/api/estimate-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("Estimate Response Status:", resp.status);
    
    if (!resp.ok) {
      const text = await resp.text();
      console.error("Estimate API Error Response:", text);
      return { price: 0, found: false };  // Always return consistent structure
    }

    const data = await resp.json().catch(() => null);
    console.log("Estimate Response Data:", data);
    
    if (data && typeof data.estimated_price === "number") {
      // Return object with price and found flag
      return {
        price: data.estimated_price,
        found: data.found === true  // Only true if exact match found
      };
    }
    
    console.warn("No valid price in response:", data);
    return { price: 0, found: false };
  } catch (error) {
    console.error("Estimate API error:", error);
    return { price: 0, found: false };  // Always return consistent structure
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

  clearEstimateUI(); // Clear UI immediately before fetching new estimate
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
  clearEstimateUI(); // Clear UI immediately before fetching new estimate
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
// Namespace address state to prevent global variable collisions
window.AddressState = window.AddressState || {
  currentType: "home",
  data: {}
};

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
      "Save " + AddressState.currentType.charAt(0).toUpperCase() + AddressState.currentType.slice(1) + " Address";
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
   Phone Number Validation
---------------------------*/
function validatePhoneNumber(phone) {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check length (Indian phone numbers: 10 digits)
  if (cleaned.length !== 10) {
    return { valid: false, error: "Phone number must be exactly 10 digits" };
  }
  
  // Check format (should start with 6-9 for Indian mobile numbers)
  if (!/^[6-9]/.test(cleaned)) {
    return { valid: false, error: "Phone number must start with 6, 7, 8, or 9" };
  }
  
  return { valid: true, cleaned };
}

function checkDuplicatePhone(phone) {
  // Get registered phone from localStorage
  const customerProfile = localStorage.getItem('customer_profile');
  let registeredPhone = null;
  
  if (customerProfile) {
    try {
      const profile = JSON.parse(customerProfile);
      registeredPhone = profile.phone || localStorage.getItem('phone');
    } catch (e) {
      console.warn("Failed to parse customer profile", e);
    }
  }
  
  // Also check localStorage directly as fallback
  if (!registeredPhone) {
    registeredPhone = localStorage.getItem('phone');
  }
  
  if (registeredPhone) {
    // Remove all non-digits and handle country codes
    // Indian numbers: +91XXXXXXXXXX or XXXXXXXXXX (10 digits)
    let registeredCleaned = registeredPhone.replace(/\D/g, '');
    let inputCleaned = phone.replace(/\D/g, '');
    
    // If registered phone has country code (+91), remove it (keep last 10 digits)
    if (registeredCleaned.length > 10) {
      registeredCleaned = registeredCleaned.slice(-10);
    }
    
    // If input phone has country code (+91), remove it (keep last 10 digits)
    if (inputCleaned.length > 10) {
      inputCleaned = inputCleaned.slice(-10);
    }
    
    // Compare the last 10 digits
    if (registeredCleaned === inputCleaned && registeredCleaned.length === 10) {
      return { 
        isDuplicate: true, 
        message: "Phone number already exists. Please add a different number. This number is already registered as your primary phone number." 
      };
    }
  }
  
  return { isDuplicate: false };
}

/* ---------------------------
   Address Type Selection Dialog
---------------------------*/
async function selectAddressType(addressData) {
  return new Promise((resolve) => {
    // Check which address types are already filled
    const hasHome = !!AddressState.data.home;
    const hasWork = !!AddressState.data.work;
    const hasOther = !!AddressState.data.other;
    
    // Count how many "other" addresses exist
    const otherAddresses = Object.keys(AddressState.data).filter(key => 
      key.startsWith('other') && AddressState.data[key]
    );
    const otherCount = otherAddresses.length;
    
    // If all three basic types are filled, offer other1, other2, etc.
    if (hasHome && hasWork && hasOther) {
      const nextOtherNum = otherCount + 1;
      const options = [
        { value: `other${nextOtherNum}`, label: `Other ${nextOtherNum}` }
      ];
      
      // Show custom dialog
      const userChoice = confirm(
        `All primary address types (Home, Work, Other) are filled.\n\n` +
        `Would you like to save this as "Other ${nextOtherNum}"?\n\n` +
        `Click OK to save as "Other ${nextOtherNum}" or Cancel to choose a different type.`
      );
      
      if (userChoice) {
        resolve(`other${nextOtherNum}`);
      } else {
        // Let user manually select
        resolve(null);
      }
      return;
    }
    
    // If home exists, ask where to add
    if (hasHome && (!hasWork || !hasOther)) {
      const options = [];
      if (!hasWork) options.push('work');
      if (!hasOther) options.push('other');
      
      if (options.length === 1) {
        // Only one option, auto-select
        resolve(options[0]);
        return;
      }
      
      // Multiple options, show dialog
      const choice = confirm(
        `You already have a Home address.\n\n` +
        `Where would you like to add this address?\n\n` +
        `Click OK for Work, Cancel for Other`
      );
      
      resolve(choice ? 'work' : 'other');
      return;
    }
    
    // Default: auto-select first empty slot
    if (!hasHome) resolve('home');
    else if (!hasWork) resolve('work');
    else if (!hasOther) resolve('other');
    else resolve('other1');
  });
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
  
  // Validate phone number if provided
  if (phone) {
    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.valid) {
      showAlert("Invalid Phone Number", phoneValidation.error, "error");
      return;
    }
    
    // Check for duplicate with registered phone
    const duplicateCheck = checkDuplicatePhone(phone);
    if (duplicateCheck.isDuplicate) {
      showAlert("Phone Number Already Exists", duplicateCheck.message, "error");
      document.getElementById("fldPhone").value = ""; // Clear the field
      document.getElementById("fldPhone").focus();
      return; // Prevent saving
    }
  }

  if (!house || !area || !city || !state || !pincode) {
    showAlert("Missing Fields", "Please fill in all required fields.", "error");
    return;
  }

  const payload = {
    address_type: AddressState.currentType,
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
    let existing = AddressState.data[AddressState.currentType];

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
      AddressState.data[AddressState.currentType] = result;
      
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
    AddressState.data = {};
    clearAddressForm();
    toggleAddressFields(true);
    toggleSaveButton(true);
    return;
  }

  // If already cached
  if (AddressState.data[type]) {
    fillAddressForm(AddressState.data[type]);
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
        AddressState.data[type] = address;
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
  AddressState.currentType = type;

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
  
  // Add phone number validation on input
  const phoneInput = document.getElementById("fldPhone");
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      const value = e.target.value;
      // Allow only digits and common formatting characters
      const cleaned = value.replace(/[^\d\s\-\(\)]/g, '');
      if (cleaned !== value) {
        e.target.value = cleaned;
      }
    });
    
    phoneInput.addEventListener("blur", (e) => {
      const phone = e.target.value.trim();
      if (phone) {
        const validation = validatePhoneNumber(phone);
        if (!validation.valid) {
          showAlert("Invalid Phone Number", validation.error, "error");
          e.target.focus();
          return;
        }
        
        const duplicateCheck = checkDuplicatePhone(phone);
        if (duplicateCheck.isDuplicate) {
          showAlert("Phone Number Already Exists", duplicateCheck.message, "error");
          e.target.value = ""; // Clear the field
          e.target.focus();
        }
      }
    });
  }

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
        switchAddressType(AddressState.currentType);
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
            AddressState.data[addr.address_type] = addr;
          }
        });
      }
      // If list is empty, AddressState.data remains empty - this is fine, user can add addresses
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
let mapplsLoadingPromise = null;

// Load Mappls SDK dynamically (DEFINED BEFORE USE to avoid order dependency issues)
// CRITICAL: Creates script dynamically instead of reusing existing tag (browser edge case fix)
async function loadMapplsSDK() {
  if (window.mappls && window.mappls.Map) {
    console.log("Mappls SDK already loaded");
    return;
  }

  if (mapplsLoadingPromise) return mapplsLoadingPromise;

  mapplsLoadingPromise = (async () => {
    try {
      const res = await window.ImpromptuIndianApi.fetch("/api/config", {
        credentials: "include"
      });

      if (!res.ok) throw new Error("Failed to load config");

      const config = await res.json();
      const apiKey = config?.mappls?.apiKey;
      if (!apiKey) throw new Error("Mappls API key missing");

      // ✅ CSS - Element must exist in HTML
      // CRITICAL: URL must include /api/ segment: /advancedmaps/api/${apiKey}/map_sdk.css
      const css = document.getElementById("mappls-css");
      if (!css) {
        throw new Error('Mappls CSS element (id="mappls-css") not found in HTML. Add <link id="mappls-css" rel="stylesheet" /> to <head>');
      }
      css.href = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk.css`;

      // ✅ JS - CREATE SCRIPT DYNAMICALLY (DO NOT REUSE EXISTING TAG)
      // CRITICAL: JavaScript SDK URL must include mandatory query parameters for initialization
      // Without layer=vector&v=3.0, SDK loads but window.mappls remains undefined
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0`;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error("Mappls SDK failed to load (404 – invalid URL or key not whitelisted)"));
        document.head.appendChild(script);
      });

      if (!window.mappls) {
        throw new Error("Mappls loaded but mappls is undefined");
      }

      // Validate that required plugins are loaded
      if (!window.mappls.Map) {
        throw new Error("Mappls Map plugin not loaded");
      }

      // Note: Search plugins can be added later if needed via ?plugins=search,autosuggest
      // For now, we load base SDK first to ensure it works
      console.log("✅ Mappls SDK loaded successfully");
    } catch (err) {
      console.error('Mappls SDK load error:', err);
      mapplsLoadingPromise = null; // Reset on error so it can be retried
      throw err;
    }
  })();

  return mapplsLoadingPromise;
}

// Bind map search event listeners once (outside click handler to prevent reassignment)
const mapSearchBtn = document.getElementById("mapSearchBtn");
const mapSearchInput = document.getElementById("mapSearchInput");

if (mapSearchBtn && !mapSearchBtn.dataset.bound) {
  mapSearchBtn.dataset.bound = "1";
  const performMapSearch = () => {
    const query = mapSearchInput ? mapSearchInput.value.trim() : "";
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
      // Check if search plugin is available before using it
      if (typeof mappls.search !== 'function') {
        throw new Error("Mappls search plugin not loaded. Please refresh the page.");
      }

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

          if (!isNaN(newLat) && !isNaN(newLng) && map && marker) {
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
          // Check if autosuggest plugin is available
          if (typeof mappls.autoSuggest === 'function') {
            new mappls.autoSuggest({ query: query }, (autoData) => {
            if (autoData && autoData.length > 0) {
              const autoRes = autoData[0];
              const aLat = parseFloat(autoRes.latitude || autoRes.lat);
              const aLng = parseFloat(autoRes.longitude || autoRes.lng);
              if (!isNaN(aLat) && map && marker) {
                map.setCenter([aLat, aLng]);
                marker.setPosition({ lat: aLat, lng: aLng });
                map.setZoom(17);
                return;
              }
            }
            showAlert("Not Found", "Location not found. Try a broader area name.", "info");
            });
          } else {
            showAlert("Not Found", "Location not found. Try a broader area name.", "info");
          }
        }
      });
    } catch (e) {
      console.error("SDK Search Error", e);
      mapSearchBtn.innerText = oldText;
      mapSearchBtn.disabled = false;
      showAlert("Error", "Search service is unavailable.", "error");
    }
  };
  
  mapSearchBtn.onclick = performMapSearch;
  if (mapSearchInput) {
    mapSearchInput.onkeypress = (e) => {
      if (e.key === 'Enter') performMapSearch();
    };
  }
}

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
          mapModal.classList.remove("map-hidden");
          mapModal.classList.add("map-visible");

          // Initialize map AFTER modal is visible (use requestAnimationFrame for proper rendering)
          requestAnimationFrame(async () => {
            try {
              // Load SDK if not already loaded
              await loadMapplsSDK();

              if (typeof mappls === 'undefined' || !mappls.Map) {
                throw new Error("Mappls SDK not loaded");
              }

              // CRITICAL: Set container height before map creation (Mappls needs non-zero dimensions)
              const container = document.getElementById("mapContainer");
              if (container) {
                container.style.height = "100%";
                container.style.minHeight = "420px";
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

                // Force resize to handle modal animation timing
                setTimeout(() => {
                  if (map && map.resize) map.resize();
                }, 300);

                setTimeout(() => {
                  if (map && map.resize) map.resize();
                }, 800);

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
          mapModal.classList.remove("map-hidden");
          mapModal.classList.add("map-visible");

          // Initialize map AFTER modal is visible (use requestAnimationFrame for proper rendering)
          requestAnimationFrame(async () => {
            try {
              // Load SDK if not already loaded
              await loadMapplsSDK();

              if (typeof mappls === 'undefined' || !mappls.Map) {
                throw new Error("Mappls SDK not loaded");
              }

              // CRITICAL: Set container height before map creation (Mappls needs non-zero dimensions)
              const container = document.getElementById("mapContainer");
              if (container) {
                container.style.height = "100%";
                container.style.minHeight = "420px";
              }

              if (!map) {
                map = new mappls.Map("mapContainer", { center: [lat, lng], zoom: 12 });
                marker = new mappls.Marker({ map: map, position: { lat: lat, lng: lng }, draggable: true });
                console.log('Map initialized correctly');

                // Force resize to handle modal animation timing
                setTimeout(() => {
                  if (map && map.resize) map.resize();
                }, 300);

                setTimeout(() => {
                  if (map && map.resize) map.resize();
                }, 800);
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
      const confirmBtn = document.getElementById("confirmLocationBtn");
      if (confirmBtn && !confirmBtn.dataset.bound) {
        confirmBtn.dataset.bound = "1";
        confirmBtn.addEventListener("click", async () => {
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
          if (typeof LocationService === "undefined") {
            throw new Error("LocationService not available");
          }
          const locService = new LocationService();
          const addressData = await locService.reverseGeocodeMappls(lat, lng);

          // Determine target address type with user selection
          let targetType = await selectAddressType(addressData);
          
          // If user cancelled selection, don't proceed
          if (!targetType) {
            showAlert("Info", "Address type selection cancelled. Please select an address type manually.", "info");
            btn.innerHTML = oldHTML;
            btn.disabled = false;
            lucide.createIcons();
            return;
          }

          // Prepare address object for the form (Draft mode, not saved to backend) //
          const newAddress = {
            id: (AddressState.data[targetType] && AddressState.data[targetType].id) ? AddressState.data[targetType].id : null,
            address_type: targetType,
            house: "",
            area: addressData.area || addressData.street || "",
            landmark: "",
            city: addressData.city || addressData.district || "",
            state: addressData.state || "",
            country: addressData.country || "India",
            pincode: addressData.pincode || "",
            alternative_phone: (AddressState.data[targetType] && AddressState.data[targetType].alternative_phone) || ""
          };

          // Update local state
          AddressState.data[targetType] = newAddress;

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

          // CRITICAL: mapModal must be defined in this scope
          const mapModal = document.getElementById("mapModal");
          if (mapModal) {
            mapModal.classList.remove("map-visible");
            mapModal.classList.add("map-hidden");
          }
          
          // Auto-save the address to backend
          try {
            // Wait a bit for form to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if mandatory fields are filled
            const house = document.getElementById("fldHouse").value.trim();
            const area = document.getElementById("fldArea").value.trim();
            const city = document.getElementById("fldCity").value.trim();
            const state = document.getElementById("fldState").value.trim();
            const pincode = document.getElementById("fldPincode").value.trim();
            
            if (house && area && city && state && pincode) {
              // All mandatory fields present, auto-save
              await saveAddress();
              showAlert("Success", "Address saved successfully!", "success");
            } else {
              // Some fields missing, prompt user
              showAlert("Location Fetched", "Please fill in the missing address details and save.", "info");
            }
          } catch (saveErr) {
            console.error("Auto-save error:", saveErr);
            showAlert("Location Fetched", "Address details loaded. Please verify and save manually.", "info");
          }

        } catch (err) {
          console.error(err);
          showAlert("Error", "Unable to fetch address details.", "error");
        } finally {
          btn.innerHTML = oldHTML;
          btn.disabled = false;
          lucide.createIcons();
        }
        });
      }

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

// checkGatewayEstimate() removed - price is computed before modal opens, modal size is locked

async function processGatewayPayment(btnId) {
  const btn = document.getElementById(btnId);
  
  // 🔥 Use state as source of truth ONLY (no DOM fallback - prevents stale price)
  const cost = currentOrderState.sampleCost;
  
  if (!cost || cost <= 0) {
    console.error("❌ Invalid cost for payment - state is source of truth:", {
      stateCost: currentOrderState.sampleCost,
      state: currentOrderState
    });
    showAlert("Error", "Sample cost not available. Please ensure you have selected a product and size, then wait for price estimate.", "error");
    return;
  }
  
  console.log("💳 Processing payment with cost from state:", {
    cost: cost,
    stateCost: currentOrderState.sampleCost,
    size: currentOrderState.size
  });

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

    // Auto-trigger place order - CRITICAL: Verify payment state before clicking
    console.log("Payment successful, triggering place order. isSamplePaid:", isSamplePaid, "transactionId:", currentTransactionId);
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    if (placeOrderBtn) {
      // Small delay to ensure modal is closed and state is ready
      setTimeout(() => {
        console.log("Auto-clicking Place Order button");
        placeOrderBtn.click();
      }, 200);
    } else {
      console.error("Place Order button not found!");
    }

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
    console.log("🎯 handlePlaceOrder called", {
      timestamp: new Date().toISOString(),
      isSamplePaid: isSamplePaid,
      currentTransactionId: currentTransactionId
    });

    /* 1. QUANTITY VALIDATION */
    const sum = window.computeSizeSum();
    const totalQuantityEl = document.getElementById("totalQuantity");
    const rawTotal = totalQuantityEl.value;
    const total = Math.floor(Number(rawTotal));

    if (!Number.isFinite(total) || total < 10 || total > 300) {
      console.warn("❌ Quantity validation failed:", { total, sum });
      showAlert("Invalid Quantity", "Total quantity must be between 10 and 300.", "error");
      return;
    }
    if (sum !== total) {
      console.warn("❌ Quantity mismatch:", { sum, total });
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
      console.warn("❌ Missing product details:", { product, selectedCategory });
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
      console.warn("❌ Missing address fields:", { house: !!house, area: !!area, city: !!city, state: !!state, pincode: !!pincode });
      showAlert("Missing Address", "Please fill in all required address fields.", "error");
      return;
    }

    /* 6. PAYMENT CHECK */
    if (!isSamplePaid) {
      // 🔥 CRITICAL: Validate state BEFORE opening modal (prevents visual glitch)
      if (
        !currentOrderState.productType ||
        !currentOrderState.category ||
        !currentOrderState.size ||
        currentOrderState.sampleCost === null ||
        currentOrderState.sampleCost <= 0 ||
        !currentOrderState.estimateFound  // Must be exact match, not relaxed estimate
      ) {
        console.error("❌ Invalid order state - cannot proceed to payment:", currentOrderState);
        if (!currentOrderState.estimateFound && currentOrderState.sampleCost > 0) {
          showAlert("Configuration Error", "Exact match not found. This configuration does not have confirmed quotations yet. Please select a different configuration.", "error");
        } else {
          showAlert("Configuration Error", "Please complete product configuration and wait for price estimate before proceeding to payment.", "error");
        }
        return;
      }

      // Debug: Ensure selectedCategory and selectedNeckType are set
      console.log("💳 Payment not completed - Opening payment modal", {
        selectedCategory: selectedCategory,
        selectedNeckType: selectedNeckType,
        isSamplePaid: isSamplePaid,
        state: currentOrderState
      });
      
      if (!selectedCategory) {
        console.warn("❌ Missing category - cannot proceed to payment");
        showAlert("Missing Selection", "Please select a product category before proceeding to payment.", "error");
        return;
      }

      // OPEN PAYMENT MODAL (validation passed)
      const paymentModal = document.getElementById("paymentModal");
      paymentModal.classList.remove("hidden");

      // Display locked sample size from state (source of truth, not DOM)
      const modalSizeDisplay = document.getElementById("modalSampleSizeDisplay");
      if (modalSizeDisplay) {
        modalSizeDisplay.textContent = currentOrderState.size || "-";
        console.log("🔒 Locked sample size in payment modal:", currentOrderState.size);
      } else {
        console.warn("⚠️ modalSampleSizeDisplay element not found");
      }

      // Use already-computed price from state (source of truth, not DOM)
      const gatewaySample = document.getElementById("gatewaySampleCost");
      const gatewayTotal = document.getElementById("gatewayTotalPayable");
      
      // Get price from state (already computed and stored)
      let displayCost = "--";
      let numericCost = currentOrderState.sampleCost || 0;
      
      if (numericCost > 0) {
        displayCost = `₹${numericCost}`;
      }
      
      // Update payment modal displays
      if (gatewaySample) gatewaySample.textContent = displayCost;
      if (gatewayTotal) gatewayTotal.textContent = displayCost;
      document.querySelectorAll('.pay-amount-display').forEach(el => el.textContent = displayCost);
      
      // Store cost for payment processing (backup to state)
      if (paymentModal) {
        paymentModal.dataset.currentCost = numericCost;
        console.log("💰 Payment modal price set from state:", {
          displayCost: displayCost,
          numericCost: numericCost,
          stateCost: currentOrderState.sampleCost,
          datasetCost: paymentModal.dataset.currentCost
        });
      }
      
      // Validation already done before modal opened - no need to repeat
      return;
    }

    console.log("✅ Payment check passed - proceeding to build payload", {
      isSamplePaid: isSamplePaid,
      currentTransactionId: currentTransactionId
    });

    /* 7. BUILD PAYLOAD */
    const dateText = document.getElementById("dateText");

    // Sample Size (from state - source of truth, not DOM)
    // NO FALLBACK - if size is null, order must fail (silent defaults are production killers)
    const finalSampleSize = currentOrderState.size;
    
    if (!finalSampleSize) {
      console.error("❌ Sample size is required - cannot proceed with order");
      showAlert("Configuration Error", "Please select a sample size before placing order.", "error");
      btns.forEach(btn => {
        btn.textContent = btn.dataset.oldText || "Place Order";
        btn.disabled = false;
      });
      return;
    }

    // Cost Retrieval (from state - source of truth, not DOM)
    // Backend will validate price again anyway - no need for redundant estimate call
    let numericCost = currentOrderState.sampleCost || 0.0;
    
    // Validate state before submission (explicit checks)
    if (
      !currentOrderState.productType ||
      !currentOrderState.category ||
      !currentOrderState.size ||
      currentOrderState.sampleCost === null ||
      currentOrderState.sampleCost <= 0
    ) {
      console.error("❌ Invalid order state for submission:", currentOrderState);
      showAlert("Configuration Error", "Please complete product configuration and wait for price estimate before placing order.", "error");
      btns.forEach(btn => {
        btn.textContent = btn.dataset.oldText || "Place Order";
        btn.disabled = false;
      });
      return;
    }
    
    console.log("💵 Final sample cost for order (from state):", {
      stateCost: currentOrderState.sampleCost,
      stateSize: currentOrderState.size,
      numericCost: numericCost
    });

    const payload = {
      product_type: product ? product.trim() : null,
      category: selectedCategory ? selectedCategory.trim() : null,
      neck_type: selectedNeckType ? selectedNeckType.trim() : null,
      color: color ? color.trim() : null,
      fabric: (fabric && fabric.trim()) ? fabric.trim() : null,  // Normalize fabric - only send if selected
      print_type: printType ? printType.trim() : null,
      quantity: total,
      price_per_piece: pricePerPiece,
      sample_size: finalSampleSize ? finalSampleSize.trim() : null,
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
    console.log("📦 Payload built - calling submitOrder()", {
      payloadKeys: Object.keys(payload),
      hasTransactionId: !!payload.transaction_id,
      sampleCost: payload.sample_cost
    });
    submitOrder(payload);
  };

  if (desktopBtn) desktopBtn.addEventListener("click", handlePlaceOrder);
  if (mobileBtn) mobileBtn.addEventListener("click", handlePlaceOrder);
}

async function submitOrder(payload) {
  // CRITICAL DEBUG: Verify function is being called
  console.log("🔥 SUBMIT ORDER CALLED", {
    timestamp: new Date().toISOString(),
    payload: payload,
    isSamplePaid: isSamplePaid,
    currentTransactionId: currentTransactionId
  });

  const btns = [
    document.getElementById("placeOrderBtn"),
    document.getElementById("placeOrderBtnMobile")
  ].filter(b => b);

  if (btns.length === 0) {
    console.error("❌ Place Order buttons not found!");
    showAlert("Error", "Place Order button not found. Please refresh the page.", "error");
    return;
  }

  // Update UI state
  btns.forEach(btn => {
    btn.dataset.oldText = btn.textContent;
    btn.textContent = "Placing Order...";
    btn.disabled = true;
  });

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found in localStorage");
      showAlert("Authentication Error", "Please log in to place an order.", "error");
      btns.forEach(btn => {
        btn.textContent = btn.dataset.oldText || "Place Order";
        btn.disabled = false;
      });
      return;
    }

    console.log("🚀 Submitting order to /api/orders/", {
      payload: payload,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      url: "/api/orders/",
      method: "POST"
    });

    // CRITICAL: Verify fetch wrapper exists
    if (!window.ImpromptuIndianApi || typeof window.ImpromptuIndianApi.fetch !== 'function') {
      console.error("❌ ImpromptuIndianApi.fetch is not available!");
      throw new Error("API wrapper not available. Please refresh the page.");
    }

    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    };

    console.log("📤 Fetch options:", {
      url: "/api/orders/",
      method: fetchOptions.method,
      hasAuthHeader: !!fetchOptions.headers.Authorization,
      payloadSize: JSON.stringify(payload).length
    });

    const res = await window.ImpromptuIndianApi.fetch("/api/orders/", fetchOptions);

    console.log("📥 Order submission response received:", {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      headers: Object.fromEntries(res.headers.entries())
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
    // CRITICAL: Log full error details
    console.error("❌ Order submission error:", {
      error: err,
      message: err.message,
      stack: err.stack,
      name: err.name,
      timestamp: new Date().toISOString()
    });

    // Check for specific error types
    if (err.message && err.message.includes("CORS")) {
      console.error("🚨 CORS ERROR DETECTED - Check backend CORS configuration");
      showAlert("CORS Error", "Cross-origin request blocked. Please contact support.", "error");
    } else if (err.message && err.message.includes("NetworkError") || err.message.includes("Failed to fetch")) {
      console.error("🚨 NETWORK ERROR - Request never reached server");
      showAlert("Network Error", "Could not connect to server. Please check your internet connection.", "error");
    } else {
      showAlert("Connection Error", err.message || "Could not connect to server.", "error");
    }

    // Reset UI
    btns.forEach(btn => {
      btn.textContent = btn.dataset.oldText || "Place Order";
      btn.disabled = false;
    });
  }
}


/* ---------------------------
   MAIN INITIALIZATION
---------------------------*/
function initNewOrderPage() {
  // 🔥 Reset all order state FIRST to prevent stale data from previous sessions
  resetOrderState();

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