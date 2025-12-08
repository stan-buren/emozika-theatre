export function initAwards() {
    // 1. Strip Controls (Scroll / Drag)
    const awardsSection = document.querySelector("#awards");
    if (!awardsSection) return;

    const stripEl = awardsSection.querySelector("[data-awards-strip]");
    if (stripEl) {
        initAwardsStripControls(stripEl);

        // Handle badge clicks
        const inner = stripEl.querySelector(".awards-strip-inner");
        if (inner) {
            // Calculate badge size for CSS if needed, but CSS usually handles it.
            // If JS was calculating --award-badge-size, we might need to look at it.
            // The original JS did: find max size, set --award-badge-size.
            // Let's keep that logic if it's crucial for layout, or trust CSS grid/flex.
            // Assuming CSS is sufficient or we can reimplement light resizing logic.

            inner.addEventListener("click", function (event) {
                var badge = event.target.closest(".award-badge");
                if (!badge) return;

                var festivalId = badge.getAttribute("data-festival-id");
                if (!festivalId) return;

                var target = document.querySelector(
                    '[data-festival-id="' + festivalId + '"]'
                );
                if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            });
        }
    }

    // 2. Festivals Show More
    const toggleBtn = awardsSection.querySelector(".awards-toggle");
    const festivalsList = awardsSection.querySelector(".festivals-list");

    if (toggleBtn && festivalsList) {
        let expanded = false;

        toggleBtn.addEventListener("click", function () {
            expanded = !expanded;
            const hiddenItems = festivalsList.querySelectorAll(".festival-card.hidden-festival");

            if (expanded) {
                hiddenItems.forEach(item => item.style.display = "");
                toggleBtn.textContent = "Свернуть фестивали";
            } else {
                hiddenItems.forEach(item => item.style.display = "none");
                toggleBtn.textContent = "Показать ещё фестивали";
                // Scroll back up? optional
                festivalsList.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    }
}

function initAwardsStripControls(stripEl) {
    if (!stripEl) return;

    const viewport = stripEl.querySelector(".awards-strip-viewport");
    const inner = stripEl.querySelector(".awards-strip-inner");
    if (!viewport || !inner) return;

    // Infinite Scroll Logic (Auto-reset scroll position)
    // We expect CSS variable --awards-shift or similar to handle the visual 'auto' movement?
    // Or did JS handle the auto-scroll?
    // Original JS just set up drag and scroll reset.
    // Assuming CSS animation moves it, or it was static and scrollable?
    // Original JS: `var shiftPercent = -(100 / repeatCount);` -> seems it used CSS animation based on that var.

    // We need to set the variables if they are missing.
    // Repeat count is hardcoded to 5 in Astro.
    const repeatCount = 5;
    const isDesktop = window.innerWidth >= 1024;

    if (isDesktop) {
        // This logic was in rendering function. Re-apply simpler version.
        stripEl.style.setProperty("--awards-shift", "20%"); // 1/5 = 20%
    }

    // Simple drag logic
    let isDragging = false;
    let dragStartX = 0;
    let startScroll = 0;

    viewport.addEventListener("pointerdown", function (event) {
        isDragging = true;
        dragStartX = event.clientX;
        startScroll = viewport.scrollLeft;
        viewport.classList.add("is-dragging");
        viewport.setPointerCapture(event.pointerId);
    });

    viewport.addEventListener("pointermove", function (event) {
        if (!isDragging) return;
        const deltaX = event.clientX - dragStartX;
        viewport.scrollLeft = startScroll - deltaX;
    });

    function endDrag() {
        isDragging = false;
        viewport.classList.remove("is-dragging");
    }

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("pointerleave", endDrag);

    // Mouse Wheel
    viewport.addEventListener(
        "wheel",
        function (event) {
            const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
            viewport.scrollLeft += delta;
            event.preventDefault();
        },
        { passive: false }
    );
}
