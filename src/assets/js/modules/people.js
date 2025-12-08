
export function initPeople() {
    // DOM Elements
    const section = document.querySelector('#people');
    if (!section) return;

    const filterBtns = section.querySelectorAll('.people-filter__btn');
    const cards = Array.from(section.querySelectorAll('.people-card'));
    const loadMoreBtn = section.querySelector('[data-people-load-more]');

    let activeGroup = 'team'; // Default ID from JSON

    // Find active group from DOM if set
    const activeBtn = section.querySelector('.people-filter__btn.is-active');
    if (activeBtn) {
        activeGroup = activeBtn.getAttribute('data-group');
    } else if (filterBtns.length > 0) {
        // Fallback to first button
        activeGroup = filterBtns[0].getAttribute('data-group');
        filterBtns[0].classList.add('is-active');
    }

    const PAGE_SIZE = 8;
    let shownCount = PAGE_SIZE;

    function updateVisibility() {
        let countInGroup = 0;
        let visibleInGroup = 0;

        cards.forEach(card => {
            const group = card.getAttribute('data-group');
            if (group === activeGroup) {
                countInGroup++;
                if (visibleInGroup < shownCount) {
                    card.style.display = '';
                    visibleInGroup++;
                } else {
                    card.style.display = 'none';
                }
            } else {
                card.style.display = 'none';
            }
        });

        // Toggle load more button
        if (loadMoreBtn) {
            if (visibleInGroup < countInGroup) {
                loadMoreBtn.style.display = '';
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    }

    // Bind Filter Clicks
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state class
            filterBtns.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');

            activeGroup = btn.getAttribute('data-group');
            shownCount = PAGE_SIZE; // Reset pagination logic when switching tabs
            updateVisibility();
        });
    });

    // Bind Load More
    if (loadMoreBtn) {
        // Remove old listeners by cloning (simple way to clear anonymous listeners if any exist, 
        // though strictly not needed if this runs once per page load)
        const newBtn = loadMoreBtn.cloneNode(true);
        loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);

        newBtn.addEventListener('click', () => {
            shownCount += PAGE_SIZE;
            updateVisibility();
        });
    }

    // Initial check
    updateVisibility();
}
