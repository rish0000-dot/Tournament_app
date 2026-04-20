// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

// Screens
import SplashScreen from '../screens/Auth/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import SetupProfileScreen from '../screens/Auth/SetupProfileScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import TournamentsScreen from '../screens/Tournament/TournamentsScreen';
import TournamentDetailScreen from '../screens/Tournament/TournamentDetailScreen';
import SubmitResultScreen from '../screens/Tournament/SubmitResultScreen';
import WalletScreen from '../screens/Wallet/WalletScreen';
import DepositScreen from '../screens/Wallet/DepositScreen';
import WithdrawScreen from '../screens/Wallet/WithdrawScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import LeaderboardScreen from '../screens/Leaderboard/LeaderboardScreen';
import ClanScreen from '../screens/Clan/ClanScreen';
import NotificationsScreen from '../screens/Profile/NotificationsScreen';
import MissionsScreen from '../screens/Profile/MissionsScreen';
import BountyScreen from '../screens/Home/BountyScreen';
import KYCScreen from '../screens/Profile/KYCScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab bar icon component
const TabIcon = ({ icon, label, focused }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.5 }]}>{icon}</Text>
    <Text style={[styles.tabLabel, { color: focused ? COLORS.primary : COLORS.textDim }]}>
      {label}
    </Text>
    {focused && <View style={styles.tabIndicator} />}
  </View>
);

// Main bottom tab navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }}
    />
    <Tab.Screen
      name="Tournaments"
      component={TournamentsScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🎮" label="Play" focused={focused} /> }}
    />
    <Tab.Screen
      name="Wallet"
      component={WalletScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💰" label="Wallet" focused={focused} /> }}
    />
    <Tab.Screen
      name="Clan"
      component={ClanScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👥" label="Clan" focused={focused} /> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} /> }}
    />
  </Tab.Navigator>
);

// Root navigator
const AppNavigator = () => {
  const { isAuthenticated, needsProfileSetup } = useSelector((state) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.bg } }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            {needsProfileSetup && (
              <Stack.Screen name="SetupProfile" component={SetupProfileScreen} />
            )}
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
            <Stack.Screen name="SubmitResult" component={SubmitResultScreen} />
            <Stack.Screen name="Deposit" component={DepositScreen} />
            <Stack.Screen name="Withdraw" component={WithdrawScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Missions" component={MissionsScreen} />
            <Stack.Screen name="Bounty" component={BountyScreen} />
            <Stack.Screen name="KYC" component={KYCScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.bg2,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabEmoji: { fontSize: 22 },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
});

export default AppNavigator;
