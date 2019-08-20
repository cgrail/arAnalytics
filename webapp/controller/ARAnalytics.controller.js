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
			this.arView.setUpdateCallback((() => this.updateCallback()));
			this.getView().setModel(this.viewModel);

			fetch("data/carData.json")
				.then(result => result.json())
				.then(carData => {
					const metaData = carData.metaData;
					const sizeAndDimensions = carData.items.map((item) => this.mapDataToSizeAndDimension(item, metaData));
					const spheres = sizeAndDimensions.map((sphereData) => this.createSphere(sphereData));
					this.viewModel.setProperty("/metaData", metaData);
					this.viewModel.setProperty("/spheres", spheres);
					this.createAxisLabels();
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
		},

		createAxisLabels() {
			const loader = new THREE.FontLoader();
			loader.load("fonts/72_Regular.typeface.json", (font) => {
				this.xAxisLabel = this.createAxisLabel("x", font, 0.9, 0.05, 0);
				this.yAxisLabel = this.createAxisLabel("y", font, 0, 0.6, 0.05);
				this.zAxisLabel = this.createAxisLabel("z", font, -0.05, 0.05, 1.2);
			});
		},

		createAxisLabel(dimension, font, x, y, z) {
			const text = this.viewModel.getProperty(`/metaData/dimensionConfig/${dimension}/label`);
			const scene = this.arView.getScene();
			const textGeometry = new THREE.TextGeometry(text, {
				font: font,
				size: 0.07,
				height: 0.01,
				curveSegments: 3
			});
			const textMaterial = new THREE.MeshPhongMaterial({
				color: new THREE.Color("grey")
			});
			const textObj = new THREE.Mesh(textGeometry, textMaterial);
			textObj.position.set(x, y, z);
			scene.add(textObj);
			return textObj;
		},

		updateCallback() {
			if (!this.xAxisLabel) {
				return;
			}
			this.xAxisLabel.lookAt(this.arView.getCamera().position);
			this.yAxisLabel.setRotationFromEuler(this.xAxisLabel.rotation);
			this.zAxisLabel.setRotationFromEuler(this.xAxisLabel.rotation);
		},

		onTimeSliderChange(evt) {
			const sliderIndex = evt.getSource().getValue();
			this.viewModel.setProperty("/sliderIndex", sliderIndex);
			this.viewModel.getProperty("/spheres").forEach((sphere) => {
				const sphereData = sphere.userData.sizeAndDimension[sliderIndex];
				sphere.position.copy(new THREE.Vector3(sphereData.x, sphereData.y, sphereData.z));
			});
		},

		onPress(evt) {
			const intersectedSphere = this.getIntersectedSphere(evt.getParameters());
			this.viewModel.getProperty("/spheres").forEach(sphere => {
				const isSelectedNode = sphere === intersectedSphere;
				sphere.material.opacity = isSelectedNode ? 0.5 : 1;
			});
		},

		getIntersectedSphere(position) {
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(position, this.arView.getCamera());
			const intersects = raycaster.intersectObjects(this.viewModel.getProperty("/spheres"));
			if (intersects.length > 0) {
				return intersects[0].object;
			}
		}

	});
});