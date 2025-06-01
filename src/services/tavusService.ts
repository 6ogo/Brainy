import { API_CONFIG } from '../config/api';

interface TavusCache {
  [key: string]: {
    data: any;
    timestamp: number;
  }
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache: TavusCache = {};

const getCached = (key: string) => {
  const cached = cache[key];
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    delete cache[key];
    return null;
  }
  
  return cached.data;
};

const setCached = (key: string, data: any) => {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
};

export const TavusService = {
  async createPersona(personaName: string, defaultReplicaId: string, systemPrompt: string, context: string) {
    const cacheKey = `persona_${personaName}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('https://tavusapi.com/v2/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_CONFIG.TAVUS_API_KEY
        },
        body: JSON.stringify({
          persona_name: personaName,
          default_replica_id: defaultReplicaId,
          system_prompt: systemPrompt,
          context,
          layers: {
            perception: {
              perception_model: 'raven-0',
              ambient_awareness_queries: [
                'Is the user maintaining eye contact and appearing engaged, or do they seem distracted?',
                'Does the user have any books, artifacts, maps, or objects related to US history visible that could be referenced?',
                'Is the user showing signs of confusion or understanding through their facial expressions or body language?',
                'Is the user in an environment that provides context for their interest in history (classroom, museum, home study)?'
              ]
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setCached(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error creating Tavus persona:', error);
      throw error;
    }
  },

  async createVideo(replicaId: string, script: string): Promise<{ url: string }> {
    const cacheKey = `video_${replicaId}_${script}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('https://tavusapi.com/v2/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_CONFIG.TAVUS_API_KEY
        },
        body: JSON.stringify({
          replica_id: replicaId,
          script
        })
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setCached(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error creating Tavus video:', error);
      throw error;
    }
  },

  async getVideo(videoId: string) {
    const cacheKey = `video_status_${videoId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`https://tavusapi.com/v2/videos/${videoId}`, {
        headers: {
          'x-api-key': API_CONFIG.TAVUS_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setCached(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching Tavus video:', error);
      throw error;
    }
  }
};