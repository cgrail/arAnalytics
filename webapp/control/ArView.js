/*global THREE */
sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";
	return Control.extend("webxr-ui5.control.ArView", {
		metadata: {
			properties: {
				"scene": "object",
				"camera": "object",
				"updateCallback": "function"
			},
			events: {
				"press": {}
			}
		},

		arViewInitialized: false,

		onAfterRendering: function () {

			if (this.arViewInitialized) {
				return;
			}
			this.arViewInitialized = true;

			var camera, scene;

			const fireMousePress = (x, y) => {
				const mousePos = new THREE.Vector2();
				mousePos.x = (x / window.innerWidth) * 2 - 1;
				mousePos.y = -(y / window.innerHeight) * 2 + 1;
				this.firePress(mousePos);
			};
			document.addEventListener("mousedown", (event) => {
				fireMousePress(event.clientX, event.clientY);
			});
			document.addEventListener("touchstart", (event) => {
				fireMousePress(event.touches[0].clientX, event.touches[0].clientY);
			});

			const init = (displays) => {
				const container = document.createElement("div");
				document.body.appendChild(container);

				scene = new THREE.Scene();
				camera = displays ? new THREE.PerspectiveCamera() : new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1,
					1000);
				const axesHelper = new THREE.AxesHelper(2);
				scene.add(axesHelper);
				scene.add(camera);
				this.setCamera(camera);
				this.setScene(scene);
				const renderer = new THREE.WebGLRenderer({
					alpha: true,
					antialias: true
				});
				renderer.setSize(window.innerWidth - 5, window.innerHeight - 30);
				container.appendChild(renderer.domElement);

				camera.add(new THREE.PointLight(0xFFFFFF, 0.8));
				scene.add(new THREE.AmbientLight(0xFFFFFF, 0.4));
				camera.position.set(-3, 1, 1);

				const getCurrentCamera = () => {
					if (renderer.vr) {
						return renderer.vr.getCamera(camera);
					}
					return camera;
				}

				const update = () => {
					const updateCallback = this.getUpdateCallback();
					if (updateCallback) {
						const currentCamera = getCurrentCamera();
						updateCallback(currentCamera.position);
					}
				};

				if (window.window.arSession) {
					renderer.vr.enabled = true;
					renderer.vr.setSession(window.window.arSession);
					renderer.setAnimationLoop(function () {
						renderer.render(scene, camera);
						update();
					});
				} else if (displays) {
					renderer.xr = new THREE.WebXRManager({}, displays, renderer, camera, scene, update);
				} else {
					// create OrbitControls
					const controls = new THREE.OrbitControls(camera, renderer.domElement);
					controls.update();

					function animate() {
						requestAnimationFrame(animate);
						update();
						renderer.render(scene, camera);
					}
					animate();
				}
			};
			if (THREE.WebXRUtils) {
				THREE.WebXRUtils.getDisplays().then(init);
			} else {
				init();
			}
		},

		renderer: function (oRm, oControl) {
			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.write(">");
			oRm.write("</div>");
		}
	});
});