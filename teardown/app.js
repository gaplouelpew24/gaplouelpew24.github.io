(function () {
    "use strict";

    const PDFJS_CDN =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
    const PDFJS_WORKER_CDN =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
    const HOME_TITLE = "游戏拆解案";
    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 3.5;
    const DESKTOP_DEFAULT_SCALE = 0.6;
    const MOBILE_DEFAULT_SCALE = 0.95;
    const MOBILE_READER_BREAKPOINT = 919.98;
    const BACK_TO_TOP_THRESHOLD = 48;

    const elements = {
        siteMain: document.querySelector("#site-main"),
        caseList: document.querySelector("#case-list"),
        caseEmpty: document.querySelector("#case-empty"),
        caseTemplate: document.querySelector("#case-template"),
        profileCard: document.querySelector("#profile-card"),
        profileBar: document.querySelector("#profile-card-bar"),
        reader: document.querySelector("#reader"),
        readerBack: document.querySelector("#reader-back"),
        readerTitle: document.querySelector("#reader-title"),
        fitPage: document.querySelector("#fit-page"),
        openPdf: document.querySelector("#open-pdf"),
        pdfWidget: document.querySelector("#pdf-widget"),
        pdfScroll: document.querySelector("#pdf-scroll"),
        pdfPages: document.querySelector("#pdf-pages"),
        pdfLoading: document.querySelector("#pdf-loading"),
        pdfNotice: document.querySelector("#pdf-notice"),
        pageInput: document.querySelector("#page-input"),
        pageCount: document.querySelector("#page-count"),
        zoomOut: document.querySelector("#zoom-out"),
        zoomIn: document.querySelector("#zoom-in"),
        zoomInput: document.querySelector("#zoom-input"),
        backToTop: document.querySelector("#back-to-top"),
        contextMenu: document.querySelector("#context-menu")
    };

    const appState = {
        cases: [],
        activeCase: null,
        readerOpen: false,
        previousFocus: null
    };

    const pdfState = {
        doc: null,
        source: "",
        loaded: false,
        loadToken: 0,
        baseWidth: 600,
        zoom: 1,
        zoomTarget: 1,
        zoomFrame: null,
        currentPage: 1,
        pageFrame: null,
        pages: [],
        observer: null,
        resizeTimer: null
    };

    let pdfLibraryPromise = null;
    let contextLinkHref = "";
    let contextLinkTarget = "";
    let contextPdfActive = false;
    let contextProfileActive = false;
    let profileDrag = null;
    let profileSuppressClick = false;
    let resizeObserver = null;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function resolveUrl(path) {
        return new URL(path, document.baseURI).href;
    }

    function createTextElement(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        node.textContent = text || "";
        return node;
    }

    function normalizeCase(item) {
        if (!item || typeof item !== "object") return null;
        const id = typeof item.id === "string" ? item.id.trim() : "";
        const pdf = typeof item.pdf === "string" ? item.pdf.trim() : "";
        if (!id || !pdf) return null;
        return {
            id: id,
            title: typeof item.title === "string" ? item.title.trim() : id,
            pdf: pdf
        };
    }

    function renderCases(cases) {
        elements.caseList.textContent = "";
        elements.caseEmpty.hidden = cases.length > 0;
        if (!cases.length) return;

        const fragment = document.createDocumentFragment();
        cases.forEach(function (item) {
            const itemNode = elements.caseTemplate.content.firstElementChild
                .cloneNode(true);
            const link = itemNode.querySelector(".case");
            link.href = "#" + encodeURIComponent(item.id);
            link.dataset.caseId = item.id;
            link.setAttribute("aria-label", "打开《" + item.title + "》拆解案");
            itemNode.querySelector(".case__title").textContent = item.title;
            fragment.appendChild(itemNode);
        });
        elements.caseList.appendChild(fragment);
    }

    function renderCaseError(message) {
        elements.caseList.textContent = "";
        elements.caseList.appendChild(
            createTextElement("li", "archive__empty", message)
        );
        elements.caseEmpty.hidden = true;
    }

    async function loadCases() {
        try {
            const response = await fetch("./cases.json", { cache: "no-store" });
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            const data = await response.json();
            if (!data || !Array.isArray(data.cases)) {
                throw new Error("cases.json 缺少 cases 数组");
            }
            appState.cases = data.cases.map(normalizeCase).filter(Boolean);
            renderCases(appState.cases);
        } catch (error) {
            console.error("拆解案列表加载失败", error);
            renderCaseError("拆解案列表加载失败，请刷新后重试。");
        }
    }

    function getCaseFromHash() {
        const rawHash = window.location.hash.replace(/^#/, "");
        if (!rawHash) return null;
        let id = rawHash;
        try {
            id = decodeURIComponent(rawHash);
        } catch (error) {
            return null;
        }
        return appState.cases.find(function (item) {
            return item.id === id;
        }) || null;
    }

    function setPageInert(inert) {
        if (elements.siteMain) elements.siteMain.inert = inert;
        if (elements.profileCard) elements.profileCard.inert = inert;
    }

    function setProfileCovered(covered) {
        if (!elements.profileCard) return;
        elements.profileCard.classList.toggle("is-covered", covered);
    }

    function updateReaderMetadata(item) {
        elements.readerTitle.textContent = item.title;
        const pdfUrl = resolveUrl(item.pdf);
        elements.openPdf.href = pdfUrl;
        elements.openPdf.setAttribute(
            "aria-label",
            "在新标签页打开《" + item.title + "》原始 PDF"
        );
    }

    function openReader(item) {
        if (!item) return;
        if (appState.readerOpen && appState.activeCase?.id === item.id) {
            return;
        }

        if (!appState.readerOpen) {
            appState.previousFocus = document.activeElement;
        }

        appState.activeCase = item;
        appState.readerOpen = true;
        updateReaderMetadata(item);
        hideContextMenu();
        elements.reader.classList.add("is-open");
        elements.reader.setAttribute("aria-hidden", "false");
        elements.reader.inert = false;
        document.body.classList.add("reader-open");
        setPageInert(true);
        setProfileCovered(true);
        document.title = item.title + " 拆解案";
        elements.backToTop.classList.remove("is-visible");

        requestAnimationFrame(function () {
            if (!appState.readerOpen || appState.activeCase?.id !== item.id) {
                return;
            }
            loadPdf(item.pdf);
        });
    }

    function closeReader(options) {
        const settings = Object.assign(
            { updateHash: true, restoreFocus: true },
            options || {}
        );
        if (!appState.readerOpen) return;

        hideContextMenu();
        appState.readerOpen = false;
        elements.reader.classList.remove("is-open");
        elements.reader.setAttribute("aria-hidden", "true");
        elements.reader.inert = true;
        document.body.classList.remove("reader-open");
        setPageInert(false);
        setProfileCovered(false);
        document.title = HOME_TITLE;
        requestAnimationFrame(updateBackToTopVisibility);

        if (settings.updateHash && window.location.hash) {
            history.replaceState(
                null,
                "",
                window.location.pathname + window.location.search
            );
        }

        const focusTarget = appState.previousFocus;
        appState.previousFocus = null;
        appState.activeCase = null;

        if (
            settings.restoreFocus &&
            focusTarget &&
            typeof focusTarget.focus === "function" &&
            document.contains(focusTarget)
        ) {
            requestAnimationFrame(function () {
                focusTarget.focus({ preventScroll: true });
            });
        }
    }

    function syncRoute() {
        const item = getCaseFromHash();
        if (item) {
            openReader(item);
        } else {
            closeReader({ updateHash: false, restoreFocus: false });
        }
    }

    function refreshProfileCollapsedWidth() {
        const card = elements.profileCard;
        const bar = elements.profileBar;
        if (!card || !bar) return;
        const title = card.querySelector(".profile-card__title");
        if (!title) return;
        const barStyle = window.getComputedStyle(bar);
        const cardStyle = window.getComputedStyle(card);
        const paddingLeft = parseFloat(barStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(barStyle.paddingRight) || 0;
        const borderLeft = parseFloat(cardStyle.borderLeftWidth) || 0;
        const borderRight = parseFloat(cardStyle.borderRightWidth) || 0;
        const width = Math.ceil(
            title.getBoundingClientRect().width +
                paddingLeft +
                paddingRight +
                borderLeft +
                borderRight
        );
        if (width > 0) {
            card.style.setProperty("--profile-width-collapsed", width + "px");
        }
    }

    function setProfilePosition(left, top) {
        if (!elements.profileCard) return;
        elements.profileCard.style.left = left + "px";
        elements.profileCard.style.top = top + "px";
        elements.profileCard.style.right = "auto";
        elements.profileCard.style.bottom = "auto";
    }

    function clampProfilePosition() {
        const card = elements.profileCard;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const margin = 6;
        let left = rect.left;
        let top = rect.top;
        let changed = false;

        if (rect.left < margin) {
            left = margin;
            changed = true;
        }
        if (rect.top < margin) {
            top = margin;
            changed = true;
        }
        if (rect.right > window.innerWidth - margin) {
            left = window.innerWidth - margin - rect.width;
            changed = true;
        }
        if (rect.bottom > window.innerHeight - margin) {
            top = window.innerHeight - margin - rect.height;
            changed = true;
        }
        if (changed) setProfilePosition(left, top);
    }

    function setProfileCollapsed(collapsed) {
        if (!elements.profileCard) return;
        elements.profileCard.classList.toggle("is-collapsed", collapsed);
        if (elements.profileBar) {
            elements.profileBar.setAttribute(
                "aria-expanded",
                collapsed ? "false" : "true"
            );
        }
    }

    function toggleProfileCollapsed() {
        if (!elements.profileCard) return;
        setProfileCollapsed(
            !elements.profileCard.classList.contains("is-collapsed")
        );
    }

    function resetProfilePosition() {
        const card = elements.profileCard;
        if (!card) return;
        const startRect = card.getBoundingClientRect();
        ["top", "right", "bottom", "left"].forEach(function (property) {
            card.style.removeProperty(property);
        });
        const endRect = card.getBoundingClientRect();
        const deltaX = startRect.left - endRect.left;
        const deltaY = startRect.top - endRect.top;
        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
        if (typeof card.animate !== "function") return;

        card.classList.add("is-resetting");
        const animation = card.animate(
            [
                {
                    transform:
                        "translate3d(" +
                        deltaX +
                        "px, " +
                        deltaY +
                        "px, 0)"
                },
                { transform: "translate3d(0, 0, 0)" }
            ],
            {
                duration: 560,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)"
            }
        );
        animation.addEventListener(
            "finish",
            function () {
                card.classList.remove("is-resetting");
            },
            { once: true }
        );
    }

    function handleProfilePointerDown(event) {
        const card = elements.profileCard;
        const bar = elements.profileBar;
        if (!card || !bar) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const rect = card.getBoundingClientRect();
        profileDrag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originLeft: rect.left,
            originTop: rect.top,
            moved: false
        };
        card.classList.add("is-dragging");
        try {
            bar.setPointerCapture(event.pointerId);
        } catch (error) {
            /* Pointer capture is an enhancement. */
        }
    }

    function handleProfilePointerMove(event) {
        if (!profileDrag || profileDrag.pointerId !== event.pointerId) return;
        const deltaX = event.clientX - profileDrag.startX;
        const deltaY = event.clientY - profileDrag.startY;
        if (Math.abs(deltaX) + Math.abs(deltaY) < 5) return;
        profileDrag.moved = true;
        const rect = elements.profileCard.getBoundingClientRect();
        const margin = 6;
        const left = Math.min(
            Math.max(profileDrag.originLeft + deltaX, margin),
            window.innerWidth - rect.width - margin
        );
        const top = Math.min(
            Math.max(profileDrag.originTop + deltaY, margin),
            window.innerHeight - rect.height - margin
        );
        setProfilePosition(left, top);
        event.preventDefault();
    }

    function handleProfilePointerEnd(event) {
        if (!profileDrag || profileDrag.pointerId !== event.pointerId) return;
        const moved = profileDrag.moved;
        profileDrag = null;
        elements.profileCard.classList.remove("is-dragging");
        if (
            elements.profileBar &&
            elements.profileBar.hasPointerCapture(event.pointerId)
        ) {
            try {
                elements.profileBar.releasePointerCapture(event.pointerId);
            } catch (error) {
                /* Ignore browsers that release capture automatically. */
            }
        }
        if (moved) {
            profileSuppressClick = true;
            setTimeout(function () {
                profileSuppressClick = false;
            }, 0);
        }
    }

    function bindProfileEvents() {
        const card = elements.profileCard;
        const bar = elements.profileBar;
        if (!card || !bar) return;

        document.addEventListener(
            "pointerdown",
            function (event) {
                if (card.classList.contains("is-collapsed")) return;
                if (card.contains(event.target)) return;
                setProfileCollapsed(true);
            },
            true
        );

        bar.addEventListener("pointerdown", handleProfilePointerDown);
        bar.addEventListener("pointermove", handleProfilePointerMove);
        bar.addEventListener("pointerup", handleProfilePointerEnd);
        bar.addEventListener("pointercancel", handleProfilePointerEnd);
        bar.addEventListener("click", function () {
            if (profileSuppressClick) {
                profileSuppressClick = false;
                return;
            }
            toggleProfileCollapsed();
        });

        card.addEventListener("transitionend", function (event) {
            if (event.target !== card) return;
            clampProfilePosition();
            refreshProfileCollapsedWidth();
        });

        refreshProfileCollapsedWidth();
        clampProfilePosition();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
                refreshProfileCollapsedWidth();
                clampProfilePosition();
            });
        }
    }

    function loadPdfLibrary() {
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
            return Promise.resolve(window.pdfjsLib);
        }
        if (!pdfLibraryPromise) {
            pdfLibraryPromise = new Promise(function (resolve, reject) {
                const script = document.createElement("script");
                script.src = PDFJS_CDN;
                script.async = true;
                script.onload = function () {
                    if (!window.pdfjsLib) {
                        reject(new Error("PDF 库未正确初始化"));
                        return;
                    }
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                        PDFJS_WORKER_CDN;
                    resolve(window.pdfjsLib);
                };
                script.onerror = function () {
                    pdfLibraryPromise = null;
                    reject(new Error("PDF 库加载失败"));
                };
                document.head.appendChild(script);
            });
        }
        return pdfLibraryPromise;
    }

    function setPdfLoading(visible, label) {
        elements.pdfLoading.hidden = !visible;
        if (!label) return;
        const node = elements.pdfLoading.lastElementChild;
        if (node) node.textContent = label;
    }

    function setPdfNotice(message) {
        elements.pdfNotice.hidden = !message;
        elements.pdfNotice.textContent = message || "";
    }

    function setPdfInteractive(enabled) {
        elements.fitPage.disabled = !enabled;
        elements.zoomOut.disabled = !enabled;
        elements.zoomIn.disabled = !enabled;
        elements.zoomInput.disabled = !enabled;
        elements.pageInput.disabled =
            !enabled || !pdfState.loaded || !pdfState.pages.length;
    }

    function setPdfPageCount(total, current) {
        const pageTotal = Math.max(0, Number(total) || 0);
        const pageCurrent = pageTotal
            ? clamp(Number(current) || 1, 1, pageTotal)
            : 0;
        pdfState.currentPage = pageCurrent;
        elements.pageInput.min = pageTotal ? "1" : "0";
        elements.pageInput.max = String(pageTotal);
        elements.pageInput.value = String(pageCurrent);
        elements.pageCount.textContent = String(pageTotal);
        elements.pageInput.disabled = !pdfState.loaded || !pageTotal;
    }

    function updatePdfPageIndicator() {
        pdfState.pageFrame = null;
        if (!pdfState.pages.length) return;

        const scrollRect = elements.pdfScroll.getBoundingClientRect();
        const readingLine =
            scrollRect.top + Math.min(120, scrollRect.height * 0.2);
        let currentPage = 1;

        pdfState.pages.forEach(function (record) {
            const rect = record.wrapper.getBoundingClientRect();
            if (rect.top <= readingLine) {
                currentPage = record.pageNumber;
            }
        });

        if (currentPage === pdfState.currentPage) return;
        pdfState.currentPage = currentPage;
        if (document.activeElement !== elements.pageInput) {
            elements.pageInput.value = String(currentPage);
        }
    }

    function requestPdfPageIndicatorUpdate() {
        if (pdfState.pageFrame !== null) return;
        pdfState.pageFrame = requestAnimationFrame(updatePdfPageIndicator);
    }

    function goToPdfPage(pageNumber) {
        if (!pdfState.loaded || !pdfState.pages.length) return;
        const targetPage = clamp(
            Math.round(Number(pageNumber) || 1),
            1,
            pdfState.pages.length
        );
        const record = pdfState.pages[targetPage - 1];
        const scrollRect = elements.pdfScroll.getBoundingClientRect();
        const targetTop =
            elements.pdfScroll.scrollTop +
            record.wrapper.getBoundingClientRect().top -
            scrollRect.top -
            16;

        elements.pageInput.value = String(targetPage);
        pdfState.currentPage = targetPage;
        elements.pdfScroll.scrollTo({
            top: Math.max(0, targetTop),
            behavior: "smooth"
        });
        renderPdfPage(record).catch(function () {
            /* The error is reported by renderPdfPage. */
        });
    }

    function commitPageInput() {
        if (!pdfState.loaded) return;
        const value = parseInt(elements.pageInput.value, 10);
        if (!Number.isFinite(value)) {
            elements.pageInput.value = String(pdfState.currentPage);
            return;
        }
        goToPdfPage(value);
    }

    function calculateBaseWidth() {
        const scrollWidth = elements.pdfScroll.clientWidth;
        if (!scrollWidth) return 600;
        const isMobile = window.matchMedia(
            "(max-width: " + MOBILE_READER_BREAKPOINT + "px)"
        ).matches;
        const padding = isMobile ? 16 : 56;
        const fittedWidth = Math.max(
            240,
            Math.min(1120, scrollWidth - padding)
        );
        if (isMobile) {
            return Math.max(240, fittedWidth * MOBILE_DEFAULT_SCALE);
        }
        return Math.max(360, fittedWidth * DESKTOP_DEFAULT_SCALE);
    }

    function getScrollAnchor() {
        const scrollHeight = Math.max(1, elements.pdfPages.scrollHeight);
        const scrollWidth = Math.max(1, elements.pdfPages.scrollWidth);
        return {
            xRatio:
                (elements.pdfScroll.scrollLeft +
                    elements.pdfScroll.clientWidth / 2) /
                scrollWidth,
            yRatio:
                (elements.pdfScroll.scrollTop +
                    elements.pdfScroll.clientHeight / 2) /
                scrollHeight
        };
    }

    function restoreScrollAnchor(anchor) {
        requestAnimationFrame(function () {
            const scrollHeight = elements.pdfPages.scrollHeight;
            const scrollWidth = elements.pdfPages.scrollWidth;
            elements.pdfScroll.scrollTop = clamp(
                anchor.yRatio * scrollHeight - elements.pdfScroll.clientHeight / 2,
                0,
                Math.max(
                    0,
                    scrollHeight - elements.pdfScroll.clientHeight
                )
            );
            elements.pdfScroll.scrollLeft = clamp(
                anchor.xRatio * scrollWidth - elements.pdfScroll.clientWidth / 2,
                0,
                Math.max(0, scrollWidth - elements.pdfScroll.clientWidth)
            );
        });
    }

    function restoreScrollAnchorImmediately(anchor) {
        const scrollHeight = elements.pdfPages.scrollHeight;
        const scrollWidth = elements.pdfPages.scrollWidth;
        elements.pdfScroll.scrollTop = clamp(
            anchor.yRatio * scrollHeight - elements.pdfScroll.clientHeight / 2,
            0,
            Math.max(0, scrollHeight - elements.pdfScroll.clientHeight)
        );
        elements.pdfScroll.scrollLeft = clamp(
            anchor.xRatio * scrollWidth - elements.pdfScroll.clientWidth / 2,
            0,
            Math.max(0, scrollWidth - elements.pdfScroll.clientWidth)
        );
    }

    function layoutPdfPages() {
        if (!pdfState.baseWidth) return;
        const cssWidth = pdfState.baseWidth * pdfState.zoom;
        pdfState.pages.forEach(function (record) {
            record.wrapper.style.width = cssWidth + "px";
            record.wrapper.style.height =
                Math.round(cssWidth * record.aspectRatio) + "px";
        });
    }

    function getPageCanvasSize(record) {
        const cssWidth = pdfState.baseWidth * pdfState.zoom;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        let scale = pixelRatio;
        let width = record.viewport.width * scale;
        let height = record.viewport.height * scale;
        const maxSide = 4096;
        const sideLimit = Math.min(maxSide / width, maxSide / height);
        if (sideLimit < 1) {
            scale *= sideLimit;
            width = record.viewport.width * scale;
            height = record.viewport.height * scale;
        }
        const maxPixels = 12000000;
        const pixelLimit = Math.sqrt(maxPixels / (width * height));
        if (pixelLimit < 1) {
            scale *= pixelLimit;
            width = record.viewport.width * scale;
            height = record.viewport.height * scale;
        }
        const baseScale = cssWidth / record.viewport.width;
        const minimumScale = baseScale;
        scale = Math.max(minimumScale, Math.min(pixelRatio, scale));
        scale = Math.min(
            scale,
            maxSide / record.viewport.width,
            maxSide / record.viewport.height
        );
        return {
            width: Math.max(1, Math.floor(record.viewport.width * scale)),
            height: Math.max(1, Math.floor(record.viewport.height * scale)),
            scale: scale
        };
    }

    async function renderPdfPage(record, force) {
        const size = getPageCanvasSize(record);
        const signature = size.width + "x" + size.height;
        if (!force && record.renderedSignature === signature) return;
        if (!force && record.renderPromise) return record.renderPromise;

        const token = ++record.renderToken;
        if (record.renderTask) {
            try {
                record.renderTask.cancel();
            } catch (error) {
                /* The previous task may already be finished. */
            }
        }

        const canvas = record.canvas;
        canvas.width = size.width;
        canvas.height = size.height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) {
            throw new Error("浏览器无法创建 PDF 画布");
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        record.wrapper.classList.add("is-pending");

        const viewport = record.page.getViewport({ scale: size.scale });
        const task = record.page.render({
            canvasContext: context,
            viewport: viewport
        });
        record.renderTask = task;

        const promise = task.promise
            .then(function () {
                if (token !== record.renderToken) return;
                record.renderedSignature = signature;
                record.wrapper.classList.remove("is-pending");
            })
            .catch(function (error) {
                if (
                    token === record.renderToken &&
                    error?.name !== "RenderingCancelledException"
                ) {
                    record.wrapper.classList.remove("is-pending");
                    setPdfNotice(
                        "PDF 第 " +
                            record.pageNumber +
                            " 页渲染失败：" +
                            (error?.message || String(error))
                    );
                }
            })
            .finally(function () {
                if (record.renderTask === task) {
                    record.renderTask = null;
                }
                if (record.renderPromise === promise) {
                    record.renderPromise = null;
                }
            });

        record.renderPromise = promise;
        return promise;
    }

    function renderNearbyPdfPages() {
        if (!pdfState.pages.length) return;
        const scrollRect = elements.pdfScroll.getBoundingClientRect();
        const margin = 900;
        pdfState.pages.forEach(function (record) {
            const rect = record.wrapper.getBoundingClientRect();
            if (
                rect.bottom >= scrollRect.top - margin &&
                rect.top <= scrollRect.bottom + margin
            ) {
                renderPdfPage(record).catch(function () {
                    /* The error is reported by renderPdfPage. */
                });
            }
        });
    }

    function cancelPdfZoomAnimation() {
        if (pdfState.zoomFrame !== null) {
            cancelAnimationFrame(pdfState.zoomFrame);
            pdfState.zoomFrame = null;
        }
    }

    function applyPdfZoom(nextZoom, options) {
        if (!pdfState.loaded) return;
        const settings = Object.assign({ preserveAnchor: true }, options || {});
        const anchor = settings.preserveAnchor ? getScrollAnchor() : null;
        const targetZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
        const startZoom = pdfState.zoom;
        const shouldAnimate =
            Math.abs(targetZoom - startZoom) > 0.002 &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        cancelPdfZoomAnimation();
        pdfState.zoomTarget = targetZoom;
        elements.zoomInput.value = String(Math.round(targetZoom * 100));

        if (!shouldAnimate) {
            pdfState.zoom = targetZoom;
            layoutPdfPages();
            if (anchor) restoreScrollAnchorImmediately(anchor);
            requestAnimationFrame(renderNearbyPdfPages);
            return;
        }

        const duration = clamp(
            170 + Math.abs(targetZoom - startZoom) * 90,
            170,
            240
        );
        const startTime = performance.now();

        function animateZoom(now) {
            const progress = clamp((now - startTime) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            pdfState.zoom = startZoom + (targetZoom - startZoom) * eased;
            layoutPdfPages();
            if (anchor) restoreScrollAnchorImmediately(anchor);

            if (progress < 1) {
                pdfState.zoomFrame = requestAnimationFrame(animateZoom);
                return;
            }

            pdfState.zoom = targetZoom;
            pdfState.zoomFrame = null;
            layoutPdfPages();
            if (anchor) restoreScrollAnchorImmediately(anchor);
            elements.zoomInput.value = String(Math.round(targetZoom * 100));
            requestAnimationFrame(renderNearbyPdfPages);
        }

        pdfState.zoomFrame = requestAnimationFrame(animateZoom);
    }

    function fitPdfWidth() {
        applyPdfZoom(1);
        elements.pdfScroll.focus({ preventScroll: true });
    }

    function scrollPdfToTop() {
        elements.pdfScroll.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    function updateBackToTopVisibility() {
        if (!elements.backToTop) return;
        const scrollTop = appState.readerOpen
            ? elements.pdfScroll.scrollTop
            : window.scrollY || document.documentElement.scrollTop || 0;
        elements.backToTop.classList.toggle(
            "is-visible",
            scrollTop > BACK_TO_TOP_THRESHOLD
        );
    }

    function scrollToActiveTop() {
        hideContextMenu();
        if (appState.readerOpen) {
            scrollPdfToTop();
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }

    function bindBackToTopEvents() {
        if (!elements.backToTop) return;
        elements.backToTop.addEventListener("click", scrollToActiveTop);
        window.addEventListener("scroll", updateBackToTopVisibility, {
            passive: true
        });
        elements.pdfScroll.addEventListener(
            "scroll",
            updateBackToTopVisibility,
            { passive: true }
        );
        window.addEventListener("resize", updateBackToTopVisibility);
        updateBackToTopVisibility();
    }

    function commitZoomInput() {
        if (!pdfState.loaded) return;
        const value = parseFloat(elements.zoomInput.value);
        if (!Number.isFinite(value)) {
            elements.zoomInput.value = String(Math.round(pdfState.zoom * 100));
            return;
        }
        applyPdfZoom(value / 100);
    }

    function disconnectPdfObserver() {
        if (pdfState.observer) {
            pdfState.observer.disconnect();
            pdfState.observer = null;
        }
    }

    function clearPdfDocument() {
        cancelPdfZoomAnimation();
        if (pdfState.pageFrame !== null) {
            cancelAnimationFrame(pdfState.pageFrame);
            pdfState.pageFrame = null;
        }
        disconnectPdfObserver();
        pdfState.pages.forEach(function (record) {
            record.renderToken += 1;
            if (record.renderTask) {
                try {
                    record.renderTask.cancel();
                } catch (error) {
                    /* Ignore finished tasks. */
                }
            }
        });
        pdfState.pages = [];
        pdfState.currentPage = 1;
        elements.pdfPages.textContent = "";
        setPdfPageCount(0, 0);
        if (pdfState.doc) {
            pdfState.doc.destroy();
            pdfState.doc = null;
        }
        pdfState.loaded = false;
        pdfState.source = "";
        setPdfInteractive(false);
    }

    async function buildPdfPages(doc, token) {
        const records = [];
        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
            const page = await doc.getPage(pageNumber);
            if (token !== pdfState.loadToken) return [];
            const viewport = page.getViewport({ scale: 1 });
            const wrapper = document.createElement("div");
            wrapper.className = "pdf-page is-pending";
            wrapper.dataset.pageNumber = String(pageNumber);
            wrapper.setAttribute("role", "img");
            wrapper.setAttribute(
                "aria-label",
                "PDF 第 " + pageNumber + " 页"
            );
            const canvas = document.createElement("canvas");
            canvas.setAttribute("aria-hidden", "true");
            wrapper.appendChild(canvas);
            records.push({
                pageNumber: pageNumber,
                page: page,
                viewport: viewport,
                aspectRatio: viewport.height / viewport.width,
                wrapper: wrapper,
                canvas: canvas,
                renderedSignature: "",
                renderToken: 0,
                renderTask: null,
                renderPromise: null
            });
            if (pageNumber % 3 === 0 || pageNumber === doc.numPages) {
                setPdfLoading(
                    true,
                    "正在准备页面 " + pageNumber + " / " + doc.numPages
                );
            }
        }

        if (token !== pdfState.loadToken) return [];
        const fragment = document.createDocumentFragment();
        records.forEach(function (record) {
            fragment.appendChild(record.wrapper);
        });
        elements.pdfPages.appendChild(fragment);
        pdfState.pages = records;
        setPdfPageCount(records.length, 1);
        layoutPdfPages();

        if ("IntersectionObserver" in window) {
            pdfState.observer = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) return;
                        const record = records.find(function (item) {
                            return item.wrapper === entry.target;
                        });
                        if (!record) return;
                        renderPdfPage(record).catch(function () {
                            /* The error is reported by renderPdfPage. */
                        });
                    });
                },
                {
                    root: elements.pdfScroll,
                    rootMargin: "900px 0px"
                }
            );
            records.forEach(function (record) {
                pdfState.observer.observe(record.wrapper);
            });
        } else {
            records.forEach(function (record) {
                renderPdfPage(record).catch(function () {
                    /* The error is reported by renderPdfPage. */
                });
            });
        }
        return records;
    }

    async function loadPdf(source) {
        const resolvedSource = resolveUrl(source);
        setPdfNotice("");

        if (
            pdfState.doc &&
            pdfState.source === resolvedSource &&
            pdfState.loaded
        ) {
            setPdfLoading(false);
            pdfState.baseWidth = calculateBaseWidth();
            pdfState.zoom = 1;
            pdfState.zoomTarget = 1;
            elements.zoomInput.value = "100";
            setPdfPageCount(pdfState.pages.length, 1);
            layoutPdfPages();
            elements.pdfScroll.scrollTop = 0;
            elements.pdfScroll.scrollLeft = 0;
            renderNearbyPdfPages();
            elements.pdfScroll.focus({ preventScroll: true });
            return;
        }

        const token = ++pdfState.loadToken;
        clearPdfDocument();
        setPdfLoading(true, "正在载入 PDF");
        setPdfInteractive(false);
        elements.pdfScroll.scrollTop = 0;
        elements.pdfScroll.scrollLeft = 0;

        try {
            const pdfjsLib = await loadPdfLibrary();
            if (token !== pdfState.loadToken) return;
            const doc = await pdfjsLib.getDocument({ url: resolvedSource })
                .promise;
            if (token !== pdfState.loadToken) {
                doc.destroy();
                return;
            }

            pdfState.doc = doc;
            pdfState.source = resolvedSource;
            pdfState.baseWidth = calculateBaseWidth();
            pdfState.zoom = 1;
            pdfState.zoomTarget = 1;
            elements.zoomInput.value = "100";

            const records = await buildPdfPages(doc, token);
            if (token !== pdfState.loadToken || !records.length) {
                return;
            }

            await renderPdfPage(records[0], true);
            if (token !== pdfState.loadToken) return;

            pdfState.loaded = true;
            setPdfInteractive(true);
            setPdfLoading(false);
            elements.pdfScroll.scrollTop = 0;
            elements.pdfScroll.focus({ preventScroll: true });
            requestAnimationFrame(renderNearbyPdfPages);
        } catch (error) {
            if (token !== pdfState.loadToken) return;
            setPdfInteractive(false);
            setPdfLoading(false);
            setPdfNotice(
                "PDF 加载失败：" +
                    (error?.message || String(error)) +
                    "。可直接打开原文件查看。"
            );
        }
    }

    function handlePdfResize() {
        clearTimeout(pdfState.resizeTimer);
        pdfState.resizeTimer = setTimeout(function () {
            if (!appState.readerOpen || !pdfState.loaded) return;
            const nextWidth = calculateBaseWidth();
            if (Math.abs(nextWidth - pdfState.baseWidth) < 1) return;
            const anchor = getScrollAnchor();
            cancelPdfZoomAnimation();
            pdfState.zoom = pdfState.zoomTarget;
            pdfState.baseWidth = nextWidth;
            layoutPdfPages();
            restoreScrollAnchor(anchor);
            requestAnimationFrame(renderNearbyPdfPages);
        }, 140);
    }

    function bindPdfEvents() {
        elements.readerBack.addEventListener("click", function () {
            closeReader({ updateHash: true, restoreFocus: true });
        });

        elements.fitPage.addEventListener("click", fitPdfWidth);
        elements.zoomIn.addEventListener("click", function () {
            applyPdfZoom(pdfState.zoom * 1.2);
        });
        elements.zoomOut.addEventListener("click", function () {
            applyPdfZoom(pdfState.zoom / 1.2);
        });
        elements.zoomInput.addEventListener("change", commitZoomInput);
        elements.zoomInput.addEventListener("blur", commitZoomInput);
        elements.zoomInput.addEventListener("keydown", function (event) {
            if (event.key !== "Enter") return;
            event.preventDefault();
            commitZoomInput();
            elements.zoomInput.blur();
        });

        elements.pageInput.addEventListener("change", commitPageInput);
        elements.pageInput.addEventListener("blur", commitPageInput);
        elements.pageInput.addEventListener("keydown", function (event) {
            if (event.key !== "Enter") return;
            event.preventDefault();
            commitPageInput();
            elements.pageInput.blur();
        });

        elements.pdfScroll.addEventListener(
            "scroll",
            requestPdfPageIndicatorUpdate,
            { passive: true }
        );

        elements.pdfScroll.addEventListener(
            "wheel",
            function (event) {
                if (!event.ctrlKey || !pdfState.loaded) return;
                event.preventDefault();
                applyPdfZoom(
                    pdfState.zoom * (event.deltaY < 0 ? 1.12 : 0.89)
                );
            },
            { passive: false }
        );

        if ("ResizeObserver" in window) {
            resizeObserver = new ResizeObserver(handlePdfResize);
            resizeObserver.observe(elements.pdfScroll);
        } else {
            window.addEventListener("resize", handlePdfResize);
        }

        setPdfInteractive(false);
    }

    function copyTextToClipboard(text) {
        if (!text) return;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).catch(function () {
                /* Ignore clipboard permission errors. */
            });
            return;
        }
        const helper = document.createElement("textarea");
        helper.value = text;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        try {
            document.execCommand("copy");
        } catch (error) {
            /* Ignore legacy clipboard errors. */
        }
        helper.remove();
    }

    function hideContextMenu() {
        elements.contextMenu.classList.remove("is-open");
        elements.contextMenu.setAttribute("aria-hidden", "true");
    }

    function appendContextGroup(fragment, items, addDivider) {
        if (!items.length) return addDivider;
        if (addDivider) {
            const divider = document.createElement("div");
            divider.className = "context-menu__divider";
            divider.setAttribute("role", "separator");
            fragment.appendChild(divider);
        }
        items.forEach(function (item) {
            const button = document.createElement("button");
            button.type = "button";
            button.setAttribute("role", "menuitem");
            button.dataset.contextAction = item.action;
            button.textContent = item.label;
            fragment.appendChild(button);
        });
        return true;
    }

    function showContextMenu(event) {
        hideContextMenu();
        const target = event.target;
        const anchor = target.closest?.("a[href]") || null;
        const selectedText = window.getSelection()
            ? window.getSelection().toString().trim()
            : "";
        const onProfile = Boolean(target.closest?.(".profile-card"));
        const onPdf = Boolean(target.closest?.(".pdf-scroll"));
        const topItems = [];
        const pdfItems = [];
        const profileItems = [];
        const navigationItems = [];

        contextLinkHref = anchor ? anchor.href : "";
        contextLinkTarget = anchor ? anchor.target : "";
        contextPdfActive = onPdf;
        contextProfileActive = onProfile;

        if (anchor) {
            topItems.push({ action: "open-link", label: "打开链接" });
        }
        if (selectedText) {
            topItems.push({
                action: "copy-selection",
                label: "复制选中文字"
            });
        }
        if (onPdf) {
            if (pdfState.loaded) {
                pdfItems.push({ action: "pdf-fit", label: "恢复大小" });
                pdfItems.push({ action: "pdf-top", label: "回到顶端" });
            }
            pdfItems.push({
                action: "pdf-open-original",
                label: "打开原始 PDF"
            });
        }
        if (onProfile) {
            const collapsed =
                elements.profileCard?.classList.contains("is-collapsed");
            profileItems.push({
                action: "toggle-profile",
                label: collapsed ? "展开窗口" : "折叠窗口"
            });
            profileItems.push({
                action: "reset-profile",
                label: "重置位置"
            });
        }
        if (appState.readerOpen) {
            navigationItems.push({
                action: "close-reader",
                label: "回到首页"
            });
        } else if (window.scrollY > 120) {
            navigationItems.push({
                action: "back-to-top",
                label: "回到顶端"
            });
        }
        navigationItems.push({ action: "refresh-page", label: "刷新页面" });

        const fragment = document.createDocumentFragment();
        let hasGroup = false;
        hasGroup = appendContextGroup(fragment, topItems, hasGroup);
        hasGroup = appendContextGroup(fragment, pdfItems, hasGroup);
        hasGroup = appendContextGroup(fragment, profileItems, hasGroup);
        appendContextGroup(fragment, navigationItems, hasGroup);
        elements.contextMenu.textContent = "";
        elements.contextMenu.appendChild(fragment);
        elements.contextMenu.classList.add("is-open");
        elements.contextMenu.setAttribute("aria-hidden", "false");

        const rect = elements.contextMenu.getBoundingClientRect();
        const margin = 4;
        const left = clamp(
            event.clientX,
            margin,
            window.innerWidth - rect.width - margin
        );
        const top = clamp(
            event.clientY,
            margin,
            window.innerHeight - rect.height - margin
        );
        elements.contextMenu.style.left = left + "px";
        elements.contextMenu.style.top = top + "px";
    }

    function runContextMenuAction(action) {
        if (action === "open-link") {
            const href = contextLinkHref;
            const target = contextLinkTarget;
            hideContextMenu();
            if (!href) return;
            if (target && target !== "_self") {
                window.open(href, target, "noopener");
            } else {
                window.location.href = href;
            }
            return;
        }
        if (action === "copy-selection") {
            const selection = window.getSelection()
                ? window.getSelection().toString().trim()
                : "";
            copyTextToClipboard(selection);
            hideContextMenu();
            return;
        }
        if (action === "pdf-fit") {
            hideContextMenu();
            if (!contextPdfActive) return;
            fitPdfWidth();
            return;
        }
        if (action === "pdf-top") {
            hideContextMenu();
            if (!contextPdfActive) return;
            scrollPdfToTop();
            return;
        }
        if (action === "pdf-open-original") {
            hideContextMenu();
            if (!contextPdfActive) return;
            window.open(elements.openPdf.href, "_blank", "noopener");
            return;
        }
        if (action === "toggle-profile") {
            hideContextMenu();
            if (!contextProfileActive) return;
            toggleProfileCollapsed();
            return;
        }
        if (action === "reset-profile") {
            hideContextMenu();
            if (!contextProfileActive) return;
            resetProfilePosition();
            return;
        }
        if (action === "close-reader") {
            hideContextMenu();
            closeReader({ updateHash: true, restoreFocus: true });
            return;
        }
        if (action === "back-to-top") {
            hideContextMenu();
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        if (action === "refresh-page") {
            hideContextMenu();
            window.location.reload();
        }
    }

    function bindContextMenuEvents() {
        elements.contextMenu.addEventListener("click", function (event) {
            const button = event.target.closest("[data-context-action]");
            if (!button) return;
            runContextMenuAction(button.dataset.contextAction);
        });

        document.addEventListener("contextmenu", function (event) {
            event.preventDefault();
            showContextMenu(event);
        });

        if (window.matchMedia("(pointer: coarse)").matches) {
            document.addEventListener("dblclick", function (event) {
                event.preventDefault();
                showContextMenu(event);
            });
        }

        document.addEventListener(
            "pointerdown",
            function (event) {
                if (!elements.contextMenu.classList.contains("is-open")) {
                    return;
                }
                if (!elements.contextMenu.contains(event.target)) {
                    hideContextMenu();
                }
            },
            true
        );

        document.addEventListener(
            "pointerdown",
            function (event) {
                if (event.pointerType === "mouse" && event.button !== 0) {
                    return;
                }
                if (event.target.closest?.(".context-menu")) return;
                const selection = window.getSelection();
                if (selection && !selection.isCollapsed) {
                    selection.removeAllRanges();
                }
            },
            true
        );

        document.addEventListener("wheel", hideContextMenu, {
            passive: true,
            capture: true
        });
        document.addEventListener("scroll", hideContextMenu, true);
        window.addEventListener("blur", hideContextMenu);
        window.addEventListener("resize", function () {
            hideContextMenu();
            clampProfilePosition();
        });
    }

    function bindGlobalEvents() {
        window.addEventListener("hashchange", syncRoute);

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                if (elements.contextMenu.classList.contains("is-open")) {
                    hideContextMenu();
                    return;
                }
                if (appState.readerOpen) {
                    closeReader({ updateHash: true, restoreFocus: true });
                }
                return;
            }

            if (!appState.readerOpen) return;
            const target = event.target;
            const typing =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target?.isContentEditable;
            if (typing || !pdfState.loaded) return;

            if (event.key === "+" || event.key === "=") {
                event.preventDefault();
                applyPdfZoom(pdfState.zoom * 1.15);
            } else if (event.key === "-") {
                event.preventDefault();
                applyPdfZoom(pdfState.zoom / 1.15);
            } else if (event.key === "0") {
                event.preventDefault();
                fitPdfWidth();
            }
        });
    }

    async function init() {
        bindGlobalEvents();
        bindBackToTopEvents();
        bindProfileEvents();
        bindPdfEvents();
        bindContextMenuEvents();
        await loadCases();
        syncRoute();
    }

    init();
})();
