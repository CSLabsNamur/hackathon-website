# CSLabs – Site web du Hackathon

Ce dépôt contient le code source du site web du Hackathon organisé par CSLabs, disponible
sur [hackathon.cslabs.be](https://hackathon.cslabs.be).

# Installation

Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé sur votre machine, d'activer `corepack` et
d'installer les dépendances :

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
```

Copiez le fichier d'exemple de configuration et modifiez-le selon vos besoins :

```bash
cp .env.example .env
```

# Développement

Pour lancer le serveur de développement, utilisez la commande suivante :

```bash
pnpm dev
```

# Production

Pour construire le site pour la production, utilisez la commande suivante :

```bash
pnpm build
```

Pour prévisualiser le site construit, utilisez la commande suivante :

```bash
pnpm preview
```

# Licence

Ce projet est sous licence BSD-3. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
