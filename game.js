(function () {
  const data = window.STOCK_GAME_DATA;
  const engine = window.StockGameEngine;
  const storageKey = "stock-game-dashboard-state-v1";

  const els = {
    currentStepLabel: document.querySelector("#currentStepLabel"),
    progressLabel: document.querySelector("#progressLabel"),
    cashLabel: document.querySelector("#cashLabel"),
    totalValueLabel: document.querySelector("#totalValueLabel"),
    returnRateLabel: document.querySelector("#returnRateLabel"),
    nextStepButton: document.querySelector("#nextStepButton"),
    resetGameButton: document.querySelector("#resetGameButton"),
    themeFilter: document.querySelector("#themeFilter"),
    companyTableBody: document.querySelector("#companyTableBody"),
    selectedCompanyTitle: document.querySelector("#selectedCompanyTitle"),
    selectedCompanyHint: document.querySelector("#selectedCompanyHint"),
    priceChart: document.querySelector("#priceChart"),
    eventFeed: document.querySelector("#eventFeed"),
    tradeSummary: document.querySelector("#tradeSummary"),
    tradeQuantity: document.querySelector("#tradeQuantity"),
    buyButton: document.querySelector("#buyButton"),
    sellButton: document.querySelector("#sellButton"),
    tradeMessage: document.querySelector("#tradeMessage"),
    portfolioList: document.querySelector("#portfolioList"),
    rankingList: document.querySelector("#rankingList"),
    endgameModal: document.querySelector("#endgameModal"),
    endgameContent: document.querySelector("#endgameContent"),
    closeEndgameButton: document.querySelector("#closeEndgameButton")
  };

  let state = loadState();
  if (!engine.isValidState(data, state)) {
    state = engine.createInitialState(data);
  }
  engine.saveSnapshot(data, state);

  function formatMoney(value) {
    return `₩${Math.round(value).toLocaleString("ko-KR")}`;
  }

  function formatRate(value) {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(storageKey);
      return null;
    }
  }

  function render() {
    const user = engine.getInvestor(state, "user");
    const step = data.steps[state.currentStep];
    const selected = engine.getCompany(data, state.selectedCompanyId);
    els.currentStepLabel.textContent = step.label;
    els.progressLabel.textContent = `${state.currentStep + 1} / ${data.steps.length}`;
    els.cashLabel.textContent = formatMoney(user.cash);
    els.totalValueLabel.textContent = formatMoney(engine.totalValue(data, state, user));
    els.returnRateLabel.textContent = formatRate(engine.returnRate(data, state, user));
    els.nextStepButton.disabled = state.ended;
    renderThemeFilter();
    renderCompanies();
    renderChart(selected);
    renderTradePanel(selected);
    renderPortfolio(user);
    renderRanking();
    renderEvents(selected);
    if (state.ended) renderEndgame();
  }

  function renderThemeFilter() {
    if (!els.themeFilter.children.length) {
      const options = ["All"].concat(data.themes);
      els.themeFilter.innerHTML = options.map((theme) => `<option value="${theme}">${theme}</option>`).join("");
    }
    els.themeFilter.value = state.themeFilter;
  }

  function renderCompanies() {
    const user = engine.getInvestor(state, "user");
    const companies = engine.getActiveCompanies(data, state).filter((company) => state.themeFilter === "All" || company.theme === state.themeFilter);
    els.companyTableBody.innerHTML = companies.map((company) => {
      const price = engine.getCurrentPrice(data, state, company.id);
      const previous = state.currentStep > 0 ? company.prices[state.currentStep - 1] : price;
      const change = ((price - previous) / previous) * 100;
      const selectedClass = company.id === state.selectedCompanyId ? "selected-row" : "";
      return `
        <tr class="${selectedClass}">
          <td><button class="link-button" type="button" data-company-id="${company.id}">${displayAlias(company)}</button></td>
          <td>${company.theme}</td>
          <td>${formatMoney(price)}</td>
          <td class="${change >= 0 ? "positive" : "negative"}">${formatRate(change)}</td>
          <td>${user.holdings[company.id] || 0}</td>
        </tr>
      `;
    }).join("");
  }

  function renderChart(company) {
    const values = company.prices.slice(0, state.currentStep + 1);
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const width = 640;
    const height = 220;
    const points = values.map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / Math.max(1, max - min)) * (height - 24) - 12;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

    els.selectedCompanyTitle.textContent = displayAlias(company);
    els.selectedCompanyHint.textContent = `${company.theme} · ${company.market}`;
    els.priceChart.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <polyline class="chart-line" points="${points}"></polyline>
        <text x="8" y="22">${formatMoney(values[values.length - 1])}</text>
        <text x="8" y="${height - 8}">${formatMoney(min)}</text>
      </svg>
    `;
  }

  function renderTradePanel(company) {
    const quantity = engine.getInvestor(state, "user").holdings[company.id] || 0;
    els.tradeSummary.innerHTML = `
      <strong>${displayAlias(company)}</strong>
      <span>${company.descriptionHint}</span>
      <span>현재가 ${formatMoney(engine.getCurrentPrice(data, state, company.id))} · 보유 ${quantity}주</span>
    `;
    els.tradeMessage.textContent = state.message;
  }

  function renderPortfolio(user) {
    const rows = Object.entries(user.holdings).filter((entry) => entry[1] > 0);
    if (!rows.length) {
      els.portfolioList.innerHTML = `<p class="empty-state">아직 보유 종목이 없습니다.</p>`;
      return;
    }
    els.portfolioList.innerHTML = rows.map((entry) => {
      const companyId = entry[0];
      const quantity = entry[1];
      const company = engine.getCompany(data, companyId);
      const value = quantity * engine.getCurrentPrice(data, state, companyId);
      return `<div class="holding-row"><span>${displayAlias(company)}</span><strong>${quantity}주</strong><em>${formatMoney(value)}</em></div>`;
    }).join("");
  }

  function renderRanking() {
    const ranked = engine.rankInvestors(data, state);
    els.rankingList.innerHTML = ranked.map((investor, index) => `
      <div class="rank-row ${investor.id === "user" ? "user-rank" : ""}">
        <span>${index + 1}</span>
        <strong>${investor.name}</strong>
        <em>${formatMoney(engine.totalValue(data, state, investor))}</em>
        <small>${formatRate(engine.returnRate(data, state, investor))}</small>
      </div>
    `).join("");
  }

  function renderEvents(company) {
    const event = company.events[state.currentStep] || "이번 분기는 가격 흐름과 테마 분위기를 보고 판단해야 합니다.";
    els.eventFeed.innerHTML = `<p>${event}</p>`;
  }

  function doTrade(type) {
    const quantity = Number.parseInt(els.tradeQuantity.value, 10);
    const result = engine.trade(data, state, type, state.selectedCompanyId, quantity);
    state.message = result.message;
    saveState();
    render();
  }

  function advanceStep() {
    const result = engine.advanceStep(data, state);
    state.message = result.message;
    saveState();
    render();
  }

  function renderEndgame() {
    const ranked = engine.rankInvestors(data, state);
    const revealRows = engine.getActiveCompanies(data, state).map((company) => `
      <tr><td>${displayAlias(company)}</td><td>${company.realName}</td><td>${company.symbol}</td><td>${company.market}</td></tr>
    `).join("");
    els.endgameContent.innerHTML = `
      <p class="winner">우승: <strong>${ranked[0].name}</strong> · ${formatMoney(engine.totalValue(data, state, ranked[0]))}</p>
      <div class="table-wrap">
        <table><thead><tr><th>익명명</th><th>실제 회사</th><th>티커</th><th>시장</th></tr></thead><tbody>${revealRows}</tbody></table>
      </div>
    `;
    els.endgameModal.classList.remove("hidden");
  }

  function displayAlias(company) {
    return company.activeAlias || company.alias;
  }

  function resetGame() {
    localStorage.removeItem(storageKey);
    state = engine.createInitialState(data);
    engine.saveSnapshot(data, state);
    saveState();
    els.endgameModal.classList.add("hidden");
    render();
  }

  els.companyTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-company-id]");
    if (!button) return;
    state.selectedCompanyId = button.dataset.companyId;
    state.message = "";
    saveState();
    render();
  });
  els.themeFilter.addEventListener("change", () => {
    state.themeFilter = els.themeFilter.value;
    saveState();
    render();
  });
  els.buyButton.addEventListener("click", () => doTrade("buy"));
  els.sellButton.addEventListener("click", () => doTrade("sell"));
  els.nextStepButton.addEventListener("click", advanceStep);
  els.resetGameButton.addEventListener("click", resetGame);
  els.closeEndgameButton.addEventListener("click", () => els.endgameModal.classList.add("hidden"));

  window.stockGameDebug = {
    get state() { return state; },
    setStep(step) {
      state.currentStep = step;
      state.ended = false;
      saveState();
      render();
    },
    endNow() {
      state.currentStep = data.steps.length - 1;
      state.ended = true;
      saveState();
      render();
    }
  };

  saveState();
  render();
})();
