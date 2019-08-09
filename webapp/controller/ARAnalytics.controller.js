/*global THREE TWEEN*/
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
	"use strict";

	return Controller.extend("webxr-ui5.controller.ARAnalytics", {

		createdSpheres: [],
		currentColor: 0,
		currentTimeSerieIndex: 0,

		onInit() {
			this.arView = this.byId("arView");

			// load spheres data from JSON model
			var carModel = new JSONModel();
			carModel.loadData("data/carData.json");
			carModel.attachRequestCompleted(function () {
				const spheresData = carModel.getData();
				const metaData = spheresData.metaData;
				var viewModel = new JSONModel();
				viewModel.setProperty("/tooltips", metaData.timeSeries);
				this.getView().setModel(viewModel);
				const sizeAndDimensions = spheresData.items.map((item) => this.mapDataToSizeAndDimension(item, metaData));
				console.log(sizeAndDimensions);
				this.createdSpheres = sizeAndDimensions.map(this.createSphere.bind(this));

				this.arView.attachSelect(function(oEvent) {
					this.onSphereSelected(oEvent, metaData)
				}.bind(this));
			}.bind(this));

		},

		mapDataToSizeAndDimension(sphereData, metaData) {
			const dimensionConfig = metaData.dimensionConfig;
			let sphereDataWithSizeAndDimension = { ...sphereData };
			sphereDataWithSizeAndDimension.sizeAndDimension = metaData.timeSeries.map((month) => {
				function getDimensionValue(dimension) {
					const value = sphereData[dimension][month];
					const minMax = metaData.minMax[dimension];
					return (value - minMax.min) / (minMax.max - minMax.min);
				}
				return {
					month: month,
					size: getDimensionValue(dimensionConfig.size) * 0.1,
					x: getDimensionValue(dimensionConfig.x),
					y: getDimensionValue(dimensionConfig.y),
					z: getDimensionValue(dimensionConfig.z)
				}
			});
			return sphereDataWithSizeAndDimension;
		},

		createSphere(completeSphereData) {
			const sphereData = completeSphereData.sizeAndDimension[0];
			const scene = this.arView.getScene();
			const geometry = new THREE.SphereGeometry(sphereData.size, 32, 32);
			var color = this.getFioriColor();
			const material = new THREE.MeshPhongMaterial({
				color: color,
				shininess: 0.7
			});
			const sphere = new THREE.Mesh(geometry, material);
			sphere.userData = completeSphereData;
			sphere.position.copy(new THREE.Vector3(sphereData.x, sphereData.y, sphereData.z));
			scene.add(sphere);
			return sphere;
		},

		xChanged(control) {
			this.currentTimeSerieIndex = control.getSource().getValue();
			this.createdSpheres.forEach((sphere) => {
				const sphereData = sphere.userData.sizeAndDimension[this.currentTimeSerieIndex];
				sphere.position.copy(new THREE.Vector3(sphereData.x, sphereData.y, sphereData.z));
			});
		},

		getFioriColor() {
			const fioriColors = ["#91c8f6", "#FF8888", "#FABD64", "#ABE2AB", "#D3D7D9"];
			const color = fioriColors[this.currentColor % fioriColors.length];
			this.currentColor += 1;
			return color;
		},

		onSphereSelected(oEvent, metaData) {
			var position = oEvent.getParameter('position');
			if (!position) { // de-select object
				return;
			} 
			var matches = this.createdSpheres.filter((sphere) => {
				return (JSON.stringify(sphere.position) === JSON.stringify(position));
			});
			if (matches.length > 0) {
				var carData = matches[0].userData;
				var carName = carData.name;
				var currentTimeSerie = metaData.timeSeries[this.currentTimeSerieIndex];
				var getDataFor = function(config) {
					return {
						title: config, 
						counter: parseInt(carData[config][currentTimeSerie])
					}
				};
				oEvent.getSource().setSelectedObject({
					name: carName,
					items: [
						getDataFor(metaData.dimensionConfig.size),
						getDataFor(metaData.dimensionConfig.x),
						getDataFor(metaData.dimensionConfig.y),
						getDataFor(metaData.dimensionConfig.z)
					]
				});
				oEvent.getSource().setShowInfoBox(true);
			} else {
				oEvent.getSource().setShowInfoBox(false);
			}
		}
	});
});