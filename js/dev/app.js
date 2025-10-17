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
  const media = Array.from(array).filter((item) => item.dataset[dataSetValue]);
  if (!media.length) return [];
  const breakpointsArray = [];
  media.forEach((item) => {
    const params = item.dataset[dataSetValue];
    const breakpoint = {};
    const paramsArray = params.split(",");
    breakpoint.value = paramsArray[0];
    breakpoint.type = paramsArray[1] ? paramsArray[1].trim() : "max";
    breakpoint.item = item;
    breakpointsArray.push(breakpoint);
  });
  let mdQueries = breakpointsArray.map((item) => `(${item.type}-width: ${item.value}px),${item.value},${item.type}`);
  mdQueries = uniqArray(mdQueries);
  const mdQueriesArray = [];
  if (mdQueries.length) {
    mdQueries.forEach((breakpoint) => {
      const paramsArray = breakpoint.split(",");
      const mediaBreakpoint = paramsArray[1];
      const mediaType = paramsArray[2];
      const matchMedia = window.matchMedia(paramsArray[0]);
      const itemsArray = breakpointsArray.filter((item) => {
        if (item.value === mediaBreakpoint && item.type === mediaType) {
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
      Array.from(watchItems).map((item) => {
        if (item.dataset.watch === "navigator" && !item.dataset.watchThreshold) {
          let thresholdValue;
          if (item.clientHeight > 2) {
            thresholdValue = window.innerHeight / 2 / (item.clientHeight - 1);
            thresholdValue = Math.min(thresholdValue, 1);
          } else {
            thresholdValue = 1;
          }
          item.setAttribute("data-watcher-threshold", thresholdValue.toFixed(2));
        }
        const { watchRoot, watchMargin, watchThreshold } = item.dataset;
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
      const groupItems = Array.from(watchItems).filter((item) => {
        let { watchRoot, watchMargin, watchThreshold } = item.dataset;
        watchRoot = watchRoot ? watchRoot : null;
        watchMargin = watchMargin ? watchMargin : "0px";
        watchThreshold = watchThreshold ? watchThreshold : 0;
        if (String(watchRoot) === paramsWatch.root && String(watchMargin) === paramsWatch.margin && String(watchThreshold) === paramsWatch.threshold) {
          return item;
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
    items.forEach((item) => this.observer.observe(item));
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
  const accordionsArray = Array.from(accordionsRegular).filter((item) => !item.dataset.accordions.split(",")[0]);
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
window["FLS"] = true;
export {
  gotoBlock as a,
  debounce as d,
  getDigFormat as g,
  objectModules as o
};
