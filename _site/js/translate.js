// translate.js - Widget Google Translate (drapeaux uniquement)

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
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      },
      "google_translate_element"
    );
  };

  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  document.head.appendChild(script);
})();