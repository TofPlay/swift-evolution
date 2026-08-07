// translate.js - Google Translate API pour site statique (traduction en place, sans barre)
// Sauvegarde la langue dans le localStorage pour qu'elle persiste sur toutes les pages.

(function () {
  "use strict";

  const STORAGE_KEY = "site_selected_language";
  const DEFAULT_LANGUAGE = "fr";

  const languageSelect = document.getElementById("language-select");
  if (!languageSelect) return;

  // URL de base du site
  const siteUrl = window.location.origin + (window.location.pathname === "/" ? "" : window.location.pathname);

  // Contenu original de la page (stocké au premier chargement)
  let originalContent = null;
  let isTranslating = false;
  let apiChecked = false;
  let apiAvailable = false;

  // --- Gestion du localStorage ---

  function saveLanguage(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn("Impossible de sauvegarder la langue:", e);
    }
  }

  function loadLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  // --- Cache Google Translate ---

  function hideGoogleBar() {
    const googleBar = document.querySelector(".goog-te-banner-frame");
    if (googleBar) {
      googleBar.style.display = "none";
    }
    if (document.body.style.marginTop !== "0px") {
      document.body.style.marginTop = "0";
    }
  }

  // --- Vérification de l'API (une seule fois) ---

  async function checkApiAvailability() {
    if (apiChecked) return apiAvailable;
    
    try {
      const response = await fetch(
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=test",
        { method: "GET", mode: "cors" }
      );
      apiAvailable = response.ok;
    } catch (error) {
      apiAvailable = false;
    }
    apiChecked = true;
    return apiAvailable;
  }

  // --- Traduction via l'API ---

  async function translatePageWithApi(targetLang) {
    // Stocker le contenu original au premier chargement
    if (!originalContent) {
      originalContent = document.body.innerHTML;
    }

    // Sélectionner les éléments à traduire
    const elementsToTranslate = document.body.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, span, div, a, li, td, th, label, button, small, strong, em, blockquote, cite, abbr, address, b, i, u, sub, sup"
    );

    const textNodes = [];
    elementsToTranslate.forEach((el) => {
      // Ignorer les scripts, styles et éléments déjà traduits
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.hasAttribute("data-translated")) {
        return;
      }
      const text = el.textContent.trim();
      if (text && text.length > 0) {
        textNodes.push({ element: el, text: text });
      }
    });

    if (textNodes.length === 0) return true;

    // Découper en lots de 50 textes
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < textNodes.length; i += batchSize) {
      batches.push(textNodes.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const texts = batch.map((item) => item.text);
      const query = encodeURIComponent(texts.join("\n"));
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${query}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      batch.forEach((item, index) => {
        const translatedText = data[0][index][0];
        if (translatedText) {
          item.element.textContent = translatedText;
          item.element.setAttribute("data-translated", "true");
        }
      });
    }

    return true;
  }

  // --- Fallback : URL Google Translate ---

  function translateWithFallback(targetLang) {
    const translateUrl = `https://translate.google.com/translate?sl=auto&tl=${targetLang}&u=${encodeURIComponent(siteUrl)}`;
    window.open(translateUrl, "_blank");
  }

  // --- Réinitialisation ---

  function resetPage() {
    if (originalContent) {
      document.body.innerHTML = originalContent;
      document.querySelectorAll("[data-translated]").forEach((el) => {
        el.removeAttribute("data-translated");
      });
    }
    isTranslating = false;
  }

  // --- Fonction principale de traduction (réutilisable) ---

  async function translatePage(targetLang) {
    if (isTranslating) return;
    isTranslating = true;

    resetPage();

    try {
      if (!apiChecked) {
        await checkApiAvailability();
      }

      if (apiAvailable) {
        await translatePageWithApi(targetLang);
        saveLanguage(targetLang);
      } else {
        translateWithFallback(targetLang);
      }
    } catch (error) {
      console.error("Erreur de traduction:", error);
      translateWithFallback(targetLang);
    }

    hideGoogleBar();
    isTranslating = false;
  }

  // --- Application de la langue sauvegardée ---

  function applySavedLanguage() {
    const savedLang = loadLanguage();
    if (savedLang && savedLang !== DEFAULT_LANGUAGE) {
      // Mettre à jour le select
      languageSelect.value = savedLang;
      // Traduire la page
      translatePage(savedLang);
    }
  }

  // --- Événement de changement de langue ---

  languageSelect.addEventListener("change", function () {
    const targetLang = this.value;
    if (!targetLang) return;

    translatePage(targetLang);
  });

  // --- Démarrage ---

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applySavedLanguage);
  } else {
    applySavedLanguage();
  }

  hideGoogleBar();

  const observer = new MutationObserver(hideGoogleBar);
  observer.observe(document.body, { childList: true, subtree: true });
})();