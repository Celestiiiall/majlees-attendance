const STORAGE_KEY = "majlees-attendance-v1";
const HOST_OPTIONS = ["Majlees Senior", "Majlees Junior"];
const DEFAULT_HOST = HOST_OPTIONS[0];
const GUEST_ONLY_MODE = true;

const dom = {
  sessionDate: document.getElementById("session-date"),
  sessionTime: document.getElementById("session-time"),
  sessionHost: document.getElementById("session-host"),
  saveSession: document.getElementById("save-session"),
  sessionControls: document.getElementById("session-controls"),
  sessionSummary: document.getElementById("session-summary"),
  modeNote: document.getElementById("mode-note"),
  guestForm: document.getElementById("guest-form"),
  guestName: document.getElementById("guest-name"),
  guestExpected: document.getElementById("guest-expected"),
  guestRows: document.getElementById("guest-rows"),
  emptyState: document.getElementById("empty-state"),
  filterGroup: document.getElementById("filter-group"),
  filterStatus: document.getElementById("filter-status"),
  exportCsv: document.getElementById("export-csv"),
  clearAll: document.getElementById("clear-all"),
  statTotal: document.getElementById("stat-total"),
  statArrived: document.getElementById("stat-arrived"),
  statPending: document.getElementById("stat-pending"),
  statDelay: document.getElementById("stat-delay"),
  nextUp: document.getElementById("next-up"),
  timeline: document.getElementById("timeline"),
  rowTemplate: document.getElementById("guest-row-template"),
};

const state = loadState();

init();

function init() {
  dom.sessionDate.value = state.session.date;
  dom.sessionTime.value = state.session.time;
  dom.sessionHost.value = normalizeHost(state.session.host);
  dom.filterStatus.value = GUEST_ONLY_MODE ? "all" : state.filter;

  if (GUEST_ONLY_MODE) {
    state.filter = "all";
    applyGuestModeUi();
  }

  if (!dom.guestExpected.value) {
    dom.guestExpected.value = state.session.time || getNowTimeInput();
  }

  if (!GUEST_ONLY_MODE) {
    dom.saveSession.addEventListener("click", handleSaveSession);
  }

  dom.guestForm.addEventListener("submit", handleAddGuest);
  if (!GUEST_ONLY_MODE) {
    dom.filterStatus.addEventListener("change", (event) => {
      state.filter = event.target.value;
      saveState();
      render();
    });
  }

  if (!GUEST_ONLY_MODE) {
    dom.exportCsv.addEventListener("click", exportGuestsCsv);
    dom.clearAll.addEventListener("click", () => {
      if (!state.guests.length) {
        return;
      }

      const shouldClear = window.confirm("Clear all guest entries for this Majlees session?");
      if (!shouldClear) {
        return;
      }

      state.guests = [];
      saveState();
      render();
    });
  }

  render();
}

function handleSaveSession() {
  const date = dom.sessionDate.value || getTodayDateInput();
  const time = dom.sessionTime.value || getNowTimeInput();
  const host = normalizeHost(dom.sessionHost.value);

  state.session = { date, time, host };
  saveState();

  if (!dom.guestExpected.value) {
    dom.guestExpected.value = time;
  }

  render();
}

function handleAddGuest(event) {
  event.preventDefault();

  const name = dom.guestName.value.trim();
  const expectedArrival = dom.guestExpected.value;

  if (!name || !expectedArrival) {
    return;
  }

  state.guests.push({
    id: newId(),
    name,
    expectedArrival,
    status: "pending",
    actualArrival: null,
    createdAt: new Date().toISOString(),
  });

  saveState();
  render();

  dom.guestName.value = "";
  dom.guestName.focus();
}

function render() {
  renderSessionSummary();
  renderTable();
  renderStats();
  renderOutlook();
}

function renderSessionSummary() {
  const hostText = `Host: ${normalizeHost(state.session.host)}`;
  const dateText = formatSessionDate(state.session.date);
  const timeText = formatTime(state.session.time);
  dom.sessionSummary.textContent = `${dateText} | Starts ${timeText} | ${hostText}`;
}

function renderTable() {
  const filteredGuests = sortGuests(state.guests).filter((guest) => {
    return state.filter === "all" ? true : guest.status === state.filter;
  });

  dom.guestRows.innerHTML = "";

  filteredGuests.forEach((guest) => {
    const fragment = dom.rowTemplate.content.cloneNode(true);
    const row = fragment.querySelector("tr");

    const nameInput = row.querySelector(".name-input");
    const expectedInput = row.querySelector(".expected-input");
    const statusPill = row.querySelector(".status-pill");
    const arrivedAtCell = row.querySelector(".arrived-at");
    const deltaCell = row.querySelector(".delta");
    const checkInButton = row.querySelector(".checkin");
    const noShowButton = row.querySelector(".no-show");
    const resetButton = row.querySelector(".reset");
    const removeButton = row.querySelector(".remove");
    const actionsCell = row.querySelector(".actions");

    nameInput.value = guest.name;
    expectedInput.value = guest.expectedArrival;

    setStatusPill(statusPill, guest.status);

    arrivedAtCell.textContent = guest.actualArrival
      ? formatDateTime(guest.actualArrival)
      : "-";

    const delta = calcDeltaMinutes(guest);
    deltaCell.textContent = formatDelta(delta);

    checkInButton.disabled = guest.status === "arrived";
    checkInButton.textContent = guest.status === "arrived" ? "Arrived" : "Check In";

    noShowButton.textContent = guest.status === "no-show" ? "Undo No-show" : "No-show";

    resetButton.disabled = guest.status === "pending" && !guest.actualArrival;

    if (GUEST_ONLY_MODE) {
      nameInput.disabled = true;
      expectedInput.disabled = true;
      actionsCell.textContent = "-";
    } else {
      nameInput.addEventListener("change", (event) => {
        const value = event.target.value.trim();
        if (!value) {
          event.target.value = guest.name;
          return;
        }
        updateGuest(guest.id, { name: value });
      });

      expectedInput.addEventListener("change", (event) => {
        const value = event.target.value;
        if (!value) {
          event.target.value = guest.expectedArrival;
          return;
        }
        updateGuest(guest.id, { expectedArrival: value });
      });

      checkInButton.addEventListener("click", () => {
        updateGuest(guest.id, {
          status: "arrived",
          actualArrival: new Date().toISOString(),
        });
      });

      noShowButton.addEventListener("click", () => {
        const nextStatus = guest.status === "no-show" ? "pending" : "no-show";
        updateGuest(guest.id, {
          status: nextStatus,
          actualArrival: null,
        });
      });

      resetButton.addEventListener("click", () => {
        updateGuest(guest.id, {
          status: "pending",
          actualArrival: null,
        });
      });

      removeButton.addEventListener("click", () => {
        state.guests = state.guests.filter((item) => item.id !== guest.id);
        saveState();
        render();
      });
    }

    dom.guestRows.appendChild(fragment);
  });

  const showEmpty = filteredGuests.length === 0;
  dom.emptyState.style.display = showEmpty ? "block" : "none";
}

function renderStats() {
  const total = state.guests.length;
  const arrived = state.guests.filter((guest) => guest.status === "arrived").length;
  const pending = state.guests.filter((guest) => guest.status === "pending").length;

  const delays = state.guests
    .filter((guest) => guest.status === "arrived")
    .map(calcDeltaMinutes)
    .filter((value) => Number.isFinite(value));

  const avgDelay = delays.length
    ? Math.round(delays.reduce((sum, value) => sum + value, 0) / delays.length)
    : null;

  dom.statTotal.textContent = String(total);
  dom.statArrived.textContent = String(arrived);
  dom.statPending.textContent = String(pending);
  dom.statDelay.textContent = formatDelta(avgDelay);
}

function renderOutlook() {
  const sorted = sortGuests(state.guests);
  const pending = sorted.filter((guest) => guest.status === "pending");

  if (!sorted.length) {
    dom.nextUp.textContent = "No guests added yet.";
  } else if (!pending.length) {
    dom.nextUp.textContent = "No pending arrivals right now.";
  } else {
    const next = pending[0];
    dom.nextUp.textContent = `Next expected: ${next.name} at ${formatTime(next.expectedArrival)}`;
  }

  dom.timeline.innerHTML = "";

  sorted.forEach((guest) => {
    const item = document.createElement("li");
    const left = document.createElement("strong");
    const right = document.createElement("span");

    left.textContent = guest.name;
    right.textContent = `${formatTime(guest.expectedArrival)} | ${statusLabel(guest.status)}`;

    item.appendChild(left);
    item.appendChild(right);
    dom.timeline.appendChild(item);
  });
}

function exportGuestsCsv() {
  const rows = sortGuests(state.guests).map((guest) => {
    const delta = calcDeltaMinutes(guest);
    return [
      state.session.date,
      state.session.time,
      state.session.host,
      guest.name,
      guest.expectedArrival,
      guest.status,
      guest.actualArrival ? formatDateTime(guest.actualArrival) : "",
      Number.isFinite(delta) ? String(delta) : "",
    ];
  });

  const csvLines = [
    [
      "session_date",
      "session_start",
      "host",
      "guest_name",
      "expected_arrival",
      "status",
      "arrived_at",
      "delta_minutes",
    ],
    ...rows,
  ].map((line) => line.map(escapeCsv).join(","));

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateSuffix = state.session.date || getTodayDateInput();

  link.href = url;
  link.download = `majlees-attendance-${dateSuffix}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

function updateGuest(id, updates) {
  const index = state.guests.findIndex((guest) => guest.id === id);
  if (index === -1) {
    return;
  }

  state.guests[index] = {
    ...state.guests[index],
    ...updates,
  };

  saveState();
  render();
}

function setStatusPill(element, status) {
  element.className = `status-pill ${status}`;
  element.textContent = statusLabel(status);
}

function statusLabel(status) {
  if (status === "arrived") {
    return "Arrived";
  }

  if (status === "no-show") {
    return "No-show";
  }

  return "Pending";
}

function sortGuests(guests) {
  return [...guests].sort((a, b) => {
    const timeDiff = toMinutes(a.expectedArrival) - toMinutes(b.expectedArrival);
    if (timeDiff !== 0) {
      return timeDiff;
    }

    return a.name.localeCompare(b.name);
  });
}

function toMinutes(time) {
  if (!time || !time.includes(":")) {
    return Number.POSITIVE_INFINITY;
  }

  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return Number.POSITIVE_INFINITY;
  }

  return h * 60 + m;
}

function calcDeltaMinutes(guest) {
  if (guest.status !== "arrived" || !guest.actualArrival) {
    return null;
  }

  const expected = expectedDateForGuest(guest);
  const actual = new Date(guest.actualArrival);

  if (!expected || Number.isNaN(actual.getTime())) {
    return null;
  }

  return Math.round((actual.getTime() - expected.getTime()) / 60000);
}

function expectedDateForGuest(guest) {
  const day = state.session.date || getTodayDateInput();
  if (!guest.expectedArrival) {
    return null;
  }

  const value = `${day}T${guest.expectedArrival}:00`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDelta(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  if (value === 0) {
    return "On time";
  }

  if (value > 0) {
    return `+${value} min`;
  }

  return `${value} min`;
}

function formatSessionDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "Session date not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTime(timeValue) {
  if (!timeValue || !timeValue.includes(":")) {
    return "-";
  }

  const [hours, minutes] = timeValue.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return "-";
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

function loadState() {
  const fallback = {
    session: {
      date: getTodayDateInput(),
      time: getNowTimeInput(),
      host: DEFAULT_HOST,
    },
    guests: [],
    filter: "all",
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);

    const session = {
      date: typeof parsed?.session?.date === "string" ? parsed.session.date : fallback.session.date,
      time: typeof parsed?.session?.time === "string" ? parsed.session.time : fallback.session.time,
      host: normalizeHost(parsed?.session?.host),
    };

    const guests = Array.isArray(parsed?.guests)
      ? parsed.guests
          .filter((guest) => guest && typeof guest.name === "string")
          .map((guest) => ({
            id: typeof guest.id === "string" ? guest.id : newId(),
            name: guest.name,
            expectedArrival:
              typeof guest.expectedArrival === "string" && guest.expectedArrival.includes(":")
                ? guest.expectedArrival
                : session.time,
            status: normalizeStatus(guest.status),
            actualArrival: typeof guest.actualArrival === "string" ? guest.actualArrival : null,
            createdAt: typeof guest.createdAt === "string" ? guest.createdAt : new Date().toISOString(),
          }))
      : [];

    const filter = ["all", "pending", "arrived", "no-show"].includes(parsed?.filter)
      ? parsed.filter
      : "all";

    return { session, guests, filter };
  } catch {
    return fallback;
  }
}

function normalizeStatus(status) {
  if (status === "arrived" || status === "no-show") {
    return status;
  }

  return "pending";
}

function normalizeHost(host) {
  if (typeof host === "string" && HOST_OPTIONS.includes(host)) {
    return host;
  }

  return DEFAULT_HOST;
}

function applyGuestModeUi() {
  dom.sessionControls?.classList.add("hidden");
  dom.filterGroup?.classList.add("hidden");
  dom.exportCsv?.classList.add("hidden");
  dom.clearAll?.classList.add("hidden");
  dom.modeNote?.classList.remove("hidden");
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTodayDateInput() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNowTimeInput() {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
