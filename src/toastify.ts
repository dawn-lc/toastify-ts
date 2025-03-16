/*!
 * Toastify js 1.12.0
 * https://github.com/apvarun/toastify-js
 * @license MIT licensed
 *
 * Copyright (C) 2018 Varun A P
 */
/**
 * Toastify 配置选项接口
* @property {Element} [root] - 根节点
 * @property {string} [text] - 显示的文本内容
 * @property {Node} [node] - 自定义 DOM 节点替代文本
 * @property {number} [duration=3000] - 自动关闭延时（毫秒）
 * @property {boolean} [close] - 是否显示关闭按钮
 * @property {|"top"|"bottom"} [gravity="top"] - 显示位置（顶部/底部）
 * @property {"left"|"center"|"right"} [position="left"] - 水平对齐方式
 * @property {"off"|"polite"|"assertive"} [ariaLive="polite"] - 屏幕阅读器播报模式
 * @property {string} [className] - 自定义 CSS 类名
 * @property {boolean} [stopOnFocus=true] - 鼠标悬停时暂停自动关闭
 * @property {() => void} [callback] - 关闭后的回调函数
 * @property {() => void} [onClick] - 点击事件回调
 * @property {Record<string, string>} style - 行内样式配置
 * @property {boolean} [oldestFirst=true] - 新通知的排列顺序
 */
interface ToastifyOptions {
    root?: Element;
    text?: string;
    node?: Node;
    duration?: number;
    close?: boolean;
    gravity?: "top" | "bottom";
    position?: "left" | "center" | "right";
    ariaLive?: "off" | "polite" | "assertive";
    className?: string;
    stopOnFocus?: boolean;
    callback?: () => void;
    onClick?: (e: Event) => void;
    style?: Record<string, string>;
    oldestFirst?: boolean;
}

var ToastTimeoutMap = new Map<HTMLElement, number>();
var ToastContainers = new Map<string, HTMLElement>();

/**
 * 生成对应位置的 Toast 容器
 * @param gravity 位置类型（top/bottom）
 * @param position 对齐方式（left/center/right）
 * @returns 新创建或已存在的容器元素
 */
function getOrCreateContainer(gravity: "top" | "bottom", position: "left" | "center" | "right"): HTMLElement {
    const containerId = `toast-container-${gravity}-${position}`;
    if (ToastContainers.has(containerId)) {
        return ToastContainers.get(containerId)!;
    }
    const container = document.createElement("div");
    container.classList.add('toast-container', containerId, `toastify-${gravity}`, `toastify-${position}`);
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', `Toast notifications - ${gravity} ${position}`);
    document.body.appendChild(container);
    ToastContainers.set(containerId, container);
    return container;
}
/**
 * Toastify 通知组件核心类
 * 
 * 提供 Toast 通知的创建、显示、管理和布局功能，支持丰富的配置选项和自定义样式。
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
        style: {},
        oldestFirst: true,
    };
    
    public options: ToastifyOptions;
    public toastElement: HTMLElement;

    /**
     * 创建 Toastify 实例
     * @param options 用户配置选项，将与默认配置深度合并
     */
    constructor(options: ToastifyOptions) {
        this.options = { 
            ...this.defaults,
            ...options
        };
        if(!this.options.root) {
            this.options.root = getOrCreateContainer(this.options.gravity!, this.options.position!);
        }
    }

    /**
     * 构建 Toast 的 DOM 结构
     * @returns 组装完成的 Toast 元素
     * @private
     */
    private buildToast(): HTMLElement {
        const toast = document.createElement("div");
        toast.classList.add(
            'toastify',
            `toastify-${this.options.gravity}`,
            `toastify-${this.options.position}`
        );
        if (this.options.className) {
            toast.classList.add(this.options.className);
        }
        this.applyStyles(toast);
        this.setAriaLive(toast);
        this.addContent(toast);
        this.addHoverHandlers(toast);
        if (this.options.close) this.addCloseButton(toast);
        if (this.options.onClick) this.addClickHandlers(toast);

        return toast;
    }

    /**
     * 显示 Toast 通知
     * @returns this 实例用于链式调用
     */
    public showToast(): this {
        this.toastElement = this.buildToast();
        this.insertToast();
        if (!this.toastElement.classList.replace('hide','show')) {
            this.toastElement.classList.add('show')
        }
        if (this.options.duration && this.options.duration > 0) {
            this.setAutoDismissTimeout();
        }
        return this;
    }

    private removeTimeout(element: HTMLElement) {
        if (ToastTimeoutMap.has(element)) {
            clearTimeout(ToastTimeoutMap.get(element));
            ToastTimeoutMap.delete(element);
        }
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
        this.removeTimeout(this.toastElement);
    }

    /**
     * 应用行内样式到指定元素
     * @param element - 要应用样式的目标元素
     * @private
     */
    private applyStyles(element: HTMLElement): void {
        if (this.options.style) {
            Object.entries(this.options.style).forEach(([prop, value]) => {
                (element.style as any)[prop] = value;
            });
        }
    }

    /**
     * 设置 ARIA 实时区域属性
     * @param element - 需要设置属性的 DOM 元素
     * @private
     */
    private setAriaLive(element: HTMLElement): void {
        if (this.options.ariaLive) {
            element.setAttribute('aria-live', this.options.ariaLive);
        }
    }

    /**
     * 添加主要内容到 Toast 元素
     * @param element - 需要添加内容的父元素
     * @private
     */
    private addContent(element: HTMLElement): void {
        element.textContent = this.options.text ?? null;
        if (this.options.node) {
            element.appendChild(this.options.node);
        }
    }

    /**
     * 添加关闭按钮并绑定事件
     * @param element - 需要添加关闭按钮的父元素
     * @private
     */
    private addCloseButton(element: HTMLElement): void {
        if (this.options.close) {
            const closeBtn = document.createElement("span");
            closeBtn.ariaLabel = "Close";
            closeBtn.className = "toast-close";
            closeBtn.textContent = "&#10006;";
            closeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.removeElement(element);
                this.removeTimeout(element);
            });
            element.appendChild(closeBtn);
        }
    }

    /**
     * 添加鼠标悬停暂停功能
     * @param element - 需要绑定事件的 Toast 元素
     * @private
     */
    private addHoverHandlers(element: HTMLElement): void {
        if (this.options.stopOnFocus && this.options.duration && this.options.duration > 0) {
            element.addEventListener("mouseover", () =>  this.removeTimeout(element));
            element.addEventListener("mouseleave", () => this.setAutoDismissTimeout(element));
        }
    }

    /**
     * 处理 Toast 点击事件
     * @param element - 需要绑定点击事件的 Toast 元素
     * @private
     */
    private addClickHandlers(element: HTMLElement): void {
        element.addEventListener("click", (e) => {
            e.stopPropagation();
            this.options.onClick?.(e);
        });
    }

    /**
     * 将 Toast 插入到 DOM 树中
     * @throws 当找不到根元素时抛出异常
     * @private
     */
    private insertToast(): void {
        if (!this.options.root) throw "not find toast root";
        const elementToInsert = this.options.oldestFirst ? this.options.root.firstChild : this.options.root.lastChild;
        this.options.root.insertBefore(this.toastElement!, elementToInsert);
    }
    /**
     * 设置自动关闭计时器
     * @param element - 目标 Toast 元素，默认为当前实例的 toastElement
     * @private
     * @note 计时器 ID 会存储在 timeoutMap 中便于后续管理
     */
    private setAutoDismissTimeout(element: HTMLElement = this.toastElement!): void {
        const timeoutId = window.setTimeout(
            () => this.removeElement(element),
            this.options.duration
        );
        ToastTimeoutMap.set(element, timeoutId);
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
            this.options.callback?.();
        };
        element.addEventListener('animationend', handleAnimationEnd);
        this.removeTimeout(element);
        if (!this.toastElement.classList.replace('show','hide')) {
            this.toastElement.classList.add('hide')
        }
    }
}
