const testimonialSwiper = new Swiper('.testimonial__swiper', {
  loop: true,
  slidesPerView: 'auto',
  centeredSlides: true,
  spaceBetween: 18,
  grabCursor: true,
  speed: 550,
  watchSlidesProgress: true,
  keyboard: { enabled: true },
  effect: 'coverflow',
  coverflowEffect: {
    rotate: 0,
    stretch: 0,
    depth: 90,
    modifier: 1,
    scale: .94,
    slideShadows: false
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev'
  },
  autoplay: {
    delay: 4200,
    disableOnInteraction: false,
    pauseOnMouseEnter: true
  },
  breakpoints: {
    700: { spaceBetween: 22 },
    1024: { spaceBetween: 26 }
  }
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (reduceMotion.matches) testimonialSwiper.autoplay.stop();

