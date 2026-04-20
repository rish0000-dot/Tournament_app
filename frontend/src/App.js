// App.js — Root Entry Point
import React from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'react-native';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/constants/theme';

const App = () => {
  return (
    <Provider store={store}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <AppNavigator />
    </Provider>
  );
};

export default App;
