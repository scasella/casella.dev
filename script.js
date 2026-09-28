const filterButtons = document.querySelectorAll(".filter-pill");
const projectsGrid = document.querySelector(".projects-grid");
const projectCards = document.querySelectorAll(".project-card");
const siteFooter = document.querySelector(".site-footer");
let heightUpdateScheduled = false;

const getMinimumGridHeight = () => {
  const isCompact = window.matchMedia("(max-width: 680px)").matches;
  const ratio = isCompact ? 0.36 : 0.42;
  const floor = isCompact ? 220 : 260;
  const ceiling = isCompact ? 300 : 520;

  return Math.min(ceiling, Math.max(floor, Math.floor(window.innerHeight * ratio)));
};

const updateProjectsGridHeight = () => {
  if (!projectsGrid || !siteFooter) return;

  const gridTop = projectsGrid.getBoundingClientRect().top;
  const footerTop = siteFooter.getBoundingClientRect().top;
  const bottomGap = 16;
  const offscreenSeedHeight = Math.min(320, Math.max(180, Math.floor(window.innerHeight * 0.34)));
  const availableHeight = Math.floor(footerTop - gridTop - bottomGap);
  const minimumGridHeight = getMinimumGridHeight();
  const usableHeight = gridTop >= footerTop
    ? offscreenSeedHeight
    : Math.max(minimumGridHeight, availableHeight);

  document.documentElement.style.setProperty("--projects-grid-max-height", `${usableHeight}px`);
};

const scheduleProjectsGridHeight = () => {
  if (heightUpdateScheduled) return;

  heightUpdateScheduled = true;
  requestAnimationFrame(() => {
    heightUpdateScheduled = false;
    updateProjectsGridHeight();
  });
};

const applyFilter = (filter) => {
  projectCards.forEach((card) => {
    const categories = card.dataset.categories.split(" ");
    card.classList.toggle("is-hidden", filter !== "all" && !categories.includes(filter));
  });

  if (projectsGrid) {
    projectsGrid.scrollTop = 0;
  }

  scheduleProjectsGridHeight();
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-pressed", item === button ? "true" : "false");
    });

    applyFilter(filter);
  });
});

const activeFilter = document.querySelector(".filter-pill.is-active")?.dataset.filter;

if (activeFilter) {
  applyFilter(activeFilter);
}

window.addEventListener("resize", scheduleProjectsGridHeight);
window.addEventListener("scroll", scheduleProjectsGridHeight, { passive: true });
window.addEventListener("load", scheduleProjectsGridHeight);
scheduleProjectsGridHeight();
