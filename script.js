const API_BASE = "https://api.frankfurter.app";
const CURRENCY_CODES = Object.keys(countryList).sort();
const POPULAR_TARGETS = ["EUR", "GBP", "JPY", "AUD", "CAD", "INR", "CNY", "SGD", "CHF", "NZD"];
const FEATURED_CURRENCIES = [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "AUD",
    "CAD",
    "INR",
    "CNY",
    "SGD",
    "CHF",
    "NZD",
    "ZAR",
    "BRL",
    "MXN",
    "MYR",
    "TRY",
    "SEK",
    "DKK",
    "HKD",
    "ILS",
    "PHP",
    "KRW",
    "PLN",
    "RON"
];

const currencyNames = {
    AUD: "Australian Dollar",
    BGN: "Bulgarian Lev",
    BRL: "Brazilian Real",
    CAD: "Canadian Dollar",
    CHF: "Swiss Franc",
    CNY: "Chinese Yuan",
    CZK: "Czech Koruna",
    DKK: "Danish Krone",
    EUR: "Euro",
    GBP: "British Pound",
    HKD: "Hong Kong Dollar",
    HUF: "Hungarian Forint",
    IDR: "Indonesian Rupiah",
    ILS: "Israeli Shekel",
    INR: "Indian Rupee",
    ISK: "Icelandic Krona",
    JPY: "Japanese Yen",
    KRW: "South Korean Won",
    MXN: "Mexican Peso",
    MYR: "Malaysian Ringgit",
    NZD: "New Zealand Dollar",
    PHP: "Philippine Peso",
    PLN: "Polish Zloty",
    RON: "Romanian Leu",
    SEK: "Swedish Krona",
    SGD: "Singapore Dollar",
    THB: "Thai Baht",
    TRY: "Turkish Lira",
    USD: "US Dollar",
    ZAR: "South African Rand"
};

const state = {
    chart: null,
    chartGradient: null,
    chartTimer: null,
    priceTimer: null,
    chartInitialized: false,
    converterInitialized: false,
    priceInitialized: false
};

const converterForm = document.querySelector(".converter-form");
const amountInput = document.getElementById("amount-input");
const fromSelect = document.getElementById("from-currency");
const toSelect = document.getElementById("to-currency");
const converterSelects = document.querySelectorAll(".converter-select");
const swapButton = document.querySelector(".swap-button");
const msgEl = document.querySelector(".msg");
const rateUpdatedEl = document.getElementById("rate-updated-time");
const popularRatesList = document.getElementById("popular-rates");
const navLinks = document.querySelectorAll(".nav-center a");
const contentSections = document.querySelectorAll(".content-section");
const heroRateValue = document.getElementById("hero-rate-value");
const heroRateLabel = document.getElementById("hero-rate-label");
const heroUpdatedEl = document.getElementById("hero-updated");
const heroActionButtons = document.querySelectorAll(".hero-action");
const chartFromSelect = document.getElementById("chart-from-currency");
const chartToSelect = document.getElementById("chart-to-currency");
const chartTimeframeSelect = document.getElementById("chart-timeframe");
const chartCanvas = document.getElementById("exchangeRateChart");
const chartEmptyState = document.getElementById("chart-empty-state");
const priceBaseSelect = document.getElementById("price-base-currency");
const priceTableBody = document.querySelector("#price-table tbody");
const priceSearchInput = document.getElementById("price-search-input");
const priceCardGrid = document.getElementById("price-card-grid");
const viewButtons = document.querySelectorAll(".view-btn");
const footerYear = document.getElementById("footer-year");
const supportedFlagsContainer = document.getElementById("supported-flags");
const chartPresetButtons = document.querySelectorAll(".chart-preset-btn");
const chartStatHigh = document.getElementById("chart-stat-high");
const chartStatLow = document.getElementById("chart-stat-low");
const chartStatChange = document.getElementById("chart-stat-change");
const chartStatAvg = document.getElementById("chart-stat-avg");
const chartStatChangeMeta = document.getElementById("chart-stat-change-meta");
const chartStatChangeCard = document.getElementById("chart-stat-change-card");
const converterSpotlightGrid = document.getElementById("converter-spotlight-grid");
const newsletterForm = document.querySelector('.newsletter-form');
const newsletterInput = document.querySelector('#newsletter-email');

const amountFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rateFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 4 });
const percentFormatter = new Intl.NumberFormat("en-US", { signDisplay: "always", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateTimeFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
const chartLabelFormatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

function init() {
    populateAllCurrencySelectors();
    converterSelects.forEach(updateFlag);
    renderSupportedFlags();
    resetChartStats();
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear().toString();
    }
    setupEventListeners();
    setActiveChartPreset(chartTimeframeSelect ? chartTimeframeSelect.value : null);
    setActiveSection("converter-section", false);
    // Ensure price view state matches the active toggle (default: table)
    const activeViewBtn = document.querySelector('.view-btn.active');
    const initialView = activeViewBtn ? activeViewBtn.dataset.view : 'table';
    togglePriceView(initialView);
    getExchangeRate();
}

function togglePriceView(view) {
    const tableWrapper = document.querySelector('.table-wrapper');
    if (view === 'cards') {
        if (tableWrapper) tableWrapper.hidden = true;
        if (priceCardGrid) priceCardGrid.hidden = false;
    } else {
        if (tableWrapper) tableWrapper.hidden = false;
        if (priceCardGrid) priceCardGrid.hidden = true;
    }
}

function setupEventListeners() {
    if (converterForm) {
        converterForm.addEventListener("submit", (event) => {
            event.preventDefault();
            getExchangeRate();
        });
    }

    if (swapButton && fromSelect && toSelect) {
        swapButton.addEventListener("click", () => {
            const currentFrom = fromSelect.value;
            fromSelect.value = toSelect.value;
            toSelect.value = currentFrom;
            updateFlag(fromSelect);
            updateFlag(toSelect);
            getExchangeRate();
        });
    }

    converterSelects.forEach((select) => {
        select.addEventListener("change", () => {
            updateFlag(select);
            if (state.converterInitialized) {
                getExchangeRate(false);
            }
        });
    });

    if (amountInput) {
        amountInput.addEventListener("input", () => {
            if (amountInput.value && Number(amountInput.value) < 0) {
                amountInput.value = Math.abs(Number(amountInput.value)).toString();
            }
        });
        amountInput.addEventListener("focus", () => amountInput.select());
        amountInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                getExchangeRate();
            }
        });
    }

    navLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            try {
                console.debug("[nav] click fired ->", link.dataset.section);
                event.preventDefault();
                setActiveSection(link.dataset.section);
            } catch (err) {
                console.error("[nav] click handler error:", err);
            }
        });
    });

    heroActionButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const sectionId = button.dataset.section;
            setActiveSection(sectionId);
        });
    });

    if (chartFromSelect) {
        chartFromSelect.addEventListener("change", () => {
            if (isSectionActive("live-chart-section")) {
                updateChart();
            }
        });
    }

    if (chartToSelect) {
        chartToSelect.addEventListener("change", () => {
            if (isSectionActive("live-chart-section")) {
                updateChart();
            }
        });
    }

    if (chartTimeframeSelect) {
        chartTimeframeSelect.addEventListener("change", () => {
            setActiveChartPreset(chartTimeframeSelect.value);
            if (isSectionActive("live-chart-section")) {
                updateChart();
            }
        });
    }

    if (chartPresetButtons.length) {
        chartPresetButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const range = button.dataset.range;
                if (!range) return;
                if (chartTimeframeSelect) {
                    chartTimeframeSelect.value = range;
                }
                setActiveChartPreset(range);
                if (isSectionActive("live-chart-section")) {
                    updateChart();
                }
            });
        });
    }

    if (priceBaseSelect) {
        priceBaseSelect.addEventListener("change", () => {
            state.priceInitialized = true;
            if (isSectionActive("price-section")) {
                updatePriceTable();
            }
        });
    }

    if (priceSearchInput) {
        priceSearchInput.addEventListener("input", () => {
            // debounce lightly
            clearTimeout(state.priceSearchTimer);
            state.priceSearchTimer = setTimeout(() => {
                if (isSectionActive("price-section")) updatePriceTable();
            }, 180);
        });
    }

    // Newsletter form handling: prevent default submit/navigation and show inline feedback
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (ev) => {
            ev.preventDefault();
            const email = newsletterInput ? String(newsletterInput.value || '').trim() : '';
            clearNewsletterMessages();
            if (!isValidEmail(email)) {
                showNewsletterMessage('Please enter a valid email address.', 'error');
                return;
            }

            // Simulate a successful subscribe (no network call). Show success state.
            showNewsletterMessage('Thanks — you\'re subscribed! Check your inbox for confirmation.', 'success');
            if (newsletterInput) newsletterInput.value = '';
            const submitBtn = newsletterForm.querySelector('button');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('subscribed');
                submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Subscribed';
            }

            // Re-enable after a short delay so user can subscribe again if desired
            setTimeout(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('subscribed');
                    submitBtn.textContent = 'Subscribe';
                }
                clearNewsletterMessages();
            }, 4500);
        });
    }

    if (viewButtons.length) {
        viewButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const view = btn.dataset.view;
                viewButtons.forEach((b) => b.classList.toggle("active", b === btn));
                togglePriceView(view);
            });
        });
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            clearInterval(state.chartTimer);
            clearInterval(state.priceTimer);
        } else {
            const active = getActiveSectionId();
            if (active === "live-chart-section") {
                updateChart();
                state.chartTimer = setInterval(updateChart, 120000);
            }
            if (active === "price-section") {
                updatePriceTable();
                state.priceTimer = setInterval(updatePriceTable, 120000);
            }
        }
    });
}

function populateAllCurrencySelectors() {
    const selects = document.querySelectorAll("select.currency-select");
    selects.forEach((select) => {
        const compact = select.dataset.compact === "true";
        const defaultValue = select.dataset.default || select.value || CURRENCY_CODES[0];
        populateSelect(select, defaultValue, compact);
    });

    if (chartFromSelect && chartToSelect && chartFromSelect.value === chartToSelect.value) {
        const alternative = Array.from(chartToSelect.options).find((option) => option.value !== chartFromSelect.value);
        if (alternative) {
            chartToSelect.value = alternative.value;
        }
    }
}

function populateSelect(select, selectedValue, compact) {
    const currentValue = select.value || selectedValue;
    select.innerHTML = "";
    CURRENCY_CODES.forEach((code) => {
        const option = document.createElement("option");
        option.value = code;
        // display only the currency code (remove full name)
        option.textContent = code;
        if (code === currentValue) {
            option.selected = true;
        }
        select.append(option);
    });

    if (!select.value) {
        select.value = selectedValue || CURRENCY_CODES[0];
    }
}

function updateFlag(select) {
    const flagImg = select?.parentElement?.querySelector("img");
    if (!flagImg) return;
    const url = getFlagUrl(select.value, 64);
    if (url) {
        flagImg.src = url;
    }
}

async function getExchangeRate(showLoader = true) {
    if (!fromSelect || !toSelect || !msgEl) return;

    const from = fromSelect.value;
    const to = toSelect.value;

    if (from === to) {
        msgEl.textContent = "Choose two different currencies to convert.";
        return;
    }

    let amount = sanitizeAmount(amountInput ? amountInput.value : "");
    if (!amount) {
        amount = 1;
        if (amountInput) amountInput.value = "1";
    }

    if (showLoader) {
        msgEl.textContent = "Fetching live rate...";
    }

    const url = `${API_BASE}/latest?from=${from}&to=${to}`;

    try {
        const data = await fetchJSON(url);
        const rate = data?.rates?.[to];

        if (!rate) {
            msgEl.textContent = "Exchange rate not available.";
            return;
        }

        const converted = amount * rate;
        msgEl.innerHTML = `<span>${formatAmount(amount)} ${from}</span><span>= ${formatAmount(converted)} ${to}</span>`;

        if (rateUpdatedEl) {
            rateUpdatedEl.textContent = dateTimeFormatter.format(new Date());
        }

        updateHeroStats(rate, data.date, from, to);
        updatePopularRates(from);

        if (priceBaseSelect && !state.priceInitialized) {
            priceBaseSelect.value = from;
        }

        const priceActive = isSectionActive("price-section");
        if (priceActive) {
            updatePriceTable();
        }

        state.converterInitialized = true;
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        msgEl.textContent = "Failed to fetch exchange rate.";
    }
}

async function updatePopularRates(base) {
    if (!popularRatesList) return;

    const targets = POPULAR_TARGETS.filter((code) => code !== base);
    if (!targets.length) {
        popularRatesList.innerHTML = "";
        renderConverterSpotlight(base, []);
        return;
    }

    popularRatesList.innerHTML = `<li>Loading popular rates...</li>`;
    setSpotlightLoading();

    const url = `${API_BASE}/latest?from=${base}&to=${targets.join(",")}`;

    try {
        const data = await fetchJSON(url);
        const entries = Object.entries(data.rates || {})
            .filter(([code]) => code !== base)
            .sort((a, b) => a[0].localeCompare(b[0]));

        if (!entries.length) {
            popularRatesList.innerHTML = `<li>No popular pairs available.</li>`;
            renderConverterSpotlight(base, []);
            return;
        }

        popularRatesList.innerHTML = "";
        entries.forEach(([code, rate]) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="pair-label">
                    <img src="${getFlagUrl(code, 48)}" alt="">
                    <span>${base} → ${code}</span>
                </span>
                <span class="pair-value">${formatRate(rate)}</span>
            `;
            popularRatesList.append(li);
        });

        renderConverterSpotlight(base, entries);
    } catch (error) {
        console.error("Error loading popular rates:", error);
        popularRatesList.innerHTML = `<li>Unable to load popular pairs.</li>`;
        setSpotlightLoading("Unable to load spotlight currencies.");
    }
}

async function updatePriceTable() {
    if (!priceBaseSelect || !priceTableBody) return;

    const base = priceBaseSelect.value;
    priceTableBody.innerHTML = `<tr><td colspan="2">Loading live prices...</td></tr>`;
    if (priceCardGrid) {
        priceCardGrid.innerHTML = "";
        priceCardGrid.hidden = true;
    }

    const url = `${API_BASE}/latest?from=${base}`;

    try {
        const data = await fetchJSON(url);
        const entries = Object.entries(data.rates || {})
            .filter(([code]) => code !== base)
            .sort((a, b) => a[0].localeCompare(b[0]));

        if (!entries.length) {
            priceTableBody.innerHTML = `<tr><td colspan="2">No rates available for ${base}.</td></tr>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        const cardsFragment = document.createDocumentFragment();
        const filterText = priceSearchInput ? String(priceSearchInput.value || "").trim().toLowerCase() : "";
        entries.forEach(([code, rate]) => {
            const label = `${code} ${getCurrencyLabel(code)}`.toLowerCase();
            if (filterText && !label.includes(filterText)) return;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="currency-cell">
                    <img src="${getFlagUrl(code, 48)}" alt="${code} flag">
                    <div>
                        <span class="currency-code">${code}</span>
                        <span class="currency-name">${getCurrencyLabel(code)}</span>
                    </div>
                </td>
                <td class="rate-cell">${formatRate(rate)}</td>
            `;
            fragment.append(row);

            // build card
            const card = document.createElement("article");
            card.className = "price-card";
            card.innerHTML = `
                <img src="${getFlagUrl(code, 48)}" alt="${code} flag">
                <div class="currency-meta">
                    <span class="currency-code">${code}</span>
                    <span class="currency-name">${getCurrencyLabel(code)}</span>
                </div>
                <div class="price-value">${formatRate(rate)}</div>
            `;
            cardsFragment.append(card);
        });

        priceTableBody.innerHTML = "";
        priceTableBody.append(fragment);
        if (priceCardGrid) {
            priceCardGrid.append(cardsFragment);
        }
        state.priceInitialized = true;
    } catch (error) {
        console.error("Error loading price table:", error);
        priceTableBody.innerHTML = `<tr><td colspan="2">Unable to load live prices right now.</td></tr>`;
    }
}

async function updateChart() {
    if (!chartFromSelect || !chartToSelect || !chartCanvas) return;

    const base = chartFromSelect.value;
    const quote = chartToSelect.value;

    resetChartStats();

    if (base === quote) {
        showChartEmpty("Please choose two different currencies to view the trend.");
        destroyChart();
        return;
    }

    showChartEmpty("Loading chart data...");

    const days = parseInt(chartTimeframeSelect?.value || "30", 10);
    const { start, end } = getDateRange(days);
    const url = `${API_BASE}/${start}..${end}?from=${base}&to=${quote}`;

    try {
        const data = await fetchJSON(url);
        const rates = Object.entries(data.rates || {})
            .map(([date, value]) => ({ date, rate: value[quote] }))
            .filter((entry) => entry.rate)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (!rates.length) {
            showChartEmpty("No historical data available for this currency pair.");
            destroyChart();
            resetChartStats();
            return;
        }

        const labels = rates.map(({ date }) => chartLabelFormatter.format(new Date(`${date}T00:00:00Z`)));
        const values = rates.map(({ rate }) => Number(rate.toFixed(4)));

        drawChart(labels, values, base, quote);
        renderChartStats(rates, base, quote);
        showChartEmpty("", false);
        state.chartInitialized = true;
    } catch (error) {
        console.error("Error loading chart data:", error);
        showChartEmpty("Unable to load chart data at the moment.");
        destroyChart();
        resetChartStats();
    }
}

function drawChart(labels, values, base, quote) {
    const ctx = chartCanvas.getContext("2d");

    if (!state.chartGradient) {
        const gradient = ctx.createLinearGradient(0, 0, 0, chartCanvas.height);
        gradient.addColorStop(0, "rgba(99, 102, 241, 0.35)");
        gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
        state.chartGradient = gradient;
    }

    const datasetConfig = {
        label: `${base} → ${quote}`,
        data: values,
        borderColor: "rgba(99, 102, 241, 1)",
        backgroundColor: state.chartGradient,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2.5
    };

    if (!state.chart) {
        state.chart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [datasetConfig]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "rgba(15, 23, 42, 0.85)",
                        borderColor: "rgba(148, 163, 184, 0.2)",
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { family: "Poppins", size: 14 },
                        bodyFont: { family: "Poppins", size: 13 },
                        callbacks: {
                            label: (context) => `${context.formattedValue}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: "rgba(148, 163, 184, 0.12)"
                        },
                        ticks: {
                            color: "rgba(148, 163, 184, 0.8)"
                        }
                    },
                    y: {
                        grid: {
                            color: "rgba(148, 163, 184, 0.1)"
                        },
                        ticks: {
                            color: "rgba(148, 163, 184, 0.75)"
                        }
                    }
                }
            }
        });
    } else {
        state.chart.data.labels = labels;
        state.chart.data.datasets[0].label = `${base} → ${quote}`;
        state.chart.data.datasets[0].data = values;
        state.chart.update();
    }
}

function destroyChart() {
    if (state.chart) {
        state.chart.destroy();
        state.chart = null;
        state.chartInitialized = false;
    }
}

function showChartEmpty(message, visible = true) {
    if (!chartEmptyState || !chartCanvas) return;
    if (message) {
        chartEmptyState.textContent = message;
    }
    chartEmptyState.classList.toggle("visible", visible);
    chartCanvas.style.opacity = visible ? "0.2" : "1";
}

function setActiveSection(sectionId, shouldScroll = true) {
    if (!sectionId) return;

    contentSections.forEach((section) => {
        section.classList.toggle("active", section.id === sectionId);
    });

    navLinks.forEach((link) => {
        link.classList.toggle("active-link", link.dataset.section === sectionId);
    });

    clearInterval(state.chartTimer);
    clearInterval(state.priceTimer);

    if (shouldScroll) {
        const sectionElement = document.getElementById(sectionId);
        if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    if (sectionId === "converter-section") {
        if (state.converterInitialized) {
            getExchangeRate(false);
        }
    }

    if (sectionId === "live-chart-section") {
        updateChart();
        state.chartTimer = setInterval(updateChart, 120000);
    }

    if (sectionId === "price-section") {
        updatePriceTable();
        state.priceTimer = setInterval(updatePriceTable, 120000);
    }
}

function getActiveSectionId() {
    const active = Array.from(contentSections).find((section) => section.classList.contains("active"));
    return active ? active.id : null;
}

function isSectionActive(sectionId) {
    const section = document.getElementById(sectionId);
    return section ? section.classList.contains("active") : false;
}

function updateHeroStats(rate, dateString, base, target) {
    if (heroRateValue) {
        heroRateValue.textContent = formatRate(rate);
    }
    if (heroRateLabel) {
        heroRateLabel.textContent = `${base} → ${target}`;
    }
    if (heroUpdatedEl) {
        const date = dateString ? new Date(`${dateString}T00:00:00Z`) : new Date();
        heroUpdatedEl.textContent = formatRelativeTime(date);
    }
}

function renderSupportedFlags() {
    if (!supportedFlagsContainer) return;

    const seen = new Set();
    const featured = FEATURED_CURRENCIES.filter((code) => {
        const hasFlag = Boolean(countryList[code]);
        if (!hasFlag || seen.has(code)) {
            return false;
        }
        seen.add(code);
        return true;
    });

    if (!featured.length) {
        supportedFlagsContainer.innerHTML = "<p class=\"supported-flags-empty\">Currencies coming soon.</p>";
        return;
    }

    supportedFlagsContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();

    const renderCard = (code) => {
        const flagUrl = getFlagUrl(code, 64);
        if (!flagUrl) {
            return;
        }
        const card = document.createElement("article");
        card.className = "supported-flag";
        card.innerHTML = `
            <img src="${flagUrl}" alt="${code} flag">
            <span>${code}</span>
            <small>${getCurrencyLabel(code)}</small>
        `;
        fragment.append(card);
    };

    featured.forEach(renderCard);

    if (featured.length < CURRENCY_CODES.length) {
        const remaining = CURRENCY_CODES.filter((code) => !seen.has(code));
        remaining
            .slice(0, Math.max(0, 24 - featured.length))
            .forEach(renderCard);
    }

    supportedFlagsContainer.append(fragment);
}

function setSpotlightLoading(message = "Loading spotlight currencies...") {
    if (!converterSpotlightGrid) return;
    converterSpotlightGrid.innerHTML = `
        <article class="spotlight-card placeholder">
            <p>${message}</p>
        </article>
    `;
}

function renderConverterSpotlight(base, entries) {
    if (!converterSpotlightGrid) return;

    if (!entries || !entries.length) {
        setSpotlightLoading(`No spotlight currencies available for ${base} right now.`);
        return;
    }

    converterSpotlightGrid.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const topEntries = entries.slice(0, 4);

    topEntries.forEach(([code, rate]) => {
        const card = document.createElement("article");
        card.className = "spotlight-card";
        card.innerHTML = `
            <header>
                <img src="${getFlagUrl(code, 64)}" alt="${code} flag">
                <div>
                    <h4>${code}</h4>
                    <span>${getCurrencyLabel(code)}</span>
                </div>
            </header>
            <div class="spotlight-rate">
                <strong>${formatRate(rate)}</strong>
                <small>1 ${base} = ${code}</small>
            </div>
        `;
        fragment.append(card);
    });

    converterSpotlightGrid.append(fragment);
}

function setActiveChartPreset(range) {
    if (!chartPresetButtons.length) return;
    const normalized = range ? String(range) : null;
    chartPresetButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.range === normalized);
    });
}

function resetChartStats() {
    if (chartStatHigh) chartStatHigh.textContent = "--";
    if (chartStatLow) chartStatLow.textContent = "--";
    if (chartStatChange) chartStatChange.textContent = "--";
    if (chartStatAvg) chartStatAvg.textContent = "--";
    if (chartStatChangeMeta) {
        const defaultText = chartStatChangeMeta.dataset.default || "vs starting value";
        chartStatChangeMeta.textContent = defaultText;
    }
    if (chartStatChangeCard) {
        chartStatChangeCard.classList.remove("positive", "negative");
    }
}

function renderChartStats(ratesData, base, quote) {
    if (!ratesData || !ratesData.length) {
        resetChartStats();
        return;
    }

    if (!chartStatHigh || !chartStatLow || !chartStatChange || !chartStatAvg) {
        return;
    }

    const values = ratesData.map(({ rate }) => Number(rate));
    if (!values.length) {
        resetChartStats();
        return;
    }

    const max = Math.max(...values);
    const min = Math.min(...values);
    const first = values[0];
    const last = values[values.length - 1];
    const avg = values.reduce((total, value) => total + value, 0) / values.length;
    const delta = last - first;
    const changePercent = first !== 0 ? (delta / first) * 100 : 0;

    chartStatHigh.textContent = `${formatRate(max)} ${quote}`;
    chartStatLow.textContent = `${formatRate(min)} ${quote}`;
    chartStatAvg.textContent = `${formatRate(avg)} ${quote}`;

    const percentDisplay = Math.abs(changePercent) < 0.005 ? "0.00%" : `${percentFormatter.format(changePercent)}%`;
    const deltaDisplay = formatSignedRate(delta);
    chartStatChange.textContent = `${deltaDisplay} (${percentDisplay})`;

    if (chartStatChangeMeta) {
        const startLabel = chartLabelFormatter.format(new Date(`${ratesData[0].date}T00:00:00Z`));
        const endLabel = chartLabelFormatter.format(new Date(`${ratesData[ratesData.length - 1].date}T00:00:00Z`));
        chartStatChangeMeta.textContent = `${startLabel}: ${formatRate(first)} ${quote} • ${endLabel}: ${formatRate(last)} ${quote}`;
    }

    if (chartStatChangeCard) {
        chartStatChangeCard.classList.remove("positive", "negative");
        const threshold = 0.0001;
        if (delta > threshold) {
            chartStatChangeCard.classList.add("positive");
        } else if (delta < -threshold) {
            chartStatChangeCard.classList.add("negative");
        }
    }
}

function formatSignedRate(value) {
    const magnitude = Math.abs(value);
    if (magnitude < 0.00005) {
        return "0.0000";
    }
    const sign = value > 0 ? "+" : "-";
    return `${sign}${rateFormatter.format(magnitude)}`;
}

async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }
    return response.json();
}

function sanitizeAmount(value) {
    const parsed = parseFloat(String(value).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }
    return parsed;
}

function getFlagUrl(code, size = 64) {
    const countryCode = countryList[code];
    return countryCode ? `https://flagsapi.com/${countryCode}/flat/${size}.png` : "";
}

function getCurrencyLabel(code) {
    // return only the code so UI doesn't show the currency/country name
    return code;
}

function formatAmount(value) {
    return amountFormatter.format(value);
}

function formatRate(value) {
    return rateFormatter.format(value);
}

function formatRelativeTime(date) {
    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
}

function getDateRange(days) {
    const end = new Date();
    const start = new Date();
    start.setUTCDate(end.getUTCDate() - (days - 1));
    return {
        start: formatApiDate(start),
        end: formatApiDate(end)
    };
}

function formatApiDate(date) {
    return date.toISOString().split("T")[0];
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

/* Newsletter helpers */
function isValidEmail(email) {
    // simple pattern, good enough for client-side validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showNewsletterMessage(message, type = 'info') {
    if (!newsletterForm) return;
    clearNewsletterMessages();
    const el = document.createElement('div');
    el.className = `newsletter-msg newsletter-msg--${type}`;
    el.textContent = message;
    newsletterForm.appendChild(el);
}

function clearNewsletterMessages() {
    if (!newsletterForm) return;
    const existing = newsletterForm.querySelectorAll('.newsletter-msg');
    existing.forEach((n) => n.remove());
}
