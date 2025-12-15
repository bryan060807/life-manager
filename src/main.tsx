// ======================================================
//  src/main.tsx — Entry point  (OPTIMISED)
// ======================================================
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Lazy-load the whole app → splits bundle
const App = lazy(() => import("./App"));

// Lightweight error boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown, info: unknown) {
    console.error("Root Error:", err, info);
  }
  render() {
    if (this.state.hasError)
      return (
        <div
          style={{
            color: "white",
            fontFamily: "Rajdhani, sans-serif",
            textAlign: "center",
            paddingTop: "40vh",
          }}
        >
          <h2>Something went wrong – reload the page.</h2>
        </div>
      );
    return this.props.children;
  }
}

// Skeleton while JS chunks stream in
const Skeleton = () => (
  <div
    style={{
      color: "white",
      fontFamily: "Rajdhani, sans-serif",
      textAlign: "center",
      paddingTop: "40vh",
    }}
  >
    Loading AIBBRY’s Task Tracker…
  </div>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<Skeleton />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);