export function initFaq() {
    const faqContainer = document.querySelector('#faq');
    if (!faqContainer) return;

    const faqItemsWrapper = faqContainer.querySelector('.faq-items');
    const queryInput = faqContainer.querySelector('[data-faq-search]');
    const resetBtn = faqContainer.querySelector('[data-faq-reset]');
    const countEl = faqContainer.querySelector('[data-faq-count]');

    if (!faqItemsWrapper) return;

    // Data is initialized by Astro
    // 1. Initialize logic from DOM
    const allData = Array.from(faqItemsWrapper.querySelectorAll('.faq-item')).map(el => {
        return {
            element: el,
            question: el.querySelector('.faq-question').textContent,
            answer: el.querySelector('.faq-answer').textContent
        };
    });

    bindSearch(allData);

    // Removed renderFaq because HTML is static
    // Just toggle visibility instead


    // 2. Event Delegation for accordions
    faqItemsWrapper.addEventListener('click', (e) => {
        const btn = e.target.closest('.faq-question');
        if (!btn) return;

        const item = btn.parentElement;
        const expanded = btn.getAttribute('aria-expanded') === 'true';

        // Collapse all others (optional - can be removed if multiple open allowed)
        // faqContainer.querySelectorAll('.faq-question').forEach(b => b.setAttribute('aria-expanded', 'false'));
        // faqContainer.querySelectorAll('.faq-item').forEach(i => i.classList.remove('is-open'));

        btn.setAttribute('aria-expanded', !expanded);
        item.classList.toggle('is-open', !expanded);
    });

    // 3. Search Logic
    function bindSearch(dataItems) {
        if (!queryInput) return;

        function doFilter() {
            const query = queryInput.value.toLowerCase().trim();
            let count = 0;

            dataItems.forEach(item => {
                const matches = item.question.toLowerCase().includes(query) ||
                    item.answer.toLowerCase().includes(query);

                if (item.element) {
                    item.element.style.display = matches ? '' : 'none';
                }
                if (matches) count++;
            });

            if (countEl) {
                countEl.textContent = query
                    ? `Нашли ${count} из ${dataItems.length}`
                    : '';
                countEl.hidden = !query;
            }
        }

        queryInput.addEventListener('input', doFilter);

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                queryInput.value = '';
                doFilter();
                queryInput.focus();
            });
        }
    }
}
