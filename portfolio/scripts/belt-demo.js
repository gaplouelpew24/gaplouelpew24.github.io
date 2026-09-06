(function () {
    var libraryPromise = null;
    var beltStates = new WeakMap();
    var beltDemos = [];
    var activeDrag = null;
    var KEY_DRAG_SCALE = 2;
    var ITEM_DRAG_SCALE = 1.15;
    function isBeltMobile() {
        return typeof window.matchMedia === "function"
            && window.matchMedia("(max-width: 860px)").matches;
    }
    function getDragScale(action) {
        if (isBeltMobile() && (action === "key" || action === "card")) {
            return 2;
        }
        return action === "key" ? KEY_DRAG_SCALE : ITEM_DRAG_SCALE;
    }
    var beltResizeObserver = typeof ResizeObserver === "function"
        ? new ResizeObserver(fitBeltScales)
        : null;

    function fitBeltScales() {
        var baseWidth = 48 * 16;
        beltDemos.forEach(function (demo) {
            if (!demo.isConnected) return;
            var width = Math.max(1, demo.clientWidth);
            var scale = Math.min(1, width / baseWidth);
            demo.style.setProperty("--belt-scale", String(scale));
        });
    }

    function loadMatter() {
        if (window.Matter) return Promise.resolve(window.Matter);
        if (libraryPromise) return libraryPromise;
        libraryPromise = new Promise(function (resolve, reject) {
            var script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js";
            script.async = true;
            script.onload = function () {
                if (window.Matter) {
                    resolve(window.Matter);
                } else {
                    reject(new Error("Matter.js 加载失败"));
                }
            };
            script.onerror = function () {
                libraryPromise = null;
                reject(new Error("无法加载 Matter.js"));
            };
            document.head.appendChild(script);
        });
        return libraryPromise;
    }

    function startAmmoPhysics(cell) {
        var state = beltStates.get(cell);
        if (!state || state.started || state.stopped) return;
        state.started = true;

        loadMatter()
            .then(function (Matter) {
                if (state.stopped || !cell.isConnected) return;
                var bin = cell.querySelector(".ammo-bin");
                var bullets = Array.prototype.slice.call(
                    cell.querySelectorAll(".ammo-bullet")
                );
                if (!bin || !bullets.length) return;

                var width = Math.max(30, bin.clientWidth);
                var height = Math.max(30, bin.clientHeight);
                var engine = Matter.Engine.create();
                engine.gravity.y = 1;
                engine.gravity.scale = 0.001;

                var wallOptions = {
                    isStatic: true,
                    restitution: 0.2,
                    friction: 0.5
                };
                var walls = [
                    Matter.Bodies.rectangle(width / 2, height + 12, width + 24, 24, wallOptions),
                    Matter.Bodies.rectangle(-12, height / 2, 24, height + 24, wallOptions),
                    Matter.Bodies.rectangle(width + 12, height / 2, 24, height + 24, wallOptions)
                ];
                Matter.Composite.add(engine.world, walls);

                var bodies = [];
                var bodyWidth = 15;
                var bodyHeight = 44;
                bullets.forEach(function (bullet, index) {
                    var randomX = 12 + Math.random() * (width - bodyWidth - 24);
                    var randomY = 6 + Math.random() * (height - bodyHeight - 10);
                    var body = Matter.Bodies.rectangle(
                        randomX,
                        randomY,
                        bodyWidth,
                        bodyHeight,
                        {
                            restitution: 0.2,
                            friction: 0.6,
                            frictionAir: 0.035,
                            density: 0.002,
                            angle: Math.random() * Math.PI * 2 - Math.PI
                        }
                    );
                    bodies.push(body);
                    bullet.style.width = bodyWidth + "px";
                    bullet.style.height = bodyHeight + "px";
                });
                Matter.Composite.add(engine.world, bodies);

                var running = true;
                state.stop = function () {
                    running = false;
                };

                function frame() {
                    if (state.stopped || !cell.isConnected || !running) return;
                    Matter.Engine.update(engine, 1000 / 60);
                    bodies.forEach(function (body, index) {
                        var bullet = bullets[index];
                        var angle = body.angle * 180 / Math.PI;
                        bullet.style.transform =
                            "translate3d("
                            + (body.position.x - bodyWidth / 2) + "px, "
                            + (body.position.y - bodyHeight / 2) + "px, 0) rotate("
                            + angle + "deg)";
                    });
                    state.frameId = requestAnimationFrame(frame);
                }
                state.frameId = requestAnimationFrame(frame);
            })
            .catch(function () {
                /* 物理库加载失败时只保留静态摆放 */
            });
    }

    function ensureBeltOverlay(demo) {
        return demo ? demo.querySelector(".belt-interactions") : null;
    }

    function actionForItem(item) {
        if (item.classList.contains("syringe-img")) return "syringe";
        if (item.classList.contains("keyring-card")) return "card";
        if (item.classList.contains("keyring-key")) return "key";
        return null;
    }

    function syncLockWidth(item) {
        if (!item || !item.closest) return;
        if (actionForItem(item) !== "key") return;
        var demo = item.closest(".belt-demo");
        if (!demo) return;
        var lock = demo.querySelector(".belt-interaction--lock");
        var belt = demo.querySelector(".belt");
        if (!lock || !belt) return;
        var beltRect = belt.getBoundingClientRect();
        var beltScale = belt.offsetWidth > 0
            ? beltRect.width / belt.offsetWidth
            : 1;
        var keyVisualLength =
            item.offsetHeight * beltScale * getDragScale("key");
        var oneRem =
            parseFloat(window.getComputedStyle(document.documentElement).fontSize)
            || 16;
        lock.style.width =
            (keyVisualLength * 0.6 + oneRem) + "px";
    }

    function showInteraction(overlay, action, active) {
        if (overlay._retractTimer) {
            clearTimeout(overlay._retractTimer);
            overlay._retractTimer = null;
        }
        overlay.querySelectorAll(".belt-interaction").forEach(function (widget) {
            widget.classList.remove("is-active", "is-success", "is-retracting");
        });
        if (!active) return;
        var interactionClass = {
            syringe: "arm",
            card: "reader",
            key: "lock"
        }[action];
        var widget = overlay.querySelector(
            ".belt-interaction--" + interactionClass
        );
        if (widget) widget.classList.add("is-active");
    }

    function retractInteraction(overlay, action, success) {
        var interactionClass = {
            syringe: "arm",
            card: "reader",
            key: "lock"
        }[action];
        var widget = overlay.querySelector(
            ".belt-interaction--" + interactionClass
        );
        if (!widget) return;
        clearTimeout(overlay._retractTimer);
        if (success) {
            if (action === "syringe") {
                widget.classList.remove("is-active", "is-success-step");
                void widget.offsetWidth;
                widget.classList.add("is-success", "is-retracting");
                overlay._retractTimer = setTimeout(function () {
                    overlay._retractTimer = null;
                    widget.classList.remove(
                        "is-active",
                        "is-success",
                        "is-retracting",
                        "is-success-step"
                    );
                }, 1400);
                return;
            }
            widget.classList.add("is-success", "is-success-step");
            overlay._retractTimer = setTimeout(function () {
                widget.classList.add("is-retracting");
                widget.classList.remove("is-success-step");
                overlay._retractTimer = setTimeout(function () {
                    overlay._retractTimer = null;
                    widget.classList.remove(
                        "is-active",
                        "is-success",
                        "is-retracting",
                        "is-success-step"
                    );
                }, 360);
            }, 240);
        } else {
            widget.classList.remove("is-active", "is-success-step");
            void widget.offsetWidth;
            widget.classList.add("is-retracting");
            overlay._retractTimer = setTimeout(function () {
                overlay._retractTimer = null;
                widget.classList.remove(
                    "is-active",
                    "is-success",
                    "is-retracting",
                    "is-success-step"
                );
            }, 360);
        }
    }

    function replenishItem(item) {
        var replacement = item.cloneNode(true);
        replacement.classList.remove("is-origin-hidden");
        replacement.removeAttribute("data-belt-interactive");
        item.parentNode.insertBefore(replacement, item);
        item.remove();
        bindInteractiveItem(replacement);
        replacement.dataset.interactionReady = "1";
        return replacement;
    }

    function setBeltBusy(demo, busy) {
        if (!demo) return;
        demo.dataset.beltBusy = busy ? "1" : "";
    }

    function cancelToFresh(drag, item, overlay, action) {
        retractInteraction(overlay, action, false);
        drag.classList.add("belt-drag-complete");
        var demo = item.closest(".belt-demo");
        var medCell = item.closest(".belt__cell--medkit");
        setTimeout(function () {
            drag.remove();
            item.classList.add("belt-item-leaving");
            setTimeout(function () {
                var replacement = replenishItem(item);
                if (replacement) {
                    replacement.classList.remove("belt-item-leaving");
                    replacement.classList.add("belt-item-entering");
                    replacement.dataset.interactionReady = "1";
                    setTimeout(function () {
                        replacement.classList.remove("belt-item-entering");
                    }, 300);
                }
                if (demo) demo.classList.remove("is-interacting");
                setBeltBusy(demo, false);
                if (medCell) medCell.classList.remove("is-forced-hover");
            }, 260);
        }, 250);
    }

    function returnDragToOrigin(drag, item, overlay, action) {
        var rect = item.getBoundingClientRect();
        var demo = item.closest(".belt-demo");
        var demoRect = demo ? demo.getBoundingClientRect() : { left: 0, top: 0 };
        var inner = drag.querySelector(".belt-drag__inner");
        if (inner) {
            inner.style.transition = "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)";
            var originalTransform = drag.originalTransform
                || inner.style.transform
                || "rotate(0deg)";
            inner.style.transform = originalTransform + " scale(1)";
        }
        var targetTransform = "translate3d("
            + (rect.left - demoRect.left) + "px, "
            + (rect.top - demoRect.top) + "px, 0)";
        var cleanup = function () {
            drag.remove();
            item.classList.remove("is-origin-hidden");
            item.dataset.interactionReady = "1";
            if (demo) demo.classList.remove("is-interacting");
            var medCell = item.closest(".belt__cell--medkit");
            if (medCell) medCell.classList.remove("is-forced-hover");
            retractInteraction(overlay, action, false);
        };
        var startTransform = drag.style.transform;
        if (typeof drag.animate === "function") {
            var animation = drag.animate([
                { transform: startTransform },
                { transform: targetTransform }
            ], {
                duration: 300,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)"
            });
            animation.onfinish = cleanup;
            animation.oncancel = cleanup;
        } else {
            drag.style.transition = "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
            drag.style.transform = targetTransform;
            setTimeout(cleanup, 300);
        }
    }

    function successInteraction(drag, item, overlay, action) {
        retractInteraction(overlay, action, true);
        var demo = item.closest(".belt-demo");
        setBeltBusy(demo, true);
        if (action !== "syringe") {
            drag.classList.add("belt-drag-complete");
            setTimeout(function () {
                if (drag.isConnected) drag.remove();
            }, 260);
            setTimeout(function () {
                var replacement = replenishItem(item);
                replacement.classList.add("belt-item-entering");
                replacement.dataset.interactionReady = "1";
                setTimeout(function () {
                    replacement.classList.remove("belt-item-entering");
                }, 300);
                if (demo) demo.classList.remove("is-interacting");
                setBeltBusy(demo, false);
            }, 620);
            return;
        }
        setTimeout(function () {
            if (demo) demo.classList.remove("is-interacting");
            setBeltBusy(demo, false);
        }, 340);
        drag.remove();
        var medCell = item.closest(".belt__cell--medkit");
        if (medCell) medCell.classList.remove("is-forced-hover");
        replenishItem(item);
    }

    function completeSyringeOnTouch(state) {
        if (state.completed) return;
        state.completed = true;
        activeDrag = null;
        setBeltBusy(state.demo, true);
        var busyMed = state.item.closest(".belt__cell--medkit");
        if (busyMed) busyMed.classList.remove("is-forced-hover");
        var inner = state.drag.querySelector(".belt-drag__inner");
        setTimeout(function () {
            if (inner && inner.tagName === "IMG") {
                var stack = document.createElement("div");
                stack.className = "belt-syringe-stack";
                stack.style.cssText = inner.style.cssText;
                stack.style.position = "absolute";
                stack.style.left = "0";
                stack.style.top = "0";
                stack.style.width = "100%";
                stack.style.height = "100%";

                inner.style.position = "";
                inner.style.left = "";
                inner.style.top = "";
                inner.style.width = "100%";
                inner.style.height = "100%";
                inner.style.transform = "";

                var empty = document.createElement("img");
                empty.className = "belt-syringe-empty";
                empty.removeAttribute("data-belt-interactive");
                empty.src = inner.src.replace(/syringe\.png$/, "syringe_empty.png");
                empty.style.width = "100%";
                empty.style.height = "100%";
                empty.style.objectFit = "contain";
                empty.style.opacity = "1";
                empty.style.transform = "";

                state.drag.appendChild(stack);
                stack.appendChild(inner);
                stack.appendChild(empty);
                inner.style.transition = "opacity 0.5s ease";
                empty.style.transition = "opacity 0.25s ease";
                inner.classList.add("belt-syringe-out");
                setTimeout(function () {
                    empty.classList.add("belt-syringe-empty-out");
                }, 500);
            }
            setTimeout(function () {
                successInteraction(
                    state.drag,
                    state.item,
                    state.overlay,
                    state.action
                );
            }, 750);
        }, 200);
    }

    function bindInteractiveItem(item) {
        if (item.dataset.beltInteractive) return;
        item.dataset.beltInteractive = "true";
        var action = actionForItem(item);
        if (!action) return;
        item.addEventListener("pointerenter", function () {
            if (action === "syringe") return;
            if (activeDrag) return;
            var demo = item.closest(".belt-demo");
            if (!demo || demo.dataset.beltBusy === "1") return;
            var overlay = ensureBeltOverlay(demo);
            if (!overlay) return;
            clearTimeout(demo._beltHoverTimer);
            demo._beltHoverItem = item;
            item.dataset.interactionReady = "0";
            if (action === "key") syncLockWidth(item);
            showInteraction(overlay, action, true);
            demo.classList.add("is-interacting");
            setTimeout(function () {
                if (!item.dataset.beltInteractive) return;
                item.dataset.interactionReady = "1";
            }, 300);
        });
        item.addEventListener("pointerleave", function () {
            if (action === "syringe") return;
            if (activeDrag) return;
            var demo = item.closest(".belt-demo");
            if (!demo) return;
            clearTimeout(demo._beltHoverTimer);
            item.dataset.interactionReady = "0";
            demo._beltHoverTimer = setTimeout(function () {
                if (!demo || activeDrag) return;
                if (demo._beltHoverItem && demo._beltHoverItem !== item) return;
                demo._beltHoverItem = null;
                var overlay = ensureBeltOverlay(demo);
                if (!overlay) return;
                retractInteraction(overlay, action, false);
                setTimeout(function () {
                    demo.classList.remove("is-interacting");
                }, 360);
            }, 220);
        });
        item.addEventListener("pointerdown", function (event) {
            if (event.button !== 0 || activeDrag) return;
            event.preventDefault();
            event.stopPropagation();
            var busyDemo = item.closest(".belt-demo");
            if (busyDemo && busyDemo.dataset.beltBusy === "1") return;
            if (action === "syringe") {
                var medCell = item.closest(".belt__cell--medkit");
                if (medCell) medCell.classList.add("is-forced-hover");
            }

            var demo = item.closest(".belt-demo");
            if (!demo) return;
            var overlay = ensureBeltOverlay(demo);
            var belt = demo.querySelector(".belt");
            if (!belt || !overlay) return;
            var beltRect = belt.getBoundingClientRect();
            var beltScale = belt.offsetWidth > 0
                ? beltRect.width / belt.offsetWidth
                : 1;
            var itemWidth = item.offsetWidth * beltScale;
            var itemHeight = item.offsetHeight * beltScale;
            if (action === "card" && !isBeltMobile()) {
                itemWidth *= 1.3;
                itemHeight *= 1.3;
            }
            var demoRect = demo.getBoundingClientRect();
            var drag = document.createElement("div");
            drag.className = "belt-drag";
            drag.style.width = itemWidth + "px";
            drag.style.height = itemHeight + "px";
            drag.style.left = "0px";
            drag.style.top = "0px";
            var inner = item.cloneNode(true);
            inner.removeAttribute("data-belt-interactive");
            inner.className = item.className + " belt-drag__inner";
            inner.style.width = "100%";
            inner.style.height = "100%";
            var startRotation = action === "card" ? -90 : 0;
            inner.style.transition = "none";
            var originalTransform = window.getComputedStyle(inner).transform;
            drag.originalTransform = window.getComputedStyle(item).transform;
            inner.style.transform =
            (originalTransform && originalTransform !== "none"
                ? originalTransform
                : "none") +
            " scale(0.45)";
            drag.appendChild(inner);
            drag.style.transform = "translate3d("
                + (event.clientX - demoRect.left - itemWidth / 2) + "px, "
                + (event.clientY - demoRect.top - itemHeight / 2) + "px, 0)";
            demo.appendChild(drag);
            item.classList.add("is-origin-hidden");
            if (action === "syringe") {
                inner.style.transition = "none";
                inner.style.transform = "rotate(0deg) scale(1.15)";
            }
            if (action === "key") syncLockWidth(item);
            showInteraction(overlay, action, true);
            demo.classList.add("is-interacting");

            activeDrag = {
                item: item,
                drag: drag,
                inner: inner,
                overlay: overlay,
                action: action,
                startX: event.clientX,
                startY: event.clientY,
                rotation: startRotation,
                startRotation: startRotation,
                pullAnimating: action !== "syringe",
                width: itemWidth,
                height: itemHeight,
                dragScale: getDragScale(action),
                belt: belt,
                beltScale: beltScale,
                demo: demo,
                locked: false,
                inserted: false,
                canComplete: false,
                completed: false,
                success: false,
                keyPhase: "approach",
                keyInsertProgress: 0,
                keyTurnProgress: 0,
                keyVisibleRatio: 0.4,
                keySnapAnimating: false
            };
            var dragState = activeDrag;
            if (action !== "syringe") {

    requestAnimationFrame(function () {

        inner.style.transition =
            "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)";

        inner.style.transform =
            "scale(" + dragState.dragScale + ")";

    });

    setTimeout(function () {

        dragState.pullAnimating = false;

        inner.style.transition = "none";

    }, 260);
}
        });
    }

    function bindMedkitHover(cell) {
        if (cell.dataset.beltMedkitHover) return;
        cell.dataset.beltMedkitHover = "true";
        cell.addEventListener("pointerenter", function () {
            if (activeDrag) return;
            var demo = cell.closest(".belt-demo");
            if (!demo || demo.dataset.beltBusy === "1") return;
            var overlay = ensureBeltOverlay(demo);
            cell.dataset.interactionReady = "0";
            cell.dataset.medkitHovering = "true";
            if (overlay) showInteraction(overlay, "syringe", true);
            demo.classList.add("is-interacting");
            setTimeout(function () {
                if (cell.dataset.medkitHovering) {
                    cell.dataset.interactionReady = "1";
                }
            }, 300);
        });
        cell.addEventListener("pointerleave", function () {
            if (activeDrag) return;
            var demo = cell.closest(".belt-demo");
            if (!demo || demo.dataset.beltBusy === "1") return;
            cell.dataset.interactionReady = "0";
            cell.dataset.medkitHovering = "";
            var overlay = ensureBeltOverlay(demo);
            if (overlay) retractInteraction(overlay, "syringe", false);
            setTimeout(function () {
                demo.classList.remove("is-interacting");
            }, 360);
        });
    }

        function updateActiveDrag(event) {
        if (!activeDrag) return;
        var state = activeDrag;
        var demoRect = state.demo.getBoundingClientRect();
        var x = event.clientX - demoRect.left - state.width / 2;
        var y = event.clientY - demoRect.top - state.height / 2;
        var transform = "translate3d(" + x + "px, " + y + "px, 0)";
        var rotation = state.rotation;
        var scaleY = 1;
        state.drag.style.transform = transform;
        if (state.pullAnimating) return;
        state.canComplete = false;

        if (state.action === "syringe") {
            var armRect = state.overlay.querySelector(".belt-interaction--arm").getBoundingClientRect();
            var armDistance = Math.hypot(
                event.clientX - (armRect.left + armRect.width * 0.42),
                event.clientY - (armRect.top + armRect.height * 0.4)
            );
            var armProgress = armDistance <= 8
                ? 1
                : Math.max(0, 1 - (armDistance - 8) / 360);
            rotation = armProgress * 180;
        } else if (state.action === "card" && !state.locked) {
            var readerRect = state.overlay.querySelector(".belt-interaction--reader").getBoundingClientRect();
            var cardDistance = Math.hypot(
                event.clientX - (readerRect.left + readerRect.width / 2),
                event.clientY - (readerRect.top + readerRect.height / 2)
            );
            var cardProgress = Math.max(0, Math.min(1, 1 - cardDistance / 360));
            rotation = -cardProgress * 90;
        } else if (state.action === "key" && !state.locked) {
            var keyCore = state.overlay.querySelector(".lock-core");
            if (keyCore) {
                var kc = keyCore.getBoundingClientRect();
                var keyDistance = Math.hypot(
                    event.clientX - (kc.left + kc.width / 2),
                    event.clientY - (kc.top + kc.height / 2)
                );
                var keyApproach = Math.max(
                    0,
                    Math.min(1, 1 - keyDistance / 320)
                );
                rotation = -90 * keyApproach;
            }
        } else if (state.action === "key" && state.locked) {
            rotation = -90;
            var lock = state.overlay.querySelector(".belt-interaction--lock");
            var lockTrack = lock ? lock.querySelector(".lock-track") : null;
            if (!lockTrack) return;
            var lt = lockTrack.getBoundingClientRect();
            var visualLength = state.height * state.dragScale;
            var lockTrackStyle = window.getComputedStyle(lockTrack);
            var handleRatio =
                parseFloat(
                    lockTrackStyle.getPropertyValue("--key-visible-ratio")
                ) || 0.4;
            var mouthX = lt.left;
            var centerStart = mouthX - visualLength / 2;
            var centerEnd =
                mouthX + visualLength * (0.5 - handleRatio);
            var centerY = lt.top + lt.height / 2;
            var centerX;
            if (state.inserted) {
                centerX = centerEnd;
            } else {
                centerX = Math.max(
                    centerStart,
                    Math.min(centerEnd, event.clientX)
                );
                state.keyInsertProgress =
                    (centerX - centerStart) /
                    (centerEnd - centerStart);
                if (state.keyInsertProgress >= 1) {
                    state.inserted = true;
                }
            }
            x = centerX - demoRect.left - state.width / 2;
            y = centerY - demoRect.top - state.height / 2;
            transform = "translate3d(" + x + "px, " + y + "px, 0)";
            if (state.inserted) {
                var pullStartY = lt.bottom + 8;
                var pullRange =
                    parseFloat(
                        lockTrackStyle.getPropertyValue("--key-pull-distance")
                    ) || Math.max(64, state.height * 0.7);
                var pullDistance = Math.max(
                    0,
                    event.clientY - pullStartY
                );
                state.keyTurnProgress = Math.max(
                    0,
                    Math.min(1, pullDistance / pullRange)
                );
                if (state.keyTurnProgress >= 1) {
                    state.canComplete = true;
                }
            } else {
                state.keyTurnProgress = 0;
            }
        } else if (state.action === "card" && state.locked) {
            rotation = -90;
            var reader = state.overlay.querySelector(".belt-interaction--reader");
            var cardTrack = reader ? reader.querySelector(".reader-track") : null;
            if (!cardTrack) return;
            if (state.drag.parentNode !== cardTrack) {
                cardTrack.appendChild(state.drag);
            }
            var ct = cardTrack.getBoundingClientRect();
            var readerStyle = window.getComputedStyle(reader);
            var startInset = parseFloat(
                readerStyle.getPropertyValue("--card-slide-start")
            ) || 0;
            var endInset = parseFloat(
                readerStyle.getPropertyValue("--card-slide-end")
            ) || 0;
            var yOffset = parseFloat(
                readerStyle.getPropertyValue("--card-slide-y")
            ) || 0;
            var slotCenter = Math.max(
                startInset,
                Math.min(ct.width - endInset, event.clientX - ct.left)
            );
            x = slotCenter - state.width / 2;
            y = (cardTrack.offsetHeight - state.height) / 2 + yOffset;
            transform = "translate3d(" + x + "px, " + y + "px, 0)";
            if (slotCenter >= ct.width - endInset) {
                state.canComplete = true;
            }
        }

        state.drag.style.transform = transform;
        if (state.action === "key" && state.locked) {
            var keyTurn = state.keyTurnProgress || 0;
            state.inner.style.transform =
                "rotate(-90deg) perspective(440px) rotateY("
                + (keyTurn * 180)
                + "deg) scale(" + state.dragScale + ")";
        } else {
            state.inner.style.transform =
                "rotate(" + rotation + "deg) scale("
                + state.dragScale + ", "
                + (state.dragScale * scaleY) + ")";
        }

        if (!state.locked && state.action === "card") {
            var readerHit = state.overlay.querySelector(".belt-interaction--reader").getBoundingClientRect();
            if (
                event.clientX > readerHit.left
                && event.clientX < readerHit.right
                && event.clientY > readerHit.top
                && event.clientY < readerHit.bottom
            ) {
                state.locked = true;
            }
        } else if (!state.locked && state.action === "key") {
            var keyHitCore = state.overlay.querySelector(".lock-core");
            var keyHitRect = keyHitCore
                ? keyHitCore.getBoundingClientRect()
                : { left: 0, right: 0, top: 0, bottom: 0 };
            var keyHitSpan = state.height * state.dragScale;
            if (
                event.clientX > keyHitRect.left - keyHitSpan * 0.5 - 10
                && event.clientX < keyHitRect.right + 10
                && event.clientY > keyHitRect.top - keyHitSpan * 0.55
                && event.clientY < keyHitRect.bottom + keyHitSpan * 0.55
            ) {
                state.locked = true;
            }
        } else if (!state.locked && state.action === "syringe") {
            var armHit = state.overlay.querySelector(".belt-interaction--arm").getBoundingClientRect();
            if (
                event.clientX >= armHit.left
                && event.clientX <= armHit.right
                && event.clientY >= armHit.top
                && event.clientY <= armHit.bottom
            ) {
                rotation = 180;
                state.inner.style.transform = "rotate(180deg) scale(1.15)";
                state.drag.style.transform = transform;
                completeSyringeOnTouch(state);
            }
        }
        if (
            state.canComplete
            && !state.completed
            && (state.action === "key" || state.action === "card")
        ) {
            state.completed = true;
            activeDrag = null;
            successInteraction(
                state.drag,
                state.item,
                state.overlay,
                state.action
            );
            return;
        }
    }

    function endActiveDrag(event) {
        if (!activeDrag) return;
        var state = activeDrag;
        if (state.canComplete) {
            successInteraction(state.drag, state.item, state.overlay, state.action);
            activeDrag = null;
            return;
        }
        activeDrag = null;
        cancelToFresh(state.drag, state.item, state.overlay, state.action);
    }
function stopAmmoPhysics(cell) {
        var state = beltStates.get(cell);
        if (!state) return;
        state.stopped = true;
        if (state.frameId) {
            cancelAnimationFrame(state.frameId);
        }
        if (state.stop) {
            state.stop();
        }
    }

    window.initBeltDemo = function (root) {
        if (!root) return;
        root.querySelectorAll(".belt-demo-host").forEach(function (host) {
            if (host.dataset.beltLoaded) return;
            host.dataset.beltLoaded = "true";
            fetch("components/belt-dev.html", { cache: "no-store" })
                .then(function (response) {
                    if (!response.ok) throw new Error("Belt component load failed");
                    return response.text();
                })
                .then(function (html) {
                    var template = document.createElement("template");
                    template.innerHTML = html;
                    var belt = template.content.querySelector(".belt-demo");
                    if (belt) {
                        var beltHtml = belt.innerHTML.split('="../').join('="');
                        host.innerHTML = beltHtml;
                        window.initBeltDemo(host);
                    }
                })
                .catch(function () {
                    host.textContent = "战术腰带组件加载失败";
                });
        });

        root.querySelectorAll(".belt-demo").forEach(function (demo) {
            if (beltDemos.indexOf(demo) === -1) {
                beltDemos.push(demo);
                ensureBeltOverlay(demo);
                if (beltResizeObserver) {
                    beltResizeObserver.observe(demo);
                }
                fitBeltScales();
            }
        });

        root.querySelectorAll(".belt__cell--ammo").forEach(function (cell) {
            if (beltStates.has(cell)) return;
            var state = {
                started: false,
                stopped: false,
                frameId: 0,
                stop: null
            };
            beltStates.set(cell, state);
            startAmmoPhysics(cell);
            cell.addEventListener("pointerenter", function () {
                startAmmoPhysics(cell);
            });
        });

        root.querySelectorAll(".syringe-img, .keyring-key, .keyring-card")
            .forEach(bindInteractiveItem);
        root.querySelectorAll(".belt__cell--medkit").forEach(bindMedkitHover);
    };

    window.resetBeltDemo = function (root) {
        if (!root) return;
        root.querySelectorAll(".belt__cell--ammo").forEach(function (cell) {
            var state = beltStates.get(cell);
            if (!state) return;
            stopAmmoPhysics(cell);
            state.stopped = false;
            state.started = false;
            startAmmoPhysics(cell);
        });
    };

    window.addEventListener("resize", fitBeltScales);
    document.addEventListener("pointermove", updateActiveDrag);
    document.addEventListener("pointerup", endActiveDrag);
    document.addEventListener("pointercancel", endActiveDrag);
}());
