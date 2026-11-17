(function() {
    'use strict';
    var nav = document.querySelector('#main-nav .site-nav');
    if (!nav) return;
    var items = Array.prototype.slice.call(nav.querySelectorAll('.site-nav__item'));
    var desktop = window.matchMedia('(min-width: 768px)');
    var hover = window.matchMedia('(hover: hover) and (pointer: fine)');
    var closeTimer;

    function cancelClose() { window.clearTimeout(closeTimer); }
    function setOpen(item, open) {
        item.classList.toggle('is-expanded', open);
        item.querySelector('.site-nav__toggle').setAttribute('aria-expanded', String(open));
        // Closed panels are excluded from keyboard navigation during their transition.
        item.querySelectorAll('.site-nav__section-link').forEach(function(link) {
            if (open) link.removeAttribute('tabindex');
            else link.setAttribute('tabindex', '-1');
        });
    }
    function closeAll() {
        cancelClose();
        items.forEach(function(item) { setOpen(item, false); });
    }
    function openItem(item) {
        cancelClose();
        items.forEach(function(other) { setOpen(other, other === item); });
    }
    function reset() {
        closeAll();
        if (!desktop.matches) {
            var current = nav.querySelector('.site-nav__item.active');
            if (current) openItem(current);
        }
    }
    items.forEach(function(item) {
        var button = item.querySelector('.site-nav__toggle');
        button.addEventListener('click', function() {
            cancelClose();
            if (button.getAttribute('aria-expanded') === 'true') setOpen(item, false);
            else openItem(item);
        });
        item.addEventListener('pointerenter', function(event) {
            if (desktop.matches && hover.matches && event.pointerType === 'mouse') openItem(item);
        });
        item.addEventListener('pointerleave', function(event) {
            if (desktop.matches && hover.matches && event.pointerType === 'mouse') {
                cancelClose();
                closeTimer = window.setTimeout(function() {
                    if (!item.contains(document.activeElement)) setOpen(item, false);
                }, 180);
            }
        });
        item.addEventListener('focusout', function(event) {
            if (desktop.matches && !item.contains(event.relatedTarget)) setOpen(item, false);
        });
    });
    nav.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape') return;
        var item = event.target.closest('.site-nav__item');
        if (item && item.classList.contains('is-expanded')) {
            event.preventDefault();
            event.stopPropagation();
            closeAll();
            item.querySelector('.site-nav__toggle').focus();
        } else if (!desktop.matches && window.jQuery) {
            event.preventDefault();
            window.jQuery('#primary-nav').collapse('hide');
            document.querySelector('#main-nav .navbar-toggle').focus();
        }
    });
    document.addEventListener('click', function(event) {
        if (!nav.contains(event.target) && !event.target.closest('.navbar-toggle')) closeAll();
    });
    nav.addEventListener('click', function(event) {
        if (!event.target.closest('a')) return;
        closeAll();
        if (!desktop.matches && window.jQuery) {
            window.jQuery('#primary-nav').collapse('hide');
        }
    });
    if (desktop.addEventListener) desktop.addEventListener('change', reset);
    else desktop.addListener(reset);
    // Bootstrap controls only the outer mobile hamburger; disclosures stay independent.
    if (window.jQuery) window.jQuery('#primary-nav').on('show.bs.collapse', function(event) {
        if (event.target.id === 'primary-nav' && !desktop.matches) reset();
    });
    nav.classList.add('site-nav--enhanced');
    reset();
})();
