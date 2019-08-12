/*global THREE */
sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/Label",
	"sap/m/List",
	"sap/m/StandardListItem"
], function (Control, Label, List, StandardListItem) {
	"use strict";
	return Control.extend("webxr-ui5.control.ArView", {
		metadata: {
			properties: {
				"scene": "any",
				"camera": "any",
				"selectedObject": "any",
				"updateCallback": "any",
				"showInfoBox": {
					type: "boolean",
					defaultValue: false
				}
			},
			aggregations: {
				_infoBox: {
					type: "sap.m.List",
					multiple: false,
					visiblity: "hidden"
				}
			},
			events: {
				"select": {} // triggered if an object is selected
			}
		},

		init: function () {
			this.setAggregation("_infoBox", new List({
				headerText: ""
			}));
		},

		setSelectedObject: function (object) {
			if (object && object.name) {
				this.getAggregation("_infoBox").setHeaderText(object.name);
				this.getAggregation("_infoBox").removeAllItems();
				if (object.items && object.items.length > 0) {
					object.items.forEach(item => {
						this.getAggregation("_infoBox").addItem(new StandardListItem(item));
					});
				}
			}
		},

		getPositionWithOffset: function (offset) {
			var dirMtx = new THREE.Matrix4();
			dirMtx.makeRotationFromQuaternion(this.getCamera().quaternion);
			var push = new THREE.Vector3(0, 0, -1.0);
			push.transformDirection(dirMtx);
			var wpVector = new THREE.Vector3();
			this.getCamera().getWorldPosition(wpVector);
			var pos = wpVector;
			pos.addScaledVector(push, offset);
			return pos;
		},

		onAfterRendering: function () {

			if (this.arViewInitialized) {
				return;
			}
			this.arViewInitialized = true;

			var that = this;
			var container;
			var renderer, camera, scene;
			var raycaster = new THREE.Raycaster();
			var mouse = new THREE.Vector2();
			var clicked = false;
			document.addEventListener("mousedown", (event) => {
				mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
				clicked = true;
			});
			document.addEventListener("touchstart", (event) => {
				mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
				mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
				clicked = true;
			});
			var selectedObject;

			function raycasting() {
				if (!clicked) {
					return;
				}
				clicked = false;
				// check if any object is selected
				if (mouse.x !== 0 && mouse.y !== 0) {
					// update the picking ray with the camera and mouse position
					raycaster.setFromCamera(mouse, camera);
					// calculate objects intersecting the picking ray
					var intersects = raycaster.intersectObjects(scene.children);
					var matched = false;
					for (var i = 0; i < intersects.length; i++) {
						if (intersects[i].object.type === "Mesh") {
							// check if a new object is selected
							if (!selectedObject || selectedObject.uuid !== intersects[i].object.uuid) {
								if (selectedObject) {
									selectedObject.material.opacity = 1; // reset last selected object 
								}
								selectedObject = intersects[i].object;
								selectedObject.material.opacity = 0.7;
								that.fireSelect({
									position: selectedObject.position.clone()
								});
							}
							matched = true;
							break;
						}
					}
					if (!matched) { // no match, need to deselect the previous sphere
						if (selectedObject) {
							selectedObject.material.opacity = 1;
							selectedObject = null;
						}
						that.fireSelect({
							position: null
						});
						that.setShowInfoBox(false);
					}
				}
			}

			var lookAtCameraObjects = [];

			const update = () => {
				raycasting();
				const updateCallback = this.getUpdateCallback();
				if (updateCallback) {
					updateCallback();
				}
			}

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

		renderer: function (oRm, oControl) { // the part creating the HTML
			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.addClass("infobox");
			oRm.writeClasses();
			oRm.write(">");
			oRm.write("<div");
			if (oControl.getShowInfoBox()) {
				oRm.addClass("slidein");
				oRm.writeClasses();
				oRm.write(">");
				oRm.renderControl(oControl.getAggregation("_infoBox"));
			}
			oRm.write("</div>");
			oRm.write("</div>");
		}
	});
});