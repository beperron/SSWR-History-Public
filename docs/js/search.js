/* SSWR Conference History Database — Search Page */

(function () {
  'use strict';

  // ---- Configuration ----
  // TODO: Replace with your actual Edge Function URL after deployment
  var EDGE_FN_URL = 'https://jomsksqqcpkbuhwytovo.supabase.co/functions/v1/search';

  // ---- State ----
  var sessionToken = sessionStorage.getItem('sswr_session') || null;
  var currentMode = 'keyword';
  var isSearching = false;
  var pendingSearch = false;
  var autocompleteTimeout = null;

  // ---- Mode config ----
  var modeConfig = {
    keyword: {
      placeholder: 'e.g., trauma-informed care',
      help: 'Finds presentations containing your exact search terms in the title or abstract.',
      showFilters: true
    },
    semantic: {
      placeholder: 'e.g., how communities recover after natural disasters',
      help: 'Describe a research topic in your own words. Results are ranked by meaning, not exact word matches.',
      showFilters: true
    },
    hybrid: {
      placeholder: 'e.g., racial disparities in child welfare outcomes',
      help: 'Combines keyword precision with semantic understanding for the most comprehensive results.',
      showFilters: true
    },
    author: {
      placeholder: 'e.g., Sunshine Rote',
      help: 'Search by researcher name. Fuzzy matching handles partial names and spelling variations. Affiliations reflect what was reported at the time of each presentation, not current positions.',
      showFilters: false
    },
    institution: {
      placeholder: 'e.g., University of Michigan',
      help: 'Search by institution name. Suggestions appear as you type. Institutional affiliations reflect what was reported at the time of each presentation, not current positions.',
      showFilters: true
    }
  };

  // ---- DOM refs ----
  var queryInput = document.getElementById('search-query');
  var searchBtn = document.getElementById('search-btn');
  var resultsContainer = document.getElementById('results-container');
  var resultsStatus = document.getElementById('results-status');
  var captchaContainer = document.getElementById('captcha-container');
  var helpText = document.getElementById('search-help');
  var filtersRow = document.getElementById('search-filters');
  var autocompleteDropdown = document.getElementById('autocomplete-dropdown');
  var tabs = document.querySelectorAll('.search-tab');

  // ---- Tab switching ----
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentMode = tab.getAttribute('data-mode');

      var config = modeConfig[currentMode];
      queryInput.placeholder = config.placeholder;
      helpText.textContent = config.help;
      filtersRow.style.display = config.showFilters ? 'flex' : 'none';

      // Clear results and autocomplete
      resultsContainer.innerHTML = '';
      resultsStatus.innerHTML = '';
      autocompleteDropdown.style.display = 'none';
      queryInput.value = '';
      queryInput.focus();
    });
  });

  // ---- hCaptcha ----
  window.onCaptchaSuccess = function (token) {
    captchaContainer.style.display = 'none';
    resultsStatus.innerHTML = '<div class="search-loading">Verifying...</div>';

    fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'verify', captcha_token: token })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.session_token) {
          sessionToken = data.session_token;
          sessionStorage.setItem('sswr_session', sessionToken);
          resultsStatus.innerHTML = '';
          if (pendingSearch) {
            pendingSearch = false;
            executeSearch();
          }
        } else {
          resultsStatus.innerHTML = '<div class="search-error">Verification failed. Please try again.</div>';
          resetCaptcha();
        }
      })
      .catch(function () {
        resultsStatus.innerHTML = '<div class="search-error">Connection error. Please try again.</div>';
        resetCaptcha();
      });
  };

  window.onCaptchaError = function () {
    resultsStatus.innerHTML = '<div class="search-error">Captcha error. Please try again.</div>';
  };

  function resetCaptcha() {
    if (window.hcaptcha) {
      window.hcaptcha.reset();
    }
    captchaContainer.style.display = 'block';
  }

  // ---- Search execution ----
  function executeSearch() {
    var query = queryInput.value.trim();
    if (!query) {
      queryInput.focus();
      return;
    }

    if (!sessionToken) {
      pendingSearch = true;
      captchaContainer.style.display = 'block';
      return;
    }

    if (isSearching) return;
    isSearching = true;

    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    resultsContainer.innerHTML = '';
    resultsStatus.innerHTML = '<div class="search-loading">Searching ' +
      (currentMode === 'semantic' || currentMode === 'hybrid' ? '(computing similarity)' : '') +
      '...</div>';

    var minYear = parseInt(document.getElementById('filter-min-year').value, 10) || 2005;
    var maxYear = parseInt(document.getElementById('filter-max-year').value, 10) || 2026;
    var methodology = document.getElementById('filter-methodology').value || null;

    var payload = {
      type: currentMode,
      query: query,
      session_token: sessionToken,
      match_count: 50,
      filters: {
        min_year: minYear,
        max_year: maxYear,
        methodology: methodology
      }
    };

    fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (res.status === 401) {
          sessionToken = null;
          sessionStorage.removeItem('sswr_session');
          resultsStatus.innerHTML = '<div class="search-error">Session expired. Please verify again.</div>';
          resetCaptcha();
          throw new Error('session_expired');
        }
        if (res.status === 429) {
          resultsStatus.innerHTML = '<div class="search-error">Too many searches. Please wait a moment and try again.</div>';
          throw new Error('rate_limited');
        }
        if (res.status === 502) {
          resultsStatus.innerHTML = '<div class="search-error">Semantic search is temporarily unavailable. Try keyword or author search instead.</div>';
          throw new Error('service_unavailable');
        }
        if (!res.ok) {
          throw new Error('search_error');
        }
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        renderResults(data.results || [], query);
      })
      .catch(function (err) {
        if (['session_expired', 'rate_limited', 'service_unavailable'].indexOf(err.message) === -1) {
          resultsStatus.innerHTML = '<div class="search-error">Search encountered an error. Please try again.</div>';
        }
      })
      .finally(function () {
        isSearching = false;
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search';
      });
  }

  // ---- Render results ----
  function renderResults(results, query) {
    if (results.length === 0) {
      resultsStatus.innerHTML = '<div class="results-empty">No results found for &ldquo;' +
        escapeHtml(query) + '&rdquo;. Try broadening your search or adjusting filters.</div>';
      resultsContainer.innerHTML = '';
      return;
    }

    // Author search has a different format
    if (currentMode === 'author') {
      renderAuthorResults(results, query);
      return;
    }

    lastResults = results;
    lastQuery = query;

    var limitNote = results.length >= 50
      ? ' <span class="results-limit-note">(top 50) <button class="limit-info-btn" aria-label="Why 50 results?">?</button></span>' +
        '<div class="limit-info-box" id="limit-info-box" style="display:none;">' +
          '<strong>Why 50 results?</strong> Results are capped at 50 to maintain fast search performance across 23,793 presentations. ' +
          'To find more specific results, try narrowing your query, adjusting the year range, or filtering by methodology.' +
        '</div>'
      : '';

    resultsStatus.innerHTML = '<div class="results-toolbar">' +
      '<span class="results-count">Showing ' + results.length +
      ' result' + (results.length !== 1 ? 's' : '') + ' for &ldquo;' +
      escapeHtml(query) + '&rdquo;' + limitNote + '</span>' +
      '<button class="btn btn--outline btn--sm" id="download-csv-btn">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:3px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
        'Download CSV</button>' +
      '</div>';

    document.getElementById('download-csv-btn').addEventListener('click', downloadCsv);

    var limitBtn = document.querySelector('.limit-info-btn');
    if (limitBtn) {
      limitBtn.addEventListener('click', function () {
        var box = document.getElementById('limit-info-box');
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
      });
    }

    var html = '';
    results.forEach(function (r) {
      html += renderPaperCard(r);
    });
    resultsContainer.innerHTML = html;

    // Attach copy-citation handlers
    resultsContainer.querySelectorAll('.cite-copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var citation = btn.getAttribute('data-citation');
        navigator.clipboard.writeText(citation).then(function () {
          var orig = btn.textContent;
          btn.textContent = 'Copied';
          setTimeout(function () { btn.textContent = orig; }, 1500);
        });
      });
    });

    // Attach expand/collapse handlers
    resultsContainer.querySelectorAll('.abstract-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.result-card');
        var full = card.querySelector('.abstract-full');
        var trunc = card.querySelector('.abstract-truncated');
        if (full.style.display === 'none') {
          full.style.display = 'inline';
          trunc.style.display = 'none';
          btn.textContent = 'Show less';
        } else {
          full.style.display = 'none';
          trunc.style.display = 'inline';
          btn.textContent = 'Show more';
        }
      });
    });
  }

  function renderPaperCard(r) {
    var abstractHtml = '';
    var abstract = r.abstract || '';
    if (abstract.length > 280) {
      abstractHtml = '<span class="abstract-truncated">' + escapeHtml(abstract.slice(0, 280)) + '&hellip; </span>' +
        '<span class="abstract-full" style="display:none">' + escapeHtml(abstract) + ' </span>' +
        '<button class="abstract-toggle">Show more</button>';
    } else {
      abstractHtml = escapeHtml(abstract);
    }

    var similarity = '';
    if (r.similarity && (currentMode === 'semantic' || currentMode === 'hybrid')) {
      similarity = '<span class="result-similarity">' + Math.round(r.similarity * 100) + '% match</span>';
    }
    if (r.semantic_similarity && currentMode === 'hybrid') {
      similarity = '<span class="result-similarity">' + Math.round(r.semantic_similarity * 100) + '% semantic</span>';
    }

    var methodology = r.methodology || '';
    var methodologyClass = 'badge-meth badge-meth--' + methodology.replace('_', '-');

    var authors = '';
    if (r.authors && Array.isArray(r.authors)) {
      var authorParts = r.authors.map(function (a) {
        var inst = a.institution ? ' (' + a.institution + ')' : '';
        return escapeHtml(a.name + inst);
      });
      authors = authorParts.join(', ');
    }

    var apa = formatApa(r);
    var displayTitle = cleanTitle(r.title || '');
    var titleHtml = escapeHtml(displayTitle);
    if (r.confex_url) {
      titleHtml = '<a href="' + escapeAttr(r.confex_url) + '" target="_blank" rel="noopener">' + titleHtml + '</a>';
    }

    return '<div class="card result-card">' +
      '<div class="result-header">' +
        '<span class="result-year">' + (r.year || '') + '</span>' +
        (methodology ? '<span class="' + methodologyClass + '">' + escapeHtml(formatMethodology(methodology)) + '</span>' : '') +
        similarity +
      '</div>' +
      '<h3 class="result-title">' + titleHtml + '</h3>' +
      '<p class="result-abstract">' + abstractHtml + '</p>' +
      (authors ? '<div class="result-authors">' + authors + '</div>' : '') +
      '<div class="result-cite">'
 +
        '<button class="cite-copy-btn" data-citation="' + escapeAttr(apa) + '">Cite (APA)</button>' +
      '</div>' +
    '</div>';
  }

  function renderAuthorResults(results, query) {
    resultsStatus.innerHTML = '<span class="results-count">Found ' + results.length +
      ' researcher' + (results.length !== 1 ? 's' : '') + ' matching &ldquo;' +
      escapeHtml(query) + '&rdquo;</span>';

    var html = '';
    results.forEach(function (a, idx) {
      var institutions = '';
      if (a.institutions && Array.isArray(a.institutions)) {
        institutions = a.institutions.map(function (inst) {
          return escapeHtml(typeof inst === 'string' ? inst : inst.name || '');
        }).join(', ');
      }

      var years = '';
      if (a.years && Array.isArray(a.years)) {
        var sorted = a.years.slice().sort();
        if (sorted.length > 0) {
          years = sorted[0] + '&ndash;' + sorted[sorted.length - 1];
        }
      }

      var paperCount = a.total_papers || 0;
      html += '<div class="card result-card result-card--author" data-author-id="' + (a.author_id || '') + '" data-idx="' + idx + '">' +
        '<div class="result-header">' +
          '<span class="result-year">' + paperCount + ' presentation' + (paperCount !== 1 ? 's' : '') + '</span>' +
          (years ? '<span class="badge-meth">' + years + '</span>' : '') +
        '</div>' +
        '<h3 class="result-title">' + escapeHtml(a.author_name || '') + '</h3>' +
        (a.variants && Array.isArray(a.variants) && a.variants.length > 1
          ? '<div class="author-variants">Also listed as: ' + a.variants.filter(function (v) { return v !== a.author_name; }).map(escapeHtml).join(', ') + '</div>'
          : '') +
        (institutions ? '<div class="result-authors">' + institutions + '</div>' +
          '<div class="result-temporal-note">Affiliations as reported at time of presentation</div>' : '') +
        '<div class="author-expand-row">' +
          '<button class="btn btn--outline btn--sm author-expand-btn" data-idx="' + idx + '">' +
            '<span class="author-expand-label">View ' + paperCount + ' paper' + (paperCount !== 1 ? 's' : '') + '</span>' +
            ' <span class="author-expand-icon">&#9662;</span>' +
          '</button>' +
        '</div>' +
        '<div class="author-papers" id="author-papers-' + idx + '" style="display:none;"></div>' +
      '</div>';
    });
    resultsContainer.innerHTML = html;

    // Attach expand/collapse handlers
    resultsContainer.querySelectorAll('.author-expand-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.result-card--author');
        var authorId = card.getAttribute('data-author-id');
        var idx = card.getAttribute('data-idx');
        var papersDiv = document.getElementById('author-papers-' + idx);
        var icon = card.querySelector('.author-expand-icon');
        var label = card.querySelector('.author-expand-label');

        if (papersDiv.style.display !== 'none') {
          papersDiv.style.display = 'none';
          icon.innerHTML = '&#9662;';
          label.textContent = label.textContent.replace('Hide', 'View');
          return;
        }

        // If already loaded, just show
        if (papersDiv.getAttribute('data-loaded') === 'true') {
          papersDiv.style.display = 'block';
          icon.innerHTML = '&#9652;';
          label.textContent = label.textContent.replace('View', 'Hide');
          return;
        }

        // Fetch papers
        papersDiv.innerHTML = '<div class="search-loading">Loading papers...</div>';
        papersDiv.style.display = 'block';
        icon.innerHTML = '&#9652;';
        label.textContent = label.textContent.replace('View', 'Hide');

        fetch(EDGE_FN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'author_papers',
            author_id: parseInt(authorId, 10),
            session_token: sessionToken
          })
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            var papers = data.results || [];
            if (papers.length === 0) {
              papersDiv.innerHTML = '<p class="search-help">No papers found.</p>';
            } else {
              var innerHtml = '';
              papers.forEach(function (p) {
                innerHtml += renderPaperCard(p);
              });
              papersDiv.innerHTML = innerHtml;
              papersDiv.setAttribute('data-loaded', 'true');

              // Attach abstract toggles inside
              papersDiv.querySelectorAll('.abstract-toggle').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                  e.stopPropagation();
                  var innerCard = btn.closest('.result-card');
                  var full = innerCard.querySelector('.abstract-full');
                  var trunc = innerCard.querySelector('.abstract-truncated');
                  if (full.style.display === 'none') {
                    full.style.display = 'inline';
                    trunc.style.display = 'none';
                    btn.textContent = 'Show less';
                  } else {
                    full.style.display = 'none';
                    trunc.style.display = 'inline';
                    btn.textContent = 'Show more';
                  }
                });
              });

              // Attach cite buttons inside
              papersDiv.querySelectorAll('.cite-copy-btn').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                  e.stopPropagation();
                  var citation = btn.getAttribute('data-citation');
                  navigator.clipboard.writeText(citation).then(function () {
                    var orig = btn.textContent;
                    btn.textContent = 'Copied';
                    setTimeout(function () { btn.textContent = orig; }, 1500);
                  });
                });
              });
            }
          })
          .catch(function () {
            papersDiv.innerHTML = '<div class="search-error">Failed to load papers.</div>';
          });
      });
    });
  }

  // ---- Institution autocomplete ----
  function handleAutocomplete() {
    if (currentMode !== 'institution') return;
    var query = queryInput.value.trim();
    if (query.length < 2) {
      autocompleteDropdown.style.display = 'none';
      return;
    }
    if (!sessionToken) return;

    fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'autocomplete',
        query: query,
        session_token: sessionToken
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var items = data.results || [];
        if (items.length === 0) {
          autocompleteDropdown.style.display = 'none';
          return;
        }
        var html = '';
        items.forEach(function (item) {
          var name = item.name || item;
          html += '<div class="autocomplete-item">' + escapeHtml(name) + '</div>';
        });
        autocompleteDropdown.innerHTML = html;
        autocompleteDropdown.style.display = 'block';

        autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(function (el) {
          el.addEventListener('click', function () {
            queryInput.value = el.textContent;
            autocompleteDropdown.style.display = 'none';
            executeSearch();
          });
        });
      })
      .catch(function () {
        autocompleteDropdown.style.display = 'none';
      });
  }

  // ---- APA citation (7th ed., Section 10.5) ----
  // Format: Author, A. B., & Author, C. D. (Year). Title [Type]. Conference Name. URL

  var formatToBracket = {
    Oral: 'Paper presentation',
    Poster: 'Poster presentation',
    Flash: 'Paper presentation',
    Sig: 'Special interest group',
    Workshop: 'Workshop',
    Other: 'Conference presentation',
    Unknown: 'Conference presentation'
  };

  function ordinalSuffix(n) {
    var s = ['th', 'st', 'nd', 'rd'];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function formatApa(r) {
    var authorList = '';
    if (r.authors && Array.isArray(r.authors)) {
      var sorted = r.authors.slice().sort(function (a, b) {
        return (a.rank || a.order || a.author_order || 0) - (b.rank || b.order || b.author_order || 0);
      });
      var names = sorted.map(function (a) {
        var raw = (a.name || '').replace(/,?\s*(PhD|DSW|MSW|LCSW|LMSW|MPH|MA|MS|MD|EdD|JD|ABD|ACSW|LISW|BSW|MDiv|MPP|MPA|MSc|RN|LMFT|LPC)\.?/gi, '').trim();
        var parts = raw.split(/,\s*/);
        if (parts.length === 2) {
          var initials = parts[1].trim().split(/\s+/).map(function (n) { return n.charAt(0).toUpperCase() + '.'; }).join(' ');
          return parts[0].trim() + ', ' + initials;
        }
        var words = raw.trim().split(/\s+/);
        if (words.length === 1) return words[0];
        var last = words[words.length - 1];
        var firsts = words.slice(0, -1).map(function (n) { return n.charAt(0).toUpperCase() + '.'; }).join(' ');
        return last + ', ' + firsts;
      });
      if (names.length === 1) {
        authorList = names[0];
      } else if (names.length === 2) {
        authorList = names[0] + ', & ' + names[1];
      } else if (names.length <= 20) {
        authorList = names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1];
      } else {
        authorList = names.slice(0, 19).join(', ') + ', . . . ' + names[names.length - 1];
      }
    }

    var year = r.year || 'n.d.';
    var title = cleanTitle(r.title || '').replace(/\.$/, '');

    // Presentation type bracket
    var bracket = formatToBracket[r.format] || 'Conference presentation';

    // Conference ordinal: SSWR 1st Annual = 1997, so ordinal = year - 1996
    var confName = 'Society for Social Work and Research Annual Conference';
    if (r.year && r.year >= 2005) {
      var nth = ordinalSuffix(r.year - 1996);
      confName = 'Society for Social Work and Research ' + nth + ' Annual Conference';
    }

    var cite = authorList + ' (' + year + '). ' + title + ' [' + bracket + ']. ' + confName + '.';
    if (r.confex_url) {
      cite += ' ' + r.confex_url;
    }
    return cite;
  }

  // ---- CSV download ----
  var lastResults = [];
  var lastQuery = '';

  function downloadCsv() {
    if (lastResults.length === 0) return;
    var headers = ['year', 'title', 'authors', 'methodology', 'abstract', 'confex_url', 'apa_citation'];
    var rows = lastResults.map(function (r) {
      var authorStr = '';
      if (r.authors && Array.isArray(r.authors)) {
        authorStr = r.authors.map(function (a) { return a.name || ''; }).join('; ');
      }
      return [
        r.year || '',
        csvEscape(r.title || ''),
        csvEscape(authorStr),
        r.methodology || '',
        csvEscape(r.abstract || ''),
        csvEscape(r.confex_url || ''),
        csvEscape(formatApa(r))
      ].join(',');
    });
    var csv = headers.join(',') + '\n' + rows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'sswr_search_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function csvEscape(str) {
    if (!str) return '';
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // ---- Helpers ----
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function cleanTitle(str) {
    return str.replace(/^\(Converted as ePoster,?\s*See Poster Gallery\)\s*/i, '');
  }

  function formatMethodology(m) {
    var map = {
      quantitative: 'Quantitative',
      qualitative: 'Qualitative',
      mixed_methods: 'Mixed Methods',
      review: 'Review',
      other: 'Other'
    };
    return map[m] || m;
  }

  // ---- Event listeners ----
  searchBtn.addEventListener('click', executeSearch);

  queryInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      autocompleteDropdown.style.display = 'none';
      executeSearch();
    }
  });

  queryInput.addEventListener('input', function () {
    if (autocompleteTimeout) clearTimeout(autocompleteTimeout);
    autocompleteTimeout = setTimeout(handleAutocomplete, 300);
  });

  // Close autocomplete on outside click
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-input-wrap')) {
      autocompleteDropdown.style.display = 'none';
    }
  });

})();
