export type Gravity = "top" | "bottom";
export type Position = "left" | "center" | "right";

export interface ToastOptions {
    root?: Element;
    text?: string;
    node?: Node;
    duration?: number;
    close?: boolean;
    gravity?: Gravity;
    position?: Position;
    className?: string | string[];
    stopOnFocus?: boolean;
    onClose?: () => void;
    onClick?: (e: Event) => void;
    style?: Partial<CSSStyleDeclaration>;
    oldestFirst?: boolean;
}

class ToastManager {
    private static timeoutMap = new Map<Toast, number>();
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
        container.classList.add('toast-container', id, `toast-${gravity}`, `toast-${position}`);
        container.setAttribute('role', 'region');
        document.body.appendChild(container);
        this.containers.set(id, container);
        return container;
    }

    static addTimeout(toast: Toast, duration: number, callback: () => void) {
        this.delTimeout(toast);
        const timeoutId = window.setTimeout(() => {
            callback();
            this.delTimeout(toast);
        }, duration);
        this.timeoutMap.set(toast, timeoutId);
    }

    static delTimeout(toast: Toast) {
        if (this.timeoutMap.has(toast)) {
            clearTimeout(this.timeoutMap.get(toast)!);
            this.timeoutMap.delete(toast);
        }
    }
}

/**
 * Toast
 * @example
 * new Toast({ text: "Hello World" }).show();
 */
export class Toast {
    private static readonly defaults: ToastOptions = {
        gravity: "top",
        position: 'right',
        stopOnFocus: true,
        oldestFirst: true,
    };

    public options: ToastOptions;

    public duration: number;
    public element: HTMLElement;
    public root: Element;
    public gravity: Gravity;
    public position: Position;
    public close: boolean;
    public oldestFirst: boolean;
    public stopOnFocus: boolean;
    public onClick?: (e: Event) => void;
    public onClose?: () => void;
    
    private contentElement?: HTMLDivElement;
    private closeButton?: HTMLSpanElement;
    private mouseOverHandler?: () => void;
    private mouseLeaveHandler?: () => void;
    private clickHandler?: (e: Event) => void;
    private closeButtonHandler?: () => void;
    private animationEndHandler?: (e: AnimationEvent) => void;

    /**
     * Create a Toastify instance
     * @param options User configuration options
     */
    constructor(options: ToastOptions) {
        this.options = {
            ...Toast.defaults,
            ...options
        };

        this.element = document.createElement("div");
        this.gravity = this.options.gravity!;
        this.position = this.options.position!;
        this.root = this.options.root ?? ToastManager.getContainer(this.gravity, this.position);
        this.oldestFirst = this.options.oldestFirst!;
        this.stopOnFocus = this.options.stopOnFocus!;
        this.duration = this.options.duration ?? -1;
        this.close = this.options.close ?? false;
        this.onClick = this.options.onClick;
        this.onClose = this.options.onClose;
        this.applyBaseStyles()
            .createContent()
            .addCloseButton()
            .measureDimensions()
            .ensureCloseMethod()
            .bindEvents();
    }

    private applyBaseStyles(): this {
        this.element.classList.add('toast', `toast-${this.gravity}`, `toast-${this.position}`);

        if (this.options.className) {
            const classes = Array.isArray(this.options.className)
                ? this.options.className
                : [this.options.className];
            classes.forEach(cls => this.element.classList.add(cls));
        }
        return this;
    }

    private createContent(): this {
        this.contentElement = document.createElement("div");
        this.contentElement.classList.add('toast-content');

        if (this.options.text) {
            this.contentElement.textContent = this.options.text;
        }
        if (this.options.node) {
            this.contentElement.appendChild(this.options.node);
        }
        if (this.options.style) {
            this.applyStyles(this.contentElement, this.options.style);
        }

        this.element.appendChild(this.contentElement);
        return this;
    }

    private addCloseButton(): this {
        if (!this.close) return this;

        this.closeButton = document.createElement("span");
        this.closeButton.ariaLabel = "Close";
        this.closeButton.className = "toast-close";
        this.closeButton.textContent = "🗙";
        this.closeButtonHandler = () => this.hide();
        this.closeButton.addEventListener("click", this.closeButtonHandler);

        this.element.appendChild(this.closeButton);
        return this;
    }

    private measureDimensions(): this {
        const originalStyles = {
            display: this.element.style.display,
            visibility: this.element.style.visibility,
            position: this.element.style.position
        };

        this.applyStyles(this.element, {
            display: 'block',
            visibility: 'hidden',
            position: 'absolute'
        });

        document.body.appendChild(this.element);
        const { height, width } = this.element.getBoundingClientRect();
        this.element.style.setProperty('--toast-height', `${height}px`);
        this.element.style.setProperty('--toast-width', `${width}px`);
        document.body.removeChild(this.element);

        this.applyStyles(this.element, originalStyles);
        return this;
    }

    private ensureCloseMethod(): this {
        if (this.duration <= 0 && !this.close && !this.onClick) {
            this.onClick = () => this.hide();
        }
        return this;
    }

    private bindEvents(): this {
        if (this.stopOnFocus && this.duration > 0) {
            this.mouseOverHandler = () => ToastManager.delTimeout(this);
            this.mouseLeaveHandler = () => ToastManager.addTimeout(this, this.duration, () => this.hide());
            this.element.addEventListener("mouseover", this.mouseOverHandler);
            this.element.addEventListener("mouseleave", this.mouseLeaveHandler);
        }
        
        if (this.onClick) {
            this.clickHandler = (e: Event) => {
                this.onClick?.call(this, e);
            };
            this.element.addEventListener("click", this.clickHandler);
        }
        return this;
    }

    private applyStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
        for (const key in styles) {
            if (styles[key] === undefined) continue;
            element.style[key] = styles[key];
        }
    }

    /**
     * Display the Toast notification
     * @returns this Instance for method chaining
     */
    public show(): this {
        const elementToInsert = this.oldestFirst ? this.root.firstChild : this.root.lastChild;
        this.root.insertBefore(this.element!, elementToInsert);
        if (!this.element.classList.replace('hide', 'show')) {
            this.element.classList.add('show')
        }
        if (this.duration && this.duration > 0) {
            ToastManager.addTimeout(this, this.duration!, () => this.hide());
        }
        return this;
    }

    /**
     * @deprecated This function is deprecated. Use the show() instead.
     */
    public showToast() {
        return this.show();
    }

    /**
     * Immediately hide the current Toast
     * Triggers a CSS exit animation and removes the element after the animation completes
     */
    public hide(): void {
        if (!this.element) return;
        ToastManager.delTimeout(this);
        
        // 移除所有事件监听器
        if (this.mouseOverHandler) {
            this.element.removeEventListener('mouseover', this.mouseOverHandler);
        }
        if (this.mouseLeaveHandler) {
            this.element.removeEventListener('mouseleave', this.mouseLeaveHandler);
        }
        if (this.clickHandler) {
            this.element.removeEventListener('click', this.clickHandler);
        }
        if (this.closeButton && this.closeButtonHandler) {
            this.closeButton.removeEventListener('click', this.closeButtonHandler);
        }

        this.animationEndHandler = (e: AnimationEvent) => {
            if (e.animationName.startsWith('toast-out')) {
                this.element?.removeEventListener('animationend', this.animationEndHandler!);
                this.element?.remove();
            }
        };

        this.element.addEventListener('animationend', this.animationEndHandler);
        if (!this.element.classList.replace('show', 'hide')) {
            this.element.classList.add('hide');
        }
        this.onClose?.();
    }

    /**
     * @deprecated This function is deprecated. Use the hide() instead.
     */
    public hideToast(): void {
        this.hide();
    }
}

export default function createToast(options: ToastOptions): Toast {
    return new Toast(options);
}

declare global {
    function Toast(options: ToastOptions): Toast;
    /**
     * @deprecated This function is deprecated. Use the Toast() instead.
     */
    function Toastify(options: ToastOptions): Toast;
}

globalThis.Toast = createToast;
globalThis.Toastify = createToast;
