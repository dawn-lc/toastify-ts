
type Gravity = "top" | "bottom";
type Position = "left" | "center" | "right";
type AriaLive = "off" | "polite" | "assertive";
type CSSProperties = Partial<Record<keyof CSSStyleDeclaration, string>>;

/**
 * Toastify 配置选项接口
 * @property {HTMLElement} [root] - 根节点
 * @property {string} [text] - 显示的文本内容
 * @property {Node} [node] - 自定义 DOM 节点替代文本
 * @property {number} [duration=3000] - 自动关闭延时（毫秒）
 * @property {boolean} [close] - 是否显示关闭按钮
 * @property {Gravity} [gravity="top"] - 显示位置（顶部/底部）
 * @property {Position} [position="left"] - 水平对齐方式
 * @property {AriaLive} [ariaLive="polite"] - 屏幕阅读器播报模式
 * @property {string} [className] - 自定义 CSS 类名
 * @property {boolean} [stopOnFocus=true] - 鼠标悬停时暂停自动关闭
 * @property {() => void} [onClose] - 关闭后的回调函数
 * @property {(e: MouseEvent) => void} [onClick] - 点击事件回调
 * @property {CSSProperties} [style] - 行内样式配置
 * @property {boolean} [oldestFirst=true] - 新通知的排列顺序
 */
interface ToastifyOptions {
    root?: Element;
    text?: string;
    node?: Node;
    duration?: number;
    close?: boolean;
    gravity?: Gravity;
    position?: Position;
    ariaLive?: AriaLive;
    className?: string;
    stopOnFocus?: boolean;
    onClose?: () => void;
    onClick?: (e: Event) => void;
    style?: CSSProperties;
    oldestFirst?: boolean;
}

class ToastManager {
    private static timeoutMap = new Map<HTMLElement, number>();
    private static containers = new Map<string, HTMLElement>();

    static getContainer(gravity: Gravity, position: Position): HTMLElement {
        const containerId = `toast-container-${gravity}-${position}`;
        if (this.containers.has(containerId)) {
            return this.containers.get(containerId)!;
        }
        return this.createContainer(containerId, gravity, position);
    }

    private static createContainer(id: string, gravity: Gravity, position: Position): HTMLElement {
        const container = document.createElement("div");
        container.classList.add('toast-container', id, `toastify-${gravity}`, `toastify-${position}`);
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', `Toast notifications - ${gravity} ${position}`);
        document.body.appendChild(container);
        this.containers.set(id, container);
        return container;
    }

    static setAutoDismiss(element: HTMLElement, duration: number, callback: () => void) {
        this.clearTimeout(element);
        const timeoutId = window.setTimeout(() => {
            callback();
            this.clearTimeout(element);
        }, duration);
        this.timeoutMap.set(element, timeoutId);
    }

    static clearTimeout(element: HTMLElement) {
        if (this.timeoutMap.has(element)) {
            clearTimeout(this.timeoutMap.get(element)!);
            this.timeoutMap.delete(element);
        }
    }
}

class ToastBuilder {
    static build(options: ToastifyOptions): HTMLElement {
        const toast = document.createElement("div");
        this.applyBaseStyles(toast, options);
        this.addContent(toast, options);
        this.addInteractiveElements(toast, options);
        return toast;
    }

    private static applyBaseStyles(element: HTMLElement, options: ToastifyOptions) {
        element.classList.add(
            'toastify',
            `toastify-${options.gravity}`,
            `toastify-${options.position}`
        );
        if (options.className) element.classList.add(options.className);
        if (options.style) this.applyCustomStyles(element, options.style);
        if (options.ariaLive) element.setAttribute('aria-live', options.ariaLive);
    }

    private static applyCustomStyles(element: HTMLElement, styles: CSSProperties) {
        Object.entries(styles).forEach(([prop, value]) => {
            (element.style as any)[prop] = value;
        });
    }

    private static addContent(element: HTMLElement, options: ToastifyOptions) {
        element.textContent = options.text ?? null;
        if (options.node) element.appendChild(options.node);
    }

    private static addInteractiveElements(element: HTMLElement, options: ToastifyOptions) {
        if (options.close) this.addCloseButton(element, options);
        if (options.onClick) element.addEventListener("click", e => options.onClick?.(e));
    }

    private static addCloseButton(element: HTMLElement, options: ToastifyOptions) {
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
    private readonly defaults: ToastifyOptions = {
        text: "Toastify is awesome!",
        duration: 3000,
        close: false,
        gravity: "top",
        position: 'left',
        ariaLive: "polite",
        stopOnFocus: true,
        oldestFirst: true,
    };
    
    public options: ToastifyOptions;
    public toastElement: HTMLElement;

    private root: Element;
    private gravity: Gravity;
    private position: Position;
    private oldestFirst: boolean;

    /**
     * 创建 Toastify 实例
     * @param options 用户配置选项，将与默认配置深度合并
     */
    constructor(options: ToastifyOptions) {
        this.options = { 
            ...this.defaults,
            ...options
        };
        this.gravity = this.options.gravity!;
        this.position = this.options.position!;
        this.root = this.options.root ?? ToastManager.getContainer(this.gravity, this.position);
        this.oldestFirst = this.options.oldestFirst!;
    }
    
    /**
     * 显示 Toast 通知
     * @returns this 实例用于链式调用
     */
    public showToast(): this {
        this.toastElement = ToastBuilder.build(this.options);
        const elementToInsert = this.oldestFirst ? this.root.firstChild : this.root.lastChild;
        this.root.insertBefore(this.toastElement!, elementToInsert);
        if (!this.toastElement.classList.replace('hide','show')) {
            this.toastElement.classList.add('show')
        }
        if (this.options.duration && this.options.duration > 0) {
            ToastManager.setAutoDismiss(this.toastElement, this.options.duration!, () => this.removeElement(this.toastElement));
        }
        return this;
    }
    /**
     * 立即隐藏当前 Toast
     * 会触发 CSS 离场动画并在动画完成后移除元素
     */
    public hideToast(): void {
        if (!this.toastElement) return;
        const handleAnimationEnd = () => {
            this.toastElement?.removeEventListener('animationend', handleAnimationEnd);
            this.removeElement(this.toastElement);
        };
        this.toastElement.addEventListener('animationend', handleAnimationEnd);
        if (!this.toastElement.classList.replace('show','hide')) {
            this.toastElement.classList.add('hide')
        }
        ToastManager.clearTimeout(this.toastElement);
    }

    /**
     * 移除指定元素并触发回调
     * @param element - 需要移除的 Toast 元素
     * @private
     */
    private removeElement(element: HTMLElement | null): void {
        if (!element) return;
        const handleAnimationEnd = () => {
            element?.removeEventListener('animationend', handleAnimationEnd);
            element?.remove();
            this.options.onClose?.();
        };
        element.addEventListener('animationend', handleAnimationEnd);
        ToastManager.clearTimeout(element);
        if (!this.toastElement.classList.replace('show','hide')) {
            this.toastElement.classList.add('hide')
        }
    }
}