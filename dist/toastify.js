"use strict";
(() => {
  var Toastify;
  ((Toastify2) => {
    class Manager {
      static timeoutMap = /* @__PURE__ */ new Map();
      static containers = /* @__PURE__ */ new Map();
      static getContainer(gravity, position) {
        const containerId = `toast-container-${gravity}-${position}`;
        if (this.containers.has(containerId)) {
          return this.containers.get(containerId);
        }
        return this.createContainer(containerId, gravity, position);
      }
      static createContainer(id, gravity, position) {
        const container = document.createElement("div");
        container.classList.add("toast-container", id, `toast-${gravity}`, `toast-${position}`);
        container.setAttribute("role", "region");
        container.setAttribute("aria-label", `Toast notifications - ${gravity} ${position}`);
        document.body.appendChild(container);
        this.containers.set(id, container);
        return container;
      }
      static addTimeout(toast, duration, callback) {
        this.delTimeout(toast);
        const timeoutId = window.setTimeout(() => {
          callback();
          this.delTimeout(toast);
        }, duration);
        this.timeoutMap.set(toast, timeoutId);
      }
      static delTimeout(toast) {
        if (this.timeoutMap.has(toast)) {
          clearTimeout(this.timeoutMap.get(toast));
          this.timeoutMap.delete(toast);
        }
      }
    }
    class Builder {
      static build(toast) {
        this.applyBaseStyles(toast);
        this.addContent(toast);
        this.addCloseButton(toast);
        this.bindEvent(toast);
        this.measureToastDimensions(toast);
      }
      /**
       * Measures toast dimensions and sets CSS custom properties
       * @param toast Toast instance to measure
       */
      static measureToastDimensions(toast) {
        const { element } = toast;
        const originalStyles = {
          display: element.style.display,
          visibility: element.style.visibility,
          position: element.style.position
        };
        const tempStyles = {
          display: "block",
          visibility: "hidden",
          position: "absolute"
        };
        this.applyCustomStyles(element, tempStyles);
        document.body.appendChild(element);
        const { height, width } = element.getBoundingClientRect();
        element.style.setProperty(`--toast-height`, `${height}px`);
        element.style.setProperty(`--toast-width`, `${width}px`);
        document.body.removeChild(element);
        this.applyCustomStyles(element, originalStyles);
      }
      static applyBaseStyles(toast) {
        toast.element.setAttribute("aria-live", toast.ariaLive);
        toast.element.classList.add(
          "toast",
          `toast-${toast.gravity}`,
          `toast-${toast.position}`
        );
        if (toast.options.className) Array.isArray(toast.options.className) ? toast.options.className.every((i) => toast.element.classList.add(i)) : toast.element.classList.add(toast.options.className);
      }
      static applyCustomStyles(element, styles) {
        for (const key in styles) {
          if (styles[key] === void 0) continue;
          element.style[key] = styles[key];
        }
      }
      static addContent(toast) {
        toast.element.appendChild(this.createContentElement(toast));
      }
      static bindEvent(toast) {
        if (toast.stopOnFocus && toast.duration > 0) {
          toast.element.addEventListener("mouseover", () => {
            Manager.delTimeout(toast);
          });
          toast.element.addEventListener("mouseleave", () => {
            Manager.addTimeout(toast, toast.duration, () => toast.hide());
          });
        }
        if (toast.onClick) toast.element.addEventListener("click", (e) => toast.onClick?.bind(toast)(e));
        if (!toast.close && !toast.onClick && toast.duration < 0) toast.element.addEventListener("click", () => toast.hide());
      }
      static addCloseButton(toast) {
        if (toast.close) toast.element.appendChild(this.createCloseButton(toast));
      }
      static createContentElement(toast) {
        const content = document.createElement("div");
        content.classList.add("toast-content");
        if (toast.options.text) content.textContent = toast.options.text;
        if (toast.options.node) content.appendChild(toast.options.node);
        if (toast.options.style) this.applyCustomStyles(content, toast.options.style);
        return content;
      }
      static createCloseButton(toast) {
        const closeBtn = document.createElement("span");
        closeBtn.ariaLabel = "Close";
        closeBtn.className = "toast-close";
        closeBtn.textContent = "🗙";
        closeBtn.addEventListener("click", () => toast.hide());
        return closeBtn;
      }
    }
    class Toast2 {
      defaults = {
        gravity: "top",
        position: "right",
        ariaLive: "polite",
        stopOnFocus: true,
        oldestFirst: true
      };
      options;
      duration;
      element;
      root;
      gravity;
      position;
      ariaLive;
      close;
      oldestFirst;
      stopOnFocus;
      onClick;
      onClose;
      /**
       * Create a Toastify instance
       * @param options User configuration options
       */
      constructor(options) {
        this.options = {
          ...this.defaults,
          ...options
        };
        this.element = document.createElement("div");
        this.gravity = this.options.gravity;
        this.position = this.options.position;
        this.root = this.options.root ?? Manager.getContainer(this.gravity, this.position);
        this.ariaLive = this.options.ariaLive;
        this.oldestFirst = this.options.oldestFirst;
        this.stopOnFocus = this.options.stopOnFocus;
        this.duration = this.options.duration ?? -1;
        this.close = this.options.close ?? false;
        if (this.options.onClick) this.onClick = this.options.onClick;
        if (this.options.onClose) this.onClose = this.options.onClose;
        Builder.build(this);
      }
      /**
       * Display the Toast notification
       * @returns this Instance for method chaining
       */
      show() {
        const elementToInsert = this.oldestFirst ? this.root.firstChild : this.root.lastChild;
        this.root.insertBefore(this.element, elementToInsert);
        if (!this.element.classList.replace("hide", "show")) {
          this.element.classList.add("show");
        }
        if (this.duration && this.duration > 0) {
          Manager.addTimeout(this, this.duration, () => this.hide());
        }
        return this;
      }
      /**
       * @deprecated This function is deprecated. Use the show() instead.
       */
      showToast() {
        return this.show();
      }
      /**
       * Immediately hide the current Toast
       * Triggers a CSS exit animation and removes the element after the animation completes
       */
      hide() {
        if (!this.element) return;
        Manager.delTimeout(this);
        const handleAnimationEnd = (e) => {
          if (e.animationName.startsWith("toast-out")) {
            this.element?.removeEventListener("animationend", handleAnimationEnd);
            this.element?.remove();
          }
        };
        this.element.addEventListener("animationend", handleAnimationEnd);
        if (!this.element.classList.replace("show", "hide")) {
          this.element.classList.add("hide");
        }
        this.onClose?.bind(this);
      }
      /**
       * @deprecated This function is deprecated. Use the hide() instead.
       */
      hideToast() {
        this.hide();
      }
    }
    Toastify2.Toast = Toast2;
  })(Toastify || (Toastify = {}));
  function Toast(options) {
    return new Toastify.Toast(options);
  }
  globalThis.Toast = Toast;
  globalThis.Toastify = Toast;
})();
