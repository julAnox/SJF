// Simple toast utility
// You can replace this with a more robust solution like react-toastify or react-hot-toast

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

function createToast(
  message: string,
  type: ToastType,
  options: ToastOptions = {}
) {
  const mergedOptions = { ...defaultOptions, ...options };

  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast toast-${type} ${mergedOptions.position}`;
  toast.innerHTML = `
    <div class="fixed z-50 p-4 rounded-lg shadow-lg ${getBackgroundColor(
      type
    )} text-white max-w-xs animate-fade-in">
      ${message}
    </div>
  `;

  // Add position styles
  const positionStyles = getPositionStyles(
    mergedOptions.position || "top-right"
  );
  Object.assign(toast.style, positionStyles);

  // Add to DOM
  document.body.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.classList.add("animate-fade-out");
    setTimeout(() => {
      document.body.removeChild(toast);
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
  const styles: Partial<CSSStyleDeclaration> = {
    position: "fixed",
    zIndex: "9999",
  };

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
