import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const DarkModeToggle = ({ className = '' }) => {
 const { theme, toggleTheme } = useTheme();
 const isDark = theme === 'dark';

 return (
 <button
 onClick={toggleTheme}
 className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
 isDark
 ? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700 focus:ring-yellow-500'
 : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 focus:ring-gray-400'
 } ${className}`}
 aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
 title={`Dark mode is ${isDark ? 'ON' : 'OFF'} — click to toggle`}
 >
 {/* Track + Knob toggle */}
 <div className={`relative w-8 h-4 rounded-full transition-colors duration-300 ${isDark ? 'bg-yellow-400' : 'bg-gray-300'}`}>
 <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${isDark ? 'left-4' : 'left-0.5'}`} />
 </div>

 {/* Icon */}
 {isDark ? (
 <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
 <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.592-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
 </svg>
 ) : (
 <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
 </svg>
 )}

 {/* ON / OFF label */}
 <span className={`text-xs font-bold tracking-widest uppercase transition-colors duration-300 ${isDark ? 'text-yellow-400' : 'text-gray-500'}`}>
 {isDark ? 'ON' : 'OFF'}
 </span>
 </button>
 );
};

export default DarkModeToggle;
