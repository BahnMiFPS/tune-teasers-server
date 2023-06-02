const getAccessToken = require("./spotify");
const axios = require("axios");
require("dotenv").config();
async function getPlaylistTracks(playlist_id) {
  // Spotify API URL
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
// getPlaylistTracks("37i9dQZEVXbLdGSmz6xilI")
//   .then((res) => {
//     console.log(res);
//   })
//   .catch((error) => {
//     if (error) {
//       console.log("Error:", error);
//     }
//   });

module.exports = getPlaylistTracks;
