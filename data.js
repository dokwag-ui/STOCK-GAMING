(function () {
  const themes = ["Defense", "Semiconductor", "Automotive", "Shipbuilding", "Bio", "Entertainment", "AI/IT"];

  const steps = [];
  for (let year = 2012; year <= 2025; year += 1) {
    for (let quarter = 1; quarter <= 4; quarter += 1) {
      steps.push({ id: steps.length, year, quarter, label: `${year} Q${quarter}` });
    }
  }
  steps.push({ id: steps.length, year: 2026, quarter: "Current", label: "2026 Current" });

  const blueprints = [
    ["def-a", "Defense", "Defense-A", "Lockheed Martin", "USA", "항공우주와 방위 계약에 강한 대형 기업", 36000, 1.95, 0.07],
    ["def-b", "Defense", "Defense-B", "RTX", "USA", "엔진, 미사일, 방공 시스템을 함께 가진 기업", 29000, 1.55, 0.08],
    ["def-c", "Defense", "Defense-C", "Hanwha Aerospace", "Korea", "지상 무기와 항공우주 수출 모멘텀이 큰 기업", 18000, 4.6, 0.18],
    ["semi-a", "Semiconductor", "Semiconductor-A", "NVIDIA", "USA", "그래픽 반도체에서 AI 가속기로 확장한 기업", 12000, 20.0, 0.28],
    ["semi-b", "Semiconductor", "Semiconductor-B", "Samsung Electronics", "Korea", "메모리와 스마트 기기를 모두 가진 대형 제조사", 52000, 1.35, 0.08],
    ["semi-c", "Semiconductor", "Semiconductor-C", "TSMC", "Taiwan", "글로벌 파운드리 핵심 기업", 21000, 6.2, 0.17],
    ["auto-a", "Automotive", "Automotive-A", "Tesla", "USA", "전기차와 에너지 저장장치로 시장을 흔든 기업", 9000, 9.5, 0.25],
    ["auto-b", "Automotive", "Automotive-B", "Hyundai Motor", "Korea", "완성차, 전동화, 글로벌 생산망을 가진 기업", 180000, 1.65, 0.08],
    ["auto-c", "Automotive", "Automotive-C", "Toyota", "Japan", "하이브리드와 글로벌 판매 규모가 강한 기업", 76000, 1.9, 0.07],
    ["ship-a", "Shipbuilding", "Shipbuilding-A", "HD Korea Shipbuilding & Offshore Engineering", "Korea", "대형 선박과 해양 플랜트 수주에 민감한 기업", 115000, 1.8, 0.11],
    ["ship-b", "Shipbuilding", "Shipbuilding-B", "Samsung Heavy Industries", "Korea", "LNG선과 해양 설비 사이클에 민감한 기업", 32000, 0.45, 0.16],
    ["ship-c", "Shipbuilding", "Shipbuilding-C", "Huntington Ingalls Industries", "USA", "군함 건조와 장기 국방 발주에 연결된 기업", 26000, 2.4, 0.09],
    ["bio-a", "Bio", "Bio-A", "Pfizer", "USA", "대형 제약 포트폴리오와 백신 이벤트가 있는 기업", 24000, 1.15, 0.08],
    ["bio-b", "Bio", "Bio-B", "Gilead Sciences", "USA", "항바이러스와 치료제 파이프라인 중심 기업", 18000, 1.35, 0.1],
    ["bio-c", "Bio", "Bio-C", "Amgen", "USA", "바이오 의약품과 현금흐름이 안정적인 기업", 33000, 2.15, 0.07],
    ["ent-a", "Entertainment", "Entertainment-A", "Netflix", "USA", "스트리밍 전환을 대표하는 콘텐츠 플랫폼", 11000, 8.5, 0.22],
    ["ent-b", "Entertainment", "Entertainment-B", "Disney", "USA", "IP, 테마파크, 스트리밍을 함께 가진 기업", 32000, 1.25, 0.12],
    ["ent-c", "Entertainment", "Entertainment-C", "CJ ENM", "Korea", "콘텐츠 제작과 미디어 유통을 함께 가진 기업", 56000, 0.75, 0.14],
    ["aiit-a", "AI/IT", "AI/IT-A", "Microsoft", "USA", "클라우드와 생산성 소프트웨어 기반이 강한 기업", 26000, 7.6, 0.14],
    ["aiit-b", "AI/IT", "AI/IT-B", "Alphabet", "USA", "검색 광고와 AI 연구 기반이 큰 기업", 19000, 4.9, 0.15],
    ["aiit-c", "AI/IT", "AI/IT-C", "NAVER", "Korea", "검색, 커머스, 콘텐츠 플랫폼을 가진 기업", 130000, 1.55, 0.13]
  ];

  function priceSeries(start, growth, volatility, salt) {
    const result = [];
    const lastIndex = steps.length - 1;
    for (let i = 0; i <= lastIndex; i += 1) {
      const t = i / lastIndex;
      const cycle = Math.sin((i + salt) * 0.74) * volatility;
      const shock = Math.sin((i + salt) * 0.19) * volatility * 0.65;
      const covid = i >= 32 && i <= 34 ? -volatility * 1.2 : 0;
      const aiWave = i >= 44 && growth > 4 ? (i - 43) * 0.055 : 0;
      const value = start * Math.pow(growth, t) * (1 + cycle + shock + covid + aiWave);
      result.push(Math.max(800, Math.round(value / 100) * 100));
    }
    return result;
  }

  const companies = blueprints.map((item, index) => ({
    id: item[0],
    theme: item[1],
    alias: item[2],
    realName: item[3],
    market: item[4],
    descriptionHint: item[5],
    prices: priceSeries(item[6], item[7], item[8], index + 3),
    events: {
      0: "긴 레이스가 시작됩니다. 이름은 숨겨져 있지만 흐름은 단서를 남깁니다.",
      32: "2020년 충격으로 시장 변동성이 크게 확대됩니다.",
      44: "2023년 이후 AI, 공급망, 금리 변화가 테마별 차이를 키웁니다.",
      56: "마지막 현재 시점입니다. 숨겨진 기업명이 곧 공개됩니다."
    }
  }));

  window.STOCK_GAME_DATA = { initialCash: 100000000, themes, steps, companies };
})();
