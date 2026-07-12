jQuery(function($) {
    'use strict';

    var siteNoticeConfig = {
        id: 'summer-2026',
        startDate: '2026-07-01',
        endDate: '2026-08-24',
        iconClass: 'fa-solid fa-sailboat',
        message: [
            'A luglio e agosto resteremo chiusi il sabato.',
            'Saremo in ferie dall\'8 al 24 agosto, riapriremo marted\u00ec 25.'
        ]
    };

    function parseSiteNoticeDate(dateString, useEndOfDay) {
        var parts;

        if (!dateString) {
            return null;
        }

        parts = dateString.split('-').map(function(part) {
            return parseInt(part, 10);
        });

        if (parts.length !== 3 || parts.some(function(part) { return !Number.isFinite(part); })) {
            return null;
        }

        if (useEndOfDay) {
            return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
        }

        return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
    }

    function isSiteNoticeActive(config) {
        var now = new Date();
        var startDate = parseSiteNoticeDate(config.startDate, false);
        var endDate = parseSiteNoticeDate(config.endDate, true);

        if (startDate && now < startDate) {
            return false;
        }

        if (endDate && now > endDate) {
            return false;
        }

        return true;
    }

    function updateSiteNoticeHeight(notice) {
        if (!notice || !notice.classList.contains('is-visible')) {
            document.documentElement.style.removeProperty('--site-notice-height');
            return;
        }

        document.documentElement.style.setProperty('--site-notice-height', notice.offsetHeight + 'px');
    }

    function initSiteNotice(config) {
        var notice;
        var inner;
        var indicator;
        var content;
        var message;
        var closeButton;
        var icon;
        var lines;
        var scheduleFrame;

        if (!config || !config.id || !isSiteNoticeActive(config)) {
            return;
        }

        lines = Array.isArray(config.message) ? config.message : [config.message];
        scheduleFrame = window.requestAnimationFrame || function(callback) {
            window.setTimeout(callback, 0);
        };

        notice = document.createElement('aside');
        inner = document.createElement('div');
        indicator = document.createElement('span');
        content = document.createElement('div');
        message = document.createElement('p');
        closeButton = document.createElement('button');

        notice.className = 'site-notice';
        notice.setAttribute('aria-labelledby', 'site-notice-message');
        inner.className = 'site-notice__inner';
        indicator.className = 'site-notice__indicator';
        indicator.setAttribute('aria-hidden', 'true');
        icon = document.createElement('i');
        icon.className = config.iconClass || '';
        icon.setAttribute('aria-hidden', 'true');
        indicator.appendChild(icon);
        content.className = 'site-notice__content';
        message.className = 'site-notice__message';
        message.id = 'site-notice-message';
        closeButton.className = 'site-notice__close';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', 'Chiudi avviso');
        closeButton.textContent = '\u00d7';

        lines.forEach(function(line) {
            var lineElement;

            if (!line) {
                return;
            }

            lineElement = document.createElement('span');
            lineElement.className = 'site-notice__line';
            lineElement.textContent = line;
            message.appendChild(lineElement);
        });

        content.appendChild(message);
        inner.appendChild(indicator);
        inner.appendChild(content);
        inner.appendChild(closeButton);
        notice.appendChild(inner);
        document.body.appendChild(notice);

        function hideNotice() {
            notice.classList.remove('is-visible');
            document.body.classList.remove('has-site-notice');
            updateSiteNoticeHeight(null);

            window.setTimeout(function() {
                if (notice.parentNode) {
                    notice.parentNode.removeChild(notice);
                }
            }, 240);
        }

        closeButton.addEventListener('click', hideNotice);
        window.addEventListener('resize', function() {
            updateSiteNoticeHeight(notice);
        });

        scheduleFrame(function() {
            notice.classList.add('is-visible');
            document.body.classList.add('has-site-notice');
            updateSiteNoticeHeight(notice);
        });
    }

    initSiteNotice(siteNoticeConfig);

    var heroSlider = (function() {
        var $slider = $('.hero-mobile-slider');
        if (!$slider.length) {
            return null;
        }

        var $allSlides = $slider.find('.hero-mobile-slide');
        var $slides = $();
        var currentIndex = 0;
        var transitionTimer = null;
        var slideDelay = 7000;
        var resizeTimer = null;

        function getVisibleSlides() {
            return $allSlides.filter(function() {
                return window.getComputedStyle(this).display !== 'none';
            });
        }

        function playVideo(video) {
            if (!video) {
                return;
            }

            var playAttempt = video.play();
            if (playAttempt && typeof playAttempt.catch === 'function') {
                playAttempt.catch(function() {});
            }
        }

        function clearTransitionTimer() {
            if (transitionTimer) {
                window.clearTimeout(transitionTimer);
                transitionTimer = null;
            }
        }

        function goToNextSlide() {
            if ($slides.length < 2) {
                return;
            }

            setActiveSlide((currentIndex + 1) % $slides.length);
        }

        function scheduleNext() {
            var activeSlide;
            var activeVideo;
            var delay = slideDelay;
            var remainingDuration;

            clearTransitionTimer();

            if ($slides.length < 2) {
                return;
            }

            activeSlide = $slides.eq(currentIndex);
            activeVideo = activeSlide.find('video').get(0);

            if (activeVideo && Number.isFinite(activeVideo.duration) && activeVideo.duration > 0) {
                remainingDuration = activeVideo.duration - (activeVideo.currentTime || 0);
                delay = Math.max(400, Math.round(remainingDuration * 1000));
            }

            transitionTimer = window.setTimeout(goToNextSlide, delay);
        }

        function syncVideos(options) {
            $allSlides.find('video').each(function() {
                var video = this;
                if (!video) {
                    return;
                }

                video.pause();
            });

            var activeVideo = $slides.eq(currentIndex).find('video').get(0);
            var preserveProgress = options && options.preserveProgress;

            if (!activeVideo) {
                scheduleNext();
                return;
            }

            if (!preserveProgress) {
                activeVideo.currentTime = 0;
            }

            playVideo(activeVideo);
            scheduleNext();
        }

        function setActiveSlide(index, options) {
            if (!$slides.length) {
                return;
            }

            currentIndex = index;
            $allSlides.removeClass('is-active');
            $slides.eq(index).addClass('is-active');
            syncVideos(options);
        }

        function stop() {
            clearTransitionTimer();

            $allSlides.find('video').each(function() {
                var video = this;
                if (!video) {
                    return;
                }

                video.pause();
            });
        }

        function start() {
            if ($slides.length < 2) {
                return;
            }

            scheduleNext();
        }

        function sync(options) {
            $slides = getVisibleSlides();
            var preserveProgress = options && options.preserveProgress;

            if (!$slides.length) {
                stop();
                return;
            }

            stop();
            currentIndex = Math.min(currentIndex, $slides.length - 1);
            setActiveSlide(currentIndex, { preserveProgress: preserveProgress });
        }

        $slides = getVisibleSlides();
        setActiveSlide(0);

        $allSlides.find('video').each(function() {
            var video = this;
            video.addEventListener('loadeddata', function() {
                if ($slides.eq(currentIndex).find('video').get(0) === video) {
                    playVideo(video);
                    scheduleNext();
                }
            });

            video.addEventListener('canplay', function() {
                if ($slides.eq(currentIndex).find('video').get(0) === video) {
                    playVideo(video);
                    scheduleNext();
                }
            });

            video.addEventListener('ended', function() {
                if ($slides.eq(currentIndex).find('video').get(0) === video) {
                    goToNextSlide();
                }
            });
        });

        window.addEventListener('resize', function() {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(sync, 120);
        });

        if ($slider.hasClass('is-booting')) {
            window.setTimeout(function() {
                $slider.removeClass('is-booting');
                sync();
            }, 140);
        } else {
            sync();
        }

        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                stop();
                return;
            }
            sync({ preserveProgress: true });
        });

        return {
            sync: sync
        };
    })();

    var brandCarousel = (function() {
        var root = document.querySelector('.brand-carousel');
        if (!root) {
            return null;
        }

        var viewport = root.querySelector('.brand-carousel__viewport');
        var track = root.querySelector('.brand-carousel__track');
        var prevButton = root.querySelector('.brand-carousel__arrow--prev');
        var nextButton = root.querySelector('.brand-carousel__arrow--next');
        var brandBase = root.getAttribute('data-brand-base') || '';
        var autoplayDelay = 10000;
        var manifestItems = Array.isArray(window.__BRAND_LOGOS__) ? window.__BRAND_LOGOS__ : [];
        var allItems = [];
        var pageCount = 0;
        var currentPage = 0;
        var autoplayId = null;
        var resizeTimer = null;

        function createBrandItem(brand) {
            var item = document.createElement('div');
            var slot = document.createElement('figure');
            var image = document.createElement('img');
            var label = document.createElement('figcaption');
            var brandName = brand.name || brand.alt || '';

            function resolveBrandSrc(src) {
                if (!src) {
                    return '';
                }

                if (/^(?:[a-z]+:)?\/\//i.test(src) || src.charAt(0) === '/' || !brandBase) {
                    return src;
                }

                return brandBase + src;
            }

            item.className = 'brand-item';
            slot.className = 'brand-logo-slot';
            image.src = resolveBrandSrc(brand.src);
            image.alt = brandName;
            image.loading = 'lazy';
            image.decoding = 'async';
            label.className = 'brand-logo-slot__label';
            label.textContent = brandName;
            label.setAttribute('aria-hidden', 'true');

            slot.appendChild(image);
            if (brandName) {
                slot.appendChild(label);
            }
            item.appendChild(slot);

            return item;
        }

        function hydrateItems() {
            if (manifestItems.length) {
                allItems = manifestItems.map(createBrandItem);
                return;
            }

            allItems = Array.prototype.slice.call(track.querySelectorAll('.brand-item'));
        }

        function getLayout() {
            var width = window.innerWidth;

            if (width < 768) {
                return { perPage: 4, columns: 2 };
            }

            if (width < 992) {
                return { perPage: 6, columns: 3 };
            }

            return { perPage: 10, columns: 5 };
        }

        function updateControls() {
            var isSinglePage = pageCount < 2;
            root.classList.toggle('is-single-page', isSinglePage);
            prevButton.disabled = isSinglePage;
            nextButton.disabled = isSinglePage;
        }

        function renderPage(index) {
            if (!pageCount) {
                track.style.transform = 'translateX(0)';
                updateControls();
                return;
            }

            currentPage = (index + pageCount) % pageCount;
            track.style.transform = 'translateX(' + (-currentPage * 100) + '%)';
            updateControls();
        }

        function stopAutoplay() {
            if (autoplayId) {
                window.clearInterval(autoplayId);
                autoplayId = null;
            }
        }

        function startAutoplay() {
            if (autoplayId || pageCount < 2) {
                return;
            }

            autoplayId = window.setInterval(function() {
                renderPage(currentPage + 1);
            }, autoplayDelay);
        }

        function rebuild() {
            var layout = getLayout();
            var pages = [];
            var nextPageIndex = Math.min(currentPage, Math.max(0, Math.ceil(allItems.length / layout.perPage) - 1));
            var i;

            track.innerHTML = '';

            if (!allItems.length) {
                pageCount = 0;
                currentPage = 0;
                stopAutoplay();
                renderPage(0);
                return;
            }

            for (i = 0; i < allItems.length; i += layout.perPage) {
                var pageItems = allItems.slice(i, i + layout.perPage);
                var page = document.createElement('div');

                page.className = 'brand-page';
                page.style.setProperty('--brand-columns', Math.min(layout.columns, pageItems.length));

                pageItems.forEach(function(item) {
                    page.appendChild(item);
                });

                track.appendChild(page);
                pages.push(page);
            }

            pageCount = pages.length;
            currentPage = nextPageIndex;
            stopAutoplay();
            renderPage(currentPage);
            startAutoplay();
        }

        prevButton.addEventListener('click', function() {
            stopAutoplay();
            renderPage(currentPage - 1);
            startAutoplay();
        });

        nextButton.addEventListener('click', function() {
            stopAutoplay();
            renderPage(currentPage + 1);
            startAutoplay();
        });

        root.addEventListener('mouseenter', stopAutoplay);
        root.addEventListener('mouseleave', startAutoplay);

        window.addEventListener('resize', function() {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(rebuild, 120);
        });

        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                stopAutoplay();
                return;
            }

            startAutoplay();
        });

        hydrateItems();
        rebuild();

        return {
            rebuild: rebuild
        };
    })();

    var aboutStack = (function() {
        var root = document.querySelector('.about-stack');
        if (!root) {
            return null;
        }

        var cards = Array.prototype.slice.call(root.querySelectorAll('.about-stack__card'));
        var isAnimating = false;
        var touchStartX = 0;
        var touchEndX = 0;
        var autoplayId = null;
        var autoplayDelay = 4300;

        if (cards.length < 2) {
            return null;
        }

        function applyOrder() {
            cards.forEach(function(card, index) {
                card.classList.remove('is-front', 'is-middle', 'is-back');

                if (index === 0) {
                    card.classList.add('is-front');
                } else if (index === 1) {
                    card.classList.add('is-middle');
                } else {
                    card.classList.add('is-back');
                }
            });
        }

        function advance(direction) {
            var frontCard;

            if (isAnimating) {
                return;
            }

            isAnimating = true;
            frontCard = cards[0];
            frontCard.classList.add(direction > 0 ? 'is-leaving-next' : 'is-leaving-prev');

            window.setTimeout(function() {
                frontCard.classList.remove('is-leaving-next', 'is-leaving-prev');

                if (direction > 0) {
                    cards.push(cards.shift());
                } else {
                    cards.unshift(cards.pop());
                }

                applyOrder();
                isAnimating = false;
            }, 520);
        }

        function stopAutoplay() {
            if (autoplayId) {
                window.clearInterval(autoplayId);
                autoplayId = null;
            }
        }

        function startAutoplay() {
            if (autoplayId || cards.length < 2) {
                return;
            }

            autoplayId = window.setInterval(function() {
                advance(1);
            }, autoplayDelay);
        }

        root.addEventListener('click', function() {
            stopAutoplay();
            advance(1);
            startAutoplay();
        });

        root.addEventListener('touchstart', function(event) {
            stopAutoplay();
            touchStartX = event.changedTouches[0].clientX;
        }, { passive: true });

        root.addEventListener('touchend', function(event) {
            touchEndX = event.changedTouches[0].clientX;

            if (Math.abs(touchEndX - touchStartX) < 28) {
                startAutoplay();
                return;
            }

            advance(touchEndX < touchStartX ? 1 : -1);
            startAutoplay();
        }, { passive: true });

        root.addEventListener('mouseenter', stopAutoplay);
        root.addEventListener('mouseleave', startAutoplay);

        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                stopAutoplay();
                return;
            }

            startAutoplay();
        });

        applyOrder();
        startAutoplay();

        return {
            advance: advance,
            startAutoplay: startAutoplay
        };
    })();

    var $navToggle = $('.navbar-toggle');
    var $navCollapse = $('.navbar-collapse');
    var $mainNav = $('#main-nav');
    var backToTopProgress = document.querySelector('.back-to-top__progress-circle');
    var backToTopProgressLength = backToTopProgress ? backToTopProgress.getTotalLength() : 0;
    var aboutRevealObserver = null;

    if (backToTopProgress) {
        backToTopProgress.style.strokeDasharray = backToTopProgressLength;
        backToTopProgress.style.strokeDashoffset = backToTopProgressLength;
    }

    function updateMobileNavHeight() {
        var navHeight = $mainNav.find('.navbar-header').outerHeight() || $mainNav.outerHeight() || 82;

        document.documentElement.style.setProperty('--mobile-nav-height', navHeight + 'px');
    }

    updateMobileNavHeight();
    window.setTimeout(function() {
        updateMobileNavHeight();
        updateBackToTop();
    }, 180);

    $navCollapse.on('shown.bs.collapse', function() {
        $navToggle.attr('aria-label', 'Chiudi menu');
        updateMobileNavHeight();
    });

    $navCollapse.on('hidden.bs.collapse', function() {
        $navToggle.attr('aria-label', 'Apri menu');
        updateMobileNavHeight();
    });

    $(window).scroll(function(event) {
        Scroll();
        updateBackToTop();
    });

    $(window).on('resize orientationchange', function() {
        disableAboutWowOnMobile();
        initAboutMobileReveal();
        updateMobileNavHeight();
        updateBackToTop();
    });

    $(window).on('load', function() {
        disableAboutWowOnMobile();
        initAboutMobileReveal();
        updateMobileNavHeight();
        updateBackToTop();
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function() {
            disableAboutWowOnMobile();
            initAboutMobileReveal();
            updateMobileNavHeight();
            updateBackToTop();
        });
    }

    function disableAboutWowOnMobile() {
        if (window.innerWidth >= 768) {
            return;
        }

        $('#about .wow').each(function() {
            var $element = $(this);

            $element.removeClass('wow fadeInDown fadeInLeft fadeInRight fadeInUp animated');
            $element.addClass('wow-mobile-static');
            $element.css({
                visibility: 'visible',
                animationName: 'none'
            });
        });
    }

    disableAboutWowOnMobile();

    function initAboutMobileReveal() {
        var isMobile = window.innerWidth < 768;
        var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var items = Array.prototype.slice.call(document.querySelectorAll('#about .section-header, #about .about-visual, #about .about-card'));

        if (aboutRevealObserver) {
            aboutRevealObserver.disconnect();
            aboutRevealObserver = null;
        }

        if (!items.length) {
            return;
        }

        items.forEach(function(item) {
            item.classList.remove('about-mobile-reveal', 'about-mobile-reveal--delay-1', 'about-mobile-reveal--delay-2', 'is-visible');
        });

        if (!isMobile) {
            return;
        }

        items.forEach(function(item, index) {
            item.classList.add('about-mobile-reveal');

            if (index === 1) {
                item.classList.add('about-mobile-reveal--delay-1');
            } else if (index === 2) {
                item.classList.add('about-mobile-reveal--delay-2');
            }
        });

        if (!('IntersectionObserver' in window) || prefersReducedMotion) {
            items.forEach(function(item) {
                item.classList.add('is-visible');
            });
            return;
        }

        aboutRevealObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    aboutRevealObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '0px 0px -12% 0px',
            threshold: 0.18
        });

        items.forEach(function(item) {
            var rect = item.getBoundingClientRect();
            var isAlreadyNearViewport = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;

            if (isAlreadyNearViewport) {
                item.classList.add('is-visible');
                return;
            }

            aboutRevealObserver.observe(item);
        });
    }

    initAboutMobileReveal();

    $('a[href^="#"]').not('[href="#"]').on('click', function(event) {
        var $target = $(this.hash);

        if (!$target.length) {
            return;
        }

        event.preventDefault();

        var link = this;
        $('html, body').animate({
            scrollTop: $target.offset().top - 5
        }, 1000);

        if (window.innerWidth < 768 && $navCollapse.hasClass('in')) {
            $navCollapse.collapse('hide');
        }

        window.setTimeout(function() {
            link.blur();
        }, 120);
    });
 
    function Scroll() {
        var sections = [];
        var winTop = $(window).scrollTop();
        var rangeTop = 200;

        $('.navbar-collapse').find('.scroll a').each(function() {
            var $target = $($(this).attr('href'));

            if ($target.length) {
                sections.push({
                    top: $target.offset().top,
                    index: sections.length
                });
            }
        });

        if (!sections.length) {
            return;
        }

        var activeIndex = 0;
        var docBottom = winTop + $(window).height();
        var pageBottom = $(document).height() - 20;

        $.each(sections, function(i, section) {
            if (winTop >= section.top - rangeTop) {
                activeIndex = section.index;
            }
        });

        if (docBottom >= pageBottom) {
            activeIndex = sections[sections.length - 1].index;
        }

        $('.navbar-collapse li.scroll')
            .removeClass('active')
            .eq(activeIndex).addClass('active');
    };

    function updateBackToTop() {
        var $backToTop = $('#tohash');
        var scrollTop = $(window).scrollTop();
        var scrollRange = $(document).height() - $(window).height();
        var progress = scrollRange > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollRange) * 100)) : 0;

        $backToTop.toggleClass('is-visible', scrollTop > 500);
        if (backToTopProgress) {
            backToTopProgress.style.strokeDashoffset = backToTopProgressLength * (1 - progress / 100);
        }
    }

    updateBackToTop();
    Scroll();

  
    if (typeof WOW !== 'undefined') {
        new WOW().init();
    }
 

});
