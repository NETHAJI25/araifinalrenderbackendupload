// Organizer photos are imported from src/assets/organisers/
import nethaji from "../assets/organisers/Nethaji R.png";
import aravind from "../assets/organisers/Aravind Muthiah M.png";
import jaganathan from "../assets/organisers/Jaganathan T.png";
import vinnarasu from "../assets/organisers/Vinnarasu R.png";
import haresh from "../assets/organisers/Haresh Kumar N L.jpg";

export interface Organizer {
  id: string;
  name: string;
  designation: string;
  photo: string;
  linkedin: string;
  /**
   * Which part of the photo to keep when it is cropped to the circular
   * avatar. Use "top" for photos where the head sits near the top edge,
   * otherwise the head gets cropped off.
   */
  imagePosition?: "top" | "center" | "bottom";
}

export const organizers: Organizer[] = [
  {
    id: "org1",
    name: "Nethaji R",
    designation: "Founder",
    photo: nethaji,
    linkedin: "https://www.linkedin.com/in/r-nethaji-327469305/",
  },
  {
    id: "org2",
    name: "Aravind Muthiah M",
    designation: "Director",
    photo: aravind,
    linkedin: "https://www.linkedin.com/in/aravind-muthiah-m/",
  },
  {
    id: "org3",
    name: "Jaganathan T",
    designation: "Chairperson",
    photo: jaganathan,
    linkedin: "https://www.linkedin.com/in/jaganathan-t-aa853a334/",
  },
  {
    id: "org4",
    name: "Vinnarasu R",
    designation: "Vice Chairperson",
    photo: vinnarasu,
    linkedin: "https://www.linkedin.com/in/vinnarasu-r/",
  },
  {
    id: "org5",
    name: "Haresh Kumar N L",
    designation: "Secretary",
    photo: haresh,
    linkedin: "https://www.linkedin.com/in/haresh-kumar-n-l",
    // Anchor the crop to the top so his head is fully visible.
    imagePosition: "top",
  },
];
