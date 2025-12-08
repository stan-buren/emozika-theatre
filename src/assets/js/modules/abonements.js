
export function initAbonements() {
    const gridRoot = document.querySelector('[data-abonements-root]');

    // Attach listeners to EXISTING cards
    if (gridRoot) {
        const contactsSection = document.getElementById('contacts');
        const scrollToContacts = (event) => {
            if (event) event.preventDefault();
            if (contactsSection) {
                contactsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };

        const heroCard = gridRoot.querySelector('.abonement-card--hero');
        if (heroCard) {
            heroCard.addEventListener('click', scrollToContacts);
        }

        // Also ensure all CTA buttons work
        const ctaButtons = document.querySelectorAll('[data-scroll-to="contacts"]');
        ctaButtons.forEach((button) => {
            button.addEventListener('click', scrollToContacts);
        });
    }

    // Picker Logic
    const picker = document.querySelector('[data-abonement-picker]');

    if (picker) {
        const ageSelect = picker.querySelector('[data-abonement-age]');
        const goalSelect = picker.querySelector('[data-abonement-goal]');
        const scheduleSelect = picker.querySelector('[data-abonement-schedule]');
        const pickButton = picker.querySelector('[data-abonement-pick]');
        const badgeEl = picker.querySelector('[data-abonement-result-badge]');
        const titleEl = picker.querySelector('[data-abonement-result-title]');
        const textEl = picker.querySelector('[data-abonement-result-text]');
        const ctaEl = picker.querySelector('[data-abonement-cta-main]');

        function getRecommendation() {
            const age = ageSelect ? ageSelect.value : '7-11';
            const goal = goalSelect ? goalSelect.value : 'stage';
            const schedule = scheduleSelect ? scheduleSelect.value : 'standard';

            const fallback = {
                badge: 'Рекомендация',
                title: 'Пробное занятие',
                text: 'Начните с пробного урока — познакомитесь с педагогом и форматом занятий.',
                cta: 'Записаться на пробное'
            };

            if (goal === 'cinema') {
                return {
                    badge: 'Киноформат',
                    title: 'Съёмочный модуль + занятия',
                    text: 'Киноформат с пробами и 1–2 занятиями в неделю — ребёнок окажется на площадке и получит готовый фильм.',
                    cta: 'Записаться в киноформат'
                };
            }

            if (age === '12-16' || schedule === 'intense') {
                return {
                    badge: 'Интенсив',
                    title: 'Модуль на 4 месяца',
                    text: 'Глубокая программа с регулярными репетициями, сценами и итоговым спектаклем на сцене театра.',
                    cta: 'Выбрать модуль'
                };
            }

            if (goal === 'speech') {
                return {
                    badge: 'Речь',
                    title: 'Курс речи + студия',
                    text: 'Комбинация сценической речи и актёрки: дикция, уверенность, выступления перед аудиторией.',
                    cta: 'Уточнить расписание'
                };
            }

            if (age === '4-6') {
                return {
                    badge: 'Старт',
                    title: 'Пробное занятие в младшей группе',
                    text: 'Мягкое знакомство через игру и пластику. Поможет понять, готов ли малыш заниматься регулярно.',
                    cta: 'Записаться на пробу'
                };
            }

            return fallback;
        }

        function updateRecommendation() {
            const rec = getRecommendation();

            if (badgeEl && rec.badge) badgeEl.textContent = rec.badge;
            if (titleEl) titleEl.textContent = rec.title;
            if (textEl) textEl.textContent = rec.text;
            if (ctaEl && rec.cta) ctaEl.textContent = rec.cta;
        }

        if (pickButton) {
            pickButton.addEventListener('click', function (e) {
                e.preventDefault();
                updateRecommendation();
            });
        }

        [ageSelect, goalSelect, scheduleSelect].forEach((field) => {
            if (!field) return;
            field.addEventListener('change', updateRecommendation);
        });

        updateRecommendation();
    }
}
