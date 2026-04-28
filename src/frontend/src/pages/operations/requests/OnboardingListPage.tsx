import { RequestsList } from '../../../components/operations/requests/RequestsList';
import { ROUTES, buildRoute } from '../../../constants/routes';

export default function OnboardingListPage() {
  return (
    <RequestsList
      type="onboarding"
      newPath={ROUTES.REQUEST_ONBOARDING_NEW}
      detailPath={(id) => buildRoute.onboardingRequestDetail(id)}
      titleKey="requests.onboarding.title"
      subtitleKey="requests.onboarding.subtitle"
      newButtonKey="requests.onboarding.newButton"
    />
  );
}
