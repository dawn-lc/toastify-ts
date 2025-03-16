class ToastManager {
    static timeoutMap = new Map();
    static containers = new Map();
    static getContainer(gravity, position) {
        const containerId = `toast-container-${gravity}-${position}`;
        if (this.containers.has(containerId)) {
            return this.containers.get(containerId);
        }
        return this.createContainer(containerId, gravity, position);
    }
    static createContainer(id, gravity, position) {
        const container = document.createElement("div");
        container.classList.add('toast-container', id, `toastify-${gravity}`, `toastify-${position}`);
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', `Toast notifications - ${gravity} ${position}`);
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
class ToastBuilder {
    static build(options) {
        const toast = document.createElement("div");
        this.applyBaseStyles(toast, options);
        this.addContent(toast, options);
        this.addInteractiveElements(toast, options);
        return toast;
    }
    static applyBaseStyles(element, options) {
        element.classList.add('toastify', `toastify-${options.gravity}`, `toastify-${options.position}`);
        if (options.className)
            element.classList.add(options.className);
        if (options.style)
            this.applyCustomStyles(element, options.style);
        if (options.ariaLive)
            element.setAttribute('aria-live', options.ariaLive);
    }
    static applyCustomStyles(element, styles) {
        Object.entries(styles).forEach(([prop, value]) => {
            element.style[prop] = value;
        });
    }
    static addContent(element, options) {
        element.textContent = options.text ?? null;
        if (options.node)
            element.appendChild(options.node);
    }
    static addInteractiveElements(element, options) {
        if (options.close)
            this.addCloseButton(element, options);
        if (options.onClick)
            element.addEventListener("click", e => options.onClick?.(e));
    }
    static addCloseButton(element, options) {
        const closeBtn = document.createElement("span");
        closeBtn.ariaLabel = "Close";
        closeBtn.className = "toast-close";
        closeBtn.textContent = "x";
        closeBtn.addEventListener("click", e => {
            e.stopPropagation();
            options.onClose?.();
        });
        element.appendChild(closeBtn);
    }
}
/**
 * Toastify 通知组件核心类
 *
 * 提供 Toast 通知的显示、隐藏和布局管理功能，支持丰富的配置选项。
 *
 * @example
 * new Toastify({ text: "Hello World" }).showToast();
 */
class Toastify {
    defaults = {
        text: "Toastify is awesome!",
        duration: 3000,
        close: false,
        gravity: "top",
        position: 'left',
        ariaLive: "polite",
        stopOnFocus: true,
        oldestFirst: true,
    };
    options;
    toastElement;
    root;
    gravity;
    position;
    oldestFirst;
    /**
     * 创建 Toastify 实例
     * @param options 用户配置选项，将与默认配置深度合并
     */
    constructor(options) {
        this.options = {
            ...this.defaults,
            ...options
        };
        this.gravity = this.options.gravity;
        this.position = this.options.position;
        this.root = this.options.root ?? ToastManager.getContainer(this.gravity, this.position);
        this.oldestFirst = this.options.oldestFirst;
    }
    /**
     * 显示 Toast 通知
     * @returns this 实例用于链式调用
     */
    showToast() {
        this.toastElement = ToastBuilder.build(this.options);
        const elementToInsert = this.oldestFirst ? this.root.firstChild : this.root.lastChild;
        this.root.insertBefore(this.toastElement, elementToInsert);
        if (!this.toastElement.classList.replace('hide', 'show')) {
            this.toastElement.classList.add('show');
        }
        if (this.options.duration && this.options.duration > 0) {
            ToastManager.setAutoDismiss(this.toastElement, this.options.duration, () => this.removeElement(this.toastElement));
        }
        return this;
    }
    /**
     * 立即隐藏当前 Toast
     * 会触发 CSS 离场动画并在动画完成后移除元素
     */
    hideToast() {
        if (!this.toastElement)
            return;
        const handleAnimationEnd = () => {
            this.toastElement?.removeEventListener('animationend', handleAnimationEnd);
            this.removeElement(this.toastElement);
        };
        this.toastElement.addEventListener('animationend', handleAnimationEnd);
        if (!this.toastElement.classList.replace('show', 'hide')) {
            this.toastElement.classList.add('hide');
        }
        ToastManager.clearTimeout(this.toastElement);
    }
    /**
     * 移除指定元素并触发回调
     * @param element - 需要移除的 Toast 元素
     * @private
     */
    removeElement(element) {
        if (!element)
            return;
        const handleAnimationEnd = () => {
            element?.removeEventListener('animationend', handleAnimationEnd);
            element?.remove();
            this.options.onClose?.();
        };
        element.addEventListener('animationend', handleAnimationEnd);
        ToastManager.clearTimeout(element);
        if (!this.toastElement.classList.replace('show', 'hide')) {
            this.toastElement.classList.add('hide');
        }
    }
}
