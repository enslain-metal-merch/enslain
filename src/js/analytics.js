/* Enslain website analytics. Production-only; IDs intentionally blank until configured. */
(function () {
  "use strict";
  var ga4MeasurementId = "";
  var cloudflareWebAnalyticsToken = "";

  // Exclude Netlify deploy previews and other subdomains from production metrics.
  if (!/^(www\.)?enslain\.net$/i.test(window.location.hostname)) return;

  if (/^G-[A-Z0-9]+$/i.test(ga4MeasurementId)) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", ga4MeasurementId);
    var googleTag = document.createElement("script");
    googleTag.async = true;
    googleTag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ga4MeasurementId);
    document.head.appendChild(googleTag);

    // These clicks are interest signals, NOT confirmed inquiries or purchases.
    document.addEventListener("click", function (event) {
      var origin = event.target && event.target.nodeType === 1 ? event.target : event.target && event.target.parentElement;
      var link = origin && origin.closest && origin.closest("a[href]");
      if (!link) return;
      var href = link.getAttribute("href") || "";
      if (/^mailto:/i.test(href)) {
        window.gtag("event", "contact_click", { contact_method: "email" });
      } else if (/^https:\/\/shop\.enslain\.net(?:\/|$)/i.test(link.href)) {
        window.gtag("event", "webshop_click", { link_url: link.href });
      }
    });
  }

  if (/^[a-f0-9]{32}$/i.test(cloudflareWebAnalyticsToken)) {
    var cloudflareBeacon = document.createElement("script");
    cloudflareBeacon.defer = true;
    cloudflareBeacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
    cloudflareBeacon.setAttribute("data-cf-beacon", JSON.stringify({ token: cloudflareWebAnalyticsToken }));
    document.head.appendChild(cloudflareBeacon);
  }
})();
