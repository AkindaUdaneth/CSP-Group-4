import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5011/api';

const bracketService = {
  // ==================== TEAMS ====================
  
  /**
   * Get all teams for a tournament
   */
  getTeams: async (tournamentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tournaments/${tournamentId}/bracket/teams`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch teams');
    }
  },

  /**
   * Get specific team by ID
   */
  getTeamById: async (tournamentId, teamId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tournaments/${tournamentId}/bracket/teams/${teamId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch team');
    }
  },

  /**
   * Create new team
   */
  createTeam: async (tournamentId, teamData, token) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/tournaments/${tournamentId}/bracket/teams`,
        teamData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create team');
    }
  },

  /**
   * Update team information
   */
  updateTeam: async (tournamentId, teamId, teamData, token) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/tournaments/${tournamentId}/bracket/teams/${teamId}`,
        teamData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update team');
    }
  },

  /**
   * Delete team
   */
  deleteTeam: async (tournamentId, teamId, token) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/tournaments/${tournamentId}/bracket/teams/${teamId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete team');
    }
  },

  // ==================== MATCHES ====================

  /**
   * Get all matches for tournament
   */
  getMatches: async (tournamentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tournaments/${tournamentId}/bracket/matches`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch matches');
    }
  },

  /**
   * Get regular (non-playoff) matches
   */
  getRegularMatches: async (tournamentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tournaments/${tournamentId}/bracket/matches/regular`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch regular matches');
    }
  },

  /**
   * Get playoff matches only
   */
  getPlayoffMatches: async (tournamentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tournaments/${tournamentId}/bracket/matches/playoff`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch playoff matches');
    }
  },

  /**
   * Get specific match by ID
   */
  getMatchById: async (tournamentId, matchId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tournaments/${tournamentId}/bracket/matches/${matchId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch match');
    }
  },

  /**
   * Create single match
   */
  createMatch: async (tournamentId, matchData, token) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/tournaments/${tournamentId}/bracket/matches`,
        matchData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create match');
    }
  },

  /**
   * Create multiple matches at once (batch)
   */
  createMatchesBatch: async (tournamentId, matchesData, token) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/tournaments/${tournamentId}/bracket/matches/batch`,
        matchesData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create matches');
    }
  },

  /**
   * Update match result (set winner)
   */
  updateMatch: async (tournamentId, matchId, matchData, token) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/tournaments/${tournamentId}/bracket/matches/${matchId}`,
        matchData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update match');
    }
  },

  /**
   * Delete specific match
   */
  deleteMatch: async (tournamentId, matchId, token) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/tournaments/${tournamentId}/bracket/matches/${matchId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete match');
    }
  },

  // ==================== BRACKET MANAGEMENT ====================

  /**
   * Delete entire bracket (teams and matches)
   */
  deleteBracket: async (tournamentId, token) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/tournaments/${tournamentId}/bracket`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete bracket');
    }
  },

  /**
   * Get calculated standings
   */
  getStandings: async (tournamentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tournaments/${tournamentId}/bracket/standings`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch standings');
    }
  }
};

export default bracketService;
