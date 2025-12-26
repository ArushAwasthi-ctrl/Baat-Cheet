import { createSlice } from "@reduxjs/toolkit";

// Get initial theme from localStorage or system preference
const getInitialTheme = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;

    // Check system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }
  return "light";
};

// Apply theme to document
const applyTheme = (theme) => {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }
};

const initialState = {
  theme: getInitialTheme(),
  sidebarOpen: true,
  mobileSidebarOpen: false,
  groupInfoOpen: false,
  activeModal: null,
  modalData: null,
  toasts: [],
  isLoading: false,
};

// Apply initial theme on load
if (typeof window !== "undefined") {
  applyTheme(initialState.theme);
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      applyTheme(action.payload);
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === "dark" ? "light" : "dark";
      state.theme = newTheme;
      applyTheme(newTheme);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setMobileSidebarOpen: (state, action) => {
      state.mobileSidebarOpen = action.payload;
    },
    toggleGroupInfo: (state) => {
      state.groupInfoOpen = !state.groupInfoOpen;
    },
    setGroupInfoOpen: (state, action) => {
      state.groupInfoOpen = action.payload;
    },
    openModal: (state, action) => {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    addToast: (state, action) => {
      const toast = {
        id: Date.now() + Math.random(),
        type: "default",
        duration: 5000,
        ...action.payload,
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  toggleGroupInfo,
  setGroupInfoOpen,
  openModal,
  closeModal,
  addToast,
  removeToast,
  clearAllToasts,
  setLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
