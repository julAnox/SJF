type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
  duration?: number;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
}

const defaultOptions: ToastOptions = {
  duration: 3000,
  position: "top-right",
};

function ensureToastStyles() {
  const styleId = "toast-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
      }
      
      .toast-container {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
      }
      
      .toast {
        margin-bottom: 10px;
        pointer-events: auto;
        animation: fadeIn 0.3s ease forwards;
      }
      
      .toast.animate-fade-out {
        animation: fadeOut 0.3s ease forwards;
      }
    `;
    document.head.appendChild(style);
  }
}

function getToastContainer(position: string): HTMLElement {
  const containerId = `toast-container-${position}`;
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.className = "toast-container";

    const positionStyles = getPositionStyles(position);
    Object.assign(container.style, positionStyles);

    document.body.appendChild(container);
  }

  return container;
}

function createToast(
  message: string,
  type: ToastType,
  options: ToastOptions = {}
) {
  ensureToastStyles();

  const mergedOptions = { ...defaultOptions, ...options };
  const container = getToastContainer(mergedOptions.position || "top-right");

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  toast.innerHTML = `
    <div class="p-4 rounded-lg shadow-lg ${getBackgroundColor(
      type
    )} text-white max-w-xs">
      ${message}
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("animate-fade-out");
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }

      if (container.children.length === 0) {
        document.body.removeChild(container);
      }
    }, 300);
  }, mergedOptions.duration);
}

function getBackgroundColor(type: ToastType): string {
  switch (type) {
    case "success":
      return "bg-emerald-600";
    case "error":
      return "bg-red-600";
    case "warning":
      return "bg-amber-600";
    case "info":
      return "bg-blue-600";
    default:
      return "bg-gray-700";
  }
}

function getPositionStyles(position: string): Partial<CSSStyleDeclaration> {
  const styles: Partial<CSSStyleDeclaration> = {};

  switch (position) {
    case "top-right":
      styles.top = "1rem";
      styles.right = "1rem";
      break;
    case "top-left":
      styles.top = "1rem";
      styles.left = "1rem";
      break;
    case "bottom-right":
      styles.bottom = "1rem";
      styles.right = "1rem";
      break;
    case "bottom-left":
      styles.bottom = "1rem";
      styles.left = "1rem";
      break;
    case "top-center":
      styles.top = "1rem";
      styles.left = "50%";
      styles.transform = "translateX(-50%)";
      break;
    case "bottom-center":
      styles.bottom = "1rem";
      styles.left = "50%";
      styles.transform = "translateX(-50%)";
      break;
  }

  return styles;
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    createToast(message, "success", options),
  error: (message: string, options?: ToastOptions) =>
    createToast(message, "error", options),
  info: (message: string, options?: ToastOptions) =>
    createToast(message, "info", options),
  warning: (message: string, options?: ToastOptions) =>
    createToast(message, "warning", options),
};

export default toast;
