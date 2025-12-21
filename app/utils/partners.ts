export interface Partner {
  name: string;
  description?: string;
  logo: `/images/${string}` | `/images/partenaires/${string}`;
  url?: string;
}

export const partners: Partner[] = [
  {
    name: "Université de Namur – Faculté d'Informatique",
    description: `L'Université de Namur et la Faculté d'Informatique nous fournissent les locaux et le matériel
    nécessaires à l'organisation de cet évènement.`,
    logo: "/images/partenaires/unamur_fac_info.png",
    url: "https://www.unamur.be/",
  },
  {
    name: "AG Insurance",
    logo: "/images/partenaires/ag_insurance.png",
    url: "https://ag.be/",
  },
  //{
  //  name: "Institut NaDI",
  //  description: `Au sein de NaDI, les chercheurs apportent des solutions innovantes aux nouveaux
  //  défis sociétaux posés par la révolution digitale (eGov, eHealth, eServices, Big data, etc.).
  //  Issus de différentes disciplines, les chercheurs croisent leurs expertises en informatique, technologie, éthique,
  //  droit, management ou sociologie. Regroupant six centres de recherche, le Namur Digital Institute offre une expertise
  //  multidisciplinaire unique dans tous les domaines de l'informatique, de ses applications et de son impact social.`,
  //  logo: "/images/partenaires/nadi.png",
  //  url: "https://www.unamur.be/fr/nadi",
  //},
  {
    name: "Lab9",
    description: `Chez Lab9, vivez l’expérience Apple comme elle se doit.
    Dans nos magasins, vous retrouvez tout l’univers Apple ainsi qu’un large assortiment d’accessoires de grandes marques pour compléter votre équipement.

En tant qu’Apple Premium Partner, Lab9 est reconnu et recommandé par Apple.
Que vous soyez un particulier ou un professionnel, nous vous accompagnons avec des conseils clairs, une expertise pointue et un service irréprochable — avant, pendant et après l’achat.

Nos experts Apple passionnés prennent le temps de comprendre vos besoins, de vous orienter vers la solution la plus adaptée et de vous aider à configurer vos appareils pour en tirer le meilleur dès le premier jour.
Besoin d’optimiser votre productivité, de choisir le bon Mac, d’équiper une équipe ou de protéger vos appareils ? Nous sommes là pour vous guider.

Passez en magasin et découvrez un lieu agréable où Apple se découvre, se teste… et se maîtrise.`,
    logo: "/images/partenaires/lab9.png",
    url: "https://www.lab9.be/fr/",
  },
  {
    name: "Buddy",
    logo: "/images/partenaires/buddy.png",
    url: "https://buddydrink.be/",
  },
  {
    name: "LinKube",
    description:
      `LinKube est l’**incubateur étudiant** de la province de Namur.

Nous avons pour mission d’**accompagner des jeunes** (étudiants ou jeunes diplômés) **à créer leur entreprise
en parallèle de leurs études** ou de leurs premiers pas dans la vie active.

Pour ce faire, nous proposons du **coaching personnalisé**, de l’**expertise** « business », des ateliers
sur des thématiques boostantes et liées à à l’entrepreneuriat, un lieu propice au travail (le TRAKK), etc.

**Envie d'en savoir plus ?** N’hésite pas à contacter Coralie Dufloucq pour un premier rendez-vous ! 😉

Alors… Partant.e.s ?`,
    logo: "/images/partenaires/linkube.png",
    url: "https://linkube.be/",
  },
  {
    name: "Odoo",
    description:
      `We are a Belgian IT company proposing a complete and flexible software solution.
Odoo's unique value proposition is to cover a large business scope and be at the same time very easy to use and fully integrated.

If you're passionate about development, then it's time to come and do your internship or find a job in a company with a
great Open Source project where your work will count.`,
    logo: "/images/partenaires/odoo-logo.png",
    url: "https://www.odoo.com/fr_FR",
  },
  //{
  //  name: "Cho'Boulette",
  //  logo: "/images/partenaires/choboulette.png",
  //  url: "https://www.instagram.com/choboulette_namur/?hl=fr",
  //},
//  {
//    name: "Le Pavillon",
//    description:
//      `Le Pavillon est un centre d’exposition, d’expérimentation et d’innovation qui décloisonne les disciplines
//      et s’empare simultanément des arts, des sciences et des technologies.
//      Il cultive sa singularité pour vous inviter à vivre une expérience inédite.
//
//Le Pavillon accueille des expositions temporaires, des conférences, ateliers, stages et performances.`,
//    logo: "/images/partenaires/lepavillon.png",
//    url: "https://www.le-pavillon.be/",
//  },
];
