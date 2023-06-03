const { getAccessToken, isAccessTokenExpired } = require("./spotify");
const axios = require("axios");
require("dotenv").config();

async function getPlaylistTracks(playlist_id) {
  const url = `https://api.spotify.com/v1/playlists/${playlist_id}`;
  const token = await getAccessToken();

  // You will need to replace 'Bearer ' with your own token.
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const response = await axios.get(url, { headers });
    if (!response.data) {
      throw new Error("No track preview available");
    } else {
      return response.data;
    }
  } catch (error) {
    console.log("Error getting track preview:", error);
    return null;
  }
}

async function getPlayListByCountry(country, locale) {
  const url = `https://api.spotify.com/v1/browse/featured-playlists/?country=${country}&locale=${locale}`;
  const token = await getAccessToken();

  // You will need to replace 'Bearer ' with your own token.
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.log("Playlist Fetching Error:", error);
    return null;
  }
}

module.exports = {
  getPlaylistTracks,
  getPlayListByCountry,
};
