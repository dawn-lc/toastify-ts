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
    static build(toast) {
        this.applyBaseStyles(toast);
        this.addContent(toast);
        this.addInteractiveElements(toast);
    }
    static applyBaseStyles(toast) {
        toast.element.setAttribute('aria-live', toast.ariaLive);
        toast.element.classList.add('toastify', `toastify-${toast.gravity}`, `toastify-${toast.position}`);
        if (toast.options.className)
            toast.element.classList.add(toast.options.className);
        if (toast.options.style)
            this.applyCustomStyles(toast.element, toast.options.style);
    }
    static applyCustomStyles(element, styles) {
        Object.entries(styles).forEach(([prop, value]) => {
            element.style[prop] = value;
        });
    }
    static addContent(toast) {
        if (toast.options.text)
            toast.element.textContent = toast.options.text;
        if (toast.options.node)
            toast.element.appendChild(toast.options.node);
    }
    static addInteractiveElements(toast) {
        if (toast.close)
            this.addCloseButton(toast);
        if (toast.onClick)
            toast.element.addEventListener("click", e => toast.onClick?.(e));
    }
    static addCloseButton(toast) {
        const closeBtn = document.createElement("span");
        closeBtn.ariaLabel = "Close";
        closeBtn.className = "toast-close";
        closeBtn.textContent = "x";
        closeBtn.addEventListener("click", e => toast.hideToast());
        toast.element.appendChild(closeBtn);
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
        duration: 3000,
        gravity: "top",
        position: 'left',
        ariaLive: "polite",
        close: false,
        stopOnFocus: true,
        oldestFirst: true,
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
     * 创建 Toastify 实例
     * @param options 用户配置选项，将与默认配置深度合并
     */
    constructor(options) {
        this.options = {
            ...this.defaults,
            ...options
        };
        this.element = document.createElement("div");
        this.gravity = this.options.gravity;
        this.position = this.options.position;
        this.root = this.options.root ?? ToastManager.getContainer(this.gravity, this.position);
        this.close = this.options.close;
        this.oldestFirst = this.options.oldestFirst;
        this.stopOnFocus = this.options.stopOnFocus;
        this.ariaLive = this.options.ariaLive;
        if (this.options.onClick)
            this.onClick = this.options.onClick;
        if (this.options.onClose)
            this.onClose = this.options.onClose;
        ToastBuilder.build(this);
    }
    /**
     * 显示 Toast 通知
     * @returns this 实例用于链式调用
     */
    showToast() {
        const elementToInsert = this.oldestFirst ? this.root.firstChild : this.root.lastChild;
        this.root.insertBefore(this.element, elementToInsert);
        if (!this.element.classList.replace('hide', 'show')) {
            this.element.classList.add('show');
        }
        if (this.options.duration && this.options.duration > 0) {
            ToastManager.setAutoDismiss(this.element, this.options.duration, () => this.hideToast());
        }
        return this;
    }
    /**
     * 立即隐藏当前 Toast
     * 会触发 CSS 离场动画并在动画完成后移除元素
     */
    hideToast() {
        if (!this.element)
            return;
        ToastManager.clearTimeout(this.element);
        const handleAnimationEnd = () => {
            this.element?.removeEventListener('animationend', handleAnimationEnd);
            this.element?.remove();
            this.onClose?.();
        };
        this.element.addEventListener('animationend', handleAnimationEnd);
        if (!this.element.classList.replace('show', 'hide')) {
            this.element.classList.add('hide');
        }
    }
}
