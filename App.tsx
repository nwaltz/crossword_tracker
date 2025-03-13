/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import type {PropsWithChildren} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import { fetchCurrentPuzzleInfo } from './getMiniTime';

// Import cookie manager
import { getDefaultCookie, validateCookie, getAllCookies } from './cookieManager';

type Player = {
  id: number;
  name: string;
  score: number;
};

interface AppProps {
  targetDate?: string; // Optional date in YYYY-MM-DD format
}

// Helper functions
function formatTime(seconds: number): string {
  if (!seconds) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getDateFromString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed in JS Date
}

interface LeaderboardType {
  id: string;
  name: string;
  fetchData: (date: Date) => Promise<Player[]>;
}

// Define different leaderboard types
const leaderboardTypes: LeaderboardType[] = [
  {
    id: 'mini',
    name: 'Mini',
    fetchData: async (date: Date) => {
      const allCookies = getAllCookies();
      const playerTimes: Player[] = [];

      for (const [index, cookieData] of allCookies.entries()) {
        try {
          const isValid = await validateCookie(cookieData.cookie);
          if (!isValid) continue;

          const data = await fetchCurrentPuzzleInfo(date, cookieData.cookie);
          if (data) {
            playerTimes.push({
              id: index + 1,
              name: cookieData.userId,
              score: data || 0
            });
          }
        } catch (err) {
          console.log(`Error fetching data for ${cookieData.userId}:`, err);
        }
      }

      // Sort by score (ascending - faster times first)
      return playerTimes.sort((a, b) => a.score - b.score);
    }
  },
  // Add more leaderboard types here
  {
    id: 'daily',
    name: 'Daily',
    fetchData: async (date: Date) => {
      // Placeholder for daily puzzle leaderboard
      return [];
    }
  }
];

function LeaderboardMenu({ 
  selectedType, 
  onSelect,
  isDarkMode 
}: { 
  selectedType: string, 
  onSelect: (type: string) => void,
  isDarkMode: boolean 
}) {
  const backgroundColor = isDarkMode ? Colors.darker : Colors.lighter;
  
  return (
    <View style={[styles.menuContainer, { backgroundColor }]}>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.menuScrollContent}
      >
        {leaderboardTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.menuItem,
              { backgroundColor },
              selectedType === type.id && styles.menuItemSelected
            ]}
            onPress={() => onSelect(type.id)}
          >
            <Text style={[
              styles.menuText,
              selectedType === type.id && styles.menuTextSelected
            ]}>
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function Leaderboard({
  type,
  date,
  isDarkMode
}: {
  type: string,
  date: Date,
  isDarkMode: boolean
}) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      try {
        const leaderboard = leaderboardTypes.find(t => t.id === type);
        if (!leaderboard) {
          throw new Error('Invalid leaderboard type');
        }

        const data = await leaderboard.fetchData(date);
        setPlayers(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [type, date]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: isDarkMode ? Colors.light : Colors.dark }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
      ) : (
        players.map(player => (
          <View key={player.id} style={styles.listItem}>
            <Text style={styles.itemText}>{player.name}</Text>
            <Text style={styles.scoreText}>{formatTime(player.score)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function App({ targetDate }: AppProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [selectedType, setSelectedType] = useState('mini');
  const puzzleDate = targetDate ? getDateFromString(targetDate) : new Date();

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[backgroundStyle, { flex: 1 }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      
      <View style={{
        paddingTop: insets.top + 10,
        backgroundColor: backgroundStyle.backgroundColor
      }}>
        <Text style={{ fontSize: 24, textAlign: 'center' }}>Leaderboard</Text>
        <View style={[styles.separator, { marginTop: 10 }]} />
      </View>

      <View style={styles.separator} />
      <LeaderboardMenu
        selectedType={selectedType}
        onSelect={setSelectedType}
        isDarkMode={isDarkMode}
      />
        
      <ScrollView
        style={[backgroundStyle, { flex: 1 }]}
        contentContainerStyle={{ paddingTop: 20 }}>
        
        <Leaderboard
          type={selectedType}
          date={puzzleDate}
          isDarkMode={isDarkMode}
        />
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  itemText: { 
    fontSize: 16,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  menuContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuScrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  menuItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  menuItemSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  menuText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  menuTextSelected: {
    color: '#ffffff',
  },
});

export default function AppWrapper() {
  // You can specify the date here
  const targetDate = '2024-03-10'; // Format: YYYY-MM-DD
  
  return (
    <SafeAreaProvider>
      <App targetDate={targetDate} />
    </SafeAreaProvider>
  );
}
