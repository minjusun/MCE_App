import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';

export default function CollectorScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  return <Screen title={`@${handle}`} planned="Public binder, wishlist and trade history with you." />;
}
