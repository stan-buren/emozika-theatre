
export function initGallery() {
    const gallerySection = document.querySelector("#gallery");

    if (gallerySection) {
        const scroller = gallerySection.querySelector("[data-gallery-scroller]");
        const tabs = gallerySection.querySelectorAll("[data-gallery-filter]");
        const lightbox = document.querySelector("#gallery-lightbox");
        const lightboxImage = lightbox ? lightbox.querySelector(".lightbox__image") : null;
        const lightboxCaption = lightbox ? lightbox.querySelector(".lightbox__caption") : null;
        const prevBtn = lightbox ? lightbox.querySelector("[data-lightbox-prev]") : null;
        const nextBtn = lightbox ? lightbox.querySelector("[data-lightbox-next]") : null;
        const closeEls = lightbox
            ? lightbox.querySelectorAll("[data-lightbox-close]")
            : [];

        // Data is now rendered by Astro
        // const galleryItems = ... (removed)

        let currentFilter = "all";
        let visibleItems = [];
        let currentIndex = 0;

        // Initialize from DOM
        const initialCards = Array.from(scroller.querySelectorAll('.gallery-card'));
        const galleryItems = initialCards.map(card => {
            return {
                id: card.getAttribute('data-gallery-id'),
                src: card.querySelector('img').getAttribute('src'),
                full: card.querySelector('img').getAttribute('src'), // assuming same for now
                alt: card.querySelector('img').getAttribute('alt'),
                caption: card.querySelector('.gallery-card__title').textContent,
                category: card.getAttribute('data-category')
            };
        });

        function getFilteredItems() {
            if (currentFilter === "all") {
                return galleryItems;
            }
            return galleryItems.filter((item) => item.category === currentFilter);
        }

        function renderGallery() {
            if (!scroller) return;

            // Only toggle visibility
            const cards = scroller.querySelectorAll('.gallery-card');
            visibleItems = [];

            cards.forEach(card => {
                const category = card.getAttribute('data-category');
                const shouldShow = currentFilter === 'all' || category === currentFilter;
                card.style.display = shouldShow ? '' : 'none';
                if (shouldShow) {
                    // Update index data-attribute to match visible order if needed, 
                    // or just push to visibleItems for lightbox navigation
                    visibleItems.push(galleryItems.find(i => i.id === card.getAttribute('data-gallery-id')));
                }
            });

            // Re-bind listeners? No, they are static.
        }

        // Bind initial listeners
        initialCards.forEach((card, index) => {
            card.addEventListener("click", () => {
                // Find the index in the *currently visible* items?
                // Or just the index in the full list?
                // Lightbox usually needs global index or filtered index.
                // Let's find this item in visibleItems
                const id = card.getAttribute('data-gallery-id');
                const visIndex = visibleItems.findIndex(i => i.id === id);
                if (visIndex >= 0) {
                    openLightbox(visIndex);
                }
            });
        });


        function updateLightbox() {
            if (!lightboxImage || !lightboxCaption) return;
            const item = visibleItems[currentIndex];

            if (!item) return;

            const src = item.full || item.src;

            lightboxImage.src = src;
            lightboxImage.alt = item.alt || "";
            lightboxCaption.textContent = item.caption || "";
        }

        function openLightbox(index) {
            if (!lightbox || !lightboxImage || !visibleItems.length) return;

            currentIndex = index;
            updateLightbox();

            lightbox.hidden = false;
            document.body.classList.add("is-lightbox-open");
        }

        function closeLightbox() {
            if (!lightbox) return;
            lightbox.hidden = true;
            document.body.classList.remove("is-lightbox-open");
        }

        function goTo(delta) {
            if (!visibleItems.length) return;
            const length = visibleItems.length;
            currentIndex = (currentIndex + delta + length) % length;
            updateLightbox();
        }

        if (prevBtn) {
            prevBtn.addEventListener("click", () => {
                goTo(-1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", () => {
                goTo(1);
            });
        }

        closeEls.forEach((el) => {
            el.addEventListener("click", () => {
                closeLightbox();
            });
        });

        document.addEventListener("keydown", (event) => {
            if (!lightbox || lightbox.hidden) return;

            if (event.key === "Escape") {
                closeLightbox();
            } else if (event.key === "ArrowRight") {
                goTo(1);
            } else if (event.key === "ArrowLeft") {
                goTo(-1);
            }
        });

        if (tabs.length) {
            tabs.forEach((tab) => {
                tab.addEventListener("click", () => {
                    const value = tab.getAttribute("data-gallery-filter") || "all";
                    currentFilter = value;

                    tabs.forEach((btn) => {
                        btn.classList.toggle("is-active", btn === tab);
                    });

                    renderGallery();
                });
            });
        }

        renderGallery();
    }
}
