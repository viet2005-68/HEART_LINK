(() => {
  const API = "/api/v1";
  const ACCESS_KEY = "heartlink.access";
  const REFRESH_KEY = "heartlink.refresh";
  const icons = {
    heart: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 8.7c0 4.8-8.8 10.1-8.8 10.1S3.2 13.5 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z"/></svg>',
    discover: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="m16.5 16.5 4 4M11 7.5l1.7 3.8-3.8 1.7L11 7.5Z"/></svg>',
    matches: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 8.7c0 4.8-8.8 10.1-8.8 10.1S3.2 13.5 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z"/><path d="m8.8 10.7 2.1 2.1 4.3-4.4"/></svg>',
    profile: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5.2 20a6.8 6.8 0 0 1 13.6 0"/></svg>',
    bell: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
    close: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    send: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 3-7.2 18-3.7-7.1L3 10.2 21 3Z"/><path d="M10.1 13.9 15 9"/></svg>',
    logout: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>',
    spark: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></svg>',
    chat: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-9.5a7.5 7.5 0 1 1 17 0Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>'
  };
  const state = {
    token: localStorage.getItem(ACCESS_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
    profile: null,
    recommendations: [],
    matches: [],
    notifications: [],
    messages: [],
    currentMatch: null,
    view: "discover",
    authMode: "login",
    loading: false,
    messageTimer: null
  };
  let refreshPromise = null;
  const root = document.getElementById("app");
  const esc = (value = "") => String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const initials = name => (name || "?").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toLocaleUpperCase("vi");
  const avatarClass = (name, id = 0) => `mini-avatar v${((Number(id) || (String(name).length % 4)) % 4) + 1}`;
  const avatar = (person, online = false) => `<span class="${avatarClass(person?.name, person?.id)}">${esc(initials(person?.name))}${online ? '<i class="online-dot"></i>' : ""}</span>`;
  const dateLabel = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const parseResponse = async response => {
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const detail = body?.error?.message || body?.message;
      const error = new Error(detail || `Yêu cầu thất bại (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return body;
  };
  const issueRefresh = () => {
    if (!refreshPromise) refreshPromise = (async () => {
      if (!state.refresh) throw new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.");
      const response = await fetch(`${API}/auth/refresh`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: state.refresh })
      });
      const data = await parseResponse(response);
      saveTokens(data);
    })().finally(() => { refreshPromise = null; });
    return refreshPromise;
  };
  const api = async (path, options = {}, mayRetry = true) => {
    const headers = new Headers(options.headers || {});
    if (state.token) headers.set("Authorization", `Bearer ${state.token}`);
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    let response = await fetch(`${API}${path}`, { ...options, headers });
    if (response.status === 401 && mayRetry && state.refresh && !path.startsWith("/auth/")) {
      try {
        await issueRefresh();
        headers.set("Authorization", `Bearer ${state.token}`);
        response = await fetch(`${API}${path}`, { ...options, headers });
      } catch (error) {
        clearSession();
        render();
        throw error;
      }
    }
    return parseResponse(response);
  };
  const saveTokens = data => {
    state.token = data.access_token;
    state.refresh = data.refresh_token;
    localStorage.setItem(ACCESS_KEY, state.token);
    localStorage.setItem(REFRESH_KEY, state.refresh);
  };
  const clearSession = () => {
    if (state.messageTimer) clearInterval(state.messageTimer);
    state.token = null; state.refresh = null; state.profile = null; state.matches = [];
    state.recommendations = []; state.notifications = []; state.messages = []; state.currentMatch = null;
    localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY);
  };
  const toast = (message, error = false) => {
    const el = document.createElement("div");
    el.className = `toast${error ? " error" : ""}`;
    el.textContent = message;
    document.getElementById("toast-region").append(el);
    setTimeout(() => el.remove(), 4200);
  };
  const brand = () => `<span class="brand-mark">${icons.heart}</span><span>heartlink</span>`;
  const showAuth = (mode = "login") => { state.authMode = mode; render(); };
  const renderAuth = () => {
    const registering = state.authMode === "register";
    root.innerHTML = `<main class="auth-page">
      <section class="auth-card" aria-label="Đăng nhập Heartlink">
        <div class="auth-story"><div class="brand">${brand()}</div><div class="story-content"><p class="eyebrow" style="color:#ffe0dc">MỘT CUỘC GẶP GỠ MỚI</p><h1>Đôi khi, chỉ cần một câu chào.</h1><p>Gặp những người thú vị, bắt đầu bằng một cái chạm và xem câu chuyện sẽ đi đến đâu.</p></div><div class="story-note">Một nơi nhỏ cho những kết nối thật lòng.</div></div>
        <div class="auth-form-wrap"><p class="eyebrow">HEARTLINK · KẾT NỐI THẬT LÒNG</p><h2>${registering ? "Bắt đầu hành trình" : "Rất vui được gặp lại"}</h2><p>${registering ? "Tạo tài khoản trong vài giây để bắt đầu khám phá." : "Đăng nhập để xem những người bạn có thể muốn làm quen."}</p>
          <form id="auth-form" data-mode="${registering ? "register" : "login"}" novalidate>
            ${registering ? `<div class="field"><label for="auth-name">Tên hiển thị</label><input id="auth-name" name="name" maxlength="100" placeholder="Tên bạn muốn mọi người gọi" required autocomplete="name" /></div>` : ""}
            <div class="field"><label for="auth-email">Email</label><input id="auth-email" name="email" type="email" placeholder="ban@email.com" required autocomplete="email" value="${registering ? "" : "anna@example.com"}" /></div>
            <div class="field"><label for="auth-password">Mật khẩu</label><input id="auth-password" name="password" type="password" minlength="6" maxlength="72" placeholder="Ít nhất 6 ký tự" required autocomplete="${registering ? "new-password" : "current-password"}" value="${registering ? "" : "123456"}" /></div>
            ${registering ? `<div class="field"><label for="auth-bio">Giới thiệu <span class="muted">· tùy chọn</span></label><textarea id="auth-bio" name="bio" maxlength="500" placeholder="Bạn thích làm gì vào một ngày rảnh?"></textarea></div>` : ""}
            <button class="button button-primary button-full auth-submit" type="submit">${registering ? "Tạo tài khoản" : "Đăng nhập"}<span aria-hidden="true">→</span></button>
          </form>
          <p class="auth-switch">${registering ? "Đã có tài khoản?" : "Chưa có tài khoản?"} <button class="text-button" data-action="toggle-auth">${registering ? "Đăng nhập" : "Tạo tài khoản"}</button></p>
          ${!registering ? `<div class="demo-account"><p><strong>Tài khoản thử nhanh</strong><br />anna@example.com &nbsp;·&nbsp; mật khẩu <strong>123456</strong><br /><span>Đã có hồ sơ và một vài kết nối mẫu để khám phá.</span></p></div>` : ""}
        </div>
      </section>
    </main>`;
  };
  const notifyItem = item => `<div class="activity-item"><span class="activity-icon">${icons.heart}</span><span>${item.type === "MATCH_CREATED" ? "Bạn vừa có một kết nối mới" : "Có một cập nhật mới"}<br /><span class="muted">${item.created_at ? new Date(item.created_at).toLocaleDateString("vi-VN") : "Gần đây"}</span></span></div>`;
  const appFrame = content => {
    const me = state.profile || { name: "Bạn", email: "" };
    const pages = [["discover", "Khám phá", icons.discover], ["matches", "Kết nối", icons.matches], ["profile", "Hồ sơ của tôi", icons.profile]];
    return `<div class="app-shell">
      <aside class="sidebar"><a class="brand" href="#" aria-label="Heartlink">${brand()}</a><p class="side-label">MENU CHÍNH</p><nav class="nav-list" aria-label="Điều hướng">${pages.map(([id, label, icon]) => `<button class="nav-item ${state.view === id ? "active" : ""}" data-view="${id}">${icon}<span>${label}</span>${id === "matches" && state.matches.length ? `<span class="nav-count">${state.matches.length}</span>` : ""}</button>`).join("")}</nav>
      <div class="sidebar-bottom"><div class="sidebar-tip"><span class="tip-icon">${icons.spark}</span><strong>Cứ là chính mình</strong><p>Một lời chào chân thành luôn là khởi đầu tốt đẹp.</p></div><div class="sidebar-user">${avatar(me)}<div class="sidebar-user-meta"><strong>${esc(me.name)}</strong><span>Thành viên Heartlink</span></div><button class="logout-button" data-action="logout" title="Đăng xuất" aria-label="Đăng xuất">${icons.logout}</button></div></div></aside>
      <main class="main-column"><header class="topbar"><span class="crumb">Heartlink <span aria-hidden="true">/</span> ${state.view === "discover" ? "Khám phá" : state.view === "matches" ? "Kết nối" : "Hồ sơ"}</span><div class="topbar-right"><span class="today-label">${esc(dateLabel)}</span><button class="icon-button" data-action="notifications" title="Thông báo" aria-label="Thông báo">${icons.bell}${state.notifications.length ? '<i class="notification-dot"></i>' : ""}</button></div></header>${content}</main>
      ${state.view === "discover" ? renderRightRail() : ""}
    </div>`;
  };
  const personByMatch = match => match?.user || {};
  const renderMiniMatches = (max = 3) => {
    if (!state.matches.length) return `<p class="activity-empty">Khi hai người cùng thích nhau, kết nối sẽ xuất hiện ở đây.</p>`;
    return `<div class="mini-match-list">${state.matches.slice(0, max).map(match => { const person = personByMatch(match); return `<button class="mini-match" data-action="open-match" data-id="${match.id}">${avatar(person, true)}<span class="mini-match-text"><strong>${esc(person.name)}</strong><span>${esc(person.bio || "Sẵn sàng bắt đầu trò chuyện")}</span></span></button>`; }).join("")}</div>`;
  };
  const renderRightRail = () => {
    const me = state.profile || { name: "Bạn" };
    return `<aside class="right-column"><div class="right-top"><strong>Không gian của bạn</strong><div class="right-profile">${avatar(me)}<span>${esc(me.name)}</span></div></div>
      <section class="right-section"><div class="right-section-header"><h3>Kết nối mới</h3><button data-view="matches">Xem tất cả</button></div><div class="match-list">${state.matches.length ? state.matches.slice(0, 5).map(match => { const person = personByMatch(match); return `<button class="match-row ${state.currentMatch?.id === match.id ? "selected" : ""}" data-action="open-match" data-id="${match.id}">${avatar(person, true)}<span class="match-copy"><strong>${esc(person.name)}</strong><span>${esc(person.bio || "Hãy gửi lời chào đầu tiên")}</span></span><span class="count-pill">♡</span></button>`; }).join("") : `<p class="activity-empty">Chưa có kết nối. Hãy khám phá để gặp người mới nhé.</p>`}</div></section>
      <hr class="right-divider" />
      <section class="right-section"><div class="right-section-header"><h3>Tin nhắn</h3>${state.matches.length ? `<button data-view="matches">Mở hộp thư</button>` : ""}</div>${state.currentMatch ? renderChat(state.currentMatch, true) : `<div class="conversation-placeholder"><div><span class="heart-bubble">${icons.chat}</span><p>Chọn một kết nối để bắt đầu cuộc trò chuyện.</p></div></div>`}</section>
      <hr class="right-divider" />
      <section class="right-section"><div class="right-section-header"><h3>Gần đây</h3></div><div class="activity-list">${state.notifications.length ? state.notifications.slice(0, 3).map(notifyItem).join("") : `<p class="activity-empty">Thông báo về những kết nối mới sẽ hiện ở đây.</p>`}</div></section></aside>`;
  };
  const renderPortrait = index => `<div class="profile-art"><i class="art-orb"></i><span class="art-label">${icons.spark} Có thể bạn sẽ hợp</span><span class="art-number">${index + 1} / ${state.recommendations.length}</span><div class="portrait"><i class="portrait-halo"></i><i class="portrait-body"></i><i class="portrait-neck"></i><i class="portrait-face"></i><i class="portrait-hair"></i><i class="portrait-eyes"></i><i class="portrait-smile"></i></div></div>`;
  const renderDiscover = () => {
    const person = state.recommendations[0];
    const artV = person ? `portrait-v${(Number(person.id) % 4) + 1}` : "";
    const card = state.loading ? `<div class="loading-state"><div><i class="spinner"></i><br />Đang tìm người phù hợp...</div></div>` : !person ? `<div class="empty-state"><span class="empty-icon">${icons.heart}</span><h3>Tạm hết hồ sơ rồi</h3><p>Bạn đã khám phá tất cả hồ sơ hiện có. Quay lại sau hoặc tạo thêm tài khoản để thử luồng kết nối.</p><button class="button button-soft" data-action="reload">${icons.discover} Tải lại gợi ý</button></div>` : `<article class="discover-card ${artV}">${renderPortrait(0)}<div class="card-body"><div class="card-name-row"><h2 class="card-name">${esc(person.name)}<span class="verified" title="Hồ sơ Heartlink">${icons.check}</span></h2><span class="tag"><i class="tag-dot"></i> Đang hoạt động</span></div><p class="profile-bio">${esc(person.bio || "Chưa thêm lời giới thiệu.")}</p><div class="card-actions"><button class="round-button pass" data-action="swipe" data-kind="pass" title="Bỏ qua" aria-label="Bỏ qua">${icons.close}</button><span class="card-actions-note">Một lượt thích có thể mở đầu câu chuyện</span><button class="round-button like" data-action="swipe" data-kind="like" title="Thích" aria-label="Thích">${icons.heart}</button></div></div></article>`;
    return `<section class="discover-head"><p class="eyebrow">MỞ LÒNG VỚI ĐIỀU MỚI</p><div class="section-heading"><div><h1 class="page-title">Có ai đó đang chờ bạn</h1><p class="page-subtitle">Khám phá từng hồ sơ một. Nếu cả hai cùng thích, một kết nối mới sẽ bắt đầu.</p></div><span class="tag"><i class="tag-dot"></i> ${state.recommendations.length} hồ sơ</span></div></section><div class="discover-layout"><div>${card}</div><div class="side-rail"><section class="rail-card"><div class="rail-heading"><h3>Kết nối của bạn</h3><button class="link-button" data-view="matches">Tất cả</button></div>${renderMiniMatches()}</section><section class="rail-card"><div class="rail-heading"><h3>Tin mới</h3></div><div class="activity-list">${state.notifications.length ? state.notifications.slice(0, 2).map(notifyItem).join("") : `<p class="activity-empty">Thông báo ghép đôi sẽ xuất hiện tại đây.</p>`}</div></section></div></div>`;
  };
  const timeText = stamp => stamp ? new Date(stamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
  const renderMessages = (messages, meId) => messages?.length ? [...messages].reverse().map(message => `<div class="message ${Number(message.sender_id) === Number(meId) ? "mine" : ""}">${esc(message.content)}<span class="message-time">${esc(timeText(message.created_at))}</span></div>`).join("") : `<div class="chat-empty">Chào nhau một câu nhé, đôi khi câu chuyện hay nhất bắt đầu rất giản dị.</div>`;
  const renderChat = (match, compact = false) => {
    const person = personByMatch(match);
    const messages = state.currentMatch?.id === match.id ? state.messages : [];
    return `<div class="${compact ? "conversation-panel" : "match-chat"}"><div class="conversation-head">${avatar(person, true)}<div><strong>${esc(person.name)}</strong><span>Đã kết nối · ${match.created_at ? new Date(match.created_at).toLocaleDateString("vi-VN") : ""}</span></div>${!compact ? `<button class="logout-button" style="margin-left:auto" data-action="cancel-match" data-id="${match.id}" title="Hủy kết nối">${icons.close}</button>` : ""}</div><div class="message-list" data-message-list>${renderMessages(messages, state.profile?.id)}</div><form class="chat-form" data-chat-form data-id="${match.id}"><input class="chat-input" name="content" maxlength="2000" placeholder="Nhắn một lời chào..." autocomplete="off" required /><button class="send-button" type="submit" title="Gửi" aria-label="Gửi">${icons.send}</button></form></div>`;
  };
  const renderMatches = () => {
    const selected = state.currentMatch && state.matches.find(item => item.id === state.currentMatch.id);
    return `<section class="match-page"><p class="eyebrow">CÂU CHUYỆN CỦA BẠN</p><div class="section-heading"><div><h1 class="page-title">Những kết nối đặc biệt</h1><p class="page-subtitle">Bạn đã có ${state.matches.length} kết nối. Bắt đầu bằng một lời chào nhé.</p></div><span class="tag">${state.matches.length} kết nối</span></div>
      <div class="match-workspace"><div class="match-page-list"><h3>Đã kết nối</h3><div class="match-list">${state.matches.length ? state.matches.map(match => { const person = personByMatch(match); return `<button class="match-row ${selected?.id === match.id ? "selected" : ""}" data-action="open-match" data-id="${match.id}">${avatar(person)}<span class="match-copy"><strong>${esc(person.name)}</strong><span>${esc(person.bio || "Gửi lời chào đầu tiên")}</span></span></button>`; }).join("") : `<p class="activity-empty">Kết nối sẽ hiện ở đây khi cả hai cùng thích nhau.</p>`}</div></div>
      ${selected ? renderChat(selected) : `<div class="empty-state" style="align-self:center;margin:20px"><span class="empty-icon">${icons.chat}</span><h3>${state.matches.length ? "Chọn một kết nối" : "Câu chuyện bắt đầu từ đây"}</h3><p>${state.matches.length ? "Chọn một người ở danh sách để mở tin nhắn." : "Khám phá hồ sơ và gửi lượt thích. Khi hai người cùng thích nhau, bạn có thể trò chuyện tại đây."}</p><button class="button button-primary" data-view="discover">${icons.discover} Khám phá ngay</button></div>`}</div></div>
    </section>`;
  };
  const renderProfile = () => {
    const me = state.profile || {};
    return `<section class="profile-page"><p class="eyebrow">GÓC RIÊNG CỦA BẠN</p><h1 class="page-title">Hồ sơ của tôi</h1><p class="page-subtitle">Một chút về bạn giúp cuộc gặp đầu tiên tự nhiên hơn.</p>
      <div class="profile-card"><div class="profile-card-head">${avatar(me)}<div><h3>${esc(me.name)}</h3><p>${esc(me.email)}</p></div></div><form id="profile-form"><div class="field"><label for="profile-name">Tên hiển thị</label><input id="profile-name" name="name" maxlength="100" required value="${esc(me.name || "")}" /></div><div class="field"><label for="profile-bio">Lời giới thiệu</label><textarea id="profile-bio" name="bio" maxlength="500" placeholder="Kể một chút về bạn...">${esc(me.bio || "")}</textarea></div><div class="profile-form-actions"><button type="submit" class="button button-primary">Lưu thay đổi</button></div></form>
      <div class="profile-stats"><div class="stat-tile"><strong>${state.matches.length}</strong><span>Kết nối</span></div><div class="stat-tile"><strong>${state.recommendations.length}</strong><span>Hồ sơ đang chờ</span></div><div class="stat-tile"><strong>${state.notifications.length}</strong><span>Thông báo</span></div></div></div></section>`;
  };
  const render = () => {
    if (!state.token) { renderAuth(); return; }
    const content = state.view === "matches" ? renderMatches() : state.view === "profile" ? renderProfile() : renderDiscover();
    root.innerHTML = appFrame(content);
  };
  const refreshMessages = async matchId => {
    if (!state.token || !matchId) return;
    try {
      const page = await api(`/matches/${matchId}/messages?limit=50`);
      if (state.currentMatch?.id === matchId) {
        state.messages = page.items || [];
        const list = document.querySelector("[data-message-list]");
        if (list) { list.innerHTML = renderMessages(state.messages, state.profile?.id); list.scrollTop = list.scrollHeight; }
      }
    } catch (_) { /* Keep the current thread visible if a background refresh fails. */ }
  };
  const loadData = async () => {
    state.loading = true;
    if (state.view === "discover") render();
    const results = await Promise.allSettled([
      api("/users/me"), api("/recommendations?limit=20"), api("/matches?limit=50&offset=0"), api("/notifications?limit=20")
    ]);
    if (results[0].status === "fulfilled") state.profile = results[0].value;
    else if (results[0].reason?.status === 401) { clearSession(); render(); toast("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.", true); return; }
    if (results[1].status === "fulfilled") state.recommendations = results[1].value.items || [];
    else toast(results[1].reason?.message || "Không tải được hồ sơ gợi ý.", true);
    if (results[2].status === "fulfilled") state.matches = results[2].value.items || [];
    else toast(results[2].reason?.message || "Không tải được danh sách kết nối.", true);
    if (results[3].status === "fulfilled") state.notifications = results[3].value.items || [];
    if (state.currentMatch) state.currentMatch = state.matches.find(match => match.id === state.currentMatch.id) || null;
    state.loading = false;
    render();
    if (state.currentMatch) refreshMessages(state.currentMatch.id);
  };
  const openMatch = async id => {
    state.currentMatch = state.matches.find(match => Number(match.id) === Number(id)) || null;
    state.messages = [];
    if (state.view === "matches") render();
    else render();
    if (state.currentMatch) await refreshMessages(state.currentMatch.id);
  };
  const submitAuth = async form => {
    const data = new FormData(form);
    const mode = form.dataset.mode;
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    if (!email || !password || (mode === "register" && !String(data.get("name") || "").trim())) { toast("Vui lòng điền đầy đủ thông tin bắt buộc.", true); return; }
    const button = form.querySelector("button[type=submit]");
    button.disabled = true; button.textContent = mode === "register" ? "Đang tạo tài khoản..." : "Đang đăng nhập...";
    try {
      if (mode === "register") {
        await parseResponse(await fetch(`${API}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, name: String(data.get("name")).trim(), bio: String(data.get("bio") || "").trim() || null }) }));
      }
      const tokens = await parseResponse(await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }));
      saveTokens(tokens); state.view = "discover";
      await loadData();
      toast(mode === "register" ? "Tài khoản đã sẵn sàng. Chúc bạn khám phá vui vẻ!" : `Chào mừng trở lại, ${state.profile?.name || "bạn"}!`);
    } catch (error) {
      toast(error.message || "Không thể đăng nhập. Hãy thử lại.", true);
      button.disabled = false; button.textContent = mode === "register" ? "Tạo tài khoản →" : "Đăng nhập →";
    }
  };
  const doSwipe = async action => {
    const person = state.recommendations[0];
    if (!person) return;
    const button = document.querySelector(`[data-action="swipe"][data-kind="${action}"]`);
    if (button) button.disabled = true;
    try {
      const result = await api("/swipes", { method: "POST", body: JSON.stringify({ target_id: person.id, action }) });
      state.recommendations = state.recommendations.slice(1);
      if (result.matched) {
        await loadData();
        if (result.match?.id) { state.view = "matches"; render(); await openMatch(result.match.id); }
        const match = state.matches.find(item => item.id === result.match?.id);
        showModal("Hai bạn đã kết nối!", `Bạn và ${match?.user?.name || person.name} cùng thích nhau. Một lời chào nhỏ sẽ mở đầu câu chuyện.`, "Nhắn lời chào", () => { state.view = "matches"; render(); if (result.match?.id) openMatch(result.match.id); });
      } else {
        render();
        if (action === "like") toast(`Đã gửi lượt thích đến ${person.name} ♡`);
      }
    } catch (error) {
      if (button) button.disabled = false;
      toast(error.message || "Không thể lưu lượt chọn.", true);
    }
  };
  const submitProfile = async form => {
    const data = new FormData(form);
    const button = form.querySelector("button[type=submit]"); button.disabled = true;
    try {
      state.profile = await api("/users/me", { method: "PATCH", body: JSON.stringify({ name: String(data.get("name") || "").trim(), bio: String(data.get("bio") || "").trim() || null }) });
      render(); toast("Đã cập nhật hồ sơ của bạn.");
    } catch (error) { button.disabled = false; toast(error.message || "Không lưu được hồ sơ.", true); }
  };
  const submitMessage = async form => {
    const matchId = Number(form.dataset.id);
    const input = form.elements.content;
    const content = input.value.trim();
    if (!content) return;
    const button = form.querySelector("button[type=submit]"); button.disabled = true;
    try {
      await api(`/matches/${matchId}/messages`, { method: "POST", body: JSON.stringify({ content }) });
      input.value = "";
      await refreshMessages(matchId);
    } catch (error) { toast(error.message || "Không gửi được tin nhắn.", true); }
    finally { if (button.isConnected) button.disabled = false; }
  };
  const showModal = (title, detail, actionLabel, onAction, cancelLabel = "Để sau") => {
    document.getElementById("modal-root").innerHTML = `<div class="modal-backdrop" data-action="dismiss-modal"><div class="modal-card" role="dialog" aria-modal="true"><span class="modal-heart">${icons.heart}</span><h2>${esc(title)}</h2><p>${esc(detail)}</p><div class="modal-actions"><button class="button button-quiet" data-action="dismiss-modal">${esc(cancelLabel)}</button><button class="button button-primary" data-action="modal-primary">${esc(actionLabel)}</button></div></div></div>`;
    const button = document.querySelector('[data-action="modal-primary"]');
    button?.addEventListener("click", () => { document.getElementById("modal-root").innerHTML = ""; onAction?.(); });
  };
  const logout = async () => {
    try { if (state.refresh) await api("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: state.refresh }) }, false); }
    catch (_) { /* Clear the local session even if the server is unavailable. */ }
    clearSession(); render(); toast("Bạn đã đăng xuất.");
  };
  const handleClick = async event => {
    const target = event.target.closest("[data-action], [data-view]");
    if (!target) return;
    if (target.dataset.view) {
      state.view = target.dataset.view;
      if (state.messageTimer) clearInterval(state.messageTimer);
      if (state.view === "matches" && state.matches.length && !state.currentMatch) state.currentMatch = state.matches[0];
      render();
      if (state.currentMatch && state.view === "matches") refreshMessages(state.currentMatch.id);
      return;
    }
    switch (target.dataset.action) {
      case "toggle-auth": showAuth(state.authMode === "login" ? "register" : "login"); break;
      case "swipe": await doSwipe(target.dataset.kind); break;
      case "reload": await loadData(); break;
      case "open-match": await openMatch(target.dataset.id); if (state.view !== "matches") toast("Kết nối đã mở trong hộp thư."); break;
      case "logout": await logout(); break;
      case "notifications": state.view = "discover"; render(); document.querySelector(".activity-list")?.scrollIntoView({ behavior: "smooth", block: "center" }); break;
      case "dismiss-modal": if (target.classList.contains("modal-backdrop") || target.closest(".modal-card")) document.getElementById("modal-root").innerHTML = ""; break;
      case "cancel-match": {
        const match = state.matches.find(item => Number(item.id) === Number(target.dataset.id));
        if (!match) break;
        showModal("Hủy kết nối này?", `Bạn và ${match.user?.name || "người ấy"} sẽ không thể nhắn tin sau khi hủy.`, "Hủy kết nối", async () => {
          try { await api(`/matches/${match.id}`, { method: "DELETE" }); state.currentMatch = null; state.messages = []; await loadData(); toast("Đã hủy kết nối."); }
          catch (error) { toast(error.message || "Không thể hủy kết nối.", true); }
        }, "Giữ kết nối");
        break;
      }
    }
  };
  root.addEventListener("click", handleClick);
  root.addEventListener("submit", event => {
    event.preventDefault();
    if (event.target.id === "auth-form") submitAuth(event.target);
    else if (event.target.id === "profile-form") submitProfile(event.target);
    else if (event.target.matches("[data-chat-form]")) submitMessage(event.target);
  });
  root.addEventListener("keydown", event => {
    if (event.key === "Enter" && event.target.matches(".chat-input") && !event.shiftKey) {
      event.preventDefault(); event.target.closest("form")?.requestSubmit();
    }
  });
  render();
  if (state.token) loadData();
  setInterval(() => {
    if (state.token && state.currentMatch) refreshMessages(state.currentMatch.id);
  }, 7000);
})();
