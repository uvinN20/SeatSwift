import { Link } from "react-router-dom";
import Picture from "../ui/Picture";
export default function HeroBackdrop() { return <Link to="/search" className="sb-hero__bg" aria-label="Find a bus — explore available routes"><Picture name="hero" priority alt="AI-generated coastal bus travel scene"/><div className="sb-hero__veil"/></Link>; }
