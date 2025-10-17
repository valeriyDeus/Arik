import { d as debounce } from "./app.min.js";
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
        cacheArray = childrenEl.map((item) => item);
      } else {
        childrenEl = [...cacheArray];
      }
      marqueeBody.style.display = "flex";
      if (isVertical) {
        marqueeBody.style.flexDirection = "column";
      }
      marqueeBody.innerHTML = "";
      childrenEl.forEach((item) => marqueeBody.append(item));
      childrenEl.forEach((item) => {
        if (isVertical) {
          item.style.marginBottom = `${spaceBetween}px`;
        } else {
          item.style.marginRight = `${spaceBetween}px`;
          item.style.flexShrink = 0;
        }
        const sizeEl = getElSize(item, isVertical);
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
        items.forEach((item) => item.style.removeProperty("margin-right"));
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
