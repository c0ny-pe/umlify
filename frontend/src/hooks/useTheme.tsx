import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ThemeContextValue = {
    isDark: boolean;
    toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const prefersDark = window.localStorage.getItem("theme") === "dark";
        setIsDark(prefersDark);
        if (prefersDark) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
    }, []);

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.documentElement.classList.add("dark");
            window.localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            window.localStorage.setItem("theme", "light");
        }
    };

    return <ThemeContext.Provider value={{ isDark, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
