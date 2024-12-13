
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

		const simplifyNode = (node) => {
			// Si le nœud n'a pas d'enfant, il ne nécessite aucune simplification.
			if (node.childNode.length === 0) return node;

			if (node.childNode.length === 1) {
				let rootVect = new THREE.Vector3().subVectors(node.p1, node.p0);
				let childVect = new THREE.Vector3().subVectors(node.childNode[0].p1, node.childNode[0].p0);
				let [, angle] = this.findRotation(rootVect, childVect);

				// Si l'angle de rotation est inférieur au seuil, fusionner le nœud avec son enfant.
				if (angle < rotationThreshold) {
					node.a1 = node.childNode[0].a1;
					node.p1 = node.childNode[0].p1;
					node.childNode = node.childNode[0].childNode;

					// Met à jour les propriétés des enfants du nœud fusionné, si ils existent.
					if (node.childNode.length > 0) {
						for (let i = 0; i < node.childNode.length; i++) {
							node.childNode[i].a0 = node.a1;
							node.childNode[i].p0 = node.p1;
							node.childNode[i].parentNode = node;
						}
					}
					return simplifyNode(node);
					
				} else {
					// Si l'angle de rotation est supérieur au seuil, simplifier récursivement l'enfant unique.
					node.childNode[0] = simplifyNode(node.childNode[0]);
					return node;
				}

			} else {
				// Si le nœud a un plusieurs enfants, simplifier récursivement chaque l'enfant.
				for (let i = 0; i < node.childNode.length; i++) {
					node.childNode[i] = simplifyNode(node.childNode[i]);
				}
				return node;
			}
		};

		return simplifyNode(rootNode);
	},

	generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {
		//TODO

		function generateNodeSections(node) {
			// Initialise les propriétés des sections pour le nœud courant.
			node.sections = [];
			node.centers = [];

			const points = []; // Points interpolés le long de la courbe.
			const tangents = []; // Tangentes correspondantes à chaque point.

			// Calcul du vecteur de direction entre p0 et p1 du nœud.
			const v0 = new THREE.Vector3().subVectors(node.p1, node.p0);

			// Si le nœud a des enfants, génére des courbes Hermite entre p0 du nœud courant et p0 des enfants.
			if (node.childNode.length > 0) {
				for (const child of node.childNode) {
					const v1 = new THREE.Vector3().subVectors(child.p1, child.p0);

					// Générer des points interpolés le long de la courbe Hermite entre node.p0 et child.p0.
					for (let i = 0; i <= lengthDivisions; i++) {
						const t = i / lengthDivisions; // Paramètre d'interpolation normalisé (0 ≤ t ≤ 1).

						// Calcule le point interpolé et la tangente correspondante sur la courbe pour le paramètre t.
						const [point, tangent] = TP3.Geometry.hermite(node.p0, child.p0, v0, v1, t);

						points.push(point);
						tangents.push(tangent);
					}
				}
			} else {
				// Si le nœud n'a pas d'enfants, interpole directement entre p0 et p1. 
				// Cela garantit que la courbe est une ligne droite sans courbure.
				for (let i = 0; i <= lengthDivisions; i++) {
					const t = i / lengthDivisions; // Paramètre d'interpolation normalisé (0 ≤ t ≤ 1).

					// Calcule le point interpolé et la tangente correspondante sur la courbe pour le paramètre t.
					const [point, tangent] = TP3.Geometry.hermite(node.p0, node.p1, v0, v0, t);

					points.push(point);
					tangents.push(tangent);
				}
			}

			// Génére des sections circulaires à chaque point interpolé.
			for (let i = 0; i < points.length; i++) {
				const center = points[i];
				const tangent = tangents[i];

				// Calcul des vecteurs normal et binormal pour définir un plan orthogonal.
				let normal = new THREE.Vector3(1, 0, 0);
				const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
				normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

				// Interpolation du rayon de la section entre a0 et a1.
				const radius = node.a0 + (i / (points.length - 1)) * (node.a1 - node.a0);

				// Créeun cercle de points sur le plan orthogonal.
				const section = [];
				for (let j = 0; j < radialDivisions; j++) {
					const angle = (2 * Math.PI * j) / radialDivisions;
					const point = center.clone()
						.addScaledVector(normal, Math.cos(angle) * radius)
						.addScaledVector(binormal, Math.sin(angle) * radius);
					section.push(point);
				}

				// OPTIMISATION POSSIBLE
				// Comme nous prenons en compte la tangente du nœud enfant pour la courbure de Hermite, les nœuds 
				// ayant deux enfants créeront deux courbures. Ce code sélectionne uniquement la première courbure. 
				// Nous pourrions obtenir un meilleur résultat en choisissant la courbure la plus "prononcée" 
				// au lieu de la première.
				if (node.sections.length <= lengthDivisions) {
					node.sections.push(section);
					node.centers.push({ center: center, radius: radius });
				}
			}

			// Appel récursif pour les nœuds enfants.
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

		// Polynômes de base de Hermite pour l'interpolation.
		const h00 = 2 * t ** 3 - 3 * t ** 2 + 1; 
		const h10 = t ** 3 - 2 * t ** 2 + t; 		
		const h01 = -2 * t ** 3 + 3 * t ** 2; 		
		const h11 = t ** 3 - t ** 2;				

		// Calcul du point interpolé : p(t) = h0 * h00 + v0 * h10 + h1 * h01 + v1 * h11.
		const p = new THREE.Vector3()
			.addScaledVector(h0, h00)
			.addScaledVector(v0, h10)
			.addScaledVector(h1, h01)
			.addScaledVector(v1, h11);

		// Calcul des dérivées des polynômes de base pour obtenir la tangente.
		const h00Prime = 6 * t ** 2 - 6 * t;
		const h10Prime = 3 * t ** 2 - 4 * t + 1;
		const h01Prime = -6 * t ** 2 + 6 * t;
		const h11Prime = 3 * t ** 2 - 2 * t;

		// Calcul de la tangente : dp(t) = h0 * h00' + v0 * h10' + h1 * h01' + v1 * h11'.
		const dp = new THREE.Vector3()
			.addScaledVector(h0, h00Prime)
			.addScaledVector(v0, h10Prime)
			.addScaledVector(h1, h01Prime)
			.addScaledVector(v1, h11Prime);

		dp.normalize();
		// Retourne le point interpolé et la tangente normalisée.
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
};