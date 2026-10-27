const languageButton = document.querySelector(".language-toggle");
const themeButton = document.querySelector(".theme-toggle");
const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

function setTheme(theme, persist = true) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = isDark ? "#0d1722" : "#f6f8fb";
  if (persist) localStorage.setItem("mostanad-academy-theme", isDark ? "dark" : "light");

  if (themeButton) {
    themeButton.setAttribute("aria-pressed", String(isDark));
    themeButton.setAttribute("aria-label", isDark
      ? (document.documentElement.lang === "en" ? "Switch to light mode" : "تفعيل الوضع النهاري")
      : (document.documentElement.lang === "en" ? "Switch to dark mode" : "تفعيل الوضع الليلي"));
    const toggleIcon = themeButton.querySelector("span");
    if (toggleIcon) toggleIcon.textContent = isDark ? "☀" : "☾";
  }
}

function setLanguage(language) {
  const isEnglish = language === "en";
  localStorage.setItem("mostanad-academy-language", language);
  document.documentElement.lang = language;
  document.documentElement.dir = isEnglish ? "ltr" : "rtl";
  document.body.lang = language;
  document.querySelectorAll("[data-ar][data-en]").forEach((element) => {
    element.innerHTML = element.dataset[language];
  });
  document.querySelectorAll("[data-label-ar][data-label-en]").forEach((element) => {
    element.setAttribute("aria-label", element.dataset[`label${isEnglish ? "En" : "Ar"}`]);
  });
  document.title = isEnglish ? "Mostanad Academy | Document Control Training" : "Mostanad Academy | مستند أكاديمي";
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.content = isEnglish
      ? "Professional training and consulting in document control and engineering project systems."
      : "Mostanad Academy — تدريب واستشارات احترافية في ضبط الوثائق وأنظمة المشاريع الهندسية.";
  }
  if (languageButton) {
    languageButton.textContent = isEnglish ? "عربي" : "EN";
    languageButton.setAttribute("aria-label", isEnglish ? "التبديل إلى العربية" : "Switch language");
  }
  if (menuButton) {
    menuButton.setAttribute("aria-label", isEnglish ? "Open navigation menu" : "فتح القائمة");
  }
  setTheme(document.documentElement.dataset.theme || "dark", false);
}

setTheme(localStorage.getItem("mostanad-academy-theme") === "light" ? "light" : "dark", false);
setLanguage(localStorage.getItem("mostanad-academy-language") === "en" ? "en" : "ar");

if (languageButton) {
  languageButton.addEventListener("click", () => {
    setLanguage(document.documentElement.lang === "ar" ? "en" : "ar");
  });
}

if (themeButton) {
  themeButton.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
}

window.addEventListener("storage", (event) => {
  if (event.key === "mostanad-academy-theme") setTheme(event.newValue === "light" ? "light" : "dark", false);
});

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    navLinks.classList.toggle("is-open", !isOpen);
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      menuButton.setAttribute("aria-expanded", "false");
      navLinks.classList.remove("is-open");
    }
  });
}
