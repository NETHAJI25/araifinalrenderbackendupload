import dliLogo from "../assets/logos/DLI - logo.jpg";
import arLogo from "../assets/logos/AR Organics logo.png";
import electoHub from "../assets/logos/Electro Hub logo.jpg";
import hnh from "../assets/logos/H&H logo.jpeg";

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  website: string;
  category: string;
}

export const sponsors: Sponsor[] = [
  {
    id: "sp1",
    name: "DexLora Innovations",
    logo: dliLogo,
    website: "#",
    category: "Title Sponsor",
  },
  {
    id: "sp2",
    name: "AR Organics",
    logo: arLogo,
    website: "#",
    category: "Innovation Partner",
  },
  {
    id: "sp3",
    name: "Elector Hub",
    logo: electoHub,
    website: "#",
    category: "Technology Partner",
  },
  {
    id: "sp4",
    name: "Hide and Hype",
    logo: hnh,
    website: "#",
    category: "Community Partner",
  },
];
