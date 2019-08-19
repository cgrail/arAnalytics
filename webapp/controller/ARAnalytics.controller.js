/*global THREE*/
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
	"use strict";

	return Controller.extend("webxr-ui5.controller.ARAnalytics", {

		createdSpheres: [],
		lookAtCameraObjects: [],
		currentColor: 0,
		currentTimeSerieIndex: 0,

		onInit() {
			this.arView = this.byId("arView");
			this.arView.setUpdateCallback((() => this.updateCallback()));

			var viewModel = new JSONModel();
			viewModel.setData({
				selectedCar: {
					visible: false
				}
			});
			this.getView().setModel(viewModel);
			// load spheres data from JSON model
			var carModel = new JSONModel();
			carModel.loadData("data/carData.json");
			carModel.attachRequestCompleted(function () {
				const spheresData = carModel.getData();
				const metaData = spheresData.metaData;
				this.getView().getModel().setProperty("/metaData", metaData);
				this.createAxis(metaData);
				const sizeAndDimensions = spheresData.items.map((item) => this.mapDataToSizeAndDimension(item, metaData));
				this.createdSpheres = sizeAndDimensions.map(this.createSphere.bind(this));
			}.bind(this));
		},

		onPress(evt) {
			const clickedUuid = evt.getParameter("uuid");
			this.createdSpheres.forEach(sphere => {
				const isSelectedNode = sphere.uuid == clickedUuid;
				sphere.material.opacity = isSelectedNode ? 0.5 : 1;
				if (isSelectedNode) {
					this.showDetails(sphere.userData);
				}
			});
		},

		showDetails(nodeData) {
			const model = this.getView().getModel();
			const metaData = model.getProperty("/metaData");
			const currentKey = metaData.timeSeries[this.currentTimeSerieIndex];
			const nodeDetails = Object.values(metaData.dimensionConfig).map(dimension => {
				return {
					name: dimension.label,
					value: nodeData[dimension.key][currentKey],
					unit: dimension.unit
				}
			});
			model.setProperty("/selectedCar", {
				node: nodeData,
				visible: true,
				title: nodeData.name,
				items: nodeDetails
			});
		},

		updateCallback() {
			const camera = this.arView.getCamera();
			for (const textObject of this.lookAtCameraObjects) {
				textObject.lookAt(camera.position);
			}
		},

		mapDataToSizeAndDimension(sphereData, metaData) {
			const dimensionConfig = metaData.dimensionConfig;
			let sphereDataWithSizeAndDimension = Object.assign({}, sphereData);
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

		createAxis(metaData) {
			const scene = this.arView.getScene();
			// add coordination labels
			var loader = new THREE.FontLoader();
			loader.load("fonts/72_Regular.typeface.json", (font) => {
				var textSpriteX = this.getTextSprite("discount", font, 0.9, 0.05, 0);
				this.lookAtCameraObjects.push(textSpriteX);
				scene.add(textSpriteX);

				var textSpriteY = this.getTextSprite("customer satisfaction", font, 0, 0.6, 0.05);
				textSpriteY.rotation.y = Math.PI / 2;
				textSpriteY.rotation.z = Math.PI / 2;
				this.lookAtCameraObjects.push(textSpriteY);
				scene.add(textSpriteY);

				var textSpriteZ = this.getTextSprite("CO2 emission", font, -0.05, 0.05, 1.2);
				this.lookAtCameraObjects.push(textSpriteZ);
				textSpriteZ.rotation.y = Math.PI / 2;
				scene.add(textSpriteZ);
			});
		},

		getTextSprite(text, font, x, y, z) {
			var textGeometry = new THREE.TextGeometry(text, {
				font: font,
				size: 0.07, // 5
				height: 0.01, // 2
				curveSegments: 3 // 6
			});
			var color = new THREE.Color("grey");
			var textMaterial = new THREE.MeshPhongMaterial({
				color: color
			});
			var textObj = new THREE.Mesh(textGeometry, textMaterial);
			textObj.position.set(x, y, z);
			return textObj;
		},

		xChanged(control) {
			this.currentTimeSerieIndex = control.getSource().getValue();
			this.createdSpheres.forEach((sphere) => {
				const sphereData = sphere.userData.sizeAndDimension[this.currentTimeSerieIndex];
				sphere.position.copy(new THREE.Vector3(sphereData.x, sphereData.y, sphereData.z));
			});
			const selectedNode = this.getView().getModel().getProperty("/selectedCar/node");
			if (selectedNode) {
				this.showDetails(selectedNode);
			}
		},

		getFioriColor() {
			const fioriColors = ["#91c8f6", "#FF8888", "#FABD64", "#ABE2AB", "#D3D7D9"];
			const color = fioriColors[this.currentColor % fioriColors.length];
			this.currentColor += 1;
			return color;
		}
	});
});