import {
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarToggle,
} from "flowbite-react";
import { Link, useLocation } from "react-router-dom";

const AppNavbar = () => {
  const location = useLocation();

  return (
    <div className="w-full">
      <Navbar fluid rounded className="mb-4 w-full">
        <NavbarBrand>
          <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
            Language Tools
          </span>
        </NavbarBrand>
        <NavbarToggle />
        <NavbarCollapse>
          <Link
            to="/"
            className={`px-3 py-2 rounded ${
              location.pathname === "/" ? "bg-blue-500 text-white" : ""
            }`}
          >
            Kanji
          </Link>{" "}
          <Link
            to="/vocab"
            className={`px-3 py-2 rounded ${
              location.pathname === "/vocab" ? "bg-blue-500 text-white" : ""
            }`}
          >
            Vocabulary
          </Link>
        </NavbarCollapse>
      </Navbar>
    </div>
  );
};

export default AppNavbar;
