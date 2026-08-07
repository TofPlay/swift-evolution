// translate.js - Google Translate API pour site statique (traduction en place, sans barre)
// Fallback vers l'URL Google Translate si l'API échoue (ex: localhost)
// Copié dans le site via site.copy("translate.js", "js/translate.js") dans _config.ts

(function () {
  "use strict";

  const languageSelect = document.getElementById("language-select");
  if (!languageSelect) return;

  // URL de base du site (sans le trailing slash)
  const siteUrl = window.location.origin + (window.location.pathname === "/" ? "" : window.location.pathname);

  // Stocke le contenu original de la page
  let originalContent = null;
  let isTranslating = false;

  // Cache Google Translate (barre en haut)
  function hideGoogleBar() {
    const googleBar = document.querySelector(".goog-te-banner-frame");
    if (googleBar) {
      googleBar.style.display = "none";
    }
    if (document.body.style.marginTop !== "0px") {
      document.body.style.marginTop = "0";
    }
  }

  // Vérifie si l'API Google Translate est accessible
  async function isApiAvailable() {
    try {
      const response = await fetch(
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=test",
        { method: "GET", mode: "cors" }
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Traduit le contenu de la page avec l'API Google Translate
  async function translatePageWithApi(targetLang) {
    // Charger le contenu original si ce n'est pas déjà fait
    if (!originalContent) {
      originalContent = document.body.innerHTML;
    }

    // Récupérer tous les éléments textuels
    const elementsToTranslate = document.body.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, span, div, a, li, td, th, label, button, small, strong, em, blockquote, cite, abbr, address, b, i, u, sub, sup"
    );

    const textNodes = [];
    elementsToTranslate.forEach((el) => {
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

  // Fallback : utilise l'URL Google Translate (ouvre dans un nouvel onglet)
  function translateWithFallback(targetLang) {
    const translateUrl = `https://translate.google.com/translate?sl=auto&tl=${targetLang}&u=${encodeURIComponent(siteUrl)}`;
    window.open(translateUrl, "_blank");
  }

  // Réinitialiser la page au contenu original
  function resetPage() {
    if (originalContent) {
      document.body.innerHTML = originalContent;
      document.querySelectorAll("[data-translated]").forEach((el) => {
        el.removeAttribute("data-translated");
      });
    }
    isTranslating = false;
  }

  // Gestionnaire de changement de langue
  languageSelect.addEventListener("change", async function () {
    const targetLang = this.value;
    if (!targetLang) return;

    // Empêcher les requêtes multiples
    if (isTranslating) return;
    isTranslating = true;

    // Réinitialiser d'abord
    resetPage();

    try {
      // Vérifier si l'API est disponible
      const apiAvailable = await isApiAvailable();

      if (apiAvailable) {
        // Tenter la traduction via l'API
        await translatePageWithApi(targetLang);
      } else {
        // Fallback : ouvrir Google Translate dans un nouvel onglet
        translateWithFallback(targetLang);
      }
    } catch (error) {
      console.error("Erreur de traduction:", error);
      // Fallback en cas d'erreur
      translateWithFallback(targetLang);
    }

    // Cacher la barre Google Translate
    hideGoogleBar();

    isTranslating = false;
  });

  // Cacher la barre au chargement
  hideGoogleBar();

  // Observer les changements dans le DOM
  const observer = new MutationObserver(hideGoogleBar);
  observer.observe(document.body, { childList: true, subtree: true });
})();