import "./app.min.js";
import "./letstalk.min.js";
/* empty css               */
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
    this.mediaQueries = this.objects.map(({ breakpoint }) => `(${this.type}-width: ${breakpoint / 16}em),${breakpoint}`).filter((item, index, self) => self.indexOf(item) === index);
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
