import Picture from "../../components/ui/Picture";
import { Link } from "react-router-dom";
import { Button } from "antd";
import { ArrowRightOutlined, CompassOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { SITE } from "../../config/site";
import { ROUTES } from "../../types/routes";

const VALUES = [
  {
    icon: <CompassOutlined />,
    title: "Made for the journey",
    copy: "Find intercity connections across Sri Lanka and compare the details before you travel.",
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: "Clear booking status",
    copy: "See your selected seats, payment review and booking updates together in one place.",
  },
  {
    icon: <ThunderboltOutlined />,
    title: "Simple by design",
    copy: "A calm, straightforward booking flow helps you get from route search to seat selection with less friction.",
  },
];

const AboutPage = () => (
  <>
    <section className="sb-about-hero">
      <div className="sb-container sb-about-hero__inner">
        <span className="sb-eyebrow">A little about us</span>
        <h1>Good journeys begin<br />with a simpler plan.</h1>
        <p>{SITE.name} is a Sri Lanka-focused bus booking project built to make planning an intercity trip feel clear, comfortable and personal.</p>
        <Link to={ROUTES.SEARCH}><Button type="primary" size="large" icon={<ArrowRightOutlined />}>Explore routes</Button></Link>
      </div>
      <div className="sb-about-orb sb-about-orb--one" aria-hidden="true" />
      <div className="sb-about-orb sb-about-orb--two" aria-hidden="true" />
    </section>

    <section className="sb-container about-photo"><Picture name="driver" alt="AI illustration of a welcoming Sri Lankan bus driver"/><div><span className="sb-eyebrow">Everyday journeys, thoughtfully planned</span><h2>Inspired by the people who keep us moving.</h2><p>From the first bus of the morning to a weekend escape, we want planning your next journey to feel simple.</p><small>AI-generated travel illustration · not an operator or staff photograph</small></div></section>

    <section className="sb-container sb-about-story">
      <div>
        <span className="sb-eyebrow">Our idea</span>
        <h2>Travel planning, without the guesswork.</h2>
      </div>
      <div className="sb-about-story__copy">
        <p>Finding the right trip should not mean jumping between scattered schedules and uncertain seat availability. SeatSwift brings route search, trip details, seat selection and booking updates into one easy-to-follow experience.</p>
        <p>This project is designed around familiar journeys between Sri Lankan cities. Sample routes and fares may be used while the system is being demonstrated; operators should confirm live schedules and prices before accepting real bookings.</p>
      </div>
    </section>

    <section className="sb-container sb-about-values">
      <div className="sb-section__head">
        <span className="sb-eyebrow">What matters to us</span>
        <h2>Thoughtful at every step.</h2>
      </div>
      <div className="sb-about-values__grid">
        {VALUES.map((value, i) => (
          <article className="sb-about-value" key={value.title}>
            <span className="sb-about-value__icon" aria-hidden="true">{value.icon}</span>
            <span className="sb-about-value__number">0{i + 1}</span>
            <h3>{value.title}</h3>
            <p>{value.copy}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="sb-container sb-about-cta">
      <div><span className="sb-eyebrow">Ready when you are</span><h2>Where would you like to go?</h2></div>
      <Link to={ROUTES.SEARCH}><Button size="large" type="primary" icon={<ArrowRightOutlined />}>Find a bus</Button></Link>
    </section>
  </>
);

export default AboutPage;
