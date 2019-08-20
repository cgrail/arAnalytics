/*global THREE*/
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"webxr-ui5/utils/FioriColors"
], function (Controller, JSONModel, FioriColors) {
	"use strict";

	return Controller.extend("webxr-ui5.controller.ARAnalytics", {

		viewModel: new JSONModel(),

		onAfterRendering() {

			this.arView = this.byId("arView");
			this.getView().setModel(this.viewModel);

			fetch("data/carData.json")
				.then(result => result.json())
				.then(carData => {
					const metaData = carData.metaData;
					const sizeAndDimensions = carData.items.map((item) => this.mapDataToSizeAndDimension(item, metaData));
					const spheres = sizeAndDimensions.map((sphereData) => this.createSphere(sphereData));
					this.viewModel.setProperty("/metaData", metaData);
					this.viewModel.setProperty("/spheres", spheres);
				});
		},

		mapDataToSizeAndDimension(sphereData, metaData) {
			const dimensionConfig = metaData.dimensionConfig;
			const sphereDataWithSizeAndDimension = Object.assign({}, sphereData);
			sphereDataWithSizeAndDimension.sizeAndDimension = metaData.timeSeries.map((month) => {
				function getDimensionValue(dimension) {
					const value = sphereData[dimension.key][month];
					const minMax = metaData.minMax[dimension.key];
					return (value - minMax.min) / (minMax.max - minMax.min);
				}
				return {
					month: month,
					size: getDimensionValue(dimensionConfig.size) * 0.1,
					x: getDimensionValue(dimensionConfig.x),
					y: getDimensionValue(dimensionConfig.y),
					z: getDimensionValue(dimensionConfig.z)
				};
			});
			return sphereDataWithSizeAndDimension;
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