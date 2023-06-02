const axios = require("axios");
require("dotenv").config();

async function getAccessToken() {
  const clientId = process.env.SPOTIFY_ID;
  const clientSecret = process.env.SPOTIFY_SECRET;

  // Encode the client ID and client secret in base64 format
  const encodedCredentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${encodedCredentials}`,
        },
      }
    );

    const { access_token } = response.data;
    return access_token;
  } catch (error) {
    console.error("Error obtaining access token:", error);
    return null;
  }
}

async function getTrackPreview(trackId) {
  // Spotify API URL
  const url = `https://api.spotify.com/v1/tracks/${trackId}`;
  const token = await getAccessToken();
  // You will need to replace 'Bearer ' with your own token.
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const response = await axios.get(url, { headers });
    if (!response.data.preview_url) {
      throw new Error("No track preview available");
    } else {
      return response.data.preview_url;
    }
  } catch (error) {
    console.log("Error getting track preview:", error);
    return null;
  }
}

async function fetchTrackPreview() {
  const trackId = "5SuOikwiRyPMVoIQDJUgSV";
  const trackPreview = await getTrackPreview(trackId);
  console.log(
    "🚀 ~ file: fetchTrack.js:52 ~ fetchTrackPreview ~ trackPreview:",
    trackPreview
  );
}

fetchTrackPreview().catch((error) => {
  if (error) {
    console.log("Error:", error);
  }
});

module.exports = getTrackPreview;
