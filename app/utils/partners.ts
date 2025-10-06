export interface Partner {
  name: string;
  description?: string;
  logo: `/images/${string}` | `/images/partenaires/${string}`;
  url?: string;
}

export const partners: Partner[] = [
  {
    name: "Université de Namur",
    description: `L'Université de Namur et la Faculté d'Informatique nous fournissent les locaux et le matériel
    nécessaires à l'organisation de cet évènement.`,
    logo: "/images/partenaires/unamur.png",
    url: "https://www.unamur.be/",
  },
  {
    name: "Institut NaDI",
    description: `Au sein de NaDI, les chercheurs apportent des solutions innovantes aux nouveaux
    défis sociétaux posés par la révolution digitale (eGov, eHealth, eServices, Big data, etc.).
    Issus de différentes disciplines, les chercheurs croisent leurs expertises en informatique, technologie, éthique,
    droit, management ou sociologie. Regroupant six centres de recherche, le Namur Digital Institute offre une expertise
    multidisciplinaire unique dans tous les domaines de l'informatique, de ses applications et de son impact social.`,
    logo: "/images/partenaires/nadi.png",
    url: "https://www.unamur.be/fr/nadi",
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
great Open Source project where your work will count.

Our stack:
* Programming languages: Python & Javascript
* Database: postgresql (with object relational mapping)
* Collaboration platform: GitHub
* Development model: open with external community
* Framework: Odoo (ORM, Workflows, Report Engine, Bi, AI)`,
    logo: "/images/partenaires/odoo-logo.png",
    url: "https://www.odoo.com/fr_FR",
  },
  {
    name: "Cho'Boulette",
    logo: "/images/partenaires/choboulette.png",
    url: "https://www.instagram.com/choboulette_namur/?hl=fr",
  },
  {
    name: "Le Pavillon",
    description:
      `Le Pavillon est un centre d’exposition, d’expérimentation et d’innovation qui décloisonne les disciplines 
      et s’empare simultanément des arts, des sciences et des technologies. 
      Il cultive sa singularité pour vous inviter à vivre une expérience inédite.
      
Le Pavillon accueille des expositions temporaires, des conférences, ateliers, stages et performances.`,
    logo: "/images/partenaires/lepavillon.png",
    url: "https://www.le-pavillon.be/",
  },
];
