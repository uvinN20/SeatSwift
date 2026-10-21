import Picture from "../../components/ui/Picture";
import { MailOutlined, PhoneOutlined, EnvironmentOutlined, ClockCircleOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { Link } from "react-router-dom";
import { SITE } from "../../config/site";
import { ROUTES } from "../../types/routes";

const ContactPage = () => {
  const { email, phone, address } = SITE.contact;

  return (
    <>
      <section className="sb-contact-hero">
        <div className="sb-container">
          <span className="sb-eyebrow">We’re here to help</span>
          <h1>Let’s make your next<br />trip a little easier.</h1>
          <p>Need help with a booking, payment slip or route? Reach the SeatSwift support team using the sample contact details below.</p>
        </div>
      </section>

      <section className="sb-container sb-contact-layout">
        <div className="sb-contact-cards">
          <a className="sb-contact-card" href={`mailto:${email}`}>
            <span className="sb-contact-card__icon"><MailOutlined /></span>
            <span className="sb-contact-card__label">Email support</span>
            <strong>{email}</strong>
            <span className="sb-contact-card__note">Booking and payment questions</span>
          </a>
          <a className="sb-contact-card" href={`tel:${phone.replace(/\s/g, "")}`}>
            <span className="sb-contact-card__icon"><PhoneOutlined /></span>
            <span className="sb-contact-card__label">Call our demo desk</span>
            <strong>{phone}</strong>
            <span className="sb-contact-card__note">Weekdays · 8:30 am – 5:00 pm</span>
          </a>
          <div className="sb-contact-card">
            <span className="sb-contact-card__icon"><EnvironmentOutlined /></span>
            <span className="sb-contact-card__label">Service area</span>
            <strong>{address}</strong>
            <span className="sb-contact-card__note">Supporting journeys across Sri Lanka</span>
          </div>
          <div className="sb-contact-card sb-contact-card--hours">
            <span className="sb-contact-card__icon"><ClockCircleOutlined /></span>
            <span className="sb-contact-card__label">Support hours</span>
            <strong>Monday – Friday</strong>
            <span className="sb-contact-card__note">8:30 am – 5:00 pm · Sri Lanka time</span>
          </div>
        </div>

        <aside className="sb-contact-help">
          <div className="contact-photo"><Picture name="service" alt="AI illustration of a traveller speaking with a bus ticket agent"/></div>
          <span className="sb-eyebrow">Quick help</span>
          <h2>Already booked?</h2>
          <p>Sign in to review your booking, check its payment status or see the details you’ll need when contacting the operator.</p>
          <Link to={ROUTES.LOGIN}><Button type="primary" size="large" icon={<ArrowRightOutlined />}>Sign in to your account</Button></Link>
          <p className="sb-contact-demo-note">These are example details for the SeatSwift project demo. Replace the sample email, phone and service information with verified operator contacts before a real launch.</p>
        </aside>
      </section>
    </>
  );
};

export default ContactPage;
