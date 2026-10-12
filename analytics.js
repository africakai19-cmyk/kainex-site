/* KAINEX marketing site - Google Analytics 4.
   One place for the measurement ID and the click events. */
(function () {
  var ID = 'G-SZP89PREYP';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  function send(name, params) {
    params = params || {};
    params.page_path = location.pathname;
    params.transport_type = 'beacon';
    gtag('event', name, params);
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var label = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (href.indexOf('wa.me/') !== -1) {
      send('generate_lead', { method: 'whatsapp', link_text: label });
    } else if (href.indexOf('mailto:') === 0) {
      send('generate_lead', { method: 'email', link_text: label });
    } else if (href.indexOf('app.kainex.co.za/register') !== -1) {
      send('register_click', { link_text: label });
    } else if (href.indexOf('app.kainex.co.za/login') !== -1) {
      send('login_click', { link_text: label });
    } else if (href === '/demo' || href.indexOf('/demo') === 0) {
      send('demo_click', { link_text: label });
    }
  }, false);
})();
