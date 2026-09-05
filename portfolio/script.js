(async function () {
    const scroller = document.querySelector('.entries');
    const topHint = document.querySelector('.scroll-hint--top');
    const bottomHint = document.querySelector('.scroll-hint--bottom');
    const mobileQuery = window.matchMedia('(max-width: 860px)');

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

    function loadStageInto(body, stageFile) {
        fetch(stageFile, { cache: "no-store" })
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
                bindIntroVideos(body);
            })
            .catch(function () {
                const placeholder = makeNode("div", "placeholder");
                const note = makeNode("p", "placeholder__note");
                note.textContent = "stage 文件加载失败：" + stageFile;
                placeholder.appendChild(note);
                body.appendChild(placeholder);
            });
    }

    function makeWorkElement(work, index) {
        const article = makeNode('article', 'entry');
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
            /* 每个作品独立一个 stage HTML，按需加载 */
            body.classList.add('panel__body--stage');
            loadStageInto(body, work.stage);
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
    let switchAnimating = false;
    let activeIndex = 0;
    let wheelAccumulated = 0;
    let wheelLockUntil = 0;
    let wheelGesturedRecently = false;
    let wheelGestureIdleTimer = null;
    const entryFrameTimers = new WeakMap();
    const videoResetTimers = new WeakMap();

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
            const eyebrow = intro.querySelector('.intro__eyebrow');
            const matchingTab = stage.querySelector(
                '.stage__tab[data-intro="' + intro.dataset.intro + '"]'
            );
            if (eyebrow && matchingTab) {
                eyebrow.textContent = matchingTab.textContent.trim();
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
    }

    function updateScrollHints() {
        const hasOpenEntry = Boolean(document.querySelector('.entry.is-open'));
        const canGoUp = !hasOpenEntry && activeIndex > 0;
        const canGoDown = !hasOpenEntry && activeIndex < works.length - 1;
        if (topHint) {
            topHint.classList.toggle('is-visible', canGoUp);
        }
        if (bottomHint) {
            bottomHint.classList.toggle('is-visible', canGoDown);
        }
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
                syncEyebrowsFromTabs(tabStage);
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
                if (mobileQuery.matches && tabNav) {
                    closeMobileTabMenu(tabNav);
                }
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

    function setProfilePosition(left, top) {
        if (!profileCard) return;
        profileCard.style.left = left + 'px';
        profileCard.style.top = top + 'px';
        profileCard.style.right = 'auto';
        profileCard.style.bottom = 'auto';
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
        if (action === 'close-entry') {
            const openEntryEl = document.querySelector('.entry.is-open');
            if (openEntryEl) {
                closeEntry(openEntryEl);
            }
            hideContextMenu();
            return;
        }
        if (action === 'back-to-top') {
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
        if (openEntryEl) {
            items.push({ action: 'close-entry', label: '收起当前作品' });
        }
        if (onProfileCard) {
            items.push({
                action: 'toggle-profile',
                label: profileCollapsed ? '展开窗口' : '折叠窗口'
            });
            items.push({ action: 'reset-profile', label: '重置位置' });
        }
        if (openEntryEl || activeIndex > 0) {
            items.push({ action: 'back-to-top', label: '回到页面顶部' });
        }
        items.push({ action: 'refresh-page', label: '刷新页面' });
        /* items.push({ action: 'go-home', label: '返回主页' }); */

        contextMenu.textContent = '';
        items.forEach(function (item) {
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
    });

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
        clampProfilePosition();
        if (profileBar) {
            profileBar.setAttribute('aria-expanded', 'false');
        }
        setProfileCovered(false);
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
