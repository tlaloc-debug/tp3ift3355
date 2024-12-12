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
		if (!node.childNode) {
			return node;
		}
	
		// Calcul du vent
		let u = Math.sin(1 * time) * 4 + Math.sin(2.5 * time) * 2 + Math.sin(5 * time) * 0.4;
		let v = Math.cos(1 * time + 56485) * 4 + Math.cos(2.5 * time + 56485) * 2 + Math.cos(5 * time + 56485) * 0.4;
	
		// Ajouter le vent et la gravité
		node.vel.add(new THREE.Vector3(u / Math.sqrt(node.mass), 0, v / Math.sqrt(node.mass)).multiplyScalar(dt));
		node.vel.add(new THREE.Vector3(0, -node.mass, 0).multiplyScalar(dt));
	
		// Direction initiale de la branche
		const initDirection = new THREE.Vector3().subVectors(node.p1, node.p0).normalize();
	
		// Calcul de la nouvelle position
		const newP1 = node.p1.clone().addScaledVector(node.vel, dt);
		const newDirection = new THREE.Vector3().subVectors(newP1, node.p0).normalize();
	
		// Calcul de la matrice de rotation entre l'ancienne et la nouvelle direction
		const axisAngle = TP3.Geometry.findRotation(initDirection, newDirection);
		const rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion(
			new THREE.Quaternion().setFromAxisAngle(axisAngle[0], axisAngle[1])
		);
	
		// Mise à jour de `p1`
		node.p1 = node.p0.clone().addScaledVector(newDirection, new THREE.Vector3().subVectors(node.p1, node.p0).length());
	
		// Calcul de la force de restitution
		const restitutionAxisAngle = TP3.Geometry.findRotation(initDirection, newDirection);
		const restitutionAngleSquared = Math.pow(restitutionAxisAngle[1], 2); // Carré de l'angle
		const restitutionMatrix = new THREE.Matrix4().makeRotationFromQuaternion(
			new THREE.Quaternion().setFromAxisAngle(restitutionAxisAngle[0], -restitutionAngleSquared)
		);
		const restitutionVel = initDirection
			.clone()
			.applyMatrix4(restitutionMatrix)
			.multiplyScalar(node.a0 * 1000);
		node.vel.add(restitutionVel);
	
		// Amortissement
		node.vel.multiplyScalar(0.7);
	
		// Propager la transformation aux enfants
		if (node.childNode) {
			const combinedQuat = new THREE.Quaternion()
				.setFromRotationMatrix(rotMatrix) // Quaternion correspondant à `rotMatrix`
				.multiply(new THREE.Quaternion().setFromRotationMatrix(restitutionMatrix)); // Ajouter `restitutionMatrix`

			// Générer une matrice de transformation combinée
			const combinedMatrix = new THREE.Matrix4().makeRotationFromQuaternion(combinedQuat);

			for(let i=0; i<node.childNode.length; i++){
				let childDir = new THREE.Vector3().subVectors(node.childNode[i].p1, node.childNode[i].p0);
				let childLength = childDir.length();
				childDir.normalize();


				node.childNode[i].p0 = node.p1;
				childDir.applyMatrix4(combinedMatrix); // Rotation normale
				
				node.childNode[i].p1 = node.p1.clone().addScaledVector(childDir, childLength);
			}
		}
	
		// Appel récursif sur les enfants
		for (let i = 0; i < node.childNode.length; i++) {
			this.applyForces(node.childNode[i], dt, time);
		}
	}
}