import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

// Dark mode has been removed — app is always light mode.
// ThemeProvider is kept for compatibility but does nothing.
export const ThemeProvider = ({ children }) => {
 // Always remove 'dark' class to ensure light mode
 if (typeof window !== 'undefined') {
 window.document.documentElement.classList.remove('dark');
 localStorage.removeItem('theme');
 }

 return (
 <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
 {children}
 </ThemeContext.Provider>
 );
};

export const useTheme = () => {
 const context = useContext(ThemeContext);
 if (context === undefined) {
 throw new Error('useTheme must be used within a ThemeProvider');
 }
 return context;
};
