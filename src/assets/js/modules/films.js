
export function initFilms() {
    const filmsSection = document.querySelector("#films");

    if (filmsSection) {
        const carouselEl = filmsSection.querySelector("[data-films-carousel]");
        const detailEl = filmsSection.querySelector("[data-film-detail]");

        if (carouselEl && detailEl) {
            let activeFilmId = ''; // will be set from first item

            // Try to find currently active (rendered by Astro)
            const activeItem = carouselEl.querySelector('.films-card--active');
            if (activeItem) {
                activeFilmId = activeItem.getAttribute('data-film-id');
            }

            // Fetch data for interactivity (updates)
            fetch("assets/data/films.json")
                .then(res => res.ok ? res.json() : [])
                .then(filmsData => {
                    const cards = carouselEl.querySelectorAll('.films-card');
                    cards.forEach(card => {
                        card.addEventListener('click', () => {
                            const id = card.getAttribute('data-film-id');
                            if (id === activeFilmId) return;

                            // Update active state in carousel
                            cards.forEach(c => c.classList.remove('films-card--active'));
                            card.classList.add('films-card--active');
                            activeFilmId = id;

                            // Find data and render detail
                            const film = filmsData.find(f => f.id === id);
                            if (film) renderDetail(film);
                        });
                    });
                })
                .catch(err => console.error(err));

            function renderDetail(film) {
                const titleEl = detailEl.querySelector("[data-film-title]");
                const metaEl = detailEl.querySelector("[data-film-meta]");
                const authorsEl = detailEl.querySelector("[data-film-authors]");
                const synopsisEl = detailEl.querySelector("[data-film-synopsis]");
                const awardsEl = detailEl.querySelector("[data-film-awards]");
                const embedEl = detailEl.querySelector("[data-film-embed]");
                const vkLinkEl = detailEl.querySelector("[data-film-vk-link]");

                if (titleEl) {
                    titleEl.textContent = film.title;
                }

                if (metaEl) {
                    const yearLabel = film.year || "Добавить данные";
                    const cityLabel = film.city || "Добавить данные";
                    metaEl.textContent = `${yearLabel} · ${cityLabel}`;
                }

                if (authorsEl) {
                    const pieces = [
                        `Сценарий: ${film.writer || "Добавить данные"}`,
                        `Режиссура: ${film.directors && film.directors.length
                            ? film.directors.join(", ")
                            : "Добавить данные"
                        }`,
                        `Оператор: ${film.dop || "Добавить данные"}`,
                    ];

                    if (film.editor) {
                        pieces.push(`Редактор: ${film.editor}`);
                    }

                    authorsEl.innerHTML = pieces
                        .map((text) => `<span class="films-detail-author">${text}</span>`)
                        .join("");
                }

                if (synopsisEl) {
                    synopsisEl.textContent = film.synopsis || "";
                }

                if (awardsEl) {
                    awardsEl.innerHTML = "";
                    const awards = film.awards || [];

                    if (!awards.length) {
                        const li = document.createElement("li");
                        li.className = "films-detail-award films-detail-award--empty";
                        li.textContent = "Награды будут добавлены позже.";
                        awardsEl.appendChild(li);
                    } else {
                        awards.forEach((award) => {
                            const li = document.createElement("li");
                            li.className = "films-detail-award";
                            const parts = [
                                award.status,
                                award.festival,
                                award.city && `(${award.city})`,
                                award.year,
                            ].filter(Boolean);
                            li.textContent = parts.join(", ");
                            awardsEl.appendChild(li);
                        });
                    }
                }

                if (embedEl) {
                    if (film.vkEmbedUrl) {
                        embedEl.innerHTML = `
              <iframe
                src="${film.vkEmbedUrl}"
                frameborder="0"
                allowfullscreen
                loading="lazy"
              ></iframe>
            `;
                    } else {
                        embedEl.innerHTML =
                            '<div class="films-video-placeholder">Видео появится позже</div>';
                    }
                }

                if (vkLinkEl) {
                    const url = film.vkPageUrl || film.vkEmbedUrl;
                    if (url) {
                        vkLinkEl.href = url;
                        vkLinkEl.style.display = "";
                    } else {
                        vkLinkEl.style.display = "none";
                    }
                }
            }
        }
    }
}
