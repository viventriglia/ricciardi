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

        var $slides = $slider.find('.hero-mobile-slide');
        var currentIndex = 0;
        var intervalId = null;
        var slideDelay = 5600;

        function setActiveSlide(index) {
            currentIndex = index;
            $slides.removeClass('is-active').eq(index).addClass('is-active');
        }

        function stop() {
            if (intervalId) {
                window.clearInterval(intervalId);
                intervalId = null;
            }
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
            setActiveSlide(currentIndex);
            stop();
            start();
        }

        setActiveSlide(0);
        sync();

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
        var allItems = Array.prototype.slice.call(track.querySelectorAll('.brand-item'));
        var pageCount = 0;
        var currentPage = 0;
        var autoplayId = null;
        var resizeTimer = null;

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

        rebuild();

        return {
            rebuild: rebuild
        };
    })();

    var navGlow = (function() {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            return null;
        }

        var links = document.querySelectorAll('#main-nav .navbar-nav > li > a');
        if (!links.length) {
            return null;
        }

        Array.prototype.forEach.call(links, function(link) {
            link.addEventListener('mousemove', function(event) {
                var bounds = link.getBoundingClientRect();
                var x = ((event.clientX - bounds.left) / bounds.width) * 100;
                var y = ((event.clientY - bounds.top) / bounds.height) * 100;

                link.style.setProperty('--nav-glow-x', x + '%');
                link.style.setProperty('--nav-glow-y', y + '%');
            });

            link.addEventListener('mouseleave', function() {
                link.style.removeProperty('--nav-glow-x');
                link.style.removeProperty('--nav-glow-y');
            });
        });

        return true;
    })();
     
    $(window).scroll(function(event) {
        Scroll();
    });

    $('.navbar-collapse ul li a').on('click', function() {
        var link = this;
        $('html, body').animate({
            scrollTop: $(this.hash).offset().top - 5
        }, 1000);
        window.setTimeout(function() {
            link.blur();
        }, 120);
        return false;
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

    $('#tohash').on('click', function() {
        $('html, body').animate({
            scrollTop: $(this.hash).offset().top - 5
        }, 1000);
        return false;
    });

  
    new WOW().init();
     
    smoothScroll.init();

    
    $(window).load(function() {
        'use strict';
        var $portfolio_selectors = $('.portfolio-filter >li>a');
        var $portfolio = $('.portfolio-items');
        $portfolio.isotope({
            itemSelector: '.portfolio-item',
            layoutMode: 'fitRows'
        });

        $portfolio_selectors.on('click', function() {
            $portfolio_selectors.removeClass('active');
            $(this).addClass('active');
            var selector = $(this).attr('data-filter');
            $portfolio.isotope({
                filter: selector
            });
            return false;
        });
    });

    $(document).ready(function() {
   
        $.fn.animateNumbers = function(stop, commas, duration, ease) {
            return this.each(function() {
                var $this = $(this);
                var start = parseInt($this.text().replace(/,/g, ""));
                commas = (commas === undefined) ? true : commas;
                $({
                    value: start
                }).animate({
                    value: stop
                }, {
                    duration: duration == undefined ? 1000 : duration,
                    easing: ease == undefined ? "swing" : ease,
                    step: function() {
                        $this.text(Math.floor(this.value));
                        if (commas) {
                            $this.text($this.text().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
                        }
                    },
                    complete: function() {
                        if (parseInt($this.text()) !== stop) {
                            $this.text(stop);
                            if (commas) {
                                $this.text($this.text().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
                            }
                        }
                    }
                });
            });
        };

        $('.business-stats').bind('inview', function(event, visible, visiblePartX, visiblePartY) {
            var $this = $(this);
            if (visible) {
                $this.animateNumbers($this.data('digit'), false, $this.data('duration'));
                $this.unbind('inview');
            }
        });
    });

 
    $("a[rel^='prettyPhoto']").prettyPhoto({
        social_tools: false
    });
 

});
