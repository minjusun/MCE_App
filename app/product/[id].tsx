import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Screen title="Product" subtitle={id} planned="Market prices by condition and grade, and listings for sale." />;
}
