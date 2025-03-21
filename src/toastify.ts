
type Gravity = "top" | "bottom";
type Position = "left" | "center" | "right";
type AriaLive = "off" | "polite" | "assertive";
type CSSProperties = Partial<Record<keyof CSSStyleDeclaration, string>>;

/**
 * Toastify configuration options interface
 * @property {HTMLElement} [root] - Root element
 * @property {string} [text] - Text content to display
 * @property {Node} [node] - Custom DOM node as a text replacement
 * @property {number} [duration=3000] - Auto-close delay (milliseconds)
 * @property {boolean} [close] - Whether to show a close button
 * @property {Gravity} [gravity="top"] - Display position (top/bottom)
 * @property {Position} [position="left"] - Horizontal alignment
 * @property {AriaLive} [ariaLive="polite"] - Screen reader announcement mode
 * @property {string} [className] - Custom CSS class name
 * @property {boolean} [stopOnFocus=true] - Pause auto-close on hover
 * @property {() => void} [onClose] - Callback function after closing
 * @property {(e: MouseEvent) => void} [onClick] - Click event callback
 * @property {CSSProperties} [style] - Inline style configuration
 * @property {boolean} [oldestFirst=true] - Notification order for new messages
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
    static build(toast: Toastify) {
        this.applyBaseStyles(toast);
        this.addContent(toast);
        this.addInteractiveElements(toast);
    }

    private static applyBaseStyles(toast: Toastify) {
        toast.element.setAttribute('aria-live', toast.ariaLive);
        toast.element.classList.add(
            'toastify',
            `toastify-${toast.gravity}`,
            `toastify-${toast.position}`
        );
        if (toast.options.className) toast.element.classList.add(toast.options.className);
        if (toast.options.style) this.applyCustomStyles(toast.element, toast.options.style);
    }    
    private static applyCustomStyles(element: HTMLElement, styles: CSSProperties) {
        Object.entries(styles).forEach(([prop, value]) => {
            (element.style as any)[prop] = value;
        });
    }

    private static addContent(toast: Toastify) {
        if (toast.options.text) toast.element.textContent = toast.options.text;
        if (toast.options.node) toast.element.appendChild(toast.options.node);
    }

    private static addInteractiveElements(toast: Toastify) {
        if (toast.close) this.addCloseButton(toast);
        if (toast.onClick) toast.element.addEventListener("click", e => toast.onClick?.(e));
    }

    private static addCloseButton(toast: Toastify) {
        const closeBtn = document.createElement("span");
        closeBtn.ariaLabel = "Close";
        closeBtn.className = "toast-close";
        closeBtn.textContent = "x";
        closeBtn.addEventListener("click", e => toast.hideToast());
        toast.element.appendChild(closeBtn);
    }
}

/**
 * Toastify
 * @example
 * new Toastify({ text: "Hello World" }).showToast();
 */
class Toastify {
    private readonly defaults: ToastifyOptions = {
        duration: 3000,
        gravity: "top",
        position: 'left',
        ariaLive: "polite",
        close: false,
        stopOnFocus: true,
        oldestFirst: true,
    };
    
    public options: ToastifyOptions;

    public element: HTMLElement;
    public root: Element;
    public gravity: Gravity;
    public position: Position;
    public ariaLive: AriaLive;
    public close: boolean;
    public oldestFirst: boolean;
    public stopOnFocus: boolean;
    public onClick?: (e: Event) => void;
    public onClose?: () => void;

    /**
     * Create a Toastify instance
     * @param options User configuration options
     */
    constructor(options: ToastifyOptions) {
        this.options = { 
            ...this.defaults,
            ...options
        };
        this.element = document.createElement("div"); 
        this.gravity = this.options.gravity!;
        this.position = this.options.position!;
        this.root = this.options.root ?? ToastManager.getContainer(this.gravity, this.position);
        this.close = this.options.close!;
        this.oldestFirst = this.options.oldestFirst!;
        this.stopOnFocus = this.options.stopOnFocus!;
        this.ariaLive = this.options.ariaLive!;
        if (this.options.onClick) this.onClick = this.options.onClick;
        if (this.options.onClose) this.onClose = this.options.onClose;
        ToastBuilder.build(this);
    }
    
    /**
     * Display the Toast notification
     * @returns this Instance for method chaining
     */
    public showToast(): this {
        const elementToInsert = this.oldestFirst ? this.root.firstChild : this.root.lastChild;
        this.root.insertBefore(this.element!, elementToInsert);
        if (!this.element.classList.replace('hide','show')) {
            this.element.classList.add('show')
        }
        if (this.options.duration && this.options.duration > 0) {
            ToastManager.setAutoDismiss(this.element, this.options.duration!, () => this.hideToast());
        }
        return this;
    }
    /**
     * Immediately hide the current Toast
     * Triggers a CSS exit animation and removes the element after the animation completes
     */
    public hideToast(): void {
        if (!this.element) return;
        ToastManager.clearTimeout(this.element);
        const handleAnimationEnd = () => {
            this.element?.removeEventListener('animationend', handleAnimationEnd);
            this.element?.remove();
            this.onClose?.();
        };
        this.element.addEventListener('animationend', handleAnimationEnd);
        if (!this.element.classList.replace('show','hide')) {
            this.element.classList.add('hide')
        }
    }
}

export function Toast(options: ToastifyOptions):Toastify {
    return new Toastify(options)
}