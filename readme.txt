# Maison M — Site statique (prototype)

Site statique complet pour une boutique de vêtements (prototype). Contient 4 pages HTML, 1 CSS et 1 JS.

## Structure des fichiers
- `index.html` — Accueil (hero, présentation, best-sellers, newsletter)
- `boutique.html` — Catalogue (recherche, filtres, tri, grille, modal)
- `contact.html` — Formulaire complet (validation HTML5 + JS)
- `apropos.html` — À propos + mini-blog
- `style.css` — Styles (mobile-first, responsive)
- `script.js` — Interactions (panier, validation, modals, accessibilité)
- `assets/` — Dossier pour images placeholders et icônes (ex: hero.jpg, prod1-1.jpg, founder.jpg, blog1.jpg, og-image.jpg)

## Installation & test local
1. Placer tous les fichiers dans un dossier (conserver la structure `assets/`).
2. Ouvrir `index.html` directement (double-cliquer) pour un test rapide.
3. Pour un serveur local (recommandé) :
   - Avec Node.js : `npx http-server` (ou `npx serve`) depuis le dossier racine.
   - Ouvrir `http://localhost:8080` (ou le port indiqué).
4. Tester l'accessibilité :
   - Outils : Lighthouse (Chrome DevTools), axe (extension), WAVE.
   - Vérifier : contraste, focus visible, labels, aria-*.
5. Tester responsive : utiliser DevTools (toggle device toolbar) et vérifier breakpoints.

## Points d'amélioration optionnels
- Ajouter une page produit dédiée (product.html?id=...) pour SEO et fallback sans JS.
- Intégrer un vrai backend pour :
  - Newsletter (`/api/newsletter`)
  - Contact (`/api/contact`)
  - Paiement sécurisé (Stripe, PayPal) et gestion des commandes.
- Optimisation performance :
  - Minifier `style.css` et `script.js`.
  - Générer images optimisées WebP et fournir `srcset` pour responsive images.
  - Recommander tailles d'images : hero ~1200×800, vignettes 600×600, thumbs 300×300.
- SEO avancé :
  - Sitemap.xml, robots.txt, balises structurées (JSON-LD).
- Accessibilité :
  - Tests utilisateurs, gestion complète des lecteurs d'écran, labels plus détaillés.
- Internationalisation (i18n) si besoin.
- Tests automatisés (Cypress, Playwright) pour parcours achat.

## Sécurité & vie privée
- Les endpoints `/api/contact` et `/api/newsletter` sont fictifs. En production :
  - Utiliser HTTPS, validation côté serveur, protection CSRF, rate limiting.
  - Stocker les données personnelles de façon sécurisée et documenter la politique de confidentialité.
  - Respecter le RGPD : conserver le consentement, permettre la suppression des données.

## Compatibilité
Conçu pour navigateurs modernes : Chrome, Edge, Firefox, Safari. Tester sur versions récentes.

## Remarques finales
- Le site est conçu en progressive enhancement : utilisable sans JS (navigation, formulaires), JS améliore l'expérience (panier, modals).
- Pour déployer : hébergement statique (GitHub Pages, Netlify, Vercel). Configurer un domaine et forcer HTTPS.
