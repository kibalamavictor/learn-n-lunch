const { escapeHtml, resolveAsset } = require("../utils");
const { renderPage } = require("../partials");

const TEAM_SECTION = {
  title: "THE PEOPLE BEHIND LEARN <br> N' LUNCH",
  bannerText: "DRIVEN BY PASSION · POWERED BY PURPOSE · LEARN N' LUNCH ·  ",
  description:
    "Learn And Lunch is powered by students and young leaders building ethical, evidence based systems to ensure hunger never limits learning. Through research, student leadership, advocacy, and practical solutions, we work to make campus hunger visible, understood, and addressed with dignity across Ugandan universities."
};

function renderTeamMember(depth, member, indexInRow) {
  const cardStyle = member.cardBackground ? ` style="background: ${member.cardBackground};"` : "";
  const memberClass = indexInRow === 1 ? "team-member member-2" : "team-member";
  const soloStyle = member.layout === "solo" ? ' style="margin: 0 auto;"' : "";

  return `
            <div class="${memberClass}"${soloStyle}>
              <div class="member-image">
                <img src="${resolveAsset(depth, member.photo)}" alt="${escapeHtml(member.photoAlt || member.name)}">
              </div>
              <div class="member-card ${member.cardVariant}"${cardStyle}>
                <div class="card-decoration"></div>
                <h3 class="member-name">${escapeHtml(member.name)}</h3>
                <p class="member-role">${escapeHtml(member.role)}</p>
                <p class="member-bio">${escapeHtml(member.bio)}</p>
              </div>
            </div>`;
}

function groupTeamMembers(members) {
  const groups = [];
  let index = 0;
  while (index < members.length) {
    const member = members[index];
    if (member.layout === "solo") {
      groups.push([member]);
      index += 1;
      continue;
    }
    if (index + 1 < members.length && members[index + 1].layout !== "solo") {
      groups.push([member, members[index + 1]]);
      index += 2;
      continue;
    }
    groups.push([member]);
    index += 1;
  }
  return groups;
}

function renderAbout({ site, page, team }) {
  const depth = 1;

  const valueBlocks = page.values
    .map((value) => {
      const highlightClass =
        value.highlightVariant === "highlight"
          ? "lnl-community-highlight"
          : `lnl-community-highlight-${value.highlightVariant.split("-")[1]}`;
      const description = value.description.includes("<br>")
        ? value.description
        : escapeHtml(value.description).replace(/\n/g, "<br>");

      return `
  <div class="lnl-community-section">
    <div class="lnl-community-title-wrapper">
      <h2 class="lnl-community-title">${escapeHtml(value.name)}</h2>
      <div class="${highlightClass}"></div>
    </div>
    
    <div class="lnl-community-text">
      <p>${description}</p>
    </div>
  </div>`;
    })
    .join("\n");

  const teamGroups = groupTeamMembers(team);
  const teamCards = teamGroups
    .map((group) => {
      const cards = group
        .map((member, index) => renderTeamMember(depth, member, index))
        .join("\n");
      return `
          <div class="team-cards">
            ${cards}
          </div>`;
    })
    .join("\n");

  const bannerRepeats = Array.from({ length: 8 })
    .map(() => `<span class="banner-text-2">${escapeHtml(TEAM_SECTION.bannerText)}</span>`)
    .join("\n            ");

  const body = `
    <div class="lnl-hero-container">
      <div class="lnl-hero-content">
        <h1>${escapeHtml(page.hero.heading)}</h1>
        <p>${escapeHtml(page.hero.body)}</p>
      </div>
      
      <div class="lnl-hero-image">
        <img src="${resolveAsset(depth, page.hero.image)}" alt="${escapeHtml(page.hero.imageAlt)}">
      </div>
    </div>

    <div class="our-story-section"><p style="font-family: Nunito, sans-serif;">${escapeHtml(page.standForHeading)}</p></div>

    <h2 class="bold-statement-2">
        ${escapeHtml(page.standForStatement)}
    </h2>

    <div class="our-story-section-2">
      <p style="font-family: Nunito, sans-serif;">${escapeHtml(page.standForStatement)}</p>
    </div>

    <hr style="margin: 0 auto; max-width: 1420px;">

    <section class="mission-vision-section">
      <div class="card mission-card">
        <h2>MISSION</h2>
        <p>${escapeHtml(page.missionVision.mission)}</p>
        <div class="card-accent-2"></div>
      </div>

      <div class="card vision-card">
        <h2>VISION</h2>
        <p>${escapeHtml(page.missionVision.vision)}</p>
        <div class="vision-accent-box"></div>
        <div class="card-accent"></div>
        <div class="vision-accent-bar"></div>
      </div>
    </section>

    <div class="our-values-container">
      <h2 class="our-values">OUR VALUES</h2>
    </div>

    ${valueBlocks}

    <section class="lnl-challenge-wrapper">
      <div class="lnl-challenge-container">
        <div class="lnl-challenge-grid">
          <h2 class="lnl-challenge-heading">${escapeHtml(page.challenge.heading)}</h2>
          <div class="lnl-challenge-text">
            <p class="lnl-challenge-description">
              ${escapeHtml(page.challenge.body)}
            </p>
          </div>
          <div class="lnl-challenge-visual">
            <div class="lnl-challenge-photo-frame">
              <img src="${resolveAsset(depth, page.challenge.image)}" alt="${escapeHtml(page.challenge.imageAlt)}" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="team-section">
      <div class="team-container">
        <h1 class="team-title">${TEAM_SECTION.title}</h1>

        <div class="team-banner-2">
            ${bannerRepeats}
        </div>

        <p class="team-description">
          ${escapeHtml(TEAM_SECTION.description)}
        </p>

        ${teamCards}
      </div>
    </section>`;

  return renderPage({
    site,
    depth,
    title: site.defaultSeoTitle,
    description: site.defaultSeoDescription,
    activePath: "/about-us",
    footerCta: {
      title: "BE PART OF THE MOVEMENT.",
      buttonLabel: "Donate Now",
      buttonUrl: resolveAsset(depth, "donate/"),
      backgroundImage: "/footer-image-h.png",
      backgroundImageAlt: "Volunteers packing food",
      qrImage: "/qr-code.png",
      qrImageAlt: "QR Code"
    },
    body
  });
}

module.exports = { renderAbout };
