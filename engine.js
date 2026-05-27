(function () {
  const Engine = {};

  Engine.createInvestor = function createInvestor(id, name, profile, initialCash) {
    return { id, name, profile, cash: initialCash, holdings: {}, history: [] };
  };

  Engine.createInitialState = function createInitialState(data) {
    const investors = [
      Engine.createInvestor("user", "나", "user", data.initialCash),
      Engine.createInvestor("ai-balanced", "균형형 투자자", "balanced", data.initialCash),
      Engine.createInvestor("ai-momentum", "추세형 투자자", "momentum", data.initialCash),
      Engine.createInvestor("ai-contrarian", "역발상 투자자", "contrarian", data.initialCash),
      Engine.createInvestor("ai-random", "랜덤 투자자", "random", data.initialCash)
    ];

    return {
      currentStep: 0,
      selectedCompanyId: data.companies[0].id,
      themeFilter: "All",
      investors,
      tradeLog: [],
      ended: false,
      message: ""
    };
  };

  Engine.getCompany = function getCompany(data, companyId) {
    return data.companies.find((company) => company.id === companyId);
  };

  Engine.getInvestor = function getInvestor(state, investorId) {
    return state.investors.find((investor) => investor.id === investorId);
  };

  Engine.getCurrentPrice = function getCurrentPrice(data, state, companyId, step) {
    const targetStep = typeof step === "number" ? step : state.currentStep;
    return Engine.getCompany(data, companyId).prices[targetStep];
  };

  Engine.holdingsValue = function holdingsValue(data, state, investor, step) {
    const targetStep = typeof step === "number" ? step : state.currentStep;
    return Object.entries(investor.holdings).reduce((sum, entry) => {
      const companyId = entry[0];
      const quantity = entry[1];
      return sum + Engine.getCurrentPrice(data, state, companyId, targetStep) * quantity;
    }, 0);
  };

  Engine.totalValue = function totalValue(data, state, investor, step) {
    return investor.cash + Engine.holdingsValue(data, state, investor, step);
  };

  Engine.returnRate = function returnRate(data, state, investor, step) {
    return ((Engine.totalValue(data, state, investor, step) - data.initialCash) / data.initialCash) * 100;
  };

  Engine.saveSnapshot = function saveSnapshot(data, state) {
    state.investors.forEach((investor) => {
      investor.history[state.currentStep] = {
        step: state.currentStep,
        cash: investor.cash,
        holdingsValue: Engine.holdingsValue(data, state, investor),
        totalValue: Engine.totalValue(data, state, investor),
        returnRate: Engine.returnRate(data, state, investor)
      };
    });
  };

  Engine.trade = function trade(data, state, type, companyId, quantity) {
    if (state.ended) return { ok: false, message: "게임이 종료되었습니다." };
    const user = Engine.getInvestor(state, "user");
    const company = Engine.getCompany(data, companyId);
    const price = Engine.getCurrentPrice(data, state, company.id);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { ok: false, message: "수량은 1 이상의 정수여야 합니다." };
    }

    if (type === "buy") {
      const cost = price * quantity;
      if (cost > user.cash) {
        return { ok: false, message: `현금이 부족합니다. 최대 ${Math.floor(user.cash / price)}주까지 매수할 수 있습니다.` };
      }
      user.cash -= cost;
      user.holdings[company.id] = (user.holdings[company.id] || 0) + quantity;
      state.message = `${company.alias} ${quantity}주를 매수했습니다.`;
    } else {
      const owned = user.holdings[company.id] || 0;
      if (quantity > owned) {
        return { ok: false, message: `보유 수량이 부족합니다. 현재 ${owned}주 보유 중입니다.` };
      }
      user.cash += price * quantity;
      user.holdings[company.id] = owned - quantity;
      state.message = `${company.alias} ${quantity}주를 매도했습니다.`;
    }

    state.tradeLog.push({ step: state.currentStep, investorId: "user", companyId, type, quantity, price });
    Engine.saveSnapshot(data, state);
    return { ok: true, message: state.message };
  };

  Engine.scoreCompany = function scoreCompany(data, state, company, profile, aiIndex) {
    const now = Engine.getCurrentPrice(data, state, company.id);
    const pastIndex = Math.max(0, state.currentStep - 4);
    const past = company.prices[pastIndex];
    const momentum = (now - past) / past;
    const noise = Math.sin((state.currentStep + 1) * (aiIndex + 2) * (company.id.length + 3));

    if (profile === "momentum") return momentum + noise * 0.08;
    if (profile === "contrarian") return -momentum + noise * 0.08;
    if (profile === "balanced") return (company.theme.length % 5) * 0.03 + noise * 0.05;
    return noise;
  };

  Engine.runAiTrades = function runAiTrades(data, state) {
    state.investors.filter((investor) => investor.id !== "user").forEach((investor, aiIndex) => {
      const candidates = data.companies.slice().sort((a, b) => {
        return Engine.scoreCompany(data, state, b, investor.profile, aiIndex) - Engine.scoreCompany(data, state, a, investor.profile, aiIndex);
      });
      const buyTarget = candidates[0];
      const sellTarget = candidates[candidates.length - 1];
      const buyBudget = investor.cash * (0.08 + aiIndex * 0.025);
      const buyQty = Math.floor(buyBudget / Engine.getCurrentPrice(data, state, buyTarget.id));

      if (buyQty > 0) {
        const price = Engine.getCurrentPrice(data, state, buyTarget.id);
        investor.cash -= buyQty * price;
        investor.holdings[buyTarget.id] = (investor.holdings[buyTarget.id] || 0) + buyQty;
        state.tradeLog.push({ step: state.currentStep, investorId: investor.id, companyId: buyTarget.id, type: "buy", quantity: buyQty, price });
      }

      const owned = investor.holdings[sellTarget.id] || 0;
      const sellQty = Math.floor(owned * 0.25);
      if (sellQty > 0) {
        const price = Engine.getCurrentPrice(data, state, sellTarget.id);
        investor.cash += sellQty * price;
        investor.holdings[sellTarget.id] = owned - sellQty;
        state.tradeLog.push({ step: state.currentStep, investorId: investor.id, companyId: sellTarget.id, type: "sell", quantity: sellQty, price });
      }
    });
  };

  Engine.advanceStep = function advanceStep(data, state) {
    if (state.ended) return { ok: false, message: "게임이 종료되었습니다." };
    if (state.currentStep >= data.steps.length - 1) {
      state.ended = true;
      return { ok: true, message: "게임이 종료되었습니다." };
    }

    state.currentStep += 1;
    Engine.runAiTrades(data, state);
    Engine.saveSnapshot(data, state);

    if (state.currentStep === data.steps.length - 1) {
      state.ended = true;
      state.message = "최종 시점에 도착했습니다. 결과를 공개합니다.";
    } else {
      state.message = `${data.steps[state.currentStep].label}로 이동했습니다.`;
    }
    return { ok: true, message: state.message };
  };

  Engine.rankInvestors = function rankInvestors(data, state) {
    return state.investors.slice().sort((a, b) => Engine.totalValue(data, state, b) - Engine.totalValue(data, state, a));
  };

  window.StockGameEngine = Engine;
})();
