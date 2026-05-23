import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { CommunityProvider } from "./contexts/CommunityContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { LanguageProvider } from "./contexts/LanguageContext.jsx";
import { NotificationProvider } from "./contexts/NotificationContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <CommunityProvider>
                <App />
              </CommunityProvider>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
