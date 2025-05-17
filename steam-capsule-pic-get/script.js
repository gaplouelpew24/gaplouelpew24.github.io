async function fetchCapsules() {
  const raw = document.getElementById("appidInput").value.trim();
  const capsuleDiv = document.getElementById("capsule");
  const fetchButton = document.getElementById("fetchButton");
  const statusText = document.getElementById("statusText");

  capsuleDiv.innerHTML = "";
  statusText.textContent = "";

  if (!raw) {
    statusText.innerText = "请输入至少一个 App ID";
    return;
  }

  const validPattern = /^[0-9,\s\n]+$/;
  if (!validPattern.test(raw)) {
    statusText.innerText = "仅支持输入数字、逗号或换行";
    return;
  }

  const ids = Array.from(
    new Set(
      raw
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter((s) => s !== "")
    )
  );

  if (ids.length === 0) {
    statusText.innerText = "App ID 格式有误";
    return;
  }

  fetchButton.disabled = true;
  fetchButton.querySelector("span").textContent = "查询中...";

  const batchSize = 20;
  let completed = 0;
  const total = ids.length;

  statusText.textContent = `准备加载 ${total} 张 Capsule 图...`;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);

    await Promise.all(
      batch.map((appid) =>
        fetchSingleCapsule(appid, capsuleDiv, () => {
          completed++;
          statusText.textContent = `已加载 ${completed}/${total} 张 Capsule 图`;
        })
      )
    );
  }

  fetchButton.disabled = false;
  fetchButton.querySelector("span").textContent = "获取 Capsule 图";
  statusText.textContent = `完成：${completed}/${total} 张 Capsule 图已加载`;
}

async function fetchSingleCapsule(appid, container, onFinish) {
  const item = document.createElement("div");
  item.className = "item";
  item.id = `item-${appid}`;
  item.innerHTML = `<p><strong>${appid}</strong><br>加载中...</p>`;
  container.appendChild(item);

  try {
    const res = await fetch(`http://101.42.15.243:3000/api/capsule?appid=${appid}`);
    const data = await res.json();

    if (data[appid] && data[appid].success) {
      const name = data[appid].data.name || "";
      const url = data[appid].data.capsule_imagev5 || data[appid].data.header_image || null;

      if (url) {
        item.innerHTML = `
          <a href="${url}" target="_blank" rel="noopener noreferrer">
            <img src="${url}" alt="capsule_184x69">
          </a>
          <p><strong>${appid}</strong><br>${name}</p>
        `;
      } else {
        throw new Error("无图片 URL");
      }
    } else {
      throw new Error("接口无成功返回");
    }
  } catch (e) {
    console.warn(`AppID ${appid} 加载失败：`, e);
    item.innerHTML = `
      <p><strong>${appid}</strong><br>Capsule 图获取失败</p>
      <button onclick="retryCapsule('${appid}')"><span>重试</span></button>
    `;
  } finally {
    onFinish();
  }
}

async function retryCapsule(appid) {
  const item = document.getElementById(`item-${appid}`);
  if (!item) return;

  item.innerHTML = `<p><strong>${appid}</strong><br>重试中...</p>`;

  await fetchSingleCapsule(appid, item.parentNode, () => {});
}

document.getElementById("getGames").onclick = async () => {
  const steamid = document.getElementById("steamid").value.trim();
  const button = document.getElementById("getGames");
  const outputEl = document.getElementById("output");
  outputEl.textContent = "";

  if (!steamid) {
    outputEl.textContent = "请输入 SteamID 64";
    return;
  }

  button.querySelector("span").textContent = "查询中...";
  button.disabled = true;

  try {
    const res = await fetch("http://101.42.15.243:3000/get_owned_games", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ steamid }),
    });

    if (!res.ok) {
      const err = await res.json();
      outputEl.textContent = "错误：" + (err.error || "未知错误");
      return;
    }

    const data = await res.json();

    if (!data.response || !data.response.games) {
      outputEl.textContent = "该用户游戏列表为空或设置为私有";
      return;
    }

    const appids = data.response.games.map((game) => game.appid);
    outputEl.textContent = appids.join(",");
  } catch (error) {
    outputEl.textContent = "请求失败: " + error.message;
  } finally {
    button.querySelector("span").textContent = "获取游戏 AppIDs";
    button.disabled = false;
  }
};

document.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
    const activeElement = document.activeElement;

    if (activeElement && activeElement.classList.contains("selectable")) {
      e.preventDefault();

      const range = document.createRange();
      range.selectNodeContents(activeElement);

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
});
