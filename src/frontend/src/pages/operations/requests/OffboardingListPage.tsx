import { RequestsList } from '../../../components/operations/requests/RequestsList';
import { ROUTES, buildRoute } from '../../../constants/routes';

export default function OffboardingListPage() {
  return (
    <RequestsList
      type="offboarding"
      newPath={ROUTES.REQUEST_OFFBOARDING_NEW}
      detailPath={(id) => buildRoute.offboardingRequestDetail(id)}
      titleKey="requests.offboarding.title"
      subtitleKey="requests.offboarding.subtitle"
      newButtonKey="requests.offboarding.newButton"
    />
  );
}
