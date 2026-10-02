import { createClient } from "@supabase/supabase-js";
export type Status = "Requested" | "Accepted" | "Fulfilled" | "Declined";
export type Provider = {
  id: string;
  name: string;
  service_category: string;
  transport_mode: string;
  verification_status: string;
  availability: boolean;
  is_demo: boolean;
};
export type Request = {
  id: string;
  service_category: string;
  destination: string;
  passenger_count: number;
  preferred_mode: string;
  requested_for: string;
  note: string;
  provider_id: string;
  status: Status;
  created_at: string;
  completed_at: string | null;
};
export type Feedback = {
  id: string;
  request_id: string;
  fulfilled: boolean;
  comment: string;
  created_at: string;
};
export type Data = {
  providers: Provider[];
  requests: Request[];
  feedback: Feedback[];
};
export const seed: Provider[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Demo Local Taxi 01",
    transport_mode: "Taxi",
    service_category: "Transport",
    verification_status: "Verified for prototype",
    availability: true,
    is_demo: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Demo Local Auto 01",
    transport_mode: "Auto",
    service_category: "Transport",
    verification_status: "Verified for prototype",
    availability: true,
    is_demo: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Demo Transport Collective",
    transport_mode: "Taxi / Shared Transport",
    service_category: "Transport",
    verification_status: "Verified for prototype",
    availability: true,
    is_demo: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Demo City Hatchback 01",
    transport_mode: "Taxi",
    service_category: "Transport",
    verification_status: "Verified for prototype",
    availability: true,
    is_demo: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "Demo Local SUV 01",
    transport_mode: "Taxi",
    service_category: "Transport",
    verification_status: "Verified for prototype",
    availability: true,
    is_demo: true,
  },
];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const db = url && key ? createClient(url, key) : null;
export const localMode = !db;
const storageKey = "rupaidiha-pilot-v1";
export function localData(): Data {
  const raw = localStorage.getItem(storageKey);
  const data: Data = raw ? JSON.parse(raw) : { providers: seed, requests: [], feedback: [] };
  // Add new presentation listings without resetting requests or availability.
  const missing = seed.filter(p => !data.providers.some(existing => existing.id === p.id));
  if (missing.length) {
    data.providers.push(...missing);
    localStorage.setItem(storageKey, JSON.stringify(data));
  }
  return data;
}
function save(data: Data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
  window.dispatchEvent(new Event("pilot-update"));
}
export async function readData(): Promise<Data> {
  if (!db) return localData();
  const results = await Promise.all([
    db.from("providers").select("*").order("name"),
    db.from("requests").select("*").order("created_at", { ascending: false }),
    db.from("feedback").select("*"),
  ]);
  for (const r of results) if (r.error) throw r.error;
  return {
    providers: results[0].data as Provider[],
    requests: results[1].data as Request[],
    feedback: results[2].data as Feedback[],
  };
}
export async function createRequest(
  input: Omit<
    Request,
    "id" | "created_at" | "completed_at" | "status" | "service_category"
  >,
) {
  const r: Request = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    completed_at: null,
    status: "Requested",
    service_category: "Transport",
  };
  if (db) {
    const { error } = await db.from("requests").insert(r);
    if (error) throw error;
  } else {
    const d = localData();
    d.requests.unshift(r);
    save(d);
  }
  return r.id;
}
export async function updateStatus(id: string, status: Status) {
  const previous = status === "Fulfilled" ? "Accepted" : "Requested";
  const patch = {
    status,
    completed_at: status === "Fulfilled" ? new Date().toISOString() : null,
  };
  if (db) {
    const { data, error } = await db
      .from("requests")
      .update(patch)
      .eq("id", id)
      .eq("status", previous)
      .select("id");
    if (error) throw error;
    if (!data?.length)
      throw new Error(
        "This request has changed. Please refresh and try again.",
      );
  } else {
    const d = localData(),
      r = d.requests.find((x) => x.id === id);
    if (!r || r.status !== previous)
      throw new Error("This request has already changed.");
    Object.assign(r, patch);
    save(d);
  }
}
export async function submitFeedback(
  request_id: string,
  fulfilled: boolean,
  comment: string,
) {
  const f: Feedback = {
    id: crypto.randomUUID(),
    request_id,
    fulfilled,
    comment,
    created_at: new Date().toISOString(),
  };
  if (db) {
    const { error } = await db.from("feedback").insert(f);
    if (error) throw error;
  } else {
    const d = localData();
    if (d.feedback.some((x) => x.request_id === request_id))
      throw new Error("Feedback is already recorded.");
    if (d.requests.find((x) => x.id === request_id)?.status !== "Fulfilled")
      throw new Error("Complete the request first.");
    d.feedback.push(f);
    save(d);
  }
}
export async function availability(id: string, value: boolean) {
  if (db) {
    const { error } = await db
      .from("providers")
      .update({ availability: value })
      .eq("id", id);
    if (error) throw error;
  } else {
    const d = localData();
    d.providers = d.providers.map((p) =>
      p.id === id ? { ...p, availability: value } : p,
    );
    save(d);
  }
}
