/*!
 * Toastify js 1.12.0
 * https://github.com/apvarun/toastify-js
 * @license MIT licensed
 *
 * Copyright (C) 2018 Varun A P
 */
/**
 * 表示 Toast 元素的偏移量配置
 */
interface Offset {
    x: number | string;  // X 轴偏移量，支持像素值或字符串格式
    y: number | string;  // Y 轴偏移量，支持像素值或字符串格式
}
/**
 * Toastify 配置选项接口
 * @property {string} [text] - 显示的文本内容
 * @property {Node} [node] - 自定义 DOM 节点替代文本
 * @property {number} [duration=3000] - 自动关闭延时（毫秒）
 * @property {string|Node} [selector] - 挂载元素的 CSS 选择器或 DOM 节点
 * @property {string} [destination] - 点击跳转的目标 URL
 * @property {boolean} [newWindow=false] - 是否在新窗口打开链接
 * @property {boolean} [close] - 是否显示关闭按钮
 * @property {"toastify-top"|"toastify-bottom"|"top"|"bottom"} [gravity="toastify-top"] - 显示位置（顶部/底部）
 * @property {"left"|"center"|"right"|""} [position] - 水平对齐方式
 * @property {boolean} [positionLeft] - 是否靠左显示（兼容旧版配置）
 * @property {"off"|"polite"|"assertive"} [ariaLive="polite"] - 屏幕阅读器播报模式
 * @property {string} [avatar] - 头像图片 URL
 * @property {string} [className] - 自定义 CSS 类名
 * @property {boolean} [stopOnFocus=true] - 鼠标悬停时暂停自动关闭
 * @property {() => void} [callback] - 关闭后的回调函数
 * @property {() => void} [onClick] - 点击事件回调
 * @property {Offset} [offset] - 显示位置偏移量配置
 * @property {boolean} [escapeMarkup=true] - 是否转义 HTML 内容
 * @property {Record<string, string>} style - 行内样式配置
 * @property {boolean} [oldestFirst=true] - 新通知的排列顺序
 * @property {string} [backgroundColor] - 背景颜色（快捷设置）
 */
interface ToastifyOptions {
    text?: string;
    node?: Node;
    duration?: number;
    selector?: string | Node;
    destination?: string;
    newWindow?: boolean;
    close?: boolean;
    gravity?: "toastify-top" | "toastify-bottom" | "top" | "bottom";
    position?: "left" | "center" | "right" | "";
    positionLeft?: boolean;
    ariaLive?: "off" | "polite" | "assertive";
    avatar?: string;
    className?: string;
    stopOnFocus?: boolean;
    callback?: () => void;
    onClick?: () => void;
    offset?: Offset;
    escapeMarkup?: boolean;
    style: Record<string, string>;
    oldestFirst?: boolean;
    backgroundColor?: string;
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
    // 存储 Toast 元素和对应的计时器 ID
    private timeoutMap = new Map<HTMLElement, number>();
    
    private readonly defaults: ToastifyOptions = {
        oldestFirst: true,
        text: "Toastify is awesome!",
        node: undefined,
        duration: 3000,
        selector: undefined,
        callback: () => {},
        destination: undefined,
        newWindow: false,
        close: false,
        gravity: "toastify-top",
        positionLeft: false,
        position: '',
        backgroundColor: '',
        avatar: "",
        className: "",
        stopOnFocus: true,
        onClick: () => {},
        offset: { x: 0, y: 0 },
        escapeMarkup: true,
        ariaLive: "polite",
        style: { background: "" },
    };

    public readonly version: string = "1.12.0";
    public options: ToastifyOptions;
    public toastElement: HTMLElement | null = null;
    private rootElement: HTMLElement | ShadowRoot = document.body;

    constructor(options: ToastifyOptions = { style: {} }) {
        this.options = { ...this.defaults, ...options };
        if (!this.options.style) {
            this.options.style = {};
        }
        this.init(options);
    }

    /**
     * 显示 Toast 通知
     * @returns this 实例用于链式调用
     */
    public showToast(): this {
        this.toastElement = this.buildToast();
        this.setRootElement();
        this.insertToast();
        this.reposition();

        if (this.options.duration && this.options.duration > 0) {
            this.setAutoDismissTimeout();
        }

        return this;
    }

    /**
     * 立即隐藏当前 Toast
     * 会清除自动关闭计时器并触发移除动画
     */
    public hideToast(): void {
        if (this.toastElement && this.timeoutMap.has(this.toastElement)) {
            clearTimeout(this.timeoutMap.get(this.toastElement));
            this.timeoutMap.delete(this.toastElement);
        }
        this.removeElement(this.toastElement);
    }

    /**
     * 初始化配置参数
     * @param options 用户提供的配置选项
     * @private
     */
    /**
     * 初始化配置参数并设置默认值
     * @param options - 用户传入的配置选项
     * @private
     */
    private init(options: ToastifyOptions): void {
        this.options.gravity = options.gravity === "bottom" ? "toastify-bottom" : "toastify-top";
        this.options.stopOnFocus = options.stopOnFocus ?? true;
        this.options.positionLeft = options.positionLeft ?? false;
        
        if (options.backgroundColor) {
            this.options.style.background = options.backgroundColor;
        }
    }

    /**
     * 构建 Toast DOM 元素
     * @returns 构建完成的 Toast 元素
     * @private
     */
    /**
     * 构建 Toast 的 DOM 元素结构
     * @returns 组装完成的 Toast 元素
     * @private
     */
    private buildToast(): HTMLElement {
        const div = document.createElement("div");
        div.className = `toastify on ${this.options.className} toastify-${this.options.position} toastify-${this.options.gravity}`;

        this.applyStyles(div);
        this.setAriaLive(div);
        this.addContent(div);
        this.addCloseButton(div);
        this.addHoverHandlers(div);
        this.addClickHandlers(div);
        this.applyOffset(div);

        return div;
    }

    /**
     * 应用行内样式到 Toast 元素
     * @param element - 需要应用样式的 DOM 元素
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
        if (this.options.node?.nodeType === Node.ELEMENT_NODE) {
            element.appendChild(this.options.node);
        } else if (this.options.text) {
            element[this.options.escapeMarkup ? 'textContent' : 'innerHTML'] = this.options.text;
        }

        if (this.options.avatar) {
            const avatar = new Image();
            avatar.src = this.options.avatar;
            avatar.className = "toastify-avatar";
            this.options.position === "left" 
                ? element.appendChild(avatar)
                : element.insertAdjacentElement("afterbegin", avatar);
        }
    }

    /**
     * 添加关闭按钮并绑定事件
     * @param element - 需要添加关闭按钮的父元素
     * @private
     */
    private addCloseButton(element: HTMLElement): void {
        if (this.options.close) {
            const closeBtn = document.createElement("button");
            closeBtn.type = "button";
            closeBtn.ariaLabel = "Close";
            closeBtn.className = "toast-close";
            closeBtn.innerHTML = "&#10006;";

            closeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.removeElement(element);
                if (this.timeoutMap.has(element)) {
                    clearTimeout(this.timeoutMap.get(element));
                    this.timeoutMap.delete(element);
                }
            });

            const shouldPrepend = this.options.position === "left" && window.innerWidth > 360;
            shouldPrepend 
                ? element.insertAdjacentElement("afterbegin", closeBtn)
                : element.appendChild(closeBtn);
        }
    }

    /**
     * 添加鼠标悬停暂停功能
     * @param element - 需要绑定事件的 Toast 元素
     * @private
     */
    private addHoverHandlers(element: HTMLElement): void {
        if (this.options.stopOnFocus && this.options.duration && this.options.duration > 0) {
            element.addEventListener("mouseover", () => {
                if (this.timeoutMap.has(element)) {
                    clearTimeout(this.timeoutMap.get(element));
                    this.timeoutMap.delete(element);
                }
            });
            element.addEventListener("mouseleave", () => this.setAutoDismissTimeout(element));
        }
    }

    /**
     * 处理 Toast 点击事件
     * @param element - 需要绑定点击事件的 Toast 元素
     * @private
     */
    private addClickHandlers(element: HTMLElement): void {
        if (this.options.destination) {
            element.addEventListener("click", () => this.handleDestinationClick());
        } else if (this.options.onClick) {
            element.addEventListener("click", (e) => {
                e.stopPropagation();
                this.options.onClick?.();
            });
        }
    }

    /**
     * 处理目标链接点击事件
     * @private
     */
    private handleDestinationClick(): void {
        if (this.options.newWindow) {
            window.open(this.options.destination, "_blank");
        } else if (this.options.destination) {
            window.location.href = this.options.destination;
        }
    }

    /**
     * 应用位置偏移量到 Toast 元素
     * @param element - 需要应用偏移的 Toast 元素
     * @private
     */
    private applyOffset(element: HTMLElement): void {
        if (this.options.offset) {
            const x = this.getAxisValue("x");
            const y = this.getAxisValue("y");
            const xOffset = this.options.position === "left" ? x : `-${x}`;
            const yOffset = this.options.gravity === "top" ? y : `-${y}`;
            element.style.transform = `translate(${xOffset}, ${yOffset})`;
        }
    }

    /**
     * 获取坐标轴偏移量值
     * @param axis - 坐标轴名称 (x/y)
     * @returns 格式化后的偏移量字符串
     * @private
     */
    private getAxisValue(axis: keyof Offset): string {
        const value = this.options.offset?.[axis];
        return typeof value === "number" ? `${value}px` : value || "0px";
    }

    /**
     * 设置 Toast 挂载的根元素
     * @private
     */
    private setRootElement(): void {
        if (typeof this.options.selector === "string") {
            const el = document.getElementById(this.options.selector);
            if (el) this.rootElement = el;
        } else if (this.options.selector instanceof HTMLElement || this.options.selector instanceof ShadowRoot) {
            this.rootElement = this.options.selector;
        }
    }

    /**
     * 插入 Toast 到 DOM 树中
     * @private
     * @throws 当找不到根元素时抛出异常
     */
    private insertToast(): void {
        if (!this.rootElement) throw "Root element not found";
        
        // Use oldestFirst option to determine insertion position
        const elementToInsert = this.options.oldestFirst ? this.rootElement.firstChild : this.rootElement.lastChild;
        this.rootElement.insertBefore(this.toastElement!, elementToInsert);
    }

    /**
     * 设置自动关闭计时器
     * @param element - 需要设置计时器的 Toast 元素
     * @private
     */
    private setAutoDismissTimeout(element: HTMLElement = this.toastElement!): void {
        const timeoutId = window.setTimeout(
            () => this.removeElement(element),
            this.options.duration
        );
        this.timeoutMap.set(element, timeoutId);
    }

    /**
     * 移除指定元素并触发回调
     * @param element - 需要移除的 Toast 元素
     * @private
     */
    private removeElement(element: HTMLElement | null): void {
        if (!element) return;

        // 清除元素对应的计时器
        if (this.timeoutMap.has(element)) {
            clearTimeout(this.timeoutMap.get(element));
            this.timeoutMap.delete(element);
        }

        // Using className.replace like in JS version
        element.className = element.className.replace(" on", "");
        
        setTimeout(() => {
            // Remove options node if any (like in JS version)
            if (this.options.node && this.options.node.parentNode) {
                this.options.node.parentNode.removeChild(this.options.node);
            }
            
            if (element.parentNode) {
                element.parentNode.removeChild(element);
                
                // Calling the callback function
                this.options.callback?.();
                
                // Repositioning the toasts again
                this.reposition();
            }
        }, 400);
    }

    /**
     * 重新计算所有 Toast 的位置
     * 根据屏幕宽度和 gravity 设置自动调整位置偏移
     * @private
     */
    /**
     * 重新计算所有 Toast 的位置
     * 根据屏幕宽度和 gravity 设置自动调整位置偏移
     * @private
     */
    private reposition(): void {
        // Top margins with gravity
        const topLeftOffsetSize = { top: 15, bottom: 15 };
        const topRightOffsetSize = { top: 15, bottom: 15 };
        const offsetSize = { top: 15, bottom: 15 };

        const allToasts = this.rootElement.querySelectorAll(".toastify");
        const width = window.innerWidth > 0 ? window.innerWidth : screen.width;

        allToasts.forEach(toast => {
            const toastElement = toast as HTMLElement;
            const gravityClass = toastElement.classList.contains("toastify-top") ? "top" : "bottom";
            const height = toastElement.offsetHeight;
            const offset = 15;

            // Mobile handling (<= 360px)
            if (width <= 360) {
                toastElement.style[gravityClass] = `${offsetSize[gravityClass]}px`;
                offsetSize[gravityClass] += height + offset;
            } else {
                if (toastElement.classList.contains("toastify-left")) {
                    toastElement.style[gravityClass] = `${topLeftOffsetSize[gravityClass]}px`;
                    topLeftOffsetSize[gravityClass] += height + offset;
                } else {
                    toastElement.style[gravityClass] = `${topRightOffsetSize[gravityClass]}px`;
                    topRightOffsetSize[gravityClass] += height + offset;
                }
            }
        });
    }

    /**
     * 获取坐标轴偏移量值（兼容旧方法）
     * @param axis - 坐标轴名称 (x/y)
     * @param options - Toast 配置选项
     * @returns 格式化后的偏移量字符串
     * @private
     */
    private getAxisOffsetValue(axis: keyof Offset, options: ToastifyOptions): string {
        if (options.offset?.[axis]) {
            if (typeof options.offset[axis] === "number") {
                return `${options.offset[axis]}px`;
            }
            return options.offset[axis] as string;
        }
        return "0px";
    }
}

/**
 * 创建并返回 Toastify 实例的快捷方法
 * @param options Toast 配置选项
 * @returns 新创建的 Toastify 实例
 */
export default function StartToastifyInstance(options: ToastifyOptions): Toastify {
    return new Toastify(options);
}
