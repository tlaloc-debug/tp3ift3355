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
		// Calcul de la nouvelle position
		let newPos = node.p1.clone().add(node.vel.clone().multiplyScalar(dt));
		let oldPos = node.p1.clone()

		// --- AJOUT : Projection pour conserver la longueur ---
		if(node.parentNode !== null) {
			node.p1.applyMatrix4(node.parentNode.transformationMatrix);
			node.p1.applyMatrix4(node.parentNode.transformationMatrix);
		}

		let directionInitial = oldPos.clone().sub(node.p0).normalize();
		let directionCurrent = newPos.clone().sub(node.p0).normalize();

		let axis = new THREE.Vector3().crossVectors(directionInitial, directionCurrent).normalize();
		let angle = Math.acos(directionInitial.dot(directionCurrent));
		let rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);

		node.p1.applyMatrix4(rotationMatrix);

		let trueVelocity = node.p1.clone().sub(oldPos).divideScalar(dt);
		node.vel.copy(trueVelocity);

		let posAfter = node.p1.clone().sub(node.vel.clone().multiplyScalar(dt))
		//node.p1.copy(posAfter);

		// let newDirectionInitial = node.p1.clone().sub(node.p0).normalize();
		// let newDirectionFinal = posAfter.clone().sub(node.p0).normalize();
		// let newAxis = new THREE.Vector3().crossVectors(newDirectionInitial, newDirectionFinal).normalize();
		// let newAngle = Math.acos(newDirectionInitial.dot(newDirectionFinal));
		// let newRotationMatrix = new THREE.Matrix4().makeRotationAxis(newAxis, newAngle);
		node.p1.copy(node.p1.clone().sub(node.vel.clone().multiplyScalar(dt)));
		//node.p1.applyMatrix4(newRotationMatrix);
		node.vel.multiplyScalar(0.7);
		node.transformationMatrix = rotationMatrix;

		// Appel recursif sur les enfants
		for (var i = 0; i < node.childNode.length; i++) {
			this.applyForces(node.childNode[i], dt, time);
		}

	}
}