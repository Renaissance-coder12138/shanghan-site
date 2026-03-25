let allData = [];
let filteredData = [];
let currentIndex = -1;

let selectedIds = new Set();
let playlist = [];
let currentPlaylistIndex = -1;

const itemList = document.getElementById("itemList");
const searchInput = document.getElementById("searchInput");
const summaryText = document.getElementById("summaryText");

const itemNo = document.getElementById("itemNo");
const itemChapter = document.getElementById("itemChapter");
const itemLevel = document.getElementById("itemLevel");
const itemText = document.getElementById("itemText");

const selectAllVisibleBtn = document.getElementById("selectAllVisibleBtn");
const clearVisibleSelectionBtn = document.getElementById("clearVisibleSelectionBtn");
const addToPlaylistBtn = document.getElementById("addToPlaylistBtn");

const playlistSummary = document.getElementById("playlistSummary");
const playlistItems = document.getElementById("playlistItems");
const clearPlaylistBtn = document.getElementById("clearPlaylistBtn");

const prevBtn = document.getElementById("prevBtn");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const nextBtn = document.getElementById("nextBtn");

const singleLoopToggle = document.getElementById("singleLoopToggle");
const playlistLoopToggle = document.getElementById("playlistLoopToggle");
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
    renderList();

    if (filteredData.length > 0) {
      selectItemByData(filteredData[0], false);
    }
  } catch (error) {
    console.error("加载数据失败：", error);
    itemList.innerHTML = `<div class="item-card">数据加载失败，请检查 data/shanghan.json 是否存在。</div>`;
  }
}

function renderList() {
  itemList.innerHTML = "";
  summaryText.textContent = `共 ${filteredData.length} 条`;

  if (filteredData.length === 0) {
    itemList.innerHTML = `<div class="item-card">没有搜索到符合条件的条文。</div>`;
    return;
  }

  filteredData.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";

    const activeItem =
      currentIndex !== -1 && allData[currentIndex] && allData[currentIndex].id === item.id;

    if (activeItem) {
      card.classList.add("active");
    }

    const previewText = item.text;
    const checked = selectedIds.has(item.id) ? "checked" : "";

    card.innerHTML = `
      <div class="item-header">
        <input class="item-checkbox" type="checkbox" data-id="${item.id}" ${checked} />
        <div class="item-main">
          <div class="top-line">
            <span>编号 ${item.id} ${item.origin_no || ""}</span>
            <span>${item.chapter || ""}</span>
          </div>
          <div class="preview">${item.level || ""} ${previewText}</div>
        </div>
      </div>
    `;

    const checkbox = card.querySelector(".item-checkbox");
    const main = card.querySelector(".item-main");

    checkbox.addEventListener("change", (e) => {
      const id = Number(e.target.dataset.id);
      if (e.target.checked) {
        selectedIds.add(id);
      } else {
        selectedIds.delete(id);
      }
    });

    main.addEventListener("click", () => {
      selectItemByData(item, false);
    });

    itemList.appendChild(card);
  });
}

function selectItemByData(item, resetPlayback = true) {
  const realIndex = allData.findIndex((x) => x.id === item.id);
  if (realIndex === -1) return;

  currentIndex = realIndex;

  itemNo.textContent = `编号：${item.id} ${item.origin_no || ""}`;
  itemChapter.textContent = `篇章：${item.chapter || "-"}`;
  itemLevel.textContent = `级别：${item.level || "-"}`;
  itemText.textContent = item.text || "";

  if (!audioPlayer.src.includes(item.audio)) {
    audioPlayer.src = item.audio || "";
  }

  audioPlayer.loop = singleLoopToggle.checked;
  timeText.textContent = "00:00 / 00:00";
  statusText.textContent = `状态：已切换到第 ${item.id} 条`;

  renderList();
  renderPlaylist();

  if (resetPlayback) {
    audioPlayer.currentTime = 0;
  }
}

function playCurrent() {
  if (currentIndex === -1 || !allData[currentIndex]) return;

  audioPlayer.play()
    .then(() => {
      statusText.textContent = `状态：正在播放第 ${allData[currentIndex].id} 条`;
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

function playFromPlaylist(index) {
  if (index < 0 || index >= playlist.length) return;
  currentPlaylistIndex = index;
  selectItemByData(playlist[index], true);
  playCurrent();
}

function prevItem() {
  if (playlist.length > 0) {
    if (currentPlaylistIndex > 0) {
      playFromPlaylist(currentPlaylistIndex - 1);
    } else if (playlistLoopToggle.checked && playlist.length > 1) {
      playFromPlaylist(playlist.length - 1);
    }
    return;
  }

  if (currentIndex <= 0) return;
  selectItemByData(allData[currentIndex - 1], true);
  playCurrent();
}

function nextItem() {
  if (playlist.length > 0) {
    if (currentPlaylistIndex < playlist.length - 1) {
      playFromPlaylist(currentPlaylistIndex + 1);
    } else if (playlistLoopToggle.checked && playlist.length > 0) {
      playFromPlaylist(0);
    }
    return;
  }

  if (currentIndex >= allData.length - 1) return;
  selectItemByData(allData[currentIndex + 1], true);
  playCurrent();
}

function renderPlaylist() {
  playlistSummary.textContent = `播放列表：${playlist.length} 条`;
  playlistItems.innerHTML = "";

  if (playlist.length === 0) {
    playlistItems.innerHTML = `<div class="empty-playlist">播放列表为空，请先从左侧勾选并加入。</div>`;
    return;
  }

  playlist.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "playlist-item";

    if (index === currentPlaylistIndex) {
      div.classList.add("active");
    }

    const previewText = item.text;

    div.innerHTML = `
      <div class="playlist-item-top">
        <span>第 ${index + 1} 条 · 原始编号 ${item.origin_no || ""}</span>
        <span>${item.chapter || ""}</span>
      </div>
      <div class="playlist-item-text">${item.level || ""} ${previewText}</div>
      <div class="playlist-item-actions">
        <button data-action="play">播放</button>
        <button data-action="remove">移除</button>
      </div>
    `;

    const [playButton, removeButton] = div.querySelectorAll("button");

    playButton.addEventListener("click", () => {
      playFromPlaylist(index);
    });

    removeButton.addEventListener("click", () => {
      const currentId = playlist[index].id;
      playlist.splice(index, 1);

      if (playlist.length === 0) {
        currentPlaylistIndex = -1;
      } else if (currentPlaylistIndex >= playlist.length) {
        currentPlaylistIndex = playlist.length - 1;
      } else if (playlist[currentPlaylistIndex] && playlist[currentPlaylistIndex].id === currentId) {
        currentPlaylistIndex = Math.min(index, playlist.length - 1);
      }

      renderPlaylist();
    });

    playlistItems.appendChild(div);
  });
}

function addSelectedToPlaylist() {
  const selectedItems = allData.filter(item => selectedIds.has(item.id));
  if (selectedItems.length === 0) {
    alert("请先勾选要加入播放列表的条文。");
    return;
  }

  selectedItems.forEach(item => {
    const exists = playlist.some(p => p.id === item.id);
    if (!exists) {
      playlist.push(item);
    }
  });

  if (currentPlaylistIndex === -1 && playlist.length > 0) {
    currentPlaylistIndex = 0;
  }

  renderPlaylist();
  alert(`已加入播放列表：${selectedItems.length} 条`);
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

  renderList();

  if (filteredData.length > 0) {
    selectItemByData(filteredData[0], false);
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

selectAllVisibleBtn.addEventListener("click", () => {
  filteredData.forEach(item => selectedIds.add(item.id));
  renderList();
});

clearVisibleSelectionBtn.addEventListener("click", () => {
  filteredData.forEach(item => selectedIds.delete(item.id));
  renderList();
});

addToPlaylistBtn.addEventListener("click", addSelectedToPlaylist);

clearPlaylistBtn.addEventListener("click", () => {
  playlist = [];
  currentPlaylistIndex = -1;
  renderPlaylist();
});

singleLoopToggle.addEventListener("change", () => {
  audioPlayer.loop = singleLoopToggle.checked;
  statusText.textContent = singleLoopToggle.checked ? "状态：单条循环已开启" : "状态：单条循环已关闭";
});

audioPlayer.addEventListener("loadedmetadata", () => {
  timeText.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
});

audioPlayer.addEventListener("timeupdate", () => {
  timeText.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
});

audioPlayer.addEventListener("play", () => {
  if (currentIndex !== -1 && allData[currentIndex]) {
    statusText.textContent = `状态：正在播放第 ${allData[currentIndex].id} 条`;
  }
});

audioPlayer.addEventListener("pause", () => {
  if (!audioPlayer.ended) {
    statusText.textContent = "状态：已暂停";
  }
});

audioPlayer.addEventListener("ended", () => {
  if (audioPlayer.loop) return;
  if (!autoNextToggle.checked) {
    statusText.textContent = "状态：播放结束";
    return;
  }

  if (playlist.length > 0) {
    if (currentPlaylistIndex < playlist.length - 1) {
      playFromPlaylist(currentPlaylistIndex + 1);
    } else if (playlistLoopToggle.checked) {
      playFromPlaylist(0);
    } else {
      statusText.textContent = "状态：播放列表已结束";
    }
    return;
  }

  if (currentIndex < allData.length - 1) {
    selectItemByData(allData[currentIndex + 1], true);
    playCurrent();
  } else {
    statusText.textContent = "状态：已播放到最后一条";
  }
});

prevBtn.addEventListener("click", prevItem);
playBtn.addEventListener("click", playCurrent);
pauseBtn.addEventListener("click", pauseCurrent);
nextBtn.addEventListener("click", nextItem);

loadData();