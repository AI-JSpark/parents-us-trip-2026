const $ = (s) => document.querySelector(s);
const DB = "parent-trip-private";
const GUIDE_IDS = ["leonia", "nyc", "philly", "phoenix"];
let data;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("private");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function put(key, value) {
  const database = await openDb();
  return new Promise((resolve, reject) => {
    const tx = database.transaction("private", "readwrite");
    tx.objectStore("private").put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function get(key) {
  const database = await openDb();
  return new Promise((resolve, reject) => {
    const request = database.transaction("private").objectStore("private").get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
function show(id) {
  document.querySelectorAll(".screen").forEach((screen) =>
    screen.classList.toggle("active", screen.id === id));
  scrollTo(0, 0);
}
function render() {
  const card = (city) => '<button data-city="' + city.id + '">' +
    esc(city.name) + "<small>" + esc(city.subtitle) + "</small></button>";
  $("#cityCards").innerHTML = data.cities.map(card).join("");
  $("#guideList").innerHTML = data.cities.map(card).join("");
  document.querySelectorAll("[data-city]").forEach((button) =>
    button.onclick = () => showCity(button.dataset.city));
}
function showCity(id) {
  const city = data.cities.find((entry) => entry.id === id);
  const attractions = city.attractions.map((item) =>
    '<div class="attraction"><h3>' + esc(item.title) + "</h3><p>" +
    esc(item.description) + '</p><p class="tagline"><b>추천 방법</b> · ' +
    esc(item.plan) + "</p></div>").join("");
  const routes = (city.routes || []).map((item) =>
    '<div class="attraction"><h3>' + esc(item.title) + "</h3><p>" +
    esc(item.description) + "</p></div>").join("");
  const sources = city.source.map((item) =>
    '<a class="source-link" href="' + esc(item.url) +
    '" target="_blank" rel="noreferrer">' + esc(item.title) + " ↗</a>").join("<br>");
  $("#detailContent").innerHTML =
    '<p class="eyebrow">도시 가이드</p><h1>' + esc(city.name) +
    '</h1><img class="guide-hero" src="' + esc(city.image) +
    '" alt="' + esc(city.name) + ' 안내 그림"><p class="guide-intro">' +
    esc(city.intro) + '</p><article class="detail-section"><h2>추천 명소와 둘러보는 법</h2>' +
    attractions + '</article><article class="detail-section"><h2>추천 동선</h2>' +
    routes + '</article><article class="detail-section"><h2>현지 먹거리</h2><ul class="tips-list">' +
    city.food.map((text) => "<li>" + esc(text) + "</li>").join("") +
    '</ul></article><article class="detail-section"><h2>알아두면 편한 점</h2><ul class="tips-list">' +
    city.tips.map((text) => "<li>" + esc(text) + "</li>").join("") +
    '</ul></article><article class="detail-section"><h2>출발 전 확인</h2><ul class="tips-list">' +
    (city.checklist || []).map((text) => "<li>" + esc(text) + "</li>").join("") +
    '</ul></article><article class="detail-section"><h2>참고한 공식 안내</h2>' +
    sources + "</article>";
  show("detail");
}
function updateCountdown() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const today = Date.UTC(+dateParts.year, +dateParts.month - 1, +dateParts.day);
  const returnDate = Date.UTC(2026, 10, 27);
  const days = Math.round((returnDate - today) / 86400000);
  $("#count").textContent = days > 0 ? "D-" + days : days === 0 ? "D-Day" : "여행 종료";
}
function addExtra(title = "", value = "") {
  const row = document.createElement("div");
  row.className = "extra-row";
  const top = document.createElement("div");
  top.className = "extra-row-top";
  const name = document.createElement("input");
  name.placeholder = "항목 이름 (예: 약, 숙소 안내)";
  name.value = title;
  name.setAttribute("aria-label", "추가 정보 항목 이름");
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove-extra";
  remove.textContent = "×";
  remove.setAttribute("aria-label", "이 항목 제거");
  remove.onclick = () => row.remove();
  top.append(name, remove);
  const note = document.createElement("textarea");
  note.placeholder = "필요한 내용을 적어 두세요";
  note.value = value;
  note.setAttribute("aria-label", "추가 정보 내용");
  row.append(top, note);
  $("#extraFields").append(row);
}

document.querySelectorAll("[data-screen]").forEach((button) =>
  button.onclick = () => show(button.dataset.screen));
document.querySelectorAll(".back").forEach((button) =>
  button.onclick = () => show(button.classList.contains("guide-back") ? "guide" : "home"));
updateCountdown();
setInterval(updateCountdown, 60000);

Promise.all(GUIDE_IDS.map((id) =>
  fetch("./city-guides/" + id + ".json").then((response) => {
    if (!response.ok) throw new Error("guide unavailable");
    return response.json();
  })
)).then((cities) => {
  data = { cities };
  render();
}).catch(() => {
  $("#saveMessage").textContent = "가이드 자료를 불러오지 못했습니다. 오프라인 저장을 다시 확인해 주세요.";
});

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js");
$("#status").textContent = navigator.onLine ? "온라인" : "오프라인";
addEventListener("online", () => $("#status").textContent = "온라인");
addEventListener("offline", () => $("#status").textContent = "오프라인");
$("#addExtra").onclick = () => addExtra();

$("#personal").onsubmit = async (event) => {
  event.preventDefault();
  const profile = Object.fromEntries(new FormData(event.currentTarget));
  profile.extras = [...document.querySelectorAll(".extra-row")].map((row) => ({
    title: row.querySelector("input").value,
    value: row.querySelector("textarea").value
  })).filter((item) => item.title || item.value);
  await put("profile", profile);
  $("#personalMessage").textContent = "이 휴대폰에 저장했습니다.";
};
get("profile").then((profile) => {
  if (!profile) {
    addExtra();
    addExtra();
    return;
  }
  for (const [key, value] of Object.entries(profile)) {
    if (key === "extras") continue;
    const field = $("#personal").elements.namedItem(key);
    if (field) field.value = value;
  }
  if (profile.extras?.length) profile.extras.forEach((item) => addExtra(item.title, item.value));
  else {
    addExtra();
    addExtra();
  }
}).catch(() => {});

$("#saveOffline").onclick = async () => {
  const message = $("#saveMessage");
  message.textContent = "자료 저장 상태를 확인하고 있습니다…";
  try {
    await navigator.serviceWorker.ready;
    const cache = await caches.open("parents-trip-v3");
    const urls = [
      "./", "./index.html", "./styles.css", "./app.js", "./app-config.js",
      "./manifest.webmanifest", "./assets/leonia.svg", "./assets/nyc.svg",
      "./assets/philly.svg", "./assets/phoenix.svg",
      ...GUIDE_IDS.map((id) => "./city-guides/" + id + ".json")
    ];
    for (const url of urls) if (!await cache.match(url)) throw new Error("missing");
    const guides = await Promise.all(GUIDE_IDS.map(async (id) =>
      (await cache.match("./city-guides/" + id + ".json")).json()
    ));
    if (guides.length !== 4 || !guides.every((guide) =>
      guide.attractions?.length >= 4 && guide.routes?.length >= 2))
      throw new Error("guide incomplete");
    await put("ready", { version: 3, at: Date.now() });
    if (!(await get("ready"))?.version) throw new Error("not saved");
    message.textContent = "오프라인 사용 준비 완료! 네 도시 안내서와 여행 일정이 이 휴대폰에 저장됐습니다.";
  } catch {
    message.textContent = "저장을 확인하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 눌러 주세요.";
  }
};

