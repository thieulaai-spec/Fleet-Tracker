import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

describe('Smoke Test', () => {
  it('should render a basic native element', () => {
    render(
      <View>
        <Text>Hello Driver</Text>
      </View>
    );
    expect(screen.getByText('Hello Driver')).toBeTruthy();
  });
});
