export type TeamMember = {
    name: string;
    role: string;
    bio: string;
    email?: string;
    linkedin?: string;
    x?: string;
    image?: string;
};

export const getRandomFace = (id: number) => `https://i.pravatar.cc/150?img=${id}`;

export const BOARD_MEMBERS: TeamMember[] = [
    {
        name: "Yousef Al-Harbi",
        role: "President",
        bio: "Leading the vision for the next generation of engineers. Passionate about IoT and embedded systems.",
        email: "president@eec-club.com",
        linkedin: "#",
        x: "#",
        image: getRandomFace(11)
    },
    {
        name: "Sarah Ahmed",
        role: "Vice President",
        bio: "Orchestrating operations and ensuring smooth execution of all club activities. Power Systems major.",
        email: "vp@eec-club.com",
        linkedin: "#",
        image: getRandomFace(5)
    },
    {
        name: "Omar Khalid",
        role: "Head of Tech",
        bio: "The brain behind the Antigravity project. Full-stack developer and AI enthusiast.",
        x: "#",
        email: "tech@eec-club.com",
        image: getRandomFace(12)
    },
    {
        name: "Layla Mazen",
        role: "Media Manager",
        bio: "Crafting the visual identity and reaching out to the community. Creative designer.",
        email: "media@eec-club.com",
        linkedin: "#",
        x: "#",
        image: getRandomFace(9)
    },
    {
        name: "Ahmed Fathi",
        role: "Junior Developer",
        bio: "Learning Next.js and frontend technologies.",
        email: "ahmed@eec-club.com",
        image: getRandomFace(15)
    },
    {
        name: "Lamya Saud",
        role: "Event Coordinator",
        bio: "Organizes workshops and manages the schedule.",
        email: "lamya@eec-club.com",
        x: "#",
        image: getRandomFace(16)
    },
    {
        name: "Zaid Ali",
        role: "Hardware Engineer",
        bio: "Building robotics and IoT hardware solutions.",
        email: "zaid@eec-club.com",
        linkedin: "#",
        image: getRandomFace(13)
    },
    {
        name: "Noura Tariq",
        role: "Designer",
        bio: "Creates posters, graphics, and social media content.",
        email: "noura@eec-club.com",
        linkedin: "#",
        x: "#",
        image: getRandomFace(10)
    }
];

export const TERM_MEMBERS: Record<string, TeamMember[]> = {
    "252": BOARD_MEMBERS,
    "251": [
        { name: "Faris Yazeed", role: "Marketing", bio: "Promotes the club activities.", email: "faris@eec-club.com", linkedin: "#", image: getRandomFace(3) },
        { name: "Reem Fahad", role: "Senior Developer", bio: "Maintains the internal tools.", email: "reem@eec-club.com", x: "#", image: getRandomFace(1) },
        { name: "Saad Waleed", role: "Operations", bio: "Ensures smooth day-to-day work.", email: "saad@eec-club.com", linkedin: "#", image: getRandomFace(4) },
        { name: "Majed Naser", role: "Member", bio: "Active participant in all events.", email: "majed@eec-club.com", image: getRandomFace(8) },
        { name: "Hala Saad", role: "Member", bio: "Active participant in all events.", email: "hala@eec-club.com", x: "#", image: getRandomFace(2) },
    ],
    "242": [
        { name: "Yousef Hamad", role: "Member", bio: "Contributed to the 242 Hackathon.", email: "yousefh@eec-club.com", image: getRandomFace(17) },
        { name: "Sara Majed", role: "Member", bio: "Contributed to the 242 Hackathon.", email: "saram@eec-club.com", linkedin: "#", image: getRandomFace(20) },
        { name: "Omar Nabil", role: "Member", bio: "Contributed to the 242 Hackathon.", email: "omarn@eec-club.com", image: getRandomFace(18) },
        { name: "Jana Ali", role: "Member", bio: "Contributed to the 242 Hackathon.", email: "jana@eec-club.com", x: "#", image: getRandomFace(21) },
        { name: "Bader Fahad", role: "Member", bio: "Contributed to the 242 Hackathon.", email: "bader@eec-club.com", image: getRandomFace(19) },
    ],
    "241": [
        { name: "Abdulrahman Omar", role: "Member", bio: "Helped found the robotics lab.", email: "abdul@eec-club.com", linkedin: "#", image: getRandomFace(31) },
        { name: "Mohammed Saad", role: "Member", bio: "Helped found the robotics lab.", email: "mohammed@eec-club.com", image: getRandomFace(33) },
        { name: "Faisal Khalid", role: "Member", bio: "Helped found the robotics lab.", email: "faisal@eec-club.com", x: "#", image: getRandomFace(32) },
        { name: "Layan Naser", role: "Member", bio: "Helped found the robotics lab.", email: "layan@eec-club.com", image: getRandomFace(29) },
        { name: "Norah Yazeed", role: "Member", bio: "Helped found the robotics lab.", email: "norah@eec-club.com", linkedin: "#", image: getRandomFace(30) },
    ],
    "232": [
        { name: "Saud Abdulaziz", role: "Member", bio: "Legacy board member.", email: "saud@eec-club.com", image: getRandomFace(41) },
        { name: "Mishal Tariq", role: "Member", bio: "Legacy board member.", email: "mishal@eec-club.com", x: "#", image: getRandomFace(43) },
        { name: "Lina Fathi", role: "Member", bio: "Legacy board member.", email: "lina@eec-club.com", linkedin: "#", image: getRandomFace(45) },
        { name: "Hassan Waleed", role: "Member", bio: "Legacy board member.", email: "hassan@eec-club.com", image: getRandomFace(42) },
        { name: "Dana Salem", role: "Member", bio: "Legacy board member.", email: "dana@eec-club.com", x: "#", image: getRandomFace(46) },
    ],
    "231": [
        { name: "Tariq Nabil", role: "Founder", bio: "One of the founding members.", email: "tariq@eec-club.com", linkedin: "#", image: getRandomFace(51) },
        { name: "Nasser Ali", role: "Founder", bio: "One of the founding members.", email: "nasser@eec-club.com", image: getRandomFace(53) },
        { name: "Aisha Saad", role: "Founder", bio: "One of the founding members.", email: "aisha@eec-club.com", x: "#", image: getRandomFace(55) },
        { name: "Fahad Omar", role: "Founder", bio: "One of the founding members.", email: "fahad@eec-club.com", linkedin: "#", image: getRandomFace(52) },
        { name: "Maha Khalid", role: "Founder", bio: "One of the founding members.", email: "maha@eec-club.com", image: getRandomFace(56) },
    ]
};
