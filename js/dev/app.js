(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const getDigFormat = (value, sepp = " ") => value.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, `$1${sepp}`);
const uniqArray = (array) => [...new Set(array)];
const dataMediaQueries = (array, dataSetValue) => {
  const media = Array.from(array).filter((item2) => item2.dataset[dataSetValue]);
  if (!media.length) return [];
  const breakpointsArray = [];
  media.forEach((item2) => {
    const params = item2.dataset[dataSetValue];
    const breakpoint = {};
    const paramsArray = params.split(",");
    breakpoint.value = paramsArray[0];
    breakpoint.type = paramsArray[1] ? paramsArray[1].trim() : "max";
    breakpoint.item = item2;
    breakpointsArray.push(breakpoint);
  });
  let mdQueries = breakpointsArray.map((item2) => `(${item2.type}-width: ${item2.value}px),${item2.value},${item2.type}`);
  mdQueries = uniqArray(mdQueries);
  const mdQueriesArray = [];
  if (mdQueries.length) {
    mdQueries.forEach((breakpoint) => {
      const paramsArray = breakpoint.split(",");
      const mediaBreakpoint = paramsArray[1];
      const mediaType = paramsArray[2];
      const matchMedia = window.matchMedia(paramsArray[0]);
      const itemsArray = breakpointsArray.filter((item2) => {
        if (item2.value === mediaBreakpoint && item2.type === mediaType) {
          return true;
        }
      });
      mdQueriesArray.push({
        itemsArray,
        matchMedia
      });
    });
    return mdQueriesArray;
  }
};
const debounce = (func, delay = 250) => {
  return function(...args) {
    let timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};
const objectModules = {};
class ScrollWatcher {
  constructor(options) {
    let defaultConfig = {
      logging: true,
      init: true
    };
    this.config = { ...defaultConfig, ...options };
    this.observer;
    if (this.config.init && !document.documentElement.classList.contains("watcher")) {
      this.scrollWatcherRun();
    }
  }
  scrollWatcherUpdate() {
    this.scrollWatcherRun();
  }
  scrollWatcherRun() {
    document.documentElement.classList.add("watcher");
    this.scrollWatcherConstructor(document.querySelectorAll("[data-watcher]"));
  }
  scrollWatcherConstructor(watchItems) {
    if (!watchItems.length) {
      this.#scrollWatcherLogging("There are no objects to observe.");
      return;
    }
    this.#scrollWatcherLogging(`I follow the objects (${watchItems.length})...`);
    const uniqParams = uniqArray(
      Array.from(watchItems).map((item2) => {
        if (item2.dataset.watch === "navigator" && !item2.dataset.watchThreshold) {
          let thresholdValue;
          if (item2.clientHeight > 2) {
            thresholdValue = window.innerHeight / 2 / (item2.clientHeight - 1);
            thresholdValue = Math.min(thresholdValue, 1);
          } else {
            thresholdValue = 1;
          }
          item2.setAttribute("data-watcher-threshold", thresholdValue.toFixed(2));
        }
        const { watchRoot, watchMargin, watchThreshold } = item2.dataset;
        return `${watchRoot || null}|${watchMargin || "0px"}|${watchThreshold || 0}`;
      })
    );
    uniqParams.forEach((uniqParam) => {
      const [rootParam, marginParam, thresholdParam] = uniqParam.split("|");
      const paramsWatch = {
        root: rootParam,
        margin: marginParam,
        threshold: thresholdParam
      };
      const groupItems = Array.from(watchItems).filter((item2) => {
        let { watchRoot, watchMargin, watchThreshold } = item2.dataset;
        watchRoot = watchRoot ? watchRoot : null;
        watchMargin = watchMargin ? watchMargin : "0px";
        watchThreshold = watchThreshold ? watchThreshold : 0;
        if (String(watchRoot) === paramsWatch.root && String(watchMargin) === paramsWatch.margin && String(watchThreshold) === paramsWatch.threshold) {
          return item2;
        }
      });
      const configWatcher = this.getScrollWatcherConfig(paramsWatch);
      this.scrollWatcherInit(groupItems, configWatcher);
    });
  }
  getScrollWatcherConfig(paramsWatch) {
    const { root, margin, threshold } = paramsWatch;
    let configWatcher = {};
    if (document.querySelector(root)) {
      configWatcher.root = document.querySelector(root);
    } else if (root !== "null") {
      this.#scrollWatcherLogging(`The parent object ${root} does not exist on the page`);
    }
    configWatcher.rootMargin = margin;
    if (margin.indexOf("px") < 0 && margin.indexOf("%") < 0) {
      this.#scrollWatcherLogging(`The data-watcher-margin setting must be set in PX or %`);
      return;
    }
    function prxArrThreshold(arr) {
      arr = [];
      for (let i = 0; i <= 1; i += 5e-3) {
        arr.push(i);
      }
      return arr;
    }
    const thresholdArray = threshold === "prx" ? prxArrThreshold(threshold) : threshold.split(",");
    configWatcher.threshold = thresholdArray;
    return configWatcher;
  }
  scrollWatcherInit(items, configWatcher) {
    this.scrollWatcherCreate(configWatcher);
    items.forEach((item2) => this.observer.observe(item2));
  }
  scrollWatcherCreate(configWatcher) {
    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        this.scrollWatcherCallback(entry, observer);
      });
    }, configWatcher);
  }
  scrollWatcherCallback(entry, observer) {
    const { target, isIntersecting } = entry;
    this.scrollWatcherIntersecting(isIntersecting, target);
    target.hasAttribute("data-watcher-once") && isIntersecting ? this.scrollWatcherOff(target, observer) : null;
    document.dispatchEvent(
      new CustomEvent("watcherCallback", {
        detail: {
          entry
        }
      })
    );
  }
  scrollWatcherIntersecting(isIntersecting, target) {
    if (isIntersecting) {
      !target.classList.contains("watcher-view") ? target.classList.add("watcher-view") : null;
      this.#scrollWatcherLogging(`I see ${target.classList}, added watcher-view class`);
    } else {
      target.classList.contains("watcher-view") ? target.classList.remove("watcher-view") : null;
      this.#scrollWatcherLogging(`I don't see ${target.classList}, I removed the watcher-view class`);
    }
  }
  scrollWatcherOff(target, observer) {
    observer.unobserve(target);
    this.#scrollWatcherLogging(`I stopped following ${target.classList}`);
  }
  #scrollWatcherLogging(message) {
    if (this.config.logging) ;
  }
}
if (document.querySelector("[data-watcher]")) {
  objectModules.watcher = new ScrollWatcher({});
}
let bodyLockStatus = true;
const bodyUnlock = (delay = 500) => {
  if (bodyLockStatus) {
    const lockPaddingElements = document.querySelectorAll("[data-lp]");
    setTimeout(() => {
      lockPaddingElements.forEach((lockPaddingElement) => {
        lockPaddingElement.style.paddingRight = "";
      });
      document.body.style.paddingRight = "";
      document.documentElement.classList.remove("lock");
    }, delay);
    bodyLockStatus = false;
    setTimeout(() => {
      bodyLockStatus = true;
    }, delay);
  }
};
const bodyLock = (delay = 500) => {
  if (bodyLockStatus) {
    const lockPaddingElements = document.querySelectorAll("[data-lp]");
    const lockPaddingValue = window.innerWidth - document.body.offsetWidth + "px";
    lockPaddingElements.forEach((lockPaddingElement) => {
      lockPaddingElement.style.paddingRight = lockPaddingValue;
    });
    document.body.style.paddingRight = lockPaddingValue;
    document.documentElement.classList.add("lock");
    bodyLockStatus = false;
    setTimeout(() => {
      bodyLockStatus = true;
    }, delay);
  }
};
const bodyLockToggle = (delay = 500) => {
  document.documentElement.classList.contains("lock") ? bodyUnlock(delay) : bodyLock(delay);
};
const menuClose = () => {
  bodyUnlock();
  document.documentElement.classList.remove("menu-open");
};
const gotoBlock = (targetSelector, config = {}) => {
  const targetBlockElement = document.querySelector(targetSelector);
  if (!targetBlockElement) {
    return;
  }
  let defaultConfig = {
    noHeader: false,
    offsetTop: 0
  };
  const { noHeader, offsetTop } = { ...defaultConfig, ...config };
  const getHeaderHeight = () => {
    const headerElement = document.querySelector("header.header");
    let headerHeight = 0;
    if (!headerElement.classList.contains("header-scroll")) {
      headerElement.style.cssText = `transition-duration: 0s;`;
      headerElement.classList.add("header-scroll");
      headerHeight = headerElement.offsetHeight;
      headerElement.classList.remove("header-scroll");
      setTimeout(() => {
        headerElement.style.cssText = ``;
      }, 0);
    } else {
      headerHeight = headerElement.offsetHeight;
    }
    return headerHeight;
  };
  const headerItemHeight = noHeader ? getHeaderHeight() : 0;
  if (document.documentElement.classList.contains("menu-open")) menuClose();
  const targetBlockElementPosition = targetBlockElement.getBoundingClientRect().top + scrollY - headerItemHeight - offsetTop;
  window.scrollTo({
    top: targetBlockElementPosition,
    behavior: "smooth"
  });
};
const _slideUp = (target, duration = 500, showmore = 0) => {
  if (!target.classList.contains("slide")) {
    target.classList.add("slide");
    target.style.transitionProperty = "height, margin, padding";
    target.style.transitionDuration = duration + "ms";
    target.style.height = `${target.offsetHeight}px`;
    target.offsetHeight;
    target.style.overflow = "hidden";
    target.style.height = showmore ? `${showmore}px` : `0px`;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    window.setTimeout(() => {
      target.hidden = !showmore ? true : false;
      !showmore ? target.style.removeProperty("height") : null;
      target.style.removeProperty("padding-top");
      target.style.removeProperty("padding-bottom");
      target.style.removeProperty("margin-top");
      target.style.removeProperty("margin-bottom");
      !showmore ? target.style.removeProperty("overflow") : null;
      target.style.removeProperty("transition-duration");
      target.style.removeProperty("transition-property");
      target.classList.remove("slide");
      document.dispatchEvent(
        new CustomEvent("slideUpDone", {
          detail: {
            target
          }
        })
      );
    }, duration);
  }
};
const _slideDown = (target, duration = 500, showmore = 0) => {
  if (!target.classList.contains("slide")) {
    target.classList.add("slide");
    target.hidden = target.hidden ? false : null;
    showmore ? target.style.removeProperty("height") : null;
    let height = target.offsetHeight;
    target.style.overflow = "hidden";
    target.style.height = showmore ? `${showmore}px` : `0px`;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    target.offsetHeight;
    target.style.transitionProperty = "height, margin, padding";
    target.style.transitionDuration = duration + "ms";
    target.style.height = height + "px";
    target.style.removeProperty("padding-top");
    target.style.removeProperty("padding-bottom");
    target.style.removeProperty("margin-top");
    target.style.removeProperty("margin-bottom");
    window.setTimeout(() => {
      target.style.removeProperty("height");
      target.style.removeProperty("overflow");
      target.style.removeProperty("transition-duration");
      target.style.removeProperty("transition-property");
      target.classList.remove("slide");
      document.dispatchEvent(
        new CustomEvent("slideDownDone", {
          detail: {
            target
          }
        })
      );
    }, duration);
  }
};
const _slideToggle = (target, duration = 500) => {
  target.hidden ? _slideDown(target, duration) : _slideUp(target, duration);
};
function pageNavigation() {
  document.addEventListener("click", pageNavigationAction);
  document.addEventListener("watcherCallback", pageNavigationAction);
  function pageNavigationAction(e) {
    if (e.type === "click") {
      const { target } = e;
      if (target.closest("[data-goto]")) {
        const gotoLink = target.closest("[data-goto]");
        const gotoLinkSelector = gotoLink.dataset.goto ? gotoLink.dataset.goto : "";
        const noHeader = gotoLink.hasAttribute("data-goto-header") ? true : false;
        const offsetTop = gotoLink.dataset.gotoTop ? parseInt(gotoLink.dataset.gotoTop) : 0;
        gotoBlock(gotoLinkSelector, {
          noHeader,
          offsetTop
        });
        e.preventDefault();
      }
    }
    if (e.type === "watcherCallback" && e.detail) {
      const {
        entry: { target, isIntersecting }
      } = e.detail;
      if (target.dataset.watch === "navigator") {
        let navigatorCurrentItem;
        if (target.id && document.querySelector(`[data-goto="#${target.id}"]`)) {
          navigatorCurrentItem = document.querySelector(`[data-goto="#${target.id}"]`);
        } else if (target.classList.length) {
          for (let index = 0; index < target.classList.length; index++) {
            const element = target.classList[index];
            if (document.querySelector(`[data-goto=".${element}"]`)) {
              navigatorCurrentItem = document.querySelector(`[data-goto=".${element}"]`);
              break;
            }
          }
        }
        if (isIntersecting) {
          navigatorCurrentItem ? navigatorCurrentItem.classList.add("navigator-active") : null;
        } else {
          navigatorCurrentItem ? navigatorCurrentItem.classList.remove("navigator-active") : null;
        }
      }
    }
  }
}
pageNavigation();
const menuInit = () => {
  const burger = document.querySelector("[data-menu]");
  if (burger) {
    document.addEventListener("click", ({ target }) => {
      if (bodyLockStatus && target.closest("[data-menu]")) {
        bodyLockToggle();
        document.documentElement.classList.toggle("menu-open");
      }
    });
  }
};
menuInit();
let addWindowScrollEvent = false;
function headerScroll() {
  addWindowScrollEvent = true;
  const header = document.querySelector("header.header");
  const headerShow = header.hasAttribute("data-header-scroll-show");
  const headerShowTimer = +header.dataset.scrollShow || 500;
  const startPoint = +header.dataset.scroll || 1;
  let scrollDirection = 0;
  let timer;
  document.addEventListener("windowScroll", (e) => {
    const { scrollTop } = e.detail;
    if (scrollTop >= startPoint) {
      toggleClass(header, "header--scroll", true);
      if (headerShow) {
        if (scrollTop > scrollDirection) {
          clearTimeout(timer);
          toggleClass(header, "header--show", false);
        } else {
          toggleClass(header, "header--show", true);
        }
        timer = setTimeout(() => {
          toggleClass(header, "header--show", true);
        }, headerShowTimer);
      }
    } else {
      toggleClass(header, "header--scroll", false);
      if (headerShow) {
        toggleClass(header, "header--show", false);
      }
    }
    scrollDirection = scrollTop <= 0 ? 0 : scrollTop;
  });
  function toggleClass(element, className, condition) {
    if (condition) {
      if (!element.classList.contains(className)) {
        element.classList.add(className);
      }
    } else {
      if (element.classList.contains(className)) {
        element.classList.remove(className);
      }
    }
  }
}
setTimeout(() => {
  if (addWindowScrollEvent) {
    window.addEventListener("scroll", () => {
      const scrollTop = window.scrollY;
      const windowScroll = new CustomEvent("windowScroll", {
        detail: { scrollTop }
      });
      document.dispatchEvent(windowScroll);
    });
  }
}, 0);
headerScroll();
function accordion() {
  const accordionsRegular = document.querySelectorAll("[data-accordions]");
  if (!accordionsRegular.length) return;
  const accordionsArray = Array.from(accordionsRegular).filter((item2) => !item2.dataset.accordions.split(",")[0]);
  if (accordionsArray.length > 0) {
    initAccordions(accordionsArray);
  }
  let mdQueriesArray = dataMediaQueries(accordionsRegular, "accordions");
  if (mdQueriesArray && mdQueriesArray.length) {
    mdQueriesArray.forEach((mdQueriesItem) => {
      mdQueriesItem.matchMedia.addEventListener("change", () => {
        initAccordions(mdQueriesItem.itemsArray, mdQueriesItem.matchMedia);
      });
      initAccordions(mdQueriesItem.itemsArray, mdQueriesItem.matchMedia);
    });
  }
  function initAccordions(accordionsArray2, matchMedia = false) {
    accordionsArray2.forEach((accordionBlock) => {
      const currentAccordionBlock = matchMedia ? accordionBlock.item : accordionBlock;
      if (matchMedia.matches || !matchMedia) {
        currentAccordionBlock.classList.add("accordion-init");
        initAccordionContent(currentAccordionBlock);
      } else {
        currentAccordionBlock.classList.remove("accordion-init");
        initAccordionContent(currentAccordionBlock, false);
      }
    });
  }
  function initAccordionContent(accordionBlock, hideAccordionContent2 = true) {
    const accordionItems = accordionBlock.querySelectorAll("details");
    if (accordionItems.length > 0) {
      accordionItems.forEach((accordionItem) => {
        const accordionControl = accordionItem.querySelector("summary");
        if (hideAccordionContent2) {
          accordionControl.removeAttribute("tabindex");
          if (!accordionItem.hasAttribute("data-open")) {
            accordionItem.open = false;
            accordionControl.nextElementSibling.hidden = true;
            updateAccordionAttributes(accordionControl);
          } else {
            accordionControl.classList.add("is-active");
            accordionItem.open = true;
            updateAccordionAttributes(accordionControl, true);
          }
        } else {
          accordionControl.setAttribute("tabindex", "-1");
          accordionControl.classList.remove("is-active");
          accordionItem.open = true;
          accordionControl.nextElementSibling.hidden = false;
          updateAccordionAttributes(accordionControl, true);
        }
      });
    }
  }
  document.addEventListener("click", accordionAction);
  function accordionAction(e) {
    const { target } = e;
    if (target.closest("summary") && target.closest("[data-accordions]")) {
      e.preventDefault();
      if (target.closest("[data-accordions]").classList.contains("accordion-init")) {
        const accordionControl = target.closest("summary");
        const accordionBlock = accordionControl.closest("details");
        const accordionParent = accordionControl.closest("[data-accordions]");
        const oneAccordion = accordionParent.hasAttribute("data-one-accordion");
        const scrollAccordion = accordionBlock.hasAttribute("data-accordion-scroll");
        const accordionDuration = getAccordionDuration(accordionParent);
        if (!accordionParent.querySelectorAll(".slide").length) {
          if (oneAccordion && !accordionBlock.open) {
            hideAccordionContent(accordionParent);
          }
          !accordionBlock.open ? accordionBlock.open = true : setTimeout(() => accordionBlock.open = false, accordionDuration);
          accordionControl.classList.toggle("is-active");
          _slideToggle(accordionControl.nextElementSibling, accordionDuration);
          accordionControl.classList.contains("is-active") ? updateAccordionAttributes(accordionControl, true) : updateAccordionAttributes(accordionControl);
          if (scrollAccordion && accordionControl.classList.contains("is-active")) {
            setScrollAccordion(accordionBlock);
          }
        }
      }
    }
    if (!target.closest("[data-accordions]")) {
      const accordionsClose = document.querySelectorAll("[data-accordion-close]");
      if (accordionsClose.length > 0) {
        accordionsClose.forEach((accordionClose) => {
          const accordionParent = accordionClose.closest("[data-accordions]");
          const accordionCloseBlock = accordionClose.parentNode;
          if (accordionParent.classList.contains("accordion-init")) {
            const accordionDuration = getAccordionDuration(accordionParent);
            accordionClose.classList.remove("is-active");
            _slideUp(accordionClose.nextElementSibling, accordionDuration);
            setTimeout(() => accordionCloseBlock.open = false, accordionDuration);
            updateAccordionAttributes(accordionClose);
          }
        });
      }
    }
  }
  function hideAccordionContent(accordionParent) {
    const accordionActiveBlock = accordionParent.querySelector("details[open]");
    if (accordionActiveBlock && !accordionParent.querySelectorAll(".slide").length) {
      const accordionActiveControl = accordionActiveBlock.querySelector("summary");
      const accordionDuration = getAccordionDuration(accordionParent);
      accordionActiveControl.classList.remove("is-active");
      _slideUp(accordionActiveControl.nextElementSibling, accordionDuration);
      setTimeout(() => accordionActiveBlock.open = false, accordionDuration);
      updateAccordionAttributes(accordionActiveControl);
    }
  }
  function setScrollAccordion(accordionBlock) {
    const scrollAccordionValue = accordionBlock.dataset.accordionScroll;
    const scrollAccordionOffset = scrollAccordionValue ? +scrollAccordionValue : 0;
    const scrollAccordionNoHeader = accordionBlock.hasAttribute("data-accordion-scroll-noheader") ? document.querySelector(".header").offsetHeight : 0;
    window.scrollTo({
      top: accordionBlock.offsetTop - (scrollAccordionOffset + scrollAccordionNoHeader),
      behavior: "smooth"
    });
  }
  function getAccordionDuration(accordionParent) {
    return +accordionParent.dataset.accordionDuration || 500;
  }
  function updateAccordionAttributes(accordionControl, isOpen = false) {
    const ariaExpanded = isOpen ? "true" : "false";
    const ariaHidden = isOpen ? "false" : "true";
    accordionControl.setAttribute("aria-expanded", ariaExpanded);
    accordionControl.nextElementSibling.setAttribute("aria-hidden", ariaHidden);
  }
}
accordion();
function preloader() {
  const isPreloaded = localStorage.getItem(location.href) && document.querySelector('[data-preloader="true"]');
  if (!isPreloaded) {
    const preloaderTemplate = `
      <div class="preloader">
        <div class="preloader__loader">
          <div class="preloader__counter"></div>
        </div>
      </div>`;
    document.querySelector("html").insertAdjacentHTML("beforeend", preloaderTemplate);
    const preloader2 = document.querySelector(".preloader");
    document.documentElement.classList.add("loading");
    document.documentElement.classList.add("lock");
    window.addEventListener("load", () => {
      setTimeout(() => {
        addLoadedClass();
        preloader2.remove();
      }, 1e3);
    });
    const preloaderOnce = () => localStorage.setItem(location.href, "preloaded");
    if (document.querySelector('[data-preloader="true"]')) {
      preloaderOnce();
    }
  } else {
    addLoadedClass();
  }
  function addLoadedClass() {
    document.documentElement.classList.add("loaded");
    document.documentElement.classList.remove("loading");
    document.documentElement.classList.remove("lock");
  }
}
window.addEventListener("DOMContentLoaded", preloader);
const createMarquee = () => {
  const marqueeItems = document.querySelectorAll("[data-marquee]");
  if (!marqueeItems.length) return;
  const ATTR_NAMES = {
    wrapper: "data-marquee-wrapper",
    body: "data-marquee-body",
    item: "data-marquee-item"
  };
  const { head } = document;
  const onWindowWidthResize = (cb) => {
    if (typeof cb !== "function") return;
    let prevWidth = 0;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (prevWidth !== currentWidth) {
        prevWidth = currentWidth;
        cb();
      }
    };
    window.addEventListener("resize", debounce(handleResize, 50));
    handleResize();
  };
  const buildMarquee = (marqueeItem) => {
    if (!marqueeItem) return;
    const childElements = marqueeItem.children;
    if (!childElements.length) return;
    marqueeItem.setAttribute(ATTR_NAMES.wrapper, "");
    Array.from(childElements).forEach((childItem) => childItem.setAttribute(ATTR_NAMES.item, ""));
    marqueeItem.innerHTML = `<div ${ATTR_NAMES.body}>${marqueeItem.innerHTML}</div>`;
  };
  const getElSize = (el, isVertical) => isVertical ? el.offsetHeight : el.offsetWidth;
  marqueeItems.forEach((marqueeItem) => {
    if (!marqueeItem) return;
    buildMarquee(marqueeItem);
    const marqueeBody = marqueeItem.firstElementChild;
    if (!marqueeBody) return;
    const dataMarqueeSpace = parseFloat(marqueeItem.getAttribute("data-marquee-space"));
    const items = marqueeItem.querySelectorAll(`[${ATTR_NAMES.item}]`);
    const speed = parseFloat(marqueeItem.getAttribute("data-marquee-speed")) / 10 || 100;
    const isMousePaused = marqueeItem.hasAttribute("data-marquee-pause");
    const direction = marqueeItem.getAttribute("data-marquee-direction");
    const isVertical = direction === "bottom" || direction === "top";
    const animName = `marqueeAnimation-${Math.floor(Math.random() * 1e7)}`;
    let spaceBetweenItem = parseFloat(window.getComputedStyle(items[0])?.getPropertyValue("margin-right"));
    let spaceBetween = spaceBetweenItem ? spaceBetweenItem : !isNaN(dataMarqueeSpace) ? dataMarqueeSpace : 30;
    let startPosition = parseFloat(marqueeItem.getAttribute("data-marquee-start")) || 0;
    let cacheArray = [];
    let sumSize = 0;
    let firstScreenVisibleSize = 0;
    let initialSizeElements = 0;
    let initialElementsLength = marqueeBody.children.length;
    let index = 0;
    let counterDuplicateElements = 0;
    const initEvents = () => {
      if (startPosition) {
        marqueeBody.addEventListener("animationiteration", onChangeStartPosition);
      }
      if (!isMousePaused) return;
      marqueeBody.removeEventListener("mouseenter", onChangePaused);
      marqueeBody.removeEventListener("mouseleave", onChangePaused);
      marqueeBody.addEventListener("mouseenter", onChangePaused);
      marqueeBody.addEventListener("mouseleave", onChangePaused);
    };
    const onChangeStartPosition = () => {
      startPosition = 0;
      marqueeBody.removeEventListener("animationiteration", onChangeStartPosition);
      onResize();
    };
    const setBaseStyles = (firstScreenVisibleSize2) => {
      let baseStyle = "display: flex; flex-wrap: nowrap;";
      if (isVertical) {
        baseStyle += `
				flex-direction: column;
				position: relative;
				will-change: transform;`;
        if (direction === "bottom") {
          baseStyle += `top: -${firstScreenVisibleSize2}px;`;
        }
      } else {
        baseStyle += `
				position: relative;
				will-change: transform;`;
        if (direction === "right") {
          baseStyle += `inset-inline-start: -${firstScreenVisibleSize2}px;;`;
        }
      }
      marqueeBody.style.cssText = baseStyle;
    };
    const setDirectionAnim = (totalWidth) => {
      switch (direction) {
        case "right":
        case "bottom":
          return totalWidth;
        default:
          return -totalWidth;
      }
    };
    const animation = () => {
      const keyFrameCss = `@keyframes ${animName} {
					 0% {
						 transform: translate${isVertical ? "Y" : "X"}(${!isVertical && window.stateRtl ? -startPosition : startPosition}%);
					 }
					 100% {
						 transform: translate${isVertical ? "Y" : "X"}(${setDirectionAnim(
        !isVertical && window.stateRtl ? -firstScreenVisibleSize : firstScreenVisibleSize
      )}px);
					 }
				 }`;
      const style = document.createElement("style");
      style.classList.add(animName);
      style.innerHTML = keyFrameCss;
      head.append(style);
      marqueeBody.style.animation = `${animName} ${(firstScreenVisibleSize + startPosition * firstScreenVisibleSize / 100) / speed}s infinite linear`;
    };
    const addDublicateElements = () => {
      const parentNodeWidth = getElSize(marqueeItem, isVertical);
      let childrenEl = Array.from(marqueeBody.children);
      sumSize = firstScreenVisibleSize = initialSizeElements = counterDuplicateElements = index = 0;
      if (!childrenEl.length) return;
      if (!cacheArray.length) {
        cacheArray = childrenEl.map((item2) => item2);
      } else {
        childrenEl = [...cacheArray];
      }
      marqueeBody.style.display = "flex";
      if (isVertical) {
        marqueeBody.style.flexDirection = "column";
      }
      marqueeBody.innerHTML = "";
      childrenEl.forEach((item2) => marqueeBody.append(item2));
      childrenEl.forEach((item2) => {
        if (isVertical) {
          item2.style.marginBottom = `${spaceBetween}px`;
        } else {
          item2.style.marginRight = `${spaceBetween}px`;
          item2.style.flexShrink = 0;
        }
        const sizeEl = getElSize(item2, isVertical);
        sumSize += sizeEl + spaceBetween;
        firstScreenVisibleSize += sizeEl + spaceBetween;
        initialSizeElements += sizeEl + spaceBetween;
        counterDuplicateElements += 1;
      });
      const multiplyWidth = parentNodeWidth * 2 + initialSizeElements;
      for (; sumSize < multiplyWidth; index += 1) {
        if (!childrenEl[index]) index = 0;
        const cloneNode = childrenEl[index].cloneNode(true);
        const lastElement = marqueeBody.children[index];
        cloneNode.setAttribute("aria-hidden", true);
        marqueeBody.append(cloneNode);
        sumSize += getElSize(lastElement, isVertical) + spaceBetween;
        if (firstScreenVisibleSize < parentNodeWidth || counterDuplicateElements % initialElementsLength !== 0) {
          counterDuplicateElements += 1;
          firstScreenVisibleSize += getElSize(lastElement, isVertical) + spaceBetween;
        }
      }
      setBaseStyles(firstScreenVisibleSize);
    };
    const correctSpaceBetween = () => {
      if (spaceBetweenItem) {
        items.forEach((item2) => item2.style.removeProperty("margin-right"));
        spaceBetweenItem = parseFloat(window.getComputedStyle(items[0]).getPropertyValue("margin-right"));
        spaceBetween = spaceBetweenItem ? spaceBetweenItem : !isNaN(dataMarqueeSpace) ? dataMarqueeSpace : 30;
      }
    };
    const initMarquee = () => {
      correctSpaceBetween();
      addDublicateElements();
      animation();
      initEvents();
    };
    const onResize = () => {
      head.querySelector(`.${animName}`)?.remove();
      initMarquee();
    };
    const onChangePaused = (e) => {
      const { type, target } = e;
      target.style.animationPlayState = type === "mouseenter" ? "paused" : "running";
    };
    onWindowWidthResize(onResize);
  });
};
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  createMarquee();
}
window["FLS"] = true;
function digitsCounter() {
  function digitsCountersInit(digitsCountersItems) {
    const digitsCounters = digitsCountersItems || document.querySelectorAll("[data-digits-counter]");
    if (digitsCounters.length > 0) {
      digitsCounters.forEach((digitsCounter2) => {
        if (digitsCounter2.hasAttribute("data-go")) {
          return;
        }
        digitsCounter2.setAttribute("data-go", "");
        digitsCounter2.dataset.digitsCounter = digitsCounter2.innerHTML;
        digitsCounter2.innerHTML = `0`;
        digitsCountersAnimate(digitsCounter2);
      });
    }
  }
  function digitsCountersAnimate(counter) {
    const duration = parseFloat(counter.dataset.digitsCounterDuration) || 1e3;
    const startValue = parseFloat(counter.dataset.digitsCounter);
    const format = counter.dataset.digitsCounterFormat || " ";
    const startPosition = 0;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (startPosition + startValue));
      counter.innerHTML = typeof counter.dataset.digitsCounterFormat !== "undefined" ? getDigFormat(value, format) : value;
      progress < 1 ? window.requestAnimationFrame(step) : counter.removeAttribute("data-go");
    };
    window.requestAnimationFrame(step);
  }
  function digitsCounterAction(e) {
    const {
      entry: { target }
    } = e.detail;
    if (target.querySelectorAll("[data-digits-counter]").length > 0) {
      digitsCountersInit(target.querySelectorAll("[data-digits-counter]"));
    }
  }
  document.addEventListener("watcherCallback", digitsCounterAction);
}
digitsCounter();
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var masonry = { exports: {} };
var outlayer = { exports: {} };
var evEmitter$1 = { exports: {} };
var evEmitter = evEmitter$1.exports;
var hasRequiredEvEmitter;
function requireEvEmitter() {
  if (hasRequiredEvEmitter) return evEmitter$1.exports;
  hasRequiredEvEmitter = 1;
  (function(module) {
    (function(global, factory) {
      if (module.exports) {
        module.exports = factory();
      } else {
        global.EvEmitter = factory();
      }
    })(typeof window != "undefined" ? window : evEmitter, function() {
      function EvEmitter() {
      }
      var proto = EvEmitter.prototype;
      proto.on = function(eventName, listener) {
        if (!eventName || !listener) {
          return;
        }
        var events = this._events = this._events || {};
        var listeners = events[eventName] = events[eventName] || [];
        if (listeners.indexOf(listener) == -1) {
          listeners.push(listener);
        }
        return this;
      };
      proto.once = function(eventName, listener) {
        if (!eventName || !listener) {
          return;
        }
        this.on(eventName, listener);
        var onceEvents = this._onceEvents = this._onceEvents || {};
        var onceListeners = onceEvents[eventName] = onceEvents[eventName] || {};
        onceListeners[listener] = true;
        return this;
      };
      proto.off = function(eventName, listener) {
        var listeners = this._events && this._events[eventName];
        if (!listeners || !listeners.length) {
          return;
        }
        var index = listeners.indexOf(listener);
        if (index != -1) {
          listeners.splice(index, 1);
        }
        return this;
      };
      proto.emitEvent = function(eventName, args) {
        var listeners = this._events && this._events[eventName];
        if (!listeners || !listeners.length) {
          return;
        }
        listeners = listeners.slice(0);
        args = args || [];
        var onceListeners = this._onceEvents && this._onceEvents[eventName];
        for (var i = 0; i < listeners.length; i++) {
          var listener = listeners[i];
          var isOnce = onceListeners && onceListeners[listener];
          if (isOnce) {
            this.off(eventName, listener);
            delete onceListeners[listener];
          }
          listener.apply(this, args);
        }
        return this;
      };
      proto.allOff = function() {
        delete this._events;
        delete this._onceEvents;
      };
      return EvEmitter;
    });
  })(evEmitter$1);
  return evEmitter$1.exports;
}
var getSize = { exports: {} };
/*!
 * getSize v2.0.3
 * measure size of elements
 * MIT license
 */
var hasRequiredGetSize;
function requireGetSize() {
  if (hasRequiredGetSize) return getSize.exports;
  hasRequiredGetSize = 1;
  (function(module) {
    (function(window2, factory) {
      if (module.exports) {
        module.exports = factory();
      } else {
        window2.getSize = factory();
      }
    })(window, function factory() {
      function getStyleSize(value) {
        var num = parseFloat(value);
        var isValid = value.indexOf("%") == -1 && !isNaN(num);
        return isValid && num;
      }
      function noop() {
      }
      var logError = typeof console == "undefined" ? noop : function(message) {
        console.error(message);
      };
      var measurements = [
        "paddingLeft",
        "paddingRight",
        "paddingTop",
        "paddingBottom",
        "marginLeft",
        "marginRight",
        "marginTop",
        "marginBottom",
        "borderLeftWidth",
        "borderRightWidth",
        "borderTopWidth",
        "borderBottomWidth"
      ];
      var measurementsLength = measurements.length;
      function getZeroSize() {
        var size = {
          width: 0,
          height: 0,
          innerWidth: 0,
          innerHeight: 0,
          outerWidth: 0,
          outerHeight: 0
        };
        for (var i = 0; i < measurementsLength; i++) {
          var measurement = measurements[i];
          size[measurement] = 0;
        }
        return size;
      }
      function getStyle(elem) {
        var style = getComputedStyle(elem);
        if (!style) {
          logError("Style returned " + style + ". Are you running this code in a hidden iframe on Firefox? See https://bit.ly/getsizebug1");
        }
        return style;
      }
      var isSetup = false;
      var isBoxSizeOuter;
      function setup() {
        if (isSetup) {
          return;
        }
        isSetup = true;
        var div = document.createElement("div");
        div.style.width = "200px";
        div.style.padding = "1px 2px 3px 4px";
        div.style.borderStyle = "solid";
        div.style.borderWidth = "1px 2px 3px 4px";
        div.style.boxSizing = "border-box";
        var body = document.body || document.documentElement;
        body.appendChild(div);
        var style = getStyle(div);
        isBoxSizeOuter = Math.round(getStyleSize(style.width)) == 200;
        getSize2.isBoxSizeOuter = isBoxSizeOuter;
        body.removeChild(div);
      }
      function getSize2(elem) {
        setup();
        if (typeof elem == "string") {
          elem = document.querySelector(elem);
        }
        if (!elem || typeof elem != "object" || !elem.nodeType) {
          return;
        }
        var style = getStyle(elem);
        if (style.display == "none") {
          return getZeroSize();
        }
        var size = {};
        size.width = elem.offsetWidth;
        size.height = elem.offsetHeight;
        var isBorderBox = size.isBorderBox = style.boxSizing == "border-box";
        for (var i = 0; i < measurementsLength; i++) {
          var measurement = measurements[i];
          var value = style[measurement];
          var num = parseFloat(value);
          size[measurement] = !isNaN(num) ? num : 0;
        }
        var paddingWidth = size.paddingLeft + size.paddingRight;
        var paddingHeight = size.paddingTop + size.paddingBottom;
        var marginWidth = size.marginLeft + size.marginRight;
        var marginHeight = size.marginTop + size.marginBottom;
        var borderWidth = size.borderLeftWidth + size.borderRightWidth;
        var borderHeight = size.borderTopWidth + size.borderBottomWidth;
        var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;
        var styleWidth = getStyleSize(style.width);
        if (styleWidth !== false) {
          size.width = styleWidth + // add padding and border unless it's already including it
          (isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
        }
        var styleHeight = getStyleSize(style.height);
        if (styleHeight !== false) {
          size.height = styleHeight + // add padding and border unless it's already including it
          (isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
        }
        size.innerWidth = size.width - (paddingWidth + borderWidth);
        size.innerHeight = size.height - (paddingHeight + borderHeight);
        size.outerWidth = size.width + marginWidth;
        size.outerHeight = size.height + marginHeight;
        return size;
      }
      return getSize2;
    });
  })(getSize);
  return getSize.exports;
}
var utils = { exports: {} };
var matchesSelector = { exports: {} };
var hasRequiredMatchesSelector;
function requireMatchesSelector() {
  if (hasRequiredMatchesSelector) return matchesSelector.exports;
  hasRequiredMatchesSelector = 1;
  (function(module) {
    (function(window2, factory) {
      if (module.exports) {
        module.exports = factory();
      } else {
        window2.matchesSelector = factory();
      }
    })(window, function factory() {
      var matchesMethod = (function() {
        var ElemProto = window.Element.prototype;
        if (ElemProto.matches) {
          return "matches";
        }
        if (ElemProto.matchesSelector) {
          return "matchesSelector";
        }
        var prefixes = ["webkit", "moz", "ms", "o"];
        for (var i = 0; i < prefixes.length; i++) {
          var prefix = prefixes[i];
          var method = prefix + "MatchesSelector";
          if (ElemProto[method]) {
            return method;
          }
        }
      })();
      return function matchesSelector2(elem, selector) {
        return elem[matchesMethod](selector);
      };
    });
  })(matchesSelector);
  return matchesSelector.exports;
}
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils.exports;
  hasRequiredUtils = 1;
  (function(module) {
    (function(window2, factory) {
      if (module.exports) {
        module.exports = factory(
          window2,
          requireMatchesSelector()
        );
      } else {
        window2.fizzyUIUtils = factory(
          window2,
          window2.matchesSelector
        );
      }
    })(window, function factory(window2, matchesSelector2) {
      var utils2 = {};
      utils2.extend = function(a, b) {
        for (var prop in b) {
          a[prop] = b[prop];
        }
        return a;
      };
      utils2.modulo = function(num, div) {
        return (num % div + div) % div;
      };
      var arraySlice = Array.prototype.slice;
      utils2.makeArray = function(obj) {
        if (Array.isArray(obj)) {
          return obj;
        }
        if (obj === null || obj === void 0) {
          return [];
        }
        var isArrayLike = typeof obj == "object" && typeof obj.length == "number";
        if (isArrayLike) {
          return arraySlice.call(obj);
        }
        return [obj];
      };
      utils2.removeFrom = function(ary, obj) {
        var index = ary.indexOf(obj);
        if (index != -1) {
          ary.splice(index, 1);
        }
      };
      utils2.getParent = function(elem, selector) {
        while (elem.parentNode && elem != document.body) {
          elem = elem.parentNode;
          if (matchesSelector2(elem, selector)) {
            return elem;
          }
        }
      };
      utils2.getQueryElement = function(elem) {
        if (typeof elem == "string") {
          return document.querySelector(elem);
        }
        return elem;
      };
      utils2.handleEvent = function(event) {
        var method = "on" + event.type;
        if (this[method]) {
          this[method](event);
        }
      };
      utils2.filterFindElements = function(elems, selector) {
        elems = utils2.makeArray(elems);
        var ffElems = [];
        elems.forEach(function(elem) {
          if (!(elem instanceof HTMLElement)) {
            return;
          }
          if (!selector) {
            ffElems.push(elem);
            return;
          }
          if (matchesSelector2(elem, selector)) {
            ffElems.push(elem);
          }
          var childElems = elem.querySelectorAll(selector);
          for (var i = 0; i < childElems.length; i++) {
            ffElems.push(childElems[i]);
          }
        });
        return ffElems;
      };
      utils2.debounceMethod = function(_class, methodName, threshold) {
        threshold = threshold || 100;
        var method = _class.prototype[methodName];
        var timeoutName = methodName + "Timeout";
        _class.prototype[methodName] = function() {
          var timeout = this[timeoutName];
          clearTimeout(timeout);
          var args = arguments;
          var _this = this;
          this[timeoutName] = setTimeout(function() {
            method.apply(_this, args);
            delete _this[timeoutName];
          }, threshold);
        };
      };
      utils2.docReady = function(callback) {
        var readyState = document.readyState;
        if (readyState == "complete" || readyState == "interactive") {
          setTimeout(callback);
        } else {
          document.addEventListener("DOMContentLoaded", callback);
        }
      };
      utils2.toDashed = function(str) {
        return str.replace(/(.)([A-Z])/g, function(match, $1, $2) {
          return $1 + "-" + $2;
        }).toLowerCase();
      };
      var console2 = window2.console;
      utils2.htmlInit = function(WidgetClass, namespace) {
        utils2.docReady(function() {
          var dashedNamespace = utils2.toDashed(namespace);
          var dataAttr = "data-" + dashedNamespace;
          var dataAttrElems = document.querySelectorAll("[" + dataAttr + "]");
          var jsDashElems = document.querySelectorAll(".js-" + dashedNamespace);
          var elems = utils2.makeArray(dataAttrElems).concat(utils2.makeArray(jsDashElems));
          var dataOptionsAttr = dataAttr + "-options";
          var jQuery = window2.jQuery;
          elems.forEach(function(elem) {
            var attr = elem.getAttribute(dataAttr) || elem.getAttribute(dataOptionsAttr);
            var options;
            try {
              options = attr && JSON.parse(attr);
            } catch (error) {
              if (console2) {
                console2.error("Error parsing " + dataAttr + " on " + elem.className + ": " + error);
              }
              return;
            }
            var instance = new WidgetClass(elem, options);
            if (jQuery) {
              jQuery.data(elem, namespace, instance);
            }
          });
        });
      };
      return utils2;
    });
  })(utils);
  return utils.exports;
}
var item = { exports: {} };
var hasRequiredItem;
function requireItem() {
  if (hasRequiredItem) return item.exports;
  hasRequiredItem = 1;
  (function(module) {
    (function(window2, factory) {
      if (module.exports) {
        module.exports = factory(
          requireEvEmitter(),
          requireGetSize()
        );
      } else {
        window2.Outlayer = {};
        window2.Outlayer.Item = factory(
          window2.EvEmitter,
          window2.getSize
        );
      }
    })(window, function factory(EvEmitter, getSize2) {
      function isEmptyObj(obj) {
        for (var prop in obj) {
          return false;
        }
        prop = null;
        return true;
      }
      var docElemStyle = document.documentElement.style;
      var transitionProperty = typeof docElemStyle.transition == "string" ? "transition" : "WebkitTransition";
      var transformProperty = typeof docElemStyle.transform == "string" ? "transform" : "WebkitTransform";
      var transitionEndEvent = {
        WebkitTransition: "webkitTransitionEnd",
        transition: "transitionend"
      }[transitionProperty];
      var vendorProperties = {
        transform: transformProperty,
        transition: transitionProperty,
        transitionDuration: transitionProperty + "Duration",
        transitionProperty: transitionProperty + "Property",
        transitionDelay: transitionProperty + "Delay"
      };
      function Item(element, layout) {
        if (!element) {
          return;
        }
        this.element = element;
        this.layout = layout;
        this.position = {
          x: 0,
          y: 0
        };
        this._create();
      }
      var proto = Item.prototype = Object.create(EvEmitter.prototype);
      proto.constructor = Item;
      proto._create = function() {
        this._transn = {
          ingProperties: {},
          clean: {},
          onEnd: {}
        };
        this.css({
          position: "absolute"
        });
      };
      proto.handleEvent = function(event) {
        var method = "on" + event.type;
        if (this[method]) {
          this[method](event);
        }
      };
      proto.getSize = function() {
        this.size = getSize2(this.element);
      };
      proto.css = function(style) {
        var elemStyle = this.element.style;
        for (var prop in style) {
          var supportedProp = vendorProperties[prop] || prop;
          elemStyle[supportedProp] = style[prop];
        }
      };
      proto.getPosition = function() {
        var style = getComputedStyle(this.element);
        var isOriginLeft = this.layout._getOption("originLeft");
        var isOriginTop = this.layout._getOption("originTop");
        var xValue = style[isOriginLeft ? "left" : "right"];
        var yValue = style[isOriginTop ? "top" : "bottom"];
        var x = parseFloat(xValue);
        var y = parseFloat(yValue);
        var layoutSize = this.layout.size;
        if (xValue.indexOf("%") != -1) {
          x = x / 100 * layoutSize.width;
        }
        if (yValue.indexOf("%") != -1) {
          y = y / 100 * layoutSize.height;
        }
        x = isNaN(x) ? 0 : x;
        y = isNaN(y) ? 0 : y;
        x -= isOriginLeft ? layoutSize.paddingLeft : layoutSize.paddingRight;
        y -= isOriginTop ? layoutSize.paddingTop : layoutSize.paddingBottom;
        this.position.x = x;
        this.position.y = y;
      };
      proto.layoutPosition = function() {
        var layoutSize = this.layout.size;
        var style = {};
        var isOriginLeft = this.layout._getOption("originLeft");
        var isOriginTop = this.layout._getOption("originTop");
        var xPadding = isOriginLeft ? "paddingLeft" : "paddingRight";
        var xProperty = isOriginLeft ? "left" : "right";
        var xResetProperty = isOriginLeft ? "right" : "left";
        var x = this.position.x + layoutSize[xPadding];
        style[xProperty] = this.getXValue(x);
        style[xResetProperty] = "";
        var yPadding = isOriginTop ? "paddingTop" : "paddingBottom";
        var yProperty = isOriginTop ? "top" : "bottom";
        var yResetProperty = isOriginTop ? "bottom" : "top";
        var y = this.position.y + layoutSize[yPadding];
        style[yProperty] = this.getYValue(y);
        style[yResetProperty] = "";
        this.css(style);
        this.emitEvent("layout", [this]);
      };
      proto.getXValue = function(x) {
        var isHorizontal = this.layout._getOption("horizontal");
        return this.layout.options.percentPosition && !isHorizontal ? x / this.layout.size.width * 100 + "%" : x + "px";
      };
      proto.getYValue = function(y) {
        var isHorizontal = this.layout._getOption("horizontal");
        return this.layout.options.percentPosition && isHorizontal ? y / this.layout.size.height * 100 + "%" : y + "px";
      };
      proto._transitionTo = function(x, y) {
        this.getPosition();
        var curX = this.position.x;
        var curY = this.position.y;
        var didNotMove = x == this.position.x && y == this.position.y;
        this.setPosition(x, y);
        if (didNotMove && !this.isTransitioning) {
          this.layoutPosition();
          return;
        }
        var transX = x - curX;
        var transY = y - curY;
        var transitionStyle = {};
        transitionStyle.transform = this.getTranslate(transX, transY);
        this.transition({
          to: transitionStyle,
          onTransitionEnd: {
            transform: this.layoutPosition
          },
          isCleaning: true
        });
      };
      proto.getTranslate = function(x, y) {
        var isOriginLeft = this.layout._getOption("originLeft");
        var isOriginTop = this.layout._getOption("originTop");
        x = isOriginLeft ? x : -x;
        y = isOriginTop ? y : -y;
        return "translate3d(" + x + "px, " + y + "px, 0)";
      };
      proto.goTo = function(x, y) {
        this.setPosition(x, y);
        this.layoutPosition();
      };
      proto.moveTo = proto._transitionTo;
      proto.setPosition = function(x, y) {
        this.position.x = parseFloat(x);
        this.position.y = parseFloat(y);
      };
      proto._nonTransition = function(args) {
        this.css(args.to);
        if (args.isCleaning) {
          this._removeStyles(args.to);
        }
        for (var prop in args.onTransitionEnd) {
          args.onTransitionEnd[prop].call(this);
        }
      };
      proto.transition = function(args) {
        if (!parseFloat(this.layout.options.transitionDuration)) {
          this._nonTransition(args);
          return;
        }
        var _transition = this._transn;
        for (var prop in args.onTransitionEnd) {
          _transition.onEnd[prop] = args.onTransitionEnd[prop];
        }
        for (prop in args.to) {
          _transition.ingProperties[prop] = true;
          if (args.isCleaning) {
            _transition.clean[prop] = true;
          }
        }
        if (args.from) {
          this.css(args.from);
          this.element.offsetHeight;
        }
        this.enableTransition(args.to);
        this.css(args.to);
        this.isTransitioning = true;
      };
      function toDashedAll(str) {
        return str.replace(/([A-Z])/g, function($1) {
          return "-" + $1.toLowerCase();
        });
      }
      var transitionProps = "opacity," + toDashedAll(transformProperty);
      proto.enableTransition = function() {
        if (this.isTransitioning) {
          return;
        }
        var duration = this.layout.options.transitionDuration;
        duration = typeof duration == "number" ? duration + "ms" : duration;
        this.css({
          transitionProperty: transitionProps,
          transitionDuration: duration,
          transitionDelay: this.staggerDelay || 0
        });
        this.element.addEventListener(transitionEndEvent, this, false);
      };
      proto.onwebkitTransitionEnd = function(event) {
        this.ontransitionend(event);
      };
      proto.onotransitionend = function(event) {
        this.ontransitionend(event);
      };
      var dashedVendorProperties = {
        "-webkit-transform": "transform"
      };
      proto.ontransitionend = function(event) {
        if (event.target !== this.element) {
          return;
        }
        var _transition = this._transn;
        var propertyName = dashedVendorProperties[event.propertyName] || event.propertyName;
        delete _transition.ingProperties[propertyName];
        if (isEmptyObj(_transition.ingProperties)) {
          this.disableTransition();
        }
        if (propertyName in _transition.clean) {
          this.element.style[event.propertyName] = "";
          delete _transition.clean[propertyName];
        }
        if (propertyName in _transition.onEnd) {
          var onTransitionEnd = _transition.onEnd[propertyName];
          onTransitionEnd.call(this);
          delete _transition.onEnd[propertyName];
        }
        this.emitEvent("transitionEnd", [this]);
      };
      proto.disableTransition = function() {
        this.removeTransitionStyles();
        this.element.removeEventListener(transitionEndEvent, this, false);
        this.isTransitioning = false;
      };
      proto._removeStyles = function(style) {
        var cleanStyle = {};
        for (var prop in style) {
          cleanStyle[prop] = "";
        }
        this.css(cleanStyle);
      };
      var cleanTransitionStyle = {
        transitionProperty: "",
        transitionDuration: "",
        transitionDelay: ""
      };
      proto.removeTransitionStyles = function() {
        this.css(cleanTransitionStyle);
      };
      proto.stagger = function(delay) {
        delay = isNaN(delay) ? 0 : delay;
        this.staggerDelay = delay + "ms";
      };
      proto.removeElem = function() {
        this.element.parentNode.removeChild(this.element);
        this.css({ display: "" });
        this.emitEvent("remove", [this]);
      };
      proto.remove = function() {
        if (!parseFloat(this.layout.options.transitionDuration)) {
          this.removeElem();
          return;
        }
        this.once("transitionEnd", function() {
          this.removeElem();
        });
        this.hide();
      };
      proto.reveal = function() {
        delete this.isHidden;
        this.css({ display: "" });
        var options = this.layout.options;
        var onTransitionEnd = {};
        var transitionEndProperty = this.getHideRevealTransitionEndProperty("visibleStyle");
        onTransitionEnd[transitionEndProperty] = this.onRevealTransitionEnd;
        this.transition({
          from: options.hiddenStyle,
          to: options.visibleStyle,
          isCleaning: true,
          onTransitionEnd
        });
      };
      proto.onRevealTransitionEnd = function() {
        if (!this.isHidden) {
          this.emitEvent("reveal");
        }
      };
      proto.getHideRevealTransitionEndProperty = function(styleProperty) {
        var optionStyle = this.layout.options[styleProperty];
        if (optionStyle.opacity) {
          return "opacity";
        }
        for (var prop in optionStyle) {
          return prop;
        }
      };
      proto.hide = function() {
        this.isHidden = true;
        this.css({ display: "" });
        var options = this.layout.options;
        var onTransitionEnd = {};
        var transitionEndProperty = this.getHideRevealTransitionEndProperty("hiddenStyle");
        onTransitionEnd[transitionEndProperty] = this.onHideTransitionEnd;
        this.transition({
          from: options.visibleStyle,
          to: options.hiddenStyle,
          // keep hidden stuff hidden
          isCleaning: true,
          onTransitionEnd
        });
      };
      proto.onHideTransitionEnd = function() {
        if (this.isHidden) {
          this.css({ display: "none" });
          this.emitEvent("hide");
        }
      };
      proto.destroy = function() {
        this.css({
          position: "",
          left: "",
          right: "",
          top: "",
          bottom: "",
          transition: "",
          transform: ""
        });
      };
      return Item;
    });
  })(item);
  return item.exports;
}
/*!
 * Outlayer v2.1.1
 * the brains and guts of a layout library
 * MIT license
 */
var hasRequiredOutlayer;
function requireOutlayer() {
  if (hasRequiredOutlayer) return outlayer.exports;
  hasRequiredOutlayer = 1;
  (function(module) {
    (function(window2, factory) {
      if (module.exports) {
        module.exports = factory(
          window2,
          requireEvEmitter(),
          requireGetSize(),
          requireUtils(),
          requireItem()
        );
      } else {
        window2.Outlayer = factory(
          window2,
          window2.EvEmitter,
          window2.getSize,
          window2.fizzyUIUtils,
          window2.Outlayer.Item
        );
      }
    })(window, function factory(window2, EvEmitter, getSize2, utils2, Item) {
      var console2 = window2.console;
      var jQuery = window2.jQuery;
      var noop = function() {
      };
      var GUID = 0;
      var instances = {};
      function Outlayer(element, options) {
        var queryElement = utils2.getQueryElement(element);
        if (!queryElement) {
          if (console2) {
            console2.error("Bad element for " + this.constructor.namespace + ": " + (queryElement || element));
          }
          return;
        }
        this.element = queryElement;
        if (jQuery) {
          this.$element = jQuery(this.element);
        }
        this.options = utils2.extend({}, this.constructor.defaults);
        this.option(options);
        var id = ++GUID;
        this.element.outlayerGUID = id;
        instances[id] = this;
        this._create();
        var isInitLayout = this._getOption("initLayout");
        if (isInitLayout) {
          this.layout();
        }
      }
      Outlayer.namespace = "outlayer";
      Outlayer.Item = Item;
      Outlayer.defaults = {
        containerStyle: {
          position: "relative"
        },
        initLayout: true,
        originLeft: true,
        originTop: true,
        resize: true,
        resizeContainer: true,
        // item options
        transitionDuration: "0.4s",
        hiddenStyle: {
          opacity: 0,
          transform: "scale(0.001)"
        },
        visibleStyle: {
          opacity: 1,
          transform: "scale(1)"
        }
      };
      var proto = Outlayer.prototype;
      utils2.extend(proto, EvEmitter.prototype);
      proto.option = function(opts) {
        utils2.extend(this.options, opts);
      };
      proto._getOption = function(option) {
        var oldOption = this.constructor.compatOptions[option];
        return oldOption && this.options[oldOption] !== void 0 ? this.options[oldOption] : this.options[option];
      };
      Outlayer.compatOptions = {
        // currentName: oldName
        initLayout: "isInitLayout",
        horizontal: "isHorizontal",
        layoutInstant: "isLayoutInstant",
        originLeft: "isOriginLeft",
        originTop: "isOriginTop",
        resize: "isResizeBound",
        resizeContainer: "isResizingContainer"
      };
      proto._create = function() {
        this.reloadItems();
        this.stamps = [];
        this.stamp(this.options.stamp);
        utils2.extend(this.element.style, this.options.containerStyle);
        var canBindResize = this._getOption("resize");
        if (canBindResize) {
          this.bindResize();
        }
      };
      proto.reloadItems = function() {
        this.items = this._itemize(this.element.children);
      };
      proto._itemize = function(elems) {
        var itemElems = this._filterFindItemElements(elems);
        var Item2 = this.constructor.Item;
        var items = [];
        for (var i = 0; i < itemElems.length; i++) {
          var elem = itemElems[i];
          var item2 = new Item2(elem, this);
          items.push(item2);
        }
        return items;
      };
      proto._filterFindItemElements = function(elems) {
        return utils2.filterFindElements(elems, this.options.itemSelector);
      };
      proto.getItemElements = function() {
        return this.items.map(function(item2) {
          return item2.element;
        });
      };
      proto.layout = function() {
        this._resetLayout();
        this._manageStamps();
        var layoutInstant = this._getOption("layoutInstant");
        var isInstant = layoutInstant !== void 0 ? layoutInstant : !this._isLayoutInited;
        this.layoutItems(this.items, isInstant);
        this._isLayoutInited = true;
      };
      proto._init = proto.layout;
      proto._resetLayout = function() {
        this.getSize();
      };
      proto.getSize = function() {
        this.size = getSize2(this.element);
      };
      proto._getMeasurement = function(measurement, size) {
        var option = this.options[measurement];
        var elem;
        if (!option) {
          this[measurement] = 0;
        } else {
          if (typeof option == "string") {
            elem = this.element.querySelector(option);
          } else if (option instanceof HTMLElement) {
            elem = option;
          }
          this[measurement] = elem ? getSize2(elem)[size] : option;
        }
      };
      proto.layoutItems = function(items, isInstant) {
        items = this._getItemsForLayout(items);
        this._layoutItems(items, isInstant);
        this._postLayout();
      };
      proto._getItemsForLayout = function(items) {
        return items.filter(function(item2) {
          return !item2.isIgnored;
        });
      };
      proto._layoutItems = function(items, isInstant) {
        this._emitCompleteOnItems("layout", items);
        if (!items || !items.length) {
          return;
        }
        var queue = [];
        items.forEach(function(item2) {
          var position = this._getItemLayoutPosition(item2);
          position.item = item2;
          position.isInstant = isInstant || item2.isLayoutInstant;
          queue.push(position);
        }, this);
        this._processLayoutQueue(queue);
      };
      proto._getItemLayoutPosition = function() {
        return {
          x: 0,
          y: 0
        };
      };
      proto._processLayoutQueue = function(queue) {
        this.updateStagger();
        queue.forEach(function(obj, i) {
          this._positionItem(obj.item, obj.x, obj.y, obj.isInstant, i);
        }, this);
      };
      proto.updateStagger = function() {
        var stagger = this.options.stagger;
        if (stagger === null || stagger === void 0) {
          this.stagger = 0;
          return;
        }
        this.stagger = getMilliseconds(stagger);
        return this.stagger;
      };
      proto._positionItem = function(item2, x, y, isInstant, i) {
        if (isInstant) {
          item2.goTo(x, y);
        } else {
          item2.stagger(i * this.stagger);
          item2.moveTo(x, y);
        }
      };
      proto._postLayout = function() {
        this.resizeContainer();
      };
      proto.resizeContainer = function() {
        var isResizingContainer = this._getOption("resizeContainer");
        if (!isResizingContainer) {
          return;
        }
        var size = this._getContainerSize();
        if (size) {
          this._setContainerMeasure(size.width, true);
          this._setContainerMeasure(size.height, false);
        }
      };
      proto._getContainerSize = noop;
      proto._setContainerMeasure = function(measure, isWidth) {
        if (measure === void 0) {
          return;
        }
        var elemSize = this.size;
        if (elemSize.isBorderBox) {
          measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight + elemSize.borderLeftWidth + elemSize.borderRightWidth : elemSize.paddingBottom + elemSize.paddingTop + elemSize.borderTopWidth + elemSize.borderBottomWidth;
        }
        measure = Math.max(measure, 0);
        this.element.style[isWidth ? "width" : "height"] = measure + "px";
      };
      proto._emitCompleteOnItems = function(eventName, items) {
        var _this = this;
        function onComplete() {
          _this.dispatchEvent(eventName + "Complete", null, [items]);
        }
        var count = items.length;
        if (!items || !count) {
          onComplete();
          return;
        }
        var doneCount = 0;
        function tick() {
          doneCount++;
          if (doneCount == count) {
            onComplete();
          }
        }
        items.forEach(function(item2) {
          item2.once(eventName, tick);
        });
      };
      proto.dispatchEvent = function(type, event, args) {
        var emitArgs = event ? [event].concat(args) : args;
        this.emitEvent(type, emitArgs);
        if (jQuery) {
          this.$element = this.$element || jQuery(this.element);
          if (event) {
            var $event = jQuery.Event(event);
            $event.type = type;
            this.$element.trigger($event, args);
          } else {
            this.$element.trigger(type, args);
          }
        }
      };
      proto.ignore = function(elem) {
        var item2 = this.getItem(elem);
        if (item2) {
          item2.isIgnored = true;
        }
      };
      proto.unignore = function(elem) {
        var item2 = this.getItem(elem);
        if (item2) {
          delete item2.isIgnored;
        }
      };
      proto.stamp = function(elems) {
        elems = this._find(elems);
        if (!elems) {
          return;
        }
        this.stamps = this.stamps.concat(elems);
        elems.forEach(this.ignore, this);
      };
      proto.unstamp = function(elems) {
        elems = this._find(elems);
        if (!elems) {
          return;
        }
        elems.forEach(function(elem) {
          utils2.removeFrom(this.stamps, elem);
          this.unignore(elem);
        }, this);
      };
      proto._find = function(elems) {
        if (!elems) {
          return;
        }
        if (typeof elems == "string") {
          elems = this.element.querySelectorAll(elems);
        }
        elems = utils2.makeArray(elems);
        return elems;
      };
      proto._manageStamps = function() {
        if (!this.stamps || !this.stamps.length) {
          return;
        }
        this._getBoundingRect();
        this.stamps.forEach(this._manageStamp, this);
      };
      proto._getBoundingRect = function() {
        var boundingRect = this.element.getBoundingClientRect();
        var size = this.size;
        this._boundingRect = {
          left: boundingRect.left + size.paddingLeft + size.borderLeftWidth,
          top: boundingRect.top + size.paddingTop + size.borderTopWidth,
          right: boundingRect.right - (size.paddingRight + size.borderRightWidth),
          bottom: boundingRect.bottom - (size.paddingBottom + size.borderBottomWidth)
        };
      };
      proto._manageStamp = noop;
      proto._getElementOffset = function(elem) {
        var boundingRect = elem.getBoundingClientRect();
        var thisRect = this._boundingRect;
        var size = getSize2(elem);
        var offset = {
          left: boundingRect.left - thisRect.left - size.marginLeft,
          top: boundingRect.top - thisRect.top - size.marginTop,
          right: thisRect.right - boundingRect.right - size.marginRight,
          bottom: thisRect.bottom - boundingRect.bottom - size.marginBottom
        };
        return offset;
      };
      proto.handleEvent = utils2.handleEvent;
      proto.bindResize = function() {
        window2.addEventListener("resize", this);
        this.isResizeBound = true;
      };
      proto.unbindResize = function() {
        window2.removeEventListener("resize", this);
        this.isResizeBound = false;
      };
      proto.onresize = function() {
        this.resize();
      };
      utils2.debounceMethod(Outlayer, "onresize", 100);
      proto.resize = function() {
        if (!this.isResizeBound || !this.needsResizeLayout()) {
          return;
        }
        this.layout();
      };
      proto.needsResizeLayout = function() {
        var size = getSize2(this.element);
        var hasSizes = this.size && size;
        return hasSizes && size.innerWidth !== this.size.innerWidth;
      };
      proto.addItems = function(elems) {
        var items = this._itemize(elems);
        if (items.length) {
          this.items = this.items.concat(items);
        }
        return items;
      };
      proto.appended = function(elems) {
        var items = this.addItems(elems);
        if (!items.length) {
          return;
        }
        this.layoutItems(items, true);
        this.reveal(items);
      };
      proto.prepended = function(elems) {
        var items = this._itemize(elems);
        if (!items.length) {
          return;
        }
        var previousItems = this.items.slice(0);
        this.items = items.concat(previousItems);
        this._resetLayout();
        this._manageStamps();
        this.layoutItems(items, true);
        this.reveal(items);
        this.layoutItems(previousItems);
      };
      proto.reveal = function(items) {
        this._emitCompleteOnItems("reveal", items);
        if (!items || !items.length) {
          return;
        }
        var stagger = this.updateStagger();
        items.forEach(function(item2, i) {
          item2.stagger(i * stagger);
          item2.reveal();
        });
      };
      proto.hide = function(items) {
        this._emitCompleteOnItems("hide", items);
        if (!items || !items.length) {
          return;
        }
        var stagger = this.updateStagger();
        items.forEach(function(item2, i) {
          item2.stagger(i * stagger);
          item2.hide();
        });
      };
      proto.revealItemElements = function(elems) {
        var items = this.getItems(elems);
        this.reveal(items);
      };
      proto.hideItemElements = function(elems) {
        var items = this.getItems(elems);
        this.hide(items);
      };
      proto.getItem = function(elem) {
        for (var i = 0; i < this.items.length; i++) {
          var item2 = this.items[i];
          if (item2.element == elem) {
            return item2;
          }
        }
      };
      proto.getItems = function(elems) {
        elems = utils2.makeArray(elems);
        var items = [];
        elems.forEach(function(elem) {
          var item2 = this.getItem(elem);
          if (item2) {
            items.push(item2);
          }
        }, this);
        return items;
      };
      proto.remove = function(elems) {
        var removeItems = this.getItems(elems);
        this._emitCompleteOnItems("remove", removeItems);
        if (!removeItems || !removeItems.length) {
          return;
        }
        removeItems.forEach(function(item2) {
          item2.remove();
          utils2.removeFrom(this.items, item2);
        }, this);
      };
      proto.destroy = function() {
        var style = this.element.style;
        style.height = "";
        style.position = "";
        style.width = "";
        this.items.forEach(function(item2) {
          item2.destroy();
        });
        this.unbindResize();
        var id = this.element.outlayerGUID;
        delete instances[id];
        delete this.element.outlayerGUID;
        if (jQuery) {
          jQuery.removeData(this.element, this.constructor.namespace);
        }
      };
      Outlayer.data = function(elem) {
        elem = utils2.getQueryElement(elem);
        var id = elem && elem.outlayerGUID;
        return id && instances[id];
      };
      Outlayer.create = function(namespace, options) {
        var Layout = subclass(Outlayer);
        Layout.defaults = utils2.extend({}, Outlayer.defaults);
        utils2.extend(Layout.defaults, options);
        Layout.compatOptions = utils2.extend({}, Outlayer.compatOptions);
        Layout.namespace = namespace;
        Layout.data = Outlayer.data;
        Layout.Item = subclass(Item);
        utils2.htmlInit(Layout, namespace);
        if (jQuery && jQuery.bridget) {
          jQuery.bridget(namespace, Layout);
        }
        return Layout;
      };
      function subclass(Parent) {
        function SubClass() {
          Parent.apply(this, arguments);
        }
        SubClass.prototype = Object.create(Parent.prototype);
        SubClass.prototype.constructor = SubClass;
        return SubClass;
      }
      var msUnits = {
        ms: 1,
        s: 1e3
      };
      function getMilliseconds(time) {
        if (typeof time == "number") {
          return time;
        }
        var matches = time.match(/(^\d*\.?\d*)(\w*)/);
        var num = matches && matches[1];
        var unit = matches && matches[2];
        if (!num.length) {
          return 0;
        }
        num = parseFloat(num);
        var mult = msUnits[unit] || 1;
        return num * mult;
      }
      Outlayer.Item = Item;
      return Outlayer;
    });
  })(outlayer);
  return outlayer.exports;
}
/*!
 * Masonry v4.2.2
 * Cascading grid layout library
 * https://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */
var hasRequiredMasonry;
function requireMasonry() {
  if (hasRequiredMasonry) return masonry.exports;
  hasRequiredMasonry = 1;
  (function(module) {
    (function(window2, factory) {
      if (module.exports) {
        module.exports = factory(
          requireOutlayer(),
          requireGetSize()
        );
      } else {
        window2.Masonry = factory(
          window2.Outlayer,
          window2.getSize
        );
      }
    })(window, function factory(Outlayer, getSize2) {
      var Masonry2 = Outlayer.create("masonry");
      Masonry2.compatOptions.fitWidth = "isFitWidth";
      var proto = Masonry2.prototype;
      proto._resetLayout = function() {
        this.getSize();
        this._getMeasurement("columnWidth", "outerWidth");
        this._getMeasurement("gutter", "outerWidth");
        this.measureColumns();
        this.colYs = [];
        for (var i = 0; i < this.cols; i++) {
          this.colYs.push(0);
        }
        this.maxY = 0;
        this.horizontalColIndex = 0;
      };
      proto.measureColumns = function() {
        this.getContainerWidth();
        if (!this.columnWidth) {
          var firstItem = this.items[0];
          var firstItemElem = firstItem && firstItem.element;
          this.columnWidth = firstItemElem && getSize2(firstItemElem).outerWidth || // if first elem has no width, default to size of container
          this.containerWidth;
        }
        var columnWidth = this.columnWidth += this.gutter;
        var containerWidth = this.containerWidth + this.gutter;
        var cols = containerWidth / columnWidth;
        var excess = columnWidth - containerWidth % columnWidth;
        var mathMethod = excess && excess < 1 ? "round" : "floor";
        cols = Math[mathMethod](cols);
        this.cols = Math.max(cols, 1);
      };
      proto.getContainerWidth = function() {
        var isFitWidth = this._getOption("fitWidth");
        var container = isFitWidth ? this.element.parentNode : this.element;
        var size = getSize2(container);
        this.containerWidth = size && size.innerWidth;
      };
      proto._getItemLayoutPosition = function(item2) {
        item2.getSize();
        var remainder = item2.size.outerWidth % this.columnWidth;
        var mathMethod = remainder && remainder < 1 ? "round" : "ceil";
        var colSpan = Math[mathMethod](item2.size.outerWidth / this.columnWidth);
        colSpan = Math.min(colSpan, this.cols);
        var colPosMethod = this.options.horizontalOrder ? "_getHorizontalColPosition" : "_getTopColPosition";
        var colPosition = this[colPosMethod](colSpan, item2);
        var position = {
          x: this.columnWidth * colPosition.col,
          y: colPosition.y
        };
        var setHeight = colPosition.y + item2.size.outerHeight;
        var setMax = colSpan + colPosition.col;
        for (var i = colPosition.col; i < setMax; i++) {
          this.colYs[i] = setHeight;
        }
        return position;
      };
      proto._getTopColPosition = function(colSpan) {
        var colGroup = this._getTopColGroup(colSpan);
        var minimumY = Math.min.apply(Math, colGroup);
        return {
          col: colGroup.indexOf(minimumY),
          y: minimumY
        };
      };
      proto._getTopColGroup = function(colSpan) {
        if (colSpan < 2) {
          return this.colYs;
        }
        var colGroup = [];
        var groupCount = this.cols + 1 - colSpan;
        for (var i = 0; i < groupCount; i++) {
          colGroup[i] = this._getColGroupY(i, colSpan);
        }
        return colGroup;
      };
      proto._getColGroupY = function(col, colSpan) {
        if (colSpan < 2) {
          return this.colYs[col];
        }
        var groupColYs = this.colYs.slice(col, col + colSpan);
        return Math.max.apply(Math, groupColYs);
      };
      proto._getHorizontalColPosition = function(colSpan, item2) {
        var col = this.horizontalColIndex % this.cols;
        var isOver = colSpan > 1 && col + colSpan > this.cols;
        col = isOver ? 0 : col;
        var hasSize = item2.size.outerWidth && item2.size.outerHeight;
        this.horizontalColIndex = hasSize ? col + colSpan : this.horizontalColIndex;
        return {
          col,
          y: this._getColGroupY(col, colSpan)
        };
      };
      proto._manageStamp = function(stamp) {
        var stampSize = getSize2(stamp);
        var offset = this._getElementOffset(stamp);
        var isOriginLeft = this._getOption("originLeft");
        var firstX = isOriginLeft ? offset.left : offset.right;
        var lastX = firstX + stampSize.outerWidth;
        var firstCol = Math.floor(firstX / this.columnWidth);
        firstCol = Math.max(0, firstCol);
        var lastCol = Math.floor(lastX / this.columnWidth);
        lastCol -= lastX % this.columnWidth ? 0 : 1;
        lastCol = Math.min(this.cols - 1, lastCol);
        var isOriginTop = this._getOption("originTop");
        var stampMaxY = (isOriginTop ? offset.top : offset.bottom) + stampSize.outerHeight;
        for (var i = firstCol; i <= lastCol; i++) {
          this.colYs[i] = Math.max(stampMaxY, this.colYs[i]);
        }
      };
      proto._getContainerSize = function() {
        this.maxY = Math.max.apply(Math, this.colYs);
        var size = {
          height: this.maxY
        };
        if (this._getOption("fitWidth")) {
          size.width = this._getContainerFitWidth();
        }
        return size;
      };
      proto._getContainerFitWidth = function() {
        var unusedCols = 0;
        var i = this.cols;
        while (--i) {
          if (this.colYs[i] !== 0) {
            break;
          }
          unusedCols++;
        }
        return (this.cols - unusedCols) * this.columnWidth - this.gutter;
      };
      proto.needsResizeLayout = function() {
        var previousWidth = this.containerWidth;
        this.getContainerWidth();
        return previousWidth != this.containerWidth;
      };
      return Masonry2;
    });
  })(masonry);
  return masonry.exports;
}
var masonryExports = requireMasonry();
const Masonry = /* @__PURE__ */ getDefaultExportFromCjs(masonryExports);
const MasonryInit = () => {
  const masonryGrid = document.querySelector("[data-masonry]");
  if (masonryGrid) {
    new Masonry(masonryGrid, {
      itemSelector: ".reviews__item",
      // fitWidth: true,
      originTop: true,
      resize: true,
      percentPosition: true,
      horizontalOrder: true,
      gutter: 32
    });
  }
};
window.addEventListener("load", () => MasonryInit());
class FormsValidation {
  constructor(options) {
    let defaultConfig = {
      viewpass: false,
      autoHeight: false,
      logging: true,
      errorMesseges: {
        valueMissing: "Будь ласка, заповніть це поле.",
        validateName: {
          enterName: `Будь ласка, введіть Ваше ім’я.`,
          containsNumbers: `Ім’я не може містити цифри.`,
          containsOnlyAlphabet: `Ім’я може містити лише літери українського алфавіту та починатися з великої літери.`
        },
        validateEmail: {
          enterEmail: `Будь ласка, введіть Ваш email`,
          invalidEmail: {
            incorrectEmail: `Ви ввели некоректну єлектронну адресу`,
            missingAtSymbol: (value) => `Електронна адреса має містити символ "@". Єлектронна адреса "${value}" не містить символ "@"`
          }
        },
        validatePhone: {
          enterPhone: "Будь ласка, введіть Ваш номер телефону.",
          invalidPhone: {
            incorrectPhone: "Ви ввели некоректний номер."
          }
        },
        validateSelect: `Будь ласка, виберіть варіант зі списку.`
      },
      reqexp: {
        name: /^[А-ЩЬЮЯЄІЇҐ][а-щьюяєіїґ']{1,29}(-[А-ЩЬЮЯЄІЇҐ][а-щьюяєіїґ']{1,29})?$/,
        email: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/,
        phone: /^\+38\(\d{3}\)[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/
      },
      on: {
        formSend: () => {
        }
      }
    };
    this.config = {
      ...defaultConfig,
      ...options,
      errorMesseges: {
        ...defaultConfig.errorMesseges,
        ...options?.errorMesseges
      },
      reqexp: {
        ...defaultConfig.reqexp,
        ...options?.reqexp
      },
      on: {
        ...defaultConfig.on,
        ...options?.on
      }
    };
    this.formAttributes = {
      required: "data-required",
      validate: "data-validate",
      noValidate: "data-no-validate",
      noFocusClasses: "data-no-focus-classes",
      modalMessage: "data-modal-message",
      gotoError: "data-goto-error",
      autoHeight: "data-autoheight",
      autoHeightMin: "data-autoheight-min",
      autoHeightMax: "data-autoheight-max",
      error: "data-error",
      ajax: "data-ajax",
      dev: "data-dev"
    };
    this.formClasses = {
      formFocus: "form-focus",
      formSuccess: "form-success",
      formError: "form-error",
      formSending: "form-sending",
      viewPass: "viewpass",
      viewPassActive: "viewpass-active"
    };
    this.eventsForm();
    if (this.config.autoHeight) this.autoHeight();
  }
  eventsForm() {
    document.addEventListener("focusin", ({ target }) => this.focusIn(target));
    document.addEventListener("focusout", ({ target }) => this.focusOut(target));
    document.addEventListener("change", ({ target }) => this.inputChange(target));
    document.addEventListener("selectCallback", ({ detail }) => this.selectChange(detail));
    if (this.config.viewpass) {
      document.addEventListener("click", ({ target }) => this.inputViewPass(target));
    }
    document.addEventListener("submit", (e) => this.formSubmit(e));
  }
  formSubmit(e) {
    const formElement = e.target.closest("[data-form]");
    if (!formElement) return;
    this.formSubmitAction(formElement, e);
  }
  async formSubmitAction(form, e) {
    e.preventDefault();
    const error = !form.hasAttribute(this.formAttributes.noValidate) ? this.getErrorField(form) : 0;
    if (error !== 0) {
      if (form.querySelector(this.formClasses.formError) && form.hasAttribute(this.formAttributes.gotoError)) {
        const formGoToErrorClass = form.dataset.gotoError || ".form-error";
        gotoBlock(formGoToErrorClass, { noHeader: true, speed: 1e3 });
      }
      return;
    }
    const ajax = form.hasAttribute(this.formAttributes.ajax);
    const dev = form.hasAttribute(this.formAttributes.dev);
    try {
      if (ajax) {
        const formAction = form.getAttribute("action") ? form.getAttribute("action").trim() : "#";
        const formMethod = form.getAttribute("method") ? form.getAttribute("method").trim() : "GET";
        const formData = new FormData(form);
        form.classList.add(this.formClasses.formSending);
        const response = await fetch(formAction, {
          method: formMethod,
          body: formMethod !== "GET" ? formData : null
        });
        if (!response.ok) {
          const errorMassage = "Щось пішло не так!";
          throw new Error(errorMassage);
        }
        const responseData = await response.json();
        this.formSending(form, responseData);
      }
      if (dev) {
        this.formSending(form);
      }
    } catch (error2) {
      this.#formLogging(error2);
    } finally {
      form.classList.remove(this.formClasses.formSending);
    }
  }
  formSending(form, responseResult = ``) {
    document.dispatchEvent(
      new CustomEvent("formSent", {
        detail: {
          form
        }
      })
    );
    setTimeout(() => {
      if (objectModules.modal) {
        const { modalMessage } = form.dataset;
        if (modalMessage) {
          objectModules.modal.open(modalMessage);
        }
      }
    }, 0);
    this.config.on.formSend(form);
    this.formClean(form);
    this.#formLogging(`Form send!`);
  }
  formClean(form) {
    form.reset();
    setTimeout(() => {
      const inputs = form.querySelectorAll("input,textarea");
      const checkboxes = form.querySelectorAll("input[type=checkbox]");
      const radioButtons = form.querySelectorAll("input[type=radio]");
      if (inputs.length > 0) {
        inputs.forEach((input) => {
          this.removeFieldError(input);
          this.removeFieldSuccess(input);
        });
      }
      if (checkboxes.length > 0) {
        checkboxes.forEach((checkbox) => checkbox.checked = false);
      }
      if (radioButtons.length > 0) {
        radioButtons.forEach((radio) => radio.checked = false);
      }
      if (objectModules.select) {
        const selects = form.querySelectorAll("div.select");
        if (selects.length > 0) {
          selects.forEach((selectItem) => {
            const originalSelect = selectItem.querySelector("select");
            const { options, multiple } = originalSelect;
            this.removeSelectFieldError(selectItem, originalSelect);
            this.removeSelectFieldSuccess(selectItem, originalSelect);
            Array.from(options).forEach((option, index) => {
              if (!multiple) {
                index === 0 ? option.setAttribute("selected", "") : option.removeAttribute("selected");
              } else {
                option.removeAttribute("selected");
              }
            });
            objectModules.select.selectBuild(originalSelect);
          });
        }
      }
    }, 0);
  }
  inputViewPass(target) {
    if (target.closest(`[class*="__${this.formClasses.viewPass}"]`)) {
      const viewPassButton = target.closest(`[class*="__${this.formClasses.viewPass}"]`);
      let inputType = viewPassButton.classList.contains(this.formClasses.viewPassActive) ? "password" : "text";
      viewPassButton.parentElement.querySelector("input").setAttribute("type", inputType);
      viewPassButton.classList.toggle(this.formClasses.viewPassActive);
    }
  }
  autoHeight() {
    const textareas = document.querySelectorAll(`textarea[${this.formAttributes.autoHeight}]`);
    if (textareas.length > 0) {
      textareas.forEach((textarea) => {
        const startHeight = textarea.hasAttribute(this.formAttributes.autoHeightMin) ? +textarea.dataset.autoheightMin : +textarea.offsetHeight;
        const maxHeight = textarea.hasAttribute(this.formAttributes.autoHeightMax) ? +textarea.dataset.autoheightMax : Infinity;
        this.#setTextareaHeight(textarea, Math.min(startHeight, maxHeight));
        textarea.addEventListener("input", () => {
          if (textarea.scrollHeight > startHeight) {
            textarea.style.height = `auto`;
            this.#setTextareaHeight(textarea, Math.min(Math.max(textarea.scrollHeight, startHeight), maxHeight));
          }
        });
      });
    }
  }
  #setTextareaHeight(textarea, height) {
    textarea.style.height = `${height}px`;
  }
  inputChange(target) {
    const { type } = target;
    if (type === "checkbox" || type === "radio") {
      this.validateField(target);
    }
  }
  focusIn(target) {
    const { tagName } = target;
    if (tagName === "INPUT" || tagName === "TEXTAREA") {
      if (!target.hasAttribute(this.formAttributes.noFocusClasses)) {
        target.classList.add(this.formClasses.formFocus);
        target.parentElement.classList.add(this.formClasses.formFocus);
      }
      if (target.hasAttribute(this.formAttributes.validate)) {
        this.removeFieldError(target);
      }
    }
  }
  focusOut(target) {
    const { tagName } = target;
    if (tagName === "INPUT" || tagName === "TEXTAREA") {
      if (!target.hasAttribute(this.formAttributes.noFocusClasses)) {
        target.classList.remove(this.formClasses.formFocus);
        target.parentElement.classList.remove(this.formClasses.formFocus);
      }
      if (target.hasAttribute(this.formAttributes.validate)) {
        this.validateField(target);
      }
    }
  }
  selectChange(detail) {
    const { select } = detail;
    if (select) this.validateField(select);
  }
  getErrorField(form) {
    let error = 0;
    const formRequiredItems = form.querySelectorAll(`*[${this.formAttributes.required}]`);
    if (formRequiredItems.length > 0) {
      formRequiredItems.forEach((formRequiredItem) => {
        if ((formRequiredItem.offsetParent !== null || formRequiredItem.tagName === "SELECT") && !formRequiredItem.disabled) {
          error += this.validateField(formRequiredItem);
        }
      });
    }
    return error;
  }
  validateField(formRequiredItem) {
    const { required } = formRequiredItem.dataset;
    const { type, tagName } = formRequiredItem;
    let error = 0;
    if (required === "name") {
      if (!formRequiredItem.value.trim()) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validateName.enterName);
        error++;
        return;
      }
      if (this.#digitsTest(formRequiredItem)) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validateName.containsNumbers);
        error++;
        return;
      }
      if (this.#nameTest(formRequiredItem)) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validateName.containsOnlyAlphabet);
        error++;
      } else {
        this.removeFieldError(formRequiredItem);
        this.addFieldSuccess(formRequiredItem);
      }
    }
    if (required === "email") {
      if (!formRequiredItem.value.trim()) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validateEmail.enterEmail);
        error++;
        return;
      }
      formRequiredItem.value = formRequiredItem.value.replace(" ", "");
      if (this.#emailTest(formRequiredItem)) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validateEmail.invalidEmail.incorrectEmail);
        if (!formRequiredItem.value.includes("@")) {
          this.addFieldError(
            formRequiredItem,
            this.config.errorMesseges.validateEmail.invalidEmail.missingAtSymbol(formRequiredItem.value)
          );
        }
        error++;
      } else {
        this.removeFieldError(formRequiredItem);
        this.addFieldSuccess(formRequiredItem);
      }
    }
    if (required === "phone") {
      if (!formRequiredItem.value.trim()) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validatePhone.enterPhone);
        error++;
        return;
      }
      formRequiredItem.value = formRequiredItem.value.replace(" ", "");
      if (this.#phoneTest(formRequiredItem)) {
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validatePhone.invalidPhone.incorrectPhone);
        this.removeFieldSuccess(formRequiredItem);
        error++;
      } else {
        this.removeFieldError(formRequiredItem);
        this.addFieldSuccess(formRequiredItem);
      }
    }
    if (type === "checkbox") {
      if (!formRequiredItem.checked) {
        this.addFieldError(formRequiredItem, this.config.errorMesseges.valueMissing);
        this.removeFieldSuccess(formRequiredItem);
        error++;
      } else {
        this.removeFieldError(formRequiredItem);
        this.addFieldSuccess(formRequiredItem);
      }
    }
    if (type === "radio") {
      const { name } = formRequiredItem;
      const radioGroup = document.querySelectorAll(`input[name="${name}"]`);
      const isChecked = Array.from(radioGroup).some((radio) => radio.checked);
      const parentBlock = formRequiredItem.closest("fieldset") || formRequiredItem.parentElement;
      const formErrorItem = parentBlock.querySelector(".form__error");
      if (formErrorItem) parentBlock.removeChild(formErrorItem);
      if (!isChecked) {
        if (!formErrorItem && parentBlock.hasAttribute(this.formAttributes.error)) {
          const { error: error2 } = parentBlock.dataset;
          parentBlock.insertAdjacentHTML(
            "beforeend",
            this.getFormErrorHTML(error2, this.config.errorMesseges.valueMissing)
          );
        }
        radioGroup.forEach((radio) => {
          this.addFieldError(radio);
          this.removeFieldSuccess(radio);
        });
        if (!parentBlock.classList.contains(this.formClasses.formError)) {
          parentBlock.classList.add(this.formClasses.formError);
        }
        error++;
      } else {
        radioGroup.forEach((radio) => {
          this.removeFieldError(radio);
          this.addFieldSuccess(radio);
        });
        if (parentBlock.classList.contains(this.formClasses.formError)) {
          parentBlock.classList.remove(this.formClasses.formError);
        }
      }
    }
    if (objectModules.select && tagName === "SELECT") {
      const selectItem = formRequiredItem.parentElement;
      if (formRequiredItem.multiple) {
        const selectedOptions = Array.from(formRequiredItem.selectedOptions).filter((option) => option.value);
        if (!selectedOptions.length) {
          this.removeSelectFieldSuccess(selectItem, formRequiredItem);
          this.addSelectFieldError(selectItem, formRequiredItem, this.config.errorMesseges.validateSelect);
          error++;
        } else {
          this.removeSelectFieldError(selectItem, formRequiredItem);
          this.addSelectFieldSuccess(selectItem, formRequiredItem);
        }
      } else {
        if (!formRequiredItem.value.trim()) {
          this.removeSelectFieldSuccess(selectItem, formRequiredItem);
          this.addSelectFieldError(selectItem, formRequiredItem, this.config.errorMesseges.validateSelect);
          error++;
        } else {
          this.removeSelectFieldError(selectItem, formRequiredItem);
          this.addSelectFieldSuccess(selectItem, formRequiredItem);
        }
      }
    }
    if (tagName !== "SELECT" && type !== "checkbox" && type !== "radio" && required === "") {
      if (!formRequiredItem.value.trim()) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.valueMissing);
        error++;
      } else {
        this.removeFieldError(formRequiredItem);
        this.addFieldSuccess(formRequiredItem);
      }
    }
    return error;
  }
  addSelectFieldError(selectItem, originalSelect, errorMessage = "") {
    const parentSelectFormField = selectItem.parentElement;
    const formErrorItem = parentSelectFormField?.querySelector(".form__error");
    if (formErrorItem) parentSelectFormField.removeChild(formErrorItem);
    this.formFieldsToggleErrorClass(selectItem, parentSelectFormField, true);
    this.formFieldSetInvalidAttr(originalSelect);
    this.formFieldSetInvalidAttr(selectItem);
    if (originalSelect.hasAttribute(this.formAttributes.error)) {
      const { error } = originalSelect.dataset;
      parentSelectFormField.insertAdjacentHTML("beforeend", this.getFormErrorHTML(error, errorMessage));
    }
  }
  removeSelectFieldError(selectItem) {
    const parentSelectFormField = selectItem.parentElement;
    const formErrorItem = parentSelectFormField?.querySelector(".form__error");
    if (formErrorItem) parentSelectFormField.removeChild(formErrorItem);
    this.formFieldsToggleErrorClass(selectItem, parentSelectFormField);
  }
  addSelectFieldSuccess(selectItem, originalSelect) {
    const parentSelectFormField = selectItem.parentElement;
    this.formFieldsToggleSuccessClass(selectItem, parentSelectFormField, true);
    this.formFieldSetInvalidAttr(originalSelect, false);
    this.formFieldSetInvalidAttr(selectItem, false);
  }
  removeSelectFieldSuccess(selectItem) {
    const parentSelectFormField = selectItem.parentElement;
    this.formFieldsToggleSuccessClass(selectItem, parentSelectFormField);
  }
  addFieldError(formRequiredItem, errorMessage = "") {
    const parentFormField = formRequiredItem.parentElement;
    const formErrorItem = parentFormField.querySelector(".form__error");
    if (formErrorItem) parentFormField.removeChild(formErrorItem);
    this.formFieldsToggleErrorClass(formRequiredItem, parentFormField, true);
    this.formFieldSetInvalidAttr(formRequiredItem);
    if (formRequiredItem.hasAttribute(this.formAttributes.error)) {
      const { error } = formRequiredItem.dataset;
      parentFormField.insertAdjacentHTML("beforeend", this.getFormErrorHTML(error, errorMessage));
    }
  }
  removeFieldError(formRequiredItem) {
    const parentFormField = formRequiredItem.parentElement;
    const formErrorItem = parentFormField.querySelector(".form__error");
    this.formFieldsToggleErrorClass(formRequiredItem, parentFormField);
    if (formErrorItem) parentFormField.removeChild(formErrorItem);
  }
  addFieldSuccess(formRequiredItem) {
    const parentFormField = formRequiredItem.parentElement;
    this.formFieldsToggleSuccessClass(formRequiredItem, parentFormField, true);
    this.formFieldSetInvalidAttr(formRequiredItem, false);
  }
  removeFieldSuccess(formRequiredItem) {
    const parentFormField = formRequiredItem.parentElement;
    this.formFieldsToggleSuccessClass(formRequiredItem, parentFormField);
  }
  formFieldSetInvalidAttr(formRequiredItem, isInvalid = true) {
    formRequiredItem.setAttribute("aria-invalid", `${isInvalid ? true : false}`);
  }
  formFieldsToggleSuccessClass(formRequiredItem, parentFormField, isSuccess = false) {
    if (!isSuccess) {
      formRequiredItem.classList.remove(this.formClasses.formSuccess);
      parentFormField.classList.remove(this.formClasses.formSuccess);
    } else {
      formRequiredItem.classList.add(this.formClasses.formSuccess);
      parentFormField.classList.add(this.formClasses.formSuccess);
    }
  }
  formFieldsToggleErrorClass(formRequiredItem, parentFormField, isError = false) {
    if (!isError) {
      formRequiredItem.classList.remove(this.formClasses.formError);
      parentFormField.classList.remove(this.formClasses.formError);
    } else {
      formRequiredItem.classList.add(this.formClasses.formError);
      parentFormField.classList.add(this.formClasses.formError);
    }
  }
  getFormErrorHTML(error, errorMassage) {
    return `<div class="form__error">${error || errorMassage}</div>`;
  }
  #nameTest(formRequiredItem) {
    return !this.config.reqexp.name.test(formRequiredItem.value);
  }
  #emailTest(formRequiredItem) {
    return !this.config.reqexp.email.test(formRequiredItem.value);
  }
  #phoneTest(formRequiredItem) {
    return !this.config.reqexp.phone.test(formRequiredItem.value);
  }
  #digitsTest(formRequiredItem) {
    return /\d/.test(formRequiredItem.value);
  }
  #formLogging(message) {
    this.config.logging ? console.log(`[Форми]: ${message}`) : null;
  }
}
objectModules.formsValidation = new FormsValidation({
  reqexp: {
    name: /^[A-Za-z]+([ -][A-Za-z]+)*$/
  }
});
class DynamicAdapt {
  constructor(type) {
    this.type = type;
    this.init();
  }
  init() {
    this.objects = [];
    this.daClassName = "dynamic-adapt";
    this.nodes = [...document.querySelectorAll("[data-dynamic-adapt]")];
    this.nodes.forEach((node) => {
      const data = node.dataset.dynamicAdapt ? node.dataset.dynamicAdapt.trim() : null;
      if (!data) return;
      const dataArray = data.split(",");
      const object = {};
      object.element = node;
      object.parent = node.parentNode;
      object.destination = document.querySelector(`${dataArray[0].trim()}`);
      object.breakpoint = dataArray[1] ? dataArray[1].trim() : "767.98";
      object.place = dataArray[2] ? dataArray[2].trim() : "last";
      object.index = this.indexInParent(object.parent, object.element);
      this.objects.push(object);
    });
    this.arraySort(this.objects);
    this.mediaQueries = this.objects.map(({ breakpoint }) => `(${this.type}-width: ${breakpoint / 16}em),${breakpoint}`).filter((item2, index, self) => self.indexOf(item2) === index);
    this.mediaQueries.forEach((media) => {
      const mediaSplit = media.split(",");
      const matchMedia = window.matchMedia(mediaSplit[0]);
      const mediaBreakpoint = mediaSplit[1];
      const objectsFilter = this.objects.filter(({ breakpoint }) => breakpoint === mediaBreakpoint);
      matchMedia.addEventListener("change", () => this.mediaHandler(matchMedia, objectsFilter));
      this.mediaHandler(matchMedia, objectsFilter);
    });
  }
  // Основна функція
  mediaHandler(matchMedia, objects) {
    if (matchMedia.matches) {
      objects.forEach((object) => {
        this.moveTo(object.place, object.element, object.destination);
      });
    } else {
      objects.forEach(({ parent, element, index }) => {
        if (element.classList.contains(this.daClassName)) {
          this.moveBack(parent, element, index);
        }
      });
    }
  }
  // Функція переміщення
  moveTo(place, element, destination) {
    element.classList.add(this.daClassName);
    if (place === "last" || place >= destination.children.length) {
      destination.append(element);
      return;
    }
    if (place === "first") {
      destination.prepend(element);
      return;
    }
    destination.children[place].before(element);
  }
  // Функція повернення
  moveBack(parent, element, index) {
    element.classList.remove(this.daClassName);
    if (parent.children[index] !== void 0) {
      parent.children[index].before(element);
    } else {
      parent.append(element);
    }
  }
  // Функція отримання індексу всередині батьківського єлементу
  indexInParent(parent, element) {
    return [...parent.children].indexOf(element);
  }
  // Функція сортування масиву по breakpoint та place
  arraySort(arr) {
    arr.sort((a, b) => {
      if (a.breakpoint === b.breakpoint) {
        return this.#comparePlace(a, b);
      }
      return this.type === "min" ? a.breakpoint - b.breakpoint : b.breakpoint - a.breakpoint;
    });
  }
  // Допоміжна функція для порівняння place
  #comparePlace(a, b) {
    if (a.place === b.place) {
      return 0;
    }
    if (a.place === "first" || b.place === "last") {
      return -1;
    }
    if (a.place === "last" || b.place === "first") {
      return 1;
    }
    return 0;
  }
}
window.addEventListener("load", () => new DynamicAdapt("max"));
