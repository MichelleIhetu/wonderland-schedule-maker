import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * The standalone full-screen Pomodoro page has been retired.
 * The active-task timer now lives in the in-app schedule view on "/".
 * This route simply forwards there, preserving any incoming state
 * (e.g. vibeCheckResult, schedule) so existing flows keep working.
 */
const Pomodoro = () => {
  const location = useLocation();
  useEffect(() => {
    document.title = "TimeBunny";
  }, []);
  return (
    <Navigate
      to="/"
      replace
      state={{ ...(location.state as object | null), openScheduleView: true }}
    />
  );
};

export default Pomodoro;
