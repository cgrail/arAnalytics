/*global THREE*/
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"webxr-ui5/utils/FioriColors"
], function (Controller, JSONModel, FioriColors) {
	"use strict";

	return Controller.extend("webxr-ui5.controller.ARAnalytics", {

		lookAtCameraObjects: [],
		viewModel: new JSONModel({
			sliderIndex: 0,
			selectedCar: {
				visible: false
			}
		}),

		onInit() {
			this.getView().setModel(this.viewModel);

			this.arView = this.byId("arView");
			this.arView.setUpdateCallback((() => this.updateCallback()));

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

		onPress(evt) {
			const intersectedSphere = this.getIntersectedSphere(evt.getParameters());
			this.viewModel.getProperty("/spheres").forEach(sphere => {
				const isSelectedNode = sphere === intersectedSphere;
				sphere.material.opacity = isSelectedNode ? 0.5 : 1;
				if (isSelectedNode) {
					this.showDetails(sphere.userData);
				}
			});
		},

		getIntersectedSphere(position) {
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(position, this.arView.getCamera());
			const intersects = raycaster.intersectObjects(this.viewModel.getProperty("/spheres"));
			if (intersects.length > 0) {
				return intersects[0].object;
			}
		},

		showDetails(nodeData) {
			const currentKey = this.viewModel.getProperty("/metaData/timeSeries/" + this.viewModel.getProperty("/sliderIndex"));
			const dimensions = Object.values(this.viewModel.getProperty("/metaData/dimensionConfig"));
			const nodeDetails = dimensions.map(dimension => {
				return {
					name: dimension.label,
					value: nodeData[dimension.key][currentKey],
					unit: dimension.unit
				};
			});
			this.viewModel.setProperty("/selectedCar", {
				node: nodeData,
				visible: true,
				title: nodeData.name,
				items: nodeDetails
			});
		},

		updateCallback() {
			const camera = this.arView.getCamera();
			var rotation;
			for (const textObject of this.lookAtCameraObjects) {
				if (rotation) {
					textObject.setRotationFromEuler(rotation);
				} else {
					textObject.lookAt(camera.position);
					rotation = textObject.rotation;
				}
			}
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

		createSphere(completeSphereData) {
			const sphereData = completeSphereData.sizeAndDimension[0];
			const scene = this.arView.getScene();
			const geometry = new THREE.SphereGeometry(sphereData.size, 32, 32);
			const material = new THREE.MeshPhongMaterial({
				color: FioriColors.getNextColor(),
				shininess: 0.7
			});
			const sphere = new THREE.Mesh(geometry, material);
			sphere.userData = completeSphereData;
			sphere.position.copy(new THREE.Vector3(sphereData.x, sphereData.y, sphereData.z));
			scene.add(sphere);
			return sphere;
		},

		createAxisLabels() {
			const loader = new THREE.FontLoader();
			loader.load("fonts/72_Regular.typeface.json", (font) => {
				this.createAxisLabel("x", font, 0.9, 0.05, 0);
				this.createAxisLabel("y", font, 0, 0.6, 0.05);
				this.createAxisLabel("z", font, -0.05, 0.05, 1.2);
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
			this.lookAtCameraObjects.push(textObj);
			scene.add(textObj);
			return textObj;
		},

		onTimeSliderChange(evt) {
			const sliderIndex = evt.getSource().getValue();
			this.viewModel.setProperty("/sliderIndex", sliderIndex);
			this.viewModel.getProperty("/spheres").forEach((sphere) => {
				const sphereData = sphere.userData.sizeAndDimension[sliderIndex];
				sphere.position.copy(new THREE.Vector3(sphereData.x, sphereData.y, sphereData.z));
			});
			const selectedNode = this.viewModel.getProperty("/selectedCar/node");
			if (selectedNode) {
				this.showDetails(selectedNode);
			}
		}

	});
});