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
					TP3.Render.addBranch(node, child, scene, branchMaterial, radialDivisions);

					// Add leaves
					if (node.a0 < alpha * leavesCutoff) {
						for (var j = 0; j < leavesDensity; j++) {
							TP3.Render.addLeaves(node, child, scene, alpha, leavesCutoff, leafMaterial);
						}

						// Add Apples
						if (Math.random() < applesProbability) TP3.Render.addPomme(node, scene, alpha, appleMaterial);
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
				TP3.Render.addBranch(node, fakeChild, scene, branchMaterial, radialDivisions);

				for (var l = 0; l < leavesDensity; l++) {
					TP3.Render.addLeaves(node, fakeChild, scene, alpha, leavesCutoff, leafMaterial);
				}
			}

		}

		// Start the recursive traversal from the root node
		traverseTree(rootNode);
	},

	// Function to add the branch body
	addBranch: function(node, child, scene, branchMaterial, radialDivisions) {
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
	},

	// Function to add leaves to a branch
	addLeaves: function(node, child, scene, alpha, leavesCutoff, leafMaterial) {

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
	},

	// Function to add apples to a branch
	addPomme: function(node, scene, alpha, appleMaterial) {

		var appleGeometry = new THREE.BoxGeometry(alpha, alpha, alpha);
		var appleMesh = new THREE.Mesh(appleGeometry, appleMaterial);

		appleMesh.position.copy(node.p0);

		// Add a little variability in position so that the apple is not exactly in the center
		appleMesh.position.x += (Math.random() - 0.5) * alpha;
		appleMesh.position.y += (Math.random() - 0.5) * alpha;
		appleMesh.position.z += (Math.random() - 0.5) * alpha;

		scene.add(appleMesh);

	},

	// Function to add leaves to a branch
	addLeavesHermite: function(node, child, scene, alpha, leavesCutoff, leafMaterial) {

		var triangleGeometry = new THREE.BufferGeometry();
		var vertices = new Float32Array([
			0, alpha / 2, 0,
			-alpha / 2, -alpha / 2, 0,
			alpha / 2, -alpha / 2, 0
		]);
		triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		triangleGeometry.computeVertexNormals();

		var leafMesh = new THREE.Mesh(triangleGeometry, leafMaterial);

		// Random position along the branch (between p0 and p1)
		var t = Math.random();
		var randomPoint = new THREE.Vector3().lerpVectors(node.p0, child.p0, t);

		// Random displacement within a radius of alpha/2
		var offset = new THREE.Vector3(
			(Math.random() - 0.5) * alpha,
			(Math.random() - 0.5) * alpha,
			(Math.random() - 0.5) * alpha
		);
		offset.clampLength(0, alpha / 2); // Asegurar que el desplazamiento esté dentro del radio

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
	addPommeHermite: function(node, scene, alpha, appleMaterial) {

		// Create spherical geometry for the apple
		var appleGeometry = new THREE.SphereBufferGeometry(alpha / 2, 16, 16);
		var appleMesh = new THREE.Mesh(appleGeometry, appleMaterial);

		// Set the initial position of the apple to the node's position
		appleMesh.position.copy(node.p0);

		// Add a little variability in position so that the apple is not exactly in the center
		appleMesh.position.x += (Math.random() - 0.5) * alpha;
		appleMesh.position.y += (Math.random() - 0.5) * alpha;
		appleMesh.position.z += (Math.random() - 0.5) * alpha;

		// Add the apple mesh to the scene
		scene.add(appleMesh);
	},

	drawBody: function (rootNode, scene, branchMaterial) {
		let segments = rootNode.sections.length;
		let sidesNumber = rootNode.sections[0].length;

		// Variable pour contrôler combien de segments sont dessinés pour faire des tests.
		let maxSegmentsToDraw = Math.min(4, segments);

		for (let segmentIndex = 0; segmentIndex < maxSegmentsToDraw; segmentIndex++) {

			for (let k = 0; k < sidesNumber; k++) {
				let j = k % sidesNumber;
				let jp1 = (j + 1) % sidesNumber;

				// Premier triangle (ordre des sommets corrigé pour des normales orientées vers l'extérieur).
				let vertices = [];
				let p1 = new THREE.Vector3(rootNode.sections[segmentIndex][j].x, rootNode.sections[segmentIndex][j].y, rootNode.sections[segmentIndex][j].z);
				let p2 = new THREE.Vector3(rootNode.sections[segmentIndex + 1][j].x, rootNode.sections[segmentIndex + 1][j].y, rootNode.sections[segmentIndex + 1][j].z);
				let p3 = new THREE.Vector3(rootNode.sections[segmentIndex][jp1].x, rootNode.sections[segmentIndex][jp1].y, rootNode.sections[segmentIndex][jp1].z);

				// Changer l'ordre des sommets pour que la normale pointe vers l'extérieur.
				vertices.push(p1.x, p1.y, p1.z, p3.x, p3.y, p3.z, p2.x, p2.y, p2.z);
				let geometry = this.createGeometry(vertices);
				let trunkMesh = new THREE.Mesh(geometry, branchMaterial);
				scene.add(trunkMesh);

				// Deuxième triangle (ordre des sommets corrigé pour des normales orientées vers l'extérieur).
				vertices = [];
				let t2 = p2;
				let t3 = p3;

				p1 = t3;
				p2 = t2;
				p3 = new THREE.Vector3(rootNode.sections[segmentIndex + 1][jp1].x, rootNode.sections[segmentIndex + 1][jp1].y, rootNode.sections[segmentIndex + 1][jp1].z);

				// Changer l'ordre des sommets pour que la normale pointe vers l'extérieur.
				vertices.push(p1.x, p1.y, p1.z, p3.x, p3.y, p3.z, p2.x, p2.y, p2.z);
				geometry = this.createGeometry(vertices);
				trunkMesh = new THREE.Mesh(geometry, branchMaterial);
				scene.add(trunkMesh);
			}
		}

		// Connecter le dernier segment du nœud actuel avec le deuxième segment de chaque enfant.
		if (rootNode.childNode && rootNode.childNode.length > 0) {

			rootNode.childNode.forEach((child) => {
				// Dessiner la connexion entre le dernier segment du nœud actuel et le deuxième segment de l'enfant.
				for (let k = 0; k < sidesNumber; k++) {
					let j = k % sidesNumber;
					let jp1 = (j + 1) % sidesNumber;

					let vertices = [];
					// Dernier segment du nœud actuel.
					let p1 = new THREE.Vector3(rootNode.sections[segments - 1][j].x, rootNode.sections[segments - 1][j].y, rootNode.sections[segments - 1][j].z);
					// Deuxième segment de l'enfant.
					let p2 = new THREE.Vector3(child.sections[1][j].x, child.sections[1][j].y, child.sections[1][j].z);
					let p3 = new THREE.Vector3(rootNode.sections[segments - 1][jp1].x, rootNode.sections[segments - 1][jp1].y, rootNode.sections[segments - 1][jp1].z);

					// Changer l'ordre des sommets pour que la normale pointe vers l'extérieur.
					vertices.push(p1.x, p1.y, p1.z, p3.x, p3.y, p3.z, p2.x, p2.y, p2.z);
					let geometry = this.createGeometry(vertices);
					let trunkMesh = new THREE.Mesh(geometry, branchMaterial);
					scene.add(trunkMesh);

					// Deuxième triangle pour la connexion.
					vertices = [];
					let t2 = p2;
					let t3 = p3;

					p1 = t3;
					p2 = t2;
					p3 = new THREE.Vector3(child.sections[1][jp1].x, child.sections[1][jp1].y, child.sections[1][jp1].z);

					// Changer l'ordre des sommets pour que la normale pointe vers l'extérieur.
					vertices.push(p1.x, p1.y, p1.z, p3.x, p3.y, p3.z, p2.x, p2.y, p2.z);
					geometry = this.createGeometry(vertices);
					trunkMesh = new THREE.Mesh(geometry, branchMaterial);
					scene.add(trunkMesh);
				}
			});
		}
	},


	createGeometry: function (vertices) {
		// Helper function to create geometry
		let f32vertices = new Float32Array(vertices);
		let geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(f32vertices, 3));
		geometry.setIndex([0, 1, 2]); // Triangle indices
		geometry.computeVertexNormals();
		return geometry;
	},

	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		// Create the material for the trunk
		let branchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
		var leafMaterial = new THREE.MeshPhongMaterial({ color: 0x3A5F0B, side: THREE.DoubleSide });
		var appleMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });

		// Recursive function to traverse nodes and draw branches
		const traverseAndDraw = (node) => {
			if (!node) return;

			// Draw the current node's body
			this.drawBody(node, scene, branchMaterial);
			if (node.childNode.length > 0) {
				for (var i = 0; i < node.childNode.length; i++) {
					var child = node.childNode[i];

					// Add leaves
					if (node.a0 < alpha * leavesCutoff) {
						for (var j = 0; j < leavesDensity; j++) {
							TP3.Render.addLeavesHermite(node, child, scene, alpha, leavesCutoff, leafMaterial);
						}

						// Add Apples
						if (Math.random() < applesProbability) TP3.Render.addPommeHermite(node, scene, alpha, appleMaterial);
					}
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
				TP3.Render.addBranch(node, fakeChild, scene, branchMaterial, radialDivisions);

				for (var l = 0; l < leavesDensity; l++) {
					TP3.Render.addLeaves(node, fakeChild, scene, alpha, leavesCutoff, leafMaterial);
				}
			}

			// Traverse and draw child nodes recursively
			if (node.childNode) {
				for (let child of node.childNode) {
					traverseAndDraw(child); // Recursively traverse all child nodes
				}
			}
		};

		// Start traversal from the root node
		traverseAndDraw(rootNode);
	},


	updateTreeHermite: function (trunkGeometryBuffer, leavesGeometryBuffer, applesGeometryBuffer, rootNode) {
		//TODO
	},

	drawTreeSkeleton: function (rootNode, scene, color = 0xffffff, matrix = new THREE.Matrix4()) {
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