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
        container.classList.add("toast-container", id, `toastify-${gravity}`, `toastify-${position}`);
        container.setAttribute("role", "region");
        container.setAttribute("aria-label", `Toast notifications - ${gravity} ${position}`);
        document.body.appendChild(container);
        this.containers.set(id, container);
        return container;
      }
      static setAutoDismiss(element, duration, callback) {
        this.clearTimeout(element);
        const timeoutId = window.setTimeout(() => {
          callback();
          this.clearTimeout(element);
        }, duration);
        this.timeoutMap.set(element, timeoutId);
      }
      static clearTimeout(element) {
        if (this.timeoutMap.has(element)) {
          clearTimeout(this.timeoutMap.get(element));
          this.timeoutMap.delete(element);
        }
      }
    }
    class Builder {
      static build(toast) {
        this.applyBaseStyles(toast);
        this.addContent(toast);
        this.addInteractiveElements(toast);
      }
      static applyBaseStyles(toast) {
        toast.element.setAttribute("aria-live", toast.ariaLive);
        toast.element.classList.add(
          "toastify",
          `toastify-${toast.gravity}`,
          `toastify-${toast.position}`
        );
        if (toast.options.className) toast.element.classList.add(toast.options.className);
        if (toast.options.style) this.applyCustomStyles(toast.element, toast.options.style);
      }
      static applyCustomStyles(element, styles) {
        for (const key in styles) {
          element.style[key] = styles[key];
        }
      }
      static addContent(toast) {
        if (toast.options.text) toast.element.textContent = toast.options.text;
        if (toast.options.node) toast.element.appendChild(toast.options.node);
      }
      static addInteractiveElements(toast) {
        if (toast.close) this.addCloseButton(toast);
        if (toast.onClick) toast.element.addEventListener("click", (e) => toast.onClick?.(e));
      }
      static addCloseButton(toast) {
        const closeBtn = document.createElement("span");
        closeBtn.ariaLabel = "Close";
        closeBtn.className = "toast-close";
        closeBtn.textContent = "x";
        closeBtn.addEventListener("click", (e) => toast.hideToast());
        toast.element.appendChild(closeBtn);
      }
    }
    class Toast2 {
      defaults = {
        duration: 3e3,
        gravity: "top",
        position: "right",
        ariaLive: "polite",
        close: false,
        stopOnFocus: true,
        oldestFirst: true
      };
      options;
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
        this.close = this.options.close;
        this.oldestFirst = this.options.oldestFirst;
        this.stopOnFocus = this.options.stopOnFocus;
        this.ariaLive = this.options.ariaLive;
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
        if (this.options.duration && this.options.duration > 0) {
          Manager.setAutoDismiss(this.element, this.options.duration, () => this.hideToast());
        }
        return this;
      }
      showToast() {
        return this.show();
      }
      /**
       * Immediately hide the current Toast
       * Triggers a CSS exit animation and removes the element after the animation completes
       */
      hide() {
        if (!this.element) return;
        Manager.clearTimeout(this.element);
        const handleAnimationEnd = () => {
          this.element?.removeEventListener("animationend", handleAnimationEnd);
          this.element?.remove();
          this.onClose?.();
        };
        this.element.addEventListener("animationend", handleAnimationEnd);
        if (!this.element.classList.replace("show", "hide")) {
          this.element.classList.add("hide");
        }
      }
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
})();
//# sourceMappingURL=toastify.js.map
