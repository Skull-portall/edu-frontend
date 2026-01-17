import React from 'react';

const Loader = () => {
    return (
        <div className="flex items-center justify-center min-h-[40vh] w-full">
            <div className="relative flex items-center justify-center">
                {/* Pulse Background */}
                <div className="absolute w-20 h-20 bg-red-100 rounded-full animate-ping opacity-75"></div>
                <div className="absolute w-16 h-16 bg-red-50 rounded-full animate-pulse"></div>

                {/* Logo with gentle bounce */}
                <img
                    src="/images/logo.svg"
                    alt="Loading..."
                    className="relative w-10 h-10 object-contain animate-bounce-gentle z-10"
                />
            </div>
        </div>
    );
};

export default Loader;
