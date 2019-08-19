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

		onAfterRendering: function () {

			if (this.arViewInitialized) {
				return;
			}
			this.arViewInitialized = true;

			var that = this;
			var container;
			var renderer, camera, scene;

			const fireMousePress = (event) => {
				var mousePos = new THREE.Vector2();
				mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
				mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
				var raycaster = new THREE.Raycaster();
				// update the picking ray with the camera and mouse position
				raycaster.setFromCamera(mousePos, camera);
				// calculate objects intersecting the picking ray
				var intersects = raycaster.intersectObjects(scene.children);
				for (var i = 0; i < intersects.length; i++) {
					if (intersects[i].object.type === "Mesh") {
						this.firePress({
							uuid: intersects[i].object.uuid
						});
						break;
					}
				}
			};
			document.addEventListener("mousedown", (event) => {
				fireMousePress(event);
			});
			document.addEventListener("touchstart", (event) => {
				fireMousePress(event);
			});

			const update = () => {
				const updateCallback = this.getUpdateCallback();
				if (updateCallback) {
					updateCallback();
				}
			};

			function init(displays) {
				container = document.createElement("div");
				document.body.appendChild(container);

				scene = new THREE.Scene();
				camera = displays ? new THREE.PerspectiveCamera() : new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1,
					1000);
				var axesHelper = new THREE.AxesHelper(2);
				scene.add(axesHelper);
				scene.add(camera);
				that.setCamera(camera);
				that.setScene(scene);
				renderer = new THREE.WebGLRenderer({
					alpha: true,
					antialias: true
				});
				renderer.setSize(window.innerWidth - 5, window.innerHeight - 30);
				container.appendChild(renderer.domElement);

				var pointLight = new THREE.PointLight(0xFFFFFF, 0.8);
				camera.add(pointLight);

				var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
				scene.add(ambientLight);

				// set cemera position
				camera.position.set(-3, 1, 1);

				if (displays) {
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
			}
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