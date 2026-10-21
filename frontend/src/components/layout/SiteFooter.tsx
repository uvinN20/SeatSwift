import { Link } from "react-router-dom";
import Brand from "../common/Brand";
import { SITE } from "../../config/site";
import { ROUTES } from "../../types/routes";

const SiteFooter = () => {
  const { email, phone, address } = SITE.contact;
  const hasContact = !!(email || phone || address);

  return (
    <footer className="sb-footer">
      <div className="sb-container">
        <div className="sb-footer__grid">
          <div>
            <Brand light />
            <p style={{ marginTop: 12, maxWidth: 320 }}>
              {SITE.tagline}. Search trips, pick your seat and track your booking in one place.
            </p>
          </div>
          <div>
            <h4>Travel</h4>
            <ul>
              <li><Link to={ROUTES.SEARCH}>Search buses</Link></li>
              <li><Link to={ROUTES.PASSENGER_BOOKINGS}>My bookings</Link></li>
              <li><Link to={ROUTES.PASSENGER_REGISTER}>Create account</Link></li>
              <li><Link to={ROUTES.LOGIN}>Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link to={ROUTES.ABOUT}>About us</Link></li>
              <li><Link to={ROUTES.CONTACT}>Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            {hasContact ? (
              <ul>
                {email && <li><a href={`mailto:${email}`}>{email}</a></li>}
                {phone && <li><a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></li>}
                {address && <li>{address}</li>}
              </ul>
            ) : (
              <p>Contact details will be published here by the operator.</p>
            )}
          </div>
        </div>
        <div className="sb-footer__bottom">
          © {new Date().getFullYear()} {SITE.name}. Fares are shown in Sri Lankan rupees (LKR).
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
