import { useEffect, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import Preloader from "./Preloader";

const RouteChangeLoader = ({ children }) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show loader on navigation (not on initial load)
    if (navigationType !== "POP") {
      setLoading(true);
      // Simulate a delay for demonstration or wait for data fetching here
      const timeout = setTimeout(() => setLoading(false), 700); // adjust as needed
      return () => clearTimeout(timeout);
    } else {
      setLoading(false);
    }
  }, [location, navigationType]);

  return (
    <>
      {loading && <Preloader />}
      {children}
    </>
  );
};

export default RouteChangeLoader;