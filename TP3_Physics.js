const appleMass = 0.075;

TP3.Physics = {
	initTree: function (rootNode) {

		this.computeTreeMass(rootNode);

		var stack = [];
		stack.push(rootNode);

		while (stack.length > 0) {
			var currentNode = stack.pop();
			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			currentNode.vel = new THREE.Vector3();
			currentNode.strength = currentNode.a0;
		}
	},

	computeTreeMass: function (node) {
		var mass = 0;

		for (var i = 0; i < node.childNode.length; i++) {
			mass += this.computeTreeMass(node.childNode[i]);
		}
		mass += node.a1;
		if (node.appleIndices !== null) {
			mass += appleMass;
		}
		node.mass = mass;

		return mass;
	},

	applyForces: function (node, dt, time) {
		if (!node.childNode) return;
	
		// Calcul des forces externes (vent et gravité)
		const u = Math.sin(1 * time) * 4 + Math.sin(2.5 * time) * 2 + Math.sin(5 * time) * 0.4;
		const v = Math.cos(1 * time + 56485) * 4 + Math.cos(2.5 * time + 56485) * 2 + Math.cos(5 * time + 56485) * 0.4;
	
		// Ajouter le vent et la gravité
		node.vel.add(new THREE.Vector3(u / Math.sqrt(node.mass), 0, v / Math.sqrt(node.mass)).multiplyScalar(dt));
		node.vel.add(new THREE.Vector3(0, -node.mass, 0).multiplyScalar(dt));
	
		// Calcul de la nouvelle position de p1
		const newP1 = node.p1.clone().addScaledVector(node.vel, dt);
	
		// Vecteurs normalisés pour calculer la rotation
		const norm1 = new THREE.Vector3().subVectors(node.p1, node.p0).normalize(); // Direction actuelle
		const norm2 = new THREE.Vector3().subVectors(newP1, node.p0).normalize(); // Nouvelle direction
	
		// Calcul de la rotation entre norm1 et norm2
		const axisAngle = TP3.Geometry.findRotation(norm1, norm2);
		const rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion(
			new THREE.Quaternion().setFromAxisAngle(axisAngle[0], axisAngle[1])
		);
	
		// Appliquer la matrice de rotation pour conserver la longueur
		const branchLength = node.p1.clone().sub(node.p0).length(); // Longueur de la branche
		node.p1.copy(node.p0.clone().addScaledVector(norm1.applyMatrix4(rotMatrix), branchLength));
	
		// Mise à jour de la vélocité
		node.vel.copy(new THREE.Vector3().subVectors(node.p1, newP1).multiplyScalar(1 / dt));
	
		// Force de restitution
		const initDirection = new THREE.Vector3().subVectors(node.p1, node.p0).normalize();
		const newDirection = new THREE.Vector3().subVectors(node.p1, node.p0).normalize();
		const restitutionAxisAngle = TP3.Geometry.findRotation(initDirection, newDirection);
		const restitutionMatrix = new THREE.Matrix4().makeRotationFromQuaternion(
			new THREE.Quaternion().setFromAxisAngle(restitutionAxisAngle[0], -Math.pow(restitutionAxisAngle[1], 2))
		);
		const restitutionVel = initDirection
			.clone()
			.applyMatrix4(restitutionMatrix)
			.multiplyScalar(node.a0 * 1000);
	
		node.vel.add(restitutionVel);
	
		// Appliquer l'amortissement
		node.vel.multiplyScalar(0.7);
	
		// Propager les transformations aux enfants
		for (const child of node.childNode) {
			const childDir = new THREE.Vector3().subVectors(child.p1, child.p0).normalize();
			const childLength = child.p1.clone().sub(child.p0).length();
	
			// Mettre à jour p0 et p1 de l'enfant
			child.p0.copy(node.p1);
			child.p1.copy(node.p1.clone().addScaledVector(childDir.applyMatrix4(rotMatrix), childLength));
		}
	
		// Récursion sur les enfants
		for (let i = 0; i < node.childNode.length; i++) {
			this.applyForces(node.childNode[i], dt, time);
		}
	}
}