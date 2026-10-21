import type { ThemeConfig } from "antd";

// Keeps every antd component (tables, modals, inputs...) on the same design tokens as the custom UI.
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: "#20B8A5",
    colorInfo: "#20B8A5",
    colorSuccess: "#16865B",
    colorWarning: "#E6A23C",
    colorError: "#D64545",
    colorLink: "#0E7C70",
    colorTextBase: "#1D2939",
    colorBorder: "#DCE2EA",
    colorBgLayout: "#F5F7FA",
    borderRadius: 14,
    fontFamily: "'Plus Jakarta Sans', Inter, 'Noto Sans Sinhala', 'Noto Sans Tamil', system-ui, sans-serif",
    fontSize: 15,
  },
  components: {
    Button: {
      // White text on the deeper blue primary action.
      primaryColor: "#101D35",
      fontWeight: 600,
      controlHeight: 42,
      controlHeightLG: 50,
    },
    Input: { controlHeight: 44 },
    Select: { controlHeight: 44 },
    Table: {  },
  },
};
