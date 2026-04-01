/*
Author: webthemez.com
Author URL: http://webthemez.com
*/
jQuery(function($) {
    'use strict';

    var heroSlider = (function() {
        var $slider = $('.hero-mobile-slider');
        if (!$slider.length) {
            return null;
        }

        var $allSlides = $slider.find('.hero-mobile-slide');
        var $slides = $();
        var currentIndex = 0;
        var intervalId = null;
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

        function syncVideos() {
            $allSlides.find('video').each(function() {
                var video = this;
                if (!video) {
                    return;
                }

                video.pause();
            });

            var activeVideo = $slides.eq(currentIndex).find('video').get(0);

            if (!activeVideo) {
                return;
            }

            activeVideo.currentTime = 0;
            playVideo(activeVideo);
        }

        function setActiveSlide(index) {
            if (!$slides.length) {
                return;
            }

            currentIndex = index;
            $allSlides.removeClass('is-active');
            $slides.eq(index).addClass('is-active');
            syncVideos();
        }

        function stop() {
            if (intervalId) {
                window.clearInterval(intervalId);
                intervalId = null;
            }

            $allSlides.find('video').each(function() {
                var video = this;
                if (!video) {
                    return;
                }

                video.pause();
            });
        }

        function start() {
            if (intervalId || $slides.length < 2) {
                return;
            }

            intervalId = window.setInterval(function() {
                setActiveSlide((currentIndex + 1) % $slides.length);
            }, slideDelay);
        }

        function sync() {
            $slides = getVisibleSlides();

            if (!$slides.length) {
                stop();
                return;
            }

            currentIndex = Math.min(currentIndex, $slides.length - 1);
            setActiveSlide(currentIndex);
            stop();
            start();
        }

        $slides = getVisibleSlides();
        setActiveSlide(0);

        $allSlides.find('video').each(function() {
            var video = this;
            video.addEventListener('loadeddata', function() {
                if ($slides.eq(currentIndex).find('video').get(0) === video) {
                    playVideo(video);
                }
            });

            video.addEventListener('canplay', function() {
                if ($slides.eq(currentIndex).find('video').get(0) === video) {
                    playVideo(video);
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
            start();
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
        var autoplayDelay = 10000;
        var manifestItems = Array.isArray(window.__BRAND_LOGOS__) ? window.__BRAND_LOGOS__ : [];
        var allItems = [];
        var pageCount = 0;
        var currentPage = 0;
        var autoplayId = null;
        var resizeTimer = null;

        function createBrandItem(brand) {
            var item = document.createElement('div');
            var slot = document.createElement('div');
            var image = document.createElement('img');

            item.className = 'brand-item';
            slot.className = 'brand-logo-slot';
            image.src = brand.src;
            image.alt = brand.alt || '';
            image.loading = 'lazy';
            image.decoding = 'async';

            slot.appendChild(image);
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

    $navCollapse.on('shown.bs.collapse', function() {
        $navToggle.attr('aria-label', 'Chiudi menu');
    });

    $navCollapse.on('hidden.bs.collapse', function() {
        $navToggle.attr('aria-label', 'Apri menu');
    });

    $(window).scroll(function(event) {
        Scroll();
        updateBackToTop();
    });

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
        $('#tohash').toggleClass('is-visible', $(window).scrollTop() > 500);
    }

    updateBackToTop();
    Scroll();

  
    new WOW().init();
 

});
