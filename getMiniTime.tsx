import React, {useEffect, useState} from 'react';
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
} from 'react-native';
import {
  useSafeAreaInsets,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { getDefaultCookie } from './cookieManager';

type Player = {
  id: number;
  name: string;
  score: number;
};

const BASE_URL = 'https://www.nytimes.com/svc/crosswords/v6/puzzle/mini';  // Replace with your base URL
const PUZZLE_URL = 'https://www.nytimes.com/svc/crosswords/v6/game'

async function fetchPlayerTime(id: string, cookie: string): Promise<any> {
  const url = `${PUZZLE_URL}/${id}.json`;
  console.log('Fetching from URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': `NYT-S=${cookie}`,
        'Origin': 'https://www.nytimes.com',
        'Referer': 'https://www.nytimes.com/crosswords/game/mini',
        'Host': 'www.nytimes.com',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();
    console.log('Player time response:', data);
    const calcs = data['calcs'];
    let time_to_solve;
    if (calcs && calcs['solved']) {
      time_to_solve = calcs['secondsSpentSolving'];
    }
    return time_to_solve;
  } catch (error) {
    console.error('Error in fetchPlayerTime:', error);
    throw error;
  }
}

export async function fetchCurrentPuzzleInfo(date: Date = new Date(), cookie: string): Promise<any> {
  try {
    const formattedDate = date.toISOString().split('T')[0];
    const url = `${BASE_URL}/${formattedDate}.json`;
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': `NYT-S=${cookie}`,
        'Origin': 'https://www.nytimes.com',
        'Referer': 'https://www.nytimes.com/crosswords/game/mini',
        'Host': 'www.nytimes.com',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();
    console.log('Puzzle info response:', data);

    if (!data.id) {
      throw new Error('No puzzle ID found in response');
    }

    const time_to_solve = await fetchPlayerTime(data.id.toString(), cookie);
    console.log('Time to solve:', time_to_solve);

    return time_to_solve;

  } catch (error: any) {
    console.error('Error fetching puzzle info:', error);
    Alert.alert('Error', error.message || 'An unknown error occurred');
    return null;
  }
}

