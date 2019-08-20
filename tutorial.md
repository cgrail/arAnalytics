# Develop an Augmented Reality Analytics app with SAP UI5 and WebXR

## Step 1: Open SAP Web IDE

https://www.sap.com/developer/topics/sap-webide.html

## Step 2: Clone Git Repository into SAP Web IDE

https://github.com/cgrail/arAnalytics

## Step 3: Install WebXR Viewer on your iPhone/iPad

https://itunes.apple.com/us/app/webxr-viewer/id1295998056

## Step 4: Run the app on your Desktop and WebXR Viewer

Open “index.html”
Press “run“ button

Expected behavior:

You should see a UI5 application with lines for the x,y and z axis. With your mouse you can navigate through the 3D space.

## Step 5: Create Sphere in space

Open the file ```ARAnalytics``` which contains the controller of our main view.

Path: ```webapp/controller/ARAnalytics.controller.js```

Create the method ```createSphere``` which creates a sphere at a given location.

```javascript
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
```

Create the method ```onAfterRendering``` which is called once the app has been rendered and create a sphere at the 3D location x: 0, y: 0 and z: 0 with a size of 0.1. WebXR is based on the metric system and therefor a size of 0.1 represents 10cm which is about 4" large.

```javascript
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
```

Open the view of the controller and add the id ```arView``` so that the controller can access the Augmented Reality control.
Path: ```webapp/view/ARAnalytics.view.xml```

```xml
<control:ArView id="arView" />
```

Now you can run the application and you will see a sphere in space at the location 0,0,0.
