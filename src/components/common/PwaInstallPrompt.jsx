import React, { useState, useEffect } from "react";

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user already dismissed it recently
    const hasDismissed = localStorage.getItem("pwa_prompt_dismissed");
    if (hasDismissed) {
      const dismissDate = new Date(parseInt(hasDismissed));
      const now = new Date();
      // If dismissed less than 3 days ago, don't show
      if ((now - dismissDate) / (1000 * 60 * 60 * 24) < 3) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Hide the prompt
    setShowPrompt(false);

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  const handleLaterClick = () => {
    setShowPrompt(false);
    // Save dismissal time to local storage
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
  };

  // Only render if showPrompt is true
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 transform transition-all duration-500 animate-slide-up sm:bottom-6 sm:right-6">
      <div className="flex items-start gap-4">
        {/* Left Side: Logo */}
        <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-rose-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner border border-red-50 relative overflow-hidden">
          <img
            src="/images/logo.svg"
            alt="eDu Live Logo"
            className="w-10 h-10 object-contain z-10"
          />
          <div className="absolute inset-0 bg-red-200/20 rounded-xl"></div>
        </div>

        {/* Right Side: Description and Buttons */}
        <div className="flex-1">
          <h3 className="text-gray-900 font-bold text-base mb-1">
            Install eDu Live App
          </h3>
          <p className="text-gray-500 text-xs sm:text-sm mb-4 leading-relaxed">
            Get quicker access, offline support, and a better experience across
            your devices.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-colors shadow-lg shadow-red-500/20"
            >
              Install App
            </button>
            <button
              onClick={handleLaterClick}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl text-sm transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
