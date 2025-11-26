import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css"; // ✅ This is crucial for your background + styles

// Optional: global error boundary
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div
          style={{
            color: "white",
            fontFamily: "Rajdhani, sans-serif",
            textAlign: "center",
            paddingTop: "40vh",
          }}
        >
          <h2>Loading AIBBRY’s Task Tracker...</h2>
        </div>
      }
    >
      {children}
    </React.Suspense>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
