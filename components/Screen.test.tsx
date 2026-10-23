import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Screen } from './Screen';

describe('Screen', () => {
  it('shows the title as a header, with subtitle and content', async () => {
    await render(
      <Screen title="Portfolio" subtitle="6 items">
        <Text>Holdings table</Text>
      </Screen>,
    );
    expect(screen.getByRole('header', { name: 'Portfolio' })).toBeTruthy();
    expect(screen.getByText('6 items')).toBeTruthy();
    expect(screen.getByText('Holdings table')).toBeTruthy();
  });

  it('labels unbuilt screens as planned', async () => {
    await render(<Screen title="Trades" planned="Incoming and sent offers." />);
    expect(screen.getByText('Planned')).toBeTruthy();
    expect(screen.getByText('Incoming and sent offers.')).toBeTruthy();
  });
});
