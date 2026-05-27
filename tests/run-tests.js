async function runStockGameTests(loadText) {
  const dataCode = await loadText("../data.js");
  const engineCode = await loadText("../engine.js");
  const sandbox = { window: {}, console };
  Function("window", "console", `${dataCode}\n${engineCode}`)(sandbox.window, sandbox.console);

  const data = sandbox.window.STOCK_GAME_DATA;
  const engine = sandbox.window.StockGameEngine;
  const state = engine.createInitialState(data);

  const results = [];
  function test(name, fn) {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (error) {
      results.push({ name, ok: false, error: error.message });
    }
  }

  test("creates 57 playable steps", () => {
    if (data.steps.length !== 57) throw new Error(`expected 57 steps, got ${data.steps.length}`);
  });

  test("starts every investor with 100,000,000 cash", () => {
    if (state.investors.length !== 5) throw new Error("expected five investors");
    state.investors.forEach((investor) => {
      if (investor.cash !== 100000000) throw new Error(`${investor.name} has wrong cash`);
    });
  });

  test("selects three active companies per theme", () => {
    if (state.activeCompanyIds.length !== 21) throw new Error(`expected 21 active companies, got ${state.activeCompanyIds.length}`);
    data.themes.forEach((theme) => {
      const count = engine.getActiveCompanies(data, state).filter((company) => company.theme === theme).length;
      if (count !== 3) throw new Error(`${theme} has ${count} active companies`);
    });
  });

  test("buying one share reduces cash and adds holding", () => {
    const company = engine.getActiveCompanies(data, state)[0];
    const price = engine.getCurrentPrice(data, state, company.id);
    const result = engine.trade(data, state, "buy", company.id, 1);
    if (!result.ok) throw new Error(result.message);
    const user = engine.getInvestor(state, "user");
    if (user.cash !== 100000000 - price) throw new Error("cash did not decrease by price");
    if (user.holdings[company.id] !== 1) throw new Error("holding was not added");
  });

  test("cannot sell more shares than owned", () => {
    const company = engine.getActiveCompanies(data, state)[1];
    const result = engine.trade(data, state, "sell", company.id, 1);
    if (result.ok) throw new Error("oversell succeeded");
  });

  test("advancing a step moves time forward and runs AI investors", () => {
    const previous = state.currentStep;
    const before = engine.totalValue(data, state, engine.getInvestor(state, "ai-balanced"));
    const result = engine.advanceStep(data, state);
    const after = engine.totalValue(data, state, engine.getInvestor(state, "ai-balanced"));
    if (!result.ok) throw new Error(result.message);
    if (state.currentStep !== previous + 1) throw new Error("step did not advance");
    if (before === after) throw new Error("AI value did not change");
  });

  return results;
}

if (typeof window !== "undefined") {
  window.runStockGameTests = runStockGameTests;
}
