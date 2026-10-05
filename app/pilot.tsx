"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, FormEvent } from "react";
import {
  Data,
  Request,
  Status,
  db,
  seed,
  localMode,
  readData,
  createRequest,
  updateStatus,
  submitFeedback,
  availability,
} from "../lib/data";
const destinations = [
  "Bahraich",
  "Nepalganj Road Railway Station",
  "Rupaidiha Bus Stand",
  "Nanpara",
  "Other",
];
const time = (s: string) =>
  new Date(s).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const providerName = (name: string = "") => name.replace(/^Demo /, "");
const short = (s: string) => "RP-" + s.slice(0, 8).toUpperCase();
function Icon({ kind }: { kind: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "Transport" ? (
        <>
          <path d="m5 7 2-4h10l2 4M3 8h18v10H3zM6 18v3m12-3v3M3 12h18" />
          <path d="M6 15h1m10 0h1" />
        </>
      ) : kind === "Food" ? (
        <>
          <path d="M5 3v7m3-7v7M3 7h7m-4 3v11M18 3c-4 3-4 9 0 9V3Zm0 9v9" />
        </>
      ) : kind === "Stay" ? (
        <>
          <path d="M3 20V6m18 14v-9H3m0 6h18M6 11V7h5v4m2 0V7h5v4" />
        </>
      ) : kind === "Local Products" ? (
        <>
          <path d="M4 8h16l-1 13H5L4 8Zm4 0V6a4 4 0 0 1 8 0v2" />
        </>
      ) : (
        <>
          <path d="M4 21V8l8-5 8 5v13M8 21V11h8v10M2 21h20M10 7h4" />
        </>
      )}
    </svg>
  );
}
function Verified() {
  return <span className="verified" title="Verification applies to this research presentation">
    <svg className="verification-tick" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 1 3 2 3.6.4 1 3.5L22 10l-1 3.5.4 3.6-3.3 1.5L16 21.5l-4-.5-3.3 1-2.3-2.8L3 18l.2-3.8L1 11l2-3 1-3.5L8 4z"/><path d="m7.5 11.8 3 3 6-6" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>Verified
  </span>;
}
function vehiclePicture(id: string) {
  const last = id.slice(-1);
  return last === '1' ? 'sedan' : last === '3' ? 'mpv' : last === '4' ? 'hatchback' : last === '5' ? 'suv' : 'auto';
}
function Badge({ status }: { status: string }) {
  return <span className={"badge " + status.toLowerCase()}>{status}</span>;
}
export default function Pilot({
  view,
}: {
  view: "passenger" | "provider" | "admin";
}) {
  const [data, setData] = useState<Data>({
      providers: seed,
      requests: [],
      feedback: [],
    }),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [step, setStep] = useState("home"),
    [info, setInfo] = useState(""),
    [destination, setDestination] = useState("Bahraich"),
    [other, setOther] = useState(""),
    [count, setCount] = useState(1),
    [mode, setMode] = useState("Taxi"),
    [when, setWhen] = useState("Now"),
    [later, setLater] = useState(""),
    [note, setNote] = useState(""),
    [activeId, setActiveId] = useState(""),
    [provider, setProvider] = useState(seed[0].id),
    [success, setSuccess] = useState("Yes"),
    [comment, setComment] = useState("");
  async function refresh() {
    try {
      const latest = await readData();
      setData(latest);
      // Only restore requests that still exist after a successful load.
      const saved = localStorage.getItem("pilot-active-request");
      if (view === "passenger" && saved && !latest.requests.some(r => r.id === saved)) {
        localStorage.removeItem("pilot-active-request");
        setActiveId("");
        setStep("home");
      }
      setReady(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load requests. Please try again.",
      );
    }
  }
  useEffect(() => {
    refresh();
    const saved = localStorage.getItem("pilot-active-request");
    if (saved) {
      setActiveId(saved);
      setStep("status");
    }
    const update = () => {
      void refresh();
    };
    window.addEventListener("storage", update);
    window.addEventListener("pilot-update", update);
    const timer = setInterval(update, 4000);
    const channel = db
      ?.channel("pilot-" + view)
      .on("postgres_changes", { event: "*", schema: "public" }, update)
      .subscribe();
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("pilot-update", update);
      clearInterval(timer);
      if (channel) void db?.removeChannel(channel);
    };
  }, [view]);
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : (e as { message?: string })?.message ||
              "Unable to save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const current = data.requests.find((r) => r.id === activeId),
    selected = data.providers.find((p) => p.id === provider),
    received = data.requests.filter((r) => r.provider_id === provider);
  const actualDestination =
    destination === "Other" ? other.trim() : destination;
  const matches = data.providers.filter(
    (p) =>
      p.availability &&
      (p.transport_mode === mode ||
        (mode === "Taxi" && p.transport_mode.includes("Shared"))) &&
      (p.transport_mode !== "Auto" || count <= 3) &&
      (p.transport_mode !== "Taxi" || count <= 4),
  );
  function find(e: FormEvent) {
    e.preventDefault();
    if (when === "Later" && new Date(later) <= new Date()) {
      setError("Please choose a future departure time.");
      return;
    }
    setError("");
    setStep("results");
  }
  const fulfilled = data.requests.filter(
    (r) => r.status === "Fulfilled",
  ).length;
  const reqRows = (rows: Request[]) =>
    rows.length ? (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Time</th>
              <th>Destination</th>
              <th>Mode</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="id">{short(r.id)}</td>
                <td>{time(r.created_at)}</td>
                <td>{r.destination}</td>
                <td>{r.preferred_mode}</td>
                <td>
                  <Badge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="empty">
        No requests yet. Passenger requests will appear here.
      </p>
    );
  return (
    <>
      <div className="topline" />
      <header>
        <div className="header-inner">
          <div className="brand">
            <Image
              className="brand-logo"
              src="/laabh-logo.png"
              width={180}
              height={89}
              alt="LAABH — Local Access And Business Hub, powered by LPAI"
              priority
            />
            <div className="brand-text">
              <strong>LAABH</strong>
              <span>powered by LPAI</span>
              <span className="brand-tagline">
                Your gateway to local services
              </span>
            </div>
          </div>
          <span className="pilot-label">Rupaidiha Land Port</span>
        </div>
      </header>
      {view !== "passenger" && <nav aria-label="Service views">
        <div>
          <Link
            aria-current={view === "passenger" ? "page" : undefined}
            href="/"
          >
            Passenger
          </Link>
          <Link
            aria-current={view === "provider" ? "page" : undefined}
            href="/provider"
          >
            Provider portal
          </Link>
          <Link
            aria-current={view === "admin" ? "page" : undefined}
            href="/admin"
          >
            LPAI dashboard
          </Link>
        </div>
      </nav>}
      <main
        className={
          view === "admin"
            ? "admin"
            : view === "provider"
              ? "provider"
              : "passenger"
        }
      >
        <div className="mode-note">
          <span className="dot" />
          {localMode ? "Device-local session" : "Connected session"}
          <span>Rupaidiha</span>
        </div>
        {localMode && (
          <p className="local-hint">
            Requests are shared between views in this browser.
          </p>
        )}
        {error && (
          <div role="alert" className="error">
            {error}
            <button
              className="text-button"
              onClick={() => {
                setError("");
                refresh();
              }}
            >
              Retry
            </button>
          </div>
        )}
        {!ready ? (
          <div className="panel empty">Loading…</div>
        ) : view === "passenger" ? (
          <>
            {step === "home" && (
              <>
                <div className="section-intro">
                  <p className="eyebrow">PASSENGER SERVICES</p>
                  <h1>Your gateway to local services</h1>
                  <p className="port-name">Rupaidiha Land Port</p>
                </div>
                <div className="services">
                  {[
                    ["Transport", "Find onward local transport"],
                    ["Food", "Local food services"],
                    ["Stay", "Nearby accommodation"],
                    ["Local Products", "Products from local businesses"],
                  ].map(([name, desc]) => (
                    <button
                      key={name}
                      className={
                        "service " + (name === "Transport" ? "enabled" : "")
                      }
                      onClick={() =>
                        name === "Transport"
                          ? setStep("form")
                          : setInfo(info === name ? "" : name)
                      }
                    >
                      <span className="service-icon">
                        <Icon kind={name} />
                      </span>
                      <span className="service-copy">
                        <strong>{name}</strong>
                        <span>{desc}</span>
                        <small>
                          {name === "Transport"
                            ? "Find transport"
                            : "Not available yet"}
                        </small>
                      </span>
                      <span aria-hidden="true">
                        {name === "Transport" ? "→" : "+"}
                      </span>
                    </button>
                  ))}
                </div>
                {info && (
                  <div className="notice" role="status">
                    <strong>{info}</strong>
                    <p>
                      This service is not available yet. Demand and feasibility
                      require further validation.
                    </p>
                    <button className="text-button" onClick={() => setInfo("")}>
                      Close
                    </button>
                  </div>
                )}
                <div className="how">
                  <h2>A simple connection to local services</h2>
                  <ol>
                    <li>
                      <span>1</span>Tell us what you need
                    </li>
                    <li>
                      <span>2</span>Connect with a local provider
                    </li>
                    <li>
                      <span>3</span>Confirm fulfilment
                    </li>
                  </ol>
                </div>
              </>
            )}
            {step === "form" && (
              <>
                <button className="back" onClick={() => setStep("home")}>
                  ← All services
                </button>
                <p className="eyebrow">TRANSPORT · 1 OF 3</p>
                <h1>Where do you need to go?</h1>
                <form className="panel form" onSubmit={find}>
                  <label>
                    Destination
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    >
                      {destinations.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                  {destination === "Other" && (
                    <label>
                      Your destination
                      <input
                        required
                        maxLength={100}
                        value={other}
                        onChange={(e) => setOther(e.target.value)}
                        placeholder="Enter a town or stop"
                      />
                    </label>
                  )}
                  <label>
                    Number of passengers
                    <input
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                    />
                  </label>
                  <fieldset>
                    <legend>Preferred mode</legend>
                    <div className="choices">
                      {["Taxi", "Auto", "Bus"].map((m) => (
                        <label key={m} className={mode === m ? "chosen" : ""}>
                          <input
                            type="radio"
                            name="mode"
                            value={m}
                            checked={mode === m}
                            onChange={() => setMode(m)}
                          />
                          {m}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend>When</legend>
                    <div className="choices">
                      {["Now", "Later"].map((w) => (
                        <label key={w} className={when === w ? "chosen" : ""}>
                          <input
                            type="radio"
                            name="when"
                            checked={when === w}
                            onChange={() => setWhen(w)}
                          />
                          {w}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {when === "Later" && (
                    <label>
                      Departure date and time
                      <input
                        type="datetime-local"
                        required
                        value={later}
                        onChange={(e) => setLater(e.target.value)}
                      />
                    </label>
                  )}
                  <label>
                    Anything we should know?{" "}
                    <span className="muted">(optional)</span>
                    <textarea
                      maxLength={300}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="For example, extra luggage. No personal information."
                      rows={2}
                    />
                  </label>
                  <button className="primary">
                    Find Transport <span>→</span>
                  </button>
                </form>
              </>
            )}
            {step === "results" && (
              <>
                <button className="back" onClick={() => setStep("form")}>
                  ← Edit requirement
                </button>
                <p className="eyebrow">TRANSPORT · 2 OF 3</p>
                <h1>Choose your transport</h1>
                <p className="trip">
                  {actualDestination} · {count} passenger
                  {count !== 1 ? "s" : ""} · {mode} · {when}
                </p>
                {matches.length ? (
                  matches.map((p) => (
                    <article className="panel provider-result" key={p.id}>
                      {p.transport_mode !== 'Auto' && <div className={'vehicle-picture vehicle-' + vehiclePicture(p.id)} role="img" aria-label={providerName(p.name) + ' — illustrative vehicle picture'}><span>Illustrative image</span></div>}
                      <div className="split">
                        <span className="mini-label">Local transport</span>
                        <Verified />
                      </div>
                      <h2>{providerName(p.name)}</h2>
                      <p>
                        {p.transport_mode}
                        {p.transport_mode === "Taxi"
                          ? " · 4 seats"
                          : p.transport_mode === "Auto"
                            ? " · 3 seats"
                            : " · Capacity subject to confirmation"}
                      </p>
                      <p className="fare">
                        Fare: As per applicable fare / provider confirmation
                      </p>
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            const id = await createRequest({
                              destination: actualDestination,
                              passenger_count: count,
                              preferred_mode: mode,
                              requested_for:
                                when === "Now"
                                  ? "Now"
                                  : new Date(later).toISOString(),
                              note,
                              provider_id: p.id,
                            });
                            localStorage.setItem("pilot-active-request", id);
                            setActiveId(id);
                            setStep("status");
                          })
                        }
                      >
                        {busy ? "Sending…" : "Send Request"}
                        <span>→</span>
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="panel empty">
                    <h2>No matching provider</h2>
                    <p>
                      {mode === "Bus"
                        ? "Bus transport is not available yet."
                        : "No available provider matches this mode and passenger count."}
                    </p>
                    <p>
                      No request has been recorded. You can edit your
                      requirement.
                    </p>
                    <button
                      className="secondary"
                      onClick={() => setStep("form")}
                    >
                      Edit requirement
                    </button>
                  </div>
                )}
              </>
            )}
            {step === "status" &&
              (current ? (
                <>
                  <p className="eyebrow">TRANSPORT · 3 OF 3</p>
                  <div className="status-heading">
                    <span className="status-symbol">
                      {current.status === "Fulfilled"
                        ? "✓"
                        : current.status === "Declined"
                          ? "!"
                          : "✓"}
                    </span>
                    <h1>
                      {current.status === "Requested"
                        ? "Request sent"
                        : current.status === "Accepted"
                          ? "Your request is accepted"
                          : current.status === "Fulfilled"
                            ? "Journey fulfilled"
                            : "Request declined"}
                    </h1>
                  </div>
                  <p className="sub" aria-live="polite">
                    {current.status === "Requested"
                      ? "Waiting for provider. This page updates automatically."
                      : current.status === "Accepted"
                        ? "Provider accepted your request."
                        : current.status === "Fulfilled"
                          ? "Thank you for completing your journey."
                          : "The provider could not accept this request. Please try another provider."}
                  </p>
                  <div className="panel">
                    <div className="split">
                      <strong className="id">{short(current.id)}</strong>
                      <Badge status={current.status} />
                    </div>
                    {current.status !== "Declined" && (
                      <ol className="timeline">
                        {["Requested", "Accepted", "Fulfilled"].map((s, i) => (
                          <li
                            key={s}
                            className={
                              ["Requested", "Accepted", "Fulfilled"].indexOf(
                                current.status,
                              ) >= i
                                ? "done"
                                : ""
                            }
                          >
                            <span>{i + 1}</span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    )}
                    <dl>
                      <dt>Destination</dt>
                      <dd>{current.destination}</dd>
                      <dt>Provider</dt>
                      <dd>
                        {providerName(
                          data.providers.find(
                            (p) => p.id === current.provider_id,
                          )?.name,
                        )}
                      </dd>
                      <dt>Mode / passengers</dt>
                      <dd>
                        {current.preferred_mode} / {current.passenger_count}
                      </dd>
                      <dt>Departure</dt>
                      <dd>
                        {current.requested_for === "Now"
                          ? "Now"
                          : time(current.requested_for)}
                      </dd>
                      <dt>Requested</dt>
                      <dd>{time(current.created_at)}</dd>
                    </dl>
                    {current.status === "Accepted" && (
                      <button
                        disabled={busy}
                        className="primary"
                        onClick={() =>
                          run(async () => updateStatus(current.id, "Fulfilled"))
                        }
                      >
                        Mark as fulfilled
                      </button>
                    )}
                  </div>
                  {current.status === "Fulfilled" &&
                    (data.feedback.some((f) => f.request_id === current.id) ? (
                      <div className="notice green" role="status">
                        ✓ Feedback recorded. Thank you.
                      </div>
                    ) : (
                      <form
                        className="panel form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          run(async () =>
                            submitFeedback(
                              current.id,
                              success === "Yes",
                              comment,
                            ),
                          );
                        }}
                      >
                        <h2>Was the service completed successfully?</h2>
                        <div className="choices">
                          {["Yes", "No"].map((s) => (
                            <label
                              key={s}
                              className={success === s ? "chosen" : ""}
                            >
                              <input
                                type="radio"
                                name="success"
                                checked={success === s}
                                onChange={() => setSuccess(s)}
                              />
                              {s}
                            </label>
                          ))}
                        </div>
                        <label>
                          Short feedback{" "}
                          <span className="muted">(optional)</span>
                          <textarea
                            maxLength={300}
                            rows={2}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          />
                        </label>
                        <button disabled={busy} className="primary">
                          Submit Feedback
                        </button>
                      </form>
                    ))}
                  <button
                    className="back"
                    onClick={() => {
                      setStep("home");
                      setActiveId("");
                      setComment("");
                      localStorage.removeItem("pilot-active-request");
                    }}
                  >
                    ← Back to services
                  </button>
                </>
              ) : (
                <div className="panel empty">
                  <p>This request is no longer available.</p>
                    <button onClick={() => {
                      localStorage.removeItem("pilot-active-request");
                      setActiveId("");
                      setStep("home");
                    }}>
                    Back to services
                  </button>
                </div>
              ))}
          </>
        ) : view === "provider" ? (
          <>
            <p className="eyebrow">PROVIDER WORKSPACE</p>
            <h1>Manage your transport requests</h1>
            <div className="panel provider-profile">
              <label>
                Provider
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                >
                  {data.providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {providerName(p.name)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="split">
                <Verified />
                <span className="muted">
                  {selected?.availability ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>
            <h2 className="section-title">Today</h2>
            <div className="metrics three">
              {[
                [
                  "Requests received",
                  received.filter(
                    (r) =>
                      new Date(r.created_at).toDateString() ===
                      new Date().toDateString(),
                  ).length,
                ],
                [
                  "Accepted",
                  received.filter(
                    (r) =>
                      new Date(r.created_at).toDateString() ===
                        new Date().toDateString() &&
                      ["Accepted", "Fulfilled"].includes(r.status),
                  ).length,
                ],
                [
                  "Completed",
                  received.filter(
                    (r) =>
                      r.completed_at &&
                      new Date(r.completed_at).toDateString() ===
                        new Date().toDateString(),
                  ).length,
                ],
              ].map(([label, n]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{n}</strong>
                </div>
              ))}
            </div>
            <h2 className="section-title">
              New requests{" "}
              <span className="count">
                {received.filter((r) => r.status === "Requested").length}
              </span>
            </h2>
            {!received.some((r) => r.status === "Requested") && (
              <div className="panel empty">
                No new requests. Send one from the passenger view to begin.
              </div>
            )}
            {received
              .filter(
                (r) => r.status === "Requested" || r.status === "Accepted",
              )
              .map((r) => (
                <article className="panel request-card" key={r.id}>
                  <div className="split">
                    <span className="id">{short(r.id)}</span>
                    <Badge status={r.status} />
                  </div>
                  <h2>{r.destination}</h2>
                  <p>
                    {r.passenger_count} passenger
                    {r.passenger_count !== 1 ? "s" : ""} · {r.preferred_mode} ·{" "}
                    {r.requested_for === "Now" ? "Now" : time(r.requested_for)}
                  </p>
                  <p className="muted">Requested {time(r.created_at)}</p>
                  {r.note && <p className="notice">{r.note}</p>}
                  <div className="actions">
                    {r.status === "Requested" ? (
                      <>
                        <button
                          disabled={busy}
                          className="primary"
                          onClick={() =>
                            run(async () => updateStatus(r.id, "Accepted"))
                          }
                        >
                          Accept
                        </button>
                        <button
                          disabled={busy}
                          className="secondary"
                          onClick={() =>
                            run(async () => updateStatus(r.id, "Declined"))
                          }
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <button
                        disabled={busy}
                        className="primary"
                        onClick={() =>
                          run(async () => updateStatus(r.id, "Fulfilled"))
                        }
                      >
                        Ride completed
                      </button>
                    )}
                  </div>
                </article>
              ))}
            <h2 className="section-title">Completed & declined</h2>
            {reqRows(
              received.filter((r) =>
                ["Fulfilled", "Declined"].includes(r.status),
              ),
            )}
          </>
        ) : (
          <>
            <div className="split intro-admin">
              <div>
                <p className="eyebrow">LPAI · RUPAIDIHA</p>
                <h1>Demand & fulfilment overview</h1>
              </div>
              <span className="verified">● Updates automatically</span>
            </div>
            <div className="metrics">
              {[
                ["Total requests", data.requests.length],
                ["Transport requests", data.requests.length],
                ["Fulfilled", fulfilled],
                ["Unmet / pending", data.requests.length - fulfilled],
                [
                  "Active providers",
                  data.providers.filter((p) => p.availability).length,
                ],
              ].map(([label, n]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{n}</strong>
                </div>
              ))}
            </div>
            <div className="admin-grid">
              <section className="panel">
                <h2>Demand by destination</h2>
                {data.requests.length ? (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Destination</th>
                          <th>Requests</th>
                          <th>Fulfilled</th>
                          <th>Pending / unmet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(
                          new Set(data.requests.map((r) => r.destination)),
                        ).map((d) => {
                          const rows = data.requests.filter(
                              (r) => r.destination === d,
                            ),
                            f = rows.filter(
                              (r) => r.status === "Fulfilled",
                            ).length;
                          return (
                            <tr key={d}>
                              <td>{d}</td>
                              <td>{rows.length}</td>
                              <td>{f}</td>
                              <td>{rows.length - f}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="empty">
                    Destination demand appears after the first request.
                  </p>
                )}
              </section>
              <section className="panel">
                <h2>Mode demand</h2>
                {["Taxi", "Auto", "Bus"].map((m) => {
                  const n = data.requests.filter(
                    (r) => r.preferred_mode === m,
                  ).length;
                  return (
                    <div className="mode-row" key={m}>
                      <div className="split">
                        <span>{m}</span>
                        <strong>{n}</strong>
                      </div>
                      <div className="bar">
                        <span
                          style={{
                            width:
                              (data.requests.length
                                ? (n / data.requests.length) * 100
                                : 0) + "%",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="fineprint">
                  Counts reflect submitted requests. Searches without a matching
                  provider are not recorded.
                </p>
              </section>
            </div>
            <section className="panel">
              <h2>Recent requests</h2>
              {reqRows(data.requests.slice(0, 20))}
            </section>
            <section className="panel">
              <h2>Local provider activity</h2>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Mode</th>
                      <th>Received</th>
                      <th>Accepted*</th>
                      <th>Completed</th>
                      <th>Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.providers.map((p) => {
                      const rows = data.requests.filter(
                        (r) => r.provider_id === p.id,
                      );
                      return (
                        <tr key={p.id}>
                          <td>
                            {providerName(p.name)}
                            <Verified />
                          </td>
                          <td>{p.transport_mode}</td>
                          <td>{rows.length}</td>
                          <td>
                            {
                              rows.filter((r) =>
                                ["Accepted", "Fulfilled"].includes(r.status),
                              ).length
                            }
                          </td>
                          <td>
                            {
                              rows.filter((r) => r.status === "Fulfilled")
                                .length
                            }
                          </td>
                          <td>
                            <button
                              className={
                                "availability " + (p.availability ? "on" : "")
                              }
                              disabled={busy}
                              aria-label={
                                "Toggle availability for " +
                                providerName(p.name)
                              }
                              aria-pressed={p.availability}
                              onClick={() =>
                                run(async () =>
                                  availability(p.id, !p.availability),
                                )
                              }
                            >
                              {p.availability ? "Available" : "Unavailable"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="fineprint">
                *Accepted includes subsequently completed requests.
              </p>
            </section>
            <section className="panel">
              <h2>Unmet demand</h2>
              <p className="muted">
                Declined and still-unfulfilled requests. Pending requests are
                not confirmed failures.
              </p>
              {reqRows(data.requests.filter((r) => r.status !== "Fulfilled"))}
            </section>
            {data.feedback.length > 0 && (
              <section className="panel">
                <h2>Passenger feedback</h2>
                {data.feedback.map((f) => (
                  <div className="feedback-row" key={f.id}>
                    <strong className="id">{short(f.request_id)}</strong>
                    <span>
                      {f.fulfilled
                        ? "Completed successfully"
                        : "Completion issue reported"}
                    </span>
                    {f.comment && <p>{f.comment}</p>}
                  </div>
                ))}
              </section>
            )}
            <aside className="capture">
              <h2>What this service captures</h2>
              <p>
                Where passengers need to go · Preferred transport mode · When
                demand occurs · Whether a local provider accepted it · Whether
                the requirement was fulfilled
              </p>
              <p className="fineprint">
                Revenue and economic modelling remain under research.
              </p>
            </aside>
          </>
        )}
        <footer>
          <span>LAABH · powered by LPAI</span>
          <span>Research presentation · No live bookings</span>
        </footer>
      </main>
    </>
  );
}

