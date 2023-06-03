const axios = require("axios");
require("dotenv").config();

let accessToken = null; // Variable to store the access token
let tokenExpiration = null; // Variable to store the token expiration time

async function getAccessToken() {
  // If access token is already available and valid, return it
  if (accessToken && !isAccessTokenExpired()) {
    return accessToken;
  }

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

    const { access_token, expires_in } = response.data;
    accessToken = access_token;

    // Set the token expiration time
    const expirationTime = new Date().getTime() + expires_in * 1000;
    tokenExpiration = expirationTime;

    return accessToken;
  } catch (error) {
    console.error("Error obtaining access token:", error);
    return null;
  }
}

function isAccessTokenExpired() {
  return tokenExpiration && new Date().getTime() > tokenExpiration;
}

module.exports = {
  getAccessToken,
  isAccessTokenExpired,
};
