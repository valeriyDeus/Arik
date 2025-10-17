import { g as getDigFormat } from "./app.min.js";
import "./letstalk.min.js";
/* empty css               */
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
