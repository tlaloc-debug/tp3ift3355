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

		var u = Math.sin(1 * time) * 4;
		u += Math.sin(2.5 * time) * 2;
		u += Math.sin(5 * time) * 0.4;

		var v = Math.cos(1 * time + 56485) * 4;
		v += Math.cos(2.5 * time + 56485) * 2;
		v += Math.cos(5 * time + 56485) * 0.4;
	
		// Ajouter le vent
		node.vel.add(new THREE.Vector3(u / Math.sqrt(node.mass), 0, v / Math.sqrt(node.mass)).multiplyScalar(dt));
		// Ajouter la gravite
		node.vel.add(new THREE.Vector3(0, -node.mass, 0).multiplyScalar(dt));

		// TODO: Projection du mouvement, force de restitution et amortissement de la velocite
	
		// Projection du mouvement
		var initDirection = new THREE.Vector3().subVectors(node.p1, node.p0).normalize();
		// Nouvelle position de p1 après application de la vélocité.
		var newP1 = node.p1.clone().addScaledVector(node.vel, dt);
		var newDirection = new THREE.Vector3().subVectors(newP1, node.p0).normalize();
	
		// Calcule la rotation nécessaire pour aligner la branche avec sa nouvelle direction.
		const axisAngle = TP3.Geometry.findRotation(initDirection, newDirection);
		const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(
			new THREE.Quaternion().setFromAxisAngle(axisAngle[0], axisAngle[1])
		);
	
		node.p1 = node.p0.clone().addScaledVector(newDirection, new THREE.Vector3().subVectors(node.p1, node.p0).length());
	
		// Applique la force de restitution pour ramener la branche vers sa position initiale.
		const restitutionAxisAngle = TP3.Geometry.findRotation(initDirection, newDirection);
		const restitutionAngleSquared = Math.pow(restitutionAxisAngle[1], 2); // Carré de l'angle
		const restitutionMatrix = new THREE.Matrix4().makeRotationFromQuaternion(
			new THREE.Quaternion().setFromAxisAngle(restitutionAxisAngle[0], -restitutionAngleSquared)
		);
		const restitutionVel = initDirection
			.clone()
			.applyMatrix4(restitutionMatrix)
			.multiplyScalar(node.a0 * 1000); // Force proportionnelle au rayon de la branche.
		node.vel.add(restitutionVel);
	
		// Applique un amortissement à la vélocité.
		node.vel.multiplyScalar(0.7);
	
		// Mise à jour des enfants si le nœud en possède.
		if (node.childNode) {
			// Combine les matrices de rotation pour appliquer les transformations aux enfants.
			const combinedQuat = new THREE.Quaternion()
				.setFromRotationMatrix(rotationMatrix) 
				.multiply(new THREE.Quaternion().setFromRotationMatrix(restitutionMatrix));
			const combinedMatrix = new THREE.Matrix4().makeRotationFromQuaternion(combinedQuat);

			for(let i=0; i<node.childNode.length; i++){
				let childDirection = new THREE.Vector3().subVectors(node.childNode[i].p1, node.childNode[i].p0);
				let childLength = childDirection.length();
				childDirection.normalize();

				node.childNode[i].p0 = node.p1; // Le point de départ de l'enfant devient le p1 du nœud courant.
				childDirection.applyMatrix4(combinedMatrix); 

				// Stocke la matrice de transformation dans le nœud courant.
				node.transformMatrix = combinedMatrix; 

				// Met à jour le p1 de l'enfant.
				node.childNode[i].p1 = node.p1.clone().addScaledVector(childDirection, childLength); 

			}
		}
	
		// Appel recursif sur les enfants
		for (var i = 0; i < node.childNode.length; i++) {
			this.applyForces(node.childNode[i], dt, time);
		}
	}
}