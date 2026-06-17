import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

const DarkModeToggle = ({ className = "auth-theme-toggle" }: { className?: string }) => {
    const { isDark, toggle } = useTheme();

    return (
        <button
            className={className}
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
        >
            {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
        </button>
    );
};

export default DarkModeToggle;
