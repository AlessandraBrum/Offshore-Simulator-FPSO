/* ==========================================================================
   OFFSHORE SIMULATOR · js/devlog-feed.js
   Dev log posts come from the Blogger blog below. Write and publish a post on
   Blogger and it appears here by itself, in the site's style. Comments stay on
   Blogger: each post has a "Comment" button that opens its comment form.
   Blogger's JSON feed is read with a <script> tag (JSONP), so no server is needed.
   ========================================================================== */
(() => {
  'use strict';

  // START: SETTINGS
  const BLOG = 'https://fpso-offshore-simulator.blogspot.com';
  const MAX_POSTS = 20;
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
      const id = `post-${i + 1}`;
      const link = (entry.link || []).find(l => l.rel === 'alternate');
      const url = link ? link.href : BLOG;
      const count = entry.thr$total ? Number(entry.thr$total.$t) : 0;
      const date = niceDate(entry.published.$t);
      const article = document.createElement('article');
      article.className = 'oc-about__card oc-post';
      article.setAttribute('aria-labelledby', id);
      article.innerHTML =
        `<h2 class="oc-about__heading" id="${id}"></h2>` +
        `<p class="oc-post__date"><time datetime="${entry.published.$t.slice(0, 10)}">${date.text}<sup>${date.suffix}</sup>, ${date.year}</time></p>` +
        `<div class="oc-post__body">${clean(entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : ''))}</div>` +
        `<p class="oc-post__actions"><a class="oc-btn oc-btn--link" href="${url}#comments" target="_blank" rel="noopener">` +
        `Comment${count ? ` (${count})` : ''}<span class="oc-sr"> on this post (opens Blogger in a new tab)</span></a></p>`;
      article.querySelector('h2').textContent = entry.title.$t || 'Untitled post';
      list.append(article);
    });
  }

  // JSONP: Blogger calls window.ocDevlogFeed with the feed
  window.ocDevlogFeed = render;
  const script = document.createElement('script');
  script.src = `${BLOG}/feeds/posts/default?alt=json-in-script&max-results=${MAX_POSTS}&callback=ocDevlogFeed`;
  script.onerror = () => { status.textContent = 'The posts could not be loaded right now. You can read them on the blog.'; };
  document.body.append(script);
})();
