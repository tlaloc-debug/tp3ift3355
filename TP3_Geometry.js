
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

function getNodeAngle(nodeA, nodeB) {

	// get vectors
	var vectorA = new THREE.Vector3().subVectors(nodeA.p1, nodeA.p0);
	var vectorB = new THREE.Vector3().subVectors(nodeB.p1, nodeB.p0);

	// dot product
	var dotProduct = vectorA.dot(vectorB);

	var lenA = vectorA.length();
	var lenB = vectorB.length();

	// Cosinus
	var cosAngle = dotProduct / (lenA * lenB);

	cosAngle = Math.max(-1, Math.min(1, cosAngle));

	var radAngle = Math.acos(cosAngle);
	var degAngle = THREE.MathUtils.radToDeg(radAngle);

	return degAngle;
}


TP3.Geometry = {

	simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
		//TODO
		//console.log(rootNode);

		// Recursive function to simplify nodes
		function simplifyNode(currentNode) {
			for (var i = currentNode.childNode.length - 1; i >= 0; i--) {
				var child = currentNode.childNode[i];

				// Call recursively to simplify children first
				simplifyNode(child);

				if (child.childNode.length === 1) {
					var grandChild = child.childNode[0];

					var angle = getNodeAngle(child, grandChild);
					console.log(angle)

					if (angle < rotationThreshold) {

						currentNode.childNode[i] = grandChild;
						grandChild.parentNode = currentNode;

						grandChild.p0 = currentNode.p1;
						grandChild.a0 = currentNode.a1;

					}
				}
			}
		}
		
		simplifyNode(rootNode);
	},

	generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {
		//TODO
	},

	hermite: function (h0, h1, v0, v1, t) {
		//TODO
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

	printTreeNodes: function (rootNode) {
		var stack = [];
		stack.push(rootNode);

		while (stack.length > 0) {
			var currentNode = stack.pop();

			// Imprimir información del nodo actual
			console.log("Nodo ID:", currentNode.id || "Sin ID");
			console.log("  p0:", currentNode.p0);
			console.log("  p1:", currentNode.p1);
			console.log("  a0:", currentNode.a0);
			console.log("  a1:", currentNode.a1);
			console.log("  Padre:", currentNode.parentNode ? currentNode.parentNode.id : "Sin padre");
			console.log("  Hijos:", currentNode.childNode.map(child => child.id || "Sin ID").join(", "));

			// Añadir hijos al stack para seguir recorriendo
			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}
		}
	}

};