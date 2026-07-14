const { escapeHtml, resolveAsset } = require("./utils");

function renderImpactMap(depth, mapData) {
  if (!mapData?.campuses?.length) return "";

  const header = mapData.header || {};
  const jsonPayload = JSON.stringify({
    campuses: mapData.campuses,
    cluster: mapData.cluster
  }).replace(/</g, "\\u003c");

  return `
  <section id="lnl-impact-map" class="lnl-impact-map" aria-label="Where Learn N' Lunch works across Uganda">
    <div class="lnl-map-head">
      <h2 class="lnl-map-title">${escapeHtml(header.title || `${header.titleBefore || "Where We're"} ${header.titleAccent || "Making Impact"}`.trim())}</h2>
      <p class="lnl-map-desc">${escapeHtml(header.description || "")}</p>
    </div>

    <div class="lnl-map-grid">
      <div class="lnl-map-stage">
        <div class="lnl-map-frame" id="lnlMapFrame">
          <div class="lnl-map-visual">
            <img
              class="lnl-map__img"
              id="lnlMapImg"
              src="${resolveAsset(depth, mapData.mapImage)}"
              alt="${escapeHtml(mapData.mapAlt || "Learn N' Lunch campus map")}"
            />
            <div class="lnl-map-marker-block">
              <p class="lnl-map-tagline">AND WE'RE JUST<br>GETTING STARTED</p>
              <svg class="lnl-marker-stroke" width="261" height="283" viewBox="0 0 261 283" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M152.687 8.15576L64.5643 89.5209L152.687 43.2093L68.1403 121.248L207.605 37.0685L7.09277 203.637L254.093 50.1177L64.5643 199.031L207.605 127.389L91.3844 226.921L199.175 165.257L129.699 276.814"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="lnl-legend">
          <span><i class="on"></i> Active campus</span>
          <span><i class="soon"></i> Expanding soon</span>
        </div>
      </div>
    </div>

    <script type="application/json" id="lnlImpactMapData">${jsonPayload}</script>
  </section>`;
}

module.exports = { renderImpactMap };
