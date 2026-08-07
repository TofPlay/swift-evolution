// translate.js - Widget Google Translate (version propre)

(function () {
  "use strict";

  const container = document.getElementById("google_translate_element");
  if (!container) return;

  // Fonction d'initialisation du widget Google Translate
  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement(
      {
        pageLanguage: "fr",
        includedLanguages: "en,es,de,it,pt,ru,ja,ko,zh-CN",
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      },
      "google_translate_element"
    );
  };

  // Charger le script Google Translate
  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  document.head.appendChild(script);

  // Cacher les éléments indésirables de Google
  function hideGoogleBar() {
    // Cacher la barre bleue en haut
    const googleBar = document.querySelector(".goog-te-banner-frame");
    if (googleBar) {
      googleBar.style.display = "none";
    }
    // Cacher le bouton de fermeture
    const closeBtn = document.querySelector(".goog-close-btn");
    if (closeBtn) {
      closeBtn.style.display = "none";
    }
    // Cacher le logo Google
    const logoLink = document.querySelector(".goog-logo-link");
    if (logoLink) {
      logoLink.style.display = "none";
    }
    // Décaler le body si la barre est affichée
    if (document.body.style.marginTop !== "0px") {
      document.body.style.marginTop = "0";
    }
  }

  // Observer les changements dans le DOM pour cacher la barre
  const observer = new MutationObserver(hideGoogleBar);
  observer.observe(document.body, { childList: true, subtree: true });

  hideGoogleBar();
})();