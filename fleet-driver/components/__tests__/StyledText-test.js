import * as React from 'react';
import renderer, { act } from 'react-test-renderer';

import { MonoText } from '../ui/StyledText';

it(`renders correctly`, async () => {
  let component;

  await act(async () => {
    component = renderer.create(<MonoText>Snapshot test!</MonoText>);
  });

  const tree = component.toJSON();

  expect(tree).toMatchSnapshot();

  await act(async () => {
    component.unmount();
  });
});
