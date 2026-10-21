import { ConfigProvider, theme } from "antd";
import { LazyMotion, MotionConfig } from "motion/react";
import OfflineBanner from "./components/ui/OfflineBanner";
import AppRoutes from "./routes/AppRoutes";
import { antdTheme } from "./theme/antdTheme";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
const features = () => import("./components/ui/motionFeatures").then(mod => mod.default);
function ThemedApp() {
 const { mode } = useTheme();
 return <ConfigProvider theme={{ ...antdTheme, algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm, token: { ...antdTheme.token, colorLink: mode === "dark" ? "#6ed9ca" : "#0e7c70", colorBgLayout: mode === "dark" ? "#0b1522" : "#f5f7fa", colorTextBase: mode === "dark" ? "#eaf2f5" : "#1d2939", colorBgContainer: mode === "dark" ? "#172744" : "#ffffff" } }}><LazyMotion features={features}><MotionConfig reducedMotion="user"><OfflineBanner/><AppRoutes/></MotionConfig></LazyMotion></ConfigProvider>;
}
export default function App() { return <ThemeProvider><ThemedApp/></ThemeProvider>; }
