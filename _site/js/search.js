function fullUrl(path) {
  const base = window.location.pathname;
  
  if (!path.startsWith(base)) {
    path = base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
  }
  
  return new URL(path, window.location.href).href;
}

/**
 * Extrait les métadonnées Pagefind d'une URL de page
 * @param {string} url - L'URL de la page (ex: /swift-5-5/)
 * @returns {Promise<{parent: string|null, parent_url: string|null}>}
 */
async function getPageMeta(url) {
  try {
    // 1. Construire l'URL complète (en supposant que url est relative)
    const pageUrl = fullUrl(url);
    
    // 2. Récupérer le HTML de la page
    const response = await fetch(pageUrl);
    if (!response.ok) return { parent: null, parent_url: null };
    
    const html = await response.text();
    
    // 3. Extraire les valeurs via Regex
    // Correspond à: data-pagefind-meta="parent:LA_VALEUR"
    const parentMatch = html.match(/data-pagefind-meta="parent:([^"]+)"/);
    const parentUrlMatch = html.match(/data-pagefind-meta="parent_url:([^"]+)"/);
    
    return {
      parent: parentMatch ? parentMatch[1] : null,
      parent_url: parentUrlMatch ? parentUrlMatch[1] : null
    };
  } catch (error) {
    console.error("Erreur lors de l'extraction des métadonnées:", error);
    return { parent: null, parent_url: null };
  }
}

/**
 * Génère le HTML pour un résultat de recherche
 * @param {Object} item
 * @returns {string}
 */
function buildResultHTML(item) {
  let ret = `<div class="pf-result">`;
  const parentUrl = fullUrl(item.parent_url);
  const pageUrl = fullUrl(item.url);

  if (item.parent) {
    ret += `<a class="pf-result-parent" href="${parentUrl}">${item.parent}</a><br>`;
  }

  ret += `<a class="pf-result-title" href="${pageUrl}">${item.title}</a>`;

  if (item.excerpt) {
    ret += `<div class="pf-result-excerpt">${item.excerpt}</div>`
  }

  ret += `</div>`;

  return ret;
}

// Initialisation de Pagefind
window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  const homeIntros = document.querySelectorAll('.home-intro');

  input.addEventListener('input', async (e) => {
    const query = e.target.value;
    
    // Filtrer (titre différent du parent) puis trier alphabétiquement par titre
    let sortedResults = [];

    if (query.length >= 2) {
      // Appel à l'API Pagefind
      const pagefindOptions = {meta: ["parent", "parent_url"]};

      const pageFindUrl = fullUrl('pagefind/pagefind.js');
      const pagefind = await import(pageFindUrl);
      const search = await pagefind.search(query, pagefindOptions);
      
      const results = await Promise.all(
        search.results.map(async (result) => {
          const data = await result.data();

          const meta = await getPageMeta(data.url);

          const ret = {
            url: data.url,
            title: data.meta.title,
            parent: meta.parent,
            parent_url: meta.parent_url,
            excerpt: data.excerpt
          };
          return ret;
        })
      );

      sortedResults = results
        .filter(item => {
          if (!item.parent) return true;
          const titleNormalized = (item.title || '').toLowerCase().trim();
          const parentNormalized = (item.parent || '').toLowerCase().trim();
          return titleNormalized !== parentNormalized;
        })
        .sort((a, b) => {
          const titleA = (a.title || '').toLowerCase();
          const titleB = (b.title || '').toLowerCase();
          return titleA.localeCompare(titleB, 'fr');
        });

      // Rendu des résultats avec du JavaScript (inévitable pour la recherche dynamique)
      resultsContainer.innerHTML = sortedResults
        .map((item) => buildResultHTML(item))
        .join('');
    } else {
      resultsContainer.innerHTML = '';
    }

    // Masquer les home-intro lorsque des résultats sont affichés
    const lenghtResult = sortedResults.length;
    
    homeIntros.forEach(el => {
      el.style.display = lenghtResult > 0 ? 'none' : 'block';
    });
  });
});