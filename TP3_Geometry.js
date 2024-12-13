
class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0 = null; //Position de depart de la branche
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.sections = null; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
	}
}

TP3.Geometry = {

	simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
		//TODO
		//console.log(rootNode);

		const simplifyNode = (node) => {

			if (node.childNode.length === 0) return node;

			// Si el nodo tiene exactamente un hijo, evaluamos si debe ser simplificado
			if (node.childNode.length === 1) {
				let rootVect = new THREE.Vector3().subVectors(node.p1, node.p0);
				let childVect = new THREE.Vector3().subVectors(node.childNode[0].p1, node.childNode[0].p0);
				let [, angle] = this.findRotation(rootVect, childVect);

				// Si el ángulo es menor al umbral, simplificamos el nodo
				if (angle < rotationThreshold) {
					node.a1 = node.childNode[0].a1;
					node.p1 = node.childNode[0].p1;
					node.childNode = node.childNode[0].childNode;

					if (node.childNode.length > 0) {
						for (let i = 0; i < node.childNode.length; i++) {
							node.childNode[i].a0 = node.a1;
							node.childNode[i].p0 = node.p1;
							node.childNode[i].parentNode = node;
						}
					}

					// Volvemos a simplificar el nodo actual
					return simplifyNode(node);
				} else {
					// De lo contrario, intentamos simplificar su hijo
					node.childNode[0] = simplifyNode(node.childNode[0]);
					return node;
				}
			} else {
				// Si el nodo tiene múltiples hijos, simplificamos cada uno de ellos
				for (let i = 0; i < node.childNode.length; i++) {
					node.childNode[i] = simplifyNode(node.childNode[i]);
				}
				return node;
			}
		};

		// Llamada inicial a la función auxiliar
		return simplifyNode(rootNode);
	},

	generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {
		//TODO
		function generateNodeSections(node) {
			node.sections = [];
			node.centers = [];
			node.pommeList = [];
			node.pommeCenters = [];
			node.leaveList = [];
			node.leaveCenters = [];
			node.leaveRotations = [];

			const points = [];
			const tangents = [];

			// Calculate v0 as the vector from p0 to p1 of the current node
			const v0 = new THREE.Vector3().subVectors(node.p1, node.p0);

			if (node.childNode.length > 0) {
				// Iterate through the child nodes to calculate v1 and create the Hermite curve
				for (const child of node.childNode) {
					// Calculate v1 as the vector from p0 to p1 of the child node
					const v1 = new THREE.Vector3().subVectors(child.p1, child.p0);

					// Generate points along the Hermite curve between node.p0 and child.p0
					for (let i = 0; i <= lengthDivisions; i++) {
						const t = i / lengthDivisions;

						// Calculate the interpolated point and tangent at parameter t
						const [point, tangent] = TP3.Geometry.hermite(node.p0, child.p0, v0, v1, t);
						points.push(point);
						tangents.push(tangent);
					}
				}
			} else {
				// In case the branch has no children (last branches of the tree) the same vector (p1 - p0)
				// is used for both tangents (the branch does not suffer curvature)
				for (let i = 0; i <= lengthDivisions; i++) {
					const t = i / lengthDivisions;

					// Calculate the interpolated point and tangent at parameter t
					const [point, tangent] = TP3.Geometry.hermite(node.p0, node.p1, v0, v0, t);
					points.push(point);
					tangents.push(tangent);
				}
			}

			// Generate circular sections at each interpolated point along the Hermite curve
			for (let i = 0; i < points.length; i++) {
				const center = points[i];
				const tangent = tangents[i];

				// Generate the orthogonal plane using the tangent vector
				let normal = new THREE.Vector3(1, 0, 0);
				// if (Math.abs(tangent.dot(normal)) > 0.9) {
				// 	normal.set(0, 1, 0);
				// }
				const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
				normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

				// Use the radii a0 and a1 to scale the circular sections
				const radius = node.a0 + (i / (points.length - 1)) * (node.a1 - node.a0);

				// Create a circle of points on the orthogonal plane
				const section = [];
				for (let j = 0; j < radialDivisions; j++) {
					const angle = (2 * Math.PI * j) / radialDivisions;
					const point = center.clone()
						.addScaledVector(normal, Math.cos(angle) * radius)
						.addScaledVector(binormal, Math.sin(angle) * radius);
					section.push(point);
				}

				// POSSIBLE OPTIMIZATION
				// Since we are considering the tangent of the child node to the Hermite curvature,
				// nodes with two children will create two curvatures. This code selects only the first curvature.
				// We might have a better result if we choose the "curvier" curvature instead of the first one.
				if (node.sections.length <= lengthDivisions) {
					node.sections.push(section);
					node.centers.push({ center: center, radius: radius });
				}
			}

			// Recursion for child nodes
			for (const child of node.childNode) {
				generateNodeSections(child);
			}

			return node;
		}

		generateNodeSections(rootNode);
		return rootNode;

	},

	hermite: function (h0, h1, v0, v1, t) {
		//TODO
		// Hermite basis polynomials
		const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
		const h10 = t ** 3 - 2 * t ** 2 + t;
		const h01 = -2 * t ** 3 + 3 * t ** 2;
		const h11 = t ** 3 - t ** 2;

		// Calculate interpolated point [ p(t)=h0⋅h00+v0⋅h10+h1⋅h01+v1⋅h11 ]
		const p = new THREE.Vector3()
			.addScaledVector(h0, h00)
			.addScaledVector(v0, h10)
			.addScaledVector(h1, h01)
			.addScaledVector(v1, h11);

		// Derivatives of base polynomials
		const h00Prime = 6 * t ** 2 - 6 * t;
		const h10Prime = 3 * t ** 2 - 4 * t + 1;
		const h01Prime = -6 * t ** 2 + 6 * t;
		const h11Prime = 3 * t ** 2 - 2 * t;

		// Calculate tangent [ dp(t)=h0⋅h00′+v0⋅h10′+h1⋅h01′+v1⋅h11′ ]
		const dp = new THREE.Vector3()
			.addScaledVector(h0, h00Prime)
			.addScaledVector(v0, h10Prime)
			.addScaledVector(h1, h01Prime)
			.addScaledVector(v1, h11Prime);

		dp.normalize();
		//console.log([p, dp]);
		return [p, dp];
	},


	// Trouver l'axe et l'angle de rotation entre deux vecteurs
	findRotation: function (a, b) {
		const axis = new THREE.Vector3().crossVectors(a, b).normalize();
		var c = a.dot(b) / (a.length() * b.length());

		if (c < -1) {
			c = -1;
		} else if (c > 1) {
			c = 1;
		}

		const angle = Math.acos(c);

		return [axis, angle];
	},

	// Projeter un vecter a sur b
	project: function (a, b) {
		return b.clone().multiplyScalar(a.dot(b) / (b.lengthSq()));
	},

	// Trouver le vecteur moyen d'une liste de vecteurs
	meanPoint: function (points) {
		var mp = new THREE.Vector3();

		for (var i = 0; i < points.length; i++) {
			mp.add(points[i]);
		}

		return mp.divideScalar(points.length);
	},

	// Fonction to see Nodes
	printTreeNodes: function (rootNode) {
		var stack = [];
		stack.push(rootNode);

		while (stack.length > 0) {
			var currentNode = stack.pop();

			console.log("Nodo ID:", currentNode.id || "Sin ID");
			console.log("  p0:", currentNode.p0);
			console.log("  p1:", currentNode.p1);
			console.log("  a0:", currentNode.a0);
			console.log("  a1:", currentNode.a1);
			console.log("  Current:", currentNode.parentNode ? currentNode.parentNode.id : "No Node");
			console.log("  Child:", currentNode.childNode.map(child => child.id || "No ID").join(", "));

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}
		}
	}

};