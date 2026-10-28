import RouteLine from "../../components/ui/RouteLine";
import Picture from "../../components/ui/Picture";
import { destinationPhoto } from "../../config/destination-photos";
import { useEffect, useMemo, useState } from "react";
import { Collapse, Skeleton } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import HeroBackdrop from "../../components/home/HeroBackdrop";
import RouteSearchForm, { type SearchValues } from "../../components/search/RouteSearchForm";
import Reveal from "../../components/common/Reveal";
import EmptyState from "../../components/common/EmptyState";
import { getRoutes, getSchedules, type RouteItem, type ScheduleItem } from "../../services/bookingService";
import { errorMessage, formatMoney } from "../../utils/format";
import { todayISO } from "../../utils/dates";
import { ROUTES } from "../../types/routes";

const FAQ = [
  { q: "How do I pay for my seat?", a: "Reserve your seat, make a bank transfer to the operator's account, then upload the slip against your booking. We never take card details on this site." },
  { q: "When is my booking confirmed?", a: "A booking becomes confirmed only after an administrator verifies your payment slip. Until then it shows as awaiting verification." },
  { q: "My slip was rejected. What now?", a: "Open My Bookings to read the reason, then upload a corrected slip. The seat stays held while the booking is unpaid." },
  { q: "Can I cancel or reschedule online?", a: "Not yet. Please contact the operator using the details on the Contact page." },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{ from?: string; to?: string; key: number }>({ key: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [r, s] = await Promise.all([getRoutes(), getSchedules()]);
        setRoutes(r.data.data);
        setSchedules(s.data.data);
      } catch (err) {
        setError(await errorMessage(err, "Could not load routes. Please try again."));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  // Popular routes = routes that really have upcoming priced trips; fare = lowest upcoming fare.
  const popular = useMemo(() => {
    const today = todayISO();
    return routes
      .map((r) => {
        const trips = schedules.filter(
          (s) => s.routeId === r.routeId && s.travelDate >= today && (s.price ?? 0) > 0,
        );
        return {
          route: r,
          trips: trips.length,
          from: trips.length ? Math.min(...trips.map((t) => t.price as number)) : null,
        };
      })
      .filter((p) => p.trips > 0)
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 6);
  }, [routes, schedules]);

  const destinations = useMemo(() => [...new Set(routes.map((r) => r.destination))].slice(0, 8), [routes]);

  const go = (v: SearchValues) =>
    navigate(`${ROUTES.SEARCH}?from=${encodeURIComponent(v.from)}&to=${encodeURIComponent(v.to)}&date=${v.date}`);

  const choose = (patch: { from?: string; to?: string }) => {
    setPrefill((p) => ({ ...patch, key: p.key + 1 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <section className="sb-hero">
        <HeroBackdrop />
        <div className="sb-container sb-hero__content">
          <span className="sb-eyebrow hero-eyebrow"><i/> A SMALL ISLAND. ENDLESS POSSIBILITIES.</span>
          <h1 className="anim-up"><span>The journey</span><br /><em>is yours.</em></h1>
          <p className="sb-hero__lead anim-up" style={{ animationDelay: "120ms" }}>
            From coastal mornings to misty hill-country escapes. Find your bus, choose your seat, and take the scenic way forward.
          </p>
          <div className="hero-search-wrap anim-up" style={{ animationDelay: "240ms" }}><div className="hero-search-caption"><span>YOUR NEXT CHAPTER</span><span>01 — Find your journey</span></div>
            <RouteSearchForm
              key={prefill.key}
              routes={routes}
              routesLoading={loading}
              routesError={error}
              initial={{ from: prefill.from, to: prefill.to }}
              onSearch={go}
            />
          </div>
        </div>
      </section>

      <section className="sb-container photo-stories" aria-label="Journey inspiration">
        <div className="photo-stories-heading"><div><span className="sb-eyebrow">A little inspiration</span><h2>More than a seat.<br/>A whole new view.</h2></div><p>Make room for coastal roads, hill-country windows and the everyday joy of going somewhere.</p></div>
        <div className="photo-story-grid">
          <article><Picture name="auth" alt="AI illustration of a passenger beside a tea-country bus window"/><div><span>TAKE IT ALL IN</span><h3>Your window to somewhere new.</h3></div></article>
          <article><Picture name="network" alt="AI illustration of a coastal Sri Lankan bus station"/><div><span>FIND YOUR NEXT STOP</span><h3>One island. So many journeys.</h3></div></article>
          <article><Picture name="driver" alt="AI illustration of a smiling bus driver"/><div><span>THE PEOPLE OF THE JOURNEY</span><h3>A familiar welcome on the road.</h3></div></article>
        </div><p className="photo-credit">Travel scenes are AI-generated illustrations supplied for this project.</p>
      </section>

      <section className="sb-section">
        <div className="sb-container">
          <Reveal>
            <div className="sb-section__head">
              <span className="sb-eyebrow">Popular routes</span>
              <h2>A change of scenery.</h2>
              <p>Routes with upcoming scheduled trips, with the lowest fare currently offered.</p>
            </div>
          </Reveal>
          {loading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : popular.length === 0 ? (
            <EmptyState title="No upcoming trips yet" description="Scheduled trips will appear here as soon as the operator publishes them." />
          ) : (
            <div className="sb-routes">
              {popular.map((p, i) => (
                <Reveal key={p.route.routeId} delay={i * 60}>
                  <button type="button" className="sb-route-card" onClick={() => choose({ from: p.route.source, to: p.route.destination })}>
                    <span className="sb-route-card__path">
                      {p.route.source} <ArrowRightOutlined aria-hidden="true" /> {p.route.destination}
                    </span>
                    <RouteLine active/>
                    <span className="sb-route-card__meta">
                      <span>{p.trips} upcoming {p.trips === 1 ? "trip" : "trips"}</span>
                      <span className="sb-route-card__fare">from {formatMoney(p.from)}</span>
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="sb-section" style={{ paddingTop: 0 }}>
        <div className="sb-container">
          <Reveal>
            <div className="sb-section__head">
              <span className="sb-eyebrow">Why book here</span>
              <h2>Small details. Better journeys.</h2>
            </div>
          </Reveal>
          <div className="sb-bento">
            <Reveal className="sb-tile sb-tile--navy sb-tile--a">
              <span className="bento-symbol">◉</span><span className="widget-label">YOUR PLACE ON BOARD</span><h3>A window seat?<br/>Make it yours.</h3>
              <p>Every seat map reflects the real bookings for your exact trip, so you only see seats you can actually take.</p>
            </Reveal>
            <Reveal className="sb-tile sb-tile--teal sb-tile--b" delay={80}>
              <span className="bento-symbol">↗</span><h3>Pick your own seat</h3>
              <p>Window, front or back - choose it yourself.</p>
            </Reveal>
            <Reveal className="sb-tile sb-tile--c" delay={120}>
              <span className="bento-symbol">✓</span><h3>Verified payments</h3>
              <p>Pay by bank transfer and follow the verification status of every slip.</p>
            </Reveal>
            <Reveal className="sb-tile sb-tile--d" delay={160}>
              <span className="bento-symbol">▤</span><h3>All trips in one place</h3>
              <p>Upcoming, past and cancelled bookings are kept in My Bookings.</p>
            </Reveal>
            <Reveal className="sb-tile sb-tile--e" delay={200}>
              <span className="bento-symbol">LKR</span><h3>Made for Sri Lanka</h3>
              <p>Fares in LKR and departure times in Sri Lanka time.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="sb-section" style={{ paddingTop: 0 }}>
        <div className="sb-container">
          <Reveal>
            <div className="sb-section__head">
              <span className="sb-eyebrow">How booking works</span>
              <h2>Four steps to your seat</h2>
            </div>
          </Reveal>
          <ol className="sb-how">
            {[
              ["Search", "Choose your cities and travel date."],
              ["Select seats", "Compare trips and pick seats on the live seat map."],
              ["Reserve & pay", "Enter passenger details, transfer the fare and upload your slip."],
              ["Get confirmed", "Once your payment is verified, your booking is confirmed."],
            ].map(([t, d], i) => (
              <Reveal as="li" key={t} delay={i * 70}>
                <h3>{t}</h3><p>{d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {destinations.length > 0 && (
        <section className="sb-section" style={{ paddingTop: 0 }}>
          <div className="sb-container">
            <Reveal>
              <div className="sb-section__head">
                <span className="sb-eyebrow">Destinations</span>
                <h2>Where can we take you?</h2>
              </div>
            </Reveal>
            <div className="sb-dest">
              {destinations.map((d) => (
                <button key={d} type="button" className="sb-dest__tile" onClick={() => choose({ to: d })}>
                  <Picture {...destinationPhoto(d)} sizes="(max-width: 380px) 100vw, (max-width: 1024px) 50vw, 25vw"/><span className="dest-caption"><small>EXPLORE</small>{d}<span aria-hidden="true">↗</span></span>
                </button>
              ))}
            </div>
            <p className="photo-credit">Destination photography: Wikimedia Commons. <a href="/images/destination-credits.html" target="_blank" rel="noreferrer">Photographers &amp; licenses ↗</a></p>
          </div>
        </section>
      )}

      <section className="sb-section" style={{ paddingTop: 0 }}>
        <div className="sb-container">
          <Reveal>
            <div className="sb-section__head">
              <span className="sb-eyebrow">FAQ</span>
              <h2>Good to know</h2>
            </div>
          </Reveal>
          <div style={{ maxWidth: 820 }}>
            <Collapse accordion items={FAQ.map((f, i) => ({ key: String(i), label: f.q, children: <p>{f.a}</p> }))} />
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
