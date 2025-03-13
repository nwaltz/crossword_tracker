import cookiesData from './cookies.json';

interface Cookie {
  userId: string;
  cookie: string;
  dateAdded: string;
}

interface CookiesData {
  cookies: Cookie[];
}

export function getCookieByUserId(userId: string): string | null {
  const cookie = cookiesData.cookies.find(c => c.userId === userId);
  return cookie ? cookie.cookie : null;
}

export function getAllCookies(): Cookie[] {
  return cookiesData.cookies;
}

export function getDefaultCookie(): string {
  return cookiesData.cookies[0].cookie;
}

// Function to validate a cookie is working
export async function validateCookie(cookie: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`https://www.nytimes.com/svc/crosswords/v6/puzzle/mini/${today}.json`, {
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
    return response.ok;
  } catch (error) {
    return false;
  }
} 