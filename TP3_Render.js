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
		function traverseTree(rootNode) {
			if (rootNode.childNode.length > 0) {
				for (var i = 0; i < rootNode.childNode.length; i++) {
					var child = rootNode.childNode[i];

					// Add branches
					TP3.Render.addBranch(rootNode, child, scene, branchMaterial, radialDivisions);

					// Add leaves
					if (rootNode.a0 < alpha * leavesCutoff) {
						for (var j = 0; j < leavesDensity; j++) {
							TP3.Render.addLeaves(rootNode, child, scene, alpha, leavesCutoff, leafMaterial);
						}

						// Add Apples
						if (Math.random() < applesProbability) TP3.Render.addPomme(rootNode, scene, alpha, appleMaterial);
					}

					// Recursively draw branches for the child
					traverseTree(child);
				}
			} else {
				// No children (terminal rootNode), create a fake child at p1 to point the branch correctly
				var fakeChild = {
					p0: rootNode.p1,
					p1: new THREE.Vector3(rootNode.p1.x, rootNode.p1.y + alpha, rootNode.p1.z),
					a0: rootNode.a0,
					a1: rootNode.a1,
					childNode: []
				};

				// Process the branch for the terminal rootNode (using the fake child)
				TP3.Render.addBranch(rootNode, fakeChild, scene, branchMaterial, radialDivisions);

				for (var l = 0; l < leavesDensity; l++) {
					TP3.Render.addLeaves(rootNode, fakeChild, scene, alpha, leavesCutoff, leafMaterial);
				}
			}

		}

		// Start the recursive traversal from the root rootNode
		traverseTree(rootNode);
	},

	// Function to add the branch body
	addBranch: function(rootNode, child, scene, branchMaterial, radialDivisions) {
		// Calculate the direction and length of the branch
		var direction = new THREE.Vector3().subVectors(child.p0, rootNode.p0);
		var length = new THREE.Vector3().subVectors(rootNode.p1, rootNode.p0).length();

		// Create cylinder geometry for the branch (from a0 to a1 radius)
		var branchGeometry = new THREE.CylinderBufferGeometry(rootNode.a1, rootNode.a0, length, radialDivisions);
		// Shift the geometry so its base is at (0, 0, 0) instead of being centered
		branchGeometry.translate(0, length / 2, 0);

		var branchMesh = new THREE.Mesh(branchGeometry, branchMaterial);
		branchMesh.position.copy(rootNode.p0);

		// Make the Y-axis point towards the next branch (child rootNode)
		var up = new THREE.Vector3(0, 1, 0);
		var axis = new THREE.Vector3().crossVectors(up, direction).normalize();
		var angle = up.angleTo(direction);
		branchMesh.rotateOnAxis(axis, angle);

		// Add the branch to the scene
		scene.add(branchMesh);
	},

	// Function to add leaves to a branch
	addLeaves: function(rootNode, child, scene, alpha, leavesCutoff, leafMaterial) {

		var leafGeometry = new THREE.PlaneGeometry(alpha, alpha);
		var leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);

		// Random position along the branch (between p0 and p1)
		var t = Math.random();
		var randomPoint = new THREE.Vector3().lerpVectors(rootNode.p0, child.p0, t);

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
	},

	// Function to add apples to a branch
	addPomme: function(rootNode, scene, alpha, appleMaterial) {

		var appleGeometry = new THREE.BoxGeometry(alpha, alpha, alpha);
		var appleMesh = new THREE.Mesh(appleGeometry, appleMaterial);

		appleMesh.position.copy(rootNode.p0);

		// Add a little variability in position so that the apple is not exactly in the center
		appleMesh.position.x += (Math.random() - 0.5) * alpha;
		appleMesh.position.y += (Math.random() - 0.5) * alpha;
		appleMesh.position.z += (Math.random() - 0.5) * alpha;

		scene.add(appleMesh);

	},

	// Function to add leaves to a branch
	addLeavesHermite: function(node, child, leavesGeometries, alpha) {
		// Create a triangular geometry
		const triangleGeometry = new THREE.BufferGeometry();

		// Define the vertices for an equilateral triangle
		const vertices = new Float32Array([
			0, alpha / 2, 0,                      // Top vertex
			-alpha / 2, -alpha / 2, 0,            // Left vertex
			alpha / 2, -alpha / 2, 0              // Right vertex
		]);

		triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		triangleGeometry.computeVertexNormals();

		// Random position along the branch between p0 and p1
		const t = Math.random();
		const randomPoint = new THREE.Vector3().lerpVectors(node.p0, child.p0, t);

		// Random offset within a radius of alpha / 2
		const offset = new THREE.Vector3(
			(Math.random() - 0.5) * alpha,
			(Math.random() - 0.5) * alpha,
			(Math.random() - 0.5) * alpha
		);
		offset.clampLength(0, alpha / 2); // Ensure the offset is within the radius

		// Final position with the offset applied
		randomPoint.add(offset);

		triangleGeometry.rotateX(Math.random() * Math.PI);
		triangleGeometry.rotateY(Math.random() * Math.PI);
		triangleGeometry.rotateZ(Math.random() * Math.PI);

		// Apply the position
		triangleGeometry.translate(randomPoint.x, randomPoint.y, randomPoint.z);

		// Add the triangle to the list
		leavesGeometries.push(triangleGeometry);
	},

	// Function to add apples to a branch
	addPommeHermite: function(node, appleGeometries, alpha) {
		const sphereGeometry = new THREE.SphereBufferGeometry(alpha / 2, 16, 16);

		// Position each sphere randomly
		const positionX = node.p0.x + (Math.random() - 0.5) * alpha;
		const positionY = node.p0.y +(Math.random() - 0.5) * alpha;
		const positionZ = node.p0.z +(Math.random() - 0.5) * alpha;

		// Move the sphere to the desired position
		sphereGeometry.translate(positionX, positionY, positionZ);

		// Add sphere geometry to the list
		appleGeometries.push(sphereGeometry);
	},

	drawBody: function (node, scene, alpha, leavesCutoff, leavesDensity, applesProbability, branchList = [], appleGeometries = [], leavesGeometries = []) {

		const indexList = [];
		const vertices = [];
		const indices = [];
		let currentIdx = 0;

		// Process points for vertices and indices
		for (let i = 0; i < node.sections.length; i++) {
			const subIndexList = [];

			// Add vertices for all sections
			for (let j = 0; j < node.sections[i].length; j++) {
				const point = node.sections[i][j];
				vertices.push(point.x, point.y, point.z);
				subIndexList.push(currentIdx);
				currentIdx++;
			}
			indexList.push(subIndexList);
		}

		// Create faces between sections
		if (node.childNode.length < 2) {
			for (let segmentIndex = 0; segmentIndex < node.sections.length - 1; segmentIndex++) {
				const currentSection = indexList[segmentIndex];
				const nextSection = indexList[segmentIndex + 1];

				for (let k = 0; k < currentSection.length; k++) {
					const j = k;
					const jp1 = (j + 1) % currentSection.length;
					// First triangle (ensure proper order for outward-facing normals)
					indices.push(currentSection[jp1],  nextSection[j], currentSection[j]);
					// Second triangle (ensure proper order for outward-facing normals)
					indices.push(	nextSection[jp1], nextSection[j], currentSection[jp1]);
				}
			}
		} else {
			for (let segmentIndex = 0; segmentIndex < node.sections.length - 2; segmentIndex++) {
				const currentSection = indexList[segmentIndex];
				const nextSection = indexList[segmentIndex + 1];

				for (let k = 0; k < currentSection.length; k++) {
					const j = k;
					const jp1 = (j + 1) % currentSection.length;
					// First triangle (ensure proper order for outward-facing normals)
					indices.push(currentSection[jp1],  nextSection[j], currentSection[j]);
					// Second triangle (ensure proper order for outward-facing normals)
					indices.push(	nextSection[jp1], nextSection[j], currentSection[jp1]);
				}
			}
			const lastSection = indexList[indexList.length - 2];
			const firstChildNode = node.childNode[0];
			const firstChildSection = [];

			// Add first section vertices of the child
			for (let j = 0; j < firstChildNode.sections[0].length; j++) {
				const point = firstChildNode.sections[0][j];
				vertices.push(point.x, point.y, point.z);
				firstChildSection.push(currentIdx);
				currentIdx++;
			}

			for (let k = 0; k < lastSection.length; k++) {
				const j = k;
				const jp1 = (j + 1) % lastSection.length;

				// First triangle (ensure proper order for outward-facing normals)
				indices.push(lastSection[jp1], firstChildSection[j], lastSection[j]);
				// Second triangle (ensure proper order for outward-facing normals)
				indices.push(firstChildSection[jp1], firstChildSection[j], lastSection[jp1]);
			}
		}


		// Create branch geometry
		const branchBuffer = new THREE.BufferGeometry();
		branchBuffer.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
		branchBuffer.setIndex(indices);
		branchBuffer.computeVertexNormals();
		branchList.push(branchBuffer);

		if (node.childNode.length > 0) {
			for (var i = 0; i < node.childNode.length; i++) {
				var child = node.childNode[i];

				// Add leaves
				if (node.a0 < alpha * leavesCutoff) {
					for (var j = 0; j < leavesDensity; j++) {
						TP3.Render.addLeavesHermite(node, child, leavesGeometries, alpha);
					}

					// Add Apples
					if (Math.random() < applesProbability) this.addPommeHermite(node, appleGeometries, alpha);
				}
			}
		} else {
			// No children (terminal rootNode), create a fake child at p1 to point the branch correctly
			var fakeChild = {
				p0: node.p1,
				p1: new THREE.Vector3(node.p1.x, node.p1.y + alpha, node.p1.z),
				a0: node.a0,
				a1: node.a1,
				childNode: []
			};

			for (var l = 0; l < leavesDensity; l++) {
				TP3.Render.addLeavesHermite(node, fakeChild, leavesGeometries, alpha);
			}
		}

		// Traverse child nodes
		if (node.childNode && Array.isArray(node.childNode)) {
			for (const childNode of node.childNode) {
				this.drawBody(childNode, scene, alpha, leavesCutoff, leavesDensity, applesProbability, branchList, appleGeometries, leavesGeometries);
			}
		}

	},

	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {

		const branchList = [];
		const appleGeometries = [];
		const leavesGeometries = [];

		// Draw tree body
		this.drawBody(rootNode, scene, alpha, leavesCutoff, leavesDensity, applesProbability, branchList, appleGeometries, leavesGeometries);

		// Merge and add geometries
		const mergedBranches = THREE.BufferGeometryUtils.mergeBufferGeometries(branchList);
		const branchMesh = new THREE.Mesh(mergedBranches, new THREE.MeshLambertMaterial({ color: 0x8B5A2B }))
		scene.add(branchMesh);

		// Leave Mesh
		//console.log(leavesGeometries)
		const mergedLeaves = THREE.BufferGeometryUtils.mergeBufferGeometries(leavesGeometries);
		const leaveMesh = new THREE.Mesh(mergedLeaves, new THREE.MeshLambertMaterial({ color: 0x3A5F0B, side: THREE.DoubleSide }))
		scene.add(leaveMesh);

		// Apple Mesh
		const combinedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(appleGeometries);
		const appleMesh = new THREE.Mesh(combinedGeometry, new THREE.MeshPhongMaterial({ color: 0xFF0000 }));
		scene.add(appleMesh);

		return [branchMesh, leaveMesh, appleMesh];
	},

	updateTreeHermite: function (trunkGeometryBuffer, leavesGeometryBuffer, applesGeometryBuffer, rootNode) {
		//TODO
	},

	drawTreeSkeleton: function (rootNode, scene, color = 0xffffff, matrix = new THREE.Matrix4()) {
		console.log(rootNode)

		let child = 0;
		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0 ) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

			child++;
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
		console.log(rootNode)
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