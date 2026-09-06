(async function () {
    const scroller = document.querySelector('.entries');
    const topHint = document.querySelector('.scroll-hint--top');
    const bottomHint = document.querySelector('.scroll-hint--bottom');
    const mobileQuery = window.matchMedia('(max-width: 860px)');

    document.addEventListener('dragstart', function (event) {
        if (event.target && event.target.tagName === 'IMG') {
            event.preventDefault();
        }
    });

    /*
        每个作品：
        label    -> 折叠大标题文字（同时用于展开面板顶栏标题）
        meta     -> 折叠栏副信息
        cover    -> 可选：折叠封面图
        stage    -> 可选：展开内容文件（每个作品一个 HTML）
        logo     -> 可选：透明标题 logo；填了以后 label 位置显示图片
        logoStyle-> 可选：给该作品 logo 单独微调的行内 CSS
    */
    const works = await fetch('works.json').then(function (response) {
        if (!response.ok) {
            throw new Error('works.json 加载失败');
        }
        return response.json();
    });

    function makeNode(tag, className) {
        const node = document.createElement(tag);
        node.className = className;
        return node;
    }

    function bindIntroVideos(root) {
        root.querySelectorAll('.intro__video').forEach(function (container) {
            const video = container.querySelector('video');
            if (!video || video.dataset.videoBound) return;
            video.dataset.videoBound = 'true';
            video.muted = true;

            const playButton = container.querySelector('.intro__video__play');
            const progress = container.querySelector('.intro__video__progress');
            const fullscreenButton = container.querySelector('.intro__video__fullscreen');
            let hideControlsTimer = null;

            function showControls() {
                container.classList.remove('hide-controls');
                container.classList.add('show-controls');
                clearTimeout(hideControlsTimer);
                if (document.fullscreenElement === container && !video.paused) {
                    hideControlsTimer = setTimeout(function () {
                        container.classList.add('hide-controls');
                    }, 2200);
                }
            }

            function leaveVideo() {
                clearTimeout(hideControlsTimer);
                container.classList.remove('show-controls');
            }

            function isVideoFullscreen() {
                return document.fullscreenElement === video
                    || document.fullscreenElement === container
                    || !!(video.webkitDisplayingFullscreen);
            }

            function syncFullscreenUI() {
                const active = isVideoFullscreen();
                container.classList.toggle('in-fullscreen', active);
                if (fullscreenButton) {
                    fullscreenButton.classList.toggle('is-fullscreen', active);
                }
                if (active) {
                    showControls();
                } else {
                    video.removeAttribute('controls');
                    leaveVideo();
                }
            }

            function syncProgress() {
                if (!progress || !isFinite(video.duration)) return;
                progress.value = String(Math.floor(video.currentTime / video.duration * 1000));
            }

            function syncPlayState() {
                if (playButton) {
                    playButton.classList.toggle('is-playing', !video.paused);
                    playButton.setAttribute('aria-label', video.paused ? '播放' : '暂停');
                }
            }

            video.addEventListener('loadedmetadata', syncProgress);
            video.addEventListener('timeupdate', syncProgress);
            video.addEventListener('play', function () {
                showControls();
                syncPlayState();
            });
            video.addEventListener('pause', function () {
                container.classList.remove('hide-controls');
                container.classList.add('show-controls');
                syncPlayState();
            });
            video.addEventListener('ended', function () {
                video.currentTime = 0;
                syncProgress();
                syncPlayState();
            });
            video.addEventListener('click', function () {
                video.muted = true;
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            });

            container.addEventListener('pointermove', showControls);
            container.addEventListener('pointerleave', leaveVideo);

            container.addEventListener('fullscreenchange', syncFullscreenUI);
            video.addEventListener('fullscreenchange', syncFullscreenUI);
            video.addEventListener('webkitbeginfullscreen', syncFullscreenUI);
            video.addEventListener('webkitendfullscreen', syncFullscreenUI);

            if (playButton) {
                playButton.addEventListener('click', function () {
                    video.muted = true;
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                });
            }

            if (progress) {
                progress.addEventListener('input', function () {
                    if (!isFinite(video.duration)) return;
                    video.currentTime = video.duration * Number(progress.value) / 1000;
                });
            }

            if (fullscreenButton) {
                fullscreenButton.addEventListener('click', function () {
                    const isMobile = mobileQuery.matches
                        || /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);

                    function requestNativeVideoFullscreen() {
                        video.setAttribute('controls', '');
                        try {
                            if (video.webkitEnterFullscreen) {
                                video.webkitEnterFullscreen();
                                return;
                            }
                            if (video.requestFullscreen) {
                                const promise = video.requestFullscreen();
                                if (promise && typeof promise.catch === 'function') {
                                    promise.catch(function () {
                                        video.removeAttribute('controls');
                                    });
                                }
                                return;
                            }
                        } catch (error) {
                            video.removeAttribute('controls');
                        }
                        if (container.requestFullscreen) {
                            container.requestFullscreen();
                        }
                    }

                    if (isVideoFullscreen()) {
                        if (video.webkitExitFullscreen) {
                            video.webkitExitFullscreen();
                        } else if (document.exitFullscreen) {
                            document.exitFullscreen();
                        }
                    } else if (isMobile && (video.webkitEnterFullscreen || video.requestFullscreen)) {
                        requestNativeVideoFullscreen();
                    } else if (container.requestFullscreen) {
                        container.requestFullscreen();
                    } else if (video.requestFullscreen) {
                        video.requestFullscreen();
                    }
                });
            }
        });
    }

    /* ===== Mermaid 思维导图组件 =====
        需要自定义配色/字体时，直接改 MERMAID_THEME 里的值即可。 */
    const MERMAID_CDN = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
    const MERMAID_THEME = {
        theme: "dark",
        themeVariables: {
            background: "#0b0d10",
            primaryColor: "#1e242c",
            primaryBorderColor: "#56697e",
            primaryTextColor: "#f2f2f2",
            secondaryColor: "#161a20",
            secondaryBorderColor: "#3d4a58",
            secondaryTextColor: "#d7dde5",
            tertiaryColor: "#232933",
            tertiaryTextColor: "#e8ebef",
            lineColor: "#728196",
            fontFamily: "'Roboto Condensed', 'Noto Sans SC', sans-serif",
            fontSize: "14px"
        }
    };
    let mermaidLibraryPromise = null;
    const mermaidWidgetStates = new WeakMap();
    const mermaidSavedViews = new Map();

    function getMermaidWidgetState(widget) {
        let state = mermaidWidgetStates.get(widget);
        if (!state) {
            state = {
                scale: 1,
                x: 0,
                y: 0,
                contentWidth: 0,
                contentHeight: 0,
                pointers: new Map(),
                pinch: null,
                zoomAnimationFrame: null
            };
            mermaidWidgetStates.set(widget, state);
        }
        return state;
    }

    function loadMermaidLibrary() {
        if (window.mermaid) {
            return Promise.resolve(window.mermaid);
        }
        if (!mermaidLibraryPromise) {
            mermaidLibraryPromise = new Promise(function (resolve, reject) {
                const script = document.createElement("script");
                script.src = MERMAID_CDN;
                script.async = true;
                script.onload = function () {
                    if (window.mermaid) {
                        window.mermaid.initialize(MERMAID_THEME);
                        resolve(window.mermaid);
                    } else {
                        reject(new Error("Mermaid 加载失败"));
                    }
                };
                script.onerror = function () {
                    mermaidLibraryPromise = null;
                    reject(new Error("无法加载 Mermaid 库，请检查网络"));
                };
                document.head.appendChild(script);
            });
        }
        return mermaidLibraryPromise;
    }

    function setMermaidNotice(widget, message) {
        const notice = widget.querySelector(".mermaid-widget__notice");
        if (!notice) return;
        notice.hidden = !message;
        notice.textContent = message || "";
    }

    function getMermaidViewKey(widget) {
        if (widget.dataset.mermaidViewKey) {
            return widget.dataset.mermaidViewKey;
        }
        const source = widget.querySelector(
            'script[type="text/mermaid"], .mermaid-widget__source'
        );
        const text = source ? source.textContent.trim() : "";
        const key = "mermaid:" + text;
        widget.dataset.mermaidViewKey = key;
        return key;
    }

    function clampMermaidScale(scale) {
        return Math.max(0.2, Math.min(4, scale));
    }

    function applyMermaidView(widget, scale, x, y) {
        const state = getMermaidWidgetState(widget);
        const viewport = widget.querySelector(".mermaid-widget__viewport");
        const graph = widget.querySelector(".mermaid-widget__graph");
        const zoomInput = widget.querySelector(".mermaid-widget__zoom-input");
        if (!viewport || !graph || !state.contentWidth) return;

        const viewWidth = viewport.clientWidth;
        const viewHeight = viewport.clientHeight;
        const contentWidth = state.contentWidth * scale;
        const contentHeight = state.contentHeight * scale;

        const minX = Math.min(0, viewWidth - contentWidth);
        const maxX = Math.max(0, viewWidth - contentWidth);
        const minY = Math.min(0, viewHeight - contentHeight);
        const maxY = Math.max(0, viewHeight - contentHeight);

        state.scale = scale;
        state.x = Math.max(minX, Math.min(maxX, x));
        state.y = Math.max(minY, Math.min(maxY, y));

        graph.style.transform =
            "translate(" + state.x + "px, " + state.y + "px) scale(" + state.scale + ")";
        if (zoomInput) {
            zoomInput.value = String(Math.round(state.scale * 100));
        }
        if (state.contentWidth) {
            mermaidSavedViews.set(getMermaidViewKey(widget), {
                scale: state.scale,
                x: state.x,
                y: state.y
            });
        }
    }

    function fitMermaidView(widget) {
        const state = getMermaidWidgetState(widget);
        const viewport = widget.querySelector(".mermaid-widget__viewport");
        if (!viewport || !state.contentWidth) return;
        const padding = 26;
        const viewWidth = Math.max(1, viewport.clientWidth - padding * 2);
        const viewHeight = Math.max(1, viewport.clientHeight - padding * 2);
        const scale = clampMermaidScale(
            Math.min(
                1,
                viewWidth / state.contentWidth,
                viewHeight / state.contentHeight
            )
        );
        const x = (viewport.clientWidth - state.contentWidth * scale) / 2;
        const y = (viewport.clientHeight - state.contentHeight * scale) / 2;
        applyMermaidView(widget, scale, x, y);
    }

    function zoomMermaidAt(widget, factor, clientX, clientY) {
        const state = getMermaidWidgetState(widget);
        const viewport = widget.querySelector(".mermaid-widget__viewport");
        if (!viewport || !state.contentWidth) return;
        const rect = viewport.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;
        const nextScale = clampMermaidScale(state.scale * factor);
        const originX = (px - state.x) / state.scale;
        const originY = (py - state.y) / state.scale;
        applyMermaidView(widget, nextScale, px - originX * nextScale, py - originY * nextScale);
    }

    function animateMermaidTo(widget, targetScale, targetX, targetY) {
        const state = getMermaidWidgetState(widget);
        const viewport = widget.querySelector(".mermaid-widget__viewport");
        if (!viewport || !state.contentWidth) return;
        targetScale = clampMermaidScale(targetScale);
        const startScale = state.scale;
        const startX = state.x;
        const startY = state.y;
        if (
            Math.abs(targetScale - startScale) < 0.001
            && Math.abs(targetX - startX) < 0.5
            && Math.abs(targetY - startY) < 0.5
        ) {
            return;
        }
        const startTime = performance.now();
        const duration = 280;

        if (state.zoomAnimationFrame) {
            cancelAnimationFrame(state.zoomAnimationFrame);
        }

        function frame(now) {
            const raw = Math.min((now - startTime) / duration, 1);
            const eased = raw < 0.5
                ? 4 * raw * raw * raw
                : 1 - Math.pow(-2 * raw + 2, 3) / 2;
            applyMermaidView(
                widget,
                startScale + (targetScale - startScale) * eased,
                startX + (targetX - startX) * eased,
                startY + (targetY - startY) * eased
            );
            if (raw < 1) {
                state.zoomAnimationFrame = requestAnimationFrame(frame);
            } else {
                state.zoomAnimationFrame = null;
            }
        }
        state.zoomAnimationFrame = requestAnimationFrame(frame);
    }

    function animateMermaidZoom(widget, targetScale, clientX, clientY) {
        const state = getMermaidWidgetState(widget);
        const viewport = widget.querySelector(".mermaid-widget__viewport");
        if (!viewport || !state.contentWidth) return;
        targetScale = clampMermaidScale(targetScale);
        const rect = viewport.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;
        const originX = (px - state.x) / state.scale;
        const originY = (py - state.y) / state.scale;
        animateMermaidTo(
            widget,
            targetScale,
            px - originX * targetScale,
            py - originY * targetScale
        );
    }

    function animateMermaidCenter(widget) {
        const state = getMermaidWidgetState(widget);
        const viewport = widget.querySelector(".mermaid-widget__viewport");
        if (!viewport || !state.contentWidth) return;
        const x = (viewport.clientWidth - state.contentWidth * state.scale) / 2;
        const y = (viewport.clientHeight - state.contentHeight * state.scale) / 2;
        animateMermaidTo(widget, state.scale, x, y);
    }

    function measureMermaidSvg(widget) {
        const state = getMermaidWidgetState(widget);
        const graph = widget.querySelector(".mermaid-widget__graph");
        const svg = graph ? graph.querySelector("svg") : null;
        if (!svg) return false;

        svg.removeAttribute("style");
        svg.removeAttribute("width");
        svg.removeAttribute("height");

        let width = 0;
        let height = 0;
        if (svg.viewBox && svg.viewBox.baseVal) {
            width = svg.viewBox.baseVal.width;
            height = svg.viewBox.baseVal.height;
        }
        if ((!width || !height) && svg.getBBox) {
            try {
                const box = svg.getBBox();
                width = width || box.width;
                height = height || box.height;
            } catch (error) {
                /* 有些浏览器在 SVG 未布局前不能取 bbox，下面用 DOM 尺寸兜底 */
            }
        }
        if (!width || !height) {
            graph.style.width = "max-content";
            graph.style.height = "max-content";
            const rect = svg.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
        }
        if (!width || !height) return false;

        state.contentWidth = width;
        state.contentHeight = height;
        graph.style.width = width + "px";
        graph.style.height = height + "px";
        return true;
    }

    function renderMermaidWidget(widget) {
        const sourceElement = widget.querySelector(
            'script[type="text/mermaid"], .mermaid-widget__source'
        );
        const graph = widget.querySelector(".mermaid-widget__graph");
        if (!sourceElement || !graph) return;
        const source = (sourceElement.textContent || "").trim();
        const state = getMermaidWidgetState(widget);
        const viewport = widget.querySelector(".mermaid-widget__viewport");
        let componentLoading = viewport
            ? viewport.querySelector(".component-loading")
            : null;
        if (!componentLoading && viewport) {
            componentLoading = makeNode("div", "component-loading");
            componentLoading.hidden = true;
            viewport.appendChild(componentLoading);
        }

        graph.innerHTML = "";
        state.scale = 1;
        state.x = 0;
        state.y = 0;
        state.contentWidth = 0;
        state.contentHeight = 0;
        state.pointers.clear();
        state.pinch = null;
        if (state.zoomAnimationFrame) {
            cancelAnimationFrame(state.zoomAnimationFrame);
            state.zoomAnimationFrame = null;
        }
        setMermaidNotice(widget, "");

        if (!source) {
            setMermaidNotice(widget, "没有找到 Mermaid 代码");
            return;
        }
        if (componentLoading) {
            componentLoading.hidden = false;
        } else {
            setMermaidNotice(widget, "正在加载 / 渲染…");
        }

        loadMermaidLibrary()
            .then(function (mermaid) {
                const renderId = "mermaid-render-"
                    + Math.random().toString(36).slice(2)
                    + Date.now();
                return mermaid.render(renderId, source);
            })
            .then(function (result) {
                graph.innerHTML = result.svg;
                const svg = graph.querySelector("svg");
                if (svg && result.bindFunctions) {
                    try {
                        result.bindFunctions(svg);
                    } catch (error) {
                        /* 思维导图通常没有交互函数，忽略 */
                    }
                }
                if (!measureMermaidSvg(widget)) {
                    throw new Error("没有渲染出可显示的 SVG");
                }
                setMermaidNotice(widget, "");
                const savedView = mermaidSavedViews.get(
                    getMermaidViewKey(widget)
                );
                if (
                    savedView
                    && isFinite(savedView.scale)
                    && isFinite(savedView.x)
                    && isFinite(savedView.y)
                ) {
                    applyMermaidView(
                        widget,
                        savedView.scale,
                        savedView.x,
                        savedView.y
                    );
                } else {
                    fitMermaidView(widget);
                }
                if (componentLoading) {
                    componentLoading.hidden = true;
                }
            })
            .catch(function (error) {
                if (componentLoading) {
                    componentLoading.hidden = true;
                }
                setMermaidNotice(
                    widget,
                    "渲染失败：" + (error && error.message ? error.message : error)
                );
            });
    }

    function initMermaidWidgets(root) {
        if (!root) return;

        root.querySelectorAll(".intro__mermaid").forEach(function (wrap) {
            if (wrap.dataset.mermaidBound) return;
            const widget = wrap.querySelector(".mermaid-widget");
            if (!widget) return;
            wrap.dataset.mermaidBound = "true";

            const viewport = widget.querySelector(".mermaid-widget__viewport");
            const graph = widget.querySelector(".mermaid-widget__graph");
            const zoomIn = widget.querySelector(".mermaid-widget__zoom-in");
            const zoomOut = widget.querySelector(".mermaid-widget__zoom-out");
            const zoomInput = widget.querySelector(".mermaid-widget__zoom-input");
            const state = getMermaidWidgetState(widget);

            if (zoomIn) {
                zoomIn.addEventListener("click", function () {
                    const rect = viewport.getBoundingClientRect();
                    const stateNow = getMermaidWidgetState(widget);
                    animateMermaidZoom(
                        widget,
                        stateNow.scale * 1.2,
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2
                    );
                });
            }
            if (zoomOut) {
                zoomOut.addEventListener("click", function () {
                    const rect = viewport.getBoundingClientRect();
                    const stateNow = getMermaidWidgetState(widget);
                    animateMermaidZoom(
                        widget,
                        stateNow.scale / 1.2,
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2
                    );
                });
            }

            if (zoomInput) {
                function commitZoomFromInput() {
                    const now = performance.now();
                    const lastCommit = zoomInput.dataset.lastMermaidCommit;
                    if (lastCommit && now - Number(lastCommit) < 200) return;
                    const raw = parseFloat(zoomInput.value);
                    if (!isFinite(raw)) {
                        zoomInput.value = String(
                            Math.round(getMermaidWidgetState(widget).scale * 100)
                        );
                        return;
                    }
                    zoomInput.dataset.lastMermaidCommit = String(now);
                    const rect = viewport.getBoundingClientRect();
                    animateMermaidZoom(
                        widget,
                        raw / 100,
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2
                    );
                }
                zoomInput.addEventListener("keydown", function (event) {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        commitZoomFromInput();
                    }
                });
                zoomInput.addEventListener("change", commitZoomFromInput);
                zoomInput.addEventListener("blur", function () {
                    commitZoomFromInput();
                });
            }

            if (graph) {
                graph.addEventListener("dblclick", function () {
                    fitMermaidView(widget);
                });
            }

            /* 拖拽 / 双指缩放 */
            if (viewport) {
                function pointerPoint(event) {
                    return {
                        x: event.clientX,
                        y: event.clientY
                    };
                }

                viewport.addEventListener("pointerdown", function (event) {
                    if (event.button === 2) return;
                    if (
                        event.target.closest
                        && event.target.closest(".mermaid-widget__zoom")
                    ) {
                        return;
                    }
                    if (!state.contentWidth) return;
                    if (state.pointers.size >= 2) return;
                    if (state.zoomAnimationFrame) {
                        cancelAnimationFrame(state.zoomAnimationFrame);
                        state.zoomAnimationFrame = null;
                    }
                    state.pointers.set(event.pointerId, pointerPoint(event));
                    viewport.classList.add("is-panning");

                    if (state.pointers.size === 2) {
                        const points = Array.from(state.pointers.values());
                        const dx = points[0].x - points[1].x;
                        const dy = points[0].y - points[1].y;
                        const rect = viewport.getBoundingClientRect();
                        state.pinch = {
                            startScale: state.scale,
                            distance: Math.sqrt(dx * dx + dy * dy),
                            startX: state.x,
                            startY: state.y,
                            centerX: (points[0].x + points[1].x) / 2 - rect.left,
                            centerY: (points[0].y + points[1].y) / 2 - rect.top
                        };
                    }
                });

                function pointerMoveHandler(event) {
                    if (!state.pointers.has(event.pointerId)) return;
                    const drag = state.pointers.get(event.pointerId);
                    drag.x = event.clientX;
                    drag.y = event.clientY;
                    event.preventDefault();

                    if (state.pointers.size === 1 && state.pinch === null) {
                        const lastX = drag.lastX === undefined ? drag.x : drag.lastX;
                        const lastY = drag.lastY === undefined ? drag.y : drag.lastY;
                        applyMermaidView(
                            widget,
                            state.scale,
                            state.x + (event.clientX - lastX),
                            state.y + (event.clientY - lastY)
                        );
                        drag.lastX = event.clientX;
                        drag.lastY = event.clientY;
                    } else if (state.pointers.size === 2 && state.pinch) {
                        const points = Array.from(state.pointers.values());
                        const dx = points[0].x - points[1].x;
                        const dy = points[0].y - points[1].y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const rect = viewport.getBoundingClientRect();
                        const centerX = (points[0].x + points[1].x) / 2 - rect.left;
                        const centerY = (points[0].y + points[1].y) / 2 - rect.top;
                        if (state.pinch.distance > 0) {
                            const nextScale = clampMermaidScale(
                                state.pinch.startScale
                                * distance
                                / state.pinch.distance
                            );
                            const originX = (state.pinch.centerX - state.pinch.startX)
                                / state.pinch.startScale;
                            const originY = (state.pinch.centerY - state.pinch.startY)
                                / state.pinch.startScale;
                            applyMermaidView(
                                widget,
                                nextScale,
                                centerX - originX * nextScale,
                                centerY - originY * nextScale
                            );
                        }
                    }
                }
                document.addEventListener("pointermove", pointerMoveHandler);

                function endPointer(event) {
                    if (!state.pointers.has(event.pointerId)) return;
                    state.pointers.delete(event.pointerId);
                    state.pinch = null;
                    if (state.pointers.size === 0) {
                        viewport.classList.remove("is-panning");
                    } else if (state.pointers.size === 1) {
                        const remaining = Array.from(state.pointers.values())[0];
                        remaining.lastX = remaining.x;
                        remaining.lastY = remaining.y;
                    }
                }

                document.addEventListener("pointerup", endPointer);
                document.addEventListener("pointercancel", endPointer);

                viewport.addEventListener("wheel", function (event) {
                    event.preventDefault();
                    if (state.zoomAnimationFrame) {
                        cancelAnimationFrame(state.zoomAnimationFrame);
                        state.zoomAnimationFrame = null;
                    }
                    const rect = viewport.getBoundingClientRect();
                    zoomMermaidAt(
                        widget,
                        event.deltaY < 0 ? 1.12 : 0.88,
                        event.clientX,
                        event.clientY
                    );
                }, { passive: false });
            }

            renderMermaidWidget(widget);
        });
    }

    function loadStageInto(body, stageFile) {
        if (body.dataset.stageLoaded === "true") {
            return Promise.resolve(body);
        }
        if (stageLoadingPromises.has(body)) {
            return stageLoadingPromises.get(body);
        }

        let loader = body.querySelector(".stage-loading");
        if (!loader) {
            loader = makeNode("div", "stage-loading");
            body.appendChild(loader);
        }

        const promise = fetch(stageFile, { cache: "no-store" })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("HTTP " + response.status);
                }
                return response.text();
            })
            .then(function (html) {
                const template = document.createElement("template");
                template.innerHTML = html;
                const stage = template.content.querySelector(".stage");
                if (stage) {
                    body.appendChild(stage);
                } else {
                    body.innerHTML = html;
                }
                body.dataset.stageLoaded = "true";
                if (loader.parentNode === body) {
                    loader.classList.add("is-leaving");
                    setTimeout(function () {
                        loader.remove();
                    }, 380);
                }
                bindIntroVideos(body);
                autoplayIntroVideos(body);
                initMermaidWidgets(body);
                if (window.initModelViewers) {
                    window.initModelViewers(body);
                }
                if (window.initBeltDemo) {
                    window.initBeltDemo(body);
                }
                initParastoneMaps(body);
                initStageIntroBackButtons(body);
                body.querySelectorAll(".stage").forEach(syncEyebrowsFromTabs);
            })
            .catch(function (error) {
                if (loader.parentNode === body) {
                    loader.remove();
                }
                const placeholder = makeNode("div", "placeholder");
                const note = makeNode("p", "placeholder__note");
                note.textContent = "stage 文件加载失败：" + stageFile
                    + (error && error.message ? "（" + error.message + "）" : "");
                placeholder.appendChild(note);
                body.appendChild(placeholder);
            });
        stageLoadingPromises.set(body, promise);
        return promise;
    }

    function makeWorkElement(work, index) {
        const article = makeNode('article', 'entry');
        if (work.direct) {
            article.classList.add('entry--direct');
            const stageHost = makeNode('div', 'panel__body panel__body--stage');
            if (work.stage) {
                stageHost.dataset.stageFile = work.stage;
                stageHost.appendChild(makeNode('div', 'stage-loading'));
                loadStageInto(stageHost, work.stage);
            } else {
                const placeholder = makeNode('div', 'placeholder');
                const note = makeNode('p', 'placeholder__note');
                note.textContent = '这个位置还空着';
                placeholder.appendChild(note);
                stageHost.appendChild(placeholder);
            }
            article.appendChild(stageHost);
            return article;
        }
        if (work.cover) {
            article.style.setProperty('--title-bg', 'url("' + work.cover + '")');
        }

        const panelId = 'panel-' + (index + 1);

        /* ---- 折叠状态的大标题块 ---- */
        const titleButton = makeNode('button', 'entry__title');
        titleButton.type = 'button';
        titleButton.dataset.toggle = '';
        titleButton.setAttribute('aria-expanded', 'false');
        titleButton.setAttribute('aria-controls', panelId);

        const titleBg = makeNode('span', 'entry__title-bg');
        titleBg.setAttribute('aria-hidden', 'true');

        const labelSpan = makeNode('span', 'entry__label');
        if (work.logo) {
            labelSpan.classList.add('entry__label--logo');
            const logoImg = document.createElement('img');
            logoImg.src = work.logo;
            logoImg.alt = work.label || '';
            if (work.logoStyle) {
                logoImg.style.cssText = work.logoStyle;
            }
            labelSpan.appendChild(logoImg);
        } else {
            labelSpan.textContent = work.label;
        }
        if (work.status) {
            labelSpan.setAttribute('data-status', work.status);
        }
        const metaSpan = makeNode('span', 'entry__meta');
        metaSpan.textContent = work.meta;

        titleButton.append(
            titleBg,
            makeNode('span', 'entry__num'),
            labelSpan,
            metaSpan
        );
        article.appendChild(titleButton);

        /* ---- 展开后的面板 ---- */
        const panel = makeNode('div', 'entry__panel');
        panel.id = panelId;
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-hidden', 'true');

        const inner = makeNode('div', 'panel__inner');

        const bar = makeNode('header', 'panel__bar');
        const barBg = makeNode('div', 'panel__bar-bg');
        barBg.setAttribute('aria-hidden', 'true');

        const toggle = makeNode('button', 'panel__toggle');
        toggle.type = 'button';
        toggle.dataset.toggle = '';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', panelId);

        const panelTitle = makeNode('span', 'panel__title');
        panelTitle.append(
            makeNode('span', 'panel__num'),
            makeNode('span', 'panel__title-text')
        );
        toggle.append(panelTitle, makeNode('span', 'panel__hint'));

        bar.append(barBg, toggle);
        inner.appendChild(bar);

        const body = makeNode('div', 'panel__body');
        if (work.stage) {
            /* 每个作品独立一个 stage HTML，点击展开后再加载 */
            body.classList.add('panel__body--stage');
            body.dataset.stageFile = work.stage;
            body.appendChild(makeNode('div', 'stage-loading'));
        } else {
            /* 空分栏：自动生成占位内容 */
            const placeholder = makeNode('div', 'placeholder');
            const phNum = makeNode('p', 'placeholder__num');
            const phTitle = makeNode('h2', 'placeholder__title');
            phTitle.textContent = '这个位置还空着';
            const phNote = makeNode('p', 'placeholder__note');
            phNote.textContent = '等想好要展示什么，再把它放进来。';
            placeholder.append(phNum, phTitle, phNote);
            body.appendChild(placeholder);
        }

        inner.appendChild(body);
        panel.appendChild(inner);
        article.appendChild(panel);

        return article;
    }

    const CLOSE_ANIMATION_MS = 460;
    const SWITCH_ANIMATION_MS = 720;
    const TAB_SWITCH_ANIMATION_MS = 300;
    const WHEEL_THRESHOLD = 8;
    const WHEEL_GESTURE_GAP_MS = 260;
    let unlockTimer = null;
    let profileReady = false;
    let profileSectionDirect = null;
    let profileSectionTimer = null;
    let profileSyncTimer = null;
    let switchAnimating = false;
    let activeIndex = 0;
    let wheelAccumulated = 0;
    let wheelLockUntil = 0;
    let wheelGesturedRecently = false;
    let wheelGestureIdleTimer = null;
    const entryFrameTimers = new WeakMap();
    const videoResetTimers = new WeakMap();
    const stageLoadingPromises = new WeakMap();

    const renderedEntries = new Array(works.length).fill(null);
    const entrySlots = [];

    function clampSectionIndex(index) {
        return Math.max(0, Math.min(works.length - 1, index));
    }

    function initEntry(entry, index) {
        const num = String(index + 1).padStart(2, '0');
        const work = works[index];
        const panelTitleText = entry.querySelector('.panel__title-text');
        if (panelTitleText) {
            panelTitleText.textContent = work.label;
        }
        entry.querySelectorAll('.stage').forEach(syncEyebrowsFromTabs);
        entry.querySelectorAll('.entry__num, .panel__num, .placeholder__num')
            .forEach(function (el) {
                el.textContent = num;
            });
    }

    function syncEyebrowsFromTabs(stage) {
        stage.querySelectorAll('.stage__intro[data-intro]').forEach(function (intro) {
            const matchingTab = stage.querySelector(
                '.stage__tab[data-intro="' + intro.dataset.intro + '"]'
            );
            if (matchingTab) {
                intro.querySelectorAll('.intro__eyebrow').forEach(function (eyebrow) {
                    eyebrow.textContent = matchingTab.textContent.trim();
                });
            }
        });
    }

    function resetCarouselsIn(container) {
        container.querySelectorAll('.intro__carousel').forEach(function (carousel) {
            const slides = Array.from(
                carousel.querySelectorAll('.intro__carousel__slide')
            );
            carousel.classList.add('instant-switch');
            slides.forEach(function (slide, index) {
                slide.classList.toggle('is-active', index === 0);
            });
            setTimeout(function () {
                carousel.classList.remove('instant-switch');
            }, 40);
        });
    }

    function resetVideosIn(container) {
        container.querySelectorAll('video').forEach(function (video) {
            video.muted = true;
            video.pause();
            video.currentTime = 0;
            const player = video.closest('.intro__video');
            if (player) {
                const playButton = player.querySelector('.intro__video__play');
                const progress = player.querySelector('.intro__video__progress');
                if (playButton) {
                    playButton.classList.remove('is-playing');
                    playButton.setAttribute('aria-label', '播放');
                }
                if (progress) {
                    progress.value = '0';
                }
            }
        });
    }

    function autoplayIntroVideos(root) {
        if (!root) return;
        root.querySelectorAll('video').forEach(function (video) {
            const player = video.closest('.intro__video');
            if (player && player.hidden) return;
            const intro = video.closest('.stage__intro');
            if (intro && !intro.classList.contains('is-active')) return;
            video.muted = true;
            const playPromise = video.play();
            if (playPromise && playPromise.catch) {
                playPromise.catch(function () {
                    /* 自动播放被浏览器拦截时静默处理 */
                });
            }
        });
    }

    function resetMediaIntros(container) {
        if (!container) return;
        container.querySelectorAll('.stage__intro--media').forEach(function (intro) {
            intro.classList.remove('is-open');
            const button = intro.querySelector('.intro__media-btn');
            if (button) {
                button.setAttribute('aria-expanded', 'false');
            }
            const content = intro.querySelector('.intro__content');
            if (content) {
                content.scrollTop = 0;
            }
        });
    }

    /* 分页切换时，让被切走的页面里的视频先播完过渡动画，
        等页面完全离开后再暂停并回到开头。 */
    function scheduleIntroVideoReset(intro) {
        const pendingTimer = videoResetTimers.get(intro);
        if (pendingTimer) {
            clearTimeout(pendingTimer);
        }
        if (mobileQuery.matches) {
            resetVideosIn(intro);
            return;
        }
        videoResetTimers.set(intro, setTimeout(function () {
            videoResetTimers.delete(intro);
            if (!intro.classList.contains('is-active')) {
                resetVideosIn(intro);
            }
        }, TAB_SWITCH_ANIMATION_MS));
    }

    function makeSlot() {
        const slot = document.createElement('div');
        slot.className = 'entry-slot';
        return slot;
    }

    for (let index = 0; index < works.length; index++) {
        const slot = makeSlot();
        scroller.appendChild(slot);
        entrySlots[index] = slot;
    }

    function renderEntryIndex(index) {
        if (renderedEntries[index]) return;
        const entry = makeWorkElement(works[index], index);
        initEntry(entry, index);
        entrySlots[index].replaceWith(entry);
        renderedEntries[index] = entry;
    }

    function disposeEntryIndex(index) {
        const entry = renderedEntries[index];
        if (!entry) return;
        const slot = makeSlot();
        entry.replaceWith(slot);
        entrySlots[index] = slot;
        renderedEntries[index] = null;
    }

    /* 只渲染当前分栏及前后相邻两个，其余保持占位，滚动/切换时再补 */
    function renderRange(center) {
        const start = clampSectionIndex(center - 1);
        const end = clampSectionIndex(center + 1);
        for (let index = 0; index < works.length; index++) {
            if (index >= start && index <= end) {
                renderEntryIndex(index);
            } else {
                disposeEntryIndex(index);
            }
        }
        activeIndex = center;
        updateScrollHints();
        syncProfileWithActiveSection();
    }

    function updateScrollHints() {
        const hasOpenEntry = Boolean(document.querySelector('.entry.is-open'));
        const isDirect = Boolean(
            works[activeIndex] && works[activeIndex].direct
        );
        const canGoUp = !hasOpenEntry && !isDirect && activeIndex > 0;
        const canGoDown = !hasOpenEntry && !isDirect && activeIndex < works.length - 1;
        if (topHint) {
            topHint.classList.toggle('is-visible', canGoUp);
        }
        if (bottomHint) {
            bottomHint.classList.toggle('is-visible', canGoDown);
        }
    }

    function syncProfileWithActiveSection() {
        if (!profileReady) return;
        if (document.querySelector('.entry.is-open')) return;
        const isDirect = Boolean(
            works[activeIndex] && works[activeIndex].direct
        );
        if (isDirect === profileSectionDirect) return;
        profileSectionDirect = isDirect;
        clearTimeout(profileSectionTimer);
        setProfileCovered(isDirect);
        profileSectionTimer = setTimeout(function () {
            profileSectionTimer = null;
            if (
                profileSectionDirect !== isDirect
                || document.querySelector('.entry.is-open')
            ) {
                return;
            }
            setProfileCollapsed(true);
            resetProfilePosition();
        }, 360);
    }

    function scheduleProfileSync() {
        if (!profileReady) return;
        clearTimeout(profileSyncTimer);
        profileSyncTimer = setTimeout(function () {
            profileSyncTimer = null;
            syncProfileWithActiveSection();
        }, 180);
    }

    function sectionIndexFromScroll() {
        const step = scroller.clientHeight || 1;
        return clampSectionIndex(Math.round(scroller.scrollTop / step));
    }

    /* 滚轮/触控板的连续输入算成同一次手势：
        切换后要等动画结束、且输入安静一段时间才允许下一次切换，
        这样 Mac 触控板惯性滚动不会连续切好几个分栏。 */
    function noteWheelGesture() {
        wheelGesturedRecently = true;
        clearTimeout(wheelGestureIdleTimer);
        wheelGestureIdleTimer = setTimeout(function () {
            wheelGesturedRecently = false;
            if (!switchAnimating) {
                wheelLockUntil = 0;
            }
        }, WHEEL_GESTURE_GAP_MS);
    }

    function scrollToEntryIndex(targetIndex) {
        targetIndex = clampSectionIndex(targetIndex);
        const step = scroller.clientHeight || 1;
        const targetTop = targetIndex * step;
        const startTop = scroller.scrollTop;
        const distance = targetTop - startTop;
        if (Math.abs(distance) < 1) {
            return;
        }

        scroller.classList.add('no-snap');
        switchAnimating = true;
        const startTime = performance.now();

        function frame(now) {
            const progress = Math.min((now - startTime) / SWITCH_ANIMATION_MS, 1);
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            scroller.scrollTop = startTop + distance * eased;

            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                scroller.scrollTop = targetTop;
                switchAnimating = false;
                activeIndex = targetIndex;
                scroller.classList.remove('no-snap');
                if (!wheelGesturedRecently) {
                    wheelLockUntil = 0;
                }
            }
        }
        requestAnimationFrame(frame);
    }

    renderRange(0);

    (function hideInitialPageLoader() {
        const loader = document.querySelector(".page-loading");
        if (!loader) return;
        const startedAt = Date.now();

        function finish() {
            if (!loader.isConnected) return;
            loader.classList.add("is-leaving");
            setTimeout(function () {
                loader.remove();
            }, 450);
        }

        const firstTitle = document.querySelector(
            ".entry:not(.entry-slot) .entry__title"
        );
        if (!firstTitle) {
            finish();
            return;
        }

        function waitForImage(image) {
            return new Promise(function (resolve) {
                if (image.complete) {
                    resolve();
                    return;
                }
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", resolve, { once: true });
            });
        }

        const pending = [];
        firstTitle.querySelectorAll("img").forEach(function (image) {
            pending.push(waitForImage(image));
        });
        const firstCover = works[0] && works[0].cover;
        if (firstCover) {
            const coverProbe = new Image();
            coverProbe.src = firstCover;
            pending.push(waitForImage(coverProbe));
        }

        const timeout = setTimeout(function () {
            finish();
        }, 15000);
        Promise.all(pending).then(function () {
            clearTimeout(timeout);
            if (Date.now() - startedAt > 200) {
                finish();
            } else {
                setTimeout(finish, 200);
            }
        });
    }());

    let scrollFramePending = false;
    scroller.addEventListener('scroll', function () {
        if (switchAnimating || document.querySelector('.entry.is-open')) return;
        if (scrollFramePending) return;
        scrollFramePending = true;
        requestAnimationFrame(function () {
            scrollFramePending = false;
            if (switchAnimating || document.querySelector('.entry.is-open')) return;
            const index = sectionIndexFromScroll();
            if (index !== activeIndex) {
                renderRange(index);
            }
        });
    });

    document.addEventListener('wheel', function (event) {
        if (document.querySelector('.entry.is-open')) return;
        if (scroller.classList.contains('no-scroll')) return;
        if (event.ctrlKey) return;
        event.preventDefault();

        const now = performance.now();
        noteWheelGesture();
        if (switchAnimating || now < wheelLockUntil) {
            return;
        }

        let rawDelta = event.deltaY;
        if (event.deltaMode === 1) {
            rawDelta *= 16;
        } else if (event.deltaMode === 2) {
            rawDelta *= scroller.clientHeight || 1;
        }
        if (rawDelta === 0) {
            return;
        }

        const direction = rawDelta > 0 ? 1 : -1;
        if (wheelAccumulated !== 0 && Math.sign(wheelAccumulated) !== direction) {
            wheelAccumulated = 0;
        }
        wheelAccumulated += rawDelta;

        if (Math.abs(wheelAccumulated) < WHEEL_THRESHOLD) {
            return;
        }

        const fromIndex = sectionIndexFromScroll();
        const targetIndex = clampSectionIndex(fromIndex + direction);
        wheelAccumulated = 0;
        if (targetIndex === fromIndex) {
            return;
        }

        wheelLockUntil = now + SWITCH_ANIMATION_MS + WHEEL_GESTURE_GAP_MS;
        renderRange(targetIndex);
        scrollToEntryIndex(targetIndex);
    }, { passive: false });

    function resetEntryFrames(entry) {
        entry.querySelectorAll('iframe').forEach(function (frame) {
            if (!frame.dataset.stageSrc && frame.src && frame.src !== 'about:blank') {
                frame.dataset.stageSrc = frame.src;
            }
            frame.src = 'about:blank';
        });
    }

    function resetEntryPanel(entry) {
        entry.querySelectorAll('.stage.is-intro-open').forEach(function (stage) {
            stage.classList.remove('is-intro-open');
        });
        entry.querySelectorAll('.stage__intro-btn').forEach(function (button) {
            button.setAttribute('aria-expanded', 'false');
        });
        entry.querySelectorAll('.stage__intro').forEach(function (intro) {
            intro.scrollTop = 0;
        });
        entry.querySelectorAll('.stage__tabs').forEach(function (tabNav) {
            tabNav.classList.remove('is-open');
        });
        const firstTab = entry.querySelector('.stage__tab');
        if (firstTab) {
            const firstIntro = firstTab.dataset.intro;
            entry.querySelectorAll('.stage__tab').forEach(function (item) {
                item.classList.toggle('is-active', item === firstTab);
                item.setAttribute('aria-selected', item === firstTab ? 'true' : 'false');
            });
            entry.querySelectorAll('.stage__intro[data-intro]').forEach(function (intro) {
                const isActive = intro.dataset.intro === firstIntro;
                intro.classList.toggle('is-active', isActive);
                intro.setAttribute('aria-hidden', isActive ? 'false' : 'true');
                if (isActive) {
                    intro.scrollTop = 0;
                }
            });
        }
        entry.querySelectorAll('.stage').forEach(syncEyebrowsFromTabs);
        resetMediaIntros(entry);
        resetWeaponPages(entry);
        if (window.resetBeltDemo) {
            window.resetBeltDemo(entry);
        }
        if (window.resetModelViewers) {
            window.resetModelViewers(entry);
        }
        resetCarouselsIn(entry);
        resetVideosIn(entry);
        resetEntryFrames(entry);
    }

    function syncEntry(entry, open) {
        entry.classList.toggle('is-open', open);
        entry.querySelectorAll('[data-toggle]').forEach(function (button) {
            button.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        if (open) {
            const pendingTimer = entryFrameTimers.get(entry);
            if (pendingTimer) {
                clearTimeout(pendingTimer);
                entryFrameTimers.delete(entry);
            }
            entry.querySelectorAll('iframe').forEach(function (frame) {
                if (frame.dataset.stageSrc) {
                    frame.src = frame.dataset.stageSrc;
                }
            });
        } else {
            if (!entryFrameTimers.has(entry)) {
                entryFrameTimers.set(entry, setTimeout(function () {
                    entryFrameTimers.delete(entry);
                    if (!entry.classList.contains('is-open')) {
                        resetEntryPanel(entry);
                    }
                }, CLOSE_ANIMATION_MS));
            }
        }
        const panel = entry.querySelector('.entry__panel');
        if (panel) {
            panel.setAttribute('aria-hidden', open ? 'false' : 'true');
        }
    }

    function lockBody() {
        clearTimeout(unlockTimer);
        scroller.classList.add('no-scroll');
    }

    function unlockBody() {
        clearTimeout(unlockTimer);
        unlockTimer = setTimeout(function () {
            if (!document.querySelector('.entry.is-open')) {
                scroller.classList.remove('no-scroll');
            }
        }, CLOSE_ANIMATION_MS);
    }

    function openEntry(entry) {
        hideContextMenu();
        renderedEntries.forEach(function (other) {
            if (other && other !== entry) {
                syncEntry(other, false);
            }
            });
            syncEntry(entry, true);
            const stageBody = entry.querySelector('.panel__body--stage');
            if (stageBody && stageBody.dataset.stageFile) {
                loadStageInto(stageBody, stageBody.dataset.stageFile);
            }
            setProfileCollapsed(true);
            setProfileCovered(true);
            lockBody();
            updateScrollHints();
    }

    function closeEntry(entry) {
        if (!entry.classList.contains('is-open')) {
            return;
        }
        hideContextMenu();
        syncEntry(entry, false);
        setProfileCovered(false);
        unlockBody();
        updateScrollHints();
    }

    function closeMobileTabMenu(tabNav) {
        if (!tabNav || tabNav.classList.contains('is-closing')) {
            return;
        }
        tabNav.classList.add('is-closing');
        setTimeout(function () {
            tabNav.classList.remove('is-open');
            tabNav.classList.remove('is-closing');
        }, 330);
    }

    function selectWeaponSubtab(subtab) {
        if (!subtab) return;
        const stage = subtab.closest('.stage');
        const page = subtab.closest('.stage__intro--weapons');
        if (!stage || !page) return;
        const target = subtab.dataset.weaponTarget;
        if (!target) return;
        const previousPanel = page.querySelector('.weapon-page__panel.is-active');

        page.querySelectorAll('.weapon-subtab').forEach(function (button) {
            const isActive = button === subtab;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        page.querySelectorAll('.weapon-page__panel').forEach(function (panel) {
            const isActive = panel.dataset.weaponPanel === target;
            panel.classList.toggle('is-active', isActive);
            panel.classList.remove('is-intro-open');
            const video = panel.querySelector('.weapon-page__video video');
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
            const videoWrap = panel.querySelector('.weapon-page__video');
            const modelWrap = panel.querySelector('.weapon-page__model');
            if (videoWrap) {
                videoWrap.hidden = false;
                videoWrap.classList.add('is-off');
            }
            if (modelWrap) {
                modelWrap.classList.remove('is-off');
            }
            const toggle = panel.querySelector('.weapon-page__toggle');
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
                toggle.textContent = '播放演示视频';
            }
            const introBtn = panel.querySelector('.weapon-page__intro-btn');
            if (introBtn) {
                introBtn.setAttribute('aria-expanded', 'false');
                introBtn.textContent = '查看介绍';
            }
            const info = panel.querySelector('.weapon-page__info');
            if (info) {
                info.scrollTop = 0;
            }
            if (isActive) {
                if (window.initModelViewers && page.classList.contains('is-active')) {
                    window.initModelViewers(panel);
                }
                if (window.resetModelViewersImmediate) {
                    setTimeout(function () {
                        window.resetModelViewersImmediate(panel);
                    }, 260);
                }
            }
        });

        const activePanel = page.querySelector('.weapon-page__panel.is-active');
        if (
            previousPanel
            && previousPanel !== activePanel
            && window.resetModelViewersImmediate
        ) {
            setTimeout(function () {
                window.resetModelViewersImmediate(previousPanel);
            }, 260);
        }
    }

    function resetWeaponPages(container) {
        if (!container) return;
        container.querySelectorAll('.stage__intro--weapons').forEach(function (page) {
            const firstSubtab = page.querySelector('.weapon-subtab');
            if (firstSubtab) {
                selectWeaponSubtab(firstSubtab);
            }
            page.querySelectorAll('.weapon-page__video video').forEach(function (video) {
                video.pause();
                video.currentTime = 0;
            });
        });
    }

    document.addEventListener('click', function (event) {
        const carouselButton = event.target.closest('.intro__carousel__btn');
        if (carouselButton) {
            const intro = carouselButton.closest('.stage__intro');
            const carousel = intro
                ? intro.querySelector('.intro__carousel')
                : carouselButton.closest('.intro__carousel');
            if (carousel) {
                const slides = Array.from(
                    carousel.querySelectorAll('.intro__carousel__slide')
                );
                if (slides.length > 1) {
                    const currentIndex = slides.findIndex(function (slide) {
                        return slide.classList.contains('is-active');
                    });
                    const direction = carouselButton.classList.contains(
                        'intro__carousel__btn--prev'
                    ) ? -1 : 1;
                    const nextIndex = (currentIndex + direction + slides.length) % slides.length;
                    slides.forEach(function (slide, index) {
                        slide.classList.toggle('is-active', index === nextIndex);
                    });
                }
            }
            return;
        }

        const weaponIntroButton = event.target.closest('.weapon-page__intro-btn');
        if (weaponIntroButton) {
            const panel = weaponIntroButton.closest('.weapon-page__panel');
            if (panel) {
                const isOpen = panel.classList.toggle('is-intro-open');
                weaponIntroButton.setAttribute(
                    'aria-expanded',
                    isOpen ? 'true' : 'false'
                );
                weaponIntroButton.textContent = isOpen ? '收起介绍' : '查看介绍';
            }
            return;
        }

        const weaponToggle = event.target.closest('.weapon-page__toggle');
        if (weaponToggle) {
            const panel = weaponToggle.closest('.weapon-page__panel');
            if (panel) {
                const modelWrap = panel.querySelector('.weapon-page__model');
                const videoWrap = panel.querySelector('.weapon-page__video');
                const video = videoWrap ? videoWrap.querySelector('video') : null;
                const showingVideo = videoWrap
                    && !videoWrap.hidden
                    && !videoWrap.classList.contains('is-off');
                if (showingVideo) {
                    if (video) {
                        video.pause();
                        video.currentTime = 0;
                    }
                    if (videoWrap) {
                        videoWrap.classList.add('is-off');
                    }
                    if (modelWrap) {
                        modelWrap.classList.remove('is-off');
                    }
                    weaponToggle.textContent = '播放演示视频';
                    weaponToggle.setAttribute('aria-expanded', 'false');
                    if (window.resetModelViewersImmediate) {
                        setTimeout(function () {
                            window.resetModelViewersImmediate(panel);
                        }, 240);
                    }
                } else {
                    if (modelWrap) {
                        modelWrap.classList.add('is-off');
                    }
                    if (videoWrap) {
                        videoWrap.hidden = false;
                        videoWrap.classList.add('is-off');
                        void videoWrap.offsetWidth;
                        videoWrap.classList.remove('is-off');
                    }
                    weaponToggle.textContent = '返回建模';
                    weaponToggle.setAttribute('aria-expanded', 'true');
                    if (video) {
                        video.muted = true;
                        const playPromise = video.play();
                        if (playPromise && playPromise.catch) {
                            playPromise.catch(function () {
                                /* 视频文件缺失或浏览器拦截时静默处理 */
                            });
                        }
                    }
                    if (window.resetModelViewersImmediate) {
                        setTimeout(function () {
                            window.resetModelViewersImmediate(panel);
                        }, 240);
                    }
                }
            }
            return;
        }

        const weaponSubtab = event.target.closest('.weapon-subtab');
        if (weaponSubtab) {
            selectWeaponSubtab(weaponSubtab);
            return;
        }

        const tab = event.target.closest('.stage__tab');
        if (tab) {
            const tabStage = tab.closest('.stage');
            if (tabStage) {
                const tabNav = tab.closest('.stage__tabs');
                if (mobileQuery.matches && tabNav && !tabNav.classList.contains('is-open')) {
                    tabStage.style.setProperty(
                        '--tabbar-height',
                        tabNav.getBoundingClientRect().height + 'px'
                    );
                    tabNav.classList.add('is-open');
                    return;
                }
                const targetIntro = tab.dataset.intro;
                const previousIntro = tabStage.querySelector('.stage__intro.is-active');
                tabStage.querySelectorAll('.stage__tab').forEach(function (item) {
                    const isActive = item === tab;
                    item.classList.toggle('is-active', isActive);
                    item.setAttribute('aria-selected', isActive ? 'true' : 'false');
                });
                tabStage.querySelectorAll('.stage__intro[data-intro]').forEach(function (intro) {
                    const isActive = intro.dataset.intro === targetIntro;
                    intro.classList.toggle('is-active', isActive);
                    intro.setAttribute('aria-hidden', isActive ? 'false' : 'true');
                    if (isActive) {
                        intro.scrollTop = 0;
                    }
                });
                tabStage.querySelectorAll(
                    '.stage__intro--weapons.is-active .weapon-page__panel.is-active'
                ).forEach(function (panel) {
                    if (window.initModelViewers) {
                        window.initModelViewers(panel);
                    }
                });
                syncEyebrowsFromTabs(tabStage);
                resetMediaIntros(tabStage);
                const activeIntro = tabStage.querySelector(
                    '.stage__intro[data-intro="' + targetIntro + '"]'
                );
                if (activeIntro) {
                    resetCarouselsIn(activeIntro);
                }
                if (previousIntro && previousIntro !== activeIntro) {
                    scheduleIntroVideoReset(previousIntro);
                } else if (activeIntro) {
                    resetVideosIn(activeIntro);
                }
                autoplayIntroVideos(activeIntro);
                if (mobileQuery.matches && tabNav) {
                    closeMobileTabMenu(tabNav);
                }
                setTimeout(function () {
                    resetWeaponPages(tabStage);
                    if (window.resetModelViewersImmediate) {
                        window.resetModelViewersImmediate(tabStage);
                    }
                }, 320);
            }
            return;
        }

        const mediaIntroButton = event.target.closest('.intro__media-btn');
        if (mediaIntroButton) {
            const introMedia = mediaIntroButton.closest('.stage__intro--media');
            if (introMedia) {
                const isOpen = introMedia.classList.toggle('is-open');
                mediaIntroButton.setAttribute(
                    'aria-expanded',
                    isOpen ? 'true' : 'false'
                );
            }
            return;
        }

        const introButton = event.target.closest('.stage__intro-btn');
        if (introButton) {
            const stage = introButton.closest('.stage');
            if (stage) {
                const isOpen = stage.classList.toggle('is-intro-open');
                introButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                if (isOpen) {
                    const intro = stage.querySelector('.stage__intro');
                    if (intro) {
                        intro.scrollTop = 0;
                    }
                }
            }
            return;
        }

        const toggle = event.target.closest('[data-toggle]');
        if (!toggle) return;
        const entry = toggle.closest('.entry');
        if (!entry) return;

        if (entry.classList.contains('is-open')) {
            closeEntry(entry);
        } else {
            openEntry(entry);
        }
    });

    /* ===== 浮动个人信息窗口：拖拽 / 折叠 ===== */
    const profileCard = document.querySelector('.profile-card');
    const profileBar = profileCard
        ? profileCard.querySelector('.profile-card__bar')
        : null;
    const contextMenu = document.querySelector('.context-menu');
    const imageViewer = document.querySelector('.image-viewer');
    const imageViewerCanvas = imageViewer
        ? imageViewer.querySelector('.image-viewer__canvas')
        : null;
    let contextImageElement = null;

    const imageViewerState = {
        open: false,
        scale: 1,
        x: 0,
        y: 0,
        contentWidth: 0,
        contentHeight: 0,
        pointers: new Map(),
        pinch: null,
        animationFrame: null,
        suppressClickUntil: 0
    };

    function clampImageViewerScale(scale) {
        return Math.max(0.1, Math.min(8, scale));
    }

    function applyImageViewer(scale, x, y) {
        if (!imageViewerCanvas || !imageViewerState.contentWidth) return;
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;
        const contentWidth = imageViewerState.contentWidth * scale;
        const contentHeight = imageViewerState.contentHeight * scale;
        const minX = Math.min(0, viewWidth - contentWidth);
        const maxX = Math.max(0, viewWidth - contentWidth);
        const minY = Math.min(0, viewHeight - contentHeight);
        const maxY = Math.max(0, viewHeight - contentHeight);

        imageViewerState.scale = scale;
        imageViewerState.x = Math.max(minX, Math.min(maxX, x));
        imageViewerState.y = Math.max(minY, Math.min(maxY, y));
        imageViewerCanvas.style.transform =
            "translate(" + imageViewerState.x + "px, " + imageViewerState.y + "px) scale(" + imageViewerState.scale + ")";
    }

    function fitImageViewer() {
        const fit = getImageViewerFit();
        if (fit) {
            applyImageViewer(fit.scale, fit.x, fit.y);
        }
    }

    function getImageViewerFit() {
        if (!imageViewerState.contentWidth) return null;
        const padding = 36;
        const viewWidth = Math.max(1, window.innerWidth - padding * 2);
        const viewHeight = Math.max(1, window.innerHeight - padding * 2);
        const scale = clampImageViewerScale(
            Math.min(
                1,
                viewWidth / imageViewerState.contentWidth,
                viewHeight / imageViewerState.contentHeight
            )
        );
        const x = (window.innerWidth - imageViewerState.contentWidth * scale) / 2;
        const y = (window.innerHeight - imageViewerState.contentHeight * scale) / 2;
        return { scale: scale, x: x, y: y };
    }

    function animateImageViewerTo(targetScale, targetX, targetY) {
        if (!imageViewerState.contentWidth) return;
        targetScale = clampImageViewerScale(targetScale);
        const startScale = imageViewerState.scale;
        const startX = imageViewerState.x;
        const startY = imageViewerState.y;
        if (
            Math.abs(targetScale - startScale) < 0.001
            && Math.abs(targetX - startX) < 0.5
            && Math.abs(targetY - startY) < 0.5
        ) {
            return;
        }
        const startTime = performance.now();
        const duration = 260;
        if (imageViewerState.animationFrame) {
            cancelAnimationFrame(imageViewerState.animationFrame);
        }

        function frame(now) {
            const raw = Math.min((now - startTime) / duration, 1);
            const eased = raw < 0.5
                ? 4 * raw * raw * raw
                : 1 - Math.pow(-2 * raw + 2, 3) / 2;
            applyImageViewer(
                startScale + (targetScale - startScale) * eased,
                startX + (targetX - startX) * eased,
                startY + (targetY - startY) * eased
            );
            if (raw < 1) {
                imageViewerState.animationFrame = requestAnimationFrame(frame);
            } else {
                imageViewerState.animationFrame = null;
            }
        }
        imageViewerState.animationFrame = requestAnimationFrame(frame);
    }

    function resetImageViewerSize() {
        if (!imageViewerState.open) return;
        const fit = getImageViewerFit();
        if (fit) {
            animateImageViewerTo(fit.scale, fit.x, fit.y);
        }
    }

    function resetImageViewerCenter() {
        if (!imageViewerState.open) return;
        const x = (
            window.innerWidth - imageViewerState.contentWidth * imageViewerState.scale
        ) / 2;
        const y = (
            window.innerHeight - imageViewerState.contentHeight * imageViewerState.scale
        ) / 2;
        animateImageViewerTo(imageViewerState.scale, x, y);
    }

    function openImageViewer(image) {
        if (!imageViewer || !imageViewerCanvas || imageViewerState.open) return;
        const source = image.currentSrc || image.src || "";
        if (!source) return;

        imageViewerState.open = true;
        imageViewerState.contentWidth = 0;
        imageViewerState.contentHeight = 0;
        imageViewerState.scale = 1;
        imageViewerState.x = 0;
        imageViewerState.y = 0;
        imageViewerCanvas.innerHTML = "";
        imageViewerCanvas.style.transform = "none";

        const viewImage = document.createElement("img");
        viewImage.alt = image.alt || "";
        viewImage.draggable = false;
        viewImage.src = source;
        imageViewerCanvas.appendChild(viewImage);

        function prepareView() {
            if (!viewImage.naturalWidth) return;
            imageViewerState.contentWidth = viewImage.naturalWidth;
            imageViewerState.contentHeight = viewImage.naturalHeight;
            imageViewerCanvas.style.width = viewImage.naturalWidth + "px";
            imageViewerCanvas.style.height = viewImage.naturalHeight + "px";
            fitImageViewer();
        }

        if (viewImage.complete) {
            prepareView();
        } else {
            viewImage.addEventListener("load", prepareView);
            viewImage.addEventListener("error", function () {
                closeImageViewer();
            });
        }

        imageViewer.classList.add("is-open");
        imageViewer.setAttribute("aria-hidden", "false");
    }

    function closeImageViewer() {
        if (!imageViewerState.open) return;
        imageViewerState.open = false;
        imageViewer.classList.remove("is-open");
        imageViewer.setAttribute("aria-hidden", "true");
        if (imageViewerState.animationFrame) {
            cancelAnimationFrame(imageViewerState.animationFrame);
            imageViewerState.animationFrame = null;
        }
        imageViewerState.pointers.clear();
        imageViewerState.pinch = null;
        setTimeout(function () {
            if (!imageViewerState.open && imageViewerCanvas) {
                imageViewerCanvas.innerHTML = "";
                imageViewerCanvas.style.width = "";
                imageViewerCanvas.style.height = "";
                imageViewerCanvas.style.transform = "none";
                imageViewerState.contentWidth = 0;
                imageViewerState.contentHeight = 0;
            }
        }, 340);
    }

    function bindImageViewerGesture() {
        if (!imageViewer) return;

        imageViewer.addEventListener("wheel", function (event) {
            if (!imageViewerState.open) return;
            event.preventDefault();
            if (imageViewerState.animationFrame) {
                cancelAnimationFrame(imageViewerState.animationFrame);
                imageViewerState.animationFrame = null;
            }
            const rect = imageViewer.getBoundingClientRect();
            const factor = event.deltaY < 0 ? 1.12 : 0.88;
            const nextScale = clampImageViewerScale(imageViewerState.scale * factor);
            const px = event.clientX - rect.left;
            const py = event.clientY - rect.top;
            const originX = (px - imageViewerState.x) / imageViewerState.scale;
            const originY = (py - imageViewerState.y) / imageViewerState.scale;
            applyImageViewer(
                nextScale,
                px - originX * nextScale,
                py - originY * nextScale
            );
        }, { passive: false });

        imageViewer.addEventListener("pointerdown", function (event) {
            if (!imageViewerState.open) return;
            if (event.button === 2) return;
            if (imageViewerState.pointers.size >= 2) return;
            imageViewerState.pointers.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY
            });
            if (imageViewerState.pointers.size === 2) {
                const points = Array.from(imageViewerState.pointers.values());
                const dx = points[0].x - points[1].x;
                const dy = points[0].y - points[1].y;
                const rect = imageViewer.getBoundingClientRect();
                imageViewerState.pinch = {
                    startScale: imageViewerState.scale,
                    distance: Math.sqrt(dx * dx + dy * dy),
                    startX: imageViewerState.x,
                    startY: imageViewerState.y,
                    centerX: (points[0].x + points[1].x) / 2 - rect.left,
                    centerY: (points[0].y + points[1].y) / 2 - rect.top
                };
            }
        });

        document.addEventListener("pointermove", function (event) {
            if (!imageViewerState.open || !imageViewerState.pointers.has(event.pointerId)) {
                return;
            }
            const pointer = imageViewerState.pointers.get(event.pointerId);
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            event.preventDefault();

            if (imageViewerState.pointers.size === 1 && imageViewerState.pinch === null) {
                const lastX = pointer.lastX === undefined ? pointer.x : pointer.lastX;
                const lastY = pointer.lastY === undefined ? pointer.y : pointer.lastY;
                applyImageViewer(
                    imageViewerState.scale,
                    imageViewerState.x + (event.clientX - lastX),
                    imageViewerState.y + (event.clientY - lastY)
                );
                pointer.lastX = event.clientX;
                pointer.lastY = event.clientY;
                imageViewerState.suppressClickUntil = performance.now() + 350;
            } else if (imageViewerState.pointers.size === 2 && imageViewerState.pinch) {
                const points = Array.from(imageViewerState.pointers.values());
                const dx = points[0].x - points[1].x;
                const dy = points[0].y - points[1].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const centerX = (points[0].x + points[1].x) / 2;
                const centerY = (points[0].y + points[1].y) / 2;
                const rect = imageViewer.getBoundingClientRect();
                const relativeCenterX = centerX - rect.left;
                const relativeCenterY = centerY - rect.top;
                const originX = (imageViewerState.pinch.centerX - imageViewerState.pinch.startX)
                    / imageViewerState.pinch.startScale;
                const originY = (imageViewerState.pinch.centerY - imageViewerState.pinch.startY)
                    / imageViewerState.pinch.startScale;
                const nextScale = clampImageViewerScale(
                    imageViewerState.pinch.startScale
                    * distance
                    / imageViewerState.pinch.distance
                );
                applyImageViewer(
                    nextScale,
                    relativeCenterX - originX * nextScale,
                    relativeCenterY - originY * nextScale
                );
                imageViewerState.suppressClickUntil = performance.now() + 350;
            }
        });

        function endImageViewerPointer(event) {
            if (!imageViewerState.open || !imageViewerState.pointers.has(event.pointerId)) {
                return;
            }
            imageViewerState.pointers.delete(event.pointerId);
            imageViewerState.pinch = null;
            if (imageViewerState.pointers.size === 1) {
                const remaining = Array.from(imageViewerState.pointers.values())[0];
                remaining.lastX = remaining.x;
                remaining.lastY = remaining.y;
            }
        }

        document.addEventListener("pointerup", endImageViewerPointer);
        document.addEventListener("pointercancel", endImageViewerPointer);

        imageViewer.addEventListener("click", function () {
            if (!imageViewerState.open) return;
            if (performance.now() <= imageViewerState.suppressClickUntil) {
                imageViewerState.suppressClickUntil = 0;
                return;
            }
            closeImageViewer();
        });

    }

    function initImageViewerCapture() {
        document.addEventListener("click", function (event) {
            const image = event.target.closest
                ? event.target.closest("img")
                : null;
            if (!image) return;
            if (!image.closest(".stage__intro")) return;
            if (image.closest(".belt-demo")) return;
            if (image.closest(".image-viewer")) return;
            if (image.closest(".context-menu")) return;
            event.preventDefault();
            event.stopPropagation();
            openImageViewer(image);
        }, true);
    }

    bindImageViewerGesture();
    initImageViewerCapture();

    function initParastoneMaps(root) {
        if (!root) return;
        root.querySelectorAll(".intro__parastonemap").forEach(function (container) {
            if (container.dataset.parastoneMapReady) return;
            container.dataset.parastoneMapReady = "1";
            const mapImages = Array.from(
                container.querySelectorAll("img")
            );
            const store = {
                maps: [],
                readyCount: 0,
                active: null
            };

            function clearHover() {
                mapImages.forEach(function (img) {
                    img.classList.remove("is-hovered");
                    img.classList.remove("is-raised");
                });
                container.classList.remove("has-map-hover");
                store.active = null;
            }

            function isInsideRect(info, clientX, clientY) {
                const rect = info.el.getBoundingClientRect();
                return (
                    clientX >= rect.left
                    && clientX <= rect.right
                    && clientY >= rect.top
                    && clientY <= rect.bottom
                );
            }

            function isOpaqueAt(info, clientX, clientY) {
                if (!isInsideRect(info, clientX, clientY)) return false;
                if (!info.alpha) return true;
                const rect = info.el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    const sx = Math.min(
                        info.srcWidth - 1,
                        Math.max(
                            0,
                            Math.floor(
                                (clientX - rect.left) * info.srcWidth / rect.width
                            )
                        )
                    );
                    const sy = Math.min(
                        info.srcHeight - 1,
                        Math.max(
                            0,
                            Math.floor(
                                (clientY - rect.top) * info.srcHeight / rect.height
                            )
                        )
                    );
                    if (info.alpha[(sy * info.srcWidth + sx) * 4 + 3] > 8) {
                        return true;
                    }
                }
                return false;
            }

            function pickAt(clientX, clientY) {
                for (let i = store.maps.length - 1; i >= 0; i--) {
                    const info = store.maps[i];
                    if (info.ready && isOpaqueAt(info, clientX, clientY)) {
                        return info;
                    }
                }
                return null;
            }

            function applyHover(info) {
                mapImages.forEach(function (img) {
                    img.classList.toggle(
                        "is-hovered",
                        info && img === info.el
                    );
                });
                container.classList.toggle(
                    "has-map-hover",
                    Boolean(info)
                );
            }

            function applyRaised(info) {
                mapImages.forEach(function (img) {
                    img.classList.toggle(
                        "is-raised",
                        info && img === info.el
                    );
                });
            }

            mapImages.forEach(function (img) {
                const info = {
                    el: img,
                    ready: false,
                    alpha: null,
                    srcWidth: 0,
                    srcHeight: 0
                };
                store.maps.push(info);
                const loader = new Image();
                loader.onload = function () {
                    try {
                        const canvas = document.createElement("canvas");
                        canvas.width = loader.naturalWidth;
                        canvas.height = loader.naturalHeight;
                        const ctx = canvas.getContext("2d", {
                            willReadFrequently: true
                        });
                        ctx.drawImage(loader, 0, 0);
                        info.alpha = ctx.getImageData(
                            0,
                            0,
                            canvas.width,
                            canvas.height
                        ).data;
                        info.srcWidth = canvas.width;
                        info.srcHeight = canvas.height;
                    } catch (error) {
                        info.alpha = null;
                        info.srcWidth = img.naturalWidth || 1;
                        info.srcHeight = img.naturalHeight || 1;
                    }
                    info.ready = true;
                    store.readyCount += 1;
                };
                loader.onerror = function () {
                    info.ready = true;
                    info.alpha = null;
                    info.srcWidth = img.naturalWidth || 1;
                    info.srcHeight = img.naturalHeight || 1;
                    store.readyCount += 1;
                };
                loader.src = img.src;
            });

            container.addEventListener("pointermove", function (event) {
                if (store.readyCount < mapImages.length) return;
                if (store.active) {
                    if (
                        isInsideRect(
                            store.active,
                            event.clientX,
                            event.clientY
                        )
                    ) {
                        if (
                            isOpaqueAt(
                                store.active,
                                event.clientX,
                                event.clientY
                            )
                        ) {
                            applyRaised(store.active);
                            applyHover(store.active);
                            return;
                        }
                        store.active = null;
                        applyRaised(null);
                        applyHover(null);
                    }
                }
                const hit = pickAt(event.clientX, event.clientY);
                store.active = hit;
                applyRaised(hit);
                applyHover(hit);
            });
            container.addEventListener("click", function (event) {
                if (!mobileQuery.matches) return;
                if (
                    event.target
                    && event.target.closest
                    && event.target.closest(".intro__parastonemap img")
                ) {
                    return;
                }
                if (store.readyCount < mapImages.length) return;
                const hit = pickAt(event.clientX, event.clientY);
                store.active = hit;
                applyRaised(hit);
                applyHover(hit);
            });
            document.addEventListener("click", function (event) {
                if (!mobileQuery.matches) return;
                if (
                    event.target
                    && event.target.closest
                    && container.contains(event.target)
                ) {
                    return;
                }
                clearHover();
            });
            container.addEventListener("pointerleave", clearHover);
            container.addEventListener("pointerout", function (event) {
                if (
                    !event.relatedTarget
                    || !container.contains(event.relatedTarget)
                ) {
                    clearHover();
                }
            });
        });
    }

    const stageIntroBackRecords = [];

    function getIntroActiveScroller(intro) {
        if (!intro) return null;
        const candidates = [
            intro,
            ...Array.from(intro.querySelectorAll("*"))
        ];
        for (let i = 0; i < candidates.length; i++) {
            const el = candidates[i];
            if (
                el.scrollTop != null
                && el.scrollTop > 4
                && el.scrollHeight > el.clientHeight + 4
            ) {
                return el;
            }
        }
        return intro;
    }

    function initStageIntroBackButtons(root) {
        if (!root) return;
        root.querySelectorAll(".stage__intro").forEach(function (intro) {
            if (intro.dataset.stageBackReady) return;
            intro.dataset.stageBackReady = "1";
            let button = null;
            let hideTimer = null;
            function ensureButton() {
                if (button) return button;
                const created = document.createElement("button");
                created.type = "button";
                created.className = "stage-intro-back-top";
                created.setAttribute("aria-label", "回到顶端");
                created.textContent = "回到顶端";
                created.addEventListener("click", function () {
                    const scroller = getIntroActiveScroller(intro);
                    if (scroller && scroller.scrollTo) {
                        scroller.scrollTo({ top: 0, behavior: "smooth" });
                    }
                });
                document.body.appendChild(created);
                requestAnimationFrame(function () {
                    created.classList.add("is-visible");
                });
                button = created;
                return created;
            }
            function removeButton() {
                if (button) {
                    if (button.parentNode) button.parentNode.removeChild(button);
                    button = null;
                }
            }
            function cancelButtonHide() {
                if (hideTimer) {
                    clearTimeout(hideTimer);
                    hideTimer = null;
                }
            }
            function hideButton() {
                if (!button || hideTimer) return;
                button.classList.remove("is-visible");
                hideTimer = setTimeout(function () {
                    hideTimer = null;
                    removeButton();
                }, 320);
            }
            function showButton() {
                cancelButtonHide();
                const existed = Boolean(button);
                const shown = ensureButton();
                if (existed) {
                    shown.classList.remove("is-visible");
                    void shown.offsetWidth;
                    shown.classList.add("is-visible");
                }
            }
            const record = {
                intro: intro,
                scroller: getIntroActiveScroller(intro)
            };

            record.update = function (eventTarget) {
                let scroller = null;
                if (
                    eventTarget
                    && eventTarget.scrollTop != null
                    && (
                        eventTarget === intro
                        || intro.contains(eventTarget)
                    )
                ) {
                    scroller = eventTarget;
                }
                if (
                    !scroller
                    || scroller.scrollTop <= 4
                    || scroller.scrollHeight <= scroller.clientHeight + 4
                ) {
                    scroller = record.scroller;
                }
                record.scroller = scroller;
                const rect = intro.getBoundingClientRect();
                const hasSize = rect.width > 0 && rect.height > 0;
                const onScreen =
                    rect.right > 0
                    && rect.left < window.innerWidth
                    && rect.bottom > 0
                    && rect.top < window.innerHeight;
                const scrolled =
                    scroller
                    && scroller.scrollTop > 48
                    && scroller.scrollHeight > scroller.clientHeight + 8;
                let coverHidden = false;
                if (scrolled) {
                    const introStyle = window.getComputedStyle(intro);
                    const stage = intro.closest(".stage");
                    const tabsCover = stage
                        && stage.querySelector(
                            ".stage__tabs.is-open, .stage__tabs.is-closing"
                        );
                    const tabbedStage = intro.closest(".stage--tabbed");
                    const introActive =
                        !tabbedStage || intro.classList.contains("is-active");
                    const introHidden =
                        introStyle.visibility === "hidden"
                        || introStyle.opacity === "0";
                    const entryClosed =
                        entryEl
                        && !entryEl.classList.contains("entry--direct")
                        && !entryEl.classList.contains("is-open");
                    let contentHidden = false;
                    if (
                        mobileQuery.matches
                        && intro.classList.contains("stage__intro--media")
                        && !intro.classList.contains("is-open")
                    ) {
                        contentHidden = true;
                    }
                    if (
                        mobileQuery.matches
                        && intro.classList.contains("stage__intro--weapons")
                        && !intro.querySelector(
                            ".weapon-page__panel.is-active.is-intro-open"
                        )
                    ) {
                        contentHidden = true;
                    }
                    intro.querySelectorAll(".intro__content").forEach(
                        function (content) {
                            const style = window.getComputedStyle(content);
                            if (
                                style.visibility === "hidden"
                                || style.opacity === "0"
                                || style.display === "none"
                            ) {
                                contentHidden = true;
                            }
                        }
                    );
                    intro.querySelectorAll(".weapon-page__info").forEach(
                        function (content) {
                            const panel = content.closest(
                                ".weapon-page__panel"
                            );
                            if (
                                panel
                                && !panel.classList.contains("is-active")
                            ) {
                                return;
                            }
                            const style = window.getComputedStyle(content);
                            if (
                                style.visibility === "hidden"
                                || style.opacity === "0"
                                || style.display === "none"
                            ) {
                                contentHidden = true;
                            }
                        }
                    );
                    coverHidden = Boolean(
                        introHidden
                        || !introActive
                        || contentHidden
                        || tabsCover
                        || entryClosed
                    );
                }
                const visible = Boolean(
                    hasSize && onScreen && scrolled && !coverHidden
                );
                if (visible) {
                    showButton();
                    const shownButton = button;
                    const margin = 12;
                    const left = Math.max(
                        margin,
                        rect.right - shownButton.offsetWidth - margin
                    );
                    const top = Math.max(margin, rect.top + margin);
                    shownButton.style.left = left + "px";
                    shownButton.style.top = top + "px";
                } else {
                    hideButton();
                }
            };

            const classTargets = [intro];
            const entryEl = intro.closest(".entry");
            const stageEl = intro.closest(".stage");
            if (entryEl) classTargets.push(entryEl);
            intro.querySelectorAll(".intro__content").forEach(function (el) {
                classTargets.push(el);
            });
            intro.querySelectorAll(".weapon-page__panel").forEach(function (el) {
                classTargets.push(el);
            });
            if (stageEl) {
                classTargets.push(stageEl);
                stageEl.querySelectorAll(".stage__tabs").forEach(function (el) {
                    classTargets.push(el);
                });
            }
            const classObserver = new MutationObserver(function () {
                record.update(null);
                setTimeout(function () {
                    record.update(null);
                }, 60);
                setTimeout(function () {
                    record.update(null);
                }, 480);
            });
            classTargets.forEach(function (el) {
                classObserver.observe(el, {
                    attributes: true,
                    attributeFilter: ["class"]
                });
            });

            stageIntroBackRecords.push(record);
            record.update(null);
        });
    }

    window.addEventListener("scroll", function (event) {
        for (let i = 0; i < stageIntroBackRecords.length; i++) {
            stageIntroBackRecords[i].update(event.target);
        }
    }, true);
    window.addEventListener("resize", function () {
        for (let i = 0; i < stageIntroBackRecords.length; i++) {
            stageIntroBackRecords[i].update(null);
        }
    });

    function setProfilePosition(left, top) {
        if (!profileCard) return;
        profileCard.style.left = left + 'px';
        profileCard.style.top = top + 'px';
        profileCard.style.right = 'auto';
        profileCard.style.bottom = 'auto';
    }

    function refreshProfileCollapsedWidth() {
        if (!profileCard || !profileBar) return;
        const title = profileCard.querySelector('.profile-card__title');
        if (!title) return;
        const barStyle = window.getComputedStyle(profileBar);
        const cardStyle = window.getComputedStyle(profileCard);
        const paddingLeft = parseFloat(barStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(barStyle.paddingRight) || 0;
        const borderLeft = parseFloat(cardStyle.borderLeftWidth) || 0;
        const borderRight = parseFloat(cardStyle.borderRightWidth) || 0;
        let width = 0;
        if (
            profileCard.classList.contains('is-collapsed')
            && !profileCard.style.getPropertyValue('--profile-width-collapsed')
        ) {
            width = Math.ceil(
                profileBar.getBoundingClientRect().width
                + borderLeft
                + borderRight
            );
        } else {
            width = Math.ceil(
                title.getBoundingClientRect().width
                + paddingLeft
                + paddingRight
                + borderLeft
                + borderRight
            );
        }
        if (width > 0) {
            profileCard.style.setProperty(
                '--profile-width-collapsed',
                width + 'px'
            );
        }
    }

    function clampProfilePosition() {
        if (!profileCard) return;
        const rect = profileCard.getBoundingClientRect();
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
        if (changed) {
            setProfilePosition(left, top);
        }
    }

    function setProfileCollapsed(collapsed) {
        if (!profileCard) return;
        profileCard.classList.toggle('is-collapsed', collapsed);
        if (profileBar) {
            profileBar.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        }
    }

    function toggleProfileCollapsed() {
        if (!profileCard) return;
        setProfileCollapsed(
            !profileCard.classList.contains('is-collapsed')
        );
    }

        function resetProfilePosition() {
            if (!profileCard) return;
            const startRect = profileCard.getBoundingClientRect();
            ['top', 'right', 'bottom', 'left'].forEach(function (property) {
                profileCard.style.removeProperty(property);
            });
            const endRect = profileCard.getBoundingClientRect();
            const deltaX = startRect.left - endRect.left;
            const deltaY = startRect.top - endRect.top;
            if (
                Math.abs(deltaX) < 1 &&
                Math.abs(deltaY) < 1
            ) {
                return;
            }
            if (typeof profileCard.animate === 'function') {
                profileCard.classList.add('is-resetting');
                const animation = profileCard.animate([
                    {
                        transform: 'translate3d(' + deltaX + 'px, ' + deltaY + 'px, 0)'
                    },
                    {
                        transform: 'translate3d(0, 0, 0)'
                    }
                ], {
                    duration: 620,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
                });
                animation.addEventListener('finish', function () {
                    profileCard.classList.remove('is-resetting');
                }, { once: true });
            }
        }

    function setProfileCovered(covered) {
        if (!profileCard) return;
        profileCard.classList.toggle('is-covered', covered);
    }

    let profileDrag = null;
    let profileSuppressClick = false;

    function handleProfilePointerDown(event) {
        if (!profileCard || !profileBar) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const rect = profileCard.getBoundingClientRect();
        profileDrag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originLeft: rect.left,
            originTop: rect.top,
            moved: false
        };
        profileCard.classList.add('is-dragging');
        try {
            profileBar.setPointerCapture(event.pointerId);
        } catch (error) {
            /* 部分环境不支持时仍可用 window 事件继续 */
        }
    }

    function handleProfilePointerMove(event) {
        if (!profileDrag || profileDrag.pointerId !== event.pointerId) return;
        const deltaX = event.clientX - profileDrag.startX;
        const deltaY = event.clientY - profileDrag.startY;
        if (Math.abs(deltaX) + Math.abs(deltaY) < 5) return;
        profileDrag.moved = true;
        const rect = profileCard.getBoundingClientRect();
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
        if (profileCard) {
            profileCard.classList.remove('is-dragging');
        }
        if (profileBar && profileBar.hasPointerCapture) {
            try {
                profileBar.releasePointerCapture(event.pointerId);
            } catch (error) {
                /* ignore */
            }
        }
        if (moved && profileCard) {
            profileSuppressClick = true;
            setTimeout(function () {
                profileSuppressClick = false;
            }, 0);
        }
    }

    function hideContextMenu() {
        if (!contextMenu) return;
        contextMenu.classList.remove('is-open');
        contextMenu.setAttribute('aria-hidden', 'true');
    }

    let contextLinkHref = '';
    let contextLinkTarget = '';
    let contextMermaidWidget = null;
    let contextModelViewerElement = null;
    let contextIntroElement = null;

    function copyTextToClipboard(text) {
        if (!text) return;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).catch(function () {
                /* ignore */
            });
            return;
        }
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        try {
            document.execCommand('copy');
        } catch (error) {
            /* ignore */
        }
        helper.remove();
    }

    function runContextMenuAction(action) {
        if (action === 'toggle-profile') {
            toggleProfileCollapsed();
            hideContextMenu();
            return;
        }
        if (action === 'reset-profile') {
            resetProfilePosition();
            hideContextMenu();
            return;
        }
        if (action === 'back-to-intro-top') {
            const intro = contextIntroElement;
            contextIntroElement = null;
            hideContextMenu();
            if (intro) {
                const scroller = getIntroActiveScroller(intro);
                if (scroller && scroller.scrollTo) {
                    scroller.scrollTo({ top: 0, behavior: "smooth" });
                }
            }
            return;
        }
        if (action === 'close-entry') {
            const openEntryEl = document.querySelector('.entry.is-open');
            closeImageViewer();
            if (openEntryEl) {
                closeEntry(openEntryEl);
            }
            hideContextMenu();
            return;
        }
        if (action === 'back-to-top') {
            closeImageViewer();
            hideContextMenu();
            const openEntryEl = document.querySelector('.entry.is-open');
            if (openEntryEl) {
                closeEntry(openEntryEl);
                setTimeout(function () {
                    if (activeIndex > 0) {
                        renderRange(0);
                        scrollToEntryIndex(0);
                    }
                }, CLOSE_ANIMATION_MS);
            } else if (activeIndex > 0) {
                renderRange(0);
                scrollToEntryIndex(0);
            }
            return;
        }
        if (action === 'refresh-page') {
            hideContextMenu();
            window.location.reload();
            return;
        }
        if (action === 'go-home') {
            hideContextMenu();
            window.location.href = 'https://gaplouelpew.com/';
            return;
        }
        if (action === 'copy-selection') {
            const selected = window.getSelection()
                ? window.getSelection().toString().trim()
                : '';
            copyTextToClipboard(selected);
            hideContextMenu();
            return;
        }
        if (action === 'image-open-viewer') {
            const image = contextImageElement;
            contextImageElement = null;
            hideContextMenu();
            if (image) {
                openImageViewer(image);
            }
            return;
        }
        if (action === 'image-reset-size' || action === 'image-reset-center') {
            hideContextMenu();
            if (action === 'image-reset-size') {
                resetImageViewerSize();
            } else {
                resetImageViewerCenter();
            }
            return;
        }
        if (action === 'image-close') {
            hideContextMenu();
            closeImageViewer();
            return;
        }
        if (action === 'model-reset-view') {
            const modelElement = contextModelViewerElement;
            contextModelViewerElement = null;
            hideContextMenu();
            if (modelElement && window.resetModelViewerElement) {
                window.resetModelViewerElement(modelElement);
            }
            return;
        }
        if (action === 'mermaid-reset-size' || action === 'mermaid-reset-center') {
            const mermaidWidget = contextMermaidWidget;
            contextMermaidWidget = null;
            hideContextMenu();
            if (!mermaidWidget) return;
            const viewport = mermaidWidget.querySelector(
                '.mermaid-widget__viewport'
            );
            if (!viewport) return;
            const rect = viewport.getBoundingClientRect();
            if (action === 'mermaid-reset-size') {
                animateMermaidZoom(
                    mermaidWidget,
                    1,
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2
                );
            } else {
                animateMermaidCenter(mermaidWidget);
            }
            return;
        }
        if (action === 'open-link') {
            const href = contextLinkHref;
            const linkTarget = contextLinkTarget;
            hideContextMenu();
            if (!href) return;
            if (linkTarget && linkTarget !== '_self') {
                window.open(href, linkTarget);
            } else {
                window.location.href = href;
            }
        }
    }

    function showContextMenu(event) {
        if (!contextMenu) return;
        hideContextMenu();
        const target = event.target;
        const openEntryEl = document.querySelector('.entry.is-open');
        const onProfileCard = Boolean(
            target.closest && target.closest('.profile-card')
        );
        const onMermaidViewport = Boolean(
            target.closest && target.closest('.mermaid-widget__viewport')
        );
        const onImageViewer = Boolean(
            target.closest && target.closest('.image-viewer')
        );
        const onModelViewer = Boolean(
            target.closest && target.closest('.intro__modelviewer')
        );
        const clickedImage = target.closest
            ? target.closest('img')
            : null;
        contextImageElement = (
            clickedImage
            && clickedImage.closest('.stage__intro')
            && !clickedImage.closest('.belt-demo')
            && !clickedImage.closest('.image-viewer')
            && !clickedImage.closest('.context-menu')
        ) ? clickedImage : null;
        contextMermaidWidget = onMermaidViewport
            ? target.closest('.mermaid-widget')
            : null;
        contextModelViewerElement = onModelViewer
            ? target.closest('.intro__modelviewer')
            : null;
        const contextStageIntro = target.closest
            ? target.closest('.stage__intro')
            : null;
        contextIntroElement = contextStageIntro || null;
        const profileCollapsed = profileCard
            ? profileCard.classList.contains('is-collapsed')
            : false;
        const selectedText = window.getSelection()
            ? window.getSelection().toString().trim()
            : '';
        const anchor = target.closest
            ? target.closest('a[href]')
            : null;
        const items = [];

        contextLinkHref = anchor ? anchor.href : '';
        contextLinkTarget = anchor ? anchor.target : '';

        if (anchor) {
            items.push({ action: 'open-link', label: '打开链接' });
        }
        if (selectedText) {
            items.push({ action: 'copy-selection', label: '复制选中文字' });
        }
        if (contextImageElement && !imageViewerState.open) {
            items.push({ action: 'image-open-viewer', label: '放大图像' });
        }
        if (imageViewerState.open && onImageViewer) {
            items.push({ action: 'image-reset-size', label: '恢复大小' });
            items.push({ action: 'image-reset-center', label: '恢复中心' });
            items.push({ action: 'image-close', label: '关闭图片' });
        }
        if (
            contextModelViewerElement
            && window.modelViewerHasModel
            && window.modelViewerHasModel(contextModelViewerElement)
        ) {
            items.push({ action: 'model-reset-view', label: '恢复视角' });
        }
        if (contextIntroElement) {
            const introScroller = getIntroActiveScroller(contextIntroElement);
            if (
                introScroller
                && introScroller.scrollTop > 12
                && introScroller.scrollHeight
                    > introScroller.clientHeight + 8
            ) {
                items.push({
                    action: 'back-to-intro-top',
                    label: '回到顶端'
                });
            }
        }
        if (openEntryEl) {
            items.push({ action: 'close-entry', label: '收起当前作品' });
        }
        if (
            contextMermaidWidget
            && contextMermaidWidget.querySelector('.mermaid-widget__graph svg')
        ) {
            items.push({ action: 'mermaid-reset-size', label: '恢复大小' });
            items.push({ action: 'mermaid-reset-center', label: '恢复中心' });
        }
        if (onProfileCard) {
            items.push({
                action: 'toggle-profile',
                label: profileCollapsed ? '展开窗口' : '折叠窗口'
            });
            items.push({ action: 'reset-profile', label: '重置位置' });
        }
        if (openEntryEl || activeIndex > 0) {
            items.push({ action: 'back-to-top', label: '回到首页' });
        }
        items.push({ action: 'refresh-page', label: '刷新页面' });
        /* items.push({ action: 'go-home', label: '返回主页' }); */

        let lastSpecialIndex = -1;
        items.forEach(function (item, index) {
            if (
                item.action === 'image-open-viewer'
                || item.action === 'image-reset-size'
                || item.action === 'image-reset-center'
                || item.action === 'image-close'
                || item.action === 'mermaid-reset-size'
                || item.action === 'mermaid-reset-center'
                || item.action === 'toggle-profile'
                || item.action === 'reset-profile'
                || item.action === 'model-reset-view'
            ) {
                lastSpecialIndex = index;
            }
        });
        if (lastSpecialIndex >= 0 && lastSpecialIndex < items.length - 1) {
            items.splice(lastSpecialIndex + 1, 0, { divider: true });
        }

        contextMenu.textContent = '';
        items.forEach(function (item) {
            if (item.divider) {
                const divider = document.createElement('div');
                divider.className = 'context-menu__divider';
                divider.setAttribute('role', 'separator');
                contextMenu.appendChild(divider);
                return;
            }
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('role', 'menuitem');
            button.dataset.contextAction = item.action;
            button.textContent = item.label;
            contextMenu.appendChild(button);
        });

        contextMenu.classList.add('is-open');
        contextMenu.setAttribute('aria-hidden', 'false');
        const rect = contextMenu.getBoundingClientRect();
        const margin = 4;
        const left = Math.min(
            Math.max(event.clientX, margin),
            window.innerWidth - rect.width - margin
        );
        const top = Math.min(
            Math.max(event.clientY, margin),
            window.innerHeight - rect.height - margin
        );
        contextMenu.style.left = left + 'px';
        contextMenu.style.top = top + 'px';
    }

    if (profileBar) {
        profileBar.addEventListener('pointerdown', handleProfilePointerDown);
        profileBar.addEventListener('pointermove', handleProfilePointerMove);
        profileBar.addEventListener('pointerup', handleProfilePointerEnd);
        profileBar.addEventListener('pointercancel', handleProfilePointerEnd);
        profileBar.addEventListener('click', function () {
            if (profileSuppressClick) {
                profileSuppressClick = false;
                return;
            }
            toggleProfileCollapsed();
        });
    }

    if (contextMenu) {
        contextMenu.addEventListener('click', function (event) {
            const button = event.target.closest('[data-context-action]');
            if (!button) return;
            runContextMenuAction(button.dataset.contextAction);
        });
    }

    document.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        showContextMenu(event);
    });

    if (
        window.matchMedia
        && window.matchMedia('(pointer: coarse)').matches
    ) {
        document.addEventListener('dblclick', function (event) {
            event.preventDefault();
            showContextMenu(event);
        });
    }

    document.addEventListener('pointerdown', function (event) {
        if (!contextMenu || !contextMenu.classList.contains('is-open')) return;
        if (!contextMenu.contains(event.target)) {
            hideContextMenu();
        }
    }, true);

    document.addEventListener('wheel', hideContextMenu, { passive: true });
    document.addEventListener('scroll', hideContextMenu, true);
    window.addEventListener('blur', hideContextMenu);
    window.addEventListener('resize', function () {
        hideContextMenu();
        clampProfilePosition();
        refreshProfileCollapsedWidth();
    });

    /* user-select: none 区域不会主动取消浏览器选区，
        这里在任意位置按下左键/手指时统一清除非空选区。
        右键菜单内部除外，避免点“复制选中文字”前先丢选区。 */
    document.addEventListener('pointerdown', function (event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const target = event.target;
        if (target.closest && target.closest('.context-menu')) return;
        const selection = window.getSelection
            ? window.getSelection()
            : null;
        if (selection && !selection.isCollapsed) {
            selection.removeAllRanges();
        }
    }, true);

    /* Edge 在选中文字后会弹迷你菜单并切走光标；
       这里保留选区，但拦掉释放鼠标的默认行为来避免弹出。 */
    if (/Edg\//.test(window.navigator.userAgent)) {
        document.addEventListener('mouseup', function (event) {
            const selection = window.getSelection
                ? window.getSelection()
                : null;
            if (selection && selection.toString().trim()) {
                event.preventDefault();
            }
        });
    }

    (function initProfileCard() {
        if (!profileCard) return;
        profileReady = true;
        clampProfilePosition();
        refreshProfileCollapsedWidth();
        profileCard.addEventListener('transitionend', function (event) {
            if (event.target === profileCard && event.propertyName === 'width') {
                clampProfilePosition();
            }
        });
        if (profileBar) {
            profileBar.setAttribute('aria-expanded', 'false');
        }
        setProfileCovered(false);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(refreshProfileCollapsedWidth);
        }
    }());

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            if (contextMenu && contextMenu.classList.contains('is-open')) {
                hideContextMenu();
                return;
            }
            const openEntryEl = document.querySelector('.entry.is-open');
            if (openEntryEl) {
                closeEntry(openEntryEl);
            }
        }
    });
})();
