// Redirect to Home - this page is not used directly
import { Navigate } from "react-router-dom";
export default function Index() {
  return <Navigate to="/" replace />;
}
