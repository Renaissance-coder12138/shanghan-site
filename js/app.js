let allData = [];
let filteredData = [];
let currentIndex = -1;

const itemList = document.getElementById("itemList");
const searchInput = document.getElementById("searchInput");
const summaryText = document.getElementById("summaryText");

const itemNo = document.getElementById("itemNo");
const itemChapter = document.getElementById("itemChapter");
const itemLevel = document.getElementById("itemLevel");
const itemText = document.getElementById("itemText");

const prevBtn = document.getElementById("prevBtn");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const nextBtn = document.getElementById("nextBtn");

const loopToggle = document.getElementById("loopToggle");
const autoNextToggle = document.getElementById("autoNextToggle");
const statusText = document.getElementById("statusText");
const timeText = document.getElementById("timeText");

const audioPlayer = document.getElementById("audioPlayer");

function formatTime(seconds) {
  if (!isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

async function loadData() {
  try {
    const response = await fetch("data/shanghan.json");
    allData = await response.json();
    filteredData = [...allData];
    renderList(filteredData);

    summaryText.textContent = `共 ${filteredData.length} 条`;

    if (filteredData.length > 0) {
      selectItem(0, false);
    }
  } catch (error) {
    console.error("加载数据失败：", error);
    itemList.innerHTML = `<div class="item-card">数据加载失败，请检查 data/shanghan.json 是否存在。</div>`;
  }
}

function renderList(data) {
  itemList.innerHTML = "";

  if (data.length === 0) {
    itemList.innerHTML = `<div class="item-card">没有搜索到符合条件的条文。</div>`;
    summaryText.textContent = "共 0 条";
    return;
  }

  summaryText.textContent = `共 ${data.length} 条`;

  data.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "item-card";

    if (index === currentIndex) {
      card.classList.add("active");
    }

    const previewText =
      item.text.length > 42 ? item.text.slice(0, 42) + "..." : item.text;

    card.innerHTML = `
      <div class="top-line">
        <span>编号 ${item.id} ${item.origin_no || ""}</span>
        <span>${item.chapter || ""}</span>
      </div>
      <div class="preview">${item.level || ""} ${previewText}</div>
    `;

    card.addEventListener("click", () => {
      selectItem(index, true);
    });

    itemList.appendChild(card);
  });
}

function selectItem(index, resetPlayback = true) {
  if (index < 0 || index >= filteredData.length) return;

  currentIndex = index;
  const item = filteredData[index];

  itemNo.textContent = `编号：${item.id} ${item.origin_no || ""}`;
  itemChapter.textContent = `篇章：${item.chapter || "-"}`;
  itemLevel.textContent = `级别：${item.level || "-"}`;
  itemText.textContent = item.text || "";

  const oldSrc = audioPlayer.src;
  const newSrc = item.audio || "";

  if (!oldSrc.includes(newSrc)) {
    audioPlayer.src = newSrc;
  }

  audioPlayer.loop = loopToggle.checked;
  timeText.textContent = "00:00 / 00:00";
  statusText.textContent = `状态：已切换到第 ${item.id} 条`;

  renderList(filteredData);

  if (resetPlayback) {
    audioPlayer.currentTime = 0;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function playCurrent() {
  if (currentIndex === -1 || !filteredData[currentIndex]) return;

  audioPlayer.play()
    .then(() => {
      statusText.textContent = `状态：正在播放第 ${filteredData[currentIndex].id} 条`;
    })
    .catch((error) => {
      console.error("播放失败：", error);
      statusText.textContent = "状态：播放失败，请检查音频文件是否存在";
    });
}

function pauseCurrent() {
  audioPlayer.pause();
  statusText.textContent = "状态：已暂停";
}

function prevItem() {
  if (filteredData.length === 0) return;
  const newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
  selectItem(newIndex, true);
  playCurrent();
}

function nextItem() {
  if (filteredData.length === 0) return;
  const newIndex =
    currentIndex < filteredData.length - 1 ? currentIndex + 1 : filteredData.length - 1;
  selectItem(newIndex, true);
  playCurrent();
}

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.trim().toLowerCase();

  filteredData = allData.filter((item) => {
    return (
      (item.text && item.text.toLowerCase().includes(keyword)) ||
      (item.chapter && item.chapter.toLowerCase().includes(keyword)) ||
      (item.level && item.level.toLowerCase().includes(keyword)) ||
      String(item.id).includes(keyword) ||
      (item.origin_no && item.origin_no.includes(keyword))
    );
  });

  currentIndex = -1;
  renderList(filteredData);

  if (filteredData.length > 0) {
    selectItem(0, false);
  } else {
    itemNo.textContent = "编号：-";
    itemChapter.textContent = "篇章：-";
    itemLevel.textContent = "级别：-";
    itemText.textContent = "没有找到对应条文。";
    audioPlayer.removeAttribute("src");
    statusText.textContent = "状态：无结果";
    timeText.textContent = "00:00 / 00:00";
  }
});

loopToggle.addEventListener("change", () => {
  audioPlayer.loop = loopToggle.checked;
  statusText.textContent = loopToggle.checked ? "状态：单条循环已开启" : "状态：单条循环已关闭";
});

audioPlayer.addEventListener("loadedmetadata", () => {
  timeText.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
});

audioPlayer.addEventListener("timeupdate", () => {
  timeText.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
});

audioPlayer.addEventListener("play", () => {
  if (currentIndex !== -1 && filteredData[currentIndex]) {
    statusText.textContent = `状态：正在播放第 ${filteredData[currentIndex].id} 条`;
  }
});

audioPlayer.addEventListener("pause", () => {
  if (!audioPlayer.ended) {
    statusText.textContent = "状态：已暂停";
  }
});

audioPlayer.addEventListener("ended", () => {
  if (audioPlayer.loop) return;

  if (autoNextToggle.checked) {
    if (currentIndex < filteredData.length - 1) {
      selectItem(currentIndex + 1, true);
      playCurrent();
    } else {
      statusText.textContent = "状态：已播放到最后一条";
    }
  } else {
    statusText.textContent = "状态：播放结束";
  }
});

prevBtn.addEventListener("click", prevItem);
playBtn.addEventListener("click", playCurrent);
pauseBtn.addEventListener("click", pauseCurrent);
nextBtn.addEventListener("click", nextItem);

loadData();