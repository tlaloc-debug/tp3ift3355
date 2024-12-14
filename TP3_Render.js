TP3.Render = {
	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		//TODO

		// Matériel pour les branches
		var branchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
		// Matériel pour les feuilles
		var leafMaterial = new THREE.MeshPhongMaterial({ color: 0x3A5F0B, side: THREE.DoubleSide });
		// Matériel pour les pommes
		var appleMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });

		// Fonction récursive qui permet de parcourir l'arbre et de dessiner ses branches, feuilles et pommes.
		function traverseTree(rootNode) {
			if (rootNode.childNode.length > 0) {
				for (var i = 0; i < rootNode.childNode.length; i++) {
					var child = rootNode.childNode[i];

					// Ajouter une branche.
					TP3.Render.addBranch(rootNode, child, scene, branchMaterial, radialDivisions);

					// Si le rayon de départ de la branche est inférieur au seuil, ajoute des feuilles.
					if (rootNode.a0 < alpha * leavesCutoff) {
						for (var j = 0; j < leavesDensity; j++) {
							TP3.Render.addLeaves(rootNode, child, scene, alpha, leavesCutoff, leafMaterial);
						}

						// Ajoute des pommes de manière probabiliste.
						if (Math.random() < applesProbability) 
							TP3.Render.addPomme(rootNode, scene, alpha, appleMaterial);
					}

					traverseTree(child);
				}

			} else {
				// Si le nœud n'a pas d'enfant, crée un faux enfant pour dessiner correctement une branche terminale.
				var fakeChild = {
					p0: rootNode.p1,
					p1: new THREE.Vector3(rootNode.p1.x, rootNode.p1.y + alpha, rootNode.p1.z),
					a0: rootNode.a0,
					a1: rootNode.a1,
					childNode: []
				};
				TP3.Render.addBranch(rootNode, fakeChild, scene, branchMaterial, radialDivisions);

				// Ajoute des feuilles à la branche terminale.
				for (var l = 0; l < leavesDensity; l++) {
					TP3.Render.addLeaves(rootNode, fakeChild, scene, alpha, leavesCutoff, leafMaterial);
				}
			}

		}

		traverseTree(rootNode);
	},


	// Fonction auxiliaire qui crée une branche (cylindre) et l'ajoute à la scène.
	addBranch: function(rootNode, child, scene, branchMaterial, radialDivisions) {
		// Calcule le vecteur directionnel de la branche entre le nœud parent et son enfant.
		var direction = new THREE.Vector3().subVectors(child.p0, rootNode.p0);
		// Calcule la longueur de la branche entre p0 et p1 du nœud parent.
		var length = new THREE.Vector3().subVectors(rootNode.p1, rootNode.p0).length();

		// Créer une géométrie cylindrique, selon un rayon initial (a0) et final (a1), ainsi que sa longueur.
		var branchGeometry = new THREE.CylinderBufferGeometry(rootNode.a1, rootNode.a0, length, radialDivisions);
		// Translate la géométrie pour que sa base soit positionnée à l'origine (0, 0, 0).
		branchGeometry.translate(0, length / 2, 0);

		var branchMesh = new THREE.Mesh(branchGeometry, branchMaterial);
		// Positionne la branche au point de départ du nœud parent.
		branchMesh.position.copy(rootNode.p0);

		// Calculer l'axe de rotation et l'angle pour aligner la branche avec la direction souhaitée.
		var up = new THREE.Vector3(0, 1, 0);
		var axis = new THREE.Vector3().crossVectors(up, direction).normalize();
		var angle = up.angleTo(direction);
		branchMesh.rotateOnAxis(axis, angle);

		scene.add(branchMesh);
	},


	// Fonction auxiliaire qui crée une feuille (géométrie plane) et l'ajoute à la scène.
	addLeaves: function(rootNode, child, scene, alpha, leavesCutoff, leafMaterial) {
		var leafGeometry = new THREE.PlaneGeometry(alpha, alpha);
		var leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);

		// Détermine un point aléatoire le long de la branche entre rootNode.p0 et child.p0.
		var t = Math.random();
		var randomPoint = new THREE.Vector3().lerpVectors(rootNode.p0, child.p0, t);

		// Ajoute un décalage aléatoire autour de ce point pour positionner la feuille de manière naturelle.
		var offset = new THREE.Vector3(
			(Math.random() - 0.5) * alpha,
			(Math.random() - 0.5) * alpha,
			(Math.random() - 0.5) * alpha
		);
		offset.clampLength(0, alpha / 2); // Limite le décalage à un rayon de alpha/2

		// Applique le décalage au point aléatoire.
		randomPoint.add(offset);
		leafMesh.position.copy(randomPoint);

		// Applique une rotation aléatoire à la feuille pour une distribution naturelle.
		leafMesh.rotation.set(
			Math.random() * Math.PI,
			Math.random() * Math.PI,
			Math.random() * Math.PI
		);

		scene.add(leafMesh);
	},


	// Fonction auxiliaire qui crée une pomme (cube) et l'ajoute à la scène.
	addPomme: function(rootNode, scene, alpha, appleMaterial) {
		var appleGeometry = new THREE.BoxGeometry(alpha, alpha, alpha);
		var appleMesh = new THREE.Mesh(appleGeometry, appleMaterial);

		// Positionne la pomme au point de départ de la branche (rootNode.p0).
		appleMesh.position.copy(rootNode.p0);

		// Ajoute un décalage aléatoire à la position pour une distribution naturelle.
		appleMesh.position.x += (Math.random() - 0.5) * alpha;
		appleMesh.position.y += (Math.random() - 0.5) * alpha;
		appleMesh.position.z += (Math.random() - 0.5) * alpha;

		scene.add(appleMesh);

	},


	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		const branchList = [];
		const appleGeometries = [];
		const leavesGeometries = [];

		// Dessine le corps de l'arbre et collecter les géométries des branches, feuilles et pommes.
		this.drawBody(rootNode, scene, alpha, leavesCutoff, leavesDensity, applesProbability,
			branchList, appleGeometries, leavesGeometries);

		// Fusionne les géométries des branches, crée un maillage et ajoute le tout  à la scène.
		const mergedBranches = THREE.BufferGeometryUtils.mergeBufferGeometries(branchList);
		const branchMesh = new THREE.Mesh(mergedBranches, new THREE.MeshLambertMaterial({ color: 0x8B5A2B }))
		scene.add(branchMesh);

		// Fusionne les géométries des feuilles, crée un maillage et ajoute le tout  à la scène.
		const mergedLeaves = THREE.BufferGeometryUtils.mergeBufferGeometries(leavesGeometries);
		const leaveMesh = new THREE.Mesh(
			mergedLeaves, new THREE.MeshLambertMaterial({ color: 0x3A5F0B, side: THREE.DoubleSide }))
		scene.add(leaveMesh);

		// Fusionne les géométries des pommes, crée un maillage et ajoute le tout  à la scène.
		const mergedPommes = THREE.BufferGeometryUtils.mergeBufferGeometries(appleGeometries);
		const appleMesh = new THREE.Mesh(mergedPommes, new THREE.MeshPhongMaterial({ color: 0xFF0000 }));
		scene.add(appleMesh);

		return [mergedBranches, mergedLeaves, mergedPommes];
	},


	// Fonction auxiliaire génère le corp de l'arbre en utilisant des sections circulaires.
	drawBody: function (node, scene, alpha, leavesCutoff, leavesDensity, applesProbability,
						branchList=[], appleGeometries=[], leavesGeometries=[]) {
		const indexList = [];
		const vertices = [];
		const indices = [];
		let currentIdx = 0;
		node.alpha = alpha;

		// Parcourt les sections circulaires du nœud pour ajouter les sommets.
		for (let i = 0; i < node.sections.length; i++) {
			const subIndexList = [];

			// Ajoute les sommets de la section courante.
			for (let j = 0; j < node.sections[i].length; j++) {
				const point = node.sections[i][j];
				vertices.push(point.x, point.y, point.z); // Coordonnées du sommet.
				subIndexList.push(currentIdx); // Enregistre l'indice du sommet.
				currentIdx++;
			}
			indexList.push(subIndexList); // Ajoute la liste des indices de la section courante.
		}

		// Crée les faces triangulaires entre les sections.
		if (node.childNode.length < 2) {
			for (let segmentIndex = 0; segmentIndex < node.sections.length - 1; segmentIndex++) {
				const currentSection = indexList[segmentIndex];
				const nextSection = indexList[segmentIndex + 1];

				for (let k = 0; k < currentSection.length; k++) {
					const j = k;
					const jp1 = (j + 1) % currentSection.length;
					// Premier triangle (assure l'ordre correct pour des normales orientées vers l'extérieur)
					indices.push(currentSection[jp1],  nextSection[j], currentSection[j]);
					// Deuxieme triangle (assure l'ordre correct pour des normales orientées vers l'extérieur)
					indices.push(	nextSection[jp1], nextSection[j], currentSection[jp1]);
				}
			}
			if (node.childNode.length === 0) {
				const lastSection = indexList[indexList.length - 1];
				// Create triangles to close the section using the first vertex as a base
				for (let i = 1; i < lastSection.length - 1; i++) {
					indices.push(lastSection[0], lastSection[i], lastSection[i + 1]);
				}
			}

		} else {
			for (let segmentIndex = 0; segmentIndex < node.sections.length - 2; segmentIndex++) {
				const currentSection = indexList[segmentIndex];
				const nextSection = indexList[segmentIndex + 1];

				for (let k = 0; k < currentSection.length; k++) {
					const j = k;
					const jp1 = (j + 1) % currentSection.length;
					// Premier triangle (assure l'ordre correct pour des normales orientées vers l'extérieur)
					indices.push(currentSection[jp1],  nextSection[j], currentSection[j]);
					// Deuxieme triangle (assure l'ordre correct pour des normales orientées vers l'extérieur)
					indices.push(	nextSection[jp1], nextSection[j], currentSection[jp1]);
				}
			}

			const lastSection = indexList[indexList.length - 2];
			const firstChildNode = node.childNode[0];
			const firstChildSection = [];

			// Ajoute les sommets de la première section de l'enfant.
			for (let j = 0; j < firstChildNode.sections[0].length; j++) {
				const point = firstChildNode.sections[0][j];
				vertices.push(point.x, point.y, point.z);
				firstChildSection.push(currentIdx);
				currentIdx++;
			}

			// Crée des triangles entre la dernière section du nœud et la première section de l'enfant.
			for (let k = 0; k < lastSection.length; k++) {
				const j = k;
				const jp1 = (j + 1) % lastSection.length;
				// Premier triangle (assure l'ordre correct pour des normales orientées vers l'extérieur)
				indices.push(lastSection[jp1], firstChildSection[j], lastSection[j]);
				// Deuxieme triangle (assure l'ordre correct pour des normales orientées vers l'extérieur)
				indices.push(firstChildSection[jp1], firstChildSection[j], lastSection[jp1]);
			}
		}

		// Crée une géométrie pour la branche à partir des sommets et des indices, et l'ajoute à la liste.
		const branchBuffer = new THREE.BufferGeometry();
		branchBuffer.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
		branchBuffer.setIndex(indices);
		branchBuffer.computeVertexNormals();
		branchList.push(branchBuffer);

		if (node.childNode.length > 0) {
			for (var i = 0; i < node.childNode.length; i++) {
				var child = node.childNode[i];

				// Si le rayon de départ de la branche est inférieur au seuil, ajoute des feuilles.
				if (node.a0 < alpha * leavesCutoff) {
					for (var j = 0; j < leavesDensity; j++) {
						TP3.Render.addLeavesHermite(node, child, leavesGeometries, alpha);
					}

					// Ajoute des pommes de manière probabiliste.
					if (Math.random() < applesProbability) this.addPommeHermite(node, appleGeometries, alpha);
				}
			}
		} else {
			// Si le nœud n'a pas d'enfant, crée un faux enfant pour dessiner correctement une branche terminale.
			var fakeChild = {
				p0: node.p1,
				p1: new THREE.Vector3(node.p1.x, node.p1.y + alpha, node.p1.z),
				a0: node.a0,
				a1: node.a1,
				childNode: []
			};

			// Ajoute des feuilles à la branche terminale.
			for (var l = 0; l < leavesDensity; l++) {
				TP3.Render.addLeavesHermite(node, fakeChild, leavesGeometries, alpha);
			}
		}

		// Appel récursif pour dessiner les branches des enfants.
		if (node.childNode && Array.isArray(node.childNode)) {
			for (const childNode of node.childNode) {
				this.drawBody(childNode, scene, alpha, leavesCutoff, leavesDensity, applesProbability,
					branchList, appleGeometries, leavesGeometries);
			}
		}
	},


	// Fonction auxiliaire qui crée une feuille (géométrie triangulaire), en utilisant une interpolation Hermite.
	addLeavesHermite: function(node, child, leavesGeometries, alpha) {
		const triangleGeometry = new THREE.BufferGeometry();

		// Définit les sommets du triangle équilatéral.
		const vertices = new Float32Array([
			0, alpha / 2, 0,            	// Sommet supérieur
			-alpha / 2, -alpha / 2, 0,      // Sommet inférieur gauche
			alpha / 2, -alpha / 2, 0        // Sommet inférieur droit
		]);

		// Ajoute les sommets à la géométrie.
		triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		triangleGeometry.computeVertexNormals();

		// Détermine un point aléatoire le long de la branche entre rootNode.p0 et child.p0.
		const t = Math.random(); // Paramètre d'interpolation aléatoire.
		const randomPoint = new THREE.Vector3().lerpVectors(node.p0, child.p0, t);

		// Ajoute un décalage aléatoire autour de ce point pour positionner la feuille de manière naturelle.
		const offset = new THREE.Vector3(
			(Math.random() - 0.5) * alpha,
			(Math.random() - 0.5) * alpha,
			(Math.random() - 0.5) * alpha
		);
		offset.clampLength(0, alpha / 2); // Limite le décalage à un rayon de alpha/2

		// Applique le décalage au point aléatoire.
		randomPoint.add(offset);

		// Applique une rotation aléatoire à la feuille pour une distribution naturelle.
		let randomRotation = new THREE.Vector3(
			Math.random() * Math.PI,
			Math.random() * Math.PI,
			Math.random() * Math.PI);
		triangleGeometry.rotateX(randomRotation.x);
		triangleGeometry.rotateY(randomRotation.y);
		triangleGeometry.rotateZ(randomRotation.z);

		// Ajoute le centre et la rotation à la liste pour une éventuelle mise à jour future.
		triangleGeometry.translate(randomPoint.x, randomPoint.y, randomPoint.z);
		node.leaveCenters.push(new THREE.Vector3(randomPoint.x, randomPoint.y, randomPoint.z));
		node.leaveRotations.push(randomRotation);

		// Ajoute la géométrie de la feuille à la liste des feuilles.
		leavesGeometries.push(triangleGeometry);
		node.leaveList.push(triangleGeometry); // Enregistre également dans le nœud pour suivi.
	},


	// Fonction auxiliaire qui crée une pomme (sphère).
	addPommeHermite: function(node, appleGeometries, alpha) {
		const sphereGeometry = new THREE.SphereBufferGeometry(alpha / 2, 16, 16);

		// Calcule une position aléatoire pour la pomme autour du point de départ de la branche (node.p0).
		const positionX = node.p0.x + (Math.random() - 0.5) * alpha;
		const positionY = node.p0.y +(Math.random() - 0.5) * alpha;
		const positionZ = node.p0.z +(Math.random() - 0.5) * alpha;

		// Applique la position calculée à la géométrie de la pomme.
		sphereGeometry.translate(positionX, positionY, positionZ);

		// Stocke la position de la pomme dans le nœud pour une éventuelle mise à jour future.
		node.pommeCenters.push(new THREE.Vector3(positionX, positionY, positionZ));

		// Ajoute la géométrie de la pomme à la liste globale des pommes.
		appleGeometries.push(sphereGeometry);
		node.pommeList.push(sphereGeometry); // Enregistre également dans le nœud pour suivi.
	},


	updateTreeHermite: function (trunkGeometryBuffer, leavesGeometryBuffer, applesGeometryBuffer, rootNode) {
		const branchList = [];
		const pommeVector = [];
		const leaveVector = [];

		const stack = [rootNode]; // Pile pour effectuer un parcours en profondeur de l'arbre.

		while (stack.length > 0) {
			const currentNode = stack.pop(); // Récupère le nœud courant.

			// Vérifie si la matrice de transformation est valide.
			if (!(currentNode.transformMatrix instanceof THREE.Matrix4)) {
				currentNode.transformMatrix = new THREE.Matrix4();
			}
			const combinedMatrix = currentNode.transformMatrix.clone();

			// Met à jour les positions des points dans les sections du nœud.
			if (Array.isArray(currentNode.sections)) {
				for (let k = 0; k < currentNode.sections.length; k++) {
					for (let j = 0; j < currentNode.sections[k].length; j++) {
						const point = currentNode.sections[k][j];
						point.applyMatrix4(combinedMatrix);

					}
				}

			} else {
				console.log("Invalid sections format in currentNode:", currentNode);
			}

			// Met à jour les géométries des pommes du nœud.
			for (let l = 0; l < currentNode.pommeList.length; l++) {
				this.updatePommeHermite(currentNode, currentNode.pommeCenters[l], currentNode.pommeList[l],
					pommeVector, currentNode.alpha, combinedMatrix);
			}

			// Met à jour les géométries des feuilles du nœud.
			for (let l = 0; l < currentNode.leaveList.length; l++) {
				this.updateLeavesHermite(currentNode, currentNode.leaveCenters[l], currentNode.leaveRotations[l],
					currentNode.leaveList[l], leaveVector, currentNode.alpha, combinedMatrix);
			}

			// Ajoute les enfants du nœud à la pile pour un traitement ultérieur.
			stack.push(...currentNode.childNode); 
		}

		// Génère les géométries des branches mises à jour.
		this.drawBody2(rootNode, branchList);

		// Fusionne et met à jour les branches.
		const mergedBranches = THREE.BufferGeometryUtils.mergeBufferGeometries(branchList);
		const mergedBranchesPos = mergedBranches.attributes.position.array;
		for (let i = 0; i < mergedBranchesPos.length; i++) trunkGeometryBuffer[i] = mergedBranchesPos[i];

		// Fusionne et met à jour lees pommes.
		const mergedPommes = THREE.BufferGeometryUtils.mergeBufferGeometries(pommeVector);
		const mergedPommesPos = mergedPommes.attributes.position.array;
		for (let i = 0; i < mergedPommesPos.length; i++) applesGeometryBuffer[i] = mergedPommesPos[i];

		// Fusionne et met à jour les feuilles.
		const mergedLeaves = THREE.BufferGeometryUtils.mergeBufferGeometries(leaveVector);
		const mergedLeavesPos = mergedLeaves.attributes.position.array;
		for (let i = 0; i < mergedLeavesPos.length; i++) leavesGeometryBuffer[i] = mergedLeavesPos[i];

	},


	// Fonction auxiliaire génère le corp de l'arbre en utilisant des sections circulaires.
	drawBody2: function (node, branchList = []) {
		const indexList = [];
		const vertices = [];
		const indices = [];
		let currentIdx = 0;

		// Parcourt les sections circulaires du nœud pour ajouter les sommets.
		for (let i = 0; i < node.sections.length; i++) {
			const subIndexList = [];

			// Ajoute les sommets de la section courante.
			for (let j = 0; j < node.sections[i].length; j++) {
				const point = node.sections[i][j];
				vertices.push(point.x, point.y, point.z); // Coordonnées du sommet.
				subIndexList.push(currentIdx); // Enregistre l'indice du sommet.
				currentIdx++;
			}
			indexList.push(subIndexList); // Ajoute la liste des indices de la section courante.
		}

		// Crée les faces triangulaires entre les sections.
		if (node.childNode.length < 2) {
			for (let segmentIndex = 0; segmentIndex < node.sections.length - 1; segmentIndex++) {
				const currentSection = indexList[segmentIndex];
				const nextSection = indexList[segmentIndex + 1];

				for (let k = 0; k < currentSection.length; k++) {
					const j = k;
					const jp1 = (j + 1) % currentSection.length;
					// Premier triangle (assure l'ordre correct pour des normales orientées vers l'extérieur)
					indices.push(currentSection[jp1],  nextSection[j], currentSection[j]);
					// Deuxieme triangle (assure l'ordre correct pour des normales orientées vers l'extérieur)
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
					// Premier triangle (assure l'ordre correct pour des normales orientées vers l'extérieur)
					indices.push(currentSection[jp1],  nextSection[j], currentSection[j]);
					// Deuxieme triangle (assure l'ordre correct pour des normales orientées vers l'extérieur)
					indices.push(	nextSection[jp1], nextSection[j], currentSection[jp1]);
				}
			}

			const lastSection = indexList[indexList.length - 2];
			const firstChildNode = node.childNode[0];
			const firstChildSection = [];

			// Ajoute les sommets de la première section de l'enfant.
			for (let j = 0; j < firstChildNode.sections[0].length; j++) {
				const point = firstChildNode.sections[0][j];
				vertices.push(point.x, point.y, point.z);
				firstChildSection.push(currentIdx);
				currentIdx++;
			}

			// Crée des triangles entre la dernière section du nœud et la première section de l'enfant.
			for (let k = 0; k < lastSection.length; k++) {
				const j = k;
				const jp1 = (j + 1) % lastSection.length;
				// Premier triangle (assure l'ordre correct pour des normales orientées vers l'extérieur)
				indices.push(lastSection[jp1], firstChildSection[j], lastSection[j]);
				// Deuxieme triangle (assure l'ordre correct pour des normales orientées vers l'extérieur)
				indices.push(firstChildSection[jp1], firstChildSection[j], lastSection[jp1]);
			}
		}

		// Crée une géométrie pour la branche à partir des sommets et des indices, et l'ajoute à la liste.
		const branchBuffer = new THREE.BufferGeometry();
		branchBuffer.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
		branchBuffer.setIndex(indices);
		branchBuffer.computeVertexNormals();
		branchList.push(branchBuffer);

		// Appel récursif pour dessiner les branches des enfants.
		if (node.childNode && Array.isArray(node.childNode)) {
			for (const childNode of node.childNode) {
				this.drawBody2(childNode, branchList);
			}
		}

	},


	// Fonction auxiliaire qui met à jour la position d'une pomme.
	updatePommeHermite: function(node, position, pomme, appleGeometries, alpha, matrix) {
		const sphereGeometry = new THREE.SphereBufferGeometry(alpha / 2, 16, 16);
		let center = new THREE.Vector3(position.x, position.y, position.z);

		// Applique la matrice de transformation à la position de la pomme.
		center.applyMatrix4(matrix);

		// Met à jour la position de la géométrie sphérique pour refléter la transformation.
		sphereGeometry.translate(center.x, center.y, center.z);

		// Ajoute la nouvelle géométrie de la pomme à la liste des géométries mises à jour.
		appleGeometries.push(sphereGeometry);

		// Met à jour la position initiale de la pomme dans le nœud avec la position transformée.
		position.x = center.x;
		position.y = center.y;
		position.z = center.z;
	},


	// Fonction auxiliaire qui met à jour la position d'une feuille.
	updateLeavesHermite: function(node, position, rotation, leave, leavesGeometries, alpha, matrix) {
		// Create a triangular geometry
		const triangleGeometry = new THREE.BufferGeometry();

		// Définit les sommets d'un triangle équilatéral basé sur la taille alpha.
		const vertices = new Float32Array([
			0, alpha / 2, 0,                      // Top vertex
			-alpha / 2, -alpha / 2, 0,            // Left vertex
			alpha / 2, -alpha / 2, 0              // Right vertex
		]);

		// Attribue les sommets à la géométrie de la feuille.
		triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		triangleGeometry.computeVertexNormals();

		// Applique les rotations initiales à la géométrie de la feuille.
		triangleGeometry.rotateX(rotation.x);
		triangleGeometry.rotateY(rotation.y);
		triangleGeometry.rotateZ(rotation.z);

		let center = new THREE.Vector3(position.x, position.y, position.z);

		// Applique la matrice de transformation à la position de la feuille.
		center.applyMatrix4(matrix);

		// Met à jour la position de la géométrie triangulaire pour refléter la transformation.
		triangleGeometry.translate(center.x, center.y, center.z);

		// Ajoute la nouvelle géométrie de la feuille à la liste des géométries mises à jour.
		leavesGeometries.push(triangleGeometry);

		// Met à jour la position initiale de la feuille dans le nœud avec la position transformée.
		position.x = center.x;
		position.y = center.y;
		position.z = center.z;
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