/*global THREE*/
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"webxr-ui5/utils/FioriColors"
], function (Controller, JSONModel, FioriColors) {
	"use strict";

	return Controller.extend("webxr-ui5.controller.ARAnalytics", {

		onAfterRendering() {
			this.arView = this.byId("arView");
			const sphereData = {
				sizeAndDimension: [{
					x: 0,
					y: 0,
					z: 0,
					size: 0.1
				}]
			};
			this.createSphere(sphereData);
		},

		createSphere(sphereData) {
			const sizeAndDimension = sphereData.sizeAndDimension[0];
			const scene = this.arView.getScene();
			const geometry = new THREE.SphereGeometry(sizeAndDimension.size, 32, 32);
			const material = new THREE.MeshPhongMaterial({
				color: FioriColors.getNextColor(),
				shininess: 0.7
			});
			const sphere = new THREE.Mesh(geometry, material);
			sphere.userData = sphereData;
			sphere.position.copy(new THREE.Vector3(sizeAndDimension.x, sizeAndDimension.y, sizeAndDimension.z));
			scene.add(sphere);
			return sphere;
		}

	});
});