import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth";

export default function ProtectedRoute({ roles }) {
	const { user, dbUser, isInitialized } = useAuth();
	const location = useLocation();

	
	if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

	if (Array.isArray(roles) && roles.length > 0) {
		const roleId = Number(dbUser?.id_role);
		if (!roles.includes(roleId)) {
			return <Navigate to="/home" replace />;
		}
	}

	return <Outlet />;
}