
// Function to add the branch body
function addBranch(node, child, scene, branchMaterial, radialDivisions) {
	// Calculate the direction and length of the branch
	var direction = new THREE.Vector3().subVectors(child.p0, node.p0);
	var length = new THREE.Vector3().subVectors(node.p1, node.p0).length();

	// Create cylinder geometry for the branch (from a0 to a1 radius)
	var branchGeometry = new THREE.CylinderBufferGeometry(node.a1, node.a0, length, radialDivisions);
	// Shift the geometry so its base is at (0, 0, 0) instead of being centered
	branchGeometry.translate(0, length / 2, 0);

	var branchMesh = new THREE.Mesh(branchGeometry, branchMaterial);
	branchMesh.position.copy(node.p0);

	// Make the Y-axis point towards the next branch (child node)
	var up = new THREE.Vector3(0, 1, 0);
	var axis = new THREE.Vector3().crossVectors(up, direction).normalize();
	var angle = up.angleTo(direction);
	branchMesh.rotateOnAxis(axis, angle);

	// Add the branch to the scene
	scene.add(branchMesh);
}

// Function to add leaves to a branch
function addLeaves(node, child, scene, alpha, leavesCutoff, leafMaterial) {

	var leafGeometry = new THREE.PlaneGeometry(alpha, alpha);
	var leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);

	// Random position along the branch (between p0 and p1)
	var t = Math.random();
	var randomPoint = new THREE.Vector3().lerpVectors(node.p0, child.p0, t);

	// Random displacement within a radius of alpha/2
	var offset = new THREE.Vector3(
		(Math.random() - 0.5) * alpha,
		(Math.random() - 0.5) * alpha,
		(Math.random() - 0.5) * alpha
	);
	offset.clampLength(0, alpha / 2); // Ensure that the displacement is within the radius

	// Final position
	randomPoint.add(offset);
	leafMesh.position.copy(randomPoint);

	// Random rotation
	leafMesh.rotation.set(
		Math.random() * Math.PI,
		Math.random() * Math.PI,
		Math.random() * Math.PI
	);

	scene.add(leafMesh);
}

// Function to add apples to a branch
function addPomme(node, scene, alpha, appleMaterial) {

	var appleGeometry = new THREE.BoxGeometry(alpha, alpha, alpha);
	var appleMesh = new THREE.Mesh(appleGeometry, appleMaterial);

	appleMesh.position.copy(node.p0);

	// Add a little variability in position so that the apple is not exactly in the center
	appleMesh.position.x += (Math.random() - 0.5) * alpha;
	appleMesh.position.y += (Math.random() - 0.5) * alpha;
	appleMesh.position.z += (Math.random() - 0.5) * alpha;

	scene.add(appleMesh);

}

TP3.Render = {
	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		//TODO
		// Material for branches
		var branchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
		// Material for leaves
		var leafMaterial = new THREE.MeshPhongMaterial({ color: 0x3A5F0B, side: THREE.DoubleSide });
		// Material for apples
		var appleMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });

		// Recursive function to traverse the tree and draw branches
		function traverseTree(node) {
			if (node.childNode.length > 0) {
				for (var i = 0; i < node.childNode.length; i++) {
					var child = node.childNode[i];

					// Add branches
					addBranch(node, child, scene, branchMaterial, radialDivisions);

					// Add leaves
					if (node.a0 < alpha * leavesCutoff) {
						for (var j = 0; j < leavesDensity; j++) {
							addLeaves(node, child, scene, alpha, leavesCutoff, leafMaterial);
						}

						// Add Apples
						if (Math.random() < applesProbability) addPomme(node, scene, alpha, appleMaterial);
					}

					// Recursively draw branches for the child
					traverseTree(child);
				}
			} else {
				// No children (terminal node), create a fake child at p1 to point the branch correctly
				var fakeChild = {
					p0: node.p1,
					p1: new THREE.Vector3(node.p1.x, node.p1.y + alpha, node.p1.z),
					a0: node.a0,
					a1: node.a1,
					childNode: []
				};

				// Process the branch for the terminal node (using the fake child)
				addBranch(node, fakeChild, scene, branchMaterial, radialDivisions);

				for (var l = 0; l < leavesDensity; l++) {
					addLeaves(node, fakeChild, scene, alpha, leavesCutoff, leafMaterial);
				}
			}

		}

		// Start the recursive traversal from the root node
		traverseTree(rootNode);
	},

	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		//TODO
	},

	updateTreeHermite: function (trunkGeometryBuffer, leavesGeometryBuffer, applesGeometryBuffer, rootNode) {
		//TODO
	},

	drawTreeSkeleton: function (rootNode, scene, color = 0xffffff, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({ color: color });
		var line = new THREE.LineSegments(geometry, material);
		line.applyMatrix4(matrix);
		scene.add(line);

		return line.geometry;
	},

	updateTreeSkeleton: function (geometryBuffer, rootNode) {

		var stack = [];
		stack.push(rootNode);

		var idx = 0;
		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}
			geometryBuffer[idx * 6] = currentNode.p0.x;
			geometryBuffer[idx * 6 + 1] = currentNode.p0.y;
			geometryBuffer[idx * 6 + 2] = currentNode.p0.z;
			geometryBuffer[idx * 6 + 3] = currentNode.p1.x;
			geometryBuffer[idx * 6 + 4] = currentNode.p1.y;
			geometryBuffer[idx * 6 + 5] = currentNode.p1.z;

			idx++;
		}
	},


	drawTreeNodes: function (rootNode, scene, color = 0x00ff00, size = 0.05, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.PointsMaterial({ color: color, size: size });
		var points = new THREE.Points(geometry, material);
		points.applyMatrix4(matrix);
		scene.add(points);

	},


	drawTreeSegments: function (rootNode, scene, lineColor = 0xff0000, segmentColor = 0xffffff, orientationColor = 0x00ff00, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];
		var pointsS = [];
		var pointsT = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			const segments = currentNode.sections;
			for (var i = 0; i < segments.length - 1; i++) {
				points.push(TP3.Geometry.meanPoint(segments[i]));
				points.push(TP3.Geometry.meanPoint(segments[i + 1]));
			}
			for (var i = 0; i < segments.length; i++) {
				pointsT.push(TP3.Geometry.meanPoint(segments[i]));
				pointsT.push(segments[i][0]);
			}

			for (var i = 0; i < segments.length; i++) {

				for (var j = 0; j < segments[i].length - 1; j++) {
					pointsS.push(segments[i][j]);
					pointsS.push(segments[i][j + 1]);
				}
				pointsS.push(segments[i][0]);
				pointsS.push(segments[i][segments[i].length - 1]);
			}
		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var geometryS = new THREE.BufferGeometry().setFromPoints(pointsS);
		var geometryT = new THREE.BufferGeometry().setFromPoints(pointsT);

		var material = new THREE.LineBasicMaterial({ color: lineColor });
		var materialS = new THREE.LineBasicMaterial({ color: segmentColor });
		var materialT = new THREE.LineBasicMaterial({ color: orientationColor });

		var line = new THREE.LineSegments(geometry, material);
		var lineS = new THREE.LineSegments(geometryS, materialS);
		var lineT = new THREE.LineSegments(geometryT, materialT);

		line.applyMatrix4(matrix);
		lineS.applyMatrix4(matrix);
		lineT.applyMatrix4(matrix);

		scene.add(line);
		scene.add(lineS);
		scene.add(lineT);

	}
}