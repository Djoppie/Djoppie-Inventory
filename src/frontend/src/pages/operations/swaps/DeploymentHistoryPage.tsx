import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';

const DeploymentHistoryPage = () => <Navigate to={ROUTES.OPERATIONS_REPORTS} replace />;

export default DeploymentHistoryPage;
