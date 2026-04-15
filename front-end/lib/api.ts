const GRAPHQL_ENDPOINT = "https://hasura.inmakan.com/v1/graphql";

// ─── Image Helper ────────────────────────────────────────────────────────────

type ImageAttachment = {
  id?: string;
  name?: string;
  path?: string;
  size?: number;
  token: string;
  width?: number;
  height?: number;
  mimetype?: string;
};

export function getPhotoUrl(photo: ImageAttachment[] | string | null | undefined): string | null {
  if (!photo || !Array.isArray(photo) || photo.length === 0) return null;
  return `/api/image?token=${photo[0].token}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type Course = {
  course_name: string; // this is course_id in the DB
  credits: number;
  description: string;
  difficulty: number;
  final_date: string;
  level: number;
  major_1_date: string;
  major_2_date: string;
  objectives: string;
  prerequisites: string;
  title: string;
};

export type Event = {
  category: string;
  description: string;
  end_date: string;
  event_title: string;
  image: ImageAttachment[] | string | null;
  location: string;
  registration_link: string;
  start_date: string;
  status: "Active" | "Upcoming" | "Complete" | "Auto" | string;
  time: string;
};

export type Member = {
  bio: string;
  email: string;
  image: ImageAttachment[] | string | null;
  linkedin: string | null;
  name: string;
  role: string;
  sort_order: number;
  term: number;
  twitter: string | null;
};

export type Resource = {
  category: "Lecture" | "Exam" | "Material" | "Other" | string;
  course_id: string;
  resource_title: string;
  url: string;
};

export type OtherStat = {
  workshops_per_year: number;
  industry_partners: number;
  current_term: number;
  commitment_percentage: number;
  active_members: number;
  club_email: string;
  club_insta: string;
  club_linked: string;
  club_location: string;
  club_x: string;
};

// ─── GraphQL Fetcher ─────────────────────────────────────────────────────────

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 }, // cache for 60 seconds (Next.js server components)
  });
  const json = await res.json();
  if (json.errors) {
    console.error("GraphQL Error:", json.errors);
    throw new Error(json.errors[0]?.message ?? "GraphQL error");
  }
  return json.data as T;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

const EVENTS_QUERY = `
query FetchEvents {
  events: bseO7aw4HxZqguS4etj_events {
    category
    description
    end_date
    event_title
    image
    location
    registration_link
    start_date
    status
    time
  }
}`;

const MEMBERS_QUERY = `
query FetchMembers {
  members: bseO7aw4HxZqguS4etj_members {
    bio
    email
    image
    linkedin
    name
    role
    sort_order
    term
    twitter
  }
}`;

const COURSES_QUERY = `
query FetchCourses {
  courses: bseO7aw4HxZqguS4etj_courses {
    course_name: course_id
    credits
    description
    difficulty
    final_date
    level
    major_1_date
    major_2_date
    objectives
    prerequisites
    title
  }
}`;

const COURSE_RESOURCES_QUERY = `
query FetchResources($courseId: String!) {
  resources: bseO7aw4HxZqguS4etj_resources(where: {course_id: {_eq: $courseId}}) {
    category
    course_id
    resource_title
    url
  }
}`;

const OTHER_STATS_QUERY = `
query FetchOtherStats {
  other: bseO7aw4HxZqguS4etj_other {
    workshops_per_year
    industry_partners
    current_term
    commitment_percentage
    active_members
    club_email
    club_insta
    club_linked
    club_location
    club_x
  }
}`;

// ─── Exported Fetch Functions ─────────────────────────────────────────────────

export async function fetchEvents(): Promise<Event[]> {
  const data = await gql<{ events: Event[] }>(EVENTS_QUERY);
  return data.events;
}

export async function fetchMembers(): Promise<Member[]> {
  const data = await gql<{ members: Member[] }>(MEMBERS_QUERY);
  return data.members.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function fetchCourses(): Promise<Course[]> {
  const data = await gql<{ courses: Course[] }>(COURSES_QUERY);
  // Sort courses numerically by extracting the number from the course ID (e.g. "EE201" -> 201, "PHYS305" -> 305)
  return data.courses.sort((a, b) => {
    const numA = parseInt(a.course_name.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.course_name.replace(/\D/g, ""), 10) || 0;

    // If numbers are the same, fall back to alphabetical
    if (numA === numB) {
      return a.course_name.localeCompare(b.course_name);
    }
    return numA - numB;
  });
}

export async function fetchCourseResources(courseId: string): Promise<Resource[]> {
  const data = await gql<{ resources: Resource[] }>(COURSE_RESOURCES_QUERY, { courseId });
  return data.resources;
}

export async function fetchOtherStats(): Promise<OtherStat | null> {
  const data = await gql<{ other: OtherStat[] }>(OTHER_STATS_QUERY);
  return data.other[0] || null;
}
