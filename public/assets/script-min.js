/* Enslain website analytics. Production-only; add provider IDs as they become available. */
(function () {
  "use strict";
  var ga4MeasurementId = "G-MF9VNNQ7ZW";
  var cloudflareWebAnalyticsToken = "0df2800b2b92473499a18e2542797e66";

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

const headerElements={body:document.querySelector("body"),navToggleButton:document.querySelector(".js-nav-toggle-button"),toggleBars:document.querySelectorAll(".header__nav-toggle-bar"),siteNav:document.querySelector(".js-toggle-primary-nav")};function animateToggleBars(){headerElements.toggleBars.forEach((e=>{e.classList.toggle("animate")}))}function openNav(){headerElements.siteNav.classList.toggle("open"),headerElements.body.classList.toggle("nav-is-open"),setTimeout((()=>{headerElements.siteNav.classList.toggle("animate")}),1)}function ariaLabelToggle(){headerElements.siteNav.classList.contains("open")?headerElements.navToggleButton.setAttribute("aria-label","Close site navigation"):headerElements.navToggleButton.setAttribute("aria-label","Open site navigation")}headerElements.navToggleButton.addEventListener("click",(function(){animateToggleBars(),openNav(),ariaLabelToggle()}));const colorTheme={transitionValue:"var(--theme-change-transition)",elements:{themeOptionLight:document.getElementById("light-theme"),themeOptionDark:document.getElementById("dark-theme"),body:document.querySelector("body"),headerLogoImg:document.querySelector(".header__logo-img")},logoImages:{headerDark:"/assets/img/theme/header-logo-background--dark.jpg",headerLight:"/assets/img/theme/header-logo-background--light.jpg"}};!function(){const e=()=>{const e=localStorage.getItem("color-theme");"light"===e?(document.documentElement.setAttribute("data-color-theme",e),colorTheme.elements.headerLogoImg.src=colorTheme.logoImages.headerLight,colorTheme.elements.themeOptionLight.checked=!0):(document.documentElement.removeAttribute("data-color-theme"),colorTheme.elements.headerLogoImg.src=colorTheme.logoImages.headerDark,colorTheme.elements.themeOptionDark.checked=!0)};window.addEventListener("DOMContentLoaded",(()=>{e(),document.querySelectorAll("[data-color-theme-value]").forEach((t=>{t.addEventListener("click",(()=>{"light"===t.getAttribute("data-color-theme-value")?localStorage.setItem("color-theme","light"):localStorage.removeItem("color-theme"),e()}))})),e(),colorTheme.elements.body.style.transition=colorTheme.transitionValue}))}();const scrollToTopLink=document.querySelector(".button--scroll-to-top");function scrollFunction(){document.body.scrollTop>20||document.documentElement.scrollTop>20?scrollToTopLink.style.display="block":scrollToTopLink.style.display="none"}window.onscroll=function(){scrollFunction()},scrollToTopLink.addEventListener("click",(function(e){e.preventDefault(),document.querySelector(e.target.hash).scrollIntoView({behavior:"smooth"})}));const readerMode={storedReaderMode:localStorage.getItem("readerTheme"),body:document.querySelector("body"),chrissyModeOn:document.getElementById("chrissy-reader-on"),chrissyModeOff:document.getElementById("chrissy-reader-off")};function activateChrissyMode(){localStorage.setItem("readerTheme","chrissy"),document.documentElement.setAttribute("data-reader-mode","chrissy")}function deactivateChrissyMode(){localStorage.removeItem("readerTheme","chrissyMode"),document.documentElement.removeAttribute("data-reader-mode","chrissy")}"chrissy"===readerMode.storedReaderMode&&(document.documentElement.setAttribute("data-reader-mode","chrissy"),readerMode.chrissyModeOn.setAttribute("checked","true"),readerMode.chrissyModeOff.removeAttribute("checked")),readerMode.chrissyModeOn.addEventListener("click",(function(){activateChrissyMode()})),readerMode.chrissyModeOff.addEventListener("click",(function(){deactivateChrissyMode()}));