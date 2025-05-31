import { API_CONFIG } from '../config/api';

/**
 * Tavus API Service
 * Handles interactions with the Tavus API for creating and managing video replicas
 */
export const TavusService = {
  /**
   * Create a new replica
   * @param replicaName - Name of the replica
   * @param trainVideoUrl - URL of the training video
   * @param callbackUrl - Optional callback URL
   * @returns Promise with the creation response
   */
  createReplica: async (replicaName: string, trainVideoUrl: string, callbackUrl: string = '') => {
    const options = {
      method: 'POST',
      headers: {
        'x-api-key': API_CONFIG.TAVUS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replica_name: replicaName,
        train_video_url: trainVideoUrl,
        callback_url: callbackUrl
      })
    };

    try {
      const response = await fetch('https://tavusapi.com/v2/replicas', options);
      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating Tavus replica:', error);
      throw error;
    }
  },

  /**
   * Get a specific replica by ID
   * @param replicaId - ID of the replica to retrieve
   * @returns Promise with the replica data
   */
  getReplica: async (replicaId: string) => {
    const options = {
      method: 'GET',
      headers: {
        'x-api-key': API_CONFIG.TAVUS_API_KEY
      }
    };

    try {
      const response = await fetch(`https://tavusapi.com/v2/replicas/${replicaId}`, options);
      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Tavus replica:', error);
      throw error;
    }
  },

  /**
   * List all replicas
   * @returns Promise with array of replicas
   */
  listReplicas: async () => {
    const options = {
      method: 'GET',
      headers: {
        'x-api-key': API_CONFIG.TAVUS_API_KEY
      }
    };

    try {
      const response = await fetch('https://tavusapi.com/v2/replicas', options);
      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error listing Tavus replicas:', error);
      throw error;
    }
  },

  /**
   * Create a new video using a replica
   * @param replicaId - ID of the replica to use
   * @param script - Script text for the video
   * @param callbackUrl - Optional callback URL
   * @returns Promise with the video creation response
   */
  createVideo: async (replicaId: string, script: string, callbackUrl: string = '') => {
    const options = {
      method: 'POST',
      headers: {
        'x-api-key': API_CONFIG.TAVUS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replica_id: replicaId,
        script: script,
        callback_url: callbackUrl
      })
    };

    try {
      const response = await fetch('https://tavusapi.com/v2/videos', options);
      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating Tavus video:', error);
      throw error;
    }
  },

  /**
   * Get a specific video by ID
   * @param videoId - ID of the video to retrieve
   * @returns Promise with the video data
   */
  getVideo: async (videoId: string) => {
    const options = {
      method: 'GET',
      headers: {
        'x-api-key': API_CONFIG.TAVUS_API_KEY
      }
    };

    try {
      const response = await fetch(`https://tavusapi.com/v2/videos/${videoId}`, options);
      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Tavus video:', error);
      throw error;
    }
  }
};

export default TavusService;
