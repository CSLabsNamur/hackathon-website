export interface Partner {
  name: string;
  logo: `/images/${string}` | `/images/partenaires/${string}`;
  url?: string;
}

export const partners: Partner[] = [
  {
    name: "Université de Namur",
    logo: "/images/partenaires/unamur.png",
    url: "https://www.unamur.be/",
  },
  {
    name: "Institut NaDI",
    logo: "/images/partenaires/nadi.png",
    url: "https://www.unamur.be/fr/nadi"
  },
  {
    name: "LinKube",
    logo: "/images/partenaires/linkube.png",
    url: "https://linkube.be/",
  },
  {
    name: "Odoo",
    logo: "/images/partenaires/odoo-logo.png",
    url: "https://www.odoo.com/fr_FR",
  },
  {
    name: "Cho'Boulette",
    logo: "/images/partenaires/choboulette.png",
    url: "https://www.instagram.com/choboulette_namur/?hl=fr"
  },
  {
    name: "Le Pavillon",
    logo: "/images/partenaires/lepavillon.png",
    url: "https://www.le-pavillon.be/",
  }
];
