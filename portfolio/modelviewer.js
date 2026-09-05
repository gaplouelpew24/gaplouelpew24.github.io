(function () {
    var libraryPromise = null;
    var viewerStates = new WeakMap();

    function getModelviewerLibs() {
        if (libraryPromise) return libraryPromise;
        libraryPromise = new Promise(function (resolve, reject) {
            if (window.__modelViewerLibs) {
                resolve(window.__modelViewerLibs);
                return;
            }

            function onReady() {
                if (window.__modelViewerLibs) {
                    resolve(window.__modelViewerLibs);
                } else {
                    reject(new Error("Model Viewer 模块加载失败"));
                }
            }

            window.addEventListener("modelviewer-libs-ready", onReady, { once: true });

            var script = document.createElement("script");
            script.type = "module";
            script.textContent =
                "import * as THREE from 'three';"
                + "import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';"
                + "import { OrbitControls } from 'three/addons/controls/OrbitControls.js';"
                + "window.__modelViewerLibs = { THREE: THREE, FBXLoader: FBXLoader, OrbitControls: OrbitControls };"
                + "window.dispatchEvent(new CustomEvent('modelviewer-libs-ready'));";
            script.onerror = function () {
                reject(new Error("无法加载 Three.js / FBXLoader"));
            };
            document.head.appendChild(script);
        });
        return libraryPromise;
    }

    function setNotice(container, message) {
        var notice = container.querySelector(".modelviewer__notice");
        if (!notice) return;
        if (message) {
            notice.hidden = false;
            notice.textContent = message;
        } else {
            notice.hidden = true;
        }
    }

    function resetViewer(state, animate) {
        if (!state || !state.loaded) return;
        if (animate === false) {
            state.camera.position.copy(state.initialPosition);
            state.controls.target.copy(state.initialTarget);
            state.controls.update();
            return;
        }
        if (state.resetAnimationId) {
            cancelAnimationFrame(state.resetAnimationId);
            state.resetAnimationId = 0;
        }
        var startPosition = state.camera.position.clone();
        var startTarget = state.controls.target.clone();
        var startTime = performance.now();
        var duration = 620;

        function frame(now) {
            var raw = Math.min((now - startTime) / duration, 1);
            var eased = raw < 0.5
                ? 4 * raw * raw * raw
                : 1 - Math.pow(-2 * raw + 2, 3) / 2;
            state.camera.position.lerpVectors(
                startPosition,
                state.initialPosition,
                eased
            );
            state.controls.target.lerpVectors(
                startTarget,
                state.initialTarget,
                eased
            );
            state.controls.update();
            if (raw < 1) {
                state.resetAnimationId = requestAnimationFrame(frame);
            } else {
                state.resetAnimationId = 0;
            }
        }
        state.resetAnimationId = requestAnimationFrame(frame);
    }

    function createViewer(container, modelPath) {
        if (viewerStates.has(container)) {
            resetViewer(viewerStates.get(container));
            return;
        }

        var notice = document.createElement("div");
        notice.className = "modelviewer__notice";
        container.appendChild(notice);
        var loading = document.createElement("div");
        loading.className = "component-loading";
        container.appendChild(loading);
        function removeLoadingWithFade() {
            if (loading.parentNode !== container) return;
            loading.classList.add("is-leaving");
            setTimeout(function () {
                loading.remove();
            }, 380);
        }
        setNotice(container, "正在加载 Three.js / FBX…");

        var state = {
            container: container,
            renderer: null,
            scene: null,
            camera: null,
            controls: null,
            loaded: false,
            initialPosition: null,
            initialTarget: null,
            animationId: 0,
            resetAnimationId: 0,
            disposed: false,
            resizeObserver: null,
            loadingElement: loading
        };
        viewerStates.set(container, state);

        getModelviewerLibs()
            .then(function (libs) {
                if (!container.isConnected) {
                    viewerStates.delete(container);
                    return;
                }
                var THREE = libs.THREE;
                var width = Math.max(1, container.clientWidth);
                var height = Math.max(1, container.clientHeight);

                var renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true
                });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                renderer.setSize(width, height);
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                container.appendChild(renderer.domElement);
                state.renderer = renderer;

                function resizeRenderer() {
                    if (!state.container.isConnected || state.disposed) return;
                    var width = Math.max(1, state.container.clientWidth);
                    var height = Math.max(1, state.container.clientHeight);
                    renderer.setSize(width, height);
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                }

                var scene = new THREE.Scene();
                scene.background = new THREE.Color(0x16181c);
                scene.add(new THREE.AmbientLight(0xffffff, 1.4));

                var grid = new THREE.GridHelper(4, 24, 0x39414d, 0x242a33);
                grid.rotation.x = Math.PI / 2;
                scene.add(grid);

                var axisPoints = [
                    new THREE.Vector3(0, 0, -2.6),
                    new THREE.Vector3(0, 0, 2.6)
                ];
                var axisGeometry = new THREE.BufferGeometry().setFromPoints(axisPoints);
                var axisMaterial = new THREE.LineBasicMaterial({
                    color: 0x69798c,
                    transparent: true,
                    opacity: 0.75
                });
                scene.add(new THREE.Line(axisGeometry, axisMaterial));

                var keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
                keyLight.position.set(3, 5, 4);
                scene.add(keyLight);

                var rimLight = new THREE.DirectionalLight(0x9db8ff, 1.1);
                rimLight.position.set(-4, -1, -3);
                scene.add(rimLight);
                state.scene = scene;

                var camera = new THREE.PerspectiveCamera(48, width / height, 0.01, 2000);
                camera.up.set(0, 0, 1);
                state.camera = camera;

                var controls = new libs.OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.08;
                controls.enablePan = false;
                controls.enableZoom = true;
                controls.minDistance = 0.5;
                controls.maxDistance = 80;
                controls.target.set(0, 0, 0);
                state.controls = controls;

                if (typeof ResizeObserver === "function") {
                    state.resizeObserver = new ResizeObserver(resizeRenderer);
                    state.resizeObserver.observe(state.container);
                }
                resizeRenderer();

                var loader = new libs.FBXLoader();
                setNotice(container, "正在加载模型…");
                loader.load(
                    modelPath,
                    function (model) {
                        if (!container.isConnected) return;

                        model.position.set(0, 0, 0);
                        model.scale.set(1, 1, 1);
                        model.updateMatrixWorld(true);

                        var box = new THREE.Box3();
                        model.traverse(function (child) {
                            if (!child.isMesh || !child.geometry) return;
                            child.geometry.computeBoundingBox();
                            var meshBox = child.geometry.boundingBox
                                .clone()
                                .applyMatrix4(child.matrixWorld);
                            box.union(meshBox);
                        });

                        if (box.isEmpty()) {
                            setNotice(container, "模型里没有可显示的网格");
                            return;
                        }

                        var center = box.getCenter(new THREE.Vector3());
                        var size = box.getSize(new THREE.Vector3());
                        var maxDim = Math.max(size.x, size.y, size.z, 0.001);
                        var unit = 1 / maxDim;

                        model.scale.setScalar(unit);
                        model.position.set(
                            -center.x * unit,
                            -center.y * unit,
                            -center.z * unit
                        );
                        model.traverse(function (child) {
                            if (child.isMesh) {
                                if (
                                    child.geometry
                                    && !child.geometry.attributes.normal
                                ) {
                                    child.geometry.computeVertexNormals();
                                }
                                child.material = new THREE.MeshStandardMaterial({
                                    color: 0xc3c8d1,
                                    roughness: 0.48,
                                    metalness: 0.16,
                                    side: THREE.DoubleSide
                                });
                            }
                        });
                        var rotateValues = (container.getAttribute("data-rotation") || "")
                            .split(",")
                            .map(function (part) {
                                return parseFloat(part);
                            });
                        var scaleValues = (container.getAttribute("data-scale") || "")
                            .split(",")
                            .map(function (part) {
                                return parseFloat(part);
                            });
                        var hasRotation = rotateValues.length === 3
                            && !isNaN(rotateValues[0])
                            && !isNaN(rotateValues[1])
                            && !isNaN(rotateValues[2]);
                        var hasScale = scaleValues.length === 3
                            && !isNaN(scaleValues[0])
                            && !isNaN(scaleValues[1])
                            && !isNaN(scaleValues[2]);
                        var transformGroup = new THREE.Group();
                        transformGroup.rotation.set(
                            hasRotation
                                ? rotateValues[0] * Math.PI / 180
                                : 0,
                            hasRotation
                                ? rotateValues[1] * Math.PI / 180
                                : 0,
                            hasRotation
                                ? rotateValues[2] * Math.PI / 180
                                : 0
                        );
                        transformGroup.scale.set(
                            hasScale ? scaleValues[0] : 1,
                            hasScale ? scaleValues[1] : 1,
                            hasScale ? scaleValues[2] : 1
                        );
                        transformGroup.add(model);
                        scene.add(transformGroup);

                        camera.position.set(2.4, 1.8, 2.6);
                        controls.target.set(0, 0, 0);
                        controls.update();
                        var initialDistance = camera.position.distanceTo(
                            controls.target
                        );
                        controls.minDistance = initialDistance / 5;
                        controls.maxDistance = initialDistance;
                        controls.update();

                        state.loaded = true;
                        state.initialPosition = camera.position.clone();
                        state.initialTarget = new THREE.Vector3(0, 0, 0);
                        removeLoadingWithFade();
                        setNotice(container, "");
                        startLoop(state);
                    },
                    undefined,
                    function () {
                        removeLoadingWithFade();
                        setNotice(container, "模型加载失败：" + modelPath);
                    }
                );
            })
            .catch(function (error) {
                removeLoadingWithFade();
                setNotice(container, error && error.message ? error.message : String(error));
            });
    }

    function startLoop(state) {
        if (state.animationId || state.disposed) return;

        function frame() {
            if (!state.container.isConnected || state.disposed) {
                stopLoop(state);
                return;
            }
            if (state.controls) {
                state.controls.update();
            }
            if (state.renderer && state.scene && state.camera) {
                state.renderer.render(state.scene, state.camera);
            }
            state.animationId = requestAnimationFrame(frame);
        }
        state.animationId = requestAnimationFrame(frame);
    }

    function stopLoop(state) {
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = 0;
        }
        if (state.resetAnimationId) {
            cancelAnimationFrame(state.resetAnimationId);
            state.resetAnimationId = 0;
        }
        if (state.renderer) {
            state.renderer.setAnimationLoop(null);
            state.renderer.dispose();
            state.renderer = null;
        }
        if (state.resizeObserver) {
            state.resizeObserver.disconnect();
            state.resizeObserver = null;
        }
        state.disposed = true;
    }

    window.initModelViewers = function (root) {
        if (!root) return;
        root.querySelectorAll(".intro__modelviewer").forEach(function (container) {
            if (container.dataset.modelviewerBound) return;
            if (
                container.closest(".weapon-page__panel")
                && !container.closest(".weapon-page__panel.is-active")
            ) {
                return;
            }
            if (
                container.closest(".stage__intro--weapons")
                && !container.closest(".stage__intro--weapons.is-active")
            ) {
                return;
            }
            container.dataset.modelviewerBound = "true";
            var modelPath = container.getAttribute("data-model") || "";
            if (!modelPath) {
                setNotice(container, "请先在 data-model 中填写 FBX 模型路径");
                return;
            }
            createViewer(container, modelPath);
        });
    };

    window.resetModelViewers = function (root) {
        if (!root) return;
        root.querySelectorAll(".intro__modelviewer").forEach(function (container) {
            resetViewer(viewerStates.get(container));
        });
    };

    window.resetModelViewersImmediate = function (root) {
        if (!root) return;
        root.querySelectorAll(".intro__modelviewer").forEach(function (container) {
            resetViewer(viewerStates.get(container), false);
        });
    };

    window.modelViewerHasModel = function (element) {
        var container = element
            ? element.closest(".intro__modelviewer")
            : null;
        var state = container ? viewerStates.get(container) : null;
        return Boolean(state && state.loaded);
    };

    window.resetModelViewerElement = function (element) {
        var container = element
            ? element.closest(".intro__modelviewer")
            : null;
        resetViewer(container ? viewerStates.get(container) : null);
    };

    window.setModelViewerModel = function (container, modelPath) {
        if (!container || !modelPath) return;
        var state = viewerStates.get(container);
        if (state) {
            stopLoop(state);
            viewerStates.delete(container);
        }
        var oldNotice = container.querySelector(".modelviewer__notice");
        if (oldNotice) oldNotice.remove();
        var oldLoading = container.querySelector(".component-loading");
        if (oldLoading) oldLoading.remove();
        var oldCanvas = container.querySelector("canvas");
        if (oldCanvas) oldCanvas.remove();
        container.dataset.modelviewerBound = "true";
        createViewer(container, modelPath);
    };
}());
