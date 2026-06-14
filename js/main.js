/**
 * Gallery Foto - Main JavaScript
 * Features: Category filtering, Lightbox with navigation, Keyboard support
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const filterButtons = document.querySelectorAll('.filters__btn');
    const galleryItems = document.querySelectorAll('.gallery__item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    let currentIndex = 0;
    let visibleItems = [...galleryItems];

    // --- Category Filter ---
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('filters__btn--active'));
            button.classList.add('filters__btn--active');

            const filter = button.dataset.filter;

            galleryItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.classList.remove('gallery__item--hidden');
                } else {
                    item.classList.add('gallery__item--hidden');
                }
            });

            // Update visible items for lightbox navigation
            updateVisibleItems();
        });
    });

    function updateVisibleItems() {
        visibleItems = [...galleryItems].filter(
            item => !item.classList.contains('gallery__item--hidden')
        );
    }

    // --- Lightbox ---
    function openLightbox(index) {
        currentIndex = index;
        updateLightboxContent();
        lightbox.classList.add('lightbox--active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('lightbox--active');
        document.body.style.overflow = '';
    }

    function updateLightboxContent() {
        const item = visibleItems[currentIndex];
        const img = item.querySelector('img');
        const title = item.querySelector('h3');
        const desc = item.querySelector('p');

        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxCaption.textContent = title ? `${title.textContent} - ${desc.textContent}` : '';
    }

    function navigateLightbox(direction) {
        currentIndex += direction;
        if (currentIndex < 0) {
            currentIndex = visibleItems.length - 1;
        } else if (currentIndex >= visibleItems.length) {
            currentIndex = 0;
        }
        updateLightboxContent();
    }

    // Gallery item click handlers
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            updateVisibleItems();
            const index = visibleItems.indexOf(item);
            if (index !== -1) {
                openLightbox(index);
            }
        });
    });

    // Lightbox controls
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    lightboxNext.addEventListener('click', () => navigateLightbox(1));

    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('lightbox--active')) return;

        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                navigateLightbox(-1);
                break;
            case 'ArrowRight':
                navigateLightbox(1);
                break;
        }
    });

    // Initialize visible items
    updateVisibleItems();
});
