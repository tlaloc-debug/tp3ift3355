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

		// Calcular las direcciones normalizadas
		let directionInitial = node.p1.clone().sub(node.p0).normalize();
		let directionCurrent = newPos.sub(node.p0).normalize();

		// Calcular el eje de rotación
		let rotationAxis = new THREE.Vector3().crossVectors(directionInitial, directionCurrent).normalize();

		// Calcular el ángulo de rotación
		let angle = Math.acos(THREE.MathUtils.clamp(directionCurrent.dot(directionInitial), -1, 1)); // Clamp para evitar errores numéricos
		// Crear la matriz de rotación
		let rotationMatrix = new THREE.Matrix4().makeRotationAxis(rotationAxis, angle);

		node.p1.copy(node.p1.clone().applyMatrix4(rotationMatrix));

		// 2. Calcular la nueva velocidad proyectada
		let newVelocity = node.p1.clone().sub(node.p0).divideScalar(dt);
		// 3. Reemplazar la velocidad antigua
		node.vel.copy(newVelocity);

		// 1. Calcular direcciones inicial y actual
		directionInitial = previousPos.sub(node.p0).normalize();
		directionCurrent = node.p1.clone().sub(node.p0).normalize();

		// 2. Calcular el ángulo entre las direcciones
		angle = Math.acos(THREE.MathUtils.clamp(directionCurrent.dot(directionInitial), -1, 1)); // Clamp para evitar errores numéricos

		// 3. Calcular la velocidad de restitución
		let restitutionVelocity = directionCurrent.clone().multiplyScalar(Math.pow(angle, 2) * node.a0 * 1000);

		// 4. Añadir la velocidad de restitución a la velocidad total
		node.vel.sub(restitutionVelocity);

		// Appel recursif sur les enfants
		for (var i = 0; i < node.childNode.length; i++) {
			this.applyForces(node.childNode[i], dt, time);
		}

	}
}