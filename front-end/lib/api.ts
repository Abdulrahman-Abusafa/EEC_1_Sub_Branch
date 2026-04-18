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
  return `/api/image/${photo[0].token}`;
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
  term: string | number;
  twitter: string | null;
};

export type Resource = {
  id?: number;
  category: "Lecture" | "Exam" | "Material" | "Other" | string;
  course_id: string;
  resource_title: string;
  url: string;
  sub_category?: string;
  semester?: string;
  chapter?: string;
  unit?: string;
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

// ─── Exported Fetch Functions ─────────────────────────────────────────────────

export async function fetchEvents(): Promise<Event[]> {
  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function fetchMembers(): Promise<Member[]> {
  const res = await fetch(`${API_BASE}/members`);
  if (!res.ok) throw new Error("Failed to fetch members");
  const members: Member[] = await res.json();
  return members.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function fetchCourses(): Promise<Course[]> {
  const res = await fetch(`${API_BASE}/courses`);
  if (!res.ok) throw new Error("Failed to fetch courses");
  const courses: Course[] = await res.json();
  return courses.sort((a, b) => {
    const numA = parseInt(a.course_name.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.course_name.replace(/\D/g, ""), 10) || 0;
    if (numA === numB) return a.course_name.localeCompare(b.course_name);
    return numA - numB;
  });
}

export async function fetchCourseResources(courseId: string): Promise<Resource[]> {
  const res = await fetch(`${API_BASE}/resources?courseId=${encodeURIComponent(courseId)}`);
  if (!res.ok) throw new Error("Failed to fetch resources");
  return res.json();
}

export async function fetchOtherStats(): Promise<OtherStat | null> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

// ─── Resource CRUD (Express backend) ─────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function createResource(resource: Omit<Resource, "id">): Promise<Resource> {
  const res = await fetch(`${API_BASE}/resources`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resource),
  });
  if (!res.ok) throw new Error("Failed to create resource");
  return res.json();
}

export async function updateResource(id: number, resource: Omit<Resource, "id">): Promise<Resource> {
  const res = await fetch(`${API_BASE}/resources/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resource),
  });
  if (!res.ok) throw new Error("Failed to update resource");
  return res.json();
}

export async function deleteResource(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/resources/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete resource");
}
