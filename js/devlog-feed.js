/* ==========================================================================
   OFFSHORE SIMULATOR · js/devlog-feed.js
   Dev log posts come from the Blogger blog below. Write and publish a post on
   Blogger and it appears here by itself, in the site's style.
   Blogger's JSON feed is read with a <script> tag (JSONP), so no server is needed.
   ========================================================================== */
(() => {
  'use strict';

  // START: SETTINGS
  const BLOG = 'https://fpso-offshore-simulator.blogspot.com';
  const PER_PAGE = 10;                       // posts per page; older ones on devlog.html?page=2, 3…
  // END: SETTINGS

  const list = document.getElementById('blog-posts');
  const status = document.getElementById('blog-status');
  if (!list) return;

  // "October 15th, 2026", like the entries written by hand
  function niceDate(iso) {
    // Uses the date as written by Blogger (the blog's time zone), not the reader's.
    const [y, m, dd] = iso.slice(0, 10).split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1, dd));
    const day = dd;
    const suffix = (day % 10 === 1 && day !== 11) ? 'st' : (day % 10 === 2 && day !== 12) ? 'nd' : (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
    const month = d.toLocaleDateString('en-US', {month: 'long', timeZone: 'UTC'});
    return {text: `${month} ${day}`, suffix, year: y};
  }

  // Keeps the post's own formatting (paragraphs, images, links) but removes
  // anything that could run code or break the page.
  function clean(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, iframe, object, embed, form, link, meta').forEach(n => n.remove());
    doc.querySelectorAll('*').forEach(el => {
      [...el.attributes].forEach(a => {
        if (/^on/i.test(a.name) || a.name === 'style' || /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name);
      });
      if (el.tagName === 'A') { el.setAttribute('rel', 'noopener'); el.setAttribute('target', '_blank'); }
      if (el.tagName === 'IMG') { el.setAttribute('loading', 'lazy'); if (!el.hasAttribute('alt')) el.setAttribute('alt', ''); }
    });
    // Headings inside a post sit below the post title (h2)
    doc.querySelectorAll('h1, h2').forEach(h => { const h3 = doc.createElement('h3'); h3.innerHTML = h.innerHTML; h.replaceWith(h3); });
    return doc.body.innerHTML;
  }

  function render(feed) {
    const entries = (feed.feed && feed.feed.entry) || [];
    list.textContent = '';
    if (!entries.length) { status.textContent = 'No posts yet.'; return; }
    status.textContent = '';
    entries.forEach((entry, i) => {
      const id = `post-${(page - 1) * PER_PAGE + i + 1}`;
      const date = niceDate(entry.published.$t);
      const author = entry.author && entry.author[0] && entry.author[0].name ? entry.author[0].name.$t : '';
      const article = document.createElement('article');
      article.className = 'oc-about__card oc-post';
      article.setAttribute('aria-labelledby', id);
      article.innerHTML =
        `<h2 class="oc-about__heading" id="${id}"></h2>` +
        `<p class="oc-post__date"><time datetime="${entry.published.$t.slice(0, 10)}">${date.text}<sup>${date.suffix}</sup>, ${date.year}</time><span class="oc-post__author"></span></p>` +
        `<div class="oc-post__body">${clean(entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : ''))}</div>`;
      article.querySelector('h2').textContent = entry.title.$t || 'Untitled post';
      if (author && author !== 'Unknown') article.querySelector('.oc-post__author').textContent = `By ${author}`;
      list.append(article);
    });
  }

  // START: PAGES (devlog.html = newest posts, devlog.html?page=2 = the next ones…)
  const page = Math.max(1, parseInt(new URLSearchParams(location.search).get('page'), 10) || 1);
  function pager(feed) {
    const nav = document.getElementById('blog-pages');
    if (!nav) return;
    const total = Number(feed.feed && feed.feed.openSearch$totalResults ? feed.feed.openSearch$totalResults.$t : 0);
    const links = [];
    if (page > 1) links.push(`<a class="oc-btn oc-btn--link" href="devlog.html${page > 2 ? `?page=${page - 1}` : ''}">← Newer posts</a>`);
    if (page * PER_PAGE < total) links.push(`<a class="oc-btn oc-btn--link" href="devlog.html?page=${page + 1}">Older posts →</a>`);
    nav.innerHTML = links.join('');
    nav.hidden = !links.length;
  }
  // END: PAGES

  // JSONP: Blogger calls window.ocDevlogFeed with the feed
  window.ocDevlogFeed = feed => { render(feed); pager(feed); };
  const script = document.createElement('script');
  script.src = `${BLOG}/feeds/posts/default?alt=json-in-script&start-index=${(page - 1) * PER_PAGE + 1}&max-results=${PER_PAGE}&callback=ocDevlogFeed`;
  script.onerror = () => { status.textContent = 'The posts could not be loaded right now. Please try again later.'; };
  document.body.append(script);
})();
